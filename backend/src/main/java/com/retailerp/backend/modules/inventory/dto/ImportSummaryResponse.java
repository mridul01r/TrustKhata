package com.retailerp.backend.modules.inventory.dto;

import java.util.List;

public class ImportSummaryResponse {

    private List<ImportRowResult> rows;
    private int totalRows;
    private int newCategories;
    private int newProducts;
    private int updatedProducts;
    private int errorCount;

    public ImportSummaryResponse() {
    }

    public ImportSummaryResponse(List<ImportRowResult> rows) {
        this.rows = rows;
        this.totalRows = rows.size();
        this.newCategories = (int) rows.stream().filter(ImportRowResult::isCategoryIsNew).map(ImportRowResult::getCategoryName).distinct().count();
        this.newProducts = (int) rows.stream().filter(r -> r.getProductAction() == ImportRowResult.Action.CREATE).count();
        this.updatedProducts = (int) rows.stream().filter(r -> r.getProductAction() == ImportRowResult.Action.UPDATE).count();
        this.errorCount = (int) rows.stream().filter(r -> r.getProductAction() == ImportRowResult.Action.ERROR).count();
    }

    public List<ImportRowResult> getRows() {
        return rows;
    }

    public void setRows(List<ImportRowResult> rows) {
        this.rows = rows;
    }

    public int getTotalRows() {
        return totalRows;
    }

    public void setTotalRows(int totalRows) {
        this.totalRows = totalRows;
    }

    public int getNewCategories() {
        return newCategories;
    }

    public void setNewCategories(int newCategories) {
        this.newCategories = newCategories;
    }

    public int getNewProducts() {
        return newProducts;
    }

    public void setNewProducts(int newProducts) {
        this.newProducts = newProducts;
    }

    public int getUpdatedProducts() {
        return updatedProducts;
    }

    public void setUpdatedProducts(int updatedProducts) {
        this.updatedProducts = updatedProducts;
    }

    public int getErrorCount() {
        return errorCount;
    }

    public void setErrorCount(int errorCount) {
        this.errorCount = errorCount;
    }
}