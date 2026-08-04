package com.retailerp.backend.modules.reports.dto;

import java.time.LocalDate;

public class SummaryReportDetail {

    private final LocalDate periodStart;
    private final LocalDate periodEnd;
    private final SalesAnalyticsResponse sales;
    private final GstReportResponse gst;
    private final MarginReportResponse margin;
    private final StockReportResponse stock;

    public SummaryReportDetail(LocalDate periodStart, LocalDate periodEnd, SalesAnalyticsResponse sales,
                                GstReportResponse gst, MarginReportResponse margin, StockReportResponse stock) {
        this.periodStart = periodStart;
        this.periodEnd = periodEnd;
        this.sales = sales;
        this.gst = gst;
        this.margin = margin;
        this.stock = stock;
    }

    public LocalDate getPeriodStart() {
        return periodStart;
    }

    public LocalDate getPeriodEnd() {
        return periodEnd;
    }

    public SalesAnalyticsResponse getSales() {
        return sales;
    }

    public GstReportResponse getGst() {
        return gst;
    }

    public MarginReportResponse getMargin() {
        return margin;
    }

    public StockReportResponse getStock() {
        return stock;
    }
}