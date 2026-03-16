# AcademPazam – Presentation Cheatsheet

Use this document for quick review before a presentation or interview. It distills the complex system into clear, high-impact talking points.

---

## 1. The Big Idea (Elevator Pitch)
"AcademPazam is a **local-first academic roadmap tool** built with React and IndexedDB. It solves the complex problem of **course attempt lineage**—ensuring that credits, retakes, and 'Needs Repeat' logic are calculated accurately as a student progresses through their degree, all without needing a backend."

---

## 2. Key Talking Points
- **Source of Truth**: The app doesn't just store data; it **computes** academic standing in real-time.
- **Privacy by Design**: Fully local storage (IndexedDB) means 100% data privacy and offline capability.
- **Recursive Lineage**: Advanced logic that links multiple course attempts into a single requirement "chain."
- **Outcome-Aware UI**: Badges and statuses prioritize academic results (grades) over simple progress completion.

---

## 3. Architecture & Stack (The Speed-Run)
- **Frontend**: React + TypeScript + Vite.
- **Storage**: IndexedDB (via `idb` library) for structured, local-only persistence.
- **Logic**: Centralized Service Layer (`courseLifecycle.ts`) for all "brain" work.
- **State**: Derived state (calculations on-the-fly) ensures the UI never becomes stale.
- **Testing**: Automated `Vitest` suite protecting the critical credit-calculation engine.

---

## 4. Retake Logic (The Technical Moat)
This is the hardest part of the project. Explain it using these terms:
1.  **Lineage**: A linked group of attempts for one course requirement.
2.  **Deduplication**: Credits are counted only once, regardless of how many times a course is taken.
3.  **Ownership**: The "latest valid pass" earns the credits for the degree.
4.  **Suppression**: "Needs Repeat" warnings are hidden if an active retake is already scheduled.

---

## 5. Presentation Power Phrases
*Instead of "I coded a list," say...*
- "I implemented a **recursive lineage-tracking algorithm** to manage academic attempts."
- "I designed an **outcome-prioritized rendering path** to handle conflicting status flags."
- "The system uses **declarative derived state** to maintain data integrity without a backend."
- "I prioritized **local-first persistence** to ensure zero-latency and maximum user privacy."

---

## 6. Top 10 Q&A (Interview Ready)

**1. Q: Why did you use IndexedDB instead of a standard SQL database?**
**A:** "For a personal planning tool, privacy and offline access are key. IndexedDB allows for structured, complex data storage directly in the browser, providing a backend-like experience with zero server costs and maximum privacy."

**2. Q: What was the most challenging technical bug?**
**A:** "The 'Completed vs Failed' conflict. Courses with 100% topic progress were showing as 'Completed' even if the user failed the exam. I fixed this by decoupling topic progress from academic outcome and ensuring the academic status always takes priority in the UI."

**3. Q: How do you prevent users from 'double counting' credits if they retake a course?**
**A:** "I implemented a lineage-grouping service. It finds the common 'Root ID' for all attempts and ensures that the degree progress aggregator only sums credits once per lineage."

**4. Q: What happens if a user deletes a course that is part of a retake chain?**
**A:** "I wrote a `stitchAndRecomputeLineage` function. If a middle attempt is deleted, the system re-links the successor to the predecessor, preserving the integrity of the chain."

**5. Q: How do you handle different passing thresholds (e.g., 55 vs 60)?**
**A:** "The passing threshold is a property of the Degree Plan. All services (passing checks, badge logic, and credit counting) receive this threshold as a parameter, so the entire UI updates instantly if the threshold is changed."

**6. Q: Why use Vitest for a frontend project?**
**A:** "Because the academic logic is critical. I needed to ensure that even complex scenarios—like multiple failures followed by a pass—always calculate the correct credits. Vitest allows me to run these logic-heavy tests in milliseconds."

**7. Q: How does the app stay fast as the user adds more data?**
**A:** "I use IndexedDB indexes (like `by-plan` or `by-course`) to fetch only what is needed. Additionally, all heavy calculations are memoized or handled in specialized services to keep the UI response time under 16ms."

**8. Q: How do you handle internationalization?**
**A:** "I used `i18next`. All UI strings, including dynamic status labels like 'FAILED' or 'PASSED', are pulled from locale files (EN, HE, RU), making the system accessible to a global audience."

**9. Q: What is 'Enriched Data' in your system?**
**A:** "It’s a pattern where raw DB records (Courses) are combined with their children (Topics) and calculated metadata (Effective Status) before reaching the React components. This keeps the components 'dumb' and purely visual."

**10. Q: What is the next logical step for this project?**
**A:** "Implementing a 'What-If' analyzer where users can simulate future grades to see how it affects their GPA or graduation date, leveraging the existing derived-state architecture."
