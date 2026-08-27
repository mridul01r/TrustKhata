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

    // Native query scalar types differ slightly between PostgreSQL and H2.
    private static UUID parseUuid(Object value) {
        return value == null ? null : UUID.fromString(value.toString());
    }

    private static BigDecimal toBigDecimal(Object value) {
        return value instanceof BigDecimal decimal
                ? decimal
                : new BigDecimal(value.toString());
    }

    private static LocalDate toLocalDate(Object value) {
        if (value instanceof LocalDate date) {
            return date;
        }
        if (value instanceof java.sql.Date date) {
            return date.toLocalDate();
        }
        return LocalDate.parse(value.toString());
    }

    public SalesAnalyticsResponse getAnalytics(UUID tenantId, LocalDateTime start, LocalDateTime end) {
        List<BestSellingProductDto> bestSellers = repository.findBestSellingProducts(tenantId, start, end)
                .stream()
                .map(row -> new BestSellingProductDto(
                        parseUuid(row[0]),
                        (String) row[1],
                        toBigDecimal(row[2]),
                        toBigDecimal(row[3])))
                .toList();
        List<CategorySalesDto> byCategory = repository.findSalesByCategory(tenantId, start, end)
                .stream()
                .map(row -> new CategorySalesDto(
                        parseUuid(row[0]),
                        (String) row[1],
                        toBigDecimal(row[2]),
                        toBigDecimal(row[3])))
                .toList();
        List<DailySalesDto> byDay = repository.findSalesByDay(tenantId, start, end)
                .stream()
                .map(row -> new DailySalesDto(
                        toLocalDate(row[0]),
                        toBigDecimal(row[1]),
                        ((Number) row[2]).longValue()))
                .toList();
        List<HourlySalesDto> byHour = repository.findSalesByHour(tenantId, start, end)
                .stream()
                .map(row -> new HourlySalesDto(
                        ((Number) row[0]).intValue(),
                        toBigDecimal(row[1]),
                        ((Number) row[2]).longValue()))
                .toList();
        return new SalesAnalyticsResponse(bestSellers, byCategory, byDay, byHour);
    }
}