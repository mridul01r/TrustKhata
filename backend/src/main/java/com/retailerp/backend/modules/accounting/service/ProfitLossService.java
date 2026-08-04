package com.retailerp.backend.modules.accounting.service;

import com.retailerp.backend.modules.accounting.dto.ProfitLossResponse;
import com.retailerp.backend.modules.accounting.repository.ExpenseCategoryRepository;
import com.retailerp.backend.modules.accounting.repository.ExpenseRepository;
import com.retailerp.backend.modules.pos.entity.Sale;
import com.retailerp.backend.modules.pos.repository.SaleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProfitLossService {

    private final SaleRepository saleRepository;
    private final ExpenseRepository expenseRepository;
    private final ExpenseCategoryRepository categoryRepository;

    public ProfitLossResponse getProfitLoss(UUID tenantId, LocalDate from, LocalDate to) {
        List<Sale> sales = saleRepository.findByTenantIdAndCreatedAtBetweenOrderByCreatedAtDesc(
                tenantId, from.atStartOfDay(), to.plusDays(1).atStartOfDay());
        BigDecimal totalRevenue = sales.stream()
                .map(Sale::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalExpenses = expenseRepository.sumByTenantAndDateRange(tenantId, from, to);
        if (totalExpenses == null) totalExpenses = BigDecimal.ZERO;

        Map<UUID, String> categoryNames = categoryRepository.findByTenantIdOrderByNameAsc(tenantId).stream()
                .collect(java.util.stream.Collectors.toMap(c -> c.getId(), c -> c.getName()));

        List<Object[]> categorySums = expenseRepository.sumByCategoryAndDateRange(tenantId, from, to);
        List<ProfitLossResponse.CategoryBreakdown> breakdown = categorySums.stream()
                .map(row -> new ProfitLossResponse.CategoryBreakdown(
                        categoryNames.getOrDefault((UUID) row[0], "Unknown"),
                        (BigDecimal) row[1]))
                .toList();

        return new ProfitLossResponse(
                totalRevenue,
                totalExpenses,
                totalRevenue.subtract(totalExpenses),
                breakdown
        );
    }
}