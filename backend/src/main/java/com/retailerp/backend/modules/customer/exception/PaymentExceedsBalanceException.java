package com.retailerp.backend.modules.customer.exception;

import java.math.BigDecimal;

public class PaymentExceedsBalanceException extends RuntimeException {

    public PaymentExceedsBalanceException(BigDecimal amount, BigDecimal balance) {
        super("Payment amount " + amount + " exceeds outstanding balance " + balance);
    }
}