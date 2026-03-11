import type { Course, CourseWithTopics, Topic } from '../models/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Encapsulates the B0 legacy compatibility rules and B1 explicit lifecycle rules
 * to determine if an attempt explicitly passed or failed.
 */
export const isAttemptPassed = (course: Course | CourseWithTopics, passingThreshold: number): boolean => {
    // 1. Explicit modern lifecycle state (B1)
    if (course.attemptStatus === 'passed') return true;
    if (course.attemptStatus === 'failed') return false;

    // 2. Legacy grade-based fallback
    if (course.grade !== null && course.grade !== undefined) {
        return course.grade >= passingThreshold;
    }

    // 3. If no grade and no explicit attemptStatus exists, do NOT assume passing.
    // 'completed' effectiveStatus alone does not equal academic passing for credit counting.
    return false;
};

/**
 * Utility to identify the root course ID in a lineage.
 */
export const getRootCourseId = (courseId: string, courseMap: Map<string, Course>): string => {
    let current = courseId;
    const visited = new Set<string>();

    while (true) {
        visited.add(current);
        const c = courseMap.get(current);
        if (!c || !c.repeatedFromCourseId) return current;

        // Cycle prevention
        if (visited.has(c.repeatedFromCourseId)) return current;

        current = c.repeatedFromCourseId;
    }
};

/**
 * Resolves explicit repeat lineages backwards to group attempts.
 * Ensures passed attempts count only once per explicit lineage.
 */
export const calculateLineageEarnedCredits = (courses: CourseWithTopics[], passingThreshold: number): number => {
    return calculateAcademicMetrics(courses, passingThreshold).earnedCredits;
};

export interface AcademicMetrics {
    totalRequiredCredits: number;
    earnedCredits: number;
    completedCount: number;
    needsRepeatCount: number;
}

/**
 * Unified calculation of academic-level metrics.
 * Deduplicates by lineage and uses root-attempt canonical weights.
 */
export const calculateAcademicMetrics = (courses: CourseWithTopics[], passingThreshold: number): AcademicMetrics => {
    const courseMap = new Map<string, CourseWithTopics>();
    for (const c of courses) {
        courseMap.set(c.id, c);
    }

    const lineages = new Map<string, CourseWithTopics[]>();
    for (const c of courses) {
        const rootId = getRootCourseId(c.id, courseMap);
        if (!lineages.has(rootId)) {
            lineages.set(rootId, []);
        }
        lineages.get(rootId)!.push(c);
    }

    let totalRequiredCredits = 0;
    let earnedCredits = 0;
    let completedCount = 0;
    let needsRepeatCount = 0;

    for (const [rootId, lineageCourses] of lineages.entries()) {
        // Canonical Credits: from the root attempt
        const rootCourse = courseMap.get(rootId);
        const canonicalCredits = rootCourse?.credits ?? lineageCourses[0].credits;
        totalRequiredCredits += canonicalCredits;

        const hasPassedAttempt = lineageCourses.some(c => isAttemptPassed(c, passingThreshold));
        const hasFailedAttempt = lineageCourses.some(c => c.attemptStatus === 'failed' || (c.grade !== null && c.grade !== undefined && c.grade < passingThreshold));

        if (hasPassedAttempt) {
            earnedCredits += canonicalCredits;
            completedCount += 1;
        } else if (hasFailedAttempt) {
            needsRepeatCount += 1;
        }
    }

    return { totalRequiredCredits, earnedCredits, completedCount, needsRepeatCount };
};

/**
 * Pure helper to construct a new repeat course record.
 * Does NOT persist to DB.
 */
export function createRepeatCourse(
    source: Course,
    topics: Topic[],
    targetSemesterId: string,
    newAttemptNumber: number,
    initMode: 'copy_structure' | 'empty'
): { course: Course; topics: Topic[] } {
    const now = Date.now();
    const newCourseId = uuidv4();

    const newCourse: Course = {
        ...source,
        id: newCourseId,
        semesterId: targetSemesterId,
        repeatedFromCourseId: source.id,
        attemptStatus: 'planned',
        attemptNumber: newAttemptNumber,
        grade: null,
        manualStatus: 'not_started',
        createdAt: now,
        updatedAt: now,
    };

    let newTopics: Topic[] = [];
    if (initMode === 'copy_structure') {
        newTopics = topics.map((t) => ({
            id: uuidv4(),
            courseId: newCourseId,
            title: t.title,
            description: t.description,
            status: 'not_started',
            createdAt: now,
            updatedAt: now,
        }));
    }

    return { course: newCourse, topics: newTopics };
}
