package com.retailerp.backend.modules.accounting.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record ExpenseResponse(
        UUID id,
        UUID categoryId,
        String categoryName,
        BigDecimal amount,
        String note,
        LocalDate expenseDate
) {}