package com.retailerp.backend.modules.inventory.controller;

import com.retailerp.backend.modules.auth.security.AuthenticatedUser;
import com.retailerp.backend.modules.inventory.dto.ProductRequest;
import com.retailerp.backend.modules.inventory.dto.ProductResponse;
import com.retailerp.backend.modules.inventory.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/inventory/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    public List<ProductResponse> getAll(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam(defaultValue = "false") boolean activeOnly,
            @RequestParam(required = false) UUID categoryId) {
        UUID tenantId = user.getTenantId();

        if (categoryId != null) {
            return productService.getActiveByCategory(tenantId, categoryId);
        }
        return activeOnly
                ? productService.getActiveForTenant(tenantId)
                : productService.getAllForTenant(tenantId);
    }

    @GetMapping("/{id}")
    public ProductResponse getById(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID id) {
        return productService.getById(user.getTenantId(), id);
    }

    @PostMapping
    public ResponseEntity<ProductResponse> create(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody ProductRequest request) {
        ProductResponse response = productService.create(user.getTenantId(), request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/activate")
    public ResponseEntity<Void> activate(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID id) {
        productService.activate(user.getTenantId(), id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}")
    public ProductResponse update(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID id,
            @Valid @RequestBody ProductRequest request) {
        return productService.update(user.getTenantId(), id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deactivate(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID id) {
        productService.deactivate(user.getTenantId(), id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}/permanent")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID id) {
        productService.delete(user.getTenantId(), id);
        return ResponseEntity.noContent().build();
    }
}