package com.retailerp.backend.modules.inventory.service;

import com.retailerp.backend.modules.inventory.dto.ProductRequest;
import com.retailerp.backend.modules.inventory.dto.ProductResponse;
import com.retailerp.backend.modules.inventory.entity.Category;
import com.retailerp.backend.modules.inventory.entity.Product;
import com.retailerp.backend.modules.inventory.exception.CategoryNotFoundException;
import com.retailerp.backend.modules.inventory.exception.DuplicateSkuException;
import com.retailerp.backend.modules.inventory.exception.ProductInUseException;
import com.retailerp.backend.modules.inventory.exception.ProductNotFoundException;
import com.retailerp.backend.modules.inventory.repository.CategoryRepository;
import com.retailerp.backend.modules.inventory.repository.ProductRepository;
import com.retailerp.backend.modules.pos.repository.SaleItemRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final SaleItemRepository saleItemRepository;

    public ProductService(
            ProductRepository productRepository,
            CategoryRepository categoryRepository,
            SaleItemRepository saleItemRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.saleItemRepository = saleItemRepository;
    }

    public List<ProductResponse> getAllForTenant(UUID tenantId) {
        return productRepository.findByTenantId(tenantId).stream()
                .map(ProductResponse::fromEntity)
                .toList();
    }

    public List<ProductResponse> getActiveForTenant(UUID tenantId) {
        return productRepository.findByTenantIdAndIsActiveTrue(tenantId).stream()
                .map(ProductResponse::fromEntity)
                .toList();
    }

    public List<ProductResponse> getActiveByCategory(UUID tenantId, UUID categoryId) {
        return productRepository.findByTenantIdAndCategoryIdAndIsActiveTrue(tenantId, categoryId).stream()
                .map(ProductResponse::fromEntity)
                .toList();
    }

    public ProductResponse getById(UUID tenantId, UUID id) {
        Product product = productRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ProductNotFoundException(id));
        return ProductResponse.fromEntity(product);
    }

    public ProductResponse create(UUID tenantId, ProductRequest request) {
        if (productRepository.existsByTenantIdAndSkuIgnoreCase(tenantId, request.getSku())) {
            throw new DuplicateSkuException(request.getSku());
        }

        Product product = new Product();
        product.setTenantId(tenantId);
        applyRequestToProduct(tenantId, product, request);

        return ProductResponse.fromEntity(productRepository.save(product));
    }

    public ProductResponse update(UUID tenantId, UUID id, ProductRequest request) {
        Product product = productRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ProductNotFoundException(id));

        if (!product.getSku().equalsIgnoreCase(request.getSku())
                && productRepository.existsByTenantIdAndSkuIgnoreCase(tenantId, request.getSku())) {
            throw new DuplicateSkuException(request.getSku());
        }

        applyRequestToProduct(tenantId, product, request);

        return ProductResponse.fromEntity(productRepository.save(product));
    }

    public void deactivate(UUID tenantId, UUID id) {
        Product product = productRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ProductNotFoundException(id));
        product.setActive(false);
        productRepository.save(product);
    }

    public void activate(UUID tenantId, UUID id) {
        Product product = productRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ProductNotFoundException(id));
        product.setActive(true);
        productRepository.save(product);
    }

    /**
     * Permanently removes a product, but only if it has never appeared in a sale.
     * Products with sales history must be deactivated instead, since hard-deleting
     * them would corrupt historical invoices (SaleItem keeps a denormalized
     * productName/price snapshot, but productId would dangle).
     */
    public void delete(UUID tenantId, UUID id) {
        Product product = productRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ProductNotFoundException(id));

        if (saleItemRepository.existsByProductId(id)) {
            throw new ProductInUseException(id);
        }

        productRepository.delete(product);
    }

    private void applyRequestToProduct(UUID tenantId, Product product, ProductRequest request) {
        product.setSku(request.getSku());
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setUnit(request.getUnit());
        product.setHsnCode(request.getHsnCode());
        product.setGstRate(request.getGstRate());
        product.setPurchasePrice(request.getPurchasePrice());
        product.setSellingPrice(request.getSellingPrice());
        product.setStockQuantity(request.getStockQuantity());
        product.setReorderLevel(request.getReorderLevel());

        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findByIdAndTenantId(request.getCategoryId(), tenantId)
                    .orElseThrow(() -> new CategoryNotFoundException(request.getCategoryId()));
            product.setCategory(category);
        } else {
            product.setCategory(null);
        }
    }
}