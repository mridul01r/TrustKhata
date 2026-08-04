package com.retailerp.backend.modules.inventory.repository;

import com.retailerp.backend.modules.inventory.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CategoryRepository extends JpaRepository<Category, UUID> {

    List<Category> findByTenantIdAndIsActiveTrue(UUID tenantId);

    List<Category> findByTenantId(UUID tenantId);

    Optional<Category> findByIdAndTenantId(UUID id, UUID tenantId);

    boolean existsByTenantIdAndNameIgnoreCase(UUID tenantId, String name);
}