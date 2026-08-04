package com.retailerp.backend.modules.customer.dto;

import com.retailerp.backend.modules.customer.entity.Customer;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public class CustomerResponse {

    private UUID id;
    private String name;
    private String phone;
    private String address;
    private String gstin;
    private BigDecimal outstandingBalance;
    private LocalDateTime createdAt;

    public static CustomerResponse fromEntity(Customer customer, BigDecimal outstandingBalance) {
        CustomerResponse r = new CustomerResponse();
        r.id = customer.getId();
        r.name = customer.getName();
        r.phone = customer.getPhone();
        r.address = customer.getAddress();
        r.gstin = customer.getGstin();
        r.outstandingBalance = outstandingBalance;
        r.createdAt = customer.getCreatedAt();
        return r;
    }

    public UUID getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getPhone() {
        return phone;
    }

    public String getAddress() {
        return address;
    }

    public String getGstin() {
        return gstin;
    }

    public BigDecimal getOutstandingBalance() {
        return outstandingBalance;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}