package com.retailerp.backend.modules.inventory.repository;

import com.retailerp.backend.modules.inventory.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductRepository extends JpaRepository<Product, UUID> {

    List<Product> findByTenantIdAndIsActiveTrue(UUID tenantId);

    List<Product> findByTenantId(UUID tenantId);

    Optional<Product> findByIdAndTenantId(UUID id, UUID tenantId);

    Optional<Product> findByTenantIdAndSkuIgnoreCase(UUID tenantId, String sku);

    boolean existsByTenantIdAndSkuIgnoreCase(UUID tenantId, String sku);

    List<Product> findByTenantIdAndCategoryIdAndIsActiveTrue(UUID tenantId, UUID categoryId);

    List<Product> findByTenantIdAndCategoryId(UUID tenantId, UUID categoryId);

    long countByTenantIdAndCategoryId(UUID tenantId, UUID categoryId);
}