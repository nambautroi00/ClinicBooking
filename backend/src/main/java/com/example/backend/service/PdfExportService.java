package com.example.backend.service;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.util.List;

@Service
public class PdfExportService {
    private static final float MARGIN = 50f, LEADING = 16f;

    public byte[] generateSimplePdf(String title, List<String> lines) {
        try (PDDocument doc = new PDDocument(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            PDPage page = new PDPage(PDRectangle.A4);
            doc.addPage(page);

            try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
                float y = page.getMediaBox().getHeight() - MARGIN;

                cs.beginText();
                cs.setFont(PDType1Font.HELVETICA_BOLD, 18);
                cs.newLineAtOffset(MARGIN, y);
                cs.showText(safe(title));
                cs.endText();
                y -= 2 * LEADING;

                cs.setFont(PDType1Font.HELVETICA, 12);
                for (String line : lines) {
                    if (y <= MARGIN) break;
                    cs.beginText();
                    cs.newLineAtOffset(MARGIN, y);
                    cs.showText(safe(line));
                    cs.endText();
                    y -= LEADING;
                }
            }

            doc.save(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate PDF", e);
        }
    }

    private String safe(String s) { return s == null ? "" : s.replace("\n", " "); }
}