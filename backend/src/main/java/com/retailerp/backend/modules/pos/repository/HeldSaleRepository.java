package com.retailerp.backend.modules.pos.repository;

import com.retailerp.backend.modules.pos.entity.HeldSale;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface HeldSaleRepository extends JpaRepository<HeldSale, UUID> {

    List<HeldSale> findByTenantIdOrderByCreatedAtAsc(UUID tenantId);

    Optional<HeldSale> findByIdAndTenantId(UUID id, UUID tenantId);
}