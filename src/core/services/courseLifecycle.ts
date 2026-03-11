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
 * Resolves explicit repeat lineages backwards to group attempts.
 * Ensures passed attempts count only once per explicit lineage.
 */
export const calculateLineageEarnedCredits = (courses: CourseWithTopics[], passingThreshold: number): number => {
    // Map to quickly lookup course by id
    const courseMap = new Map<string, CourseWithTopics>();
    for (const c of courses) {
        courseMap.set(c.id, c);
    }

    // Identify the "root" attempt for each course traversing repeatedFromCourseId backwards
    const getRootCourseId = (courseId: string): string => {
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

    // Group courses by their lineage root
    const lineages = new Map<string, CourseWithTopics[]>();
    for (const c of courses) {
        const rootId = getRootCourseId(c.id);
        if (!lineages.has(rootId)) {
            lineages.set(rootId, []);
        }
        lineages.get(rootId)!.push(c);
    }

    // Calculate sum: 1 time per lineage if at least one attempt is passed
    let totalEarnedCredits = 0;
    
    for (const [_, lineageCourses] of lineages.entries()) {
        const hasPassedAttempt = lineageCourses.some(c => isAttemptPassed(c, passingThreshold));
        
        if (hasPassedAttempt) {
            // Take the credits of the passed attempt (fallback to first in array)
            const passedCourse = lineageCourses.find(c => isAttemptPassed(c, passingThreshold));
            totalEarnedCredits += (passedCourse?.credits ?? lineageCourses[0].credits);
        }
    }

    return totalEarnedCredits;
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
