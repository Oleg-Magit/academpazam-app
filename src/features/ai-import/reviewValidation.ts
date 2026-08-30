import type { AcademicImportMode, AcademicImportReviewRow, ReviewBlockingReason } from './types';

export const revalidateAcademicImportRow = (
    row: AcademicImportReviewRow,
    mode: AcademicImportMode,
    passingThreshold: number,
): AcademicImportReviewRow => {
    if (row.action === 'skip') return { ...row, blockingReasons: [] };

    const reasons: ReviewBlockingReason[] = [];
    const credits = row.proposed.credits;
    const grade = row.proposed.grade;

    if (!row.proposed.name.trim()) reasons.push('missing_name');
    if (credits === null) reasons.push('missing_credits');
    else if (!Number.isFinite(credits) || credits <= 0 || credits > 30) reasons.push('invalid_credits');
    if (grade !== null && (!Number.isFinite(grade) || grade < 0 || grade > 100)) reasons.push('invalid_grade');
    if (!row.semesterResolution.semesterId) reasons.push('unresolved_semester');

    let proposed = row.proposed;
    if (mode === 'degree_plan') {
        proposed = {
            ...proposed,
            grade: null,
            manualStatus: 'not_started',
            attemptStatus: 'planned',
        };
    } else if (grade !== null && Number.isFinite(grade) && grade >= 0 && grade <= 100) {
        proposed = {
            ...proposed,
            manualStatus: 'completed',
            attemptStatus: grade >= passingThreshold ? 'passed' : 'failed',
        };
    } else if (row.action === 'add' && !proposed.attemptStatus) {
        reasons.push('missing_outcome');
    }

    return { ...row, proposed, blockingReasons: reasons };
};

export const revalidateAcademicImportRows = (
    rows: AcademicImportReviewRow[],
    mode: AcademicImportMode,
    passingThreshold: number,
) => rows.map(row => revalidateAcademicImportRow(row, mode, passingThreshold));
