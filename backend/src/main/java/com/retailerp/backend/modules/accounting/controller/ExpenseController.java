package com.retailerp.backend.modules.accounting.controller;

import com.retailerp.backend.modules.accounting.dto.ExpenseRequest;
import com.retailerp.backend.modules.accounting.dto.ExpenseResponse;
import com.retailerp.backend.modules.accounting.service.ExpenseService;
import com.retailerp.backend.modules.auth.security.AuthenticatedUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/accounting/expenses")
@RequiredArgsConstructor
public class ExpenseController {

    private final ExpenseService expenseService;

    @GetMapping
    public List<ExpenseResponse> list(@AuthenticationPrincipal AuthenticatedUser user,
                                       @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                       @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return expenseService.listExpenses(user.getTenantId(), from, to);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ExpenseResponse create(@AuthenticationPrincipal AuthenticatedUser user,
                                   @Valid @RequestBody ExpenseRequest request) {
        return expenseService.createExpense(user.getTenantId(), user.getUserId(), request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal AuthenticatedUser user, @RequestParam UUID id) {
        expenseService.deleteExpense(user.getTenantId(), id);
    }
}