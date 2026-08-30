export interface CorsEnv {
    ALLOWED_ORIGIN?: string;
}

export const corsHeaders = (request: Request, env: CorsEnv): HeadersInit => {
    const origin = request.headers.get('Origin');
    const allowedOrigins = new Set([
        'http://localhost:5173',
        'https://oleg-magit.github.io',
        ...(env.ALLOWED_ORIGIN ? env.ALLOWED_ORIGIN.split(',').map(value => value.trim()).filter(Boolean) : []),
    ]);

    const headers: Record<string, string> = {
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
        'Vary': 'Origin',
    };

    if (origin && allowedOrigins.has(origin)) {
        headers['Access-Control-Allow-Origin'] = origin;
    }

    return headers;
};

export const withCors = (response: Response, request: Request, env: CorsEnv): Response => {
    const headers = new Headers(response.headers);
    Object.entries(corsHeaders(request, env)).forEach(([key, value]) => headers.set(key, String(value)));
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
};
