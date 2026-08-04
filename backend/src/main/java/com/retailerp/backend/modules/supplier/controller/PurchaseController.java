package com.retailerp.backend.modules.supplier.controller;

import com.retailerp.backend.modules.auth.security.AuthenticatedUser;
import com.retailerp.backend.modules.settings.dto.BusinessSettingsResponse;
import com.retailerp.backend.modules.settings.service.BusinessSettingsService;
import com.retailerp.backend.modules.supplier.dto.PurchaseImportSummaryResponse;
import com.retailerp.backend.modules.supplier.dto.PurchaseRequest;
import com.retailerp.backend.modules.supplier.dto.PurchaseResponse;
import com.retailerp.backend.modules.supplier.service.PurchaseImportService;
import com.retailerp.backend.modules.supplier.service.PurchasePdfService;
import com.retailerp.backend.modules.supplier.service.PurchaseService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/purchases")
@RequiredArgsConstructor
public class PurchaseController {

    private final PurchaseService purchaseService;
    private final PurchaseImportService purchaseImportService;
    private final PurchasePdfService purchasePdfService;
    private final BusinessSettingsService businessSettingsService;

    @GetMapping
    public List<PurchaseResponse> list(@AuthenticationPrincipal AuthenticatedUser user,
                                        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return purchaseService.listPurchases(user.getTenantId(), from, to);
    }

    @GetMapping("/{id}")
    public PurchaseResponse get(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable UUID id) {
        return purchaseService.getPurchase(user.getTenantId(), id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PurchaseResponse create(@AuthenticationPrincipal AuthenticatedUser user,
                                    @Valid @RequestBody PurchaseRequest request) {
        return purchaseService.createPurchase(user.getTenantId(), user.getUserId(), request);
    }

    // Bulk-import for the line-items table when recording a purchase: Product Name,
    // Quantity, Cost, optional Category. Preview reports what would happen without
    // touching the database; commit actually creates any missing products and
    // returns every row resolved to a real productId for the frontend to use.
    @PostMapping("/import/preview")
    public PurchaseImportSummaryResponse importPreview(@AuthenticationPrincipal AuthenticatedUser user,
                                                        @RequestParam("file") MultipartFile file) {
        return purchaseImportService.preview(user.getTenantId(), file);
    }

    @PostMapping("/import/commit")
    public PurchaseImportSummaryResponse importCommit(@AuthenticationPrincipal AuthenticatedUser user,
                                                       @RequestParam("file") MultipartFile file) {
        return purchaseImportService.commit(user.getTenantId(), file);
    }

    // Downloadable PDF bill for a single recorded purchase, with the tenant's
    // own business name/address/GSTIN as letterhead - same OpenPDF approach as
    // the Tax Invoice / Summary Report PDFs.
    @GetMapping("/{id}/pdf")
    public void downloadPdf(@AuthenticationPrincipal AuthenticatedUser user,
                             @PathVariable UUID id,
                             HttpServletResponse response) throws IOException {
        PurchaseResponse purchase = purchaseService.getPurchase(user.getTenantId(), id);
        BusinessSettingsResponse settings = businessSettingsService.get(user.getTenantId());

        byte[] pdf = purchasePdfService.generate(
                settings.getBusinessName(),
                buildAddress(settings),
                settings.getGstin(),
                purchase
        );

        response.setContentType("application/pdf");
        response.setHeader("Content-Disposition", "attachment; filename=\"purchase-" + id + ".pdf\"");
        response.setContentLength(pdf.length);
        response.getOutputStream().write(pdf);
        response.getOutputStream().flush();
    }

    // BusinessSettings stores address as separate line1/line2/city/state/pincode
    // fields rather than one combined string - join whichever parts are non-blank.
    private String buildAddress(BusinessSettingsResponse settings) {
        StringBuilder sb = new StringBuilder();
        appendPart(sb, settings.getAddressLine1());
        appendPart(sb, settings.getAddressLine2());
        appendPart(sb, settings.getCity());
        appendPart(sb, settings.getState());
        appendPart(sb, settings.getPincode());
        return sb.toString();
    }

    private void appendPart(StringBuilder sb, String part) {
        if (part != null && !part.isBlank()) {
            if (sb.length() > 0) {
                sb.append(", ");
            }
            sb.append(part.trim());
        }
    }
}