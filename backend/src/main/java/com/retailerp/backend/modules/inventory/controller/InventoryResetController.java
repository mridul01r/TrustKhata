package com.retailerp.backend.modules.inventory.controller;

import com.retailerp.backend.modules.auth.security.AuthenticatedUser;
import com.retailerp.backend.modules.inventory.dto.ClearInventoryResponse;
import com.retailerp.backend.modules.inventory.service.InventoryResetService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/inventory")
public class InventoryResetController {

    private final InventoryResetService inventoryResetService;

    public InventoryResetController(InventoryResetService inventoryResetService) {
        this.inventoryResetService = inventoryResetService;
    }

    @PostMapping("/clear-all")
    public ClearInventoryResponse clearAll(@AuthenticationPrincipal AuthenticatedUser user) {
        return inventoryResetService.clearAll(user.getTenantId());
    }
}