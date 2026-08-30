import { describe, expect, it } from 'vitest';
import type { Course, Semester } from '@/core/models/types';
import { normalizeAcademicImport } from './academicImportNormalizer';
import type { AcademicImportExtraction, ExtractedAcademicCourse } from './types';

const semesters: Semester[] = [
    { id: 's1', name: 'Semester 1', createdAt: 1, orderIndex: 0, year: 1, term: 'A' },
    { id: 's2', name: 'Semester 2', createdAt: 2, orderIndex: 1, year: 1, term: 'B' },
];

const course = (overrides: Partial<Course> = {}): Course => ({
    id: 'c1',
    degreePlanId: 'p1',
    code: '101',
    name: 'Data Structures',
    credits: 4,
    semesterId: 's1',
    grade: null,
    manualStatus: 'not_started',
    attemptStatus: 'planned',
    attemptNumber: 1,
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
});

const extracted = (overrides: Partial<ExtractedAcademicCourse> = {}): ExtractedAcademicCourse => ({
    sourceRowId: 'row-1',
    code: '202',
    name: 'Algorithms',
    credits: 4,
    semesterLabel: 'Semester 2',
    year: 1,
    term: 'B',
    grade: null,
    explicitStatus: null,
    confidence: 0.95,
    warnings: [],
    ...overrides,
});

const normalize = (
    extraction: AcademicImportExtraction,
    courses: Course[] = [],
    customSemesters: Semester[] = semesters,
) => normalizeAcademicImport({
    extraction,
    planId: 'p1',
    passingThreshold: 56,
    courses,
    semesters: customSemesters,
});

describe('normalizeAcademicImport', () => {
    it('maps a degree-plan row to a planned course', () => {
        const rows = normalize({ importMode: 'degree_plan', documentLanguage: 'en', warnings: [], courses: [extracted()] });
        expect(rows[0].action).toBe('add');
        expect(rows[0].proposed.attemptStatus).toBe('planned');
        expect(rows[0].proposed.manualStatus).toBe('not_started');
        expect(rows[0].proposed.grade).toBeNull();
        expect(rows[0].semesterResolution.semesterId).toBe('s2');
    });

    it('derives passing status locally from a numeric result grade', () => {
        const rows = normalize({
            importMode: 'academic_results', documentLanguage: 'en', warnings: [],
            courses: [extracted({ code: '101', name: 'Data Structures', grade: 88, explicitStatus: 'failed', semesterLabel: null, year: null, term: null })],
        }, [course()]);

        expect(rows[0].action).toBe('update');
        expect(rows[0].targetCourseId).toBe('c1');
        expect(rows[0].proposed.grade).toBe(88);
        expect(rows[0].proposed.attemptStatus).toBe('passed');
        expect(rows[0].proposed.manualStatus).toBe('completed');
    });

    it('derives failing status locally even when AI says passed', () => {
        const rows = normalize({
            importMode: 'academic_results', documentLanguage: 'en', warnings: [],
            courses: [extracted({ code: '101', name: 'Data Structures', grade: 55, explicitStatus: 'passed', semesterLabel: null, year: null, term: null })],
        }, [course()]);

        expect(rows[0].proposed.attemptStatus).toBe('failed');
    });

    it('requires review when credits are missing for a new course', () => {
        const rows = normalize({
            importMode: 'degree_plan', documentLanguage: 'en', warnings: [],
            courses: [extracted({ credits: null })],
        });
        expect(rows[0].blockingReasons).toContain('missing_credits');
    });

    it('matches existing courses by exact normalized code before name', () => {
        const rows = normalize({
            importMode: 'academic_results', documentLanguage: 'en', warnings: [],
            courses: [extracted({ code: ' 101 ', name: 'Different Source Name', grade: 70, semesterLabel: null, year: null, term: null })],
        }, [course()]);
        expect(rows[0].targetCourseId).toBe('c1');
        expect(rows[0].matchReason).toBe('course_code');
    });

    it('falls back to normalized-name matching when no code exists', () => {
        const rows = normalize({
            importMode: 'academic_results', documentLanguage: 'en', warnings: [],
            courses: [extracted({ code: null, name: '  Data   Structures ', grade: 70, semesterLabel: null, year: null, term: null })],
        }, [course({ code: undefined })]);
        expect(rows[0].targetCourseId).toBe('c1');
        expect(rows[0].matchReason).toBe('normalized_name');
    });

    it('never silently updates when multiple existing courses match', () => {
        const rows = normalize({
            importMode: 'academic_results', documentLanguage: 'en', warnings: [],
            courses: [extracted({ code: '101', name: 'Data Structures', grade: 70 })],
        }, [course(), course({ id: 'c2', semesterId: 's2' })]);

        expect(rows[0].targetCourseId).toBeNull();
        expect(rows[0].action).toBe('add');
        expect(rows[0].blockingReasons).toContain('ambiguous_match');
    });

    it('marks an exact existing degree-plan course as skip instead of duplicating it', () => {
        const rows = normalize({
            importMode: 'degree_plan', documentLanguage: 'en', warnings: [],
            courses: [extracted({ code: '101', name: 'Data Structures', semesterLabel: null, year: null, term: null })],
        }, [course()]);
        expect(rows[0].action).toBe('skip');
        expect(rows[0].duplicateRisk).toBe('exact');
    });

    it('requires semester review when source and existing target provide no semester resolution', () => {
        const rows = normalize({
            importMode: 'degree_plan', documentLanguage: 'en', warnings: [],
            courses: [extracted({ semesterLabel: null, year: null, term: null })],
        });
        expect(rows[0].semesterResolution.kind).toBe('unresolved');
        expect(rows[0].blockingReasons).toContain('unresolved_semester');
    });

    it('creates one shared pending semester proposal for equivalent source rows', () => {
        const extraction: AcademicImportExtraction = {
            importMode: 'degree_plan',
            documentLanguage: 'en',
            warnings: [],
            courses: [
                extracted({ sourceRowId: 'r1', semesterLabel: 'Semester 3', year: 2, term: 'A' }),
                extracted({ sourceRowId: 'r2', code: '203', name: 'Operating Systems', semesterLabel: 'Semester 3', year: 2, term: 'A' }),
            ],
        };
        const rows = normalize(extraction);
        expect(rows[0].semesterResolution.kind).toBe('new');
        expect(rows[1].semesterResolution.semesterId).toBe(rows[0].semesterResolution.semesterId);
    });

    it('preserves an existing course academic state when a matched results row has no outcome', () => {
        const existing = course({ grade: 82, manualStatus: 'completed', attemptStatus: 'passed' });
        const rows = normalize({
            importMode: 'academic_results', documentLanguage: 'en', warnings: [],
            courses: [extracted({ code: '101', name: 'Data Structures', grade: null, explicitStatus: null, semesterLabel: null, year: null, term: null })],
        }, [existing]);
        expect(rows[0].proposed.grade).toBe(82);
        expect(rows[0].proposed.attemptStatus).toBe('passed');
        expect(rows[0].blockingReasons).not.toContain('missing_outcome');
    });
});
