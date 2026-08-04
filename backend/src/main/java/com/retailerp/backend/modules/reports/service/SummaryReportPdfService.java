package com.retailerp.backend.modules.reports.service;

import com.retailerp.backend.common.pdf.PdfFonts;
import com.retailerp.backend.modules.reports.dto.CategoryMarginDto;
import com.retailerp.backend.modules.reports.dto.DailySalesDto;
import com.retailerp.backend.modules.reports.dto.DeadStockDto;
import com.retailerp.backend.modules.reports.dto.HsnSummaryDto;
import com.retailerp.backend.modules.reports.dto.LowStockDto;
import com.retailerp.backend.modules.reports.dto.ProductMarginDto;
import com.retailerp.backend.modules.reports.dto.ProductValuationDto;
import com.retailerp.backend.modules.reports.dto.SummaryReportDetail;
import com.retailerp.backend.modules.reports.dto.TaxRateSummaryDto;
import org.openpdf.text.Document;
import org.openpdf.text.DocumentException;
import org.openpdf.text.Element;
import org.openpdf.text.Font;
import org.openpdf.text.PageSize;
import org.openpdf.text.Paragraph;
import org.openpdf.text.Phrase;
import org.openpdf.text.Rectangle;
import org.openpdf.text.pdf.PdfPCell;
import org.openpdf.text.pdf.PdfPTable;
import org.openpdf.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.format.DateTimeFormatter;

@Service
public class SummaryReportPdfService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd MMM yyyy");

    private final Font titleFont = PdfFonts.bold(18);
    private final Font sectionFont = PdfFonts.bold(13);
    private final Font headerCellFont = PdfFonts.bold(9);
    private final Font bodyCellFont = PdfFonts.regular(9);
    private final Font mutedFont = PdfFonts.regular(9);

    public byte[] generate(String businessName, SummaryReportDetail detail) throws DocumentException {
        Document document = new Document(PageSize.A4, 36, 36, 36, 36);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PdfWriter.getInstance(document, out);
        document.open();

        Paragraph title = new Paragraph(businessName + " - Summary Report", titleFont);
        title.setSpacingAfter(4);
        document.add(title);

        Paragraph period = new Paragraph(
                detail.getPeriodStart().format(DATE_FMT) + " to " + detail.getPeriodEnd().format(DATE_FMT),
                mutedFont);
        period.setSpacingAfter(18);
        document.add(period);

        document.add(buildOverviewTable(detail));

        addSectionHeader(document, "Daily Breakdown", true);
        document.add(buildDailyBreakdownTable(detail));

        document.newPage();
        addSectionHeader(document, "All Products Sold", false);
        document.add(buildProductsTable(detail));

        addSectionHeader(document, "Category Breakdown", true);
        document.add(buildCategoriesTable(detail));

        document.newPage();
        addSectionHeader(document, "GST - Tax Rate Summary", false);
        document.add(buildTaxRateTable(detail));

        addSectionHeader(document, "GST - HSN Summary", true);
        document.add(buildHsnTable(detail));

        document.newPage();
        addSectionHeader(document, "Stock Valuation", false);
        document.add(buildStockValuationTable(detail));

        addSectionHeader(document, "Low Stock Items", true);
        document.add(buildLowStockTable(detail));

        addSectionHeader(document, "Dead Stock Items", true);
        document.add(buildDeadStockTable(detail));

        document.close();
        return out.toByteArray();
    }

    private void addSectionHeader(Document document, String text, boolean spacingBefore) throws DocumentException {
        Paragraph header = new Paragraph(text, sectionFont);
        if (spacingBefore) {
            header.setSpacingBefore(16);
        }
        header.setSpacingAfter(6);
        document.add(header);
    }

    private PdfPTable buildOverviewTable(SummaryReportDetail detail) {
        long totalTransactions = detail.getSales().getByDay().stream()
                .mapToLong(DailySalesDto::getSaleCount)
                .sum();

        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(100);
        table.setSpacingAfter(10);

        addFigureRow(table, "Total Sales", currency(detail.getGst().getTotalInvoiceValue()));
        addFigureRow(table, "Total GST Collected", currency(detail.getGst().getTotalTax()));
        addFigureRow(table, "Total Transactions", String.valueOf(totalTransactions));
        addFigureRow(table, "Gross Profit", currency(detail.getMargin().getTotalGrossProfit()));
        addFigureRow(table, "Margin", percent(detail.getMargin().getOverallMarginPercent()));
        addFigureRow(table, "Stock Value on Hand", currency(detail.getStock().getTotalStockValue()));
        addFigureRow(table, "Low Stock Items", String.valueOf(detail.getStock().getLowStock().size()));
        addFigureRow(table, "Dead Stock Items", String.valueOf(detail.getStock().getDeadStock().size()));

        return table;
    }

    private PdfPTable buildDailyBreakdownTable(SummaryReportDetail detail) {
        PdfPTable table = new PdfPTable(3);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{2f, 1.5f, 1.5f});
        table.setSpacingAfter(10);

        addHeaderCell(table, "Date");
        addHeaderCell(table, "Revenue");
        addHeaderCell(table, "Sales");

        if (detail.getSales().getByDay().isEmpty()) {
            addEmptyRow(table, 3);
        } else {
            for (DailySalesDto day : detail.getSales().getByDay()) {
                addBodyCell(table, day.getDate().format(DATE_FMT));
                addBodyCell(table, currency(day.getRevenue()));
                addBodyCell(table, String.valueOf(day.getSaleCount()));
            }
        }

        return table;
    }

    private PdfPTable buildProductsTable(SummaryReportDetail detail) {
        PdfPTable table = new PdfPTable(5);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{3f, 1f, 1.3f, 1.3f, 1.3f});
        table.setSpacingAfter(10);

        addHeaderCell(table, "Product");
        addHeaderCell(table, "Qty Sold");
        addHeaderCell(table, "Revenue");
        addHeaderCell(table, "Gross Profit");
        addHeaderCell(table, "Margin");

        if (detail.getMargin().getByProduct().isEmpty()) {
            addEmptyRow(table, 5);
        } else {
            for (ProductMarginDto p : detail.getMargin().getByProduct()) {
                addBodyCell(table, p.getProductName());
                addBodyCell(table, stripTrailingZeros(p.getQuantitySold()));
                addBodyCell(table, currency(p.getRevenue()));
                addBodyCell(table, currency(p.getGrossProfit()));
                addBodyCell(table, percent(p.getMarginPercent()));
            }
        }

        return table;
    }

    private PdfPTable buildCategoriesTable(SummaryReportDetail detail) {
        PdfPTable table = new PdfPTable(4);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{3f, 1.3f, 1.3f, 1.3f});
        table.setSpacingAfter(10);

        addHeaderCell(table, "Category");
        addHeaderCell(table, "Revenue");
        addHeaderCell(table, "Gross Profit");
        addHeaderCell(table, "Margin");

        if (detail.getMargin().getByCategory().isEmpty()) {
            addEmptyRow(table, 4);
        } else {
            for (CategoryMarginDto c : detail.getMargin().getByCategory()) {
                addBodyCell(table, c.getCategoryName());
                addBodyCell(table, currency(c.getRevenue()));
                addBodyCell(table, currency(c.getGrossProfit()));
                addBodyCell(table, percent(c.getMarginPercent()));
            }
        }

        return table;
    }

    private PdfPTable buildTaxRateTable(SummaryReportDetail detail) {
        PdfPTable table = new PdfPTable(4);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{1f, 1.5f, 1.2f, 1.2f});
        table.setSpacingAfter(10);

        addHeaderCell(table, "GST Rate");
        addHeaderCell(table, "Taxable Value");
        addHeaderCell(table, "CGST");
        addHeaderCell(table, "SGST");

        if (detail.getGst().getByTaxRate().isEmpty()) {
            addEmptyRow(table, 4);
        } else {
            for (TaxRateSummaryDto row0 : detail.getGst().getByTaxRate()) {
                addBodyCell(table, percent(row0.getGstRate()));
                addBodyCell(table, currency(row0.getTaxableValue()));
                addBodyCell(table, currency(row0.getCgst()));
                addBodyCell(table, currency(row0.getSgst()));
            }
        }

        return table;
    }

    private PdfPTable buildHsnTable(SummaryReportDetail detail) {
        PdfPTable table = new PdfPTable(5);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{1.3f, 0.8f, 0.8f, 1f, 1.5f});
        table.setSpacingAfter(10);

        addHeaderCell(table, "HSN Code");
        addHeaderCell(table, "Unit");
        addHeaderCell(table, "Rate");
        addHeaderCell(table, "Quantity");
        addHeaderCell(table, "Taxable Value");

        if (detail.getGst().getByHsn().isEmpty()) {
            addEmptyRow(table, 5);
        } else {
            for (HsnSummaryDto row : detail.getGst().getByHsn()) {
                addBodyCell(table, row.getHsnCode() == null ? "-" : row.getHsnCode());
                addBodyCell(table, row.getUnit());
                addBodyCell(table, percent(row.getGstRate()));
                addBodyCell(table, stripTrailingZeros(row.getTotalQuantity()));
                addBodyCell(table, currency(row.getTaxableValue()));
            }
        }

        return table;
    }

    private PdfPTable buildStockValuationTable(SummaryReportDetail detail) {
        PdfPTable table = new PdfPTable(5);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{2.5f, 1.5f, 1f, 1f, 1.3f});
        table.setSpacingAfter(10);

        addHeaderCell(table, "Product");
        addHeaderCell(table, "Category");
        addHeaderCell(table, "Qty");
        addHeaderCell(table, "Purchase Price");
        addHeaderCell(table, "Stock Value");

        if (detail.getStock().getValuation().isEmpty()) {
            addEmptyRow(table, 5);
        } else {
            for (ProductValuationDto p : detail.getStock().getValuation()) {
                addBodyCell(table, p.getProductName());
                addBodyCell(table, p.getCategoryName() == null ? "-" : p.getCategoryName());
                addBodyCell(table, stripTrailingZeros(p.getStockQuantity()));
                addBodyCell(table, currency(p.getPurchasePrice()));
                addBodyCell(table, currency(p.getStockValue()));
            }
        }

        return table;
    }

    private PdfPTable buildLowStockTable(SummaryReportDetail detail) {
        PdfPTable table = new PdfPTable(4);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{3f, 1f, 1f, 1.3f});
        table.setSpacingAfter(10);

        addHeaderCell(table, "Product");
        addHeaderCell(table, "Unit");
        addHeaderCell(table, "Stock Qty");
        addHeaderCell(table, "Reorder Level");

        if (detail.getStock().getLowStock().isEmpty()) {
            addEmptyRow(table, 4);
        } else {
            for (LowStockDto p : detail.getStock().getLowStock()) {
                addBodyCell(table, p.getProductName());
                addBodyCell(table, p.getUnit());
                addBodyCell(table, stripTrailingZeros(p.getStockQuantity()));
                addBodyCell(table, stripTrailingZeros(p.getReorderLevel()));
            }
        }

        return table;
    }

    private PdfPTable buildDeadStockTable(SummaryReportDetail detail) {
        PdfPTable table = new PdfPTable(4);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{3f, 1f, 1f, 1.5f});
        table.setSpacingAfter(10);

        addHeaderCell(table, "Product");
        addHeaderCell(table, "Unit");
        addHeaderCell(table, "Stock Qty");
        addHeaderCell(table, "Last Sold");

        if (detail.getStock().getDeadStock().isEmpty()) {
            addEmptyRow(table, 4);
        } else {
            for (DeadStockDto p : detail.getStock().getDeadStock()) {
                addBodyCell(table, p.getProductName());
                addBodyCell(table, p.getUnit());
                addBodyCell(table, stripTrailingZeros(p.getStockQuantity()));
                addBodyCell(table, p.getLastSoldAt() == null ? "Never" : p.getLastSoldAt().format(DATE_FMT));
            }
        }

        return table;
    }

    private void addFigureRow(PdfPTable table, String label, String value) {
        PdfPCell labelCell = new PdfPCell(new Phrase(label, bodyCellFont));
        labelCell.setBorder(Rectangle.BOTTOM);
        labelCell.setPadding(5);

        PdfPCell valueCell = new PdfPCell(new Phrase(value, headerCellFont));
        valueCell.setBorder(Rectangle.BOTTOM);
        valueCell.setPadding(5);
        valueCell.setHorizontalAlignment(Element.ALIGN_RIGHT);

        table.addCell(labelCell);
        table.addCell(valueCell);
    }

    private void addHeaderCell(PdfPTable table, String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text, headerCellFont));
        cell.setPadding(5);
        cell.setGrayFill(0.9f);
        table.addCell(cell);
    }

    private void addBodyCell(PdfPTable table, String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text, bodyCellFont));
        cell.setPadding(5);
        table.addCell(cell);
    }

    private void addEmptyRow(PdfPTable table, int colspan) {
        PdfPCell empty = new PdfPCell(new Phrase("No data in this period", mutedFont));
        empty.setColspan(colspan);
        empty.setPadding(6);
        table.addCell(empty);
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