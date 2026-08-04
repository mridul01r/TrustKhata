package com.retailerp.backend.modules.pos.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.retailerp.backend.modules.pos.entity.PaymentMethod;
import com.retailerp.backend.modules.pos.entity.Sale;
import com.retailerp.backend.modules.pos.entity.SaleItem;
import com.retailerp.backend.modules.pos.entity.SalePayment;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class SaleResponse {

    private UUID id;
    private String invoiceNumber;
    private BigDecimal subtotal;
    private BigDecimal taxTotal;
    private BigDecimal discountTotal;
    private BigDecimal totalAmount;
    private String status;
    private boolean interstate;
    private UUID customerId;
    private String customerName;
    private LocalDateTime createdAt;
    private List<SaleItemResponse> items;
    private List<SalePaymentResponse> payments;

    public static SaleResponse fromEntity(Sale sale) {
        SaleResponse response = new SaleResponse();
        response.id = sale.getId();
        response.invoiceNumber = sale.getInvoiceNumber();
        response.subtotal = sale.getSubtotal();
        response.taxTotal = sale.getTaxTotal();
        response.discountTotal = sale.getDiscountTotal();
        response.totalAmount = sale.getTotalAmount();
        response.status = sale.getStatus();
        response.interstate = sale.isInterstate();
        response.customerId = sale.getCustomerId();
        response.customerName = sale.getCustomerName();
        response.createdAt = sale.getCreatedAt();
        response.items = sale.getItems().stream().map(SaleItemResponse::fromEntity).toList();
        response.payments = sale.getPayments().stream().map(SalePaymentResponse::fromEntity).toList();
        return response;
    }

    public UUID getId() {
        return id;
    }

    public String getInvoiceNumber() {
        return invoiceNumber;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public BigDecimal getTaxTotal() {
        return taxTotal;
    }

    public BigDecimal getDiscountTotal() {
        return discountTotal;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public String getStatus() {
        return status;
    }

    // Jackson strips the "is" prefix from boolean getters when deriving the JSON
    // property name (isInterstate() -> "interstate"), same gotcha already hit on
    // ProductResponse/CategoryResponse's isActive(). Pin the JSON key explicitly
    // so the frontend's `isInterstate` field actually gets populated.
    @JsonProperty("isInterstate")
    public boolean isInterstate() {
        return interstate;
    }

    public UUID getCustomerId() {
        return customerId;
    }

    public String getCustomerName() {
        return customerName;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public List<SaleItemResponse> getItems() {
        return items;
    }

    public List<SalePaymentResponse> getPayments() {
        return payments;
    }

    public static class SaleItemResponse {
        private UUID productId;
        private String productName;
        private String hsnCode;
        private String unit;
        private BigDecimal quantity;
        private BigDecimal unitPrice;
        private BigDecimal gstRate;
        private BigDecimal lineSubtotal;
        private BigDecimal lineTax;
        private BigDecimal lineTotal;

        public static SaleItemResponse fromEntity(SaleItem item) {
            SaleItemResponse r = new SaleItemResponse();
            r.productId = item.getProductId();
            r.productName = item.getProductName();
            r.hsnCode = item.getHsnCode();
            r.unit = item.getUnit();
            r.quantity = item.getQuantity();
            r.unitPrice = item.getUnitPrice();
            r.gstRate = item.getGstRate();
            r.lineSubtotal = item.getLineSubtotal();
            r.lineTax = item.getLineTax();
            r.lineTotal = item.getLineTotal();
            return r;
        }

        public UUID getProductId() {
            return productId;
        }

        public String getProductName() {
            return productName;
        }

        public String getHsnCode() {
            return hsnCode;
        }

        public String getUnit() {
            return unit;
        }

        public BigDecimal getQuantity() {
            return quantity;
        }

        public BigDecimal getUnitPrice() {
            return unitPrice;
        }

        public BigDecimal getGstRate() {
            return gstRate;
        }

        public BigDecimal getLineSubtotal() {
            return lineSubtotal;
        }

        public BigDecimal getLineTax() {
            return lineTax;
        }

        public BigDecimal getLineTotal() {
            return lineTotal;
        }
    }

    public static class SalePaymentResponse {
        private PaymentMethod method;
        private BigDecimal amount;

        public static SalePaymentResponse fromEntity(SalePayment payment) {
            SalePaymentResponse r = new SalePaymentResponse();
            r.method = payment.getMethod();
            r.amount = payment.getAmount();
            return r;
        }

        public PaymentMethod getMethod() {
            return method;
        }

        public BigDecimal getAmount() {
            return amount;
        }
    }
}