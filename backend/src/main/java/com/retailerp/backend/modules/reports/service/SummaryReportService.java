package com.retailerp.backend.modules.reports.service;

import com.retailerp.backend.modules.reports.dto.BestSellingProductDto;
import com.retailerp.backend.modules.reports.dto.DailySalesDto;
import com.retailerp.backend.modules.reports.dto.GstReportResponse;
import com.retailerp.backend.modules.reports.dto.MarginReportResponse;
import com.retailerp.backend.modules.reports.dto.SalesAnalyticsResponse;
import com.retailerp.backend.modules.reports.dto.StockReportResponse;
import com.retailerp.backend.modules.reports.dto.SummaryReportDetail;
import com.retailerp.backend.modules.reports.dto.SummaryReportResponse;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
public class SummaryReportService {

    private final SalesAnalyticsService salesAnalyticsService;
    private final GstReportService gstReportService;
    private final MarginReportService marginReportService;
    private final StockReportService stockReportService;

    public SummaryReportService(
            SalesAnalyticsService salesAnalyticsService,
            GstReportService gstReportService,
            MarginReportService marginReportService,
            StockReportService stockReportService) {
        this.salesAnalyticsService = salesAnalyticsService;
        this.gstReportService = gstReportService;
        this.marginReportService = marginReportService;
        this.stockReportService = stockReportService;
    }

    public SummaryReportResponse getSummaryReport(UUID tenantId, LocalDate from, LocalDate to) {
        LocalDateTime start = from.atStartOfDay();
        LocalDateTime end = to.atTime(23, 59, 59);

        SalesAnalyticsResponse sales = salesAnalyticsService.getAnalytics(tenantId, start, end);
        GstReportResponse gst = gstReportService.getGstReport(tenantId, start, end);
        MarginReportResponse margin = marginReportService.getMarginReport(tenantId, start, end);
        // deadStockDays: 90 is used as a sensible general-purpose default for a periodic summary
        StockReportResponse stock = stockReportService.getStockReport(tenantId, 90);

        long totalTransactions = sales.getByDay().stream()
                .mapToLong(DailySalesDto::getSaleCount)
                .sum();

        List<BestSellingProductDto> topProducts = sales.getBestSellers().stream()
                .limit(5)
                .toList();

        // Previous period: same number of days, immediately preceding `from`.
        long periodLengthDays = ChronoUnit.DAYS.between(from, to) + 1;
        LocalDate previousTo = from.minusDays(1);
        LocalDate previousFrom = previousTo.minusDays(periodLengthDays - 1);
        LocalDateTime previousStart = previousFrom.atStartOfDay();
        LocalDateTime previousEnd = previousTo.atTime(23, 59, 59);

        SalesAnalyticsResponse previousSales = salesAnalyticsService.getAnalytics(tenantId, previousStart, previousEnd);
        GstReportResponse previousGst = gstReportService.getGstReport(tenantId, previousStart, previousEnd);
        MarginReportResponse previousMargin = marginReportService.getMarginReport(tenantId, previousStart, previousEnd);

        long previousTotalTransactions = previousSales.getByDay().stream()
                .mapToLong(DailySalesDto::getSaleCount)
                .sum();

        return new SummaryReportResponse(
                from,
                to,
                gst.getTotalInvoiceValue(),
                gst.getTotalTax(),
                totalTransactions,
                margin.getTotalGrossProfit(),
                margin.getOverallMarginPercent(),
                topProducts,
                sales.getByDay(),
                stock.getTotalStockValue(),
                stock.getLowStock().size(),
                stock.getDeadStock().size(),
                previousGst.getTotalInvoiceValue(),
                previousTotalTransactions,
                previousMargin.getTotalGrossProfit(),
                previousMargin.getOverallMarginPercent()
        );
    }

    /** Full underlying data for downloadable PDF/Excel exports - not the condensed on-screen summary. */
    public SummaryReportDetail getFullDetail(UUID tenantId, LocalDate from, LocalDate to) {
        LocalDateTime start = from.atStartOfDay();
        LocalDateTime end = to.atTime(23, 59, 59);

        SalesAnalyticsResponse sales = salesAnalyticsService.getAnalytics(tenantId, start, end);
        GstReportResponse gst = gstReportService.getGstReport(tenantId, start, end);
        MarginReportResponse margin = marginReportService.getMarginReport(tenantId, start, end);
        StockReportResponse stock = stockReportService.getStockReport(tenantId, 90);

        return new SummaryReportDetail(from, to, sales, gst, margin, stock);
    }
}