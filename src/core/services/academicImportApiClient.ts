import type {
    AcademicImportApiResponse,
    AcademicImportApiSuccess,
    AcademicImportErrorCode,
    AcademicImportMode,
} from '@/features/ai-import/types';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 60_000;

export class AcademicImportApiError extends Error {
    constructor(
        public readonly code: AcademicImportErrorCode | 'NOT_CONFIGURED' | 'NETWORK_ERROR',
        message: string,
    ) {
        super(message);
        this.name = 'AcademicImportApiError';
    }
}

export interface AnalyzeAcademicImportInput {
    mode: AcademicImportMode;
    file?: File | null;
    text?: string;
    signal?: AbortSignal;
}

export const getAcademicImportApiBaseUrl = () =>
    (import.meta.env.VITE_AI_IMPORT_API_BASE_URL as string | undefined)?.trim().replace(/\/$/, '') ?? '';

export const isAcademicImportConfigured = () => Boolean(getAcademicImportApiBaseUrl());

export const analyzeAcademicImport = async ({ mode, file, text, signal }: AnalyzeAcademicImportInput): Promise<AcademicImportApiSuccess> => {
    const baseUrl = getAcademicImportApiBaseUrl();
    if (!baseUrl) {
        throw new AcademicImportApiError('NOT_CONFIGURED', 'AI import service is not configured.');
    }

    const cleanText = text?.trim() ?? '';
    if ((file && cleanText) || (!file && !cleanText)) {
        throw new AcademicImportApiError('INVALID_REQUEST', 'Choose exactly one source: a file or pasted text.');
    }
    if (file && file.size > MAX_FILE_SIZE) {
        throw new AcademicImportApiError('FILE_TOO_LARGE', 'The selected file is larger than 10 MB.');
    }

    const form = new FormData();
    form.set('mode', mode);
    if (file) form.set('file', file);
    else form.set('text', cleanText);

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const abortFromCaller = () => controller.abort();
    signal?.addEventListener('abort', abortFromCaller, { once: true });

    try {
        const response = await fetch(`${baseUrl}/api/v1/extract/academic-import`, {
            method: 'POST',
            body: form,
            signal: controller.signal,
        });
        const payload = await response.json() as AcademicImportApiResponse;
        if (!payload.ok) {
            throw new AcademicImportApiError(payload.error.code, payload.error.message);
        }
        return payload;
    } catch (error) {
        if (error instanceof AcademicImportApiError) throw error;
        if (controller.signal.aborted) {
            throw new AcademicImportApiError('NETWORK_ERROR', 'AI import request was cancelled or timed out.');
        }
        throw new AcademicImportApiError('NETWORK_ERROR', 'Could not reach the AI import service.');
    } finally {
        window.clearTimeout(timeout);
        signal?.removeEventListener('abort', abortFromCaller);
    }
};
