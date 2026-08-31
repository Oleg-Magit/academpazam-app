import type { Course, Semester } from '@/core/models/types';

export type AcademicImportMode = 'degree_plan' | 'academic_results';
export type AcademicAttemptStatus = 'passed' | 'failed' | 'in_progress' | 'planned';

export interface ExtractedAcademicCourse {
    sourceRowId: string;
    code: string | null;
    name: string;
    credits: number | null;
    semesterLabel: string | null;
    year: number | null;
    term: 'A' | 'B' | 'SUMMER' | 'OTHER' | null;
    grade: number | null;
    explicitStatus: AcademicAttemptStatus | null;
    confidence: number;
    warnings: string[];
}

export interface AcademicImportExtraction {
    importMode: AcademicImportMode;
    documentLanguage: string | null;
    courses: ExtractedAcademicCourse[];
    warnings: string[];
}

export interface AcademicImportApiMeta {
    model: string;
    sourceConversion: 'markdown' | 'plain_text';
    truncated: boolean;
}

export interface AcademicImportApiSuccess {
    ok: true;
    requestId: string;
    data: AcademicImportExtraction;
    meta: AcademicImportApiMeta;
}

export type AcademicImportErrorCode =
    | 'INVALID_REQUEST'
    | 'UNSUPPORTED_FILE'
    | 'FILE_TOO_LARGE'
    | 'EXTRACTION_FAILED'
    | 'INVALID_MODEL_OUTPUT'
    | 'RATE_LIMITED'
    | 'AI_QUOTA_EXCEEDED'
    | 'AI_UNAVAILABLE';

export interface AcademicImportApiFailure {
    ok: false;
    requestId: string;
    error: {
        code: AcademicImportErrorCode;
        message: string;
    };
}

export type AcademicImportApiResponse = AcademicImportApiSuccess | AcademicImportApiFailure;
export type ImportAction = 'add' | 'update' | 'skip';
export type MatchReason = 'course_code' | 'normalized_name' | 'none';
export type DuplicateRisk = 'none' | 'possible' | 'exact';
export type ReviewBlockingReason =
    | 'missing_name'
    | 'missing_credits'
    | 'invalid_credits'
    | 'invalid_grade'
    | 'unresolved_semester'
    | 'ambiguous_match'
    | 'missing_outcome';

export interface ProposedAcademicCourse {
    code?: string;
    name: string;
    credits: number | null;
    grade: number | null;
    manualStatus?: 'not_started' | 'in_progress' | 'completed';
    attemptStatus?: AcademicAttemptStatus;
    attemptNumber?: number;
    excludeFromAverage?: boolean;
}

export interface AcademicImportReviewRow {
    sourceRowId: string;
    action: ImportAction;
    targetCourseId: string | null;
    proposed: ProposedAcademicCourse;
    semesterResolution: {
        kind: 'existing' | 'new' | 'unresolved';
        semesterId: string | null;
        proposedSemester: Semester | null;
    };
    matchReason: MatchReason;
    duplicateRisk: DuplicateRisk;
    warnings: string[];
    blockingReasons: ReviewBlockingReason[];
}

export interface AcademicImportNormalizationInput {
    extraction: AcademicImportExtraction;
    planId: string;
    passingThreshold: number;
    courses: Course[];
    semesters: Semester[];
}
