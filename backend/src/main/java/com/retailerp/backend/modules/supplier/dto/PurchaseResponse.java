package com.retailerp.backend.modules.supplier.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record PurchaseResponse(
        UUID id,
        UUID supplierId,
        String supplierName,
        String referenceNumber,
        LocalDate purchaseDate,
        BigDecimal totalAmount,
        List<PurchaseItemResponse> items
) {}