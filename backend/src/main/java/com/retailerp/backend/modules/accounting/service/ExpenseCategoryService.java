package com.retailerp.backend.modules.accounting.service;

import com.retailerp.backend.modules.accounting.dto.ExpenseCategoryDto;
import com.retailerp.backend.modules.accounting.entity.ExpenseCategory;
import com.retailerp.backend.modules.accounting.exception.DuplicateExpenseCategoryException;
import com.retailerp.backend.modules.accounting.exception.ExpenseCategoryNotFoundException;
import com.retailerp.backend.modules.accounting.repository.ExpenseCategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ExpenseCategoryService {

    private final ExpenseCategoryRepository categoryRepository;

    public List<ExpenseCategoryDto> listCategories(UUID tenantId) {
        return categoryRepository.findByTenantIdOrderByNameAsc(tenantId).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public ExpenseCategoryDto createCategory(UUID tenantId, String name) {
        if (categoryRepository.existsByTenantIdAndNameIgnoreCase(tenantId, name)) {
            throw new DuplicateExpenseCategoryException("Category '" + name + "' already exists");
        }
        ExpenseCategory category = new ExpenseCategory();
        category.setTenantId(tenantId);
        category.setName(name);
        category.setDefault(false);
        return toDto(categoryRepository.save(category));
    }

    UUID resolveCategoryId(UUID tenantId, UUID categoryId) {
        ExpenseCategory category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ExpenseCategoryNotFoundException("Category not found"));
        if (!category.getTenantId().equals(tenantId)) {
            throw new ExpenseCategoryNotFoundException("Category not found");
        }
        return category.getId();
    }

    String categoryName(UUID categoryId) {
        return categoryRepository.findById(categoryId)
                .map(ExpenseCategory::getName)
                .orElse("Unknown");
    }

    private ExpenseCategoryDto toDto(ExpenseCategory category) {
        return new ExpenseCategoryDto(category.getId(), category.getName(), category.isDefault());
    }
}