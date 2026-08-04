package com.retailerp.backend.modules.reports.service;

import com.retailerp.backend.modules.reports.dto.BestSellingProductDto;
import com.retailerp.backend.modules.reports.dto.CategorySalesDto;
import com.retailerp.backend.modules.reports.dto.DailySalesDto;
import com.retailerp.backend.modules.reports.dto.HourlySalesDto;
import com.retailerp.backend.modules.reports.dto.SalesAnalyticsResponse;
import com.retailerp.backend.modules.reports.repository.SalesAnalyticsRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class SalesAnalyticsService {

    private final SalesAnalyticsRepository repository;

    public SalesAnalyticsService(SalesAnalyticsRepository repository) {
        this.repository = repository;
    }

    public SalesAnalyticsResponse getAnalytics(UUID tenantId, LocalDateTime start, LocalDateTime end) {
        List<BestSellingProductDto> bestSellers = repository.findBestSellingProducts(tenantId, start, end)
                .stream()
                .map(row -> new BestSellingProductDto(
                        (UUID) row[0],
                        (String) row[1],
                        (BigDecimal) row[2],
                        (BigDecimal) row[3]))
                .toList();

        List<CategorySalesDto> byCategory = repository.findSalesByCategory(tenantId, start, end)
                .stream()
                .map(row -> new CategorySalesDto(
                        (UUID) row[0],
                        (String) row[1],
                        (BigDecimal) row[2],
                        (BigDecimal) row[3]))
                .toList();

        List<DailySalesDto> byDay = repository.findSalesByDay(tenantId, start, end)
                .stream()
                .map(row -> new DailySalesDto(
                        (LocalDate) row[0],
                        (BigDecimal) row[1],
                        ((Number) row[2]).longValue()))
                .toList();

        List<HourlySalesDto> byHour = repository.findSalesByHour(tenantId, start, end)
                .stream()
                .map(row -> new HourlySalesDto(
                        ((Number) row[0]).intValue(),
                        (BigDecimal) row[1],
                        ((Number) row[2]).longValue()))
                .toList();

        return new SalesAnalyticsResponse(bestSellers, byCategory, byDay, byHour);
    }
}