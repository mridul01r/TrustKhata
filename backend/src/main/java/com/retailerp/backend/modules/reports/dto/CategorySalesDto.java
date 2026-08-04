package com.retailerp.backend.modules.reports.dto;

import java.math.BigDecimal;
import java.util.UUID;

public class CategorySalesDto {

    private final UUID categoryId;
    private final String categoryName;
    private final BigDecimal quantitySold;
    private final BigDecimal revenue;

    public CategorySalesDto(UUID categoryId, String categoryName, BigDecimal quantitySold, BigDecimal revenue) {
        this.categoryId = categoryId;
        this.categoryName = categoryName;
        this.quantitySold = quantitySold;
        this.revenue = revenue;
    }

    public UUID getCategoryId() {
        return categoryId;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public BigDecimal getQuantitySold() {
        return quantitySold;
    }

    public BigDecimal getRevenue() {
        return revenue;
    }
}