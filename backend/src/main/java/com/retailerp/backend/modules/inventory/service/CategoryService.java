package com.retailerp.backend.modules.inventory.service;

import com.retailerp.backend.modules.inventory.dto.CategoryRequest;
import com.retailerp.backend.modules.inventory.dto.CategoryResponse;
import com.retailerp.backend.modules.inventory.entity.Category;
import com.retailerp.backend.modules.inventory.entity.Product;
import com.retailerp.backend.modules.inventory.exception.CategoryInUseException;
import com.retailerp.backend.modules.inventory.exception.CategoryNotFoundException;
import com.retailerp.backend.modules.inventory.exception.DuplicateCategoryNameException;
import com.retailerp.backend.modules.inventory.repository.CategoryRepository;
import com.retailerp.backend.modules.inventory.repository.ProductRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    public CategoryService(CategoryRepository categoryRepository, ProductRepository productRepository) {
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
    }

    public List<CategoryResponse> getAllForTenant(UUID tenantId) {
        return categoryRepository.findByTenantId(tenantId).stream()
                .map(CategoryResponse::fromEntity)
                .toList();
    }

    public List<CategoryResponse> getActiveForTenant(UUID tenantId) {
        return categoryRepository.findByTenantIdAndIsActiveTrue(tenantId).stream()
                .map(CategoryResponse::fromEntity)
                .toList();
    }

    public CategoryResponse getById(UUID tenantId, UUID id) {
        Category category = categoryRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new CategoryNotFoundException(id));
        return CategoryResponse.fromEntity(category);
    }

    public CategoryResponse create(UUID tenantId, CategoryRequest request) {
        if (categoryRepository.existsByTenantIdAndNameIgnoreCase(tenantId, request.getName())) {
            throw new DuplicateCategoryNameException(request.getName());
        }

        Category category = new Category();
        category.setTenantId(tenantId);
        category.setName(request.getName());
        category.setDescription(request.getDescription());

        return CategoryResponse.fromEntity(categoryRepository.save(category));
    }

    public CategoryResponse update(UUID tenantId, UUID id, CategoryRequest request) {
        Category category = categoryRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new CategoryNotFoundException(id));

        if (!category.getName().equalsIgnoreCase(request.getName())
                && categoryRepository.existsByTenantIdAndNameIgnoreCase(tenantId, request.getName())) {
            throw new DuplicateCategoryNameException(request.getName());
        }

        category.setName(request.getName());
        category.setDescription(request.getDescription());

        return CategoryResponse.fromEntity(categoryRepository.save(category));
    }

    /**
     * Deactivating a category cascades to every product assigned to it - a product
     * whose category no longer exists (from a buyer's perspective) shouldn't remain
     * sellable in POS.
     */
    public void deactivate(UUID tenantId, UUID id) {
        Category category = categoryRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new CategoryNotFoundException(id));
        category.setActive(false);
        categoryRepository.save(category);

        List<Product> products = productRepository.findByTenantIdAndCategoryId(tenantId, id);
        for (Product product : products) {
            product.setActive(false);
        }
        productRepository.saveAll(products);
    }

    /**
     * Symmetric with deactivate: reactivating a category reactivates all of its
     * products too, regardless of whether they were deactivated individually or
     * only as a side effect of the category being deactivated.
     */
    public void activate(UUID tenantId, UUID id) {
        Category category = categoryRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new CategoryNotFoundException(id));
        category.setActive(true);
        categoryRepository.save(category);

        List<Product> products = productRepository.findByTenantIdAndCategoryId(tenantId, id);
        for (Product product : products) {
            product.setActive(true);
        }
        productRepository.saveAll(products);
    }

    /**
     * Permanently removes a category, but only if no products (active or inactive)
     * are assigned to it - otherwise those products would be orphaned.
     */
    public void delete(UUID tenantId, UUID id) {
        Category category = categoryRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new CategoryNotFoundException(id));

        if (productRepository.countByTenantIdAndCategoryId(tenantId, id) > 0) {
            throw new CategoryInUseException(id);
        }

        categoryRepository.delete(category);
    }
}