package com.retailerp.backend.modules.license;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "license_activation")
public class LicenseActivation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "license_key", nullable = false, columnDefinition = "TEXT")
    private String licenseKey;

    @Column(name = "activated_at", nullable = false)
    private Instant activatedAt;

    protected LicenseActivation() {
    }

    public LicenseActivation(String licenseKey, Instant activatedAt) {
        this.licenseKey = licenseKey;
        this.activatedAt = activatedAt;
    }

    public Long getId() {
        return id;
    }

    public String getLicenseKey() {
        return licenseKey;
    }

    public Instant getActivatedAt() {
        return activatedAt;
    }
}