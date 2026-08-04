package com.retailerp.backend.modules.accounting.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record LedgerEntryDto(
        UUID id,
        LocalDate entryDate,
        String type,        // "SALE" or "EXPENSE"
        String description, // invoice number or category name + note
        BigDecimal credit,  // sales amount
        BigDecimal debit,   // expense amount
        BigDecimal runningBalance
) {}