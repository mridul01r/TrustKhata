package com.retailerp.backend.modules.supplier.dto;

import java.util.UUID;

public record SupplierDto(UUID id, String name, String contact, String gstin) {}