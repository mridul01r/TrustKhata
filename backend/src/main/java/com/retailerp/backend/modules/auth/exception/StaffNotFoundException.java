package com.retailerp.backend.modules.auth.exception;

import java.util.UUID;

public class StaffNotFoundException extends RuntimeException {
    public StaffNotFoundException(UUID id) {
        super("Staff account not found: " + id);
    }
}