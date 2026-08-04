package com.retailerp.backend.modules.supplier.service;

import com.retailerp.backend.common.pdf.PdfFonts;
import com.retailerp.backend.modules.supplier.dto.PurchaseItemResponse;
import com.retailerp.backend.modules.supplier.dto.PurchaseResponse;
import org.openpdf.text.*;
import org.openpdf.text.pdf.PdfPCell;
import org.openpdf.text.pdf.PdfPTable;
import org.openpdf.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;

/**
 * Generates a downloadable PDF bill for a single recorded Purchase - the
 * business's own copy of what was bought, with its own letterhead info at
 * the top. Same OpenPDF approach as SummaryReportPdfService/Tax Invoice;
 * uses PdfFonts (bundled Noto Sans, IDENTITY_H) so the real ₹ symbol
 * renders correctly instead of the earlier "Rs." workaround.
 */
@Service
public class PurchasePdfService {

    public byte[] generate(String businessName, String businessAddress, String businessGstin, PurchaseResponse purchase) {
        Document document = new Document(PageSize.A4, 36, 36, 36, 36);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            Font titleFont = PdfFonts.bold(18);
            Font businessFont = PdfFonts.bold(12);
            Font normalFont = PdfFonts.regular(10);
            Font smallFont = PdfFonts.regular(9);
            Font headerFont = PdfFonts.bold(10);

            Paragraph businessNamePara = new Paragraph(
                    businessName != null && !businessName.isBlank() ? businessName : "Business name not set",
                    businessFont
            );
            businessNamePara.setAlignment(Element.ALIGN_CENTER);
            document.add(businessNamePara);

            if (businessAddress != null && !businessAddress.isBlank()) {
                Paragraph addr = new Paragraph(businessAddress, smallFont);
                addr.setAlignment(Element.ALIGN_CENTER);
                document.add(addr);
            }

            if (businessGstin != null && !businessGstin.isBlank()) {
                Paragraph gstinPara = new Paragraph("GSTIN: " + businessGstin, smallFont);
                gstinPara.setAlignment(Element.ALIGN_CENTER);
                document.add(gstinPara);
            }

            document.add(Chunk.NEWLINE);

            Paragraph title = new Paragraph("Purchase Bill", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);
            document.add(Chunk.NEWLINE);

            PdfPTable metaTable = new PdfPTable(2);
            metaTable.setWidthPercentage(100);
            addMetaRow(metaTable, "Supplier", purchase.supplierName(), normalFont, headerFont);
            addMetaRow(metaTable, "Purchase Date", purchase.purchaseDate().toString(), normalFont, headerFont);
            addMetaRow(
                    metaTable,
                    "Reference #",
                    purchase.referenceNumber() != null && !purchase.referenceNumber().isBlank()
                            ? purchase.referenceNumber()
                            : "-",
                    normalFont,
                    headerFont
            );
            document.add(metaTable);
            document.add(Chunk.NEWLINE);

            PdfPTable itemsTable = new PdfPTable(new float[]{4f, 1.2f, 1.6f, 1.6f});
            itemsTable.setWidthPercentage(100);
            addHeaderCell(itemsTable, "Product", headerFont);
            addHeaderCell(itemsTable, "Qty", headerFont);
            addHeaderCell(itemsTable, "Unit Cost", headerFont);
            addHeaderCell(itemsTable, "Line Total", headerFont);

            for (PurchaseItemResponse item : purchase.items()) {
                itemsTable.addCell(new Phrase(item.productName(), normalFont));

                PdfPCell qtyCell = new PdfPCell(new Phrase(item.quantity().toString(), normalFont));
                qtyCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
                itemsTable.addCell(qtyCell);

                PdfPCell costCell = new PdfPCell(new Phrase("₹" + item.unitCost().toString(), normalFont));
                costCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
                itemsTable.addCell(costCell);

                PdfPCell totalCell = new PdfPCell(new Phrase("₹" + item.lineTotal().toString(), normalFont));
                totalCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
                itemsTable.addCell(totalCell);
            }
            document.add(itemsTable);
            document.add(Chunk.NEWLINE);

            Paragraph grandTotal = new Paragraph("Grand Total: ₹" + purchase.totalAmount().toString(), businessFont);
            grandTotal.setAlignment(Element.ALIGN_RIGHT);
            document.add(grandTotal);

            document.close();
        } catch (DocumentException e) {
            throw new RuntimeException("Failed to generate purchase PDF", e);
        }

        return out.toByteArray();
    }

    private void addMetaRow(PdfPTable table, String label, String value, Font normalFont, Font headerFont) {
        PdfPCell labelCell = new PdfPCell(new Phrase(label, headerFont));
        labelCell.setBorder(Rectangle.NO_BORDER);
        table.addCell(labelCell);

        PdfPCell valueCell = new PdfPCell(new Phrase(value, normalFont));
        valueCell.setBorder(Rectangle.NO_BORDER);
        table.addCell(valueCell);
    }

    private void addHeaderCell(PdfPTable table, String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBackgroundColor(new Color(230, 230, 230));
        table.addCell(cell);
    }
}