package com.retailerp.backend.modules.reports.dto;

import java.math.BigDecimal;
import java.util.UUID;

public class LowStockDto {

    private final UUID productId;
    private final String productName;
    private final String unit;
    private final BigDecimal stockQuantity;
    private final BigDecimal reorderLevel;

    public LowStockDto(UUID productId, String productName, String unit,
                        BigDecimal stockQuantity, BigDecimal reorderLevel) {
        this.productId = productId;
        this.productName = productName;
        this.unit = unit;
        this.stockQuantity = stockQuantity;
        this.reorderLevel = reorderLevel;
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

    public BigDecimal getReorderLevel() {
        return reorderLevel;
    }
}