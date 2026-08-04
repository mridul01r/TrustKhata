package com.retailerp.backend.modules.inventory.service;

import com.retailerp.backend.modules.inventory.dto.ClearInventoryResponse;
import com.retailerp.backend.modules.inventory.entity.Category;
import com.retailerp.backend.modules.inventory.entity.Product;
import com.retailerp.backend.modules.inventory.repository.CategoryRepository;
import com.retailerp.backend.modules.inventory.repository.ProductRepository;
import com.retailerp.backend.modules.pos.repository.SaleItemRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class InventoryResetService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final SaleItemRepository saleItemRepository;

    public InventoryResetService(
            ProductRepository productRepository,
            CategoryRepository categoryRepository,
            SaleItemRepository saleItemRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.saleItemRepository = saleItemRepository;
    }

    /**
     * Clears all products and categories for a tenant - a "start fresh" reset,
     * typically used before a bulk re-import. Products with sales history are
     * deactivated rather than deleted (deleting them would corrupt historical
     * invoices). Categories are deleted only once they have zero products left
     * after this pass; a category still holding a deactivated product is
     * deactivated instead, for the same reason CategoryService.delete() blocks
     * on non-empty categories elsewhere in the app.
     */
    @Transactional
    public ClearInventoryResponse clearAll(UUID tenantId) {
        List<Product> products = productRepository.findByTenantId(tenantId);

        int productsDeleted = 0;
        int productsDeactivated = 0;

        for (Product product : products) {
            if (saleItemRepository.existsByProductId(product.getId())) {
                if (product.isActive()) {
                    product.setActive(false);
                    productRepository.save(product);
                }
                productsDeactivated++;
            } else {
                productRepository.delete(product);
                productsDeleted++;
            }
        }

        List<Category> categories = categoryRepository.findByTenantId(tenantId);

        int categoriesDeleted = 0;
        int categoriesDeactivated = 0;

        for (Category category : categories) {
            long remainingProducts = productRepository.countByTenantIdAndCategoryId(tenantId, category.getId());
            if (remainingProducts == 0) {
                categoryRepository.delete(category);
                categoriesDeleted++;
            } else {
                if (category.isActive()) {
                    category.setActive(false);
                    categoryRepository.save(category);
                }
                categoriesDeactivated++;
            }
        }

        return new ClearInventoryResponse(productsDeleted, productsDeactivated, categoriesDeleted, categoriesDeactivated);
    }
}