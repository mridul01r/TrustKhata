package com.retailerp.backend.modules.accounting.exception;

public class ExpenseCategoryNotFoundException extends RuntimeException {
    public ExpenseCategoryNotFoundException(String message) {
        super(message);
    }
}