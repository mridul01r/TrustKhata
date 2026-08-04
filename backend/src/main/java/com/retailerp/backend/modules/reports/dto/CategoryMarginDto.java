package com.retailerp.backend.modules.reports.dto;

import java.math.BigDecimal;
import java.util.UUID;

public class CategoryMarginDto {

    private final UUID categoryId;
    private final String categoryName;
    private final BigDecimal revenue;
    private final BigDecimal cogs;
    private final BigDecimal grossProfit;
    private final BigDecimal marginPercent;
    private final long excludedLineItems;

    public CategoryMarginDto(UUID categoryId, String categoryName, BigDecimal revenue,
                              BigDecimal cogs, BigDecimal grossProfit, BigDecimal marginPercent,
                              long excludedLineItems) {
        this.categoryId = categoryId;
        this.categoryName = categoryName;
        this.revenue = revenue;
        this.cogs = cogs;
        this.grossProfit = grossProfit;
        this.marginPercent = marginPercent;
        this.excludedLineItems = excludedLineItems;
    }

    public UUID getCategoryId() {
        return categoryId;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public BigDecimal getRevenue() {
        return revenue;
    }

    public BigDecimal getCogs() {
        return cogs;
    }

    public BigDecimal getGrossProfit() {
        return grossProfit;
    }

    public BigDecimal getMarginPercent() {
        return marginPercent;
    }

    public long getExcludedLineItems() {
        return excludedLineItems;
    }
}