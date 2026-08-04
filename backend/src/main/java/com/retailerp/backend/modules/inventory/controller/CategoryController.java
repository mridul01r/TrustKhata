package com.retailerp.backend.modules.inventory.controller;

import com.retailerp.backend.modules.auth.security.AuthenticatedUser;
import com.retailerp.backend.modules.inventory.dto.CategoryRequest;
import com.retailerp.backend.modules.inventory.dto.CategoryResponse;
import com.retailerp.backend.modules.inventory.service.CategoryService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/inventory/categories")
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    public List<CategoryResponse> getAll(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam(defaultValue = "false") boolean activeOnly) {
        UUID tenantId = user.getTenantId();
        return activeOnly
                ? categoryService.getActiveForTenant(tenantId)
                : categoryService.getAllForTenant(tenantId);
    }

    @GetMapping("/{id}")
    public CategoryResponse getById(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID id) {
        return categoryService.getById(user.getTenantId(), id);
    }

    @PostMapping
    public ResponseEntity<CategoryResponse> create(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody CategoryRequest request) {
        CategoryResponse response = categoryService.create(user.getTenantId(), request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/activate")
    public ResponseEntity<Void> activate(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID id) {
        categoryService.activate(user.getTenantId(), id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}")
    public CategoryResponse update(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID id,
            @Valid @RequestBody CategoryRequest request) {
        return categoryService.update(user.getTenantId(), id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deactivate(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID id) {
        categoryService.deactivate(user.getTenantId(), id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}/permanent")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID id) {
        categoryService.delete(user.getTenantId(), id);
        return ResponseEntity.noContent().build();
    }
}