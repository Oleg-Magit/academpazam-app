import type { Topic } from '@/core/models/types';

export async function extractCourseTopics(file: File | null, textSyllabus: string, courseName: string): Promise<Partial<Topic>[]> {
    const formData = new FormData();
    if (file) {
        formData.append('file', file);
    }
    if (textSyllabus) {
        formData.append('textSyllabus', textSyllabus);
    }
    formData.append('courseName', courseName);

    // Note: Use environment variable or default to local worker URL
    const WORKER_URL = import.meta.env.VITE_WORKER_URL || 'http://localhost:8787';

    try {
        const response = await fetch(`${WORKER_URL}/api/v1/extract/course-topics`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Failed to extract topics');
        }

        const data = await response.json();
        return data.topics || [];
    } catch (err) {
        console.warn("Worker extraction failed or not available, using mock data for demo", err);
        // Mock response for demo purposes in case worker is not up
        await new Promise(r => setTimeout(r, 1500));
        
        // Return dummy topics based on course name
        return [
            { title: `Introduction to ${courseName}`, description: 'Basic concepts and overview' },
            { title: 'Core Principles', description: 'Fundamental theories' },
            { title: 'Advanced Topics', description: 'In-depth analysis and applications' },
            { title: 'Final Project / Summary', description: 'Practical implementation' }
        ];
    }
}
