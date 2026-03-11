import { describe, it, expect } from 'vitest';
import { calculateEffectiveStatus, calculateDegreeProgress } from './dataService';
import type { Course, Topic } from '../models/types';

describe('dataService', () => {
    describe('calculateEffectiveStatus', () => {
        const course: Course = {
            id: '1',
            degreePlanId: 'p1',
            name: 'Test Course',
            credits: 3,
            semesterId: '1',
            createdAt: 0,
            updatedAt: 0,
            manualStatus: 'not_started'
        };

        it('should return manualStatus if no topics', () => {
            expect(calculateEffectiveStatus(course, [])).toBe('not_started');
            expect(calculateEffectiveStatus({ ...course, manualStatus: 'completed' }, [])).toBe('completed');
        });

        it('should be in_progress if any topic is started', () => {
            const topics = [{ status: 'not_started' }, { status: 'in_progress' }] as Topic[];
            expect(calculateEffectiveStatus(course, topics)).toBe('in_progress');
        });

        it('should be completed only if all topics are done', () => {
            const topics = [{ status: 'done' }, { status: 'done' }] as Topic[];
            expect(calculateEffectiveStatus(course, topics)).toBe('completed');
        });

        it('should be not_started if all topics are not_started', () => {
            const topics = [{ status: 'not_started' }, { status: 'not_started' }] as Topic[];
            expect(calculateEffectiveStatus(course, topics)).toBe('not_started');
        });
    });

    describe('calculateDegreeProgress', () => {
        it('should calculate percentage correctly for unique courses', () => {
            const courses = [
                { id: 'c1', credits: 3, attemptStatus: 'passed', grade: 80 },
                { id: 'c2', credits: 4, attemptStatus: 'in_progress' },
                { id: 'c3', credits: 3, attemptStatus: 'planned' }
            ] as any[];

            const result = calculateDegreeProgress(courses, 56);
            expect(result.totalCredits).toBe(10);
            expect(result.completedCredits).toBe(3);
            expect(result.percentage).toBe(30);
        });

        it('should deduplicate credits for repeats and use root credits', () => {
            const courses = [
                { id: 'c1', credits: 3, attemptStatus: 'failed', grade: 40 },
                { id: 'c2', credits: 5, attemptStatus: 'passed', grade: 90, repeatedFromCourseId: 'c1' }
            ] as any[];

            const result = calculateDegreeProgress(courses, 56);
            expect(result.totalCredits).toBe(3); // Root credits (3) used, not repeat credits (5)
            expect(result.completedCredits).toBe(3); // Lineage passed
            expect(result.percentage).toBe(100);
            expect(result.academicCompletedCount).toBe(1);
        });

        it('should handle zero credits', () => {
            const result = calculateDegreeProgress([], 56);
            expect(result.percentage).toBe(0);
        });
    });
});
