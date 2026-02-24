import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';
import type { Plan, Course, Topic, Meta } from '../models/types';

interface AcademPazamDB extends DBSchema {
    plans: {
        key: string;
        value: Plan;
    };
    courses: {
        key: string;
        value: Course;
        indexes: { 'by-plan': string };
    };
    topics: {
        key: string;
        value: Topic;
        indexes: { 'by-course': string };
    };
    meta: {
        key: string;
        value: Meta;
    };
}

const DB_NAME = 'academ-pazam-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<AcademPazamDB>>;

export const initDB = () => {
    if (!dbPromise) {
        dbPromise = openDB<AcademPazamDB>(DB_NAME, DB_VERSION, {
            upgrade(db) {
                if (!db.objectStoreNames.contains('plans')) {
                    db.createObjectStore('plans', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('courses')) {
                    const store = db.createObjectStore('courses', { keyPath: 'id' });
                    store.createIndex('by-plan', 'degreePlanId');
                }
                if (!db.objectStoreNames.contains('topics')) {
                    const store = db.createObjectStore('topics', { keyPath: 'id' });
                    store.createIndex('by-course', 'courseId');
                }
                if (!db.objectStoreNames.contains('meta')) {
                    db.createObjectStore('meta', { keyPath: 'key' });
                }
            },
        });
    }
    return dbPromise;
};

/**
 * Retrieves all degree plans.
 */
export const getPlans = async () => (await initDB()).getAll('plans');

/**
 * Retrieves a single degree plan by ID.
 */
export const getPlan = async (id: string) => (await initDB()).get('plans', id);

/**
 * Saves or updates a degree plan.
 */
export const savePlan = async (plan: Plan) => (await initDB()).put('plans', plan);
/**
 * Deletes a degree plan and all its associated courses and topics.
 * Handled in a single transaction for atomicity.
 */
export const deletePlan = async (id: string) => {
    const db = await initDB();
    const courses = await getCoursesByPlan(id);
    const tx = db.transaction(['plans', 'courses', 'topics'], 'readwrite');

    for (const course of courses) {
        const topics = await getTopicsByCourse(course.id);
        for (const topic of topics) {
            tx.objectStore('topics').delete(topic.id);
        }
        tx.objectStore('courses').delete(course.id);
    }
    tx.objectStore('plans').delete(id);
    await tx.done;
};

/**
 * Retrieves all courses for a specific degree plan.
 */
export const getCoursesByPlan = async (planId: string) => (await initDB()).getAllFromIndex('courses', 'by-plan', planId);

/**
 * Saves or updates a course.
 */
export const saveCourse = async (course: Course) => (await initDB()).put('courses', course);

/**
 * Deletes a course and its associated topics.
 */
export const deleteCourse = async (id: string) => {
    const db = await initDB();
    const topics = await getTopicsByCourse(id);
    const tx = db.transaction(['courses', 'topics'], 'readwrite');
    await Promise.all([
        ...topics.map(t => tx.objectStore('topics').delete(t.id)),
        tx.objectStore('courses').delete(id),
    ]);
    await tx.done;
};

/**
 * Retrieves all topics for a specific course.
 */
export const getTopicsByCourse = async (courseId: string) => (await initDB()).getAllFromIndex('topics', 'by-course', courseId);

/**
 * Saves or updates a topic.
 */
export const saveTopic = async (topic: Topic) => (await initDB()).put('topics', topic);

/**
 * Deletes a topic by ID.
 */
export const deleteTopic = async (id: string) => (await initDB()).delete('topics', id);

/**
 * Retrieves a metadata value by key.
 */
export const getMeta = async (key: string) => (await initDB()).get('meta', key);

/**
 * Saves a metadata value.
 */
export const saveMeta = async (key: string, value: any) => (await initDB()).put('meta', { key, value });

export const getSemesterConfig = async () => {
    const countItem = await getMeta('semesterCount');
    const labelsItem = await getMeta('semesterLabels');
    return {
        count: countItem?.value ?? 8,
        labels: labelsItem?.value ?? []
    };
};

export const saveSemesterConfig = async (count: number, labels: string[]) => {
    await saveMeta('semesterCount', count);
    await saveMeta('semesterLabels', labels);
};

// Export / Import Helpers
export const getAllData = async () => {
    const db = await initDB();
    const [plans, courses, topics, meta] = await Promise.all([
        db.getAll('plans'),
        db.getAll('courses'),
        db.getAll('topics'),
        db.getAll('meta'),
    ]);
    return { plans, courses, topics, meta };
};

export const clearAllData = async () => {
    const db = await initDB();
    const tx = db.transaction(['plans', 'courses', 'topics', 'meta'], 'readwrite');
    await Promise.all([
        tx.objectStore('plans').clear(),
        tx.objectStore('courses').clear(),
        tx.objectStore('topics').clear(),
        tx.objectStore('meta').clear(),
    ]);
    await tx.done;
};
