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

    // Native UUID columns come back as a VARCHAR string (cast in the SQL
    // itself) so the value is consistent across both PostgreSQL and H2 -
    // H2's JDBC driver returns raw UUID columns as byte[] instead of
    // java.util.UUID on native queries, which breaks a direct (UUID) cast.
    private static UUID parseUuid(Object value) {
        return value == null ? null : UUID.fromString((String) value);
    }

    public StockReportResponse getStockReport(UUID tenantId, int deadStockDays) {
        List<ProductValuationDto> valuation = repository.findValuation(tenantId)
                .stream()
                .map(row -> new ProductValuationDto(
                        parseUuid(row[0]),
                        (String) row[1],
                        (String) row[2],
                        (String) row[3],
                        (BigDecimal) row[4],
                        (BigDecimal) row[5],
                        (BigDecimal) row[6]))
                .toList();

        List<LowStockDto> lowStock = repository.findLowStock(tenantId)
                .stream()
                .map(row -> new LowStockDto(
                        parseUuid(row[0]),
                        (String) row[1],
                        (String) row[2],
                        (BigDecimal) row[3],
                        (BigDecimal) row[4]))
                .toList();

        LocalDateTime cutoff = LocalDateTime.now().minusDays(deadStockDays);
        List<DeadStockDto> deadStock = repository.findDeadStock(tenantId, cutoff)
                .stream()
                .map(row -> new DeadStockDto(
                        parseUuid(row[0]),
                        (String) row[1],
                        (String) row[2],
                        (BigDecimal) row[3],
                        (LocalDateTime) row[4]))
                .toList();

        BigDecimal totalStockValue = valuation.stream()
                .map(ProductValuationDto::getStockValue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new StockReportResponse(totalStockValue, valuation, lowStock, deadStock);
    }
}