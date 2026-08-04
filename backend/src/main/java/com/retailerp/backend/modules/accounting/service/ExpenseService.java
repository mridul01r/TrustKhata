package com.retailerp.backend.modules.accounting.service;

import com.retailerp.backend.modules.accounting.dto.ExpenseRequest;
import com.retailerp.backend.modules.accounting.dto.ExpenseResponse;
import com.retailerp.backend.modules.accounting.entity.Expense;
import com.retailerp.backend.modules.accounting.entity.ExpenseCategory;
import com.retailerp.backend.modules.accounting.exception.ExpenseCategoryNotFoundException;
import com.retailerp.backend.modules.accounting.exception.ExpenseNotFoundException;
import com.retailerp.backend.modules.accounting.repository.ExpenseCategoryRepository;
import com.retailerp.backend.modules.accounting.repository.ExpenseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final ExpenseCategoryRepository categoryRepository;

    @Transactional
    public ExpenseResponse createExpense(UUID tenantId, UUID userId, ExpenseRequest request) {
        ExpenseCategory category = categoryRepository.findById(request.categoryId())
                .filter(c -> c.getTenantId().equals(tenantId))
                .orElseThrow(() -> new ExpenseCategoryNotFoundException("Category not found"));

        Expense expense = new Expense();
        expense.setTenantId(tenantId);
        expense.setCategoryId(category.getId());
        expense.setAmount(request.amount());
        expense.setNote(request.note());
        expense.setExpenseDate(request.expenseDate());
        expense.setCreatedBy(userId);

        Expense saved = expenseRepository.save(expense);
        return toResponse(saved, category.getName());
    }

    public List<ExpenseResponse> listExpenses(UUID tenantId, LocalDate from, LocalDate to) {
        List<Expense> expenses = expenseRepository
                .findByTenantIdAndExpenseDateBetweenOrderByExpenseDateDesc(tenantId, from, to);

        Map<UUID, String> categoryNames = categoryRepository.findByTenantIdOrderByNameAsc(tenantId).stream()
                .collect(java.util.stream.Collectors.toMap(ExpenseCategory::getId, ExpenseCategory::getName));

        return expenses.stream()
                .map(e -> toResponse(e, categoryNames.getOrDefault(e.getCategoryId(), "Unknown")))
                .toList();
    }

    @Transactional
    public void deleteExpense(UUID tenantId, UUID expenseId) {
        Expense expense = expenseRepository.findById(expenseId)
                .filter(e -> e.getTenantId().equals(tenantId))
                .orElseThrow(() -> new ExpenseNotFoundException("Expense not found"));
        expenseRepository.delete(expense);
    }

    private ExpenseResponse toResponse(Expense expense, String categoryName) {
        return new ExpenseResponse(
                expense.getId(),
                expense.getCategoryId(),
                categoryName,
                expense.getAmount(),
                expense.getNote(),
                expense.getExpenseDate()
        );
    }
}