package com.retailerp.backend.modules.auth.controller;

import com.retailerp.backend.modules.auth.dto.LoginRequest;
import com.retailerp.backend.modules.auth.dto.LoginResponse;
import com.retailerp.backend.modules.auth.security.AuthenticatedUser;
import com.retailerp.backend.modules.auth.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login/{tenantId}")
    public ResponseEntity<LoginResponse> login(
            @PathVariable UUID tenantId,
            @Valid @RequestBody LoginRequest request
    ) {
        LoginResponse response = authService.login(tenantId, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> me(@AuthenticationPrincipal AuthenticatedUser user) {
        return ResponseEntity.ok(Map.of(
                "userId", user.getUserId(),
                "username", user.getUsername(),
                "email", user.getEmail() != null ? user.getEmail() : "",
                "fullName", user.getFullName() != null ? user.getFullName() : "",
                "tenantId", user.getTenantId(),
                "authorities", user.getAuthorities()
        ));
    }
}