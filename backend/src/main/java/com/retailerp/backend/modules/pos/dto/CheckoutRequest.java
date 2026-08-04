package com.retailerp.backend.modules.pos.dto;

import com.retailerp.backend.modules.pos.entity.PaymentMethod;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public class CheckoutRequest {

    @NotEmpty(message = "At least one item is required")
    @Valid
    private List<CheckoutItem> items;

    @NotEmpty(message = "At least one payment is required")
    @Valid
    private List<CheckoutPayment> payments;

    private boolean isInterstate = false;

    private UUID customerId;

    public List<CheckoutItem> getItems() {
        return items;
    }

    public void setItems(List<CheckoutItem> items) {
        this.items = items;
    }

    public List<CheckoutPayment> getPayments() {
        return payments;
    }

    public void setPayments(List<CheckoutPayment> payments) {
        this.payments = payments;
    }

    public boolean isInterstate() {
        return isInterstate;
    }

    public void setInterstate(boolean interstate) {
        isInterstate = interstate;
    }

    public UUID getCustomerId() {
        return customerId;
    }

    public void setCustomerId(UUID customerId) {
        this.customerId = customerId;
    }

    public static class CheckoutItem {

        @NotNull(message = "Product is required")
        private UUID productId;

        @NotNull(message = "Quantity is required")
        @DecimalMin(value = "0.001", message = "Quantity must be greater than zero")
        private BigDecimal quantity;

        public UUID getProductId() {
            return productId;
        }

        public void setProductId(UUID productId) {
            this.productId = productId;
        }

        public BigDecimal getQuantity() {
            return quantity;
        }

        public void setQuantity(BigDecimal quantity) {
            this.quantity = quantity;
        }
    }

    public static class CheckoutPayment {

        @NotNull(message = "Payment method is required")
        private PaymentMethod method;

        @NotNull(message = "Payment amount is required")
        @DecimalMin(value = "0.01", message = "Payment amount must be greater than zero")
        private BigDecimal amount;

        public PaymentMethod getMethod() {
            return method;
        }

        public void setMethod(PaymentMethod method) {
            this.method = method;
        }

        public BigDecimal getAmount() {
            return amount;
        }

        public void setAmount(BigDecimal amount) {
            this.amount = amount;
        }
    }
}