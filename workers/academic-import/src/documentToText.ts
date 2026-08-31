import { ApiError } from './errors';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_TEXT_LENGTH = 100_000;
const SUPPORTED_TYPES = new Set(['application/pdf', 'image/png', 'image/jpeg', 'text/plain']);

export interface DocumentTextResult {
    text: string;
    sourceConversion: 'markdown' | 'plain_text';
    truncated: boolean;
}

export const validateUpload = (file: File) => {
    if (!SUPPORTED_TYPES.has(file.type)) {
        throw new ApiError('UNSUPPORTED_FILE', 'This file type is not supported.', 415);
    }
    if (file.size > MAX_FILE_SIZE) {
        throw new ApiError('FILE_TOO_LARGE', 'The selected file is larger than 10 MB.', 413);
    }
};

const trimToLimit = (text: string): { text: string; truncated: boolean } => {
    const normalized = text.trim();
    if (normalized.length <= MAX_TEXT_LENGTH) return { text: normalized, truncated: false };
    return { text: normalized.slice(0, MAX_TEXT_LENGTH), truncated: true };
};

export const pastedTextToDocument = (text: string): DocumentTextResult => {
    const result = trimToLimit(text);
    if (!result.text) throw new ApiError('INVALID_REQUEST', 'Text input is empty.', 400);
    return { ...result, sourceConversion: 'plain_text' };
};

export const fileToDocumentText = async (ai: Ai, file: File): Promise<DocumentTextResult> => {
    validateUpload(file);

    if (file.type === 'text/plain') {
        return pastedTextToDocument(await file.text());
    }

    const conversion = await ai.toMarkdown({
        name: file.name || 'academic-document',
        blob: new Blob([await file.arrayBuffer()], { type: file.type }),
    });

    if (Array.isArray(conversion)) {
        throw new ApiError('EXTRACTION_FAILED', 'Document conversion returned an unexpected result.', 502);
    }
    if (conversion.format === 'error' || !conversion.data?.trim()) {
        throw new ApiError('EXTRACTION_FAILED', 'The document could not be converted into readable text.', 422);
    }

    const result = trimToLimit(conversion.data);
    if (!result.text) throw new ApiError('EXTRACTION_FAILED', 'No readable academic content was found.', 422);
    return { ...result, sourceConversion: 'markdown' };
};
