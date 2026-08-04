package com.retailerp.backend.modules.pos.repository;

import com.retailerp.backend.modules.pos.entity.Sale;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SaleRepository extends JpaRepository<Sale, UUID> {

    List<Sale> findByTenantIdOrderByCreatedAtDesc(UUID tenantId);

    List<Sale> findByTenantIdAndCreatedAtBetweenOrderByCreatedAtDesc(
            UUID tenantId, LocalDateTime start, LocalDateTime end);

    List<Sale> findByTenantIdAndCustomerIdOrderByCreatedAtDesc(UUID tenantId, UUID customerId);

    List<Sale> findByTenantIdAndCreatedByOrderByCreatedAtDesc(UUID tenantId, UUID createdBy);
    
    List<Sale> findByTenantIdAndCreatedByAndCreatedAtBetweenOrderByCreatedAtDesc(
        UUID tenantId, UUID createdBy, LocalDateTime start, LocalDateTime end);

    Optional<Sale> findByIdAndTenantId(UUID id, UUID tenantId);

    boolean existsByTenantIdAndCreatedBy(UUID tenantId, UUID createdBy);
}