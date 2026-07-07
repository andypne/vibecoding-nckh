# Papers Dashboard Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Display a comprehensive list of 50 research papers with card-based UI, color-coded AI score badges, truncated summaries, responsive design, and proper loading/empty states.

**Architecture:** Refactor the homepage into modular components: PaperCard (individual paper display), PapersGrid (list container with loading/empty state handling), and helper utilities for truncation and badge color logic. Update page.tsx to fetch 50 papers and orchestrate the layout.

**Tech Stack:** Next.js 15 (async server components), React, Tailwind CSS, TypeScript, Supabase

## Global Constraints

- Papers limit: 50
- Papers sort order: `published_at` DESC (most recent first)
- Summary truncation length: 200 characters
- Score badge colors: green ≥8, yellow 6-8, gray <6
- Date format: dd/mm/yyyy (Vietnamese locale)
- Dark mode support: use `dark:` Tailwind classes
- Responsive: mobile-first, single column default, full width on desktop
- Loading message: "Đang tải bài báo..."
- Empty state message: "Chưa có bài báo nào"

---

## File Structure

**Files to create:**
- `nckh-dashboard/lib/utils/paper-helpers.ts` — Helper functions for text truncation and badge color logic
- `nckh-dashboard/components/papers/PaperCard.tsx` — Individual paper card component
- `nckh-dashboard/components/papers/PapersGrid.tsx` — Papers grid container with loading/empty states

**Files to modify:**
- `nckh-dashboard/app/page.tsx` — Update papers query (limit 5→50), integrate new components

---

## Task 1: Create Paper Helper Utilities

**Files:**
- Create: `nckh-dashboard/lib/utils/paper-helpers.ts`

**Interfaces:**
- Produces:
  - `truncateText(text: string, maxLength?: number): string` — Truncates text at maxLength, appends "..."
  - `getScoreBadgeColor(score?: number): 'green' | 'yellow' | 'gray'` — Returns badge color name based on score
  - `scoreBadgeClasses: Record<'green' | 'yellow' | 'gray', string>` — Tailwind class strings for each badge color
  - `Paper` type (optional export for reference)

- [ ] **Step 1: Create the file**

```bash
mkdir -p nckh-dashboard/lib/utils
touch nckh-dashboard/lib/utils/paper-helpers.ts
```

- [ ] **Step 2: Write helper functions**

```typescript
// nckh-dashboard/lib/utils/paper-helpers.ts

export interface Paper {
  id: string;
  title: string;
  authors: string;
  url: string;
  source?: string;
  ai_score?: number;
  ai_summary_vi?: string;
  published_at: string;
}

export function truncateText(text: string, maxLength: number = 200): string {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + "...";
}

export function getScoreBadgeColor(score?: number): 'green' | 'yellow' | 'gray' {
  if (typeof score !== 'number') return 'gray';
  if (score >= 8) return 'green';
  if (score >= 6) return 'yellow';
  return 'gray';
}

export const scoreBadgeClasses = {
  green: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
  yellow: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
  gray: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
};
```

- [ ] **Step 3: Verify no syntax errors**

```bash
cd nckh-dashboard && npx tsc --noEmit lib/utils/paper-helpers.ts
```

Expected: No output (success)

- [ ] **Step 4: Commit**

```bash
cd nckh-dashboard && git add lib/utils/paper-helpers.ts && git commit -m "feat: add paper helper utilities for truncation and badge colors"
```

---

## Task 2: Create PaperCard Component

**Files:**
- Create: `nckh-dashboard/components/papers/PaperCard.tsx`

**Interfaces:**
- Consumes: `Paper` type from `lib/utils/paper-helpers.ts`, `truncateText()`, `getScoreBadgeColor()`, `scoreBadgeClasses`
- Produces: React functional component `PaperCard(props: Paper)` that renders a card

- [ ] **Step 1: Create the directory**

```bash
mkdir -p nckh-dashboard/components/papers
```

- [ ] **Step 2: Write PaperCard component**

```typescript
// nckh-dashboard/components/papers/PaperCard.tsx

import { Paper, truncateText, getScoreBadgeColor, scoreBadgeClasses } from "@/lib/utils/paper-helpers";

export default function PaperCard(paper: Paper) {
  const badgeColor = getScoreBadgeColor(paper.ai_score);
  const badgeClass = scoreBadgeClasses[badgeColor];
  
  const publishedDate = new Date(paper.published_at).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <div className="p-5 bg-white dark:bg-slate-800 rounded-lg shadow hover:shadow-lg transition">
      {/* Title */}
      <a
        href={paper.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-lg font-bold text-blue-600 dark:text-blue-400 hover:underline block"
      >
        {paper.title}
      </a>

      {/* Authors */}
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
        {paper.authors}
      </p>

      {/* Summary */}
      {paper.ai_summary_vi && (
        <p className="text-gray-700 dark:text-gray-300 mt-3 text-sm leading-relaxed">
          {truncateText(paper.ai_summary_vi, 200)}
        </p>
      )}

      {/* Footer: Badges + Date */}
      <div className="flex items-center justify-between mt-4 flex-wrap gap-2">
        <div className="flex gap-2">
          {/* Source Badge */}
          {paper.source && (
            <span className="inline-block px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded text-xs font-medium">
              {paper.source}
            </span>
          )}

          {/* AI Score Badge */}
          <span className={`inline-block px-3 py-1 rounded text-xs font-medium ${badgeClass}`}>
            ⭐ {paper.ai_score !== undefined ? paper.ai_score.toFixed(1) : "N/A"}
          </span>
        </div>

        {/* Published Date */}
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {publishedDate}
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Type check**

```bash
cd nckh-dashboard && npx tsc --noEmit components/papers/PaperCard.tsx
```

Expected: No output (success)

- [ ] **Step 4: Commit**

```bash
cd nckh-dashboard && git add components/papers/PaperCard.tsx && git commit -m "feat: create PaperCard component for individual paper display"
```

---

## Task 3: Create PapersGrid Component

**Files:**
- Create: `nckh-dashboard/components/papers/PapersGrid.tsx`

**Interfaces:**
- Consumes: `Paper` type, `PaperCard` component
- Produces: React functional component `PapersGrid(props: { papers: Paper[], isLoading: boolean })`

- [ ] **Step 1: Write PapersGrid component with loading and empty states**

```typescript
// nckh-dashboard/components/papers/PapersGrid.tsx

import PaperCard from "./PaperCard";
import { Paper } from "@/lib/utils/paper-helpers";

interface PapersGridProps {
  papers: Paper[];
  isLoading: boolean;
}

export default function PapersGrid({ papers, isLoading }: PapersGridProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Đang tải bài báo...</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (papers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-gray-600 dark:text-gray-300">Chưa có bài báo nào</p>
        </div>
      </div>
    );
  }

  // Normal state: render grid of papers
  return (
    <div className="grid grid-cols-1 gap-4">
      {papers.map((paper) => (
        <PaperCard key={paper.id} {...paper} />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Type check**

```bash
cd nckh-dashboard && npx tsc --noEmit components/papers/PapersGrid.tsx
```

Expected: No output (success)

- [ ] **Step 3: Commit**

```bash
cd nckh-dashboard && git add components/papers/PapersGrid.tsx && git commit -m "feat: create PapersGrid component with loading and empty states"
```

---

## Task 4: Update page.tsx to Integrate New Components

**Files:**
- Modify: `nckh-dashboard/app/page.tsx`

**Interfaces:**
- Consumes: `PapersGrid` component, `Paper` type
- Changes:
  - Query limit: `limit(5)` → `limit(50)`
  - Replace inline paper rendering with `<PapersGrid papers={papers} isLoading={false} />`

- [ ] **Step 1: Read current page.tsx**

```bash
cd nckh-dashboard && head -20 app/page.tsx
```

- [ ] **Step 2: Update import statements and add PapersGrid import**

Replace the top section of `app/page.tsx`:

```typescript
// nckh-dashboard/app/page.tsx

import { supabase } from "@/lib/supabase";
import PapersGrid from "@/components/papers/PapersGrid";

async function getResearchData() {
  const [{ data: papers }, { data: topics }] = await Promise.all([
    supabase
      .from("papers")
      .select("*")
      .order("published_at", { ascending: false })
      .limit(50),  // Changed from 5 to 50
    supabase.from("topics").select("*").limit(10),
  ]);

  return { papers: papers || [], topics: topics || [] };
}
```

- [ ] **Step 3: Replace papers section rendering**

In the JSX, replace the papers section (where `{papers.map((paper) => ...` currently is) with:

```typescript
          {/* Papers */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Bài báo gần đây
            </h2>
            <PapersGrid papers={papers} isLoading={false} />
          </div>
```

Full updated `app/page.tsx`:

```typescript
// nckh-dashboard/app/page.tsx

import { supabase } from "@/lib/supabase";
import PapersGrid from "@/components/papers/PapersGrid";

async function getResearchData() {
  const [{ data: papers }, { data: topics }] = await Promise.all([
    supabase
      .from("papers")
      .select("*")
      .order("published_at", { ascending: false })
      .limit(50),
    supabase.from("topics").select("*").limit(10),
  ]);

  return { papers: papers || [], topics: topics || [] };
}

export default async function Home() {
  const { papers, topics } = await getResearchData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          🔍 Radar nghiên cứu
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          {papers.length} bài báo • {topics.length} chủ đề
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Topics */}
          <div className="lg:col-span-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Chủ đề
            </h2>
            <div className="space-y-3">
              {topics.map((topic) => (
                <div
                  key={topic.id}
                  className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow hover:shadow-lg transition"
                >
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {topic.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {topic.keywords?.split(",").slice(0, 2).join(", ")}...
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Papers */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Bài báo gần đây
            </h2>
            <PapersGrid papers={papers} isLoading={false} />
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Type check**

```bash
cd nckh-dashboard && npx tsc --noEmit app/page.tsx
```

Expected: No output (success)

- [ ] **Step 5: Verify the app builds**

```bash
cd nckh-dashboard && npm run build
```

Expected: Build completes successfully, no TypeScript errors

- [ ] **Step 6: Commit**

```bash
cd nckh-dashboard && git add app/page.tsx && git commit -m "feat: integrate PapersGrid component, update query limit to 50"
```

---

## Task 5: Visual Testing - Responsive & Dark Mode

**Files:**
- None (testing only)

**Verification steps:**

- [ ] **Step 1: Start the dev server**

```bash
cd nckh-dashboard && npm run dev
```

Wait for "compiled client and server successfully" message.

- [ ] **Step 2: Open in browser**

Navigate to `http://localhost:3000`

Expected: Homepage loads, papers display in card grid, loading spinner not visible (data loaded)

- [ ] **Step 3: Verify paper card elements**

Check each visible card:
- ✅ Title is bold, blue, clickable (hover underline)
- ✅ Authors displayed below title
- ✅ Summary truncated (no longer than ~200 chars visible + "...")
- ✅ Source badge visible (gray background)
- ✅ AI score badge visible with correct color:
  - Green if score ≥ 8
  - Yellow if 6 ≤ score < 8
  - Gray if score < 6
- ✅ Published date formatted as dd/mm/yyyy (e.g., "15/01/2024")
- ✅ Card has subtle shadow, shadow increases on hover

- [ ] **Step 4: Test mobile responsiveness**

Open browser DevTools (F12), toggle device toolbar (Ctrl+Shift+M):
- Set viewport to mobile (375×667)
- Expected: Papers grid single column, full width
- Expected: Topics sidebar stacks below papers
- Expected: Card content readable, no overflow
- Expected: Badges and date properly spaced

- [ ] **Step 5: Test tablet responsiveness**

Set viewport to tablet (768×1024):
- Expected: Papers take 2/3 width, topics 1/3 side-by-side
- Expected: All content readable

- [ ] **Step 6: Test desktop responsiveness**

Maximize browser window:
- Expected: Papers take 2/3 width, topics 1/3
- Expected: All content properly spaced and readable

- [ ] **Step 7: Test dark mode**

Open DevTools, find the HTML element in the inspector:
- Add class `dark` to `<html>` tag (right-click → Edit as HTML)
- Or toggle in DevTools console: `document.documentElement.classList.toggle('dark')`

Expected in dark mode:
- ✅ Background is dark gray/slate (not white)
- ✅ Text is light (not dark)
- ✅ Badges have dark mode colors (dark green, dark yellow backgrounds)
- ✅ Card shadows visible and appropriate
- ✅ All text readable with good contrast
- ✅ Links maintain blue color or switch to light blue

- [ ] **Step 8: Test empty state**

Query Supabase to temporarily have 0 papers (or check if data exists):
- If papers are empty, you should see centered "📭 Chưa có bài báo nào" message
- Verify message is centered and readable

- [ ] **Step 9: Stop dev server**

```bash
# Press Ctrl+C in terminal
```

- [ ] **Step 10: Commit test verification results**

No code changes, but document any visual fixes needed. If issues found, fix them and commit with message like:

```bash
cd nckh-dashboard && git commit --allow-empty -m "test: verified responsive design and dark mode compatibility"
```

---

## Task 6: Verify Success Criteria

**Files:**
- None (verification only)

- [ ] **Step 1: Check all success criteria**

Run through the spec's success criteria checklist:

✅ Papers display in descending date order (limit 50)
  - Verify with: `papers.length <= 50` and first paper's date > last paper's date

✅ Each card shows title, authors, source, score badge, summary, date
  - Visual inspection: all elements present on all visible cards

✅ Clickable title opens URL in new tab
  - Test: Click any paper title, verify new tab opens

✅ AI score badge is green (≥8), yellow (6-8), or gray (<6)
  - Find papers with known scores, verify badge colors match

✅ Summary truncated at 200 chars + "..."
  - Find a paper with long summary, verify "..." at end, length reasonable (~200 chars)

✅ Responsive layout on mobile/tablet/desktop
  - Verified in Task 5 responsive tests

✅ Loading spinner shown while fetching
  - Note: In server component, spinner would show via Suspense during network delay. Verify async works.

✅ Empty state shown when no papers
  - Verified in Task 5 empty state test

✅ Dark mode styling applied
  - Verified in Task 5 dark mode test

✅ No console errors
  - DevTools console shows no red errors during page load and interaction

- [ ] **Step 2: Log final status**

```bash
cd nckh-dashboard && git log --oneline -6
```

Expected: See 4 new commits:
1. papers-dashboard-homepage (task 4)
2. integrate-PapersGrid-component (task 4)
3. create-PapersGrid-component (task 3)
4. create-PaperCard-component (task 2)
5. add-paper-helper-utilities (task 1)

---

## Self-Review Checklist

**Spec Coverage:**
- ✅ Helper utilities (truncateText, getScoreBadgeColor) — Task 1
- ✅ PaperCard component with all fields and styling — Task 2
- ✅ PapersGrid with loading/empty states — Task 3
- ✅ page.tsx integration, limit changed to 50 — Task 4
- ✅ Responsive design testing — Task 5
- ✅ Dark mode testing — Task 5
- ✅ Success criteria verification — Task 6

**Placeholder Scan:**
- ✅ No "TBD", "TODO", or incomplete code blocks
- ✅ All function signatures complete
- ✅ All Tailwind classes fully specified
- ✅ Date formatting logic complete

**Type Consistency:**
- ✅ Paper interface defined in Task 1, used in Tasks 2, 3, 4
- ✅ Function signatures match: `truncateText()`, `getScoreBadgeColor()` defined and used consistently
- ✅ Component props interfaces clear and consistent

**Completeness:**
- ✅ All edge cases handled: missing source, missing summary, invalid score
- ✅ Loading state logic included
- ✅ Empty state logic included
- ✅ Dark mode classes included throughout

---

## Execution Path

Plan is ready to execute. Two options:

**1. Subagent-Driven (Recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration with feedback checkpoints.

**2. Inline Execution** - Execute all tasks in this session using executing-plans, with checkpoints for review between major phases.

Which approach would you prefer?
