import type { Course, CourseWithTopics } from '@/core/models/types';
import { isAttemptPassed, getRootCourseId } from './courseLifecycle';

export interface GpaResult {
    gpa: number | null;
    gradedCount: number;
    totalCredits: number;
}

export const computeDegreeGpa = (courses: Course[] | CourseWithTopics[], passingThreshold: number = 56): GpaResult => {
    const courseMap = new Map<string, Course>();
    for (const c of courses) {
        courseMap.set(c.id, c);
    }

    // 1. Group by lineage root
    const lineages = new Map<string, Course[]>();
    for (const c of courses) {
        const rootId = getRootCourseId(c.id, courseMap);
        if (!lineages.has(rootId)) {
            lineages.set(rootId, []);
        }
        lineages.get(rootId)!.push(c);
    }

    let totalWeightedScore = 0;
    let totalCredits = 0;
    let gradedLineageCount = 0;

    // 2. Process each lineage
    for (const lineageCourses of lineages.values()) {
        // Lineage Policy: 
        // Only lineages with at least one passing attempt contribute to GPA.
        // We pick the HIGHEST passing grade if multiple exist.
        const passingAttempts = lineageCourses.filter(c => isAttemptPassed(c, passingThreshold));

        if (passingAttempts.length > 0) {
            // Find max grade among passing attempts
            let maxGrade = -1;
            let canonicalCredits = 0;

            for (const attempt of passingAttempts) {
                if (attempt.grade !== null && attempt.grade !== undefined) {
                    if (attempt.grade > maxGrade) {
                        maxGrade = attempt.grade;
                        canonicalCredits = attempt.credits;
                    }
                }
            }

            if (maxGrade >= 0) {
                gradedLineageCount++;
                totalWeightedScore += maxGrade * canonicalCredits;
                totalCredits += canonicalCredits;
            }
        }
    }

    if (gradedLineageCount === 0 || totalCredits === 0) {
        return { gpa: null, gradedCount: 0, totalCredits: 0 };
    }

    return {
        gpa: Number((totalWeightedScore / totalCredits).toFixed(1)),
        gradedCount: gradedLineageCount,
        totalCredits
    };
};
