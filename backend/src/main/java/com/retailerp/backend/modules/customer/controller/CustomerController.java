package com.retailerp.backend.modules.customer.controller;

import com.retailerp.backend.modules.auth.security.AuthenticatedUser;
import com.retailerp.backend.modules.customer.dto.*;
import com.retailerp.backend.modules.customer.service.CustomerService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/customers")
public class CustomerController {

    private final CustomerService customerService;

    public CustomerController(CustomerService customerService) {
        this.customerService = customerService;
    }

    @PostMapping
    public CustomerResponse create(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody CustomerRequest request) {
        return customerService.createCustomer(user.getTenantId(), request);
    }

    @GetMapping
    public List<CustomerResponse> list(@AuthenticationPrincipal AuthenticatedUser user) {
        return customerService.listCustomers(user.getTenantId());
    }

    @PutMapping("/{id}")
    public CustomerResponse update(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID id,
            @Valid @RequestBody CustomerRequest request) {
        return customerService.updateCustomer(user.getTenantId(), id, request);
    }

    @GetMapping("/{id}/history")
    public CustomerHistoryResponse getHistory(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID id) {
        return customerService.getHistory(user.getTenantId(), id);
    }

    @PostMapping("/{id}/payments")
    public CustomerPaymentResponse recordPayment(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID id,
            @Valid @RequestBody CustomerPaymentRequest request) {
        return customerService.recordPayment(user.getTenantId(), id, user.getUserId(), request);
    }
}