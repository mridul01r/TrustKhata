package com.retailerp.backend.modules.reports.controller;

import com.retailerp.backend.modules.auth.security.AuthenticatedUser;
import com.retailerp.backend.modules.reports.dto.SalesAnalyticsResponse;
import com.retailerp.backend.modules.reports.service.SalesAnalyticsService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/reports/sales-analytics")
public class SalesAnalyticsController {

    private final SalesAnalyticsService service;

    public SalesAnalyticsController(SalesAnalyticsService service) {
        this.service = service;
    }

    @GetMapping
    public SalesAnalyticsResponse getAnalytics(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        LocalDateTime start = from.atStartOfDay();
        LocalDateTime end = to.atTime(23, 59, 59);
        return service.getAnalytics(user.getTenantId(), start, end);
    }
}