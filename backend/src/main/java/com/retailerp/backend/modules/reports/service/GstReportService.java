package com.retailerp.backend.modules.reports.service;

import com.retailerp.backend.modules.reports.dto.GstReportResponse;
import com.retailerp.backend.modules.reports.dto.HsnSummaryDto;
import com.retailerp.backend.modules.reports.dto.TaxRateSummaryDto;
import com.retailerp.backend.modules.reports.repository.GstReportRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class GstReportService {

    private final GstReportRepository repository;

    public GstReportService(GstReportRepository repository) {
        this.repository = repository;
    }

    public GstReportResponse getGstReport(UUID tenantId, LocalDateTime start, LocalDateTime end) {
        List<HsnSummaryDto> byHsn = repository.findHsnSummary(tenantId, start, end)
                .stream()
                .map(row -> new HsnSummaryDto(
                        (String) row[0],
                        (String) row[1],
                        (BigDecimal) row[2],
                        (BigDecimal) row[3],
                        (BigDecimal) row[4],
                        (BigDecimal) row[5],
                        (BigDecimal) row[6],
                        (BigDecimal) row[7]))
                .toList();

        List<TaxRateSummaryDto> byTaxRate = repository.findTaxRateSummary(tenantId, start, end)
                .stream()
                .map(row -> new TaxRateSummaryDto(
                        (BigDecimal) row[0],
                        (BigDecimal) row[1],
                        (BigDecimal) row[2],
                        (BigDecimal) row[3],
                        (BigDecimal) row[4]))
                .toList();

        BigDecimal totalTaxableValue = byTaxRate.stream()
                .map(TaxRateSummaryDto::getTaxableValue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalIgst = byTaxRate.stream()
                .map(TaxRateSummaryDto::getIgst)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalCgst = byTaxRate.stream()
                .map(TaxRateSummaryDto::getCgst)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalSgst = byTaxRate.stream()
                .map(TaxRateSummaryDto::getSgst)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalTax = totalIgst.add(totalCgst).add(totalSgst);
        BigDecimal totalInvoiceValue = totalTaxableValue.add(totalTax);

        return new GstReportResponse(
                totalTaxableValue, totalIgst, totalCgst, totalSgst, totalTax, totalInvoiceValue,
                byTaxRate, byHsn
        );
    }
}