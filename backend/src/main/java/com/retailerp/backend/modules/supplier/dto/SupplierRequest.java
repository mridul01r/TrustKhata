package com.retailerp.backend.modules.supplier.dto;

import jakarta.validation.constraints.NotBlank;

public record SupplierRequest(
        @NotBlank String name,
        String contact,
        String gstin
) {}