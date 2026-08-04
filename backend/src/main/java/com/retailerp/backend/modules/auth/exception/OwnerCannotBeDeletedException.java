package com.retailerp.backend.modules.auth.exception;

public class OwnerCannotBeDeletedException extends RuntimeException {
    public OwnerCannotBeDeletedException() {
        super("The owner account cannot be deleted.");
    }
}