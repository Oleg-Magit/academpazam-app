import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';
import type { Plan, Course, Topic, Meta, Semester } from '../models/types';
import { v4 as uuidv4 } from 'uuid';

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
    semesters: {
        key: string;
        value: Semester;
        indexes: { 'by-order': number };
    };
}

export const STORES = {
    PLANS: 'plans',
    COURSES: 'courses',
    TOPICS: 'topics',
    META: 'meta',
    SEMESTERS: 'semesters'
} as const;

const DB_NAME = 'academ-pazam-db';
const DB_VERSION = 2; // Bumped to ensure missing stores (semesters) are created for existing users

let dbPromise: Promise<IDBPDatabase<AcademPazamDB>>;

export const closeDB = async () => {
    if (dbPromise) {
        const db = await dbPromise;
        db.close();
        dbPromise = null as any;
    }
};

export const initDB = () => {
    if (!dbPromise) {
        dbPromise = openDB<AcademPazamDB>(DB_NAME, DB_VERSION, {
            upgrade(db, oldVersion) {
                console.log(`[DB] Upgrading from version ${oldVersion} to ${DB_VERSION}...`);

                if (!db.objectStoreNames.contains(STORES.PLANS)) {
                    db.createObjectStore(STORES.PLANS, { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains(STORES.COURSES)) {
                    const store = db.createObjectStore(STORES.COURSES, { keyPath: 'id' });
                    store.createIndex('by-plan', 'degreePlanId');
                }
                if (!db.objectStoreNames.contains(STORES.TOPICS)) {
                    const store = db.createObjectStore(STORES.TOPICS, { keyPath: 'id' });
                    store.createIndex('by-course', 'courseId');
                }
                if (!db.objectStoreNames.contains(STORES.META)) {
                    db.createObjectStore(STORES.META, { keyPath: 'key' });
                }
                if (!db.objectStoreNames.contains(STORES.SEMESTERS)) {
                    const store = db.createObjectStore(STORES.SEMESTERS, { keyPath: 'id' });
                    store.createIndex('by-order', 'orderIndex');
                }
            },
            blocked() {
                console.warn('[DB] Connection blocked by older version. Please close other tabs.');
            },
            blocking() {
                console.warn('[DB] Closing connection to allow upgrade in another tab/process.');
                dbPromise.then(db => db.close());
                dbPromise = null as any;
            },
            terminated() {
                console.error('[DB] Connection terminated unexpectedly.');
                dbPromise = null as any;
            }
        });

        // Trigger migration if needed
        migrateToSemesterIds();
    }
    return dbPromise;
};

/**
 * Migrates legacy data (semester strings on courses) to the new Semester entity model.
 * This runs on app load and handles the transition gracefully.
 */
const migrateToSemesterIds = async () => {
    const db = await initDB();

    // Check if migration has already been performed
    const migrationMeta = await db.get('meta', 'semester_id_migration_done');
    if (migrationMeta) return;

    console.log('[Migration] Starting Semester ID normalization...');

    const tx = db.transaction(['courses', 'semesters', 'meta'], 'readwrite');
    const courseStore = tx.objectStore('courses');
    const semesterStore = tx.objectStore('semesters');
    const metaStore = tx.objectStore('meta');

    const courses = await courseStore.getAll();
    const semesterConfig = await db.get('meta', 'semesterLabels');
    const labels = semesterConfig?.value || [];
    const countMeta = await db.get('meta', 'semesterCount');
    const count = countMeta?.value || 8;

    const semesterMap: Record<string, string> = {}; // legacyName -> newId

    // 1. Create Semesters based on legacy config or course data
    for (let i = 1; i <= count; i++) {
        const legacyName = i.toString();
        const customLabel = labels[i - 1];
        const id = uuidv4();
        const name = customLabel || `Semester ${i}`;

        await semesterStore.put({
            id,
            name,
            createdAt: Date.now(),
            orderIndex: i - 1
        });
        semesterMap[legacyName] = id;
    }

    // 2. Handle any courses with non-numeric semester strings if they exist
    for (const course of courses) {
        // @ts-ignore - legacy access
        const legacySem = course.semester;
        if (legacySem && !semesterMap[legacySem]) {
            const id = uuidv4();
            await semesterStore.put({
                id,
                name: legacySem,
                createdAt: Date.now(),
                orderIndex: Object.keys(semesterMap).length
            });
            semesterMap[legacySem] = id;
        }
    }

    // 3. Update courses to reference new IDs
    for (const course of courses) {
        // @ts-ignore - legacy access
        const legacySem = course.semester;
        if (legacySem && semesterMap[legacySem]) {
            const updatedCourse = { ...course } as any;
            updatedCourse.semesterId = semesterMap[legacySem];
            delete updatedCourse.semester;
            await courseStore.put(updatedCourse);
        }
    }

    await metaStore.put({ key: 'semester_id_migration_done', value: true });
    await tx.done;

    console.log('[Migration] Semester ID normalization complete.');
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

/**
 * Semester Operations
 */
export const getSemesters = async () => {
    const db = await initDB();
    const semesters = await db.getAll('semesters');
    return semesters.sort((a, b) => a.orderIndex - b.orderIndex || a.createdAt - b.createdAt);
};

export const saveSemester = async (semester: Semester) => (await initDB()).put('semesters', semester);

export const deleteSemester = async (id: string, cascade: boolean = false) => {
    const db = await initDB();
    const tx = db.transaction(['semesters', 'courses', 'topics'], 'readwrite');

    if (cascade) {
        const courses = await tx.objectStore('courses').getAll();
        const semesterCourses = courses.filter((c: any) => c.semesterId === id);
        for (const course of semesterCourses) {
            const topics = await tx.objectStore('topics').getAll();
            const courseTopics = topics.filter((t: any) => t.courseId === course.id);
            for (const topic of courseTopics) {
                await tx.objectStore('topics').delete(topic.id);
            }
            await tx.objectStore('courses').delete(course.id);
        }
    }

    await tx.objectStore('semesters').delete(id);
    await tx.done;
};

export const getAllData = async () => {
    const db = await initDB();
    const [plans, courses, topics, meta, semesters] = await Promise.all([
        db.getAll('plans'),
        db.getAll('courses'),
        db.getAll('topics'),
        db.getAll('meta'),
        db.getAll('semesters'),
    ]);
    return { plans, courses, topics, meta, semesters };
};

export const clearAllData = async () => {
    const db = await initDB();
    // Only transact on stores that actually exist to avoid NotFoundError
    const existingStores = Object.values(STORES).filter(name => db.objectStoreNames.contains(name));
    if (existingStores.length === 0) return;

    const tx = db.transaction(existingStores as any, 'readwrite');
    await Promise.all(existingStores.map(name => tx.objectStore(name as any).clear()));
    await tx.done;
};
