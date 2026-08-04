package com.retailerp.backend.modules.supplier.controller;

import com.retailerp.backend.modules.auth.security.AuthenticatedUser;
import com.retailerp.backend.modules.supplier.dto.SupplierDto;
import com.retailerp.backend.modules.supplier.dto.SupplierRequest;
import com.retailerp.backend.modules.supplier.service.SupplierService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/suppliers")
@RequiredArgsConstructor
public class SupplierController {

    private final SupplierService supplierService;

    @GetMapping
    public List<SupplierDto> list(@AuthenticationPrincipal AuthenticatedUser user) {
        return supplierService.listSuppliers(user.getTenantId());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SupplierDto create(@AuthenticationPrincipal AuthenticatedUser user,
                               @Valid @RequestBody SupplierRequest request) {
        return supplierService.createSupplier(user.getTenantId(), request);
    }
}