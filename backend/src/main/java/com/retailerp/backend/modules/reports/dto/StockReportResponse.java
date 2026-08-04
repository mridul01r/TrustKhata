package com.retailerp.backend.modules.reports.dto;

import java.math.BigDecimal;
import java.util.List;

public class StockReportResponse {

    private final BigDecimal totalStockValue;
    private final List<ProductValuationDto> valuation;
    private final List<LowStockDto> lowStock;
    private final List<DeadStockDto> deadStock;

    public StockReportResponse(BigDecimal totalStockValue, List<ProductValuationDto> valuation,
                                List<LowStockDto> lowStock, List<DeadStockDto> deadStock) {
        this.totalStockValue = totalStockValue;
        this.valuation = valuation;
        this.lowStock = lowStock;
        this.deadStock = deadStock;
    }

    public BigDecimal getTotalStockValue() {
        return totalStockValue;
    }

    public List<ProductValuationDto> getValuation() {
        return valuation;
    }

    public List<LowStockDto> getLowStock() {
        return lowStock;
    }

    public List<DeadStockDto> getDeadStock() {
        return deadStock;
    }
}