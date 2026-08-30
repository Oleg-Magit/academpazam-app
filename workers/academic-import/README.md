# AcademPazam Academic Import Worker

Feature-specific Cloudflare Worker for `feat/ai-academic-import`.

## Runtime requirement

This Worker uses Wrangler 4.127.1 and therefore requires **Node.js 22 or newer**.

Verify before continuing:

```bash
node --version
```

If the major version is below 22, switch/update Node first.

## 1. Install

```bash
cd workers/academic-import
npm install
```

The first install creates this package's `package-lock.json`. Commit that lockfile on this feature branch after verifying install/typecheck.

## 2. Authenticate Cloudflare

```bash
npx wrangler login
```

## 3. Accept the Llama model license once

Cloudflare requires accepting Meta's license before first use of:

`@cf/meta/llama-3.2-11b-vision-instruct`

Follow the current Cloudflare model documentation and send the documented one-time `prompt: "agree"` request from your Cloudflare account.

## 4. Local Worker

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

## 5. Connect local AcademPazam

At repository root create `.env.local`:

```env
VITE_AI_IMPORT_API_BASE_URL=http://localhost:8787
```

Then run the normal frontend:

```bash
npm run dev
```

## 6. Text-only smoke test first

Before testing PDFs, verify text extraction with multipart form data:

```bash
curl -X POST http://localhost:8787/api/v1/extract/academic-import \
  -F 'mode=degree_plan' \
  -F 'text=Semester 1\n101 Introduction to Programming 4 credits\n102 Calculus 1 5 credits'
```

Verify that the response is the documented `ok: true` envelope and contains structured `courses`.

## 7. File smoke test

Then test a synthetic/redacted PDF or image. Do not use a sensitive real transcript during development unless you intentionally accept the remote AI-processing implications.

## 8. Deploy

```bash
npm run deploy
```

Set the production `ALLOWED_ORIGIN` to the AcademPazam GitHub Pages origin and note the resulting `workers.dev` URL. Production frontend wiring is an integration step; do not edit the existing GitHub Pages deployment workflow from this feature branch yet.

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

Note: the current repository baseline contains pre-existing lint failures outside this feature. The AI Import CI therefore requires the full test suite and build, while linting the newly added AI Import code separately. Do not treat unrelated baseline lint debt as an AI Import regression.

Manual happy path:

1. Open Courses.
2. Click **Import with AI**.
3. Import a degree-plan sample.
4. Review/edit one row.
5. Confirm.
6. Verify Courses and Dashboard refresh.
7. Import academic results.
8. Verify exact course matches are proposed as updates and grade threshold logic is local.
