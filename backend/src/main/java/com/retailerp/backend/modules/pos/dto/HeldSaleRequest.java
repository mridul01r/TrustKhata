package com.retailerp.backend.modules.pos.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

public class HeldSaleRequest {

    @NotEmpty(message = "At least one item is required")
    @Valid
    private List<HeldSaleItemDto> items;

    private UUID customerId;

    private boolean isInterstate = false;

    @Size(max = 200, message = "Label must be 200 characters or fewer")
    private String label;

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
}