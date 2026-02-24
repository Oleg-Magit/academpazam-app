import { getAllData, savePlan, saveCourse, saveTopic, saveMeta, clearAllData } from '../db/db';
import type { Plan, Course, Topic, Meta } from '../models/types';

interface BackupData {
    version: number;
    timestamp: number;
    data: {
        plans: Plan[];
        courses: Course[];
        topics: Topic[];
        meta: Meta[];
    };
}

const CURRENT_SCHEMA_VERSION = 1;

/**
 * Exports all database records (plans, courses, topics, meta) to a JSON Blob.
 */
export const exportDataToJSON = async (): Promise<Blob> => {
    const data = await getAllData();
    const backup: BackupData = {
        version: CURRENT_SCHEMA_VERSION,
        timestamp: Date.now(),
        data,
    };
    const json = JSON.stringify(backup, null, 2);
    return new Blob([json], { type: 'application/json' });
};

/**
 * Imports application data from a JSON string.
 * Supports 'replace' (clear first) or 'merge' (append) modes.
 */
export const importDataFromJSON = async (
    jsonString: string,
    mode: 'replace' | 'merge'
): Promise<{ success: boolean; message: string }> => {
    try {
        const backup: BackupData = JSON.parse(jsonString);

        if (!backup.data || !Array.isArray(backup.data.plans)) {
            throw new Error('Invalid backup format');
        }

        // Schema migration point: version check for future updates
        // For current version, we assume CURRENT_SCHEMA_VERSION = 1.

        if (mode === 'replace') {
            await clearAllData();
        }

        const { plans, courses, topics, meta } = backup.data;

        // Sequence preservation: order of operations matters for foreign keys
        for (const plan of plans) await savePlan(plan);
        for (const course of courses) await saveCourse(course);
        for (const topic of topics) await saveTopic(topic);
        for (const m of meta) await saveMeta(m.key, m.value);

        return { success: true, message: `Successfully imported ${courses.length} courses.` };
    } catch (err) {
        console.error('Import failed:', err);
        return { success: false, message: (err as Error).message };
    }
};
