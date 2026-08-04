package com.retailerp.backend.modules.accounting.controller;

import com.retailerp.backend.modules.accounting.dto.LedgerEntryDto;
import com.retailerp.backend.modules.accounting.dto.ProfitLossResponse;
import com.retailerp.backend.modules.accounting.service.LedgerService;
import com.retailerp.backend.modules.accounting.service.ProfitLossService;
import com.retailerp.backend.modules.auth.security.AuthenticatedUser;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/accounting/reports")
@RequiredArgsConstructor
public class AccountingReportController {

    private final LedgerService ledgerService;
    private final ProfitLossService profitLossService;

    @GetMapping("/day-book")
    public List<LedgerEntryDto> dayBook(@AuthenticationPrincipal AuthenticatedUser user,
                                         @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                         @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ledgerService.getDayBook(user.getTenantId(), from, to);
    }

    @GetMapping("/profit-loss")
    public ProfitLossResponse profitLoss(@AuthenticationPrincipal AuthenticatedUser user,
                                          @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                          @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return profitLossService.getProfitLoss(user.getTenantId(), from, to);
    }
}