package com.retailerp.backend.modules.reports.dto;

import java.math.BigDecimal;
import java.util.UUID;

public class ProductMarginDto {

    private final UUID productId;
    private final String productName;
    private final BigDecimal quantitySold;
    private final BigDecimal revenue;
    private final BigDecimal cogs;
    private final BigDecimal grossProfit;
    private final BigDecimal marginPercent;
    private final long excludedLineItems;

    public ProductMarginDto(UUID productId, String productName, BigDecimal quantitySold,
                             BigDecimal revenue, BigDecimal cogs, BigDecimal grossProfit,
                             BigDecimal marginPercent, long excludedLineItems) {
        this.productId = productId;
        this.productName = productName;
        this.quantitySold = quantitySold;
        this.revenue = revenue;
        this.cogs = cogs;
        this.grossProfit = grossProfit;
        this.marginPercent = marginPercent;
        this.excludedLineItems = excludedLineItems;
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