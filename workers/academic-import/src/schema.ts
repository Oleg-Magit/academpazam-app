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

export const academicImportJsonSchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
        importMode: { type: 'string', enum: ['degree_plan', 'academic_results'] },
        documentLanguage: { type: ['string', 'null'] },
        courses: {
            type: 'array',
            items: {
                type: 'object',
                additionalProperties: false,
                properties: {
                    sourceRowId: { type: 'string' },
                    code: { type: ['string', 'null'] },
                    name: { type: 'string' },
                    credits: { type: ['number', 'null'] },
                    semesterLabel: { type: ['string', 'null'] },
                    year: { type: ['integer', 'null'] },
                    term: { type: ['string', 'null'], enum: ['A', 'B', 'SUMMER', 'OTHER', null] },
                    grade: { type: ['number', 'null'] },
                    explicitStatus: { type: ['string', 'null'], enum: ['passed', 'failed', 'in_progress', 'planned', null] },
                    confidence: { type: 'number', minimum: 0, maximum: 1 },
                    warnings: { type: 'array', items: { type: 'string' } },
                },
                required: [
                    'sourceRowId', 'code', 'name', 'credits', 'semesterLabel', 'year', 'term',
                    'grade', 'explicitStatus', 'confidence', 'warnings',
                ],
            },
        },
        warnings: { type: 'array', items: { type: 'string' } },
    },
    required: ['importMode', 'documentLanguage', 'courses', 'warnings'],
} as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const isNullableString = (value: unknown): value is string | null => value === null || typeof value === 'string';
const isNullableNumber = (value: unknown): value is number | null => value === null || (typeof value === 'number' && Number.isFinite(value));
const isStringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every(item => typeof item === 'string');

const isCourse = (value: unknown): value is ExtractedAcademicCourse => {
    if (!isRecord(value)) return false;
    const terms = new Set(['A', 'B', 'SUMMER', 'OTHER']);
    const statuses = new Set(['passed', 'failed', 'in_progress', 'planned']);
    return typeof value.sourceRowId === 'string'
        && isNullableString(value.code)
        && typeof value.name === 'string'
        && isNullableNumber(value.credits)
        && isNullableString(value.semesterLabel)
        && (value.year === null || (typeof value.year === 'number' && Number.isInteger(value.year)))
        && (value.term === null || (typeof value.term === 'string' && terms.has(value.term)))
        && isNullableNumber(value.grade)
        && (value.explicitStatus === null || (typeof value.explicitStatus === 'string' && statuses.has(value.explicitStatus)))
        && typeof value.confidence === 'number'
        && value.confidence >= 0
        && value.confidence <= 1
        && isStringArray(value.warnings);
};

export const parseAcademicImportExtraction = (value: unknown): AcademicImportExtraction | null => {
    if (!isRecord(value)) return null;
    if (value.importMode !== 'degree_plan' && value.importMode !== 'academic_results') return null;
    if (!isNullableString(value.documentLanguage)) return null;
    if (!Array.isArray(value.courses) || !value.courses.every(isCourse)) return null;
    if (!isStringArray(value.warnings)) return null;
    return value as unknown as AcademicImportExtraction;
};

export interface ExtractedTopic {
    title: string;
    description: string | null;
}

export interface CourseTopicsExtraction {
    topics: ExtractedTopic[];
}

export const courseTopicsJsonSchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
        topics: {
            type: 'array',
            items: {
                type: 'object',
                additionalProperties: false,
                properties: {
                    title: { type: 'string' },
                    description: { type: ['string', 'null'] }
                },
                required: ['title', 'description']
            }
        }
    },
    required: ['topics']
} as const;

export const parseCourseTopicsExtraction = (value: unknown): CourseTopicsExtraction | null => {
    if (!isRecord(value)) return null;
    if (!Array.isArray(value.topics)) return null;
    const isTopic = (t: unknown): t is ExtractedTopic => 
        isRecord(t) && typeof t.title === 'string' && isNullableString(t.description);
    if (!value.topics.every(isTopic)) return null;
    return value as unknown as CourseTopicsExtraction;
};
