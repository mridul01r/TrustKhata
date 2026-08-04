package com.retailerp.backend.modules.settings.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "business_settings")
public class BusinessSettings {

    @Id
    @Column(name = "tenant_id")
    private UUID tenantId;

    @Column(name = "business_name", nullable = false, length = 150)
    private String businessName = "";

    @Column(length = 15)
    private String gstin;

    @Column(name = "address_line1", length = 150)
    private String addressLine1 = "";

    @Column(name = "address_line2", length = 150)
    private String addressLine2 = "";

    @Column(length = 80)
    private String city = "";

    @Column(length = 80)
    private String state = "";

    @Column(length = 10)
    private String pincode = "";

    @Column(length = 20)
    private String phone = "";

    @Column(length = 150)
    private String email = "";

    @Column(name = "track_inventory", nullable = false)
    private boolean trackInventory = true;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    protected void onSave() {
        updatedAt = LocalDateTime.now();
    }

    public BusinessSettings() {
    }

    public UUID getTenantId() {
        return tenantId;
    }

    public void setTenantId(UUID tenantId) {
        this.tenantId = tenantId;
    }

    public String getBusinessName() {
        return businessName;
    }

    public void setBusinessName(String businessName) {
        this.businessName = businessName;
    }

    public String getGstin() {
        return gstin;
    }

    public void setGstin(String gstin) {
        this.gstin = gstin;
    }

    public String getAddressLine1() {
        return addressLine1;
    }

    public void setAddressLine1(String addressLine1) {
        this.addressLine1 = addressLine1;
    }

    public String getAddressLine2() {
        return addressLine2;
    }

    public void setAddressLine2(String addressLine2) {
        this.addressLine2 = addressLine2;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public String getPincode() {
        return pincode;
    }

    public void setPincode(String pincode) {
        this.pincode = pincode;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public boolean isTrackInventory() {
        return trackInventory;
    }

    public void setTrackInventory(boolean trackInventory) {
        this.trackInventory = trackInventory;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}