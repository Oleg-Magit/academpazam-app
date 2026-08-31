# AcademPazam Academic Import Worker

Feature-specific Cloudflare Worker for `feat/ai-academic-import`.

## Runtime requirement

This Worker uses Wrangler 4.127.1 and therefore requires **Node.js 22 or newer**.

Verify before continuing:

```bash
node --version
```

If the major version is below 22, switch/update Node first.

## AI model

Structured extraction uses:

```text
@cf/meta/llama-3.3-70b-instruct-fp8-fast
```

PDFs/images are converted first with `env.AI.toMarkdown()`, so the extraction model itself does not need vision. This model exposes `response_format` in the current Workers AI type definitions and is listed by Cloudflare as supporting JSON Mode.

The Worker still validates every model response at runtime; JSON Mode is not treated as a guarantee that the model followed the schema.

## 1. Install

```bash
cd workers/academic-import
npm install
```

Wrangler generates Worker runtime/binding types. After installation/config changes run:

```bash
npm run cf-types
```

## 2. Authenticate Cloudflare

```bash
npx wrangler login
```

The selected Llama 3.3 model is subject to Meta's applicable license terms. Review the model terms in Cloudflare before production use. The explicit one-time `prompt: "agree"` flow documented for Llama 3.2 Vision is not part of this Worker's current setup.

## 3. Local Worker

```bash
npm run cf-types
npm run typecheck
npm run dev
```

Expected local URL is normally:

```text
http://localhost:8787
```

Health check:

```bash
curl http://localhost:8787/api/v1/health
```

Expected response:

```json
{"ok":true,"service":"academpazam-academic-import"}
```

## 4. Connect local AcademPazam

At repository root create `.env.local`:

```env
VITE_AI_IMPORT_API_BASE_URL=http://localhost:8787
```

Then run the normal frontend:

```bash
npm run dev
```

## 5. Text-only smoke test first

Before testing PDFs, verify text extraction with multipart form data:

```bash
curl -X POST http://localhost:8787/api/v1/extract/academic-import \
  -F 'mode=degree_plan' \
  -F 'text=Semester 1\n101 Introduction to Programming 4 credits\n102 Calculus 1 5 credits'
```

Verify that the response is the documented `ok: true` envelope and contains structured `courses`.

## 6. File smoke test

Then test a synthetic/redacted PDF or image. Do not use a sensitive real transcript during development unless you intentionally accept the remote AI-processing implications.

## 7. Deploy

```bash
npm run deploy
```

Note the resulting `workers.dev` URL. CORS already permits the local Vite origin and the AcademPazam GitHub Pages origin. Production frontend wiring is an integration step; do not edit the existing GitHub Pages deployment workflow from this feature branch yet because the parallel Course Blueprint feature will need its own URL too.

## Verification gate

Worker:

```bash
npm run cf-types
npm run typecheck
```

Frontend feature branch CI runs:

```bash
npm run test:run
npm run build
npx eslint src/features/ai-import src/core/services/academicImportApiClient.ts src/core/events/dataEvents.ts
```

The current repository baseline contains pre-existing lint failures outside this feature. The AI Import CI therefore requires the full test suite and build, while linting the newly added AI Import code separately. Do not treat unrelated baseline lint debt as an AI Import regression.

The branch CI has already demonstrated that the full test suite, application build, feature lint, Wrangler type generation, and Worker TypeScript typecheck can all pass together.

Manual happy path:

1. Open Courses.
2. Click **Import with AI**.
3. Import a degree-plan sample.
4. Review/edit one row.
5. Confirm.
6. Verify Courses and Dashboard refresh.
7. Import academic results.
8. Verify exact course matches are proposed as updates and grade threshold logic is local.
