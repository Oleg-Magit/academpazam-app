import type { Course, Semester } from '@/core/models/types';
import type {
    AcademicImportNormalizationInput,
    AcademicImportReviewRow,
    ExtractedAcademicCourse,
    MatchReason,
    ReviewBlockingReason,
} from './types';

const normalizeCode = (value?: string | null) => (value ?? '').trim().toLowerCase();

export const normalizeCourseName = (value?: string | null) =>
    (value ?? '')
        .trim()
        .toLowerCase()
        .replace(/[.,;:()[\]{}]/g, ' ')
        .replace(/\s+/g, ' ');

const normalizeSemesterLabel = normalizeCourseName;

const isValidGrade = (grade: number | null) => grade === null || (Number.isFinite(grade) && grade >= 0 && grade <= 100);

const buildCandidateMatches = (row: ExtractedAcademicCourse, courses: Course[]) => {
    const code = normalizeCode(row.code);
    if (code) {
        const matches = courses.filter(course => normalizeCode(course.code) === code);
        if (matches.length > 0) return { matches, reason: 'course_code' as MatchReason };
    }

    const name = normalizeCourseName(row.name);
    if (name) {
        const matches = courses.filter(course => normalizeCourseName(course.name) === name);
        if (matches.length > 0) return { matches, reason: 'normalized_name' as MatchReason };
    }

    return { matches: [], reason: 'none' as MatchReason };
};

interface SemesterResolverContext {
    semesters: Semester[];
    pendingByKey: Map<string, Semester>;
}

const semesterKey = (row: ExtractedAcademicCourse) => {
    const label = normalizeSemesterLabel(row.semesterLabel);
    if (label) return `label:${label}`;
    if (row.year !== null && row.term !== null) return `year-term:${row.year}:${row.term}`;
    return '';
};

const resolveSemester = (
    row: ExtractedAcademicCourse,
    context: SemesterResolverContext,
    fallbackSemesterId?: string,
): AcademicImportReviewRow['semesterResolution'] => {
    const label = normalizeSemesterLabel(row.semesterLabel);
    if (label) {
        const labelMatches = context.semesters.filter(semester => normalizeSemesterLabel(semester.name) === label);
        if (labelMatches.length === 1) {
            return { kind: 'existing', semesterId: labelMatches[0].id, proposedSemester: null };
        }
        if (labelMatches.length > 1) {
            return { kind: 'unresolved', semesterId: null, proposedSemester: null };
        }
    }

    if (row.year !== null && row.term !== null) {
        const metadataMatches = context.semesters.filter(
            semester => semester.year === row.year && semester.term === row.term,
        );
        if (metadataMatches.length === 1) {
            return { kind: 'existing', semesterId: metadataMatches[0].id, proposedSemester: null };
        }
        if (metadataMatches.length > 1) {
            return { kind: 'unresolved', semesterId: null, proposedSemester: null };
        }
    }

    const key = semesterKey(row);
    if (key) {
        const existingPending = context.pendingByKey.get(key);
        if (existingPending) {
            return { kind: 'new', semesterId: existingPending.id, proposedSemester: existingPending };
        }

        const orderIndex = context.semesters.length + context.pendingByKey.size;
        const proposed: Semester = {
            id: `ai-import-semester-${context.pendingByKey.size + 1}`,
            name: row.semesterLabel?.trim() || `Year ${row.year} - ${row.term}`,
            createdAt: Date.now(),
            orderIndex,
            ...(row.year !== null ? { year: row.year } : {}),
            ...(row.term !== null ? { term: row.term } : {}),
        };
        context.pendingByKey.set(key, proposed);
        return { kind: 'new', semesterId: proposed.id, proposedSemester: proposed };
    }

    if (fallbackSemesterId) {
        return { kind: 'existing', semesterId: fallbackSemesterId, proposedSemester: null };
    }

    return { kind: 'unresolved', semesterId: null, proposedSemester: null };
};

const pushOnce = (list: ReviewBlockingReason[], value: ReviewBlockingReason) => {
    if (!list.includes(value)) list.push(value);
};

export const normalizeAcademicImport = (input: AcademicImportNormalizationInput): AcademicImportReviewRow[] => {
    const pendingByKey = new Map<string, Semester>();
    const semesterContext: SemesterResolverContext = {
        semesters: input.semesters,
        pendingByKey,
    };

    return input.extraction.courses.map(row => {
        const blockingReasons: ReviewBlockingReason[] = [];
        const warnings = [...row.warnings];
        const normalizedName = row.name.trim();
        const { matches, reason } = buildCandidateMatches(row, input.courses);
        const ambiguous = matches.length > 1;
        const target = matches.length === 1 ? matches[0] : null;

        if (!normalizedName) pushOnce(blockingReasons, 'missing_name');
        if (row.credits === null && !target) pushOnce(blockingReasons, 'missing_credits');
        if (!isValidGrade(row.grade)) pushOnce(blockingReasons, 'invalid_grade');
        if (ambiguous) pushOnce(blockingReasons, 'ambiguous_match');

        const semesterResolution = resolveSemester(row, semesterContext, target?.semesterId);
        if (semesterResolution.kind === 'unresolved') pushOnce(blockingReasons, 'unresolved_semester');

        if (input.extraction.importMode === 'degree_plan') {
            if (row.grade !== null || row.explicitStatus !== null) {
                warnings.push('Result fields from a degree-plan source are ignored until imported as academic results.');
            }

            return {
                sourceRowId: row.sourceRowId,
                action: target ? 'skip' : 'add',
                targetCourseId: target?.id ?? null,
                proposed: {
                    ...(row.code?.trim() ? { code: row.code.trim() } : {}),
                    name: normalizedName,
                    credits: row.credits,
                    grade: null,
                    manualStatus: 'not_started',
                    attemptStatus: 'planned',
                    attemptNumber: 1,
                    excludeFromAverage: false,
                },
                semesterResolution,
                matchReason: reason,
                duplicateRisk: target ? 'exact' : ambiguous ? 'possible' : 'none',
                warnings,
                blockingReasons,
            };
        }

        const numericGrade = isValidGrade(row.grade) ? row.grade : null;
        let manualStatus = target?.manualStatus;
        let attemptStatus = target?.attemptStatus;

        if (numericGrade !== null) {
            manualStatus = 'completed';
            attemptStatus = numericGrade >= input.passingThreshold ? 'passed' : 'failed';
        } else if (row.explicitStatus === 'passed' || row.explicitStatus === 'failed') {
            manualStatus = 'completed';
            attemptStatus = row.explicitStatus;
        } else if (row.explicitStatus === 'in_progress') {
            manualStatus = 'in_progress';
            attemptStatus = 'in_progress';
        } else if (row.explicitStatus === 'planned') {
            manualStatus = 'not_started';
            attemptStatus = 'planned';
        } else if (!target) {
            pushOnce(blockingReasons, 'missing_outcome');
            warnings.push('No grade or explicit academic outcome was found for this result row.');
        }

        if (target && row.grade === null && row.explicitStatus === null) {
            warnings.push('No result outcome was found; the existing course academic state will be preserved.');
        }

        const proposedCredits = row.credits ?? target?.credits ?? null;
        if (proposedCredits === null) pushOnce(blockingReasons, 'missing_credits');

        return {
            sourceRowId: row.sourceRowId,
            action: target ? 'update' : 'add',
            targetCourseId: target?.id ?? null,
            proposed: {
                ...((row.code?.trim() || target?.code) ? { code: row.code?.trim() || target?.code } : {}),
                name: normalizedName || target?.name || '',
                credits: proposedCredits,
                grade: numericGrade !== null ? numericGrade : (target?.grade ?? null),
                ...(manualStatus ? { manualStatus } : {}),
                ...(attemptStatus ? { attemptStatus } : {}),
                attemptNumber: target?.attemptNumber ?? 1,
                excludeFromAverage: target?.excludeFromAverage ?? false,
            },
            semesterResolution,
            matchReason: reason,
            duplicateRisk: ambiguous ? 'possible' : target ? 'exact' : 'none',
            warnings,
            blockingReasons,
        };
    });
};
