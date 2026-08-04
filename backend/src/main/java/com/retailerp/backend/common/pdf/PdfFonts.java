package com.retailerp.backend.common.pdf;

import org.openpdf.text.Font;
import org.openpdf.text.pdf.BaseFont;

import java.io.IOException;
import java.io.InputStream;

/**
 * Loads the bundled Noto Sans TTFs (regular + bold) with IDENTITY_H encoding so OpenPDF can
 * render Unicode characters like ₹ — the base-14 Helvetica font OpenPDF falls back to otherwise
 * only supports a limited Latin subset and silently fails to render ₹ (hence the previous
 * "Rs." workaround across PDF-generating services).
 *
 * Font files expected at:
 *   src/main/resources/fonts/NotoSans-Regular.ttf
 *   src/main/resources/fonts/NotoSans-Bold.ttf
 */
public final class PdfFonts {

    private static final BaseFont REGULAR_BASE = loadBaseFont("/fonts/NotoSans-Regular.ttf");
    private static final BaseFont BOLD_BASE = loadBaseFont("/fonts/NotoSans-Bold.ttf");

    private PdfFonts() {
    }

    private static BaseFont loadBaseFont(String classpathPath) {
        try (InputStream in = PdfFonts.class.getResourceAsStream(classpathPath)) {
            if (in == null) {
                throw new IllegalStateException("Font resource not found on classpath: " + classpathPath);
            }
            byte[] fontBytes = in.readAllBytes();
            return BaseFont.createFont(
                    classpathPath,
                    BaseFont.IDENTITY_H,
                    BaseFont.EMBEDDED,
                    true,
                    fontBytes,
                    null);
        } catch (IOException | org.openpdf.text.DocumentException e) {
            throw new IllegalStateException("Failed to load PDF font: " + classpathPath, e);
        }
    }

    public static Font regular(float size) {
        return new Font(REGULAR_BASE, size, Font.NORMAL);
    }

    public static Font bold(float size) {
        return new Font(BOLD_BASE, size, Font.BOLD);
    }
}