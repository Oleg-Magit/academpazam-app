# AcademPazam — AI Course Blueprint

**Antigravity execution source of truth**  
**Owner:** Project partner  
**Branch:** `feat/ai-course-blueprint`  
**Baseline:** `main@e20d35dd6765726202436bfb80b53f5b862a7d2e`  
**Target:** Weekend AI course project  
**Status:** READY FOR ANTIGRAVITY EXECUTION

---

# 0. How to use this document in Google Antigravity

This file is written as the primary task contract for an Antigravity coding Agent.

Open the repository as the active Antigravity Project/workspace, switch to the required branch, then start one main Agent conversation with a prompt equivalent to:

```text
Implement the AI Course Blueprint feature end-to-end.
Read @docs/AI_COURSE_BLUEPRINT_ANTIGRAVITY.md completely before editing anything.
Treat it as the implementation source of truth.
First inspect the current repository and produce an Implementation Plan artifact mapped to the milestones in the document.
Then execute the MUST scope autonomously, running tests and using browser verification before declaring completion.
Do not expand scope, redesign the app, edit main, or implement the other AI feature.
If repository reality conflicts with the document, preserve existing product semantics and report the deviation explicitly.
```

## Antigravity operating mode

Use the Agent as an end-to-end implementation agent, not as autocomplete.

The main Agent owns all code changes.

Optional subagents are allowed only for bounded read-only support such as:

- codebase reconnaissance;
- test-case review;
- Cloudflare API documentation verification;
- manual QA checklist review.

Do not let parallel subagents independently edit overlapping repository files.

The Agent should maintain these verification artifacts during the task:

1. **Implementation Plan** — before editing.
2. **Task/Progress artifact** — milestone completion and deviations.
3. **Final Verification Report** — commands run, tests passed, browser paths verified, remaining limitations.
4. Browser screenshots/recordings are useful evidence for the final UI happy path when available.

Terminal commands may be executed by the Agent, but destructive Git operations, force pushes, history rewrites, or changes outside this branch are forbidden.

---

# 1. Mission

Build one complete vertical feature:

> **Inside an existing AcademPazam course, upload or paste a syllabus, use AI to extract the actual learning topics, review/edit the proposal, and save approved topics into the existing course tracker.**

The goal is not to compete with NotebookLM.

AcademPazam is not becoming a document-chat or tutoring product.

The feature removes the manual work of turning a syllabus into the existing `Topic` structure that AcademPazam already knows how to track.

### Engineering principle

> **AI extracts the course structure; the student verifies it; AcademPazam stores ordinary Topics.**

No AI-generated topic is saved automatically.

---

# 2. Repository safety contract

Before editing:

1. Verify repository is exactly `Oleg-Magit/academpazam-app`.
2. Verify branch is exactly `feat/ai-course-blueprint`.
3. Inspect current HEAD; do not assume the baseline SHA is still current.
4. Never implement directly on `main`.
5. Never reset/rebase/force-push away newer work.
6. Do not edit the AI Academic Import feature.
7. Do not perform unrelated cleanup/refactors.
8. Preserve current UI, course lifecycle, grades, GPA, progress, repeat behavior, PWA behavior and manual topic workflows.

Existing root quality gate:

```bash
npm ci
npm run check
```

Antigravity must run the relevant gate itself before reporting completion.

---

# 3. Inspect these existing files first

The Agent must read these before proposing implementation details:

```text
src/core/models/types.ts
src/core/db/db.ts
src/core/hooks/useData.ts
src/features/courses/CourseDetails.tsx
src/features/topics/BulkAddTopicModal.tsx
src/features/topics/TopicModal.tsx
src/ui/Button.tsx
src/ui/Card.tsx
src/ui/Input.tsx
src/app/i18n/useTranslation.tsx
package.json
vite.config.ts
```

Key existing facts to preserve:

- `Topic` already has `id`, `courseId`, `title`, optional `description`, `status`, timestamps.
- `CourseDetails` already supports Add Topic and Bulk Add Topics.
- `useTopics()` already refreshes topics for one course.
- Topic completion already feeds existing course progress behavior.
- The course page already uses current app styles/components.

Do not introduce a second topic domain model.

---

# 4. Exact MVP scope

## MUST

Inside an existing course, the user can:

1. Click **Generate Topics from Syllabus**.
2. Choose exactly one source:
   - upload PDF;
   - upload JPEG/PNG;
   - paste syllabus text.
3. See a concise consent notice before remote AI processing.
4. Analyze the selected source.
5. Receive proposed syllabus learning topics.
6. Review all proposed topics before save.
7. Edit topic titles/descriptions.
8. Select/deselect individual topics.
9. See duplicate warnings against topics already in that course.
10. Confirm.
11. Save selected topics locally as normal AcademPazam `Topic` records.
12. Refresh the existing topic list.
13. Continue using Add Topic and Bulk Add Topics even if AI fails.

## Nice-to-have only after MUST is stable

- Display source-level warnings such as “syllabus structure was unclear”.
- Allow simple reorder in review if it is trivial and does not destabilize the flow.

## OUT OF SCOPE

Do not implement:

- AI Academic Import
- transcript parsing
- degree-plan import
- grading weights
- assignments
- deadlines
- calendar events
- lecturer/contact extraction
- study material storage
- summaries
- flashcards
- quizzes
- RAG
- embeddings/vector DB
- AI chat
- automatic topic completion
- prerequisite graph
- user accounts
- cloud database
- authentication
- document storage
- generic file manager
- Course page redesign

---

# 5. Parallel-development isolation

This branch is deliberately isolated from Oleg's Academic Import branch.

Own a separate Worker package:

```text
workers/course-blueprint/
```

Do NOT create or edit:

```text
workers/academic-import/**
workers/shared/**
src/features/ai-import/**
```

Do NOT edit `.github/workflows/deploy.yml` in this branch.

Do NOT add a shared backend package that Oleg must adopt before his feature works.

The final production wiring of both Worker URLs happens only after both vertical features are complete.

---

# 6. Zero-cost feature architecture

```text
CourseDetails
    |
    | selected syllabus file/text only
    v
Course Blueprint modal
    |
    v
Cloudflare Worker
workers/course-blueprint
    |
    | AI.toMarkdown() for files
    v
Workers AI JSON extraction
    |
    v
CourseBlueprintExtraction DTO
    |
    v
Deterministic topic normalization
    |
    v
Human review/edit/select
    |
    v
Local IndexedDB topics transaction
    |
    v
refreshTopics()
```

No remote database is needed.

No uploaded source is stored by our application.

No paid provider is required.

---

# 7. Worker package

Create:

```text
workers/course-blueprint/
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

Use Cloudflare Workers AI.

Model for the weekend implementation:

```text
@cf/meta/llama-3.2-11b-vision-instruct
```

Use Workers AI JSON Mode with an explicit schema, then validate returned data again at runtime.

The model currently requires the Meta model license to be accepted once before normal inference. Treat this as deployment setup.

Preferred source path:

```text
PDF/JPEG/PNG
 -> env.AI.toMarkdown()
 -> normalized text/Markdown
 -> length check
 -> Workers AI JSON extraction
```

Pasted text skips `toMarkdown()`.

Do not store source or output in R2/KV/D1.

---

# 8. Worker API contract

Health:

```http
GET /api/v1/health
```

Response:

```json
{
  "ok": true,
  "service": "academpazam-course-blueprint"
}
```

Extraction:

```http
POST /api/v1/extract/course-blueprint
```

Request:

```text
multipart/form-data
file = optional File
text = optional string
```

Exactly one source is required.

Accepted files:

```text
application/pdf
image/png
image/jpeg
text/plain
```

Hard limits:

- 10 MB file max.
- 100,000 character max after text conversion/truncation policy.
- Reject unsupported MIME types.

---

# 9. DTO contract

Create:

```text
src/features/ai-blueprint/types.ts
```

```ts
export interface ExtractedCourseTopic {
  sourceTopicId: string;
  title: string;
  description: string | null;
  confidence: number;
  warnings: string[];
}

export interface CourseBlueprintExtraction {
  courseTitle: string | null;
  topics: ExtractedCourseTopic[];
  warnings: string[];
}
```

Worker success envelope:

```ts
export interface BlueprintApiSuccess {
  ok: true;
  requestId: string;
  data: CourseBlueprintExtraction;
  meta: {
    model: string;
    sourceConversion: 'markdown' | 'plain_text';
    truncated: boolean;
  };
}
```

Failure envelope:

```ts
export interface BlueprintApiFailure {
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

Raw Cloudflare/provider errors must not be sent directly to the UI.

---

# 10. Prompt/extraction rules

The extraction model must identify **study topics taught by the course**, not every heading in the source.

Extract examples such as:

```text
Asymptotic Complexity
Linked Lists
Stacks and Queues
Binary Search Trees
AVL Trees
Hash Tables
Graphs
Shortest Paths
```

Do not convert these into topics unless they are genuinely subject matter:

- instructor email
- office hours
- attendance policy
- academic integrity text
- bibliography heading
- grading percentage
- room number
- submission instructions
- generic “Course Description” heading

Rules:

- Keep topic titles concise.
- Preserve the language of the syllabus.
- Do not invent topics absent from the source.
- Description may be `null`.
- Confidence is a review hint only.
- Ambiguous source structure creates warnings.
- Empty topic arrays are valid if nothing reliable can be extracted; do not hallucinate to avoid an empty response.

---

# 11. Frontend structure

Create only feature-local files where practical:

```text
src/features/ai-blueprint/
  CourseBlueprintModal.tsx
  CourseBlueprintReview.tsx
  courseBlueprintApiClient.ts
  courseBlueprintNormalizer.ts
  courseBlueprintNormalizer.test.ts
  persistCourseBlueprint.ts
  types.ts
  i18n.ts
```

This local structure is intentional to reduce merge conflicts with the parallel Academic Import feature.

Do not edit `src/core/db/db.ts` for this feature unless repository reality makes it unavoidable.

---

# 12. Feature-local i18n isolation

To avoid both parallel branches editing the large shared locale files, keep Course Blueprint strings in:

```text
src/features/ai-blueprint/i18n.ts
```

Use the current `language` from existing `useTranslation()` so global language and RTL behavior remain authoritative.

Example shape:

```ts
export type BlueprintTextKey =
  | 'open'
  | 'title'
  | 'upload'
  | 'paste'
  | 'consent'
  | 'analyze'
  | 'review'
  | 'save'
  | 'duplicate'
  | 'error';

const text = {
  en: { /* ... */ },
  he: { /* ... */ },
  ru: { /* ... */ },
};

export function blueprintText(
  language: 'en' | 'he' | 'ru',
  key: BlueprintTextKey
): string {
  return text[language]?.[key] ?? text.en[key];
}
```

Do not modify the central locale files in this branch.

After both features merge, these local dictionaries may be consolidated into global i18n as a cleanup task, but that is not a weekend blocker.

---

# 13. Exact UI integration point

Only primary existing screen integration:

```text
src/features/courses/CourseDetails.tsx
```

Current course actions already include Add Topic and Bulk Add Topics.

Add a third action:

> **Generate Topics from Syllabus**

Requirements:

- visually consistent with current buttons;
- usable on mobile;
- do not remove/relabel manual actions;
- opens `CourseBlueprintModal` for the current `course.id`;
- on successful save calls existing `refreshTopics()`.

Do not add a new top-level route.

---

# 14. Modal state machine

```ts
type BlueprintStep =
  | 'source'
  | 'consent'
  | 'analyzing'
  | 'review'
  | 'saving'
  | 'success'
  | 'error';
```

Source state must enforce file XOR pasted text.

User can cancel before analysis or close review without persistence.

AI errors must keep manual Topic/Bulk Add functionality intact.

---

# 15. Deterministic topic normalizer

Create:

```text
src/features/ai-blueprint/courseBlueprintNormalizer.ts
```

Input:

- AI extraction;
- current course ID;
- current existing topics.

Output review rows, not persisted `Topic`s.

Suggested type:

```ts
export interface CourseBlueprintReviewRow {
  sourceTopicId: string;
  selected: boolean;
  title: string;
  description: string;
  duplicateOfTopicId: string | null;
  warnings: string[];
}
```

Normalization rules:

- trim title/description;
- collapse repeated whitespace;
- empty title -> invalid/unselected;
- compare normalized title against existing course topics;
- exact duplicate -> default unselected;
- do not use embeddings/semantic similarity for duplicate decisions;
- do not change existing topic statuses;
- do not merge into an existing topic automatically.

Safe duplicate normalization:

```text
trim
lowercase
collapse whitespace
conservative punctuation normalization
```

---

# 16. Review UI

Show each proposed topic with:

- selection checkbox;
- title input;
- optional description input/textarea;
- duplicate warning where applicable;
- warning/uncertainty indicator where useful.

Requirements:

- all selected titles editable;
- exact duplicates default to skipped;
- invalid blank selected title blocks save;
- user can select a previously skipped duplicate only deliberately;
- save button displays selected count;
- no persistence until final confirmation.

Do not overload the UI with confidence percentages unless they help the user. Warnings are more important than numeric model confidence.

---

# 17. Local persistence without shared DB-file conflict

Create:

```text
src/features/ai-blueprint/persistCourseBlueprint.ts
```

Reuse the existing exported `initDB()` from the current DB layer.

Create approved topics only after review confirmation.

Each new topic must use the existing domain model:

```ts
{
  id: uuidv4(),
  courseId,
  title,
  description: description || undefined,
  status: 'not_started',
  createdAt: now,
  updatedAt: now
}
```

Use one IndexedDB `readwrite` transaction on the existing `topics` store where practical so the selected batch is coherent.

Do not:

- add a new store;
- bump DB version;
- persist AI DTO/confidence/warnings;
- persist the uploaded syllabus;
- modify the existing course object.

After commit:

```ts
refreshTopics();
```

---

# 18. API client/configuration

Feature-local client:

```text
src/features/ai-blueprint/courseBlueprintApiClient.ts
```

Frontend env variable:

```text
VITE_AI_BLUEPRINT_API_BASE_URL
```

For local testing, use untracked `.env.local`.

Do not edit `.github/workflows/deploy.yml` in this branch.

If the env variable is absent:

- existing CourseDetails works normally;
- manual topic actions work;
- AI action may be disabled or show “AI service not configured”.

Use timeout/`AbortController` behavior where practical.

---

# 19. Privacy/CORS requirements

Consent notice meaning must include:

- selected syllabus source leaves the device temporarily for AI processing;
- the rest of the AcademPazam local database is not uploaded;
- extracted topics require review;
- user can cancel and use manual topic entry.

Worker must not log raw syllabus text.

Allowed browser origins:

```text
http://localhost:5173
https://oleg-magit.github.io
```

Do not use wildcard production CORS.

CORS is not authentication; do not add auth merely for this weekend demo.

---

# 20. Required unit tests

`courseBlueprintNormalizer.test.ts` must cover at minimum:

1. valid extracted topic becomes selected proposal.
2. whitespace is normalized.
3. blank title is invalid/unselected.
4. exact duplicate existing topic is detected.
5. duplicate default is unselected.
6. non-duplicate stays selected.
7. editing the proposal does not mutate existing topics.
8. warnings survive normalization for review.

If persistence logic is easy to unit test without brittle IndexedDB setup, add focused tests; do not destabilize existing test infrastructure solely for that.

---

# 21. Browser/manual QA — Antigravity must perform

Use Antigravity's Browser capability or equivalent local browser verification after implementation.

## Happy path

1. Run frontend locally.
2. Open AcademPazam.
3. Open an existing course.
4. Confirm Add Topic and Bulk Add Topics still exist.
5. Click Generate Topics from Syllabus.
6. Paste or upload a representative syllabus.
7. Accept consent and analyze.
8. Confirm review shows plausible learning topics.
9. Edit one title.
10. Deselect one topic.
11. Save.
12. Confirm selected topics appear on CourseDetails.
13. Toggle an imported topic through existing topic progress states.
14. Confirm existing course progress behavior still works.

## Duplicate path

1. Run extraction again with one already-imported topic.
2. Confirm duplicate is warned/skipped by default.
3. Confirm it is not silently duplicated.

## Failure paths

Verify at least:

- Worker unavailable;
- missing Worker URL;
- invalid file type;
- oversized file;
- empty/irrelevant syllabus;
- invalid model output handling;
- user cancels consent;
- user closes review without saving.

Existing manual topic workflows must survive every failure path.

Capture the verified paths in the Final Verification Report artifact.

---

# 22. Antigravity milestone execution

The Agent must execute in this order.

## Milestone 0 — Reconnaissance + Plan artifact

Read repository files and this document.

Produce an Implementation Plan artifact containing:

- current architecture summary;
- exact files to add/change;
- API/DTO contract;
- test plan;
- any repository reality that differs from this document.

Do not start broad implementation before the plan is coherent.

Exit gate:

> Agent can explain how one syllabus becomes ordinary existing `Topic` records without changing academic domain semantics.

## Milestone 1 — Worker text vertical slice

Implement:

- feature Worker package;
- health endpoint;
- CORS;
- text-only request;
- prompt;
- JSON Mode schema;
- runtime validation;
- typed errors.

Run local Worker tests/typecheck.

Exit gate:

> Representative pasted syllabus returns a valid `CourseBlueprintExtraction`.

## Milestone 2 — File conversion

Add PDF/JPEG/PNG conversion with `env.AI.toMarkdown()`.

Exit gate:

> Representative uploaded syllabus reaches the same DTO contract.

## Milestone 3 — Frontend normalizer/review

Implement types, API client, normalization tests and review UI.

Exit gate:

> A fixture response can be reviewed/edited without any database write.

## Milestone 4 — CourseDetails + persistence

Integrate button/modal and feature-local batch persistence.

Exit gate:

> End-to-end local flow saves normal Topics and calls `refreshTopics()`.

## Milestone 5 — Languages + mobile + failures

Complete feature-local HE/EN/RU text, mobile/RTL behavior and error states.

Run:

```bash
npm run check
```

Run Worker typecheck/build.

## Milestone 6 — Browser verification artifact

Use browser automation/manual browser session to exercise happy, duplicate and failure paths.

Final Verification Report must list:

- commands run;
- test results;
- browser flows actually tested;
- screenshots/recordings if produced;
- known limitations;
- exact branch HEAD.

---

# 23. Definition of Done

The Agent must not claim completion until all are true:

- [ ] Correct repo and branch verified.
- [ ] Add Topic still works.
- [ ] Bulk Add Topics still works.
- [ ] Generate Topics from Syllabus exists in CourseDetails.
- [ ] PDF/JPEG/PNG/pasted text source is supported.
- [ ] Consent appears before remote AI processing.
- [ ] Worker has no application-level source retention.
- [ ] Worker validates structured AI output.
- [ ] Topic extraction stays focused on learning topics.
- [ ] User reviews before saving.
- [ ] User can edit/select/skip proposals.
- [ ] Existing exact topic duplicates are detected.
- [ ] Saved records use the existing `Topic` model.
- [ ] New topics start `not_started`.
- [ ] No IndexedDB schema migration was added.
- [ ] `src/core/db/db.ts` remains untouched unless deviation was explicitly justified.
- [ ] No AI Academic Import code was added.
- [ ] No shared Worker dependency was created.
- [ ] HE/EN/RU feature UI is usable.
- [ ] RTL/mobile manually verified.
- [ ] AI errors do not break manual CourseDetails behavior.
- [ ] `npm run check` passes.
- [ ] Worker typecheck/build passes.
- [ ] Browser happy path was actually verified.
- [ ] Final Verification Report artifact exists.

---

# 24. Expected change boundary

Expected files are primarily:

```text
src/features/ai-blueprint/**
src/features/courses/CourseDetails.tsx
workers/course-blueprint/**
```

Avoid editing shared files outside this list unless genuinely required by repository reality.

Specifically avoid:

```text
src/core/db/db.ts
src/features/courses/Courses.tsx
src/features/courses/components/CoursesToolbar.tsx
src/features/ai-import/**
workers/academic-import/**
.github/workflows/deploy.yml
```

If a deviation is unavoidable, document it before editing and keep it minimal.

---

# 25. Final demo framing

When presenting the feature:

> **A syllabus already contains the course structure, but students still have to manually rebuild that structure inside planning tools. Course Blueprint uses AI only to interpret the syllabus, gives the student control over the result, and then turns the approved output into the same local Topics AcademPazam already knows how to track.**

---

# 26. Stop conditions

Stop scope expansion and report instead of improvising if any of these occur:

- implementing the feature would require changing GPA/course lifecycle semantics;
- a provider requirement would introduce unavoidable payment;
- a new cloud database appears necessary;
- the task starts turning into NotebookLM/RAG/chat;
- a change would require destructive Git history operations;
- the other feature's files would need broad edits;
- the implementation cannot pass the existing root gate.

The correct response to these conditions is a bounded deviation report, not architectural expansion.
