package com.retailerp.backend.modules.accounting.dto;

import java.util.UUID;

public record ExpenseCategoryDto(UUID id, String name, boolean isDefault) {}