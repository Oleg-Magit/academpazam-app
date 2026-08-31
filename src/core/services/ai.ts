export interface ExtractedCourseTopic {
    title: string;
    description: string | null;
}

interface CourseBlueprintFailure {
    ok?: false;
    error?: {
        code?: string;
        message?: string;
    };
}

export async function extractCourseTopics(file: File | null, textSyllabus: string, courseName: string): Promise<ExtractedCourseTopic[]> {
    const formData = new FormData();
    if (file) {
        formData.append('file', file);
    }
    if (textSyllabus) {
        formData.append('textSyllabus', textSyllabus);
    }
    formData.append('courseName', courseName);

    const workerUrl = (import.meta.env.VITE_AI_BLUEPRINT_API_BASE_URL as string | undefined)?.trim().replace(/\/$/, '');
    if (!workerUrl) throw new Error('AI course blueprint service is not configured.');
    const response = await fetch(`${workerUrl}/api/v1/extract/course-topics`, { method: 'POST', body: formData });
    const data: unknown = await response.json();
    if (!response.ok) {
        const failure = data as CourseBlueprintFailure;
        throw new Error(failure?.error?.message || 'Course blueprint extraction failed.');
    }
    if (!data || typeof data !== 'object' || !Array.isArray((data as { topics?: unknown }).topics)) {
        throw new Error('Course blueprint returned an invalid response.');
    }
    return (data as { topics: unknown[] }).topics.filter((topic): topic is ExtractedCourseTopic =>
        Boolean(topic) && typeof topic === 'object'
        && typeof (topic as { title?: unknown }).title === 'string'
        && ((topic as { description?: unknown }).description === null || typeof (topic as { description?: unknown }).description === 'string')
    );
}
