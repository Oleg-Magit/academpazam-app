import { describe, it, expect } from 'vitest';
import { computeDegreeGpa } from './gpaService';
import type { Course } from '../models/types';

describe('gpaService - Lineage Aware', () => {
    const mockCourse = (id: string, grade: number | null, credits: number = 3, repeatedFrom?: string): Course => ({
        id,
        degreePlanId: 'p1',
        name: `Course ${id}`,
        credits,
        grade,
        semesterId: 's1',
        repeatedFromCourseId: repeatedFrom,
        createdAt: 0,
        updatedAt: 0,
        attemptStatus: grade === null ? 'planned' : (grade >= 56 ? 'passed' : 'failed')
    });

    it('Scenario 1: single standalone passed course (PASS)', () => {
        const courses = [mockCourse('c1', 90)];
        const result = computeDegreeGpa(courses, 56);
        expect(result.gpa).toBe(90);
        expect(result.gradedCount).toBe(1);
    });

    it('Scenario 2: single failed course (IGNORED)', () => {
        const courses = [mockCourse('c1', 40)];
        const result = computeDegreeGpa(courses, 56);
        expect(result.gpa).toBeNull();
        expect(result.gradedCount).toBe(0);
    });

    it('Scenario 3: failed then passed repeat -> GPA uses passing grade only (PASS)', () => {
        const courses = [
            mockCourse('c1', 40),
            mockCourse('c2', 80, 3, 'c1')
        ];
        const result = computeDegreeGpa(courses, 56);
        expect(result.gpa).toBe(80);
        expect(result.gradedCount).toBe(1);
        expect(result.totalCredits).toBe(3);
    });

    it('Scenario 4: multiple failed then pass -> GPA uses best passing grade only (PASS)', () => {
        const courses = [
            mockCourse('c1', 40),
            mockCourse('c2', 50, 3, 'c1'),
            mockCourse('c3', 70, 3, 'c2')
        ];
        const result = computeDegreeGpa(courses, 56);
        expect(result.gpa).toBe(70);
        expect(result.gradedCount).toBe(1);
    });

    it('Scenario 5: two independent lineages aggregated correctly (PASS)', () => {
        const courses = [
            mockCourse('a1', 90, 2),
            mockCourse('b1', 40, 4),
            mockCourse('b2', 60, 4, 'b1')
        ];
        // Weighted: (90*2 + 60*4) / (2+4) = (180 + 240) / 6 = 420 / 6 = 70
        const result = computeDegreeGpa(courses, 56);
        expect(result.gpa).toBe(70);
        expect(result.gradedCount).toBe(2);
    });

    it('Scenario 6: lineage with no pass anywhere (EXCLUDED)', () => {
        const courses = [
            mockCourse('c1', 40),
            mockCourse('c2', 50, 3, 'c1')
        ];
        const result = computeDegreeGpa(courses, 56);
        expect(result.gpa).toBeNull();
        expect(result.gradedCount).toBe(0);
    });

    it('Scenario 7: pick HIGHEST passing grade if multiple exist', () => {
        const courses = [
            mockCourse('c1', 60),
            mockCourse('c2', 80, 3, 'c1')
        ];
        const result = computeDegreeGpa(courses, 56);
        expect(result.gpa).toBe(80); // Policy: best passing grade
        expect(result.gradedCount).toBe(1);
    });
});
