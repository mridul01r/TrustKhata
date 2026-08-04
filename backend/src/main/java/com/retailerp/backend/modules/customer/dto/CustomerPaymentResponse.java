package com.retailerp.backend.modules.customer.dto;

import com.retailerp.backend.modules.customer.entity.CustomerPayment;
import com.retailerp.backend.modules.pos.entity.PaymentMethod;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public class CustomerPaymentResponse {

    private UUID id;
    private BigDecimal amount;
    private PaymentMethod method;
    private String note;
    private LocalDateTime createdAt;

    public static CustomerPaymentResponse fromEntity(CustomerPayment payment) {
        CustomerPaymentResponse r = new CustomerPaymentResponse();
        r.id = payment.getId();
        r.amount = payment.getAmount();
        r.method = payment.getMethod();
        r.note = payment.getNote();
        r.createdAt = payment.getCreatedAt();
        return r;
    }

    public UUID getId() {
        return id;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public PaymentMethod getMethod() {
        return method;
    }

    public String getNote() {
        return note;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}