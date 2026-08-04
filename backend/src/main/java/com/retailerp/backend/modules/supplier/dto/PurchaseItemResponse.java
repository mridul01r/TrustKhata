package com.retailerp.backend.modules.supplier.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record PurchaseItemResponse(
        UUID productId,
        String productName,
        BigDecimal quantity,
        BigDecimal unitCost,
        BigDecimal lineTotal
) {}