export type AcademicImportErrorCode =
    | 'INVALID_REQUEST'
    | 'UNSUPPORTED_FILE'
    | 'FILE_TOO_LARGE'
    | 'EXTRACTION_FAILED'
    | 'INVALID_MODEL_OUTPUT'
    | 'RATE_LIMITED'
    | 'AI_QUOTA_EXCEEDED'
    | 'AI_UNAVAILABLE';

export class ApiError extends Error {
    constructor(
        public readonly code: AcademicImportErrorCode,
        message: string,
        public readonly status: number,
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

export const errorResponse = (requestId: string, error: ApiError): Response => Response.json({
    ok: false,
    requestId,
    error: {
        code: error.code,
        message: error.message,
    },
}, { status: error.status });
