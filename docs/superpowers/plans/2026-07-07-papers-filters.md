# Papers Dashboard Filters Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a comprehensive filter bar to papers dashboard enabling multi-filter search with server-side query building and URL parameter persistence.

**Architecture:** Create 5 client-side filter components (SearchInput, TopicFilter, SourceFilter, YearFilter, ScoreSlider) wrapped in FiltersBar container. Update page.tsx to read URL searchParams and dynamically build Supabase queries. All filtering happens server-side; filters combine with AND logic internally and OR logic within each filter type.

**Tech Stack:** Next.js 15 (async server components + client components), React, Tailwind CSS, Supabase PostgreSQL client, TypeScript

## Global Constraints

- Papers limit: 50 (query limit)
- Sort order: `published_at` DESC (most recent first)
- Filter logic: All filter types AND together; within each filter, options OR
- Search: Phrase search (exact substring match using ilike)
- Responsive: Mobile-first, stack on small screens
- Dark mode: Full `dark:` Tailwind class support
- No test suite exists (manual testing only)

---

## File Structure

**Files to create:**
- `nckh-dashboard/components/papers/FiltersBar.tsx` — Form container (client)
- `nckh-dashboard/components/filters/SearchInput.tsx` — Search input component (client)
- `nckh-dashboard/components/filters/TopicFilter.tsx` — Topic multi-select dropdown (client)
- `nckh-dashboard/components/filters/SourceFilter.tsx` — Source multi-select dropdown (client)
- `nckh-dashboard/components/filters/YearFilter.tsx` — Year multi-select dropdown (client)
- `nckh-dashboard/components/filters/ScoreSlider.tsx` — AI score range slider (client)
- `nckh-dashboard/lib/filters.ts` — Query builder utility (server)

**Files to modify:**
- `nckh-dashboard/app/page.tsx` — Read searchParams, call buildFilterQuery(), pass filters to FiltersBar

---

## Task 1: Create Filter Query Builder Utility

**Files:**
- Create: `nckh-dashboard/lib/filters.ts`

**Interfaces:**
- Produces: `buildFilterQuery(supabase, searchParams)` function that returns filtered query

- [ ] **Step 1: Create filters utility file**

```bash
touch nckh-dashboard/lib/filters.ts
```

- [ ] **Step 2: Write buildFilterQuery function**

```typescript
// nckh-dashboard/lib/filters.ts

import { SupabaseClient } from "@supabase/supabase-js";

export interface SearchParams {
  q?: string;
  topics?: string;
  sources?: string;
  year?: string;
  score?: string;
}

export function buildFilterQuery(
  supabase: SupabaseClient,
  searchParams: SearchParams
) {
  let query = supabase.from("papers").select("*");

  // Extract and normalize params
  const q = searchParams.q?.trim() || "";
  const topics = searchParams.topics?.trim() || "";
  const sources = searchParams.sources?.trim() || "";
  const year = searchParams.year?.trim() || "";
  const score = searchParams.score?.trim() || "";

  // Full-text search on title + ai_summary_vi (phrase search)
  if (q) {
    const searchTerm = `%${q}%`;
    query = query.or(`title.ilike.${searchTerm},ai_summary_vi.ilike.${searchTerm}`);
  }

  // Multi-select Topics (OR logic)
  if (topics) {
    const topicIds = topics
      .split(",")
      .map((t) => Number(t.trim()))
      .filter((id) => !isNaN(id) && id > 0);
    if (topicIds.length > 0) {
      query = query.in("topic_id", topicIds);
    }
  }

  // Multi-select Sources (OR logic)
  if (sources) {
    const sourceList = sources
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    if (sourceList.length > 0) {
      query = query.in("source", sourceList);
    }
  }

  // Multi-select Years (via date range - assumes published_at is ISO date)
  if (year) {
    const years = year
      .split(",")
      .map((y) => Number(y.trim()))
      .filter((y) => !isNaN(y) && y > 1900 && y <= new Date().getFullYear());
    
    if (years.length > 0) {
      const minYear = Math.min(...years);
      const maxYear = Math.max(...years) + 1;
      query = query
        .gte("published_at", `${minYear}-01-01`)
        .lt("published_at", `${maxYear}-01-01`);
    }
  }

  // AI Score minimum threshold
  if (score) {
    const scoreNum = Number(score);
    if (!isNaN(scoreNum) && scoreNum >= 0 && scoreNum <= 10) {
      query = query.gte("ai_score", scoreNum);
    }
  }

  // Order and limit
  query = query.order("published_at", { ascending: false }).limit(50);

  return query;
}
```

- [ ] **Step 3: Type-check**

```bash
cd nckh-dashboard && npx tsc --noEmit lib/filters.ts
```

Expected: No errors

- [ ] **Step 4: Commit**

```bash
cd nckh-dashboard && git add lib/filters.ts && git commit -m "feat: add filter query builder utility"
```

---

## Task 2: Create SearchInput Component

**Files:**
- Create: `nckh-dashboard/components/filters/SearchInput.tsx`

**Interfaces:**
- Consumes: `defaultValue?: string` (prop)
- Produces: HTML input element with `name="q"` attribute

- [ ] **Step 1: Create filters directory**

```bash
mkdir -p nckh-dashboard/components/filters
```

- [ ] **Step 2: Write SearchInput component**

```typescript
// nckh-dashboard/components/filters/SearchInput.tsx

'use client';

export default function SearchInput({ 
  defaultValue = "" 
}: { 
  defaultValue?: string;
}) {
  return (
    <input
      type="text"
      name="q"
      defaultValue={defaultValue}
      placeholder="Tìm kiếm title, abstract..."
      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 w-full md:w-64"
    />
  );
}
```

- [ ] **Step 3: Type-check**

```bash
cd nckh-dashboard && npx tsc --noEmit components/filters/SearchInput.tsx
```

Expected: No errors

- [ ] **Step 4: Commit**

```bash
cd nckh-dashboard && git add components/filters/SearchInput.tsx && git commit -m "feat: add SearchInput filter component"
```

---

## Task 3: Create Topic Filter Component

**Files:**
- Create: `nckh-dashboard/components/filters/TopicFilter.tsx`

**Interfaces:**
- Consumes: `topics: Topic[]` (from server), `selectedIds?: string` (from URL params)
- Produces: HTML select element with `name="topics"` attribute

- [ ] **Step 1: Write TopicFilter component**

```typescript
// nckh-dashboard/components/filters/TopicFilter.tsx

'use client';

interface Topic {
  id: number;
  name: string;
}

export default function TopicFilter({ 
  topics, 
  selectedIds = "" 
}: { 
  topics: Topic[];
  selectedIds?: string;
}) {
  const selected = selectedIds
    .split(",")
    .filter((id) => id.trim().length > 0);

  return (
    <select
      name="topics"
      multiple
      defaultValue={selected}
      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-white w-full md:w-40"
    >
      <option value="">-- Chủ đề --</option>
      {topics.map((topic) => (
        <option key={topic.id} value={topic.id}>
          {topic.name}
        </option>
      ))}
    </select>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
cd nckh-dashboard && npx tsc --noEmit components/filters/TopicFilter.tsx
```

Expected: No errors

- [ ] **Step 3: Commit**

```bash
cd nckh-dashboard && git add components/filters/TopicFilter.tsx && git commit -m "feat: add TopicFilter multi-select component"
```

---

## Task 4: Create Source Filter Component

**Files:**
- Create: `nckh-dashboard/components/filters/SourceFilter.tsx`

**Interfaces:**
- Consumes: `selectedSources?: string` (from URL params)
- Produces: HTML select element with `name="sources"` attribute

- [ ] **Step 1: Write SourceFilter component**

```typescript
// nckh-dashboard/components/filters/SourceFilter.tsx

'use client';

// Common source options (can expand based on actual data)
const SOURCE_OPTIONS = [
  "arXiv",
  "Nature",
  "IEEE",
  "ACM",
  "Science",
  "JMLR",
  "Other"
];

export default function SourceFilter({ 
  selectedSources = "" 
}: { 
  selectedSources?: string;
}) {
  const selected = selectedSources
    .split(",")
    .filter((s) => s.trim().length > 0);

  return (
    <select
      name="sources"
      multiple
      defaultValue={selected}
      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-white w-full md:w-40"
    >
      <option value="">-- Nguồn --</option>
      {SOURCE_OPTIONS.map((source) => (
        <option key={source} value={source}>
          {source}
        </option>
      ))}
    </select>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
cd nckh-dashboard && npx tsc --noEmit components/filters/SourceFilter.tsx
```

Expected: No errors

- [ ] **Step 3: Commit**

```bash
cd nckh-dashboard && git add components/filters/SourceFilter.tsx && git commit -m "feat: add SourceFilter multi-select component"
```

---

## Task 5: Create Year Filter Component

**Files:**
- Create: `nckh-dashboard/components/filters/YearFilter.tsx`

**Interfaces:**
- Consumes: `selectedYears?: string` (from URL params)
- Produces: HTML select element with `name="year"` attribute

- [ ] **Step 1: Write YearFilter component**

```typescript
// nckh-dashboard/components/filters/YearFilter.tsx

'use client';

export default function YearFilter({ 
  selectedYears = "" 
}: { 
  selectedYears?: string;
}) {
  // Generate year options: current year down to 2015
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2014 }, (_, i) => 
    currentYear - i
  );

  const selected = selectedYears
    .split(",")
    .filter((y) => y.trim().length > 0);

  return (
    <select
      name="year"
      multiple
      defaultValue={selected}
      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-white w-full md:w-40"
    >
      <option value="">-- Năm --</option>
      {years.map((year) => (
        <option key={year} value={year}>
          {year}
        </option>
      ))}
    </select>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
cd nckh-dashboard && npx tsc --noEmit components/filters/YearFilter.tsx
```

Expected: No errors

- [ ] **Step 3: Commit**

```bash
cd nckh-dashboard && git add components/filters/YearFilter.tsx && git commit -m "feat: add YearFilter multi-select component"
```

---

## Task 6: Create Score Slider Component

**Files:**
- Create: `nckh-dashboard/components/filters/ScoreSlider.tsx`

**Interfaces:**
- Consumes: `defaultValue?: string` (from URL params, default "0")
- Produces: HTML range input element with `name="score"` attribute

- [ ] **Step 1: Write ScoreSlider component**

```typescript
// nckh-dashboard/components/filters/ScoreSlider.tsx

'use client';

import { useState } from 'react';

export default function ScoreSlider({ 
  defaultValue = "0" 
}: { 
  defaultValue?: string;
}) {
  const [value, setValue] = useState(defaultValue);

  return (
    <label className="flex items-center gap-2 whitespace-nowrap">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Điểm AI ≥
      </span>
      <input
        type="range"
        name="score"
        min="0"
        max="10"
        step="0.5"
        defaultValue={defaultValue}
        onChange={(e) => setValue(e.target.value)}
        className="w-24 cursor-pointer"
      />
      <span className="text-sm font-semibold text-gray-900 dark:text-white min-w-8">
        {value}
      </span>
    </label>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
cd nckh-dashboard && npx tsc --noEmit components/filters/ScoreSlider.tsx
```

Expected: No errors

- [ ] **Step 3: Commit**

```bash
cd nckh-dashboard && git add components/filters/ScoreSlider.tsx && git commit -m "feat: add ScoreSlider filter component"
```

---

## Task 7: Create FiltersBar Container Component

**Files:**
- Create: `nckh-dashboard/components/papers/FiltersBar.tsx`

**Interfaces:**
- Consumes: `topics: Topic[]`, `currentFilters: SearchParams` (from page.tsx)
- Produces: `<form>` element containing all filter components

- [ ] **Step 1: Write FiltersBar component**

```typescript
// nckh-dashboard/components/papers/FiltersBar.tsx

'use client';

import SearchInput from '@/components/filters/SearchInput';
import TopicFilter from '@/components/filters/TopicFilter';
import SourceFilter from '@/components/filters/SourceFilter';
import YearFilter from '@/components/filters/YearFilter';
import ScoreSlider from '@/components/filters/ScoreSlider';

interface Topic {
  id: number;
  name: string;
}

interface SearchParams {
  q?: string;
  topics?: string;
  sources?: string;
  year?: string;
  score?: string;
}

export default function FiltersBar({ 
  topics, 
  currentFilters 
}: { 
  topics: Topic[];
  currentFilters: SearchParams;
}) {
  const handleClearFilters = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    
    // Reset all inputs to default values
    const form = e.currentTarget.closest('form');
    if (form) {
      const inputs = form.querySelectorAll('input, select');
      inputs.forEach((input) => {
        if (input instanceof HTMLInputElement) {
          if (input.type === 'text' || input.type === 'range') {
            input.value = input.type === 'range' ? '0' : '';
          }
        } else if (input instanceof HTMLSelectElement) {
          input.value = '';
        }
      });
      
      // Submit form with empty filters
      form.submit();
    }
  };

  return (
    <form method="GET" className="flex flex-wrap gap-4 mb-6 p-4 bg-white dark:bg-slate-800 rounded-lg shadow">
      <SearchInput defaultValue={currentFilters.q} />
      <TopicFilter topics={topics} selectedIds={currentFilters.topics} />
      <SourceFilter selectedSources={currentFilters.sources} />
      <YearFilter selectedYears={currentFilters.year} />
      <ScoreSlider defaultValue={currentFilters.score} />
      
      <button
        type="submit"
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded font-medium transition"
      >
        Lọc
      </button>
      
      <button
        type="button"
        onClick={handleClearFilters}
        className="px-4 py-2 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded font-medium transition"
      >
        Xoá
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
cd nckh-dashboard && npx tsc --noEmit components/papers/FiltersBar.tsx
```

Expected: No errors

- [ ] **Step 3: Commit**

```bash
cd nckh-dashboard && git add components/papers/FiltersBar.tsx && git commit -m "feat: add FiltersBar container component"
```

---

## Task 8: Update page.tsx to Integrate Filters

**Files:**
- Modify: `nckh-dashboard/app/page.tsx`

**Interfaces:**
- Consumes: `buildFilterQuery()` from `lib/filters.ts`, all filter components
- Produces: Modified getResearchData() that accepts searchParams

- [ ] **Step 1: Read current page.tsx and understand structure**

```bash
cd nckh-dashboard && head -60 app/page.tsx
```

- [ ] **Step 2: Update imports and getResearchData function**

Replace the entire `app/page.tsx` with:

```typescript
// nckh-dashboard/app/page.tsx

import { supabase } from "@/lib/supabase";
import { buildFilterQuery, type SearchParams } from "@/lib/filters";
import PapersGrid from "@/components/papers/PapersGrid";
import FiltersBar from "@/components/papers/FiltersBar";

async function getResearchData(searchParams: Record<string, string | string[]>) {
  // Convert searchParams to our SearchParams interface
  const params: SearchParams = {
    q: Array.isArray(searchParams.q) ? searchParams.q[0] : searchParams.q,
    topics: Array.isArray(searchParams.topics) ? searchParams.topics[0] : searchParams.topics,
    sources: Array.isArray(searchParams.sources) ? searchParams.sources[0] : searchParams.sources,
    year: Array.isArray(searchParams.year) ? searchParams.year[0] : searchParams.year,
    score: Array.isArray(searchParams.score) ? searchParams.score[0] : searchParams.score,
  };

  // Build filtered query
  const query = buildFilterQuery(supabase, params);
  const { data: papers } = await query;

  // Fetch topics (always fetch, no filter)
  const { data: topics } = await supabase.from("topics").select("*").limit(10);

  return { 
    papers: papers || [], 
    topics: topics || [],
    currentFilters: params,
  };
}

export default async function Home({ 
  searchParams 
}: { 
  searchParams: Record<string, string | string[]>;
}) {
  const { papers, topics, currentFilters } = await getResearchData(searchParams);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          🔍 Radar nghiên cứu
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          {papers.length} bài báo • {topics.length} chủ đề
        </p>

        {/* Filters Bar */}
        <FiltersBar topics={topics} currentFilters={currentFilters} />

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

- [ ] **Step 3: Type-check**

```bash
cd nckh-dashboard && npx tsc --noEmit app/page.tsx
```

Expected: No errors

- [ ] **Step 4: Build and verify**

```bash
cd nckh-dashboard && npm run build
```

Expected: Build completes successfully, no errors

- [ ] **Step 5: Commit**

```bash
cd nckh-dashboard && git add app/page.tsx && git commit -m "feat: integrate filters into page.tsx, update query builder"
```

---

## Task 9: Visual Testing & Responsive Design

**Files:**
- None (testing only)

- [ ] **Step 1: Start dev server**

```bash
cd nckh-dashboard && npm run dev
```

Wait for "compiled successfully" message.

- [ ] **Step 2: Open browser and verify filters render**

Navigate to `http://localhost:3000`

Expected:
- Filter bar visible at top
- All 5 filter components render: search input, topic dropdown, source dropdown, year dropdown, score slider
- Filter and Clear buttons visible
- Filters have correct styling and dark mode support

- [ ] **Step 3: Test each filter individually**

**Search:**
- Type "machine" → click Filter → URL updates with `?q=machine`, papers filtered
- Type "learning" → click Filter → URL shows `?q=learning`
- Clear search field → click Clear → URL resets, all papers return

**Topics:**
- Select topic → click Filter → URL shows `?topics=1` (or corresponding ID)
- Select multiple topics (hold Ctrl/Cmd) → click Filter → URL shows `?topics=1,2,3`
- Deselect all → click Filter → URL resets

**Sources:**
- Select "arXiv" → click Filter → URL shows `?sources=arXiv`
- Select multiple sources → click Filter → URL combines them
- Deselect all → click Clear

**Years:**
- Select "2024" → click Filter → URL shows `?year=2024`
- Select multiple years → click Filter → URL combines
- Deselect all → clear

**Score Slider:**
- Drag slider to 6 → click Filter → URL shows `?score=6`, papers with score >= 6 shown
- Drag to 8 → click Filter → URL shows `?score=8`
- Drag to 0 → all papers shown

- [ ] **Step 4: Test combined filters**

Select topic + source + score + search term → click Filter
- URL shows: `?q=machine&topics=1,2&sources=arXiv&score=7`
- Papers filtered by ALL conditions (AND logic)
- Count decreases

- [ ] **Step 5: Test URL parameter persistence**

- Copy filtered URL (e.g., `?q=learning&topics=1&score=6`)
- Open in new tab
- Expected: Filters restored from URL, papers filtered correctly

- [ ] **Step 6: Test responsive design**

**Mobile (375×667):**
- DevTools: Toggle device toolbar, set to mobile
- Filters stack vertically
- All inputs readable
- Buttons accessible

**Tablet (768×1024):**
- Filters wrap to 2-3 per row
- Readable, good spacing

**Desktop:**
- All filters in one row (or wrap naturally)
- Proper gap and alignment

- [ ] **Step 7: Test dark mode**

- DevTools console: `document.documentElement.classList.toggle('dark')`
- All filter inputs readable
- Text colors contrast good
- Buttons visible

- [ ] **Step 8: Test edge cases**

**Invalid params:**
- Visit `?score=abc` → score ignored, defaults to 0
- Visit `?topics=999` → invalid topic ignored, all topics shown

**Empty results:**
- Set filters to combination that matches no papers
- Expected: Empty state shows "📭 Chưa có bài báo nào"

**Special characters in search:**
- Search "@machine" or "C++" → ilike handles them
- Results should work

- [ ] **Step 9: Stop dev server**

```bash
# Press Ctrl+C
```

- [ ] **Step 10: Create empty commit for testing verification**

```bash
cd nckh-dashboard && git commit --allow-empty -m "test: verified filters responsive design and all functionality"
```

---

## Task 10: Success Criteria Verification

**Files:**
- None (verification only)

- [ ] **Step 1: Verify all success criteria**

Check against spec's success criteria:

✅ Search filters papers by title + abstract (phrase)
- Find papers with "machine learning" in title or abstract
- Search works case-insensitive

✅ Topic filter multi-select works (OR logic)
- Select 2+ topics
- Papers from ANY selected topic shown

✅ Source filter multi-select works (OR logic)
- Select 2+ sources
- Papers from ANY selected source shown

✅ Year filter multi-select works (OR logic)
- Select 2+ years
- Papers from ANY selected year shown

✅ Score slider filters by minimum (≥)
- Slider to 6 → only papers ≥ 6 shown
- Slider to 8 → only papers ≥ 8 shown
- Value display updates

✅ All filters combine with AND logic
- Select topic + source + score + search
- Papers matching ALL conditions shown

✅ URL params reflect selected filters
- Each filter changes URL
- Parameters combine correctly: `?q=X&topics=1,2&sources=arxiv&year=2024&score=7`

✅ Clear button resets all filters
- Click Clear
- All inputs reset
- URL params cleared
- All papers shown

✅ Form submission updates URL + re-renders
- Click Filter button
- URL updates
- Page re-renders
- Papers list updates
- No manual page reload needed

✅ Responsive on mobile/tablet/desktop
- Verified in Task 9

✅ Dark mode fully supported
- All filters readable in dark mode
- Verified in Task 9

✅ No console errors
- DevTools console clean during testing

✅ Empty results show empty state
- When no papers match filters
- Shows "📭 Chưa có bài báo nào"

- [ ] **Step 2: Document any issues**

If any criteria fail:
- Note which filter failed
- Describe expected vs actual behavior
- Identify root cause

If all pass:
- All criteria met, feature complete

- [ ] **Step 3: Final commit**

```bash
cd nckh-dashboard && git commit --allow-empty -m "test: verified all success criteria passed"
```

---

## Self-Review

**Spec Coverage:**
- ✅ Search with phrase matching — Task 1 (query builder), Task 2 (SearchInput)
- ✅ Topic multi-select filter — Task 1, Task 3
- ✅ Source multi-select filter — Task 1, Task 4
- ✅ Year multi-select filter — Task 1, Task 5
- ✅ Score slider (minimum) — Task 1, Task 6
- ✅ FiltersBar container — Task 7
- ✅ page.tsx integration — Task 8
- ✅ URL parameter handling — Task 1, Task 8
- ✅ Server-side filtering — Task 1, Task 8
- ✅ AND/OR logic — Task 1
- ✅ Responsive design — Task 9
- ✅ Dark mode — All tasks include dark: classes, Task 9 verification
- ✅ Testing — Task 9, Task 10

**Placeholder Scan:**
- ✅ No "TBD", "TODO", or incomplete sections
- ✅ All code complete and concrete
- ✅ All commands explicit with expected output
- ✅ No "handle edge cases" without specifics

**Type Consistency:**
- ✅ `SearchParams` interface defined in Task 1, used consistently
- ✅ `buildFilterQuery()` signature consistent
- ✅ Component props match across tasks
- ✅ Form input names match parameter keys

**Completeness:**
- ✅ Error handling covered (invalid params, empty results)
- ✅ Responsive design specified for all breakpoints
- ✅ Dark mode classes in every component
- ✅ Clear button logic fully implemented
- ✅ Form submission handling detailed

---

## Execution Path

Plan is ready to execute. Two options:

**1. Subagent-Driven (Recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration with checkpoints

**2. Inline Execution** - Execute all tasks in this session using executing-plans, batch with checkpoints

Which approach would you prefer?
