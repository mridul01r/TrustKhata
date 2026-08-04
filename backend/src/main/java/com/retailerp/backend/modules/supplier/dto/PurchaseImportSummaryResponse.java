package com.retailerp.backend.modules.supplier.dto;

import java.util.List;

public record PurchaseImportSummaryResponse(List<PurchaseImportRowResult> rows) {
}