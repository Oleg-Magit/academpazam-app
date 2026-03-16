import { describe, it, expect } from 'vitest';
import { 
    isAttemptPassed, 
    createRepeatCourse, 
    calculateAcademicMetrics, 
    buildLineageMetadata, 
    validateCourseState, 
    getRootCourseId 
} from './courseLifecycle';
import type { Course, Topic } from '../models/types';

describe('courseLifecycle', () => {
    const mockCourse: Course = {
        id: 'c1',
        degreePlanId: 'p1',
        name: 'Test Course',
        credits: 3,
        semesterId: 's1',
        createdAt: 0,
        updatedAt: 0,
    };

    describe('isAttemptPassed', () => {
        it('prioritizes explicit passed status', () => {
            expect(isAttemptPassed({ ...mockCourse, attemptStatus: 'passed', grade: 40 }, 56)).toBe(true);
        });

        it('prioritizes explicit failed status', () => {
            expect(isAttemptPassed({ ...mockCourse, attemptStatus: 'failed', grade: 90 }, 56)).toBe(false);
        });

        it('falls back to grade comparison', () => {
            expect(isAttemptPassed({ ...mockCourse, grade: 60 }, 56)).toBe(true);
            expect(isAttemptPassed({ ...mockCourse, grade: 50 }, 56)).toBe(false);
        });

        it('returns false if no grade and no status', () => {
            expect(isAttemptPassed(mockCourse, 56)).toBe(false);
        });

        it('returns false for planned/in_progress even if grade is accidentally set', () => {
            expect(isAttemptPassed({ ...mockCourse, attemptStatus: 'planned', grade: 100 }, 56)).toBe(false);
            expect(isAttemptPassed({ ...mockCourse, attemptStatus: 'in_progress', grade: 100 }, 56)).toBe(false);
        });
    });

    describe('validateCourseState', () => {
        it('identifies planned/in_progress courses with grades as invalid', () => {
            const res = validateCourseState({ ...mockCourse, attemptStatus: 'planned', grade: 80 });
            expect(res.valid).toBe(false);
            expect(res.issues[0]).toContain('cannot have a grade');
        });

        it('identifies self-repeating courses as invalid', () => {
            const res = validateCourseState({ ...mockCourse, repeatedFromCourseId: 'c1' });
            expect(res.valid).toBe(false);
            expect(res.issues[0]).toContain('cannot repeat itself');
        });

        it('passes valid courses', () => {
            const res = validateCourseState({ ...mockCourse, attemptStatus: 'passed', grade: 80 });
            expect(res.valid).toBe(true);
        });
    });

    describe('getRootCourseId', () => {
        it('detects simple cycles and returns current node as fallback', () => {
            const map = new Map<string, Course>();
            map.set('c1', { ...mockCourse, id: 'c1', repeatedFromCourseId: 'c2' });
            map.set('c2', { ...mockCourse, id: 'c2', repeatedFromCourseId: 'c1' });
            
            expect(getRootCourseId('c1', map)).toBe('c1');
            expect(getRootCourseId('c2', map)).toBe('c2');
        });

        it('handles self-repeating courses', () => {
            const map = new Map<string, Course>();
            map.set('c1', { ...mockCourse, id: 'c1', repeatedFromCourseId: 'c1' });
            expect(getRootCourseId('c1', map)).toBe('c1');
        });

        it('handles orphan repeat references', () => {
            const map = new Map<string, Course>();
            map.set('c1', { ...mockCourse, id: 'c1', repeatedFromCourseId: 'non-existing' });
            expect(getRootCourseId('c1', map)).toBe('c1');
        });

        it('traverses normal lineages correctly', () => {
            const map = new Map<string, Course>();
            map.set('c2', { ...mockCourse, id: 'c2', repeatedFromCourseId: 'c1' });
            map.set('c1', { ...mockCourse, id: 'c1' });
            expect(getRootCourseId('c2', map)).toBe('c1');
        });
    });

    describe('createRepeatCourse', () => {
        const mockTopics: Topic[] = [
            { id: 't1', courseId: 'c1', title: 'Topic 1', status: 'done', createdAt: 0, updatedAt: 0 }
        ];

        it('creates a linked repeat with incremented attempt number', () => {
            const { course } = createRepeatCourse(
                { ...mockCourse, attemptNumber: 1 },
                [],
                's2',
                2,
                'empty'
            );

            expect(course.repeatedFromCourseId).toBe('c1');
            expect(course.semesterId).toBe('s2');
            expect(course.attemptNumber).toBe(2);
            expect(course.attemptStatus).toBe('planned');
            expect(course.grade).toBeNull();
        });

        it('clones topics structure but resets status when initMode is copy_structure', () => {
            const { course, topics } = createRepeatCourse(
                mockCourse,
                mockTopics,
                's2',
                2,
                'copy_structure'
            );

            expect(topics).toHaveLength(1);
            expect(topics[0].title).toBe('Topic 1');
            expect(topics[0].status).toBe('not_started');
            expect(topics[0].courseId).toBe(course.id);
            expect(topics[0].id).not.toBe('t1');
        });

        it('returns no topics when initMode is empty', () => {
            const { topics } = createRepeatCourse(
                mockCourse,
                mockTopics,
                's2',
                2,
                'empty'
            );

            expect(topics).toHaveLength(0);
        });
    });

    describe('calculateAcademicMetrics', () => {
        const rootCourse: Course = { ...mockCourse, id: 'root', credits: 3 };
        const repeatCourse: Course = { ...mockCourse, id: 'repeat', credits: 4, repeatedFromCourseId: 'root' };

        it('deduplicates lineages and uses root credits as canonical', () => {
            const metrics = calculateAcademicMetrics(
                [
                    { ...rootCourse, attemptStatus: 'failed' } as any,
                    { ...repeatCourse, attemptStatus: 'planned' } as any
                ],
                56
            );

            expect(metrics.totalRequiredCredits).toBe(3); // From root
            expect(metrics.earnedCredits).toBe(0);
            expect(metrics.completedCount).toBe(0);
        });

        it('marks lineage as completed if any attempt passed', () => {
            const metrics = calculateAcademicMetrics(
                [
                    { ...rootCourse, attemptStatus: 'failed' } as any,
                    { ...repeatCourse, attemptStatus: 'passed' } as any
                ],
                56
            );

            expect(metrics.totalRequiredCredits).toBe(3);
            expect(metrics.earnedCredits).toBe(3);
            expect(metrics.completedCount).toBe(1);
            expect(metrics.needsRepeatCount).toBe(0);
        });

        it('does NOT count as needsRepeat if an active retake exists', () => {
            // Case: Failed -> In Progress
            const metrics = calculateAcademicMetrics(
                [
                    { ...rootCourse, attemptStatus: 'failed' } as any,
                    { ...repeatCourse, attemptStatus: 'in_progress' } as any
                ],
                56
            );

            expect(metrics.needsRepeatCount).toBe(0); // Remediation: active retake suppresses it
            expect(metrics.completedCount).toBe(0);
        });

        it('does NOT count as needsRepeat if no failure exists (even if planned)', () => {
            const metrics = calculateAcademicMetrics(
                [{ ...rootCourse, attemptStatus: 'planned' } as any],
                56
            );
            expect(metrics.needsRepeatCount).toBe(0);
        });
    });

    describe('buildLineageMetadata', () => {
        const c1: any = { id: 'c1', credits: 3, attemptStatus: 'failed', updatedAt: 100 };
        const c2: any = { id: 'c2', credits: 3, repeatedFromCourseId: 'c1', attemptStatus: 'passed', updatedAt: 200 };
        const c3: any = { id: 'c3', credits: 4, attemptStatus: 'failed', updatedAt: 300 };

        it('assigns holdsPassedReq: true to the correct attempt in a passed lineage', () => {
            const metadata = buildLineageMetadata([c1, c2], 56);
            expect(metadata['c1'].holdsPassedReq).toBe(false); // c1 is the failure
            expect(metadata['c2'].holdsPassedReq).toBe(true);  // c2 is the pass
        });

        it('assigns holdsNeedsRepeat: true to the attempt in a failed lineage', () => {
            const metadata = buildLineageMetadata([c3], 56);
            expect(metadata['c3'].holdsNeedsRepeat).toBe(true);
        });

        it('assigns no requirement flags to planned courses with no history', () => {
            const c4: any = { id: 'c4', credits: 3, attemptStatus: 'planned' };
            const metadata = buildLineageMetadata([c4], 56);
            expect(metadata['c4'].holdsPassedReq).toBe(false);
            expect(metadata['c4'].holdsNeedsRepeat).toBe(false);
        });

        it('handles complex lineages correctly', () => {
            const c5: any = { id: 'c5', credits: 3, attemptStatus: 'failed' };
            const c6: any = { id: 'c6', credits: 3, repeatedFromCourseId: 'c5', attemptStatus: 'failed' };
            const metadata = buildLineageMetadata([c5, c6], 56);
            expect(metadata['c5'].holdsNeedsRepeat).toBe(false); // c6 is successor
            expect(metadata['c6'].holdsNeedsRepeat).toBe(true);
        });
    });
});
