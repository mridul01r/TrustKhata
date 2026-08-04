package com.retailerp.backend.modules.settings.controller;

import com.retailerp.backend.modules.auth.security.AuthenticatedUser;
import com.retailerp.backend.modules.settings.dto.BusinessSettingsRequest;
import com.retailerp.backend.modules.settings.dto.BusinessSettingsResponse;
import com.retailerp.backend.modules.settings.service.BusinessSettingsService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/settings/business")
public class BusinessSettingsController {

    private final BusinessSettingsService service;

    public BusinessSettingsController(BusinessSettingsService service) {
        this.service = service;
    }

    @GetMapping
    public BusinessSettingsResponse get(@AuthenticationPrincipal AuthenticatedUser user) {
        return service.get(user.getTenantId());
    }

    @PutMapping
    public BusinessSettingsResponse save(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody BusinessSettingsRequest request) {
        return service.save(user.getTenantId(), request);
    }
}