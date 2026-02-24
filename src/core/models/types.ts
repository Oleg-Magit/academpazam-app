export type CourseStatus = 'not_started' | 'in_progress' | 'completed';
export type TopicStatus = 'not_started' | 'in_progress' | 'done';

export interface Plan {
    id: string; // uuid
    name: string;
    passing_exam_threshold: number;
    createdAt: number;
    updatedAt: number;
}

export interface Course {
    id: string; // uuid
    degreePlanId: string;
    code?: string;
    name: string;
    credits: number;
    semester: string; // "1", "2", ... "Summer"
    notes?: string;
    grade?: number | null;
    manualStatus?: CourseStatus; // Only used if topics.length === 0
    createdAt: number;
    updatedAt: number;
}

export interface Topic {
    id: string; // uuid
    courseId: string;
    title: string;
    description?: string;
    status: TopicStatus;
    createdAt: number;
    updatedAt: number;
}

export interface Meta {
    key: string;
    value: any;
}

// Derived types for UI
export interface CourseWithTopics extends Course {
    topics: Topic[];
    effectiveStatus: CourseStatus;
}

export interface SemesterGroup {
    semester: string;
    label?: string;
    courses: CourseWithTopics[];
    totalCredits: number;
    completedCredits: number;
}
