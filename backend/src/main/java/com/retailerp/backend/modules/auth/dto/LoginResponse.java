package com.retailerp.backend.modules.auth.dto;

import com.retailerp.backend.modules.auth.entity.UserRole;
import java.util.UUID;

public class LoginResponse {

    private String token;
    private UUID userId;
    private String username;
    private UserRole role;
    private UUID tenantId;

    public LoginResponse(String token, UUID userId, String username, UserRole role, UUID tenantId) {
        this.token = token;
        this.userId = userId;
        this.username = username;
        this.role = role;
        this.tenantId = tenantId;
    }

    public String getToken() {
        return token;
    }

    public UUID getUserId() {
        return userId;
    }

    public String getUsername() {
        return username;
    }

    public UserRole getRole() {
        return role;
    }

    public UUID getTenantId() {
        return tenantId;
    }
}