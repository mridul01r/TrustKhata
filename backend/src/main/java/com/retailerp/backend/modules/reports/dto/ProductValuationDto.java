package com.retailerp.backend.modules.reports.dto;

import java.math.BigDecimal;
import java.util.UUID;

public class ProductValuationDto {

    private final UUID productId;
    private final String productName;
    private final String categoryName;
    private final String unit;
    private final BigDecimal stockQuantity;
    private final BigDecimal purchasePrice;
    private final BigDecimal stockValue;

    public ProductValuationDto(UUID productId, String productName, String categoryName, String unit,
                                BigDecimal stockQuantity, BigDecimal purchasePrice, BigDecimal stockValue) {
        this.productId = productId;
        this.productName = productName;
        this.categoryName = categoryName;
        this.unit = unit;
        this.stockQuantity = stockQuantity;
        this.purchasePrice = purchasePrice;
        this.stockValue = stockValue;
    }

    public UUID getProductId() {
        return productId;
    }

    public String getProductName() {
        return productName;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public String getUnit() {
        return unit;
    }

    public BigDecimal getStockQuantity() {
        return stockQuantity;
    }

    public BigDecimal getPurchasePrice() {
        return purchasePrice;
    }

    public BigDecimal getStockValue() {
        return stockValue;
    }
}