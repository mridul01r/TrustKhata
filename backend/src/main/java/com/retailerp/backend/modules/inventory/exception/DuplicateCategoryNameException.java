package com.retailerp.backend.modules.inventory.exception;

public class DuplicateCategoryNameException extends RuntimeException {

    public DuplicateCategoryNameException(String name) {
        super("A category named '" + name + "' already exists");
    }
}