package com.retailerp.backend.modules.reports.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class SummaryReportResponse {

    private LocalDate periodStart;
    private LocalDate periodEnd;

    private BigDecimal totalSales;
    private BigDecimal totalTax;
    private long totalTransactions;

    private BigDecimal totalProfit;
    private BigDecimal marginPercent;

    private List<BestSellingProductDto> topProducts;
    private List<DailySalesDto> byDay;

    private BigDecimal totalStockValue;
    private int lowStockCount;
    private int deadStockCount;

    // Previous period (same length, immediately preceding periodStart) — used for KPI trend arrows.
    private BigDecimal previousTotalSales;
    private long previousTotalTransactions;
    private BigDecimal previousTotalProfit;
    private BigDecimal previousMarginPercent;

    public SummaryReportResponse(
            LocalDate periodStart,
            LocalDate periodEnd,
            BigDecimal totalSales,
            BigDecimal totalTax,
            long totalTransactions,
            BigDecimal totalProfit,
            BigDecimal marginPercent,
            List<BestSellingProductDto> topProducts,
            List<DailySalesDto> byDay,
            BigDecimal totalStockValue,
            int lowStockCount,
            int deadStockCount,
            BigDecimal previousTotalSales,
            long previousTotalTransactions,
            BigDecimal previousTotalProfit,
            BigDecimal previousMarginPercent) {
        this.periodStart = periodStart;
        this.periodEnd = periodEnd;
        this.totalSales = totalSales;
        this.totalTax = totalTax;
        this.totalTransactions = totalTransactions;
        this.totalProfit = totalProfit;
        this.marginPercent = marginPercent;
        this.topProducts = topProducts;
        this.byDay = byDay;
        this.totalStockValue = totalStockValue;
        this.lowStockCount = lowStockCount;
        this.deadStockCount = deadStockCount;
        this.previousTotalSales = previousTotalSales;
        this.previousTotalTransactions = previousTotalTransactions;
        this.previousTotalProfit = previousTotalProfit;
        this.previousMarginPercent = previousMarginPercent;
    }

    public LocalDate getPeriodStart() {
        return periodStart;
    }

    public LocalDate getPeriodEnd() {
        return periodEnd;
    }

    public BigDecimal getTotalSales() {
        return totalSales;
    }

    public BigDecimal getTotalTax() {
        return totalTax;
    }

    public long getTotalTransactions() {
        return totalTransactions;
    }

    public BigDecimal getTotalProfit() {
        return totalProfit;
    }

    public BigDecimal getMarginPercent() {
        return marginPercent;
    }

    public List<BestSellingProductDto> getTopProducts() {
        return topProducts;
    }

    public List<DailySalesDto> getByDay() {
        return byDay;
    }

    public BigDecimal getTotalStockValue() {
        return totalStockValue;
    }

    public int getLowStockCount() {
        return lowStockCount;
    }

    public int getDeadStockCount() {
        return deadStockCount;
    }

    public BigDecimal getPreviousTotalSales() {
        return previousTotalSales;
    }

    public long getPreviousTotalTransactions() {
        return previousTotalTransactions;
    }

    public BigDecimal getPreviousTotalProfit() {
        return previousTotalProfit;
    }

    public BigDecimal getPreviousMarginPercent() {
        return previousMarginPercent;
    }
}