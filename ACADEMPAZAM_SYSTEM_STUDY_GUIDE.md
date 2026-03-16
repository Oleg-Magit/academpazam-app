# AcademPazam – System Study & Code-Reading Guide

Welcome to the **AcademPazam System Study Guide**. This document is a deep technical resource designed to help you understand the codebase as a professional engineer would. It focuses on the architectural decisions, data flows, and specific code implementations that make AcademPazam a robust, local-first academic planning tool.

---

## 1. Project Overview

### What is AcademPazam?
AcademPazam is a **Degree Planning & Management System**. It provides students with a visual roadmap, granular topic tracking, and precise academic metric calculations.

### The Real Problem it Solves
Most tools fail to handle **"Academic Lineage"**—the relationship between multiple attempts at the same course. AcademPazam manages this lineage, ensuring credits are counted correctly and "Needs Repeat" warnings are logical rather than just reactive.

### Technical Pillars
- **Local-First Reliability**: Data persists in IndexedDB via the `idb` library.
- **Outcome-Aware UI**: Display logic prioritizes academic results over progress percentages.
- **Derived State Mastery**: Most metrics (GPA, credits, status) are computed at runtime from raw data, ensuring zero sync issues.

---

## 2. Project File Map

This table maps the core of the system and how the different layers interact.

| File Path | Responsibility | Depends On | Used By |
| :--- | :--- | :--- | :--- |
| `src/core/models/types.ts` | **Global Types**: Defines Course, Topic, Semester, etc. | None | Almost every file |
| `src/core/db/db.ts` | **Persistence Layer**: IndexedDB operations and migrations. | `idb` | Services, Hooks |
| `src/core/services/courseLifecycle.ts` | **Business Logic Engine**: Passing/Failing rules, lineage, retakes. | `types.ts` | Services, UI, PDF |
| `src/core/services/dataService.ts` | **Data Aggregator**: Groups courses by semester, degree progress math. | `db.ts`, `courseLifecycle.ts` | Hooks, PDF |
| `src/core/hooks/useData.ts` | **State Connectors**: React hooks that load and refresh data. | `db.ts`, `dataService.ts` | UI Components |
| `src/features/dashboard/Dashboard.tsx` | **Main View**: High-level summaries and cards. | `useData`, `dataService` | `App.tsx` |
| `src/features/courses/Courses.tsx` | **Roadmap View**: Interactive semester roadmap. | `useData`, `CourseList` | `App.tsx` |
| `src/core/services/importExport.ts` | **Data Portability**: JSON export and merge/replace import. | `db.ts` | `DataSettings.tsx` |
| `src/core/services/pdfGenerator.ts` | **Reporting**: Generates the academic degree PDF. | `pdf-lib`, `courseLifecycle` | `DataSettings.tsx` |
| `src/app/i18n/index.ts` | **Localization**: Multi-language config (HE, EN, RU). | `locales/*.ts` | `useTranslation.tsx` |

---

## 3. Data Model Deep Dive

Understanding the data schema is the key to reading the service logic.

### Entity Relationships
- **Plan**: Contains the `passing_exam_threshold`.
- **Course**: The core entity.
    - `repeatedFromCourseId`: Points to the `id` of the *previous* attempt. **Crucial for lineage.**
    - `grade`: The numerical score.
    - `attemptStatus`: Explicitly set status ('passed', 'failed', etc.).
- **Topic**: Children of a Course. Their statuses determine the `effectiveStatus`.

### Status Hierarchy
The system differentiates between **Progress** and **Outcome**:
1.  **effectiveStatus**: (Derived) 'completed' if all topics are done.
2.  **attemptStatus**: (Stored or Derived) 'passed' or 'failed' based on grade/threshold.
3.  **Display Status**: The badge seen in the UI. It uses an **Override Pattern**:
    - *Is it failed academically?* Show **FAILED**.
    - *Is it passed academically?* Show **PASSED**.
    - *Otherwise?* Show Topic Progress (Completed/In Progress).

---

## 4. Important Functions & Services

This section documents the "Brains" of the application.

### `calculateAcademicMetrics`
- **File**: `src/core/services/courseLifecycle.ts`
- **Inputs**: `courses: CourseWithTopics[]`, `passingThreshold: number`
- **Outputs**: `AcademicMetrics` (totalRequired, earned, etc.)
- **Responsibility**: Groups courses into lineages, deduplicates credits, and identifies "Needs Repeat" requirements.
- **Risk**: A bug here leads to incorrect graduation requirements or credit theft.

### `getBadgeConfiguration`
- **File**: `src/core/services/courseLifecycle.ts`
- **Inputs**: `course: Course`, `passingThreshold`, `effectiveStatus`
- **Outputs**: `{ labelKey, variant }`
- **Responsibility**: The UI "Source of Truth" for color and text. **Priority: Academic Outcome > Progress.**
- **Used By**: `CourseList`, `SemesterDrawer`, `CourseDetails`.

### `getRootCourseId`
- **File**: `src/core/services/courseLifecycle.ts`
- **Inputs**: `courseId: string`, `courseMap: Map`
- **Outputs**: `string` (The ID of the first attempt)
- **Responsibility**: Recursively traverses the `repeatedFromCourseId` pointers to find the lineage origin.

### `calculateEffectiveStatus`
- **File**: `src/core/services/dataService.ts`
- **Inputs**: `course: Course`, `topics: Topic[]`
- **Responsibility**: Determines if a course is 'completed' based on child topics or manual status fallback.

### `enrichCourses`
- **File**: `src/core/services/dataService.ts`
- **Responsibility**: Takes raw DB course objects and attaches their `topics` and `effectiveStatus`. **This transforms DB models into UI models.**

---

## 5. Hooks and UI Data Loading

AcademPazam uses a **Fetch-on-Change** pattern with declarative hooks.

### The Loading Chain
1.  **`useCourses(planId)`**: Initiates.
2.  **Service Call**: Calls `getCoursesByPlan(planId)`.
3.  **Enrichment**: Pipes results through `enrichCourses` to attach topics.
4.  **State Update**: Sets the local `courses` state in the hook.
5.  **Re-render**: React detects state change and updates the UI.

### Synchronizing Changes
When a user updates a grade:
1.  UI calls `saveCourse(updatedCourse)` in `db.ts`.
2.  UI component then calls `refresh()` provided by the hook.
3.  The hook increments a `version` counter, triggering its internal `useEffect`.
4.  Data is re-fetched and re-processed, ensuring the UI reflects the new state instantly.

---

## 6. End-to-End Data Flow (Example)

**Scenario: User marks the last topic as "Done" on a course they failed.**

1.  **UI**: User toggles the topic in `CourseDetails.tsx`.
2.  **DB**: `saveTopic` is called. Persistent storage updates.
3.  **Update**: Component calls `refreshCourses()`.
4.  **Service**: `enrichCourses` runs. `calculateEffectiveStatus` now returns `'completed'`.
5.  **Rendering**: `CourseDetails` calls `getBadgeConfiguration`. 
    - It checks `isAttemptFailed()` $\rightarrow$ **True** (grade is 40).
    - It ignores the 'completed' status and returns the **Error/FAILED** badge.
6.  **Result**: The user sees the progress bar at 100%, but the badge remains **Red/FAILED**.

---

## 7. Retake / Repeat Logic Deep Dive

### Lineage Resolution
A lineage is a chain of attempts. The system treats them as a **Unit of Requirement**.

| Value | Policy |
| :--- | :--- |
| **Credits** | Counted once per lineage (at Root ID level). |
| **Needs Repeat** | Shown on a failed attempt IF no successor is in progress and no pass exists. |
| **Succession** | Handled via `createRepeatCourse` which sets up the back-pointer. |

### The Engineering Story: The Failed-Status Bug
- **Bug**: In v1.8.0, failed courses showed "Completed" if all topics were done.
- **Root Cause**: `CourseList` was looking at `effectiveStatus` (Progress) instead of the final `BadgeConfiguration` (Outcome).
- **The Fix**: Unified rendering paths to always use the outcome-aware service logic.

---

## 8. Common Confusions (Study Notes)

- **Lineage vs. Manual Duplicate**: Lineage is connected via code. Manual duplicates are two different requirements.
- **Manual Status**: Only used if a course has **zero topics**. Once topics are added, the topics "own" the progress calculation.
- **Local-First vs. Offline**: Local-first is the engineering approach (local data is master). Offline capability is the byproduct.

---

## 9. Read the Code in This Order (Checklist)

1.  [ ] **`src/core/models/types.ts`**: Understand the data interfaces.
2.  [ ] **`src/core/db/db.ts`**: See how objects move in and out of IndexedDB.
3.  [ ] **`src/core/services/courseLifecycle.ts`**: Study `calculateAcademicMetrics`. It is the most complex logic in the app.
4.  [ ] **`src/core/hooks/useData.ts`**: See how React consumes the services.
5.  [ ] **`src/features/courses/components/CourseList.tsx`**: See how a Course is actually rendered.
6.  [ ] **`src/core/services/importExport.ts`**: See how atomic JSON backups work.

---

## 10. Engineering Appendix: Q&A

**Q: Why separate `attemptStatus` from `effectiveStatus`?**
**A:** "Separation of concerns. Progress (doing the work) is distinct from Outcome (passing the exam). This allows us to track *how* someone failed (completed all work but failed the test)."

**Q: How do you handle data integrity without a foreign key system like SQL?**
**A:** "We use atomic Transactions for deletions and a 'Stitching' service (`stitchAndRecomputeLineage`) to repair chains when items are removed. This ensures no 'Orphan' retakes are left in the UI."

---

**Final Note**: AcademPazam is a study in **Derived State Architecture**. By keeping the database simple and putting the complexity into the service layer, we create a system that is easy to extend and hard to break.
