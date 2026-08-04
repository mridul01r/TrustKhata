package com.retailerp.backend.modules.accounting.exception;

public class DuplicateExpenseCategoryException extends RuntimeException {
    public DuplicateExpenseCategoryException(String message) {
        super(message);
    }
}