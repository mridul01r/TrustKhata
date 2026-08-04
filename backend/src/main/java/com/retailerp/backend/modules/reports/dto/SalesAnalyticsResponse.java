package com.retailerp.backend.modules.reports.dto;

import java.util.List;

public class SalesAnalyticsResponse {

    private final List<BestSellingProductDto> bestSellers;
    private final List<CategorySalesDto> byCategory;
    private final List<DailySalesDto> byDay;
    private final List<HourlySalesDto> byHour;

    public SalesAnalyticsResponse(List<BestSellingProductDto> bestSellers,
                                   List<CategorySalesDto> byCategory,
                                   List<DailySalesDto> byDay,
                                   List<HourlySalesDto> byHour) {
        this.bestSellers = bestSellers;
        this.byCategory = byCategory;
        this.byDay = byDay;
        this.byHour = byHour;
    }

    public List<BestSellingProductDto> getBestSellers() {
        return bestSellers;
    }

    public List<CategorySalesDto> getByCategory() {
        return byCategory;
    }

    public List<DailySalesDto> getByDay() {
        return byDay;
    }

    public List<HourlySalesDto> getByHour() {
        return byHour;
    }
}