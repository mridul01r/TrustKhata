package com.retailerp.backend.modules.license.dto;

import java.time.LocalDate;

public record LicenseStatusResponse(
        boolean valid,
        String reason,
        String customerName,
        String licenseType,
        LocalDate expiryDate
) {
}