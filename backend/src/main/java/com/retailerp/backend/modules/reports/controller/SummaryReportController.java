package com.retailerp.backend.modules.reports.controller;

import com.retailerp.backend.modules.auth.security.AuthenticatedUser;
import com.retailerp.backend.modules.reports.dto.SummaryReportDetail;
import com.retailerp.backend.modules.reports.dto.SummaryReportResponse;
import com.retailerp.backend.modules.reports.service.SummaryReportExcelService;
import com.retailerp.backend.modules.reports.service.SummaryReportPdfService;
import com.retailerp.backend.modules.reports.service.SummaryReportService;
import com.retailerp.backend.modules.settings.service.BusinessSettingsService;
import org.openpdf.text.DocumentException;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/reports/summary")
public class SummaryReportController {

    private final SummaryReportService service;
    private final SummaryReportPdfService pdfService;
    private final SummaryReportExcelService excelService;
    private final BusinessSettingsService businessSettingsService;

    public SummaryReportController(
            SummaryReportService service,
            SummaryReportPdfService pdfService,
            SummaryReportExcelService excelService,
            BusinessSettingsService businessSettingsService) {
        this.service = service;
        this.pdfService = pdfService;
        this.excelService = excelService;
        this.businessSettingsService = businessSettingsService;
    }

    @GetMapping
    public SummaryReportResponse getSummaryReport(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return service.getSummaryReport(user.getTenantId(), from, to);
    }

    @GetMapping(value = "/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> downloadPdf(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) throws DocumentException {

        SummaryReportDetail detail = service.getFullDetail(user.getTenantId(), from, to);
        String businessName = resolveBusinessName(user.getTenantId());
        byte[] pdfBytes = pdfService.generate(businessName, detail);

        String filename = "summary-report-" + from + "-to-" + to + ".pdf";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }

    @GetMapping(value = "/excel", produces = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    public ResponseEntity<byte[]> downloadExcel(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) throws IOException {

        SummaryReportDetail detail = service.getFullDetail(user.getTenantId(), from, to);
        String businessName = resolveBusinessName(user.getTenantId());
        byte[] excelBytes = excelService.generate(businessName, detail);

        String filename = "summary-report-" + from + "-to-" + to + ".xlsx";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(excelBytes);
    }

    private String resolveBusinessName(java.util.UUID tenantId) {
        String name = businessSettingsService.get(tenantId).getBusinessName();
        return (name == null || name.isBlank()) ? "Business" : name;
    }
}