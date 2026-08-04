package com.retailerp.backend.modules.inventory.exception;

import java.util.UUID;

public class ProductInUseException extends RuntimeException {
    public ProductInUseException(UUID productId) {
        super("This product has sales history and can't be permanently deleted. Deactivate it instead.");
    }
}