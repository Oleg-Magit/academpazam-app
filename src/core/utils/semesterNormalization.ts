import { v4 as uuidv4 } from 'uuid';
import type { Semester, Course } from '../models/types';

/**
 * Safely hydrates Year and Term metadata for a list of semesters.
 * Preserves existing values if they are already present.
 */
export const enrichSemesters = (semesters: any[]): Semester[] => {
    // Determine if any lack orderIndex
    const needsSorting = semesters.some(s => s.orderIndex === undefined);

    let sorted = semesters;
    if (needsSorting) {
        sorted = [...semesters].sort((a, b) => {
            const indexA = a.orderIndex !== undefined ? a.orderIndex : 9999;
            const indexB = b.orderIndex !== undefined ? b.orderIndex : 9999;
            return indexA - indexB || (a.createdAt || 0) - (b.createdAt || 0);
        });
        sorted.forEach((s, idx) => {
            if (s.orderIndex === undefined) s.orderIndex = idx;
        });
    }

    return sorted.map(s => {
        if (s.year === undefined || s.term === undefined) {
            return {
                ...s,
                year: s.year ?? (Math.floor(s.orderIndex / 2) + 1),
                term: s.term ?? (s.orderIndex % 2 === 0 ? 'A' : 'B')
            };
        }
        return s;
    });
};

/**
 * Normalizes an imported data payload to ensure all semesters exist and have Year/Term metadata.
 * Handles:
 * 1. Ancestral JSON: Missing semesters array (reconstructs from course.semester strings).
 * 2. Legacy JSON: semesters exist but lack year/term.
 * 3. Modern JSON: Valid data left preserved.
 */
export const normalizeImportedPayload = (data: {
    courses: any[];
    semesters?: any[];
}): { courses: Course[]; semesters: Semester[] } => {
    const { courses } = data;
    let semesters = data.semesters || [];

    // 1. ANCESTRAL CASE: No semesters array at all
    if (!data.semesters || semesters.length === 0) {
        const semesterMap: Record<string, string> = {}; // legacyName -> newId
        const reconstructedSemesters: Semester[] = [];

        // Extract unique semester names from courses
        const legacyNames = Array.from(new Set(courses.map(c => c.semester).filter(Boolean))) as string[];

        // Sort legacy names naturally if possible (if they were numbers)
        legacyNames.sort((a, b) => {
            const numA = parseInt(a, 10);
            const numB = parseInt(b, 10);
            if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
            return a.localeCompare(b);
        });

        legacyNames.forEach((name, index) => {
            const id = uuidv4();
            reconstructedSemesters.push({
                id,
                name,
                orderIndex: index,
                createdAt: Date.now(),
                year: Math.floor(index / 2) + 1,
                term: index % 2 === 0 ? 'A' : 'B'
            });
            semesterMap[name] = id;
        });

        // Update courses to use new IDs
        const updatedCourses = courses.map(course => {
            const updated = { ...course };
            if (course.semester && semesterMap[course.semester]) {
                updated.semesterId = semesterMap[course.semester];
                delete updated.semester;
            }
            return updated as Course;
        });

        return { courses: updatedCourses, semesters: reconstructedSemesters };
    }

    // 2. LEGACY CASE: Semesters exist but need enrichment
    const enrichedSemesters = enrichSemesters(semesters);

    // Ensure courses are using semesterId (handle mix of legacy/modern if needed, though unlikely)
    const updatedCourses = courses.map(course => {
        if (course.semester && !course.semesterId) {
            // Unlikely in typical exports but for robustness:
            // Find semester by name if possible
            const matchingSem = enrichedSemesters.find(s => s.name === course.semester);
            if (matchingSem) {
                const updated = { ...course, semesterId: matchingSem.id };
                delete updated.semester;
                return updated as Course;
            }
        }
        return course as Course;
    });

    return { courses: updatedCourses, semesters: enrichedSemesters };
};
