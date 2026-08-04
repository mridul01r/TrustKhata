package com.retailerp.backend.modules.inventory.dto;

import java.math.BigDecimal;

public class ImportRowResult {

    public enum Action {
        CREATE, UPDATE, ERROR
    }

    private int rowNumber;
    private String categoryName;
    private boolean categoryIsNew;
    private String productName;
    private BigDecimal price;
    private BigDecimal quantity;
    private BigDecimal gstRate;
    private BigDecimal purchasePrice;
    private Action productAction;
    private String errorMessage;

    public ImportRowResult() {
    }

    public int getRowNumber() {
        return rowNumber;
    }

    public void setRowNumber(int rowNumber) {
        this.rowNumber = rowNumber;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public void setCategoryName(String categoryName) {
        this.categoryName = categoryName;
    }

    public boolean isCategoryIsNew() {
        return categoryIsNew;
    }

    public void setCategoryIsNew(boolean categoryIsNew) {
        this.categoryIsNew = categoryIsNew;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public BigDecimal getQuantity() {
        return quantity;
    }

    public void setQuantity(BigDecimal quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getGstRate() {
        return gstRate;
    }

    public void setGstRate(BigDecimal gstRate) {
        this.gstRate = gstRate;
    }

    public BigDecimal getPurchasePrice() {
        return purchasePrice;
    }

    public void setPurchasePrice(BigDecimal purchasePrice) {
        this.purchasePrice = purchasePrice;
    }

    public Action getProductAction() {
        return productAction;
    }

    public void setProductAction(Action productAction) {
        this.productAction = productAction;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }
}