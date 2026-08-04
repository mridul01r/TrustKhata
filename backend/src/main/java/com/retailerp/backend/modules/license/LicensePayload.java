package com.retailerp.backend.modules.license;

import java.time.LocalDate;

public record LicensePayload(
        String customerName,
        LicenseType type,
        LocalDate issuedDate,
        LocalDate expiryDate
) {
    public boolean isExpired() {
        return expiryDate != null && LocalDate.now().isAfter(expiryDate);
    }
}