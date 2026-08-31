package com.retailerp.backend.modules.reports.service;

import com.retailerp.backend.modules.reports.dto.DeadStockDto;
import com.retailerp.backend.modules.reports.dto.LowStockDto;
import com.retailerp.backend.modules.reports.dto.ProductValuationDto;
import com.retailerp.backend.modules.reports.dto.StockReportResponse;
import com.retailerp.backend.modules.reports.repository.StockReportRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class StockReportService {

    private final StockReportRepository repository;

    public StockReportService(StockReportRepository repository) {
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

    private static LocalDateTime toLocalDateTime(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof LocalDateTime dateTime) {
            return dateTime;
        }
        if (value instanceof java.sql.Timestamp timestamp) {
            return timestamp.toLocalDateTime();
        }
        return LocalDateTime.parse(value.toString().replace(' ', 'T'));
    }

    public StockReportResponse getStockReport(UUID tenantId, int deadStockDays) {
        List<ProductValuationDto> valuation = repository.findValuation(tenantId)
                .stream()
                .map(row -> new ProductValuationDto(
                        parseUuid(row[0]),
                        (String) row[1],
                        (String) row[2],
                        (String) row[3],
                        toBigDecimal(row[4]),
                        toBigDecimal(row[5]),
                        toBigDecimal(row[6])))
                .toList();

        List<LowStockDto> lowStock = repository.findLowStock(tenantId)
                .stream()
                .map(row -> new LowStockDto(
                        parseUuid(row[0]),
                        (String) row[1],
                        (String) row[2],
                        toBigDecimal(row[3]),
                        toBigDecimal(row[4])))
                .toList();

        LocalDateTime cutoff = LocalDateTime.now().minusDays(deadStockDays);
        List<DeadStockDto> deadStock = repository.findDeadStock(tenantId, cutoff)
                .stream()
                .map(row -> new DeadStockDto(
                        parseUuid(row[0]),
                        (String) row[1],
                        (String) row[2],
                        toBigDecimal(row[3]),
                        toLocalDateTime(row[4])))
                .toList();

        BigDecimal totalStockValue = valuation.stream()
                .map(ProductValuationDto::getStockValue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new StockReportResponse(totalStockValue, valuation, lowStock, deadStock);
    }
}