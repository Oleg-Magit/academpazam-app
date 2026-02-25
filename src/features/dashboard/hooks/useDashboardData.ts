import { useMemo } from 'react';
import { calculateDegreeProgress, groupCoursesBySemester } from '@/core/services/dataService';
import type { CourseWithTopics } from '@/core/models/types';

export const useDashboardData = (courses: CourseWithTopics[] | null, semesterConfig: { count: number, labels: string[] } | undefined) => {
    return useMemo(() => {
        if (!courses) return {
            progress: { totalCredits: 0, completedCredits: 0, percentage: 0 },
            bySemester: [],
            stats: { completedCount: 0, inProgressCount: 0, totalRemainingCredits: 0 }
        };

        const prog = calculateDegreeProgress(courses);
        const semesters = groupCoursesBySemester(courses, semesterConfig);

        const stats = {
            completedCount: courses.filter(c => c.effectiveStatus === 'completed').length,
            inProgressCount: courses.filter(c => c.effectiveStatus === 'in_progress').length,
            totalRemainingCredits: Math.max(0, prog.totalCredits - prog.completedCredits)
        };

        return { progress: prog, bySemester: semesters, stats };
    }, [courses, semesterConfig]);
};
