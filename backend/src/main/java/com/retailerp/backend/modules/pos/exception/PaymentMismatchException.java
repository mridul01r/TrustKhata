package com.retailerp.backend.modules.pos.exception;

import java.math.BigDecimal;

public class PaymentMismatchException extends RuntimeException {

    public PaymentMismatchException(BigDecimal totalAmount, BigDecimal paidAmount) {
        super(String.format("Payment total (%s) does not match invoice total (%s)", paidAmount, totalAmount));
    }
}