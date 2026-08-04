package com.retailerp.backend.modules.reports.dto;

import java.math.BigDecimal;

public class TaxRateSummaryDto {

    private final BigDecimal gstRate;
    private final BigDecimal taxableValue;
    private final BigDecimal igst;
    private final BigDecimal cgst;
    private final BigDecimal sgst;

    public TaxRateSummaryDto(BigDecimal gstRate, BigDecimal taxableValue,
                              BigDecimal igst, BigDecimal cgst, BigDecimal sgst) {
        this.gstRate = gstRate;
        this.taxableValue = taxableValue;
        this.igst = igst;
        this.cgst = cgst;
        this.sgst = sgst;
    }

    public BigDecimal getGstRate() {
        return gstRate;
    }

    public BigDecimal getTaxableValue() {
        return taxableValue;
    }

    public BigDecimal getIgst() {
        return igst;
    }

    public BigDecimal getCgst() {
        return cgst;
    }

    public BigDecimal getSgst() {
        return sgst;
    }
}