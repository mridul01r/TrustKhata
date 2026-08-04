package com.retailerp.backend.modules.accounting.controller;

import com.retailerp.backend.modules.accounting.dto.ExpenseCategoryDto;
import com.retailerp.backend.modules.accounting.service.ExpenseCategoryService;
import com.retailerp.backend.modules.auth.security.AuthenticatedUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/accounting/expense-categories")
@RequiredArgsConstructor
public class ExpenseCategoryController {

    private final ExpenseCategoryService categoryService;

    @GetMapping
    public List<ExpenseCategoryDto> list(@AuthenticationPrincipal AuthenticatedUser user) {
        return categoryService.listCategories(user.getTenantId());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ExpenseCategoryDto create(@AuthenticationPrincipal AuthenticatedUser user,
                                      @RequestBody Map<String, String> body) {
        return categoryService.createCategory(user.getTenantId(), body.get("name"));
    }
}