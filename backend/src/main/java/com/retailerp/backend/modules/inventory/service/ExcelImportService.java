package com.retailerp.backend.modules.inventory.service;

import com.retailerp.backend.modules.inventory.dto.ImportRowResult;
import com.retailerp.backend.modules.inventory.dto.ImportSummaryResponse;
import com.retailerp.backend.modules.inventory.entity.Category;
import com.retailerp.backend.modules.inventory.entity.Product;
import com.retailerp.backend.modules.inventory.repository.CategoryRepository;
import com.retailerp.backend.modules.inventory.repository.ProductRepository;
import org.apache.poi.ss.usermodel.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.util.*;

@Service
public class ExcelImportService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    public ExcelImportService(CategoryRepository categoryRepository, ProductRepository productRepository) {
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
    }

    /**
     * Parses the file and reports what WOULD happen, without touching the database.
     */
    public ImportSummaryResponse preview(UUID tenantId, MultipartFile file) {
        List<RawRow> rawRows = parseRows(file);

        Set<String> existingCategoryNames = lowerNames(categoryRepository.findByTenantId(tenantId).stream().map(Category::getName).toList());
        Set<String> seenNewCategoriesThisFile = new HashSet<>();

        Map<String, Product> existingProductsByName = new HashMap<>();
        productRepository.findByTenantId(tenantId).forEach(p -> existingProductsByName.put(p.getName().toLowerCase(), p));

        List<ImportRowResult> results = new ArrayList<>();

        for (RawRow raw : rawRows) {
            ImportRowResult result = new ImportRowResult();
            result.setRowNumber(raw.rowNumber);
            result.setCategoryName(raw.categoryName);
            result.setProductName(raw.productName);
            result.setPrice(raw.price);
            result.setQuantity(raw.quantityProvided ? raw.quantity : null);
            result.setGstRate(raw.gstRateProvided ? raw.gstRate : null);
            result.setPurchasePrice(raw.purchasePriceProvided ? raw.purchasePrice : null);

            if (raw.error != null) {
                result.setProductAction(ImportRowResult.Action.ERROR);
                result.setErrorMessage(raw.error);
                results.add(result);
                continue;
            }

            String categoryKey = raw.categoryName.toLowerCase();
            boolean categoryIsNew = !existingCategoryNames.contains(categoryKey);
            result.setCategoryIsNew(categoryIsNew);
            if (categoryIsNew) {
                seenNewCategoriesThisFile.add(categoryKey);
            }

            Product existing = existingProductsByName.get(raw.productName.toLowerCase());
            result.setProductAction(existing != null ? ImportRowResult.Action.UPDATE : ImportRowResult.Action.CREATE);

            results.add(result);
        }

        return new ImportSummaryResponse(results);
    }

    /**
     * Re-parses the file and actually commits categories/products in one transaction.
     */
    @Transactional
    public ImportSummaryResponse commit(UUID tenantId, MultipartFile file) {
        List<RawRow> rawRows = parseRows(file);

        Map<String, Category> categoryCache = new HashMap<>();
        categoryRepository.findByTenantId(tenantId).forEach(c -> categoryCache.put(c.getName().toLowerCase(), c));

        Map<String, Product> productCache = new HashMap<>();
        productRepository.findByTenantId(tenantId).forEach(p -> productCache.put(p.getName().toLowerCase(), p));

        List<ImportRowResult> results = new ArrayList<>();

        for (RawRow raw : rawRows) {
            ImportRowResult result = new ImportRowResult();
            result.setRowNumber(raw.rowNumber);
            result.setCategoryName(raw.categoryName);
            result.setProductName(raw.productName);
            result.setPrice(raw.price);
            result.setQuantity(raw.quantityProvided ? raw.quantity : null);
            result.setGstRate(raw.gstRateProvided ? raw.gstRate : null);
            result.setPurchasePrice(raw.purchasePriceProvided ? raw.purchasePrice : null);

            if (raw.error != null) {
                result.setProductAction(ImportRowResult.Action.ERROR);
                result.setErrorMessage(raw.error);
                results.add(result);
                continue;
            }

            String categoryKey = raw.categoryName.toLowerCase();
            Category category = categoryCache.get(categoryKey);
            boolean categoryIsNew = category == null;
            if (categoryIsNew) {
                category = new Category();
                category.setTenantId(tenantId);
                category.setName(raw.categoryName);
                category = categoryRepository.save(category);
                categoryCache.put(categoryKey, category);
            } else if (!category.isActive()) {
                // A category being reused by this import is, by definition, back in
                // active use - e.g. it was left Inactive by a previous "Clear all"
                // that deactivated it (because it still had products with sales
                // history), and this import is now assigning fresh products to it.
                category.setActive(true);
                category = categoryRepository.save(category);
                categoryCache.put(categoryKey, category);
            }
            result.setCategoryIsNew(categoryIsNew);

            String productKey = raw.productName.toLowerCase();
            Product product = productCache.get(productKey);
            if (product == null) {
                product = new Product();
                product.setTenantId(tenantId);
                product.setName(raw.productName);
                product.setSku(generateSku(tenantId, raw.productName));
                result.setProductAction(ImportRowResult.Action.CREATE);
            } else {
                if (!product.isActive()) {
                    // Same reasoning as the category case above: re-importing a
                    // product that was previously deactivated means it's back in use.
                    product.setActive(true);
                }
                result.setProductAction(ImportRowResult.Action.UPDATE);
            }

            product.setCategory(category);
            product.setSellingPrice(raw.price);

            if (raw.quantityProvided) {
                product.setStockQuantity(raw.quantity);
            }

            // GST Rate is an optional 5th column, same treatment as Quantity: if the
            // file doesn't specify it, a new product keeps the entity default (0%)
            // and an existing product keeps whatever rate it already had - re-import
            // never silently zeroes out a GST rate someone set by hand earlier.
            if (raw.gstRateProvided) {
                product.setGstRate(raw.gstRate);
            }

            // Purchase Price is an optional 6th column - same non-destructive rule.
            // Without a real cost, margin reports treat COGS as 0, which silently
            // shows every imported product at 100% margin. Blank column = "don't
            // touch": a new product keeps the entity default (0) and an existing
            // product keeps whatever cost was already entered by hand.
            if (raw.purchasePriceProvided) {
                product.setPurchasePrice(raw.purchasePrice);
            }

            product = productRepository.save(product);
            productCache.put(productKey, product);

            results.add(result);
        }

        return new ImportSummaryResponse(results);
    }

    private String generateSku(UUID tenantId, String productName) {
        String base = productName.toUpperCase()
                .replaceAll("[^A-Z0-9]+", "-")
                .replaceAll("^-|-$", "");
        if (base.length() > 30) {
            base = base.substring(0, 30);
        }
        if (base.isBlank()) {
            base = "ITEM";
        }

        String candidate = base;
        int suffix = 1;
        while (productRepository.existsByTenantIdAndSkuIgnoreCase(tenantId, candidate)) {
            suffix++;
            candidate = base + "-" + suffix;
        }
        return candidate;
    }

    private Set<String> lowerNames(List<String> names) {
        Set<String> set = new HashSet<>();
        for (String n : names) {
            set.add(n.toLowerCase());
        }
        return set;
    }

    private List<RawRow> parseRows(MultipartFile file) {
        List<RawRow> rows = new ArrayList<>();

        try (InputStream is = file.getInputStream(); Workbook workbook = WorkbookFactory.create(is)) {
            Sheet sheet = workbook.getSheetAt(0);
            DataFormatter formatter = new DataFormatter();

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null || isRowBlank(row, formatter)) {
                    continue;
                }

                int excelRowNumber = i + 1;
                String categoryName = formatter.formatCellValue(row.getCell(0)).trim();
                String productName = formatter.formatCellValue(row.getCell(1)).trim();
                String priceRaw = formatter.formatCellValue(row.getCell(2)).trim();
                // Quantity is an optional 4th column - files from businesses that don't
                // track stock (cafes, restaurants) simply won't have it, and that's fine.
                String quantityRaw = formatter.formatCellValue(row.getCell(3)).trim();
                // GST Rate is an optional 5th column - same reasoning: not every
                // catalog needs a per-product rate set via import.
                String gstRateRaw = formatter.formatCellValue(row.getCell(4)).trim();
                // Purchase Price is an optional 6th column - lets a bulk import set
                // real COGS instead of leaving every new product at the entity's
                // 0 default, which otherwise makes margin reports meaningless.
                String purchasePriceRaw = formatter.formatCellValue(row.getCell(5)).trim();

                RawRow raw = new RawRow();
                raw.rowNumber = excelRowNumber;
                raw.categoryName = categoryName;
                raw.productName = productName;

                if (categoryName.isBlank() || productName.isBlank()) {
                    raw.error = "Category and product name are required";
                } else {
                    try {
                        raw.price = new BigDecimal(priceRaw.replaceAll("[^0-9.]", ""));
                        if (raw.price.compareTo(BigDecimal.ZERO) < 0) {
                            raw.error = "Price cannot be negative";
                        }
                    } catch (NumberFormatException e) {
                        raw.error = "Invalid price: '" + priceRaw + "'";
                    }
                }

                if (raw.error == null && !quantityRaw.isBlank()) {
                    try {
                        raw.quantity = new BigDecimal(quantityRaw.replaceAll("[^0-9.]", ""));
                        if (raw.quantity.compareTo(BigDecimal.ZERO) < 0) {
                            raw.error = "Quantity cannot be negative";
                        } else {
                            raw.quantityProvided = true;
                        }
                    } catch (NumberFormatException e) {
                        raw.error = "Invalid quantity: '" + quantityRaw + "'";
                    }
                }

                if (raw.error == null && !gstRateRaw.isBlank()) {
                    try {
                        raw.gstRate = new BigDecimal(gstRateRaw.replaceAll("[^0-9.]", ""));
                        if (raw.gstRate.compareTo(BigDecimal.ZERO) < 0) {
                            raw.error = "GST rate cannot be negative";
                        } else if (raw.gstRate.compareTo(BigDecimal.valueOf(100)) > 0) {
                            raw.error = "GST rate cannot exceed 100%: '" + gstRateRaw + "'";
                        } else {
                            raw.gstRateProvided = true;
                        }
                    } catch (NumberFormatException e) {
                        raw.error = "Invalid GST rate: '" + gstRateRaw + "'";
                    }
                }

                if (raw.error == null && !purchasePriceRaw.isBlank()) {
                    try {
                        raw.purchasePrice = new BigDecimal(purchasePriceRaw.replaceAll("[^0-9.]", ""));
                        if (raw.purchasePrice.compareTo(BigDecimal.ZERO) < 0) {
                            raw.error = "Purchase price cannot be negative";
                        } else {
                            raw.purchasePriceProvided = true;
                        }
                    } catch (NumberFormatException e) {
                        raw.error = "Invalid purchase price: '" + purchasePriceRaw + "'";
                    }
                }

                rows.add(raw);
            }
        } catch (IOException e) {
            throw new RuntimeException("Could not read the uploaded file. Make sure it's a valid .xlsx file.", e);
        }

        return rows;
    }

    private boolean isRowBlank(Row row, DataFormatter formatter) {
        for (int c = 0; c < 3; c++) {
            if (!formatter.formatCellValue(row.getCell(c)).isBlank()) {
                return false;
            }
        }
        return true;
    }

    private static class RawRow {
        int rowNumber;
        String categoryName;
        String productName;
        BigDecimal price;
        BigDecimal quantity;
        boolean quantityProvided;
        BigDecimal gstRate;
        boolean gstRateProvided;
        BigDecimal purchasePrice;
        boolean purchasePriceProvided;
        String error;
    }
}