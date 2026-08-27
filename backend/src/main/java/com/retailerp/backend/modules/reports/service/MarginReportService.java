package com.retailerp.backend.modules.reports.service;

import com.retailerp.backend.modules.reports.dto.CategoryMarginDto;
import com.retailerp.backend.modules.reports.dto.MarginReportResponse;
import com.retailerp.backend.modules.reports.dto.ProductMarginDto;
import com.retailerp.backend.modules.reports.repository.MarginReportRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class MarginReportService {

    private final MarginReportRepository repository;

    public MarginReportService(MarginReportRepository repository) {
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

    public MarginReportResponse getMarginReport(UUID tenantId, LocalDateTime start, LocalDateTime end) {
        List<ProductMarginDto> byProduct = repository.findMarginByProduct(tenantId, start, end)
                .stream()
                .map(row -> {
                    BigDecimal revenue = toBigDecimal(row[3]);
                    BigDecimal cogs = toBigDecimal(row[4]);
                    BigDecimal grossProfit = revenue.subtract(cogs);
                    return new ProductMarginDto(
                            parseUuid(row[0]),
                            (String) row[1],
                            toBigDecimal(row[2]),
                            revenue,
                            cogs,
                            grossProfit,
                            marginPercent(grossProfit, revenue),
                            ((Number) row[5]).longValue());
                })
                .toList();

        List<CategoryMarginDto> byCategory = repository.findMarginByCategory(tenantId, start, end)
                .stream()
                .map(row -> {
                    BigDecimal revenue = toBigDecimal(row[2]);
                    BigDecimal cogs = toBigDecimal(row[3]);
                    BigDecimal grossProfit = revenue.subtract(cogs);
                    return new CategoryMarginDto(
                            parseUuid(row[0]),
                            (String) row[1],
                            revenue,
                            cogs,
                            grossProfit,
                            marginPercent(grossProfit, revenue),
                            ((Number) row[4]).longValue());
                })
                .toList();

        BigDecimal totalRevenue = byProduct.stream()
                .map(ProductMarginDto::getRevenue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalCogs = byProduct.stream()
                .map(ProductMarginDto::getCogs)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalGrossProfit = totalRevenue.subtract(totalCogs);
        long totalExcluded = byProduct.stream()
                .mapToLong(ProductMarginDto::getExcludedLineItems)
                .sum();

        return new MarginReportResponse(
                totalRevenue,
                totalCogs,
                totalGrossProfit,
                marginPercent(totalGrossProfit, totalRevenue),
                totalExcluded,
                byProduct,
                byCategory
        );
    }

    private BigDecimal marginPercent(BigDecimal grossProfit, BigDecimal revenue) {
        if (revenue.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return grossProfit
                .divide(revenue, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .setScale(2, RoundingMode.HALF_UP);
    }
}