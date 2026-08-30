import type { AcademicImportMode } from './schema';

export const buildAcademicImportMessages = (mode: AcademicImportMode, sourceText: string) => [
    {
        role: 'system' as const,
        content: `You extract academic course records from university documents for AcademPazam.
Return only data supported by the source. Never invent codes, credits, grades, semesters, or course outcomes.
Preserve course names in the source language. Use null when a field is absent or unreliable.
Confidence is only an extraction-confidence hint from 0 to 1.
Warnings must explain uncertainty briefly without adding unsupported facts.
The selected import mode is ${mode}.
For degree_plan: extract required/planned course structure, but do not reinterpret courses as completed results.
For academic_results: extract explicit academic results/attempt outcomes. A numeric grade is factual source data only; do not decide the application's passing threshold.
Give each extracted source row a stable sourceRowId such as row-1, row-2, in source order.`,
    },
    {
        role: 'user' as const,
        content: `Extract the academic course records from the following converted document.\n\n${sourceText}`,
    },
];

export const buildCourseTopicsMessages = (documentText: string, courseName: string) => [
    {
        role: 'system' as const,
        content: `You are an AI assistant that extracts course topics from a syllabus document. 
Your goal is to extract the list of topics, schedule, or curriculum taught in the document.
Look for tables, weekly schedules, or lists of lessons.
Provide a brief description for each topic if available. Keep descriptions concise. If a topic has no description, set it to null.
Return the topics in chronological order based on the syllabus.`,
    },
    {
        role: 'user' as const,
        content: `Extract the course topics from the following syllabus document.\n\n${documentText}`,
    },
];
