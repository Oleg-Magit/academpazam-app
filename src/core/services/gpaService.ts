import type { Course, CourseWithTopics } from '@/core/models/types';

export interface GpaResult {
    gpa: number | null;
    gradedCount: number;
    totalCredits: number;
}

export const computeDegreeGpa = (courses: Course[] | CourseWithTopics[]): GpaResult => {
    let totalWeightedScore = 0;
    let totalCredits = 0;
    let gradedCount = 0;
    let simpleSum = 0;

    for (const course of courses) {
        // Only consider courses with a valid grade
        if (course.grade !== null && course.grade !== undefined) {
            gradedCount++;
            simpleSum += course.grade;

            // Weighted average considers credits
            if (course.credits > 0) {
                totalWeightedScore += course.grade * course.credits;
                totalCredits += course.credits;
            }
        }
    }

    if (gradedCount === 0) {
        return { gpa: null, gradedCount: 0, totalCredits: 0 };
    }

    // Fallback to simple average if no credits match (unlikely but safe)
    if (totalCredits === 0) {
        return {
            gpa: Number((simpleSum / gradedCount).toFixed(1)),
            gradedCount,
            totalCredits: 0
        };
    }

    return {
        gpa: Number((totalWeightedScore / totalCredits).toFixed(1)),
        gradedCount,
        totalCredits
    };
};
