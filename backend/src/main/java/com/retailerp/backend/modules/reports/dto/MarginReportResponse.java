package com.retailerp.backend.modules.reports.dto;

import java.math.BigDecimal;
import java.util.List;

public class MarginReportResponse {

    private final BigDecimal totalRevenue;
    private final BigDecimal totalCogs;
    private final BigDecimal totalGrossProfit;
    private final BigDecimal overallMarginPercent;
    private final long totalExcludedLineItems;
    private final List<ProductMarginDto> byProduct;
    private final List<CategoryMarginDto> byCategory;

    public MarginReportResponse(BigDecimal totalRevenue, BigDecimal totalCogs, BigDecimal totalGrossProfit,
                                 BigDecimal overallMarginPercent, long totalExcludedLineItems,
                                 List<ProductMarginDto> byProduct, List<CategoryMarginDto> byCategory) {
        this.totalRevenue = totalRevenue;
        this.totalCogs = totalCogs;
        this.totalGrossProfit = totalGrossProfit;
        this.overallMarginPercent = overallMarginPercent;
        this.totalExcludedLineItems = totalExcludedLineItems;
        this.byProduct = byProduct;
        this.byCategory = byCategory;
    }

    public BigDecimal getTotalRevenue() {
        return totalRevenue;
    }

    public BigDecimal getTotalCogs() {
        return totalCogs;
    }

    public BigDecimal getTotalGrossProfit() {
        return totalGrossProfit;
    }

    public BigDecimal getOverallMarginPercent() {
        return overallMarginPercent;
    }

    public long getTotalExcludedLineItems() {
        return totalExcludedLineItems;
    }

    public List<ProductMarginDto> getByProduct() {
        return byProduct;
    }

    public List<CategoryMarginDto> getByCategory() {
        return byCategory;
    }
}