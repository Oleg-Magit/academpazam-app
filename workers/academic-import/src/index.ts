import { corsHeaders, withCors } from './cors';
import { fileToDocumentText, pastedTextToDocument } from './documentToText';
import { ApiError, errorResponse } from './errors';
import { buildAcademicImportMessages } from './prompt';
import {
    academicImportJsonSchema,
    parseAcademicImportExtraction,
    type AcademicImportMode,
} from './schema';

const MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
const ACADEMIC_IMPORT_ROUTE = '/api/v1/extract/academic-import';

interface Env {
    AI: Ai;
    AI_RATE_LIMITER: RateLimit;
    APP_ENV?: string;
    ALLOWED_ORIGIN?: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const modelPayload = (value: unknown): unknown => {
    if (!isRecord(value) || !('response' in value)) return value;
    const response = value.response;
    if (typeof response !== 'string') return response;
    try {
        return JSON.parse(response) as unknown;
    } catch {
        return response;
    }
};

const asMode = (value: FormDataEntryValue | null): AcademicImportMode => {
    if (value === 'degree_plan' || value === 'academic_results') return value;
    throw new ApiError('INVALID_REQUEST', 'A valid import mode is required.', 400);
};

const mapProviderError = (error: unknown): ApiError => {
    const message = error instanceof Error ? error.message : String(error);
    const normalized = message.toLowerCase();
    if (normalized.includes('json mode') || normalized.includes('json schema')) {
        return new ApiError('INVALID_MODEL_OUTPUT', 'The AI response did not match the required academic format.', 502);
    }
    if (normalized.includes('quota') || normalized.includes('rate limit') || normalized.includes('limit exceeded')) {
        return new ApiError('AI_QUOTA_EXCEEDED', 'The free AI processing limit is currently unavailable. Try again later or use manual import.', 429);
    }
    return new ApiError('AI_UNAVAILABLE', 'AI processing is temporarily unavailable. Manual import is still available.', 503);
};

const rateLimitKey = (request: Request) => {
    const clientIp = request.headers.get('cf-connecting-ip')?.trim() || 'unknown';
    return `${clientIp}:${ACADEMIC_IMPORT_ROUTE}`;
};

const enforceAiRateLimit = async (request: Request, env: Env): Promise<void> => {
    const { success } = await env.AI_RATE_LIMITER.limit({ key: rateLimitKey(request) });
    if (!success) {
        throw new ApiError('RATE_LIMITED', 'Too many AI requests. Try again in about a minute.', 429);
    }
};

const handleExtraction = async (request: Request, env: Env, requestId: string): Promise<Response> => {
    const contentType = request.headers.get('content-type') ?? '';
    if (!contentType.includes('multipart/form-data')) {
        throw new ApiError('INVALID_REQUEST', 'Expected multipart form data.', 400);
    }

    const form = await request.formData();
    const mode = asMode(form.get('mode'));
    const fileValue = form.get('file');
    const textValue = form.get('text');
    const file = fileValue instanceof File && fileValue.size > 0 ? fileValue : null;
    const text = typeof textValue === 'string' && textValue.trim() ? textValue : null;

    if ((file && text) || (!file && !text)) {
        throw new ApiError('INVALID_REQUEST', 'Provide exactly one source: a file or pasted text.', 400);
    }

    const document = file
        ? await fileToDocumentText(env.AI, file)
        : pastedTextToDocument(text as string);

    let raw: unknown;
    try {
        raw = await env.AI.run(MODEL, {
            messages: buildAcademicImportMessages(mode, document.text),
            response_format: {
                type: 'json_schema',
                json_schema: academicImportJsonSchema,
            },
            max_tokens: 8192,
            temperature: 0.1,
        });
    } catch (error) {
        throw mapProviderError(error);
    }

    const extraction = parseAcademicImportExtraction(modelPayload(raw));
    if (!extraction || extraction.importMode !== mode) {
        throw new ApiError('INVALID_MODEL_OUTPUT', 'The AI response did not match the required academic format.', 502);
    }

    return Response.json({
        ok: true,
        requestId,
        data: extraction,
        meta: {
            model: MODEL,
            sourceConversion: document.sourceConversion,
            truncated: document.truncated,
        },
    });
};

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        const requestId = crypto.randomUUID();
        const url = new URL(request.url);

        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: corsHeaders(request, env) });
        }

        try {
            let response: Response;
            if (request.method === 'GET' && url.pathname === '/api/v1/health') {
                response = Response.json({ ok: true, service: 'academpazam-academic-import' });
            } else if (request.method === 'POST' && url.pathname === ACADEMIC_IMPORT_ROUTE) {
                await enforceAiRateLimit(request, env);
                response = await handleExtraction(request, env, requestId);
            } else {
                response = Response.json({ ok: false, requestId, error: { code: 'INVALID_REQUEST', message: 'Route not found.' } }, { status: 404 });
            }
            return withCors(response, request, env);
        } catch (error) {
            const apiError = error instanceof ApiError ? error : mapProviderError(error);
            return withCors(errorResponse(requestId, apiError), request, env);
        }
    },
} satisfies ExportedHandler<Env>;
