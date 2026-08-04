package com.retailerp.backend.modules.accounting.repository;

import com.retailerp.backend.modules.accounting.entity.ExpenseCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ExpenseCategoryRepository extends JpaRepository<ExpenseCategory, UUID> {
    List<ExpenseCategory> findByTenantIdOrderByNameAsc(UUID tenantId);
    Optional<ExpenseCategory> findByTenantIdAndNameIgnoreCase(UUID tenantId, String name);
    boolean existsByTenantIdAndNameIgnoreCase(UUID tenantId, String name);
}