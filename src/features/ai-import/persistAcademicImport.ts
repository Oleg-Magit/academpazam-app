import { initDB } from '@/core/db/db';
import type { Course, Semester } from '@/core/models/types';
import { v4 as uuidv4 } from 'uuid';
import type { AcademicImportReviewRow } from './types';

export interface PersistAcademicImportInput {
    planId: string;
    rows: AcademicImportReviewRow[];
    existingCourses: Course[];
}

export const persistAcademicImport = async ({ planId, rows, existingCourses }: PersistAcademicImportInput): Promise<void> => {
    const actionable = rows.filter(row => row.action !== 'skip');
    const blocked = actionable.find(row => row.blockingReasons.length > 0);
    if (blocked) {
        throw new Error(`Cannot persist unresolved academic import row: ${blocked.sourceRowId}`);
    }

    const pendingSemesterMap = new Map<string, Semester>();
    for (const row of actionable) {
        if (row.semesterResolution.kind === 'new' && row.semesterResolution.proposedSemester) {
            const proposed = row.semesterResolution.proposedSemester;
            if (!pendingSemesterMap.has(proposed.id)) {
                pendingSemesterMap.set(proposed.id, { ...proposed, id: uuidv4(), createdAt: Date.now() });
            }
        }
    }

    const existingById = new Map(existingCourses.map(course => [course.id, course]));
    const now = Date.now();
    const coursesToPersist: Course[] = actionable.map(row => {
        if (row.proposed.credits === null || !row.semesterResolution.semesterId) {
            throw new Error(`Academic import row is incomplete: ${row.sourceRowId}`);
        }

        const semesterId = row.semesterResolution.kind === 'new'
            ? pendingSemesterMap.get(row.semesterResolution.semesterId)?.id
            : row.semesterResolution.semesterId;
        if (!semesterId) throw new Error(`Academic import semester resolution failed: ${row.sourceRowId}`);

        const existing = row.targetCourseId ? existingById.get(row.targetCourseId) : undefined;
        if (row.action === 'update' && !existing) {
            throw new Error(`Academic import update target was not found: ${row.sourceRowId}`);
        }

        return {
            ...(existing ?? {
                id: uuidv4(),
                degreePlanId: planId,
                createdAt: now,
            }),
            degreePlanId: planId,
            ...(row.proposed.code ? { code: row.proposed.code } : {}),
            name: row.proposed.name.trim(),
            credits: row.proposed.credits,
            semesterId,
            grade: row.proposed.grade,
            ...(row.proposed.manualStatus ? { manualStatus: row.proposed.manualStatus } : {}),
            ...(row.proposed.attemptStatus ? { attemptStatus: row.proposed.attemptStatus } : {}),
            ...(row.proposed.attemptNumber !== undefined ? { attemptNumber: row.proposed.attemptNumber } : {}),
            ...(row.proposed.excludeFromAverage !== undefined ? { excludeFromAverage: row.proposed.excludeFromAverage } : {}),
            updatedAt: now,
        } satisfies Course;
    });

    const db = await initDB();
    const tx = db.transaction(['semesters', 'courses'], 'readwrite');
    const semesterStore = tx.objectStore('semesters');
    const courseStore = tx.objectStore('courses');

    for (const semester of pendingSemesterMap.values()) {
        await semesterStore.add(semester);
    }
    for (const course of coursesToPersist) {
        await courseStore.put(course);
    }

    await tx.done;
};
