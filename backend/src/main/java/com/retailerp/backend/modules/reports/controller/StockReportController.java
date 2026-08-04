package com.retailerp.backend.modules.reports.controller;

import com.retailerp.backend.modules.auth.security.AuthenticatedUser;
import com.retailerp.backend.modules.reports.dto.StockReportResponse;
import com.retailerp.backend.modules.reports.service.StockReportService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports/stock")
public class StockReportController {

    private final StockReportService service;

    public StockReportController(StockReportService service) {
        this.service = service;
    }

    @GetMapping
    public StockReportResponse getStockReport(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam(defaultValue = "60") int deadStockDays) {
        return service.getStockReport(user.getTenantId(), deadStockDays);
    }
}