import type { PDFDocument, PDFFont } from 'pdf-lib';
import type { SupportedLang } from '../utils/translate';
import { getPdfLib } from './getPdfLib';

/**
 * Robustly loads a custom TTF font for PDF generation based on language.
 * Falls back to Helvetica if font loading fails or file is missing.
 */
export const loadCustomFont = async (pdfDoc: PDFDocument, _lang: SupportedLang): Promise<PDFFont> => {
    const { StandardFonts } = await getPdfLib();

    // Use a unified font that supports English, Hebrew, and Russian
    const fontName = 'Arimo-Regular.ttf';
    const fontUrl = `${import.meta.env.BASE_URL}fonts/${fontName}`;

    try {
        const response = await fetch(fontUrl);

        if (!response.ok) {
            throw new Error(`Font file not found: ${fontUrl}`);
        }

        const fontBytes = await response.arrayBuffer();

        // Minimum size check
        if (fontBytes.byteLength < 10000) {
            console.error('[PDF] Font file suspiciously small, likely invalid:', fontBytes.byteLength);
            throw new Error('Invalid font file');
        }

        return await pdfDoc.embedFont(fontBytes);

    } catch (e) {
        console.warn(`[PDF] Failed to load ${fontName}, falling back to Helvetica.`, e);

        alert(`Font missing: Please place ${fontName} in public/fonts/ to support multilingual PDF correctly.`);

        return await pdfDoc.embedFont(StandardFonts.Helvetica);
    }
};
