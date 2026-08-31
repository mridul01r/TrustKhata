package com.retailerp.backend.modules.auth.controller;

import com.retailerp.backend.modules.auth.dto.PasswordResetConfirmRequest;
import com.retailerp.backend.modules.auth.dto.PasswordResetRequest;
import com.retailerp.backend.modules.auth.service.PasswordResetService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth/password")
public class PasswordResetController {

    private final PasswordResetService passwordResetService;

    public PasswordResetController(PasswordResetService passwordResetService) {
        this.passwordResetService = passwordResetService;
    }

    @PostMapping("/request")
    public ResponseEntity<Map<String, String>> requestReset(
            @Valid @RequestBody PasswordResetRequest request) {
        String token = passwordResetService.requestPasswordReset(request);
        // In production, this token should be sent via email
        // For now, return it in the response so the user can see it
        return ResponseEntity.ok(Map.of(
            "message", "Password reset token generated. Check your email.",
            "token", token  // TODO: Remove this in production and only send via email
        ));
    }

    @PostMapping("/confirm")
    public ResponseEntity<Map<String, String>> confirmReset(
            @Valid @RequestBody PasswordResetConfirmRequest request) {
        passwordResetService.confirmPasswordReset(request);
        return ResponseEntity.ok(Map.of("message", "Password has been reset successfully"));
    }
}