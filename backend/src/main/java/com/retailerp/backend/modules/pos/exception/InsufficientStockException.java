package com.retailerp.backend.modules.pos.exception;

public class InsufficientStockException extends RuntimeException {

    public InsufficientStockException(String productName, java.math.BigDecimal available, java.math.BigDecimal requested) {
        super(String.format("Insufficient stock for '%s': %s available, %s requested", productName, available, requested));
    }
}