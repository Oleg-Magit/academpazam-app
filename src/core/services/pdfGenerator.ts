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

    let currentPage = pdfDoc.addPage();
    const { width, height } = currentPage.getSize();
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

    drawCellText(currentPage, customFont, headerTitle, {
        x: margin,
        y: height - 50,
        width: contentWidth,
        size: 20,
        align: 'center',
        color: black
    });

    const dateStr = new Date().toLocaleDateString(lang === 'he' ? 'he-IL' : (lang === 'ru' ? 'ru-RU' : 'en-US'));
    drawCellText(currentPage, customFont, dateStr, {
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

    drawCellText(currentPage, customFont, `${t('label.total_credits')}: ${progress.totalCredits}`, {
        x: getX(0),
        y: summaryY,
        width: summaryColWidth,
        size: 12,
        color: black,
        align: colAlign
    });

    drawCellText(currentPage, customFont, `${t('label.completed')}: ${progress.completedCredits}`, {
        x: getX(1),
        y: summaryY,
        width: summaryColWidth,
        size: 12,
        color: black,
        align: colAlign
    });

    drawCellText(currentPage, customFont, `${t('label.remaining')}: ${progress.totalCredits - progress.completedCredits}`, {
        x: getX(2),
        y: summaryY,
        width: summaryColWidth,
        size: 12,
        color: black,
        align: colAlign
    });

    drawCellText(currentPage, customFont, `${t('dashboard.degree_progress')}: ${progress.percentage.toFixed(1)}%`, {
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

    let lastYear: number | undefined = undefined;
    let lastTerm: string | undefined = undefined;

    for (const group of groups) {
        if (currentY < 120) {
            currentPage = pdfDoc.addPage();
            currentY = currentPage.getSize().height - 50;
        }

        const isRtl = lang === 'he';
        const alignHeader = isRtl ? 'right' : 'left';

        // Derive the real source of year and term safely instead of assuming it exists on group
        const groupSemester = semestersData.find(s => s.id === group.semesterId);
        const actualYear = groupSemester?.year ?? group.year;
        const actualTerm = groupSemester?.term ?? group.term;

        // 1. Render Year Heading if available and new
        if (actualYear != null && actualYear !== lastYear) {
            // New year resets the term tracking
            lastYear = actualYear;
            lastTerm = undefined;

            if (currentY < 120) {
                currentPage = pdfDoc.addPage();
                currentY = currentPage.getSize().height - 50;
            }

            drawCellText(currentPage, customFont, `${t('label.year')} ${actualYear}`, {
                x: margin,
                y: currentY,
                width: contentWidth,
                size: 16,
                color: rgb(0, 0, 0),
                align: alignHeader,
            });
            currentY -= 25;
        }

        // 2. Render Term Heading if available and new
        if (actualTerm != null && actualTerm !== lastTerm && actualYear != null) {
            lastTerm = actualTerm;

            if (currentY < 120) {
                currentPage = pdfDoc.addPage();
                currentY = currentPage.getSize().height - 50;
            }

            // Derive translated term key safely
            let termLabel: string = actualTerm;
            if (actualTerm === 'A') termLabel = t('term.a' as TranslationKey);
            else if (actualTerm === 'B') termLabel = t('term.b' as TranslationKey);
            else if (actualTerm === 'SUMMER') termLabel = t('term.summer' as TranslationKey);

            // Slight indentation for terminology under year
            const termIndent = 12;
            const termX = isRtl ? margin : margin + termIndent;
            const termWidth = isRtl ? contentWidth - termIndent : contentWidth - termIndent;

            drawCellText(currentPage, customFont, termLabel, {
                x: termX,
                y: currentY,
                width: termWidth,
                size: 14,
                color: rgb(0.3, 0.3, 0.3),
                align: alignHeader,
            });
            currentY -= 20;
        }

        // 3. Render Semester Label
        const semLabel = group.semesterName;
        const semIndent = (actualYear != null && actualTerm != null) ? 24 : 0;
        const semX = isRtl ? margin : margin + semIndent;
        const semWidth = isRtl ? contentWidth - semIndent : contentWidth - semIndent;

        drawCellText(currentPage, customFont, semLabel, {
            x: semX,
            y: currentY,
            width: semWidth,
            size: actualYear != null ? 12 : 14,
            color: rgb(0, 0, 0.8),
            align: alignHeader,
        });
        currentY -= 25;

        const headerSize = 10;
        const colAlignHeader = lang === 'he' ? 'right' : 'left';
        drawCellText(currentPage, customFont, t('label.course_code'), { x: cols.code.x, y: currentY, width: cols.code.width, size: headerSize, color: black, align: colAlignHeader });
        drawCellText(currentPage, customFont, t('label.course_name'), { x: cols.name.x, y: currentY, width: cols.name.width, size: headerSize, color: black, align: colAlignHeader });
        drawCellText(currentPage, customFont, t('label.credits'), { x: cols.credits.x, y: currentY, width: cols.credits.width, size: headerSize, color: black, align: colAlignHeader });
        drawCellText(currentPage, customFont, t('label.initial_status'), { x: cols.status.x, y: currentY, width: cols.status.width, size: headerSize, color: black, align: colAlignHeader });
        // 'label.initial_status' is 'Initial Status'. 'status.manual' is 'Manual'.
        // Is there a generic 'Status'? 'label.initial_status' is close enough or use 'dashboard.degree_progress' context?
        // Actually 'label.initial_status' = 'Initial Status'.
        // Let's use 'label.unique_status' if we had one.
        // Checking en.ts... keys: 'status.not_started', etc.
        // We lack a generic column header 'Status'.
        // Let's use 'label.initial_status' for now as it exists.

        currentY -= 10;
        currentPage.drawLine({
            start: { x: margin, y: currentY },
            end: { x: margin + contentWidth, y: currentY },
            thickness: 1,
            color: rgb(0.8, 0.8, 0.8),
        });
        currentY -= 20;

        for (const course of group.courses) {
            if (currentY < 50) {
                currentPage = pdfDoc.addPage();
                currentY = currentPage.getSize().height - 50;
            }

            // Draw Course Code
            drawCellText(currentPage, customFont, txt(course.code || ''), {
                x: cols.code.x, y: currentY, width: cols.code.width, size: 10, color: black,
                align: lang === 'he' ? 'right' : 'left'
            });

            // Draw Course Name
            drawCellText(currentPage, customFont, txt(course.name), {
                x: cols.name.x, y: currentY, width: cols.name.width, size: 10, color: black,
                align: lang === 'he' ? 'right' : 'left'
            });

            // Draw Credits
            drawCellText(currentPage, customFont, txt(course.credits.toString()), {
                x: cols.credits.x, y: currentY, width: cols.credits.width, size: 10, color: black,
                align: lang === 'he' ? 'right' : 'left'
            });

            // Draw Expected Status
            // Since we don't calculate row status logic here yet, default to 'not_started' or the derived status
            let courseStatusKey: TranslationKey = 'status.not_started';
            if (course.effectiveStatus === 'completed') courseStatusKey = 'status.completed';
            else if (course.effectiveStatus === 'in_progress') courseStatusKey = 'status.in_progress';

            drawCellText(currentPage, customFont, t(courseStatusKey), {
                x: cols.status.x, y: currentY, width: cols.status.width, size: 10, color: black,
                align: lang === 'he' ? 'right' : 'left'
            });

            currentY -= 20;
        }
        currentY -= 30; // Solid spacing between semesters
    }

    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
};
