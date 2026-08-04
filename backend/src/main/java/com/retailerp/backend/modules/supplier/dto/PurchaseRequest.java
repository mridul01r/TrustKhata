package com.retailerp.backend.modules.supplier.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record PurchaseRequest(
        @NotNull UUID supplierId,
        String referenceNumber,
        @NotNull LocalDate purchaseDate,
        @NotEmpty @Valid List<PurchaseItemRequest> items
) {}