package com.retailerp.backend.modules.reports.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public class DeadStockDto {

    private final UUID productId;
    private final String productName;
    private final String unit;
    private final BigDecimal stockQuantity;
    private final LocalDateTime lastSoldAt; // null if never sold

    public DeadStockDto(UUID productId, String productName, String unit,
                         BigDecimal stockQuantity, LocalDateTime lastSoldAt) {
        this.productId = productId;
        this.productName = productName;
        this.unit = unit;
        this.stockQuantity = stockQuantity;
        this.lastSoldAt = lastSoldAt;
    }

    public UUID getProductId() {
        return productId;
    }

    public String getProductName() {
        return productName;
    }

    public String getUnit() {
        return unit;
    }

    public BigDecimal getStockQuantity() {
        return stockQuantity;
    }

    public LocalDateTime getLastSoldAt() {
        return lastSoldAt;
    }
}