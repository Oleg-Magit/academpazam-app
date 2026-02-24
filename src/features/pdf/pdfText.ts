// @ts-ignore
import type { PDFPage, PDFFont, Color } from 'pdf-lib';

export const hasHebrew = (text: string): boolean => {
    return /[\u0590-\u05FF]/.test(text);
};

/**
 * Modern browser PDF viewers (Chrome, etc.) handle Hebrew BiDi automatically 
 * when characters are in logical order. Manual reversal often breaks this.
 */
export const toPdfVisualText = (text: string, _dir: 'ltr' | 'rtl' = 'ltr'): string => {
    return text || '';
};

interface DrawCellOptions {
    x: number;
    y: number;
    width: number;
    size: number;
    align?: 'left' | 'right' | 'center';
    color?: Color;
    dir?: 'ltr' | 'rtl';
    padding?: number;
}

export const drawCellText = (
    page: PDFPage,
    font: PDFFont,
    text: string,
    options: DrawCellOptions
) => {
    const {
        x, y, width, size,
        align = 'left',
        color,
        dir = 'ltr',
        padding = 4
    } = options;

    if (!text) return;

    const effectiveDir = hasHebrew(text) ? 'rtl' : dir;
    const visualText = toPdfVisualText(text, effectiveDir);
    const textWidth = font.widthOfTextAtSize(visualText, size);

    let drawX = x + padding;
    const effectiveAlign = align || (effectiveDir === 'rtl' ? 'right' : 'left');

    if (effectiveAlign === 'right') {
        drawX = x + width - padding - textWidth;
    } else if (effectiveAlign === 'center') {
        drawX = x + (width - textWidth) / 2;
    }

    page.drawText(visualText, {
        x: drawX,
        y: y,
        size: size,
        font: font,
        color: color
    });
};
