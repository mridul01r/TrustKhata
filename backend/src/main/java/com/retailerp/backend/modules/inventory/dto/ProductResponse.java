package com.retailerp.backend.modules.inventory.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.retailerp.backend.modules.inventory.entity.Product;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public class ProductResponse {

    private UUID id;
    private String sku;
    private String name;
    private String description;
    private UUID categoryId;
    private String categoryName;
    private String unit;
    private String hsnCode;
    private BigDecimal gstRate;
    private BigDecimal purchasePrice;
    private BigDecimal sellingPrice;
    private BigDecimal stockQuantity;
    private BigDecimal reorderLevel;
    private boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public ProductResponse() {
    }

    public static ProductResponse fromEntity(Product product) {
        ProductResponse response = new ProductResponse();
        response.id = product.getId();
        response.sku = product.getSku();
        response.name = product.getName();
        response.description = product.getDescription();
        if (product.getCategory() != null) {
            response.categoryId = product.getCategory().getId();
            response.categoryName = product.getCategory().getName();
        }
        response.unit = product.getUnit();
        response.hsnCode = product.getHsnCode();
        response.gstRate = product.getGstRate();
        response.purchasePrice = product.getPurchasePrice();
        response.sellingPrice = product.getSellingPrice();
        response.stockQuantity = product.getStockQuantity();
        response.reorderLevel = product.getReorderLevel();
        response.isActive = product.isActive();
        response.createdAt = product.getCreatedAt();
        response.updatedAt = product.getUpdatedAt();
        return response;
    }

    public UUID getId() {
        return id;
    }

    public String getSku() {
        return sku;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public UUID getCategoryId() {
        return categoryId;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public String getUnit() {
        return unit;
    }

    public String getHsnCode() {
        return hsnCode;
    }

    public BigDecimal getGstRate() {
        return gstRate;
    }

    public BigDecimal getPurchasePrice() {
        return purchasePrice;
    }

    public BigDecimal getSellingPrice() {
        return sellingPrice;
    }

    public BigDecimal getStockQuantity() {
        return stockQuantity;
    }

    public BigDecimal getReorderLevel() {
        return reorderLevel;
    }

    @JsonProperty("isActive")
    public boolean isActive() {
        return isActive;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}