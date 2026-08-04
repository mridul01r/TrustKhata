package com.retailerp.backend.modules.inventory.controller;

import com.retailerp.backend.modules.auth.security.AuthenticatedUser;
import com.retailerp.backend.modules.inventory.dto.ImportSummaryResponse;
import com.retailerp.backend.modules.inventory.service.ExcelImportService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/inventory/import")
public class ImportController {

    private final ExcelImportService excelImportService;

    public ImportController(ExcelImportService excelImportService) {
        this.excelImportService = excelImportService;
    }

    @PostMapping("/preview")
    public ImportSummaryResponse preview(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam("file") MultipartFile file) {
        return excelImportService.preview(user.getTenantId(), file);
    }

    @PostMapping("/commit")
    public ImportSummaryResponse commit(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam("file") MultipartFile file) {
        return excelImportService.commit(user.getTenantId(), file);
    }
}