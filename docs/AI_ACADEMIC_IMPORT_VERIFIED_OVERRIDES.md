# AI Academic Import — Verified Implementation Overrides

**Date verified:** 2026-08-30  
**Branch:** `feat/ai-academic-import`

This note records implementation decisions that changed after the original `AI_ACADEMIC_IMPORT_IMPLEMENTATION.md` was written and were then verified by the actual compiler, Wrangler-generated types, and CI. Where this note conflicts with the original document, **this note and the implemented code take precedence**. All product semantics, safety rules, review requirements, and scope boundaries from the original specification remain unchanged unless explicitly overridden below.

## 1. Extraction model

Use:

```text
@cf/meta/llama-3.3-70b-instruct-fp8-fast
```

Do not use the originally proposed `@cf/meta/llama-3.2-11b-vision-instruct` for structured extraction.

Reason:

- uploaded PDF/image sources are converted to Markdown/text first with `env.AI.toMarkdown()`;
- the extraction model therefore does not need vision;
- current Wrangler-generated model types expose `response_format` for Llama 3.3 70B Fast;
- Cloudflare currently lists this model as supporting JSON Mode;
- Worker typecheck passed with the Llama 3.3 configuration.

The Worker still performs runtime validation of the returned JSON. JSON Mode is not trusted as a schema guarantee.

## 2. Worker runtime/types

- Worker tooling requires Node.js 22 or newer.
- Use `wrangler types` to generate `worker-configuration.d.ts`.
- Do not depend on `@cloudflare/workers-types`; current Wrangler-generated runtime types supersede it for this package.

Required Worker gate:

```bash
npm install
npm run cf-types
npm run typecheck
```

## 3. Frontend engineering gate

The repository currently contains pre-existing lint failures outside the AI Import feature under the current ESLint/React Hooks rules. Do not expand this feature into a repository-wide lint cleanup.

The verified feature gate is:

```bash
npm run test:run
npm run build
npx eslint src/features/ai-import src/core/services/academicImportApiClient.ts src/core/events/dataEvents.ts
```

Verified in GitHub Actions:

- 7 test files passed;
- 67 tests passed;
- full application build passed;
- lint for newly added AI Import code passed;
- Worker dependency installation passed;
- Wrangler type generation passed;
- Worker TypeScript typecheck passed.

## 4. Remaining external verification

Before this Draft PR can be considered integration-ready, still verify against a real Cloudflare account:

1. authenticate/deploy the Worker;
2. health endpoint smoke test;
3. text extraction smoke test using synthetic data;
4. PDF/image extraction smoke test using synthetic/redacted data;
5. browser happy-path for `degree_plan`;
6. browser happy-path for `academic_results`;
7. capture the deployed Worker URL for the later shared production integration step.

Do not merge into `main` until the parallel Course Blueprint feature and the final production/privacy integration pass are coordinated.
