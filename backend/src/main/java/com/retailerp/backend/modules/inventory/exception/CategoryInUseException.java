package com.retailerp.backend.modules.inventory.exception;

import java.util.UUID;

public class CategoryInUseException extends RuntimeException {
    public CategoryInUseException(UUID categoryId) {
        super("This category has products assigned to it and can't be permanently deleted. Reassign or remove those products first.");
    }
}