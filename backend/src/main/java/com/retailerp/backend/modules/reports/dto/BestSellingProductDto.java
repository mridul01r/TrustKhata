package com.retailerp.backend.modules.reports.dto;

import java.math.BigDecimal;
import java.util.UUID;

public class BestSellingProductDto {

    private final UUID productId;
    private final String productName;
    private final BigDecimal quantitySold;
    private final BigDecimal revenue;

    public BestSellingProductDto(UUID productId, String productName, BigDecimal quantitySold, BigDecimal revenue) {
        this.productId = productId;
        this.productName = productName;
        this.quantitySold = quantitySold;
        this.revenue = revenue;
    }

    public UUID getProductId() {
        return productId;
    }

    public String getProductName() {
        return productName;
    }

    public BigDecimal getQuantitySold() {
        return quantitySold;
    }

    public BigDecimal getRevenue() {
        return revenue;
    }
}