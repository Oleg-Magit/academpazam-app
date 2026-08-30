import { describe, expect, it } from 'vitest';
import { revalidateAcademicImportRow } from './reviewValidation';
import type { AcademicImportReviewRow } from './types';

const row = (overrides: Partial<AcademicImportReviewRow> = {}): AcademicImportReviewRow => ({
    sourceRowId: 'r1',
    action: 'add',
    targetCourseId: null,
    proposed: {
        name: 'Algorithms',
        credits: 4,
        grade: null,
        attemptStatus: 'planned',
        manualStatus: 'not_started',
        attemptNumber: 1,
    },
    semesterResolution: { kind: 'existing', semesterId: 's1', proposedSemester: null },
    matchReason: 'none',
    duplicateRisk: 'none',
    warnings: [],
    blockingReasons: [],
    ...overrides,
});

describe('revalidateAcademicImportRow', () => {
    it('forces degree-plan rows back to planned semantics after editing', () => {
        const result = revalidateAcademicImportRow(row({
            proposed: { name: 'Algorithms', credits: 4, grade: 95, attemptStatus: 'passed', manualStatus: 'completed' },
        }), 'degree_plan', 56);
        expect(result.proposed.grade).toBeNull();
        expect(result.proposed.attemptStatus).toBe('planned');
        expect(result.proposed.manualStatus).toBe('not_started');
    });

    it('recomputes academic status when user edits a numeric grade', () => {
        const result = revalidateAcademicImportRow(row({
            proposed: { name: 'Algorithms', credits: 4, grade: 55 },
        }), 'academic_results', 56);
        expect(result.proposed.attemptStatus).toBe('failed');
        expect(result.proposed.manualStatus).toBe('completed');
    });

    it('blocks invalid credits and unresolved semester for active rows', () => {
        const result = revalidateAcademicImportRow(row({
            proposed: { name: 'Algorithms', credits: 0, grade: null, attemptStatus: 'planned' },
            semesterResolution: { kind: 'unresolved', semesterId: null, proposedSemester: null },
        }), 'degree_plan', 56);
        expect(result.blockingReasons).toContain('invalid_credits');
        expect(result.blockingReasons).toContain('unresolved_semester');
    });

    it('does not block a skipped row', () => {
        const result = revalidateAcademicImportRow(row({
            action: 'skip',
            proposed: { name: '', credits: null, grade: 120 },
            semesterResolution: { kind: 'unresolved', semesterId: null, proposedSemester: null },
        }), 'academic_results', 56);
        expect(result.blockingReasons).toEqual([]);
    });
});
