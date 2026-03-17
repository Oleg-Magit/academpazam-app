import type { Course, CourseWithTopics } from '@/core/models/types';
import { isAttemptPassed, getRootCourseId } from './courseLifecycle';

export interface GpaResult {
    gpa: number | null;
    gradedCount: number;
    totalCredits: number;
    needsImprovementCount: number;
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
    let needsImprovementCount = 0;

    // 2. Process each lineage
    for (const lineageCourses of lineages.values()) {
        const sorted = [...lineageCourses].sort((a, b) => a.createdAt - b.createdAt);
        const passedAttempts = sorted.filter(c => isAttemptPassed(c, passingThreshold));

        if (passedAttempts.length > 0) {
            const canonicalAttempt = passedAttempts[passedAttempts.length - 1];
            
            if (canonicalAttempt.excludeFromAverage) {
                continue;
            }

            if (canonicalAttempt.grade !== null && canonicalAttempt.grade !== undefined) {
                gradedLineageCount++;
                totalWeightedScore += canonicalAttempt.grade * canonicalAttempt.credits;
                totalCredits += canonicalAttempt.credits;

                // IMPROVEMENT METRIC FIX: 
                // Canonical-only passed courses with grade below 70
                if (canonicalAttempt.grade < 70) {
                    needsImprovementCount++;
                }
            }
        }
    }

    if (gradedLineageCount === 0 || totalCredits === 0) {
        return { gpa: null, gradedCount: 0, totalCredits: 0, needsImprovementCount: 0 };
    }

    return {
        gpa: Number((totalWeightedScore / totalCredits).toFixed(1)),
        gradedCount: gradedLineageCount,
        totalCredits,
        needsImprovementCount
    };
};
