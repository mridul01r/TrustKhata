package com.retailerp.backend.modules.pos.controller;

import com.retailerp.backend.modules.auth.security.AuthenticatedUser;
import com.retailerp.backend.modules.pos.dto.CheckoutRequest;
import com.retailerp.backend.modules.pos.dto.SaleResponse;
import com.retailerp.backend.modules.pos.entity.Sale;
import com.retailerp.backend.modules.pos.repository.SaleRepository;
import com.retailerp.backend.modules.pos.service.CheckoutService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/pos/sales")
public class SaleController {

    private final CheckoutService checkoutService;
    private final SaleRepository saleRepository;

    public SaleController(CheckoutService checkoutService, SaleRepository saleRepository) {
        this.checkoutService = checkoutService;
        this.saleRepository = saleRepository;
    }

    @PostMapping("/checkout")
    public SaleResponse checkout(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody CheckoutRequest request) {
        return checkoutService.checkout(user.getTenantId(), user.getUserId(), request);
    }

    @GetMapping
    public List<SaleResponse> getAll(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        UUID tenantId = user.getTenantId();
        boolean isCashier = user.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_CASHIER"));

        // CASHIER is always restricted to today, regardless of what's passed in.
        if (isCashier) {
            LocalDate todayDate = LocalDate.now();
            from = todayDate;
            to = todayDate;
        }

        List<Sale> sales;
        if (from != null && to != null) {
            LocalDateTime start = from.atStartOfDay();
            LocalDateTime end = to.atTime(LocalTime.MAX);
            sales = isCashier
                    ? saleRepository.findByTenantIdAndCreatedByAndCreatedAtBetweenOrderByCreatedAtDesc(
                            tenantId, user.getUserId(), start, end)
                    : saleRepository.findByTenantIdAndCreatedAtBetweenOrderByCreatedAtDesc(tenantId, start, end);
        } else {
            sales = isCashier
                    ? saleRepository.findByTenantIdAndCreatedByOrderByCreatedAtDesc(tenantId, user.getUserId())
                    : saleRepository.findByTenantIdOrderByCreatedAtDesc(tenantId);
        }

        return sales.stream().map(SaleResponse::fromEntity).toList();
    }

    @GetMapping("/{id}")
    public SaleResponse getById(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable UUID id) {
        Sale sale = saleRepository.findByIdAndTenantId(id, user.getTenantId())
                .orElseThrow(() -> new RuntimeException("Sale not found"));
        return SaleResponse.fromEntity(sale);
    }
}