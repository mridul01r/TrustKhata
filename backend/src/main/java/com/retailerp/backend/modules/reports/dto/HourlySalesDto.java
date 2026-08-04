package com.retailerp.backend.modules.reports.dto;

import java.math.BigDecimal;

public class HourlySalesDto {

    private final int hour;
    private final BigDecimal revenue;
    private final long saleCount;

    public HourlySalesDto(int hour, BigDecimal revenue, long saleCount) {
        this.hour = hour;
        this.revenue = revenue;
        this.saleCount = saleCount;
    }

    public int getHour() {
        return hour;
    }

    public BigDecimal getRevenue() {
        return revenue;
    }

    public long getSaleCount() {
        return saleCount;
    }
}