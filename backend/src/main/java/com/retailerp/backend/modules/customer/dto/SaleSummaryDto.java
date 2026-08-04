package com.retailerp.backend.modules.customer.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public class SaleSummaryDto {

    private final UUID saleId;
    private final String invoiceNumber;
    private final BigDecimal totalAmount;
    private final BigDecimal creditPortion;
    private final LocalDateTime createdAt;

    public SaleSummaryDto(UUID saleId, String invoiceNumber, BigDecimal totalAmount,
                           BigDecimal creditPortion, LocalDateTime createdAt) {
        this.saleId = saleId;
        this.invoiceNumber = invoiceNumber;
        this.totalAmount = totalAmount;
        this.creditPortion = creditPortion;
        this.createdAt = createdAt;
    }

    public UUID getSaleId() {
        return saleId;
    }

    public String getInvoiceNumber() {
        return invoiceNumber;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public BigDecimal getCreditPortion() {
        return creditPortion;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}