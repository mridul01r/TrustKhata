package com.retailerp.backend.modules.auth.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.retailerp.backend.modules.auth.entity.User;
import com.retailerp.backend.modules.auth.entity.UserRole;

import java.time.LocalDateTime;
import java.util.UUID;

public class StaffResponse {

    private UUID id;
    private String username;
    private String email;
    private String fullName;
    private UserRole role;
    private boolean isActive;
    private LocalDateTime createdAt;

    public static StaffResponse fromEntity(User user) {
        StaffResponse r = new StaffResponse();
        r.id = user.getId();
        r.username = user.getUsername();
        r.email = user.getEmail();
        r.fullName = user.getFullName();
        r.role = user.getRole();
        r.isActive = user.isActive();
        r.createdAt = user.getCreatedAt();
        return r;
    }

    public UUID getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }

    public String getEmail() {
        return email;
    }

    public String getFullName() {
        return fullName;
    }

    public UserRole getRole() {
        return role;
    }

    @JsonProperty("isActive")
    public boolean isActive() {
        return isActive;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}