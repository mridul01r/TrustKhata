package com.retailerp.backend.modules.pos.exception;

import java.util.UUID;

public class HeldSaleNotFoundException extends RuntimeException {
    public HeldSaleNotFoundException(UUID id) {
        super("Held bill not found: " + id);
    }
}