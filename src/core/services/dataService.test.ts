import { describe, it, expect } from 'vitest';
import { calculateEffectiveStatus, calculateDegreeProgress } from './dataService';
import type { Course, Topic, CourseWithTopics } from '../models/types';

describe('dataService', () => {
    describe('calculateEffectiveStatus', () => {
        const course: Course = {
            id: '1',
            degreePlanId: 'p1',
            name: 'Test Course',
            credits: 3,
            semester: '1',
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
        it('should calculate percentage correctly', () => {
            const courses = [
                { credits: 3, effectiveStatus: 'completed' },
                { credits: 4, effectiveStatus: 'in_progress' },
                { credits: 3, effectiveStatus: 'not_started' }
            ] as CourseWithTopics[];

            const result = calculateDegreeProgress(courses);
            expect(result.totalCredits).toBe(10);
            expect(result.completedCredits).toBe(3);
            expect(result.percentage).toBe(30);
        });

        it('should handle zero credits', () => {
            const result = calculateDegreeProgress([]);
            expect(result.percentage).toBe(0);
        });
    });
});
