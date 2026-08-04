package com.retailerp.backend.modules.reports.dto;

import java.math.BigDecimal;

public class HsnSummaryDto {

    private final String hsnCode;
    private final String unit;
    private final BigDecimal gstRate;
    private final BigDecimal totalQuantity;
    private final BigDecimal taxableValue;
    private final BigDecimal igst;
    private final BigDecimal cgst;
    private final BigDecimal sgst;

    public HsnSummaryDto(String hsnCode, String unit, BigDecimal gstRate, BigDecimal totalQuantity,
                          BigDecimal taxableValue, BigDecimal igst, BigDecimal cgst, BigDecimal sgst) {
        this.hsnCode = hsnCode;
        this.unit = unit;
        this.gstRate = gstRate;
        this.totalQuantity = totalQuantity;
        this.taxableValue = taxableValue;
        this.igst = igst;
        this.cgst = cgst;
        this.sgst = sgst;
    }

    public String getHsnCode() {
        return hsnCode;
    }

    public String getUnit() {
        return unit;
    }

    public BigDecimal getGstRate() {
        return gstRate;
    }

    public BigDecimal getTotalQuantity() {
        return totalQuantity;
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