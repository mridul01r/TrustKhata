package com.retailerp.backend.modules.reports.dto;

import java.math.BigDecimal;
import java.util.List;

public class GstReportResponse {

    private final BigDecimal totalTaxableValue;
    private final BigDecimal totalIgst;
    private final BigDecimal totalCgst;
    private final BigDecimal totalSgst;
    private final BigDecimal totalTax;
    private final BigDecimal totalInvoiceValue;
    private final List<TaxRateSummaryDto> byTaxRate;
    private final List<HsnSummaryDto> byHsn;

    public GstReportResponse(BigDecimal totalTaxableValue, BigDecimal totalIgst, BigDecimal totalCgst,
                              BigDecimal totalSgst, BigDecimal totalTax, BigDecimal totalInvoiceValue,
                              List<TaxRateSummaryDto> byTaxRate, List<HsnSummaryDto> byHsn) {
        this.totalTaxableValue = totalTaxableValue;
        this.totalIgst = totalIgst;
        this.totalCgst = totalCgst;
        this.totalSgst = totalSgst;
        this.totalTax = totalTax;
        this.totalInvoiceValue = totalInvoiceValue;
        this.byTaxRate = byTaxRate;
        this.byHsn = byHsn;
    }

    public BigDecimal getTotalTaxableValue() {
        return totalTaxableValue;
    }

    public BigDecimal getTotalIgst() {
        return totalIgst;
    }

    public BigDecimal getTotalCgst() {
        return totalCgst;
    }

    public BigDecimal getTotalSgst() {
        return totalSgst;
    }

    public BigDecimal getTotalTax() {
        return totalTax;
    }

    public BigDecimal getTotalInvoiceValue() {
        return totalInvoiceValue;
    }

    public List<TaxRateSummaryDto> getByTaxRate() {
        return byTaxRate;
    }

    public List<HsnSummaryDto> getByHsn() {
        return byHsn;
    }
}