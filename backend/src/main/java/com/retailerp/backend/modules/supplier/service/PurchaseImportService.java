package com.retailerp.backend.modules.supplier.service;

import com.retailerp.backend.modules.inventory.entity.Category;
import com.retailerp.backend.modules.inventory.entity.Product;
import com.retailerp.backend.modules.inventory.repository.CategoryRepository;
import com.retailerp.backend.modules.inventory.repository.ProductRepository;
import com.retailerp.backend.modules.supplier.dto.PurchaseImportRowResult;
import com.retailerp.backend.modules.supplier.dto.PurchaseImportSummaryResponse;
import org.apache.poi.ss.usermodel.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.util.*;

/**
 * Bulk-import for the Purchases line-items table: Product Name, Quantity, Cost,
 * and an optional Category. Matches existing products by name (case-insensitive,
 * same convention as ExcelImportService); unmatched names get auto-created using
 * the row's category and cost. Does NOT create the Purchase itself - the caller
 * (frontend) drops the resolved rows into the purchase form's line items, and the
 * user still reviews Supplier/Date/Reference and saves the purchase as normal.
 */
@Service
public class PurchaseImportService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    public PurchaseImportService(CategoryRepository categoryRepository, ProductRepository productRepository) {
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
    }

    /**
     * Parses the file and reports what WOULD happen, without touching the database.
     */
    public PurchaseImportSummaryResponse preview(UUID tenantId, MultipartFile file) {
        List<RawRow> rawRows = parseRows(file);

        Map<String, Product> existingProductsByName = new HashMap<>();
        productRepository.findByTenantId(tenantId).forEach(p -> existingProductsByName.put(p.getName().toLowerCase(), p));

        List<PurchaseImportRowResult> results = new ArrayList<>();

        for (RawRow raw : rawRows) {
            PurchaseImportRowResult result = toBaseResult(raw);

            if (raw.error != null) {
                results.add(result);
                continue;
            }

            Product existing = existingProductsByName.get(raw.productName.toLowerCase());
            if (existing != null) {
                result.setAction(PurchaseImportRowResult.Action.MATCH_EXISTING);
                result.setProductId(existing.getId());
            } else if (raw.categoryName == null) {
                result.setAction(PurchaseImportRowResult.Action.ERROR);
                result.setErrorMessage("Category is required to create new product '" + raw.productName + "'");
            } else {
                result.setAction(PurchaseImportRowResult.Action.CREATE_NEW);
            }

            results.add(result);
        }

        return new PurchaseImportSummaryResponse(results);
    }

    /**
     * Re-parses the file, creates any missing products (category + unit cost from
     * the file, used as both purchasePrice and a starting sellingPrice so it's
     * never left at a hard 0), and returns every row resolved to a real productId -
     * ready for the frontend to drop straight into the purchase's line-items table.
     */
    @Transactional
    public PurchaseImportSummaryResponse commit(UUID tenantId, MultipartFile file) {
        List<RawRow> rawRows = parseRows(file);

        Map<String, Category> categoryCache = new HashMap<>();
        categoryRepository.findByTenantId(tenantId).forEach(c -> categoryCache.put(c.getName().toLowerCase(), c));

        Map<String, Product> productCache = new HashMap<>();
        productRepository.findByTenantId(tenantId).forEach(p -> productCache.put(p.getName().toLowerCase(), p));

        List<PurchaseImportRowResult> results = new ArrayList<>();

        for (RawRow raw : rawRows) {
            PurchaseImportRowResult result = toBaseResult(raw);

            if (raw.error != null) {
                results.add(result);
                continue;
            }

            String productKey = raw.productName.toLowerCase();
            Product product = productCache.get(productKey);

            if (product != null) {
                result.setAction(PurchaseImportRowResult.Action.MATCH_EXISTING);
                result.setProductId(product.getId());
                results.add(result);
                continue;
            }

            if (raw.categoryName == null) {
                result.setAction(PurchaseImportRowResult.Action.ERROR);
                result.setErrorMessage("Category is required to create new product '" + raw.productName + "'");
                results.add(result);
                continue;
            }

            String categoryKey = raw.categoryName.toLowerCase();
            Category category = categoryCache.get(categoryKey);
            if (category == null) {
                category = new Category();
                category.setTenantId(tenantId);
                category.setName(raw.categoryName);
                category = categoryRepository.save(category);
                categoryCache.put(categoryKey, category);
            } else if (!category.isActive()) {
                // Reused by this import => back in active use (e.g. left Inactive by
                // a prior "Clear all" that only deactivated it because it still had
                // products with sales history) - same reasoning as ExcelImportService.
                category.setActive(true);
                category = categoryRepository.save(category);
                categoryCache.put(categoryKey, category);
            }

            Product newProduct = new Product();
            newProduct.setTenantId(tenantId);
            newProduct.setName(raw.productName);
            newProduct.setSku(generateSku(tenantId, raw.productName));
            newProduct.setCategory(category);
            newProduct.setUnit("PCS");
            newProduct.setGstRate(BigDecimal.ZERO);
            newProduct.setPurchasePrice(raw.unitCost);
            // Starting selling price defaults to unit cost rather than 0, so a
            // newly-imported product never silently shows as free/100%-margin
            // until the owner sets a real markup on the Products page.
            newProduct.setSellingPrice(raw.unitCost);
            newProduct.setStockQuantity(BigDecimal.ZERO);
            newProduct.setReorderLevel(BigDecimal.ZERO);

            newProduct = productRepository.save(newProduct);
            productCache.put(productKey, newProduct);

            result.setAction(PurchaseImportRowResult.Action.CREATE_NEW);
            result.setProductId(newProduct.getId());
            results.add(result);
        }

        return new PurchaseImportSummaryResponse(results);
    }

    private PurchaseImportRowResult toBaseResult(RawRow raw) {
        PurchaseImportRowResult result = new PurchaseImportRowResult();
        result.setRowNumber(raw.rowNumber);
        result.setProductName(raw.productName);
        result.setCategoryName(raw.categoryName);
        result.setQuantity(raw.quantity);
        result.setUnitCost(raw.unitCost);
        if (raw.error != null) {
            result.setAction(PurchaseImportRowResult.Action.ERROR);
            result.setErrorMessage(raw.error);
        }
        return result;
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
                String productName = formatter.formatCellValue(row.getCell(0)).trim();
                String quantityRaw = formatter.formatCellValue(row.getCell(1)).trim();
                String costRaw = formatter.formatCellValue(row.getCell(2)).trim();
                // Category is an optional 4th column - only needed when the product
                // doesn't already exist and has to be created on the fly.
                String categoryRaw = formatter.formatCellValue(row.getCell(3)).trim();

                RawRow raw = new RawRow();
                raw.rowNumber = excelRowNumber;
                raw.productName = productName;
                raw.categoryName = categoryRaw.isBlank() ? null : categoryRaw;

                if (productName.isBlank()) {
                    raw.error = "Product name is required";
                } else {
                    try {
                        raw.quantity = new BigDecimal(quantityRaw.replaceAll("[^0-9.]", ""));
                        if (raw.quantity.compareTo(BigDecimal.ZERO) <= 0) {
                            raw.error = "Quantity must be greater than 0";
                        }
                    } catch (NumberFormatException e) {
                        raw.error = "Invalid quantity: '" + quantityRaw + "'";
                    }
                }

                if (raw.error == null) {
                    try {
                        raw.unitCost = new BigDecimal(costRaw.replaceAll("[^0-9.]", ""));
                        if (raw.unitCost.compareTo(BigDecimal.ZERO) <= 0) {
                            raw.error = "Cost must be greater than 0";
                        }
                    } catch (NumberFormatException e) {
                        raw.error = "Invalid cost: '" + costRaw + "'";
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
        String productName;
        String categoryName;
        BigDecimal quantity;
        BigDecimal unitCost;
        String error;
    }
}