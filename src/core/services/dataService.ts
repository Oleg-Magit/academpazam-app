import type { Course, Topic, CourseStatus, CourseWithTopics, SemesterGroup, Semester } from '../models/types';
import { getTopicsByCourse } from '../db/db';
import { calculateAcademicMetrics, buildLineageMetadata, isAttemptPassed, isAttemptFailed } from './courseLifecycle';

/**
 * Determines the display status of a course based on its topics.
 * If no topics exist, falls back to the manual user-set status.
 */
export const calculateEffectiveStatus = (course: Course, topics: Topic[]): CourseStatus => {
    if (topics.length === 0) {
        return course.manualStatus || 'not_started';
    }

    const allDone = topics.every(t => t.status === 'done');
    if (allDone) return 'completed';

    const anyStarted = topics.some(t => t.status === 'in_progress' || t.status === 'done');
    return anyStarted ? 'in_progress' : 'not_started';
};

/**
 * Loads and attaches topics and effective status to a list of courses.
 */
export const enrichCourses = async (courses: Course[]): Promise<CourseWithTopics[]> => {
    const enriched = await Promise.all(courses.map(async (course) => {
        const topics = await getTopicsByCourse(course.id);
        const effectiveStatus = calculateEffectiveStatus(course, topics);
        return { ...course, topics, effectiveStatus };
    }));
    return enriched;
};

/**
 * Groups courses into semesters for roadmap rendering.
 */
export const groupCoursesBySemester = (
    courses: CourseWithTopics[],
    semesters: Semester[],
    passingThreshold: number
): SemesterGroup[] => {
    const groups: Record<string, SemesterGroup> = {};
    
    // Initialize groups from canonical semesters list
    semesters.forEach(sem => {
        groups[sem.id] = {
            semesterId: sem.id,
            semesterName: sem.name,
            orderIndex: sem.orderIndex,
            year: sem.year,
            term: sem.term,
            courses: [],
            totalCredits: 0, // Semester attempts total weight
            completedCredits: 0, // Semester attempts earned credits
            semesterLoad: 0, // Alias for totalCredits for clarity
            attemptFailedCount: 0 // Count of failed attempts in this semester
        };
    });

    const lineageMetadata = buildLineageMetadata(courses, passingThreshold);

    courses.forEach(course => {
        const semId = course.semesterId;
        // Handle potential orphan courses (fallback group)
        if (!groups[semId]) {
            groups[semId] = {
                semesterId: semId,
                semesterName: 'Other',
                orderIndex: 999,
                courses: [],
                totalCredits: 0,
                completedCredits: 0
            };
        }
        groups[semId].courses.push(course);
        groups[semId].totalCredits += course.credits;
        
        // SEMANTIC MODEL FIX (v1.8 / v1.9):
        // Semester-level accomplishment is based on effective academic resolution.
        // Credits count as "completed" for the semester if:
        // 1. The attempt is locally passed.
        // 2. OR the attempt is a failure that has been resolved by a later retake (planned, in-progress, or passed).
        const attemptPassed = isAttemptPassed(course, passingThreshold);
        const resolvedFailure = isAttemptFailed(course, passingThreshold) && !lineageMetadata[course.id]?.holdsNeedsRepeat;

        if (attemptPassed || resolvedFailure) {
            groups[semId].completedCredits += course.credits;
        }

        // SEMESTER ALERT FIX (v1.9):
        // We only trigger a red badge/alert if the attempt is "unresolved".
        // This means it's a failure (or grade-failure) that:
        // 1. Is the latest attempt in its lineage
        // 2. Has no subsequent pass
        // 3. Has no active retake session (planned/in_progress)
        if (lineageMetadata[course.id]?.holdsNeedsRepeat) {
            groups[semId].attemptFailedCount = (groups[semId].attemptFailedCount || 0) + 1;
        }
    });

    // Return sorted by orderIndex
    return Object.values(groups).sort((a, b) => a.orderIndex - b.orderIndex);
};

/**
 * Calculates high-level degree progress metrics.
 */
export const calculateDegreeProgress = (courses: CourseWithTopics[], passingThreshold: number) => {
    const metrics = calculateAcademicMetrics(courses, passingThreshold);

    return {
        totalCredits: metrics.totalRequiredCredits,
        completedCredits: metrics.earnedCredits,
        percentage: metrics.totalRequiredCredits > 0 ? (metrics.earnedCredits / metrics.totalRequiredCredits) * 100 : 0,
        academicCompletedCount: metrics.completedCount,
        academicNeedsRepeatCount: metrics.needsRepeatCount
    };
};
