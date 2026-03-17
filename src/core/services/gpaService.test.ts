import { describe, it, expect } from 'vitest';
import { computeDegreeGpa } from './gpaService';
import type { Course } from '../models/types';

describe('gpaService - Lineage Aware', () => {
    const mockCourse = (id: string, grade: number | null, credits: number = 3, repeatedFrom?: string, createdAt: number = 0): Course => ({
        id,
        degreePlanId: 'p1',
        name: `Course ${id}`,
        credits,
        grade,
        semesterId: 's1',
        repeatedFromCourseId: repeatedFrom,
        createdAt,
        updatedAt: createdAt,
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

    it('Scenario 7: pick LATEST passing grade if multiple exist (Policy Change)', () => {
        const courses = [
            mockCourse('c1', 80, 3, undefined, 100),
            mockCourse('c2', 60, 3, 'c1', 200)
        ];
        const result = computeDegreeGpa(courses, 56);
        expect(result.gpa).toBe(60); // Policy: latest passing grade, even if lower
        expect(result.gradedCount).toBe(1);
    });

    it('Scenario 8: Participated course excluded from GPA (EXCLUDED)', () => {
        const course = mockCourse('c1', 90);
        course.excludeFromAverage = true;
        const result = computeDegreeGpa([course], 56);
        expect(result.gpa).toBeNull();
        expect(result.gradedCount).toBe(0);
    });

    it('Scenario 9: Lineage with latest-passed-participated (EXCLUDED)', () => {
        const c1 = mockCourse('c1', 40, 3, undefined, 100);
        const c2 = mockCourse('c2', 80, 3, 'c1', 200);
        c2.excludeFromAverage = true;
        
        const result = computeDegreeGpa([c1, c2], 56);
        expect(result.gpa).toBeNull(); // Entire lineage excluded because canonical attempt is participated
        expect(result.gradedCount).toBe(0);
    });

    it('Scenario 10: Retake of a participated course (GPA uses latest pass)', () => {
        // Attempt A: Marked as Participated (should be ignored regardless of grade)
        const c1 = mockCourse('c1', 80, 3, undefined, 100);
        c1.excludeFromAverage = true;
        
        // Attempt B: Regular numeric pass
        const c2 = mockCourse('c2', 90, 3, 'c1', 200);
        
        // Result: GPA should be 90 (from B), and A should not contribute
        const result = computeDegreeGpa([c1, c2], 56);
        expect(result.gpa).toBe(90);
        expect(result.gradedCount).toBe(1);
        expect(result.totalCredits).toBe(3); // Lineage credits deduplicated
    });
});
