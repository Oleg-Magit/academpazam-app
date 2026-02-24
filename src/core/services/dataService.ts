import type { Course, Topic, CourseStatus, CourseWithTopics, SemesterGroup } from '../models/types';
import { getTopicsByCourse } from '../db/db';

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
export const groupCoursesBySemester = (courses: CourseWithTopics[], semesterConfig?: { count: number, labels: string[] }): SemesterGroup[] => {
    const groups: Record<string, SemesterGroup> = {};
    const count = semesterConfig?.count ?? 8;
    const labels = semesterConfig?.labels ?? [];

    for (let i = 1; i <= count; i++) {
        const semStr = i.toString();
        groups[semStr] = {
            semester: semStr,
            courses: [],
            totalCredits: 0,
            completedCredits: 0,
            label: labels[i - 1]
        };
    }

    courses.forEach(course => {
        const sem = course.semester;
        if (!groups[sem]) {
            groups[sem] = { semester: sem, courses: [], totalCredits: 0, completedCredits: 0 };
        }
        groups[sem].courses.push(course);
        groups[sem].totalCredits += course.credits;
        if (course.effectiveStatus === 'completed') {
            groups[sem].completedCredits += course.credits;
        }
    });

    return Object.values(groups).sort((a, b) => {
        const semA = parseInt(a.semester) || 999;
        const semB = parseInt(b.semester) || 999;
        return semA - semB;
    });
};

/**
 * Calculates high-level degree progress metrics.
 */
export const calculateDegreeProgress = (courses: CourseWithTopics[]) => {
    const totalCredits = courses.reduce((sum, c) => sum + c.credits, 0);
    const completedCredits = courses
        .filter(c => c.effectiveStatus === 'completed')
        .reduce((sum, c) => sum + c.credits, 0);

    return {
        totalCredits,
        completedCredits,
        percentage: totalCredits > 0 ? (completedCredits / totalCredits) * 100 : 0
    };
};
