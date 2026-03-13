import type { Course, CourseWithTopics, Topic } from '../models/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Encapsulates the B0 legacy compatibility rules and B1 explicit lifecycle rules
 * to determine if an attempt explicitly passed or failed.
 */
export const isAttemptPassed = (course: Course | CourseWithTopics, passingThreshold: number): boolean => {
    // Lightweight validation: Planned or In Progress attempts shouldn't have grades for credit counting
    if (course.attemptStatus === 'planned' || course.attemptStatus === 'in_progress') {
        return false;
    }

    // 1. Explicit modern lifecycle state (B1)
    if (course.attemptStatus === 'passed') return true;
    if (course.attemptStatus === 'failed') return false;

    // 2. Legacy grade-based fallback
    if (course.grade !== null && course.grade !== undefined) {
        return course.grade >= passingThreshold;
    }

    // 3. If no grade and no explicit attemptStatus exists, do NOT assume passing.
    return false;
};

/**
 * Validates a course for internal consistency.
 * Pure and non-mutating.
 */
export const validateCourseState = (course: Course): { valid: boolean; issues: string[] } => {
    const issues: string[] = [];
    
    if (course.attemptStatus === 'planned' || course.attemptStatus === 'in_progress') {
        if (course.grade !== null && course.grade !== undefined) {
            issues.push(`Course in ${course.attemptStatus} state cannot have a grade.`);
        }
    }

    if (course.repeatedFromCourseId === course.id) {
        issues.push('Course cannot repeat itself.');
    }

    return { valid: issues.length === 0, issues };
};

/**
 * Utility to identify the root course ID in a lineage.
 */
export const getRootCourseId = (courseId: string, courseMap: Map<string, Course>): string => {
    let currentId = courseId;
    const visited = new Set<string>();

    while (true) {
        visited.add(currentId);
        const course = courseMap.get(currentId);
        
        // 1. End of lineage or orphan reference
        if (!course || !course.repeatedFromCourseId) {
            return currentId;
        }

        const nextId = course.repeatedFromCourseId;

        // 2. Self-reference check
        if (nextId === currentId) {
            return currentId;
        }

        // 3. Missing source (Orphan Repeat Guard)
        if (!courseMap.has(nextId)) {
            return currentId;
        }

        // 4. Cycle detection (Already visited)
        if (visited.has(nextId)) {
            return nextId;
        }

        currentId = nextId;
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
        if (c && c.id) {
            courseMap.set(c.id, c);
        }
    }

    const lineages = new Map<string, CourseWithTopics[]>();
    for (const c of courses) {
        if (!c || !c.id) continue;
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

/**
 * Constructs a lookup record of academic status for all attempts in a set of courses.
 * Map: courseId -> 'passed_req' | 'needs_repeat' | 'none'
 */
export const buildLineageMetadata = (
    courses: CourseWithTopics[],
    passingThreshold: number
): Record<string, 'passed_req' | 'needs_repeat' | 'none'> => {
    const courseMap = new Map<string, CourseWithTopics>();
    for (const c of courses) {
        if (c && c.id) {
            courseMap.set(c.id, c);
        }
    }

    const lineages = new Map<string, CourseWithTopics[]>();
    for (const c of courses) {
        if (!c || !c.id) continue;
        const rootId = getRootCourseId(c.id, courseMap);
        if (!lineages.has(rootId)) {
            lineages.set(rootId, []);
        }
        lineages.get(rootId)!.push(c);
    }

    const metadata: Record<string, 'passed_req' | 'needs_repeat' | 'none'> = {};

    for (const lineageCourses of lineages.values()) {
        const hasPassedAttempt = lineageCourses.some(c => isAttemptPassed(c, passingThreshold));
        const hasFailedAttempt = lineageCourses.some(c =>
            c.attemptStatus === 'failed' ||
            (c.grade !== null && c.grade !== undefined && c.grade < passingThreshold)
        );

        let status: 'passed_req' | 'needs_repeat' | 'none' = 'none';

        if (hasPassedAttempt) {
            status = 'passed_req';
        } else if (hasFailedAttempt) {
            status = 'needs_repeat';
        }

        for (const c of lineageCourses) {
            metadata[c.id] = status;
        }
    }

    return metadata;
};
