package com.retailerp.backend.modules.auth.exception;

public class StaffLimitExceededException extends RuntimeException {
    public StaffLimitExceededException() {
        super("You can only have up to 3 staff accounts. Deactivate or remove an existing one to add a new one.");
    }
}