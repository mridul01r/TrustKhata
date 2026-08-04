package com.retailerp.backend.modules.auth.controller;

import com.retailerp.backend.modules.auth.dto.ResetPasswordRequest;
import com.retailerp.backend.modules.auth.dto.StaffRequest;
import com.retailerp.backend.modules.auth.dto.StaffResponse;
import com.retailerp.backend.modules.auth.dto.StaffUpdateRequest;
import com.retailerp.backend.modules.auth.security.AuthenticatedUser;
import com.retailerp.backend.modules.auth.service.StaffService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/staff")
public class StaffController {

    private final StaffService staffService;

    public StaffController(StaffService staffService) {
        this.staffService = staffService;
    }

    @GetMapping
    public List<StaffResponse> list(@AuthenticationPrincipal AuthenticatedUser user) {
        return staffService.listStaff(user.getTenantId());
    }

    @PostMapping
    public StaffResponse create(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody StaffRequest request) {
        return staffService.createStaff(user.getTenantId(), request);
    }

    @PutMapping("/{id}")
    public StaffResponse update(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID id,
            @Valid @RequestBody StaffUpdateRequest request) {
        return staffService.updateStaff(user.getTenantId(), id, request);
    }

    @PostMapping("/{id}/reset-password")
    public void resetPassword(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID id,
            @Valid @RequestBody ResetPasswordRequest request) {
        staffService.resetPassword(user.getTenantId(), id, request);
    }

    @DeleteMapping("/{id}")
    public void delete(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID id) {
        staffService.deleteStaff(user.getTenantId(), id);
    }
}