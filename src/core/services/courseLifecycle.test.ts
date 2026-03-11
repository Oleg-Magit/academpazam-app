import { describe, it, expect } from 'vitest';
import { isAttemptPassed, createRepeatCourse, calculateAcademicMetrics } from './courseLifecycle';
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

        it('counts as needsRepeat if no pass exists but at least one fail exists', () => {
            // Case: Failed -> In Progress
            const metrics = calculateAcademicMetrics(
                [
                    { ...rootCourse, attemptStatus: 'failed' } as any,
                    { ...repeatCourse, attemptStatus: 'in_progress' } as any
                ],
                56
            );

            expect(metrics.needsRepeatCount).toBe(1);
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
});
