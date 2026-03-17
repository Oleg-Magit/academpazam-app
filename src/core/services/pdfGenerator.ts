import type { CourseWithTopics } from '../models/types';
import { groupCoursesBySemester, calculateDegreeProgress } from './dataService';
import { DEFAULT_PASSING_THRESHOLD } from '../constants/grades';
import { getSemesters } from '../db/db';
import { buildLineageMetadata } from './courseLifecycle';
import { drawCellText } from '../../features/pdf/pdfText';
import { getPdfLib } from './getPdfLib';
import { getFontKit } from './getFontKit';
import { loadCustomFont } from './pdfFont';
import { translate, type SupportedLang, type TranslationKey } from '../utils/translate';
import { getSemesterTitle } from '../utils/semesterUtils';

import { computeDegreeGpa } from './gpaService';

export const generateDegreePDF = async (
    degreeName: string, 
    courses: CourseWithTopics[], 
    lang: SupportedLang = 'en', 
    passingThreshold: number = DEFAULT_PASSING_THRESHOLD,
    options: { title?: string } = {}
) => {
    const { PDFDocument, rgb } = await getPdfLib();
    const fontkit = await getFontKit();

    const pdfDoc = await PDFDocument.create();
    
    // Set Metadata for Browser Viewers
    if (options.title) {
        pdfDoc.setTitle(options.title);
    }
    pdfDoc.setProducer('AcademPazam');
    pdfDoc.setCreator('AcademPazam');

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
    // For RTL layout, ensuring natural Hebrew order: "התקדמות בתואר: <degreeName>"
    const headerTitle = lang === 'he'
        ? `${translatedProgress}: ${degreeName}`
        : `${degreeName}: ${translatedProgress}`;

    drawCellText(currentPage, customFont, headerTitle, {
        x: margin,
        y: height - 50,
        width: contentWidth,
        size: 20,
        align: 'center',
        color: black,
        dir: lang === 'he' ? 'rtl' : 'ltr'
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

    const progress = calculateDegreeProgress(courses, passingThreshold);
    const gpaData = computeDegreeGpa(courses, passingThreshold);
    
    const summaryY = height - 110;

    // rebalanced summary metrics to 5 columns
    const colWidths = [0.18, 0.18, 0.20, 0.22, 0.22].map(w => contentWidth * w);
    
    const getX = (col: number) => {
        if (lang === 'he') {
            const widthsBefore = colWidths.slice(col + 1).reduce((sum, w) => sum + w, 0);
            return margin + widthsBefore;
        }
        const widthsBefore = colWidths.slice(0, col).reduce((sum, w) => sum + w, 0);
        return margin + widthsBefore;
    };
    const colAlign = lang === 'he' ? 'right' : 'left';

    // 1. Total Credits
    drawCellText(currentPage, customFont, `${t('label.total_credits')}: ${progress.totalCredits}`, {
        x: getX(0),
        y: summaryY,
        width: colWidths[0],
        size: 10,
        color: black,
        align: colAlign
    });

    // 2. Completed Credits
    drawCellText(currentPage, customFont, `${t('label.completed')}: ${progress.completedCredits}`, {
        x: getX(1),
        y: summaryY,
        width: colWidths[1],
        size: 10,
        color: black,
        align: colAlign
    });

    // 3. Average Grade
    const avgLabel = t('label.average');
    const avgValue = gpaData.gpa !== null ? gpaData.gpa.toString() : t('label.not_available');
    drawCellText(currentPage, customFont, `${avgLabel}: ${avgValue}`, {
        x: getX(2),
        y: summaryY,
        width: colWidths[2],
        size: 10,
        color: black,
        align: colAlign
    });

    // 4. Remaining Credits
    drawCellText(currentPage, customFont, `${t('label.remaining')}: ${progress.totalCredits - progress.completedCredits}`, {
        x: getX(3),
        y: summaryY,
        width: colWidths[3],
        size: 10,
        color: black,
        align: colAlign
    });

    // 5. Progress %
    drawCellText(currentPage, customFont, `${t('dashboard.degree_progress')}: ${progress.percentage.toFixed(1)}%`, {
        x: getX(4),
        y: summaryY,
        width: colWidths[4],
        size: 10,
        color: black,
        align: colAlign
    });

    if (courses.length === 0) {
        const emptyMsg = lang === 'he' ? 'אין קורסים להצגה' : 'No courses to display';
        drawCellText(currentPage, customFont, emptyMsg, {
            x: margin,
            y: summaryY - 80,
            width: contentWidth,
            size: 14,
            color: rgb(0.5, 0.5, 0.5),
            align: 'center'
        });
        
        const finalPdfBytes = await pdfDoc.save();
        return finalPdfBytes;
    }

    let currentY = summaryY - 40;
    const semestersData = await getSemesters();
    const groups = groupCoursesBySemester(courses, semestersData, passingThreshold);
    const lineageMetadata = buildLineageMetadata(courses, passingThreshold);

    // Columns config - adjusted for RTL
    interface ColConfig { x: number; width: number }
    let cols: { code: ColConfig; name: ColConfig; credits: ColConfig; status: ColConfig };

    if (lang === 'he') {
        cols = {
            status: { x: margin, width: 100 },
            credits: { x: margin + 100, width: 80 }, // Increased from 50
            name: { x: margin + 180, width: 230 }, // Reduced from 260
            code: { x: margin + 410, width: 80 }
        };
    } else {
        cols = {
            code: { x: margin, width: 80 },
            name: { x: margin + 80, width: 230 }, // Reduced from 270
            credits: { x: margin + 310, width: 80 }, // Increased from 50
            status: { x: margin + 390, width: 110 }
        };
    }

    let lastYear: number | undefined = undefined;

    for (const group of groups) {
        if (currentY < 120) {
            currentPage = pdfDoc.addPage();
            currentY = currentPage.getSize().height - 50;
        }

        const isRtl = lang === 'he';
        const alignHeader = isRtl ? 'right' : 'left';

        // Derive the real source of year safely instead of assuming it exists on group
        const groupSemester = semestersData.find(s => s.id === group.semesterId);
        const actualYear = groupSemester?.year ?? group.year;

        // 1. Render Year Heading if available and new
        if (actualYear != null && actualYear !== lastYear) {
            // New year resets the tracking
            lastYear = actualYear;

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

        // 2. Render Semester Label (Exactly one title per semester)
        const semTitle = getSemesterTitle(groupSemester || group, t);
        const semIndent = (actualYear != null) ? 12 : 0;
        const semX = isRtl ? margin : margin + semIndent;
        const semWidth = isRtl ? contentWidth - semIndent : contentWidth - semIndent;

        drawCellText(currentPage, customFont, semTitle, {
            x: semX,
            y: currentY,
            width: semWidth,
            size: actualYear != null ? 14 : 16,
            color: rgb(0, 0, 0.8),
            align: alignHeader,
        });
        currentY -= 20;

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
            const displayName = course.repeatedFromCourseId 
                ? `${course.name} (${t('status.repeat_secondary')})` 
                : course.name;

            drawCellText(currentPage, customFont, txt(displayName), {
                x: cols.name.x, y: currentY, width: cols.name.width, size: 10, color: black,
                align: lang === 'he' ? 'right' : 'left'
            });

            // Draw Credits
            drawCellText(currentPage, customFont, txt(course.credits.toString()), {
                x: cols.credits.x, y: currentY, width: cols.credits.width, size: 10, color: black,
                align: lang === 'he' ? 'right' : 'left'
            });

            // Draw Expected Status (Lineage-aware Priority)
            let statusText = '';
            const academicStatus = lineageMetadata[course.id];
            // Status Badge Logic
            if (course.excludeFromAverage) {
                statusText = t('status.participated_badge').toUpperCase();
            } else if (academicStatus?.holdsPassedReq) {
                statusText = t('status.passed_academic_badge');
            } else if (academicStatus?.holdsNeedsRepeat) {
                statusText = t('status.needs_repeat_badge');
            } else if (course.attemptStatus === 'failed' || (course.grade !== null && course.grade !== undefined && course.grade < passingThreshold)) {
                statusText = t('status.failed_badge');
            } else if (academicStatus?.isValidRepeat) {
                statusText = t('status.repeat_badge');
            } else if (course.effectiveStatus === 'completed') {
                statusText = t('status.completed');
            } else if (course.effectiveStatus === 'in_progress') {
                statusText = t('status.in_progress');
            } else {
                statusText = t('status.not_started');
            }

            drawCellText(currentPage, customFont, statusText, {
                x: cols.status.x, y: currentY, width: cols.status.width, size: 8, color: black,
                align: lang === 'he' ? 'right' : 'left'
            });

            currentY -= 20;
        }

        // Add subtlety watermark to bottom-right of current page
        drawCellText(currentPage, customFont, 'Exported from AcademPazam', {
            x: width - 150,
            y: 20,
            width: 130,
            size: 7,
            color: rgb(0.7, 0.7, 0.7),
            align: 'right'
        });
        currentY -= 30; // Solid spacing between semesters
    }

    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
};
