# AcademPazam — AI Academic Import

**Implementation source of truth**  
**Owner:** Oleg  
**Branch:** `feat/ai-academic-import`  
**Baseline:** `main@e20d35dd6765726202436bfb80b53f5b862a7d2e`  
**Target:** Weekend AI course project  
**Status:** READY FOR IMPLEMENTATION

---

## 0. Mission

Build one complete vertical feature:

> **Upload an academic degree-plan or academic-results document, extract course data with AI, review it, and safely apply it to the existing AcademPazam degree tracker.**

The feature must solve the largest current onboarding problem in AcademPazam: entering an entire degree manually.

This is not a redesign and not a generic AI feature.

### Engineering principle

> **AI interprets the unstructured document. AcademPazam owns academic truth. The user approves persistence.**

The AI must never directly write a `Course`, `Semester`, grade status, GPA, credits-earned result, or repeat lineage into IndexedDB without deterministic normalization and user review.

---

# 1. Repository constraints

Before changing anything:

1. Verify repository is exactly `Oleg-Magit/academpazam-app`.
2. Verify current branch is exactly `feat/ai-academic-import`.
3. Fetch/inspect the actual current branch head before work.
4. Never commit implementation directly to `main`.
5. Do not reset/rewrite unrelated repository history.
6. Preserve all existing manual workflows.
7. Do not redesign the current Courses/Dashboard experience.
8. Run the existing quality gate before completion.

Existing root gate:

```bash
npm ci
npm run check
```

---

# 2. Existing code this feature must reuse

Inspect these files before implementation:

```text
src/core/models/types.ts
src/core/db/db.ts
src/core/hooks/useData.ts
src/core/services/courseLifecycle.ts
src/core/services/dataService.ts
src/core/services/gpaService.ts
src/features/courses/BulkAddCourseModal.tsx
src/features/courses/Courses.tsx
src/features/courses/components/CoursesToolbar.tsx
src/features/dashboard/Dashboard.tsx
src/features/dashboard/hooks/useDashboardData.ts
src/app/i18n/locales/en.ts
src/app/i18n/locales/he.ts
src/app/i18n/locales/ru.ts
```

Important existing behavior:

- Courses are stored locally in IndexedDB.
- Semesters are normalized entities with IDs.
- Grades/status/repeat attempts already have deterministic lifecycle rules.
- GPA/progress already exist and must remain authoritative.
- Manual Bulk Add Courses already provides a useful interaction pattern and must remain available as an offline fallback.
- The app supports Hebrew, English, Russian and RTL.

Do not duplicate existing academic calculation logic.

---

# 3. Exact MVP scope

## MUST

The user can:

1. Open Courses.
2. Choose **Import with AI**.
3. Select one import mode:
   - `degree_plan`
   - `academic_results`
4. Upload one PDF/JPEG/PNG OR paste text.
5. See an explicit privacy/AI-processing notice.
6. Start analysis.
7. Receive structured extracted rows.
8. Review/edit every academic field before save.
9. See whether each row will be Add / Update / Skip.
10. Resolve missing credits/semester fields before confirming.
11. Confirm one batch import.
12. Persist the reviewed changes locally.
13. Return to existing AcademPazam calculations and see Dashboard/Courses update.
14. Continue using all manual functionality if AI is unavailable.

## SHOULD only after MUST is stable

- Detect multiple attempts of the same exact course and warn the user.
- Propose repeat lineage only when ordering is deterministic.

## OUT OF SCOPE

Do not add:

- prerequisite graph
- semester recommendation engine
- AI chat
- study-material RAG
- quizzes/flashcards
- calendar/tasks
- user accounts
- cloud database
- authentication
- university scraping
- automatic saving without review
- background jobs
- uploaded-document storage
- Risk Radar in this branch
- Course Blueprint in this branch

---

# 4. Product semantics: two import modes

This distinction is mandatory.

## `degree_plan`

Represents what the degree requires / what the student intends to complete.

Default new-course semantics:

```text
grade = null
manualStatus = not_started
attemptStatus = planned
attemptNumber = 1
```

Never infer that a course was completed merely because it appears in a degree plan.

## `academic_results`

Represents grades/results/attempts already recorded by the academic institution.

If a matching existing course is found, prefer proposing `update`, not duplicate `add`.

If a numeric grade exists, AcademPazam determines pass/fail from the plan's current `passing_exam_threshold`.

The AI's textual `passed`/`failed` label cannot override a numeric grade.

---

# 5. Zero-cost architecture for this feature

This branch owns a feature-specific Cloudflare Worker:

```text
workers/academic-import/
```

Do NOT create a shared root `worker/` package in this branch.

Reason: the parallel Course Blueprint feature will own a separate Worker and must not collide with this branch.

Architecture:

```text
AcademPazam React PWA
        |
        | selected file/text only
        v
Cloudflare Worker: academic-import
        |
        | AI.toMarkdown() for file conversion
        v
Workers AI structured extraction
        |
        v
Transient extraction DTO
        |
        v
Frontend deterministic normalizer
        |
        v
Human review
        |
        v
Atomic IndexedDB batch
```

### Worker directory

```text
workers/academic-import/
  package.json
  tsconfig.json
  wrangler.jsonc
  src/
    index.ts
    cors.ts
    errors.ts
    documentToText.ts
    schema.ts
    prompt.ts
```

### Model

Use Cloudflare Workers AI model:

```text
@cf/meta/llama-3.2-11b-vision-instruct
```

Use JSON Mode with an explicit schema.

The model currently requires accepting Meta's model license once before normal use. Treat that as deployment setup, not application behavior.

### No paid dependencies

Do not introduce Railway, Supabase, Firebase, a paid AI API, R2, KV, D1, or another persistent backend.

---

# 6. API contract

Endpoint:

```http
POST /api/v1/extract/academic-import
```

Content type:

```text
multipart/form-data
```

Fields:

```text
mode = degree_plan | academic_results
file = optional File
text = optional string
```

Exactly one of `file` or `text` is required.

Accepted files:

```text
application/pdf
image/png
image/jpeg
text/plain
```

Limits:

- Max file size: 10 MB.
- Max converted/pasted text sent to the extraction model: 100,000 characters.
- No arbitrary MIME types.

Health endpoint:

```http
GET /api/v1/health
```

No AI call on health.

---

# 7. Extraction DTO

Create frontend types:

```text
src/features/ai-import/types.ts
```

The Worker response must satisfy the same contract.

```ts
export type AcademicImportMode = 'degree_plan' | 'academic_results';

export interface ExtractedAcademicCourse {
  sourceRowId: string;
  code: string | null;
  name: string;
  credits: number | null;
  semesterLabel: string | null;
  year: number | null;
  term: 'A' | 'B' | 'SUMMER' | 'OTHER' | null;
  grade: number | null;
  explicitStatus: 'passed' | 'failed' | 'in_progress' | 'planned' | null;
  confidence: number;
  warnings: string[];
}

export interface AcademicImportExtraction {
  importMode: AcademicImportMode;
  documentLanguage: string | null;
  courses: ExtractedAcademicCourse[];
  warnings: string[];
}
```

### Model extraction rules

The prompt/schema must force these semantics:

- Preserve source-language course names.
- Never translate a course name just for import.
- Never invent a course code.
- Never invent credits.
- Never invent a grade.
- Use `null` when data is not explicitly available/reliable.
- Grades are 0..100 only when numeric and explicit.
- Keep source semester wording where possible.
- Uncertain information produces warnings.
- `confidence` is only a UI review hint.

No academic decision may depend only on confidence.

---

# 8. Worker response envelope

Success:

```ts
interface ApiSuccess<T> {
  ok: true;
  requestId: string;
  data: T;
  meta: {
    model: string;
    sourceConversion: 'markdown' | 'plain_text';
    truncated: boolean;
  };
}
```

Failure:

```ts
interface ApiFailure {
  ok: false;
  requestId: string;
  error: {
    code:
      | 'INVALID_REQUEST'
      | 'UNSUPPORTED_FILE'
      | 'FILE_TOO_LARGE'
      | 'EXTRACTION_FAILED'
      | 'INVALID_MODEL_OUTPUT'
      | 'AI_QUOTA_EXCEEDED'
      | 'AI_UNAVAILABLE';
    message: string;
  };
}
```

Do not expose raw provider errors or document content in error messages.

Validate model output inside the Worker before responding.

JSON Mode is not sufficient by itself; runtime validation is mandatory.

---

# 9. Frontend structure

Create:

```text
src/features/ai-import/
  AcademicImportModal.tsx
  AcademicImportReview.tsx
  academicImportNormalizer.ts
  academicImportNormalizer.test.ts
  types.ts
```

Create API client:

```text
src/core/services/academicImportApiClient.ts
```

Do not place normalization/domain logic in the API client.

### Modal states

```ts
type ImportStep =
  | 'mode'
  | 'source'
  | 'consent'
  | 'analyzing'
  | 'review'
  | 'saving'
  | 'success'
  | 'error';
```

Use existing app components/styles. Do not introduce a second design system.

---

# 10. Exact UI integration points

## `CoursesToolbar.tsx`

Add action:

> **Import with AI**

Keep existing manual Bulk Add action.

Mobile behavior must remain usable.

## `Courses.tsx`

Own/open `AcademicImportModal` here.

On successful batch save:

```ts
refreshCourses();
refreshSemesters();
```

Do not add a new top-level route for this weekend.

## Dashboard

No AI request on Dashboard load.

Dashboard must simply react to the imported local data using existing services.

---

# 11. Deterministic normalizer

Create:

```text
src/features/ai-import/academicImportNormalizer.ts
```

The normalizer receives:

- extraction DTO
- current plan
- current courses
- current semesters
- passing threshold

It returns review rows only. It performs no persistence.

```ts
export type ImportAction = 'add' | 'update' | 'skip';

export interface AcademicImportReviewRow {
  sourceRowId: string;
  action: ImportAction;
  targetCourseId: string | null;
  proposed: {
    code?: string;
    name: string;
    credits: number | null;
    grade: number | null;
    manualStatus?: 'not_started' | 'in_progress' | 'completed';
    attemptStatus?: 'passed' | 'failed' | 'in_progress' | 'planned';
    attemptNumber?: number;
    excludeFromAverage?: boolean;
  };
  semesterResolution: {
    kind: 'existing' | 'new' | 'unresolved';
    semesterId: string | null;
    proposedSemester: Semester | null;
  };
  matchReason: 'course_code' | 'normalized_name' | 'none';
  duplicateRisk: 'none' | 'possible' | 'exact';
  warnings: string[];
}
```

### Matching priority

1. Exact normalized course-code match.
2. If code absent/no code match: exact normalized course-name match.
3. Never fuzzy-auto-update based only on semantic similarity.
4. Ambiguous target -> no silent update.

Safe name normalization only:

- trim
- lowercase
- collapse whitespace
- conservative punctuation normalization

Do not translate names for matching.

---

# 12. Degree-plan normalization rules

For a new `degree_plan` row:

```text
code = extracted code or undefined
name = extracted name
credits = extracted credits OR review-required
semester = resolved/proposed/review-required
grade = null
manualStatus = not_started
attemptStatus = planned
attemptNumber = 1
excludeFromAverage = false
```

### Critical rule: missing credits

Current `Course.credits` cannot be null.

If AI cannot extract credits, the review row is invalid until the user supplies a value.

Do NOT default AI-imported credits to `3`.

### Semester resolution

Prefer:

1. exact/canonical semester match;
2. `year + term` match;
3. proposed new semester when enough information exists;
4. unresolved -> user must select.

Proposed semesters stay transient until final confirmation.

---

# 13. Academic-results normalization rules

## Matching course found

Propose `update`.

If numeric grade exists:

```ts
manualStatus = 'completed';
attemptStatus = grade >= passingThreshold ? 'passed' : 'failed';
```

If explicit pass/fail exists but grade does not:

```text
manualStatus = completed
attemptStatus = explicit source status
grade = null
```

If neither grade nor explicit completion result exists:

- preserve the existing academic state by default;
- show a review warning;
- do not auto-complete.

## No matching course found

Propose `add`.

If a numeric grade exists, create a completed attempt using local threshold logic.

Missing credits or semester still require user resolution.

### Contradiction rule

If AI extracts:

```text
grade = 55
explicitStatus = passed
passingThreshold = 56
```

local deterministic result is `failed`.

Numeric grade + plan threshold wins.

---

# 14. Review UI requirements

At minimum show/edit:

- include/action
- course name
- code
- credits
- semester
- grade/status for academic-results mode
- Add / Update / Skip
- warnings

Requirements:

- User may edit extracted values.
- User may skip any row.
- Invalid rows cannot be committed.
- Existing matched target must be visible for `update`.
- Duplicate risk must be visible.
- Closing review does not write anything.
- No one-click bypass of review.

---

# 15. Atomic persistence

Add a batch helper to:

```text
src/core/db/db.ts
```

Suggested contract:

```ts
export interface AcademicImportBatch {
  semestersToCreate: Semester[];
  coursesToAdd: Course[];
  coursesToUpdate: Course[];
}

export const saveAcademicImportBatch = async (
  batch: AcademicImportBatch
): Promise<void> => {
  // one readwrite IndexedDB transaction over semesters + courses
};
```

Rules:

- No persistence before final review confirmation.
- One readwrite transaction.
- If persistence fails, transaction aborts.
- Do not partially save 20/30 rows.
- `skip` rows are excluded.
- No IndexedDB schema version bump is required.
- No new stores are required.
- Uploaded source documents are never stored in IndexedDB.

---

# 16. Privacy requirements

The current core product remains local-first.

The AI feature is an explicit exception for the selected source only.

Before analysis, tell the user clearly:

- selected file/text is sent to the configured AI processing service;
- the existing AcademPazam database is not uploaded;
- the result is reviewed before local save;
- user can cancel and use manual import.

Worker must not persist:

- uploaded file
- extracted text
- model response
- grades/course lists in logs

Operational logs may include only non-sensitive metadata such as request ID, status/error code and duration.

Do not update README/legal claims in this feature branch until integration unless necessary for local UI testing; final integration must correct any absolute “data never leaves device” claim before production release.

---

# 17. CORS and configuration

Production target origin:

```text
https://oleg-magit.github.io
```

Local origin:

```text
http://localhost:5173
```

Do not use wildcard CORS in production.

Frontend reads:

```text
VITE_AI_IMPORT_API_BASE_URL
```

If missing:

- the rest of AcademPazam still works;
- manual import still works;
- AI action is disabled/hidden with a clear configuration state.

Do NOT edit `.github/workflows/deploy.yml` in this branch. Production wiring of both feature URLs happens after both feature branches are ready.

Use untracked `.env.local` for local end-to-end testing.

---

# 18. Required tests

## Normalizer unit tests

At minimum:

1. degree plan row -> planned course proposal.
2. passing numeric result -> passed.
3. failing numeric result -> failed.
4. numeric grade overrides contradictory extracted status.
5. missing credits -> invalid/review required.
6. exact course code -> deterministic update target.
7. normalized exact name match when code absent.
8. ambiguous candidate does not auto-update.
9. duplicate degree-plan row -> skip/duplicate warning.
10. unresolved semester blocks confirm.
11. normalization never persists data.

## Manual QA

### Degree plan

```text
empty/minimal AcademPazam
-> Import with AI
-> Degree Plan
-> upload/paste sample
-> review
-> edit one field
-> confirm
-> courses/semesters appear
```

### Academic results

```text
existing planned courses
-> Academic Results
-> upload sample transcript
-> matched rows show Update
-> confirm
-> existing courses update
-> Dashboard GPA/progress reflects existing deterministic services
```

### Failure paths

Test:

- Worker offline
- AI quota exceeded
- unsupported file
- file > 10 MB
- empty document
- invalid model output
- user cancels consent
- user closes review
- missing API URL

Manual course entry and manual bulk add must remain usable in all failure cases.

---

# 19. Implementation milestones

## Milestone 0 — inspect + freeze contract

Before editing UI:

- inspect existing domain/DB/BulkAdd flow;
- add DTO types;
- freeze endpoint/schema;
- prepare 3 representative fixtures:
  - degree plan text/PDF
  - academic results text/PDF
  - ambiguous/bad input

Exit gate:

> Exact Worker/frontend contract is stable.

## Milestone 1 — Worker text vertical slice

Implement:

- Worker package
- health endpoint
- CORS
- text input
- Workers AI JSON Mode
- runtime validation
- typed error envelope

Exit gate:

> Local request returns valid DTO from representative pasted text.

## Milestone 2 — file conversion

Add PDF/JPEG/PNG via `env.AI.toMarkdown()`.

Exit gate:

> Representative file reaches the same DTO contract.

## Milestone 3 — normalizer + tests

Implement deterministic matching/mapping before review UI polish.

Exit gate:

> Unit tests cover academic truth boundaries.

## Milestone 4 — review + atomic save

Integrate into Courses and IndexedDB.

Exit gate:

> Document -> AI -> review -> local persistence -> Dashboard works end-to-end.

## Milestone 5 — i18n/mobile/failure QA

Add HE/EN/RU strings and verify RTL/mobile.

Exit gate:

> Existing `npm run check` passes and manual flows do not regress.

---

# 20. Definition of Done

Do not mark this feature complete until all are true:

- [ ] Branch remains `feat/ai-academic-import`.
- [ ] Manual Bulk Add Courses still works.
- [ ] AI Import supports `degree_plan` and `academic_results`.
- [ ] PDF/JPEG/PNG/text source works.
- [ ] Explicit consent is shown before remote AI processing.
- [ ] Worker does not store the document.
- [ ] Worker validates structured output.
- [ ] User always sees review before persistence.
- [ ] Missing credits/semester cannot silently receive invented values.
- [ ] Exact existing courses can be proposed as Update.
- [ ] Numeric grade pass/fail is computed locally.
- [ ] No LLM controls GPA/progress/repeat logic.
- [ ] Batch persistence is atomic.
- [ ] No IndexedDB migration was added unnecessarily.
- [ ] AI outage does not break AcademPazam.
- [ ] HE/EN/RU UI exists.
- [ ] Mobile/RTL behavior is usable.
- [ ] `npm run check` passes.
- [ ] Worker package typecheck/build passes.
- [ ] A manual end-to-end demo has been completed.

---

# 21. Merge/integration boundary

This branch may modify only what is necessary for AI Academic Import and its feature-specific Worker.

Expected high-level touched paths:

```text
src/features/ai-import/**
src/core/services/academicImportApiClient.ts
src/core/db/db.ts
src/features/courses/Courses.tsx
src/features/courses/components/CoursesToolbar.tsx
src/app/i18n/locales/{en,he,ru}.ts
workers/academic-import/**
```

Avoid unrelated cleanup/refactors.

Do not edit:

```text
workers/course-blueprint/**
```

Do not implement the partner's feature.

Production `deploy.yml`, combined privacy copy, and final two-feature configuration are handled only after both feature branches have passed their individual gates.

---

# 22. Demo statement

Use this framing when showing the feature:

> **AcademPazam already knows how to calculate a degree. AI Academic Import removes the manual data-entry barrier: AI reads the document, deterministic code validates what it means for the degree, and the student approves every change before it becomes academic data.**
