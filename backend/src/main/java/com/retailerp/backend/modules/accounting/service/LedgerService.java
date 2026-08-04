package com.retailerp.backend.modules.accounting.service;

import com.retailerp.backend.modules.accounting.dto.LedgerEntryDto;
import com.retailerp.backend.modules.accounting.entity.Expense;
import com.retailerp.backend.modules.accounting.repository.ExpenseCategoryRepository;
import com.retailerp.backend.modules.accounting.repository.ExpenseRepository;
import com.retailerp.backend.modules.pos.entity.Sale;
import com.retailerp.backend.modules.pos.repository.SaleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LedgerService {

    private final SaleRepository saleRepository;
    private final ExpenseRepository expenseRepository;
    private final ExpenseCategoryRepository categoryRepository;

    public List<LedgerEntryDto> getDayBook(UUID tenantId, LocalDate from, LocalDate to) {
        List<Sale> sales = saleRepository.findByTenantIdAndCreatedAtBetweenOrderByCreatedAtDesc(
                tenantId, from.atStartOfDay(), to.plusDays(1).atStartOfDay());
        List<Expense> expenses = expenseRepository
                .findByTenantIdAndExpenseDateBetweenOrderByExpenseDateDesc(tenantId, from, to);

        Map<UUID, String> categoryNames = categoryRepository.findByTenantIdOrderByNameAsc(tenantId).stream()
                .collect(java.util.stream.Collectors.toMap(c -> c.getId(), c -> c.getName()));

        record RawEntry(LocalDate date, String type, String description, BigDecimal credit, BigDecimal debit, UUID id) {}

        List<RawEntry> raw = new ArrayList<>();
        for (Sale sale : sales) {
            raw.add(new RawEntry(
                    sale.getCreatedAt().toLocalDate(),
                    "SALE",
                    "Invoice " + sale.getInvoiceNumber(),
                    sale.getTotalAmount(),
                    BigDecimal.ZERO,
                    sale.getId()
            ));
        }
        for (Expense expense : expenses) {
            String catName = categoryNames.getOrDefault(expense.getCategoryId(), "Unknown");
            String desc = catName + (expense.getNote() != null && !expense.getNote().isBlank() ? " - " + expense.getNote() : "");
            raw.add(new RawEntry(
                    expense.getExpenseDate(),
                    "EXPENSE",
                    desc,
                    BigDecimal.ZERO,
                    expense.getAmount(),
                    expense.getId()
            ));
        }

        // Repository returns Desc order; sort ascending here since day-book reads chronologically
        raw.sort((a, b) -> a.date().compareTo(b.date()));

        List<LedgerEntryDto> result = new ArrayList<>();
        BigDecimal running = BigDecimal.ZERO;
        for (RawEntry entry : raw) {
            running = running.add(entry.credit()).subtract(entry.debit());
            result.add(new LedgerEntryDto(
                    entry.id(), entry.date(), entry.type(), entry.description(),
                    entry.credit(), entry.debit(), running
            ));
        }
        return result;
    }
}