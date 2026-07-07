# Papers Dashboard Filters Design

**Date:** 2026-07-07  
**Author:** Claude Code  
**Status:** In Design Review

---

## Overview

Add a comprehensive filter bar to the papers dashboard homepage, enabling users to filter papers by:
- Full-text search on title + abstract (phrase search)
- Multiple topics (multi-select dropdown)
- Multiple sources (multi-select dropdown)
- Multiple years (multi-select dropdown)
- AI score minimum (slider 0-10)

All filters combine with AND logic and update the papers list via server-side filtering with URL query parameters.

---

## Requirements

### Functional
- **Search:** Full-text search on paper `title` and `ai_summary_vi` columns using phrase matching (exact substring)
  - Use Supabase `ilike` operator (or `fts` if available)
  - Case-insensitive
- **Topic Filter:** Multi-select dropdown from `topics` table
  - Allow multiple selection
  - Combine with OR logic (papers matching ANY selected topic)
- **Source Filter:** Multi-select dropdown of paper sources (arxiv, nature, etc.)
  - Allow multiple selection
  - Combine with OR logic
- **Year Filter:** Multi-select dropdown of years extracted from `published_at`
  - Allow multiple selection
  - Combine with OR logic (papers from ANY selected year)
- **Score Slider:** Single slider (0-10, step 0.5) for minimum AI score threshold
  - Show current value
  - Filter papers where `ai_score >= selected_value`
- **Clear Button:** Reset all filters to defaults
  - Clears search input, resets dropdowns, resets slider
  - Submits form with empty params
- **URL Parameters:** All filter state saved in URL query params
  - Format: `?q=search_term&topics=1,2,3&sources=arxiv,nature&year=2024,2023&score=7`
  - Enables bookmarking/sharing filtered views
- **Server-Side Filtering:** Supabase query built based on URL params
  - All filtering happens on server (page.tsx reads searchParams)
  - Papers sorted by `published_at` DESC, limited to 50
  - Invalid params handled gracefully (ignored or default to 0)

### Non-Functional
- Responsive design (mobile-first, stack on small screens)
- Dark mode support (all filter components have dark: variants)
- No full-page reload (form submission → URL update → server fetch)
- Filters combine with AND logic (topic OR source OR year, but all groups AND together)

---

## Architecture

### File Structure
```
nckh-dashboard/
├── app/
│   ├── page.tsx                    (MODIFIED - server component, read searchParams)
│   └── layout.tsx                  (existing)
├── components/
│   ├── papers/
│   │   ├── PaperCard.tsx           (existing, unchanged)
│   │   ├── PapersGrid.tsx          (existing, unchanged)
│   │   └── FiltersBar.tsx          (NEW - client component, form container)
│   └── filters/
│       ├── SearchInput.tsx         (NEW - client component)
│       ├── TopicFilter.tsx         (NEW - client component, multi-select)
│       ├── SourceFilter.tsx        (NEW - client component, multi-select)
│       ├── YearFilter.tsx          (NEW - client component, multi-select)
│       └── ScoreSlider.tsx         (NEW - client component, range input)
└── lib/
    └── supabase.ts                 (existing, unchanged)
```

### Component Architecture

#### **page.tsx** (Server Component - Modified)

**Changes:**
- Add `searchParams` parameter to component
- Modify `getResearchData()` to accept searchParams object
- Build Supabase query chain based on filter values
- Pass filtered papers to PapersGrid

**New Signature:**
```typescript
export default async function Home({ 
  searchParams 
}: { 
  searchParams: Record<string, string | string[]> 
}) {
  const { papers, topics } = await getResearchData(searchParams);
  // ...
}
```

**Search Params Format:**
```
q: string (search term)
topics: string (comma-separated topic IDs: "1,2,3")
sources: string (comma-separated sources: "arxiv,nature")
year: string (comma-separated years: "2024,2023")
score: string (minimum score: "6" or "7.5")
```

#### **FiltersBar.tsx** (Client Component - New)

**Purpose:** Container component for all filter controls, handles form submission

**Props:**
```typescript
interface FiltersBarProps {
  topics: Topic[];
  currentFilters: {
    q?: string;
    topics?: string;
    sources?: string;
    year?: string;
    score?: string;
  };
}
```

**Structure:**
```tsx
'use client';

export default function FiltersBar({ topics, currentFilters }: FiltersBarProps) {
  return (
    <form method="GET" className="flex flex-wrap gap-4 mb-6 p-4 bg-white dark:bg-slate-800 rounded-lg">
      <SearchInput defaultValue={currentFilters.q} />
      <TopicFilter topics={topics} selectedIds={currentFilters.topics} />
      <SourceFilter selectedSources={currentFilters.sources} />
      <YearFilter selectedYears={currentFilters.year} />
      <ScoreSlider defaultValue={currentFilters.score} />
      
      <button 
        type="submit" 
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 text-white rounded"
      >
        Lọc
      </button>
      
      <button 
        type="button" 
        onClick={handleClear}
        className="px-4 py-2 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 text-gray-900 dark:text-white rounded"
      >
        Xoá
      </button>
    </form>
  );
}
```

**Behavior:**
- Form uses GET method (params in URL)
- Input names match searchParams keys: `name="q"`, `name="topics"`, etc.
- Form submission → URL params update → page re-render
- Clear button resets all inputs and submits empty form

#### **SearchInput.tsx** (Client Component - New)

**Props:**
```typescript
interface SearchInputProps {
  defaultValue?: string;
}
```

**Render:**
```tsx
<input
  type="text"
  name="q"
  defaultValue={defaultValue || ""}
  placeholder="Tìm kiếm title, abstract..."
  className="px-3 py-2 border rounded dark:bg-slate-700 dark:text-white"
/>
```

#### **TopicFilter.tsx, SourceFilter.tsx, YearFilter.tsx** (Client Components - New)

**Pattern for TopicFilter:**
```typescript
interface TopicFilterProps {
  topics: Topic[];
  selectedIds?: string;
}

export default function TopicFilter({ topics, selectedIds = "" }: TopicFilterProps) {
  const selected = selectedIds.split(",").filter(Boolean);
  
  return (
    <select
      name="topics"
      multiple
      defaultValue={selected}
      className="px-3 py-2 border rounded dark:bg-slate-700 dark:text-white"
    >
      <option value="">-- Chủ đề --</option>
      {topics.map(t => (
        <option key={t.id} value={t.id}>{t.name}</option>
      ))}
    </select>
  );
}
```

**SourceFilter:**
- Multi-select dropdown
- Options: hardcoded common sources (arxiv, nature, ieee, etc.) or fetch from papers
- `name="sources"`, format: `"arxiv,nature"`

**YearFilter:**
- Multi-select dropdown
- Options: Extract years from papers (e.g., 2024, 2023, 2022) or use range
- `name="year"`, format: `"2024,2023"`

#### **ScoreSlider.tsx** (Client Component - New)

**Props:**
```typescript
interface ScoreSliderProps {
  defaultValue?: string;
}
```

**Render:**
```tsx
'use client';
const [value, setValue] = useState(defaultValue || "0");

return (
  <label className="flex items-center gap-2">
    <span className="text-sm">Điểm AI ≥</span>
    <input
      type="range"
      name="score"
      min="0"
      max="10"
      step="0.5"
      value={value}
      onChange={e => setValue(e.target.value)}
      className="w-24"
    />
    <span className="text-sm font-semibold">{value}</span>
  </label>
);
```

---

## Data Flow

```
FiltersBar (client form)
    ↓ (form submit)
URL params update (q, topics, sources, year, score)
    ↓ (page re-render)
page.tsx (reads searchParams)
    ↓
getResearchData(searchParams)
    ↓
buildQuery() → supabase.from("papers")
  .or(title ilike q OR ai_summary_vi ilike q)  [if q]
  .in(topic_id, [topics])                       [if topics]
  .in(source, [sources])                        [if sources]
  .gte(ai_score, score)                         [if score]
  [year filter via date range]
  .order("published_at", ascending: false)
  .limit(50)
    ↓
{ papers }
    ↓
PapersGrid (displays filtered results)
```

---

## Server-Side Query Building

**getResearchData() Implementation:**

```typescript
async function getResearchData(searchParams: Record<string, string | string[]>) {
  let query = supabase.from("papers").select("*");

  // Extract params
  const q = Array.isArray(searchParams.q) ? searchParams.q[0] : searchParams.q;
  const topics = Array.isArray(searchParams.topics) ? searchParams.topics[0] : searchParams.topics;
  const sources = Array.isArray(searchParams.sources) ? searchParams.sources[0] : searchParams.sources;
  const year = Array.isArray(searchParams.year) ? searchParams.year[0] : searchParams.year;
  const score = Array.isArray(searchParams.score) ? searchParams.score[0] : searchParams.score;

  // Search (phrase search on title + summary)
  if (q && q.trim()) {
    const searchTerm = `%${q.trim()}%`;
    query = query.or(`title.ilike.${searchTerm},ai_summary_vi.ilike.${searchTerm}`);
  }

  // Topics (multi-select OR)
  if (topics && topics.trim()) {
    const topicIds = topics.split(",").map(t => Number(t.trim())).filter(Boolean);
    if (topicIds.length > 0) {
      query = query.in("topic_id", topicIds);
    }
  }

  // Sources (multi-select OR)
  if (sources && sources.trim()) {
    const sourceList = sources.split(",").map(s => s.trim()).filter(Boolean);
    if (sourceList.length > 0) {
      query = query.in("source", sourceList);
    }
  }

  // Years (multi-select OR via date range)
  if (year && year.trim()) {
    const years = year.split(",").map(y => Number(y.trim())).filter(Boolean);
    if (years.length > 0) {
      const minYear = Math.min(...years);
      const maxYear = Math.max(...years);
      // Simpler approach: filter by year range, then in component or via RPC
      // For now, assume papers have year field or extract from published_at
      // This may need adjustment based on actual schema
    }
  }

  // AI Score (minimum)
  if (score && score.trim()) {
    const scoreNum = Number(score.trim());
    if (!isNaN(scoreNum) && scoreNum >= 0 && scoreNum <= 10) {
      query = query.gte("ai_score", scoreNum);
    }
  }

  // Order and limit
  query = query.order("published_at", { ascending: false }).limit(50);

  const { data: papers } = await query;
  return { papers: papers || [] };
}
```

**Error Handling:**
- Invalid numbers (score, topic IDs) → treated as 0 or ignored
- Empty values → filter not applied
- Duplicate IDs (e.g., "1,1,2") → Supabase deduplicates automatically
- Missing columns → handled by Supabase (returns null or error)

---

## Styling & Responsive Design

### Tailwind Classes

**Filter Bar Container:**
```
flex flex-wrap gap-4 mb-6 p-4 bg-white dark:bg-slate-800 rounded-lg
```

**Input/Select Elements:**
```
px-3 py-2 border border-gray-300 dark:border-gray-600 rounded
bg-white dark:bg-slate-700
text-gray-900 dark:text-white
placeholder-gray-500 dark:placeholder-gray-400
```

**Buttons:**
- Filter: `px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded`
- Clear: `px-4 py-2 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded`

### Responsive Breakpoints

| Breakpoint | Layout |
|---|---|
| Mobile (default) | Flex wrap, full-width inputs (`w-full`) |
| Tablet (md:) | 2-3 filters per row, inputs `md:w-40` |
| Desktop (lg:) | All filters in one row, consistent spacing |

**SearchInput:** `w-full md:w-64` (takes available space on mobile, fixed on desktop)
**Dropdowns:** `w-full md:w-40`
**Slider:** `w-full md:w-48`

### Dark Mode

All elements have `dark:` variants:
- Backgrounds: `dark:bg-slate-700`, `dark:bg-slate-800`
- Text: `dark:text-white`, `dark:text-gray-400`
- Borders: `dark:border-gray-600`
- Buttons: `dark:bg-blue-500`, `dark:bg-gray-600`

---

## URL Parameters & Bookmarking

**Example URLs:**

```
/                                          (no filters)
/?q=machine                                (search only)
/?topics=1,2,3                             (multiple topics)
/?sources=arxiv,nature                     (multiple sources)
/?year=2024,2023                           (multiple years)
/?score=7                                  (score minimum)
/?q=learning&topics=1,2&sources=arxiv&score=6   (combined)
```

**Preserves State:**
- User can bookmark filtered URL
- User can share link with filters pre-applied
- Browser back button returns to previous filter state

---

## Error Handling & Edge Cases

1. **Invalid Numbers:** Non-numeric score/topic IDs → ignored or default to 0
2. **Empty Params:** `?q=` or `?topics=` → treated as no filter
3. **Duplicates:** `?topics=1,1,2` → Supabase deduplicates
4. **Missing Data:** Source/year options fetched at render time; if missing, exclude from dropdown
5. **Empty Results:** Show PapersGrid empty state (from prior design)
6. **Long URLs:** Browsers handle query strings >2000 chars without issue
7. **Special Characters in Search:** `ilike` escapes automatically; user enters raw text

---

## Testing Strategy

**Manual Testing Checklist:**

1. **Search Functionality**
   - [ ] Search "machine learning" → papers with those terms appear
   - [ ] Search "xyz123" → empty result (no matching papers)
   - [ ] Clear search → all papers return
   - [ ] Special characters handled ("@", "+", etc.)

2. **Topic Filter**
   - [ ] Select 1 topic → papers from that topic
   - [ ] Select multiple topics → papers from any topic (OR)
   - [ ] Deselect all → all topics included

3. **Source Filter**
   - [ ] Select "arxiv" → only arxiv papers
   - [ ] Select multiple → papers from all selected sources

4. **Year Filter**
   - [ ] Select 2024 → only 2024 papers
   - [ ] Select multiple years → papers from all years

5. **Score Slider**
   - [ ] Slide to 6 → papers ≥ 6 only
   - [ ] Slide to 0 → all papers
   - [ ] Slider updates value display

6. **Combined Filters**
   - [ ] Select topic + source + score + search → all apply together
   - [ ] URL params correct: `?topics=1,2&sources=arxiv&score=7&q=learning`

7. **Clear Button**
   - [ ] Clears all filters
   - [ ] Returns to unfiltered view

8. **Responsive**
   - [ ] Mobile (375×667): Filters stack, readable
   - [ ] Tablet (768×1024): 2-3 filters per row
   - [ ] Desktop: All in one row

9. **Dark Mode**
   - [ ] All inputs readable in dark mode
   - [ ] Buttons visible and clickable

10. **Bookmarking**
    - [ ] Copy filtered URL and paste in new tab → same filters apply
    - [ ] Browser back/forward works with filters

---

## Success Criteria

✅ Search filters papers by title + abstract (phrase)  
✅ Topic filter multi-select works (OR logic)  
✅ Source filter multi-select works (OR logic)  
✅ Year filter multi-select works (OR logic)  
✅ Score slider filters by minimum (≥)  
✅ All filters combine with AND logic  
✅ URL params reflect selected filters  
✅ Clear button resets all filters  
✅ Form submission updates URL + re-renders  
✅ Responsive on mobile/tablet/desktop  
✅ Dark mode fully supported  
✅ No console errors  
✅ Empty results show empty state  

---

## Global Constraints

- Papers limit: 50 (from prior design)
- Sort order: `published_at` DESC (most recent first)
- Filter logic: All filters AND together; within each filter, options OR
- Response time: <1s for typical queries (server-side filtering)
- No client-side JavaScript filtering (all server-side)
- URL params are the source of truth for filter state

---

## Appendix: Schema Assumptions

**Papers Table:**
```
id (UUID)
title (text)
authors (text)
url (text)
source (text)          — e.g., "arxiv", "nature", "ieee"
ai_score (numeric)     — 0-10 scale
ai_summary_vi (text)   — Vietnamese summary for FTS
published_at (date)    — ISO 8601 date
topic_id (int)         — FK to topics, or many-to-many
```

**Topics Table:**
```
id (int)
name (text)
keywords (text)
```

*Note: If schema differs (e.g., many-to-many topics, missing columns), adjust queries accordingly.*
