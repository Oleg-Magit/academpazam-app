import { useMemo } from 'react';
import { calculateDegreeProgress, groupCoursesBySemester } from '@/core/services/dataService';
import type { CourseWithTopics, Semester } from '@/core/models/types';

export const useDashboardData = (courses: CourseWithTopics[] | null, semesters: Semester[]) => {
    return useMemo(() => {
        if (!courses || semesters.length === 0) return {
            progress: { totalCredits: 0, completedCredits: 0, percentage: 0 },
            bySemester: [],
            stats: { completedCount: 0, inProgressCount: 0, totalRemainingCredits: 0 },
            byYear: [] // added
        };

        const prog = calculateDegreeProgress(courses);
        const grouped = groupCoursesBySemester(courses, semesters);

        const stats = {
            completedCount: courses.filter(c => c.effectiveStatus === 'completed').length,
            inProgressCount: courses.filter(c => c.effectiveStatus === 'in_progress').length,
            totalRemainingCredits: Math.max(0, prog.totalCredits - prog.completedCredits)
        };

        // Calculate metrics by year
        const yearMap = new Map<number, CourseWithTopics[]>();

        courses.forEach(course => {
            const sem = semesters.find(s => s.id === course.semesterId);
            const year = sem?.year ?? 1;
            if (!yearMap.has(year)) {
                yearMap.set(year, []);
            }
            yearMap.get(year)!.push(course);
        });

        // Also ensure years that have semesters but no courses are included
        semesters.forEach(sem => {
            const year = sem.year ?? 1;
            if (!yearMap.has(year)) {
                yearMap.set(year, []);
            }
        });

        const byYear = Array.from(yearMap.keys()).sort((a, b) => a - b).map(year => {
            const yearCourses = yearMap.get(year)!;
            const yearProg = calculateDegreeProgress(yearCourses);
            const yearStats = {
                completedCount: yearCourses.filter(c => c.effectiveStatus === 'completed').length,
                inProgressCount: yearCourses.filter(c => c.effectiveStatus === 'in_progress').length,
                totalRemainingCredits: Math.max(0, yearProg.totalCredits - yearProg.completedCredits)
            };
            return {
                year,
                progress: yearProg,
                stats: yearStats
            };
        });

        return { progress: prog, bySemester: grouped, stats, byYear };
    }, [courses, semesters]);
};
