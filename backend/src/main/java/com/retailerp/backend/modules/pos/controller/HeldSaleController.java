package com.retailerp.backend.modules.pos.controller;

import com.retailerp.backend.modules.auth.security.AuthenticatedUser;
import com.retailerp.backend.modules.pos.dto.HeldSaleRequest;
import com.retailerp.backend.modules.pos.dto.HeldSaleResponse;
import com.retailerp.backend.modules.pos.service.HeldSaleService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/pos/held")
public class HeldSaleController {

    private final HeldSaleService heldSaleService;

    public HeldSaleController(HeldSaleService heldSaleService) {
        this.heldSaleService = heldSaleService;
    }

    @PostMapping
    public HeldSaleResponse hold(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody HeldSaleRequest request) {
        return heldSaleService.holdSale(user.getTenantId(), user.getUserId(), request);
    }

    @GetMapping
    public List<HeldSaleResponse> list(@AuthenticationPrincipal AuthenticatedUser user) {
        return heldSaleService.listHeldSales(user.getTenantId());
    }

    @DeleteMapping("/{id}")
    public void delete(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable UUID id) {
        heldSaleService.deleteHeldSale(user.getTenantId(), id);
    }
}