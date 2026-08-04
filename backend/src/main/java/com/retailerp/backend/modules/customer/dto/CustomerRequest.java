package com.retailerp.backend.modules.customer.dto;

import jakarta.validation.constraints.NotBlank;

public class CustomerRequest {

    @NotBlank(message = "Name is required")
    private String name;

    private String phone;
    private String address;
    private String gstin;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getGstin() {
        return gstin;
    }

    public void setGstin(String gstin) {
        this.gstin = gstin;
    }
}