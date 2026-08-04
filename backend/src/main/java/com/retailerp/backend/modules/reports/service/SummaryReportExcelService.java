package com.retailerp.backend.modules.reports.service;

import com.retailerp.backend.modules.reports.dto.CategoryMarginDto;
import com.retailerp.backend.modules.reports.dto.DailySalesDto;
import com.retailerp.backend.modules.reports.dto.DeadStockDto;
import com.retailerp.backend.modules.reports.dto.HsnSummaryDto;
import com.retailerp.backend.modules.reports.dto.LowStockDto;
import com.retailerp.backend.modules.reports.dto.ProductMarginDto;
import com.retailerp.backend.modules.reports.dto.ProductValuationDto;
import com.retailerp.backend.modules.reports.dto.SummaryReportDetail;
import com.retailerp.backend.modules.reports.dto.TaxRateSummaryDto;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.xssf.usermodel.XSSFSheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.format.DateTimeFormatter;

@Service
public class SummaryReportExcelService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd MMM yyyy");

    public byte[] generate(String businessName, SummaryReportDetail detail) throws IOException {
        try (XSSFWorkbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            CellStyle titleStyle = createTitleStyle(workbook);
            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle labelStyle = createLabelStyle(workbook);

            buildOverviewSheet(workbook, businessName, detail, titleStyle, labelStyle);
            buildDailyBreakdownSheet(workbook, detail, titleStyle, headerStyle);
            buildProductsSheet(workbook, detail, titleStyle, headerStyle);
            buildCategoriesSheet(workbook, detail, titleStyle, headerStyle);
            buildTaxRateSheet(workbook, detail, titleStyle, headerStyle);
            buildHsnSheet(workbook, detail, titleStyle, headerStyle);
            buildStockValuationSheet(workbook, detail, titleStyle, headerStyle);
            buildLowStockSheet(workbook, detail, titleStyle, headerStyle);
            buildDeadStockSheet(workbook, detail, titleStyle, headerStyle);

            workbook.write(out);
            return out.toByteArray();
        }
    }

    private void buildOverviewSheet(XSSFWorkbook workbook, String businessName, SummaryReportDetail detail,
                                     CellStyle titleStyle, CellStyle labelStyle) {
        XSSFSheet sheet = workbook.createSheet("Overview");

        long totalTransactions = detail.getSales().getByDay().stream()
                .mapToLong(DailySalesDto::getSaleCount)
                .sum();

        int rowIdx = 0;
        setCell(sheet.createRow(rowIdx++), 0, businessName + " - Summary Report", titleStyle);
        setCell(sheet.createRow(rowIdx++), 0,
                detail.getPeriodStart().format(DATE_FMT) + " to " + detail.getPeriodEnd().format(DATE_FMT), null);
        rowIdx++;

        rowIdx = addFigureRow(sheet, rowIdx, "Total Sales", currency(detail.getGst().getTotalInvoiceValue()), labelStyle);
        rowIdx = addFigureRow(sheet, rowIdx, "Total GST Collected", currency(detail.getGst().getTotalTax()), labelStyle);
        rowIdx = addFigureRow(sheet, rowIdx, "Total Transactions", String.valueOf(totalTransactions), labelStyle);
        rowIdx = addFigureRow(sheet, rowIdx, "Gross Profit", currency(detail.getMargin().getTotalGrossProfit()), labelStyle);
        rowIdx = addFigureRow(sheet, rowIdx, "Margin", percent(detail.getMargin().getOverallMarginPercent()), labelStyle);
        rowIdx = addFigureRow(sheet, rowIdx, "Stock Value on Hand", currency(detail.getStock().getTotalStockValue()), labelStyle);
        rowIdx = addFigureRow(sheet, rowIdx, "Low Stock Items", String.valueOf(detail.getStock().getLowStock().size()), labelStyle);
        addFigureRow(sheet, rowIdx, "Dead Stock Items", String.valueOf(detail.getStock().getDeadStock().size()), labelStyle);

        sheet.autoSizeColumn(0);
        sheet.autoSizeColumn(1);
    }

    private void buildDailyBreakdownSheet(XSSFWorkbook workbook, SummaryReportDetail detail,
                                           CellStyle titleStyle, CellStyle headerStyle) {
        XSSFSheet sheet = workbook.createSheet("Daily Breakdown");
        int rowIdx = writeTitleAndHeader(sheet, "Daily Breakdown", titleStyle, headerStyle,
                new String[]{"Date", "Revenue", "Sales"});

        for (DailySalesDto day : detail.getSales().getByDay()) {
            Row row = sheet.createRow(rowIdx++);
            setCell(row, 0, day.getDate().format(DATE_FMT), null);
            setCell(row, 1, currency(day.getRevenue()), null);
            setCell(row, 2, String.valueOf(day.getSaleCount()), null);
        }
        finishSheet(sheet, detail.getSales().getByDay().isEmpty(), rowIdx, 3);
    }

    private void buildProductsSheet(XSSFWorkbook workbook, SummaryReportDetail detail,
                                     CellStyle titleStyle, CellStyle headerStyle) {
        XSSFSheet sheet = workbook.createSheet("All Products");
        int rowIdx = writeTitleAndHeader(sheet, "All Products Sold", titleStyle, headerStyle,
                new String[]{"Product", "Qty Sold", "Revenue", "COGS", "Gross Profit", "Margin %"});

        for (ProductMarginDto p : detail.getMargin().getByProduct()) {
            Row row = sheet.createRow(rowIdx++);
            setCell(row, 0, p.getProductName(), null);
            setCell(row, 1, stripTrailingZeros(p.getQuantitySold()), null);
            setCell(row, 2, currency(p.getRevenue()), null);
            setCell(row, 3, currency(p.getCogs()), null);
            setCell(row, 4, currency(p.getGrossProfit()), null);
            setCell(row, 5, percent(p.getMarginPercent()), null);
        }
        finishSheet(sheet, detail.getMargin().getByProduct().isEmpty(), rowIdx, 6);
    }

    private void buildCategoriesSheet(XSSFWorkbook workbook, SummaryReportDetail detail,
                                       CellStyle titleStyle, CellStyle headerStyle) {
        XSSFSheet sheet = workbook.createSheet("Categories");
        int rowIdx = writeTitleAndHeader(sheet, "Category Breakdown", titleStyle, headerStyle,
                new String[]{"Category", "Revenue", "COGS", "Gross Profit", "Margin %"});

        for (CategoryMarginDto c : detail.getMargin().getByCategory()) {
            Row row = sheet.createRow(rowIdx++);
            setCell(row, 0, c.getCategoryName(), null);
            setCell(row, 1, currency(c.getRevenue()), null);
            setCell(row, 2, currency(c.getCogs()), null);
            setCell(row, 3, currency(c.getGrossProfit()), null);
            setCell(row, 4, percent(c.getMarginPercent()), null);
        }
        finishSheet(sheet, detail.getMargin().getByCategory().isEmpty(), rowIdx, 5);
    }

    private void buildTaxRateSheet(XSSFWorkbook workbook, SummaryReportDetail detail,
                                    CellStyle titleStyle, CellStyle headerStyle) {
        XSSFSheet sheet = workbook.createSheet("GST by Tax Rate");
        int rowIdx = writeTitleAndHeader(sheet, "GST - Tax Rate Summary", titleStyle, headerStyle,
                new String[]{"GST Rate", "Taxable Value", "CGST", "SGST", "IGST"});

        for (TaxRateSummaryDto row0 : detail.getGst().getByTaxRate()) {
            Row row = sheet.createRow(rowIdx++);
            setCell(row, 0, percent(row0.getGstRate()), null);
            setCell(row, 1, currency(row0.getTaxableValue()), null);
            setCell(row, 2, currency(row0.getCgst()), null);
            setCell(row, 3, currency(row0.getSgst()), null);
            setCell(row, 4, currency(row0.getIgst()), null);
        }
        finishSheet(sheet, detail.getGst().getByTaxRate().isEmpty(), rowIdx, 5);
    }

    private void buildHsnSheet(XSSFWorkbook workbook, SummaryReportDetail detail,
                                CellStyle titleStyle, CellStyle headerStyle) {
        XSSFSheet sheet = workbook.createSheet("GST by HSN");
        int rowIdx = writeTitleAndHeader(sheet, "GST - HSN Summary", titleStyle, headerStyle,
                new String[]{"HSN Code", "Unit", "GST Rate", "Quantity", "Taxable Value", "CGST", "SGST", "IGST"});

        for (HsnSummaryDto h : detail.getGst().getByHsn()) {
            Row row = sheet.createRow(rowIdx++);
            setCell(row, 0, h.getHsnCode() == null ? "-" : h.getHsnCode(), null);
            setCell(row, 1, h.getUnit(), null);
            setCell(row, 2, percent(h.getGstRate()), null);
            setCell(row, 3, stripTrailingZeros(h.getTotalQuantity()), null);
            setCell(row, 4, currency(h.getTaxableValue()), null);
            setCell(row, 5, currency(h.getCgst()), null);
            setCell(row, 6, currency(h.getSgst()), null);
            setCell(row, 7, currency(h.getIgst()), null);
        }
        finishSheet(sheet, detail.getGst().getByHsn().isEmpty(), rowIdx, 8);
    }

    private void buildStockValuationSheet(XSSFWorkbook workbook, SummaryReportDetail detail,
                                           CellStyle titleStyle, CellStyle headerStyle) {
        XSSFSheet sheet = workbook.createSheet("Stock Valuation");
        int rowIdx = writeTitleAndHeader(sheet, "Stock Valuation", titleStyle, headerStyle,
                new String[]{"Product", "Category", "Unit", "Qty", "Purchase Price", "Stock Value"});

        for (ProductValuationDto p : detail.getStock().getValuation()) {
            Row row = sheet.createRow(rowIdx++);
            setCell(row, 0, p.getProductName(), null);
            setCell(row, 1, p.getCategoryName() == null ? "-" : p.getCategoryName(), null);
            setCell(row, 2, p.getUnit(), null);
            setCell(row, 3, stripTrailingZeros(p.getStockQuantity()), null);
            setCell(row, 4, currency(p.getPurchasePrice()), null);
            setCell(row, 5, currency(p.getStockValue()), null);
        }
        finishSheet(sheet, detail.getStock().getValuation().isEmpty(), rowIdx, 6);
    }

    private void buildLowStockSheet(XSSFWorkbook workbook, SummaryReportDetail detail,
                                     CellStyle titleStyle, CellStyle headerStyle) {
        XSSFSheet sheet = workbook.createSheet("Low Stock");
        int rowIdx = writeTitleAndHeader(sheet, "Low Stock Items", titleStyle, headerStyle,
                new String[]{"Product", "Unit", "Stock Qty", "Reorder Level"});

        for (LowStockDto p : detail.getStock().getLowStock()) {
            Row row = sheet.createRow(rowIdx++);
            setCell(row, 0, p.getProductName(), null);
            setCell(row, 1, p.getUnit(), null);
            setCell(row, 2, stripTrailingZeros(p.getStockQuantity()), null);
            setCell(row, 3, stripTrailingZeros(p.getReorderLevel()), null);
        }
        finishSheet(sheet, detail.getStock().getLowStock().isEmpty(), rowIdx, 4);
    }

    private void buildDeadStockSheet(XSSFWorkbook workbook, SummaryReportDetail detail,
                                      CellStyle titleStyle, CellStyle headerStyle) {
        XSSFSheet sheet = workbook.createSheet("Dead Stock");
        int rowIdx = writeTitleAndHeader(sheet, "Dead Stock Items", titleStyle, headerStyle,
                new String[]{"Product", "Unit", "Stock Qty", "Last Sold"});

        for (DeadStockDto p : detail.getStock().getDeadStock()) {
            Row row = sheet.createRow(rowIdx++);
            setCell(row, 0, p.getProductName(), null);
            setCell(row, 1, p.getUnit(), null);
            setCell(row, 2, stripTrailingZeros(p.getStockQuantity()), null);
            setCell(row, 3, p.getLastSoldAt() == null ? "Never" : p.getLastSoldAt().format(DATE_FMT), null);
        }
        finishSheet(sheet, detail.getStock().getDeadStock().isEmpty(), rowIdx, 4);
    }

    private int writeTitleAndHeader(XSSFSheet sheet, String title, CellStyle titleStyle, CellStyle headerStyle,
                                     String[] headers) {
        int rowIdx = 0;
        setCell(sheet.createRow(rowIdx++), 0, title, titleStyle);
        rowIdx++;

        Row headerRow = sheet.createRow(rowIdx++);
        for (int i = 0; i < headers.length; i++) {
            setCell(headerRow, i, headers[i], headerStyle);
        }
        return rowIdx;
    }

    private void finishSheet(XSSFSheet sheet, boolean isEmpty, int rowIdx, int columnCount) {
        if (isEmpty) {
            setCell(sheet.createRow(rowIdx), 0, "No data in this period", null);
        }
        for (int col = 0; col < columnCount; col++) {
            sheet.autoSizeColumn(col);
        }
    }

    private int addFigureRow(XSSFSheet sheet, int rowIdx, String label, String value, CellStyle labelStyle) {
        Row row = sheet.createRow(rowIdx);
        setCell(row, 0, label, labelStyle);
        setCell(row, 1, value, null);
        return rowIdx + 1;
    }

    private void setCell(Row row, int col, String value, CellStyle style) {
        Cell cell = row.createCell(col);
        cell.setCellValue(value);
        if (style != null) {
            cell.setCellStyle(style);
        }
    }

    private CellStyle createTitleStyle(XSSFWorkbook workbook) {
        Font font = workbook.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 14);
        CellStyle style = workbook.createCellStyle();
        style.setFont(font);
        return style;
    }

    private CellStyle createHeaderStyle(XSSFWorkbook workbook) {
        Font font = workbook.createFont();
        font.setBold(true);
        CellStyle style = workbook.createCellStyle();
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setFillPattern(org.apache.poi.ss.usermodel.FillPatternType.SOLID_FOREGROUND);
        return style;
    }

    private CellStyle createLabelStyle(XSSFWorkbook workbook) {
        Font font = workbook.createFont();
        font.setBold(true);
        CellStyle style = workbook.createCellStyle();
        style.setFont(font);
        return style;
    }

    private String currency(BigDecimal value) {
        if (value == null) {
            return "₹0.00";
        }
        return "₹" + value.setScale(2, RoundingMode.HALF_UP).toPlainString();
    }

    private String percent(BigDecimal value) {
        if (value == null) {
            return "0%";
        }
        return value.setScale(2, RoundingMode.HALF_UP).toPlainString() + "%";
    }

    private String stripTrailingZeros(BigDecimal value) {
        if (value == null) {
            return "0";
        }
        return value.stripTrailingZeros().toPlainString();
    }
}