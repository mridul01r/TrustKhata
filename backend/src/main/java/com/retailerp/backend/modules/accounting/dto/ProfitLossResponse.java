package com.retailerp.backend.modules.accounting.dto;

import java.math.BigDecimal;
import java.util.List;

public record ProfitLossResponse(
        BigDecimal totalRevenue,
        BigDecimal totalExpenses,
        BigDecimal netProfit,
        List<CategoryBreakdown> expenseBreakdown
) {
    public record CategoryBreakdown(String categoryName, BigDecimal amount) {}
}