import type { CourseWithTopics } from '../models/types';
import { groupCoursesBySemester, calculateDegreeProgress } from './dataService';
import { getSemesters } from '../db/db';
import { drawCellText } from '../../features/pdf/pdfText';
import { getPdfLib } from './getPdfLib';
import { getFontKit } from './getFontKit';
import { loadCustomFont } from './pdfFont';
import { translate, type SupportedLang, type TranslationKey } from '../utils/translate';

export const generateDegreePDF = async (degreeName: string, courses: CourseWithTopics[], lang: SupportedLang = 'en') => {
    const { PDFDocument, rgb } = await getPdfLib();
    const fontkit = await getFontKit();

    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    // Robust Font Loading via service
    const customFont = await loadCustomFont(pdfDoc, lang);

    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const margin = 50;
    const contentWidth = width - (margin * 2);

    const black = rgb(0, 0, 0);

    const t = (key: TranslationKey) => translate(lang, key);
    const txt = (text: string) => text;

    const translatedProgress = t('dashboard.degree_progress');
    // For RTL layout, put Number/English after Hebrew
    const headerTitle = lang === 'he'
        ? `${translatedProgress}: ${degreeName}`
        : `${degreeName}: ${translatedProgress}`;

    drawCellText(page, customFont, headerTitle, {
        x: margin,
        y: height - 50,
        width: contentWidth,
        size: 20,
        align: 'center',
        color: black
    });

    const dateStr = new Date().toLocaleDateString(lang === 'he' ? 'he-IL' : (lang === 'ru' ? 'ru-RU' : 'en-US'));
    drawCellText(page, customFont, dateStr, {
        x: margin,
        y: height - 75,
        width: contentWidth,
        size: 10,
        color: rgb(0.5, 0.5, 0.5),
        align: 'center'
    });

    const progress = calculateDegreeProgress(courses);
    const summaryY = height - 110;

    const summaryColWidth = contentWidth / 4;
    const getX = (col: number) => {
        if (lang === 'he') {
            return margin + (3 - col) * summaryColWidth;
        }
        return margin + col * summaryColWidth;
    };
    const colAlign = lang === 'he' ? 'right' : 'left';

    drawCellText(page, customFont, `${t('label.total_credits')}: ${progress.totalCredits}`, {
        x: getX(0),
        y: summaryY,
        width: summaryColWidth,
        size: 12,
        color: black,
        align: colAlign
    });

    drawCellText(page, customFont, `${t('label.completed')}: ${progress.completedCredits}`, {
        x: getX(1),
        y: summaryY,
        width: summaryColWidth,
        size: 12,
        color: black,
        align: colAlign
    });

    drawCellText(page, customFont, `${t('label.remaining')}: ${progress.totalCredits - progress.completedCredits}`, {
        x: getX(2),
        y: summaryY,
        width: summaryColWidth,
        size: 12,
        color: black,
        align: colAlign
    });

    drawCellText(page, customFont, `${t('dashboard.degree_progress')}: ${progress.percentage.toFixed(1)}%`, {
        x: getX(3),
        y: summaryY,
        width: summaryColWidth,
        size: 12,
        color: black,
        align: colAlign
    });

    let currentY = summaryY - 40;
    const semestersData = await getSemesters();
    const groups = groupCoursesBySemester(courses, semestersData);

    // Columns config - adjusted for RTL
    interface ColConfig { x: number; width: number }
    let cols: { code: ColConfig; name: ColConfig; credits: ColConfig; status: ColConfig };

    if (lang === 'he') {
        cols = {
            status: { x: margin, width: 90 },
            credits: { x: margin + 90, width: 60 },
            name: { x: margin + 150, width: 260 },
            code: { x: margin + 410, width: 80 }
        };
    } else {
        cols = {
            code: { x: margin, width: 80 },
            name: { x: margin + 80, width: 270 },
            credits: { x: margin + 350, width: 60 },
            status: { x: margin + 410, width: 80 }
        };
    }

    for (const group of groups) {
        if (currentY < 100) {
            const newPage = pdfDoc.addPage();
            currentY = newPage.getSize().height - 50;
        }

        const semLabel = group.semesterName;
        drawCellText(page, customFont, semLabel, {
            x: margin,
            y: currentY,
            width: contentWidth,
            size: 14,
            color: rgb(0, 0, 0.8),
            align: lang === 'he' ? 'right' : 'left',
        });
        currentY -= 20;

        const headerSize = 10;
        const colAlignHeader = lang === 'he' ? 'right' : 'left';
        drawCellText(page, customFont, t('label.course_code'), { x: cols.code.x, y: currentY, width: cols.code.width, size: headerSize, color: black, align: colAlignHeader });
        drawCellText(page, customFont, t('label.course_name'), { x: cols.name.x, y: currentY, width: cols.name.width, size: headerSize, color: black, align: colAlignHeader });
        drawCellText(page, customFont, t('label.credits'), { x: cols.credits.x, y: currentY, width: cols.credits.width, size: headerSize, color: black, align: colAlignHeader });
        drawCellText(page, customFont, t('label.initial_status'), { x: cols.status.x, y: currentY, width: cols.status.width, size: headerSize, color: black, align: colAlignHeader });
        // 'label.initial_status' is 'Initial Status'. 'status.manual' is 'Manual'.
        // Is there a generic 'Status'? 'label.initial_status' is close enough or use 'dashboard.degree_progress' context?
        // Actually 'label.initial_status' = 'Initial Status'.
        // Let's use 'label.unique_status' if we had one.
        // Checking en.ts... keys: 'status.not_started', etc.
        // We lack a generic column header 'Status'.
        // Let's use 'label.initial_status' for now as it exists.

        currentY -= 5;
        page.drawLine({
            start: { x: margin, y: currentY },
            end: { x: margin + contentWidth, y: currentY },
            thickness: 1,
            color: rgb(0.8, 0.8, 0.8),
        });
        currentY -= 15;

        for (const course of group.courses) {
            if (currentY < 50) {
                const newPage = pdfDoc.addPage();
                currentY = newPage.getSize().height - 50;
            }

            // Draw Course Code
            drawCellText(page, customFont, txt(course.code || ''), {
                x: cols.code.x, y: currentY, width: cols.code.width, size: 10, color: black,
                align: lang === 'he' ? 'right' : 'left'
            });

            // Draw Course Name
            drawCellText(page, customFont, txt(course.name), {
                x: cols.name.x, y: currentY, width: cols.name.width, size: 10, color: black,
                align: lang === 'he' ? 'right' : 'left'
            });

            // Draw Credits
            drawCellText(page, customFont, txt(course.credits.toString()), {
                x: cols.credits.x, y: currentY, width: cols.credits.width, size: 10, color: black,
                align: lang === 'he' ? 'right' : 'left'
            });

            const statusKey = `status.${course.effectiveStatus}` as TranslationKey;
            drawCellText(page, customFont, t(statusKey) || txt(course.effectiveStatus), {
                x: cols.status.x, y: currentY, width: cols.status.width, size: 10, color: black,
                align: lang === 'he' ? 'right' : 'left'
            });

            currentY -= 20;
        }
        currentY -= 20; // Space between semesters
    }

    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
};
