import { describe, it, expect } from 'vitest';
import { 
    calculateAcademicMetrics, 
    buildLineageMetadata, 
    stitchAndRecomputeLineage
} from './courseLifecycle';
import type { CourseWithTopics } from '../models/types';

describe('Lineage Integrity Invariants', () => {
    const THRESHOLD = 56;

    const mockCourse = (id: string, grade: number | null, repeatedFrom?: string, createdAt: number = Date.now()): CourseWithTopics => ({
        id,
        degreePlanId: 'p1',
        name: `Course ${id}`,
        credits: 3,
        grade,
        semesterId: 's1',
        repeatedFromCourseId: repeatedFrom,
        createdAt,
        updatedAt: createdAt,
        attemptStatus: grade === null ? 'planned' : (grade >= THRESHOLD ? 'passed' : 'failed'),
        topics: [],
        manualStatus: 'not_started',
        effectiveStatus: grade === null ? 'in_progress' : (grade >= THRESHOLD ? 'completed' : 'failed')
    } as any);

    it('Invariant 1: failed attempt never contributes earned credits', () => {
        const courses = [mockCourse('c1', 40)];
        const metrics = calculateAcademicMetrics(courses, THRESHOLD);
        expect(metrics.earnedCredits).toBe(0);
        expect(metrics.completedCount).toBe(0);
        expect(metrics.needsRepeatCount).toBe(1);
    });

    it('Invariant 2: failed attempt never owns passed requirement', () => {
        const courses = [mockCourse('c1', 40)];
        const meta = buildLineageMetadata(courses, THRESHOLD);
        expect(meta['c1'].holdsPassedReq).toBe(false);
        expect(meta['c1'].holdsNeedsRepeat).toBe(true);
    });

    it('Invariant 3: repeat attempt does not show needsRepeat while active', () => {
        const courses = [
            mockCourse('c1', 40, undefined, 100),
            mockCourse('c2', null, 'c1', 200) // Planned/Active repeat
        ];
        const meta = buildLineageMetadata(courses, THRESHOLD);
        const metrics = calculateAcademicMetrics(courses, THRESHOLD);
        
        expect(meta['c1'].holdsNeedsRepeat).toBe(false); // c2 is addressing it
        expect(meta['c2'].holdsNeedsRepeat).toBe(false); // c2 is active
        expect(metrics.needsRepeatCount).toBe(0); // Dashboard reflects retake in progress
    });

    it('Invariant 4 & 5: passed repeat owns passed requirement exclusively & credits counted once', () => {
        const courses = [
            mockCourse('c1', 40, undefined, 100),
            mockCourse('c2', 80, 'c1', 200)
        ];
        const meta = buildLineageMetadata(courses, THRESHOLD);
        const metrics = calculateAcademicMetrics(courses, THRESHOLD);

        expect(meta['c1'].holdsPassedReq).toBe(false);
        expect(meta['c2'].holdsPassedReq).toBe(true);
        expect(metrics.earnedCredits).toBe(3); // Counted once
        expect(metrics.completedCount).toBe(1);
    });

    it('Invariant 6: dashboard counters stay internally consistent', () => {
        const courses = [
            mockCourse('c1', 40, undefined, 100),
            mockCourse('c2', 50, 'c1', 200),
            mockCourse('c3', null, 'c2', 300)
        ];
        const metrics = calculateAcademicMetrics(courses, THRESHOLD);
        expect(metrics.earnedCredits).toBe(0);
        expect(metrics.needsRepeatCount).toBe(0); // Because c3 is active
    });

    it('Invariant 7: deleting original attempt removes orphan repeat semantics (Stitching)', () => {
        const c1 = mockCourse('c1', 40, undefined, 100);
        const c2 = mockCourse('c2', 80, 'c1', 200);
        const all = [c1, c2];

        // Delete c1
        const afterDelete = stitchAndRecomputeLineage('c1', all);
        const c2Fixed = afterDelete.find(c => c.id === 'c2')!;
        expect(c2Fixed.repeatedFromCourseId).toBeUndefined(); // Orphan guard

        // build metadata on new state
        const meta = buildLineageMetadata(afterDelete as any, THRESHOLD);
        expect(meta['c2'].derivedAttemptNumber).toBe(1); // Renumbered
        expect(meta['c2'].isValidRepeat).toBe(false); // No longer a repeat
    });

    it('Invariant 8: deleting repeat restores needsRepeat to the failed attempt', () => {
        const c1 = mockCourse('c1', 40, undefined, 100);
        const c2 = mockCourse('c2', null, 'c1', 200);
        const all = [c1, c2];

        // Delete c2
        const afterDelete = all.filter(c => c.id !== 'c2');
        const meta = buildLineageMetadata(afterDelete as any, THRESHOLD);
        const metrics = calculateAcademicMetrics(afterDelete as any, THRESHOLD);

        expect(meta['c1'].holdsNeedsRepeat).toBe(true); // Restored
        expect(metrics.needsRepeatCount).toBe(1); // Dashboard restored
    });

    it('Regression: latest valid passed attempt owns the requirement', () => {
        const courses = [
            mockCourse('c1', 60, undefined, 100),
            mockCourse('c2', 80, 'c1', 200)
        ];
        const meta = buildLineageMetadata(courses, THRESHOLD);
        expect(meta['c1'].holdsPassedReq).toBe(false);
        expect(meta['c2'].holdsPassedReq).toBe(true); // Latest wins
    });
});
