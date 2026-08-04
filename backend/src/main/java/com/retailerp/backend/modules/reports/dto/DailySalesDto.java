package com.retailerp.backend.modules.reports.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class DailySalesDto {

    private final LocalDate date;
    private final BigDecimal revenue;
    private final long saleCount;

    public DailySalesDto(LocalDate date, BigDecimal revenue, long saleCount) {
        this.date = date;
        this.revenue = revenue;
        this.saleCount = saleCount;
    }

    public LocalDate getDate() {
        return date;
    }

    public BigDecimal getRevenue() {
        return revenue;
    }

    public long getSaleCount() {
        return saleCount;
    }
}