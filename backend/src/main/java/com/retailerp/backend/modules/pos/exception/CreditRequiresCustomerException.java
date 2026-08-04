package com.retailerp.backend.modules.pos.exception;

public class CreditRequiresCustomerException extends RuntimeException {

    public CreditRequiresCustomerException() {
        super("A customer must be selected for a credit sale");
    }
}