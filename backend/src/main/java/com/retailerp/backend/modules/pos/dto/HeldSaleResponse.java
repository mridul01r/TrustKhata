package com.retailerp.backend.modules.pos.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class HeldSaleResponse {

    private UUID id;
    private List<HeldSaleItemDto> items;
    private UUID customerId;
    private boolean isInterstate;
    private String label;
    private LocalDateTime createdAt;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public List<HeldSaleItemDto> getItems() {
        return items;
    }

    public void setItems(List<HeldSaleItemDto> items) {
        this.items = items;
    }

    public UUID getCustomerId() {
        return customerId;
    }

    public void setCustomerId(UUID customerId) {
        this.customerId = customerId;
    }

    public boolean isInterstate() {
        return isInterstate;
    }

    public void setInterstate(boolean interstate) {
        isInterstate = interstate;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}