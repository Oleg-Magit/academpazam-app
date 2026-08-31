const MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_TEXT_LENGTH = 100_000;
interface Env { AI: Ai; ALLOWED_ORIGIN?: string }
const cors = (request: Request, env: Env): HeadersInit => {
  const origin = request.headers.get('Origin');
  const allowed = new Set(['http://localhost:5173', 'https://oleg-magit.github.io', ...(env.ALLOWED_ORIGIN ?? '').split(',').map(v => v.trim()).filter(Boolean)]);
  return { 'Access-Control-Allow-Origin': origin && allowed.has(origin) ? origin : 'null', 'Access-Control-Allow-Methods': 'POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Vary': 'Origin' };
};
const response = (request: Request, env: Env, body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...cors(request, env) } });
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const modelPayload = (value: unknown): unknown => {
  if (!isRecord(value) || !('response' in value)) return value;
  const modelResponse = value.response;
  if (typeof modelResponse !== 'string') return modelResponse;
  try { return JSON.parse(modelResponse) as unknown; } catch { return modelResponse; }
};
const validTopics = (value: unknown): value is { topics: Array<{ title: string; description: string | null }> } => {
  if (!value || typeof value !== 'object' || !Array.isArray((value as { topics?: unknown }).topics)) return false;
  return (value as { topics: unknown[] }).topics.every(topic => Boolean(topic) && typeof topic === 'object' && typeof (topic as { title?: unknown }).title === 'string' && ((topic as { description?: unknown }).description === null || typeof (topic as { description?: unknown }).description === 'string'));
};
export default { async fetch(request: Request, env: Env): Promise<Response> {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(request, env) });
  const id = crypto.randomUUID();
  if (request.method === 'GET' && new URL(request.url).pathname === '/api/v1/health') return response(request, env, { ok: true, service: 'academpazam-course-blueprint' });
  if (request.method !== 'POST' || new URL(request.url).pathname !== '/api/v1/extract/course-topics') return response(request, env, { ok: false, requestId: id, error: { code: 'INVALID_REQUEST', message: 'Route not found.' } }, 404);
  try {
    const form = await request.formData();
    const fileValue = form.get('file'); const textValue = form.get('textSyllabus');
    const file = fileValue instanceof File && fileValue.size > 0 ? fileValue : null;
    const text = typeof textValue === 'string' && textValue.trim() ? textValue.trim() : null;
    if ((file && text) || (!file && !text)) return response(request, env, { ok: false, requestId: id, error: { code: 'INVALID_REQUEST', message: 'Provide exactly one source.' } }, 400);
    let source = text ?? '';
    if (file) {
      if (file.size > MAX_FILE_SIZE || !new Set(['application/pdf', 'image/png', 'image/jpeg', 'text/plain']).has(file.type)) return response(request, env, { ok: false, requestId: id, error: { code: 'UNSUPPORTED_FILE', message: 'This file type or size is not supported.' } }, 415);
      if (file.type === 'text/plain') source = await file.text();
      else {
        const conversion = await env.AI.toMarkdown({ name: file.name || 'syllabus', blob: new Blob([await file.arrayBuffer()], { type: file.type }) });
        if (conversion.format === 'error') throw new Error('document conversion failed');
        source = conversion.data;
      }
    }
    source = source.trim().slice(0, MAX_TEXT_LENGTH);
    if (!source) return response(request, env, { ok: false, requestId: id, error: { code: 'INVALID_REQUEST', message: 'The syllabus is empty.' } }, 400);
    const raw = await env.AI.run(MODEL, { messages: [{ role: 'system', content: 'Extract only reliable academic course topics explicitly present in the syllabus. Preserve the language used by the syllabus for topic titles and descriptions. Do not invent, infer, or enrich topics that are absent from the source. If no reliable academic topics exist, return an empty topics list. Exclude instructor contact details, office hours, grading percentages, room numbers, attendance policy, submission instructions, dates, and generic administrative headings. Return JSON with topics, each having title and nullable description.' }, { role: 'user', content: source }], response_format: { type: 'json_schema', json_schema: { type: 'object', additionalProperties: false, properties: { topics: { type: 'array', items: { type: 'object', additionalProperties: false, properties: { title: { type: 'string' }, description: { type: ['string', 'null'] } }, required: ['title', 'description'] } } }, required: ['topics'] } }, temperature: 0.1, max_tokens: 4096 });
    const payload = modelPayload(raw);
    if (!validTopics(payload)) return response(request, env, { ok: false, requestId: id, error: { code: 'INVALID_MODEL_OUTPUT', message: 'The AI response did not match the required course topic format.' } }, 502);
    return response(request, env, { ok: true, requestId: id, topics: payload.topics, meta: { model: MODEL } });
  } catch { return response(request, env, { ok: false, requestId: id, error: { code: 'AI_UNAVAILABLE', message: 'AI processing is temporarily unavailable.' } }, 503); }
} } satisfies ExportedHandler<Env>;
