package com.retailerp.backend.modules.supplier.repository;

import com.retailerp.backend.modules.supplier.entity.Purchase;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PurchaseRepository extends JpaRepository<Purchase, UUID> {
    List<Purchase> findByTenantIdAndPurchaseDateBetweenOrderByPurchaseDateDesc(
            UUID tenantId, LocalDate from, LocalDate to);

    Optional<Purchase> findByIdAndTenantId(UUID id, UUID tenantId);
}