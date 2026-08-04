package com.retailerp.backend.modules.license;

public class LicenseInvalidException extends RuntimeException {
    public LicenseInvalidException(String message) {
        super(message);
    }
}