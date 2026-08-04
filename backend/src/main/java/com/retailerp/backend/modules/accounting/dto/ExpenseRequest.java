package com.retailerp.backend.modules.accounting.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record ExpenseRequest(
        @NotNull UUID categoryId,
        @NotNull @Positive BigDecimal amount,
        String note,
        @NotNull LocalDate expenseDate
) {}