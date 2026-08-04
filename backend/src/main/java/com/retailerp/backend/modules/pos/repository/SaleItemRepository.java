package com.retailerp.backend.modules.pos.repository;

import com.retailerp.backend.modules.pos.entity.SaleItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface SaleItemRepository extends JpaRepository<SaleItem, UUID> {

    boolean existsByProductId(UUID productId);
}