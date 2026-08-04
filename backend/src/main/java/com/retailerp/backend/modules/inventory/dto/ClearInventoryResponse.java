package com.retailerp.backend.modules.inventory.dto;

public class ClearInventoryResponse {

    private int productsDeleted;
    private int productsDeactivated;
    private int categoriesDeleted;
    private int categoriesDeactivated;

    public ClearInventoryResponse() {
    }

    public ClearInventoryResponse(int productsDeleted, int productsDeactivated,
                                   int categoriesDeleted, int categoriesDeactivated) {
        this.productsDeleted = productsDeleted;
        this.productsDeactivated = productsDeactivated;
        this.categoriesDeleted = categoriesDeleted;
        this.categoriesDeactivated = categoriesDeactivated;
    }

    public int getProductsDeleted() {
        return productsDeleted;
    }

    public void setProductsDeleted(int productsDeleted) {
        this.productsDeleted = productsDeleted;
    }

    public int getProductsDeactivated() {
        return productsDeactivated;
    }

    public void setProductsDeactivated(int productsDeactivated) {
        this.productsDeactivated = productsDeactivated;
    }

    public int getCategoriesDeleted() {
        return categoriesDeleted;
    }

    public void setCategoriesDeleted(int categoriesDeleted) {
        this.categoriesDeleted = categoriesDeleted;
    }

    public int getCategoriesDeactivated() {
        return categoriesDeactivated;
    }

    public void setCategoriesDeactivated(int categoriesDeactivated) {
        this.categoriesDeactivated = categoriesDeactivated;
    }
}