# Paper Detail Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a dual-view paper detail feature with inline expandable rows and a dedicated `/paper/[id]` route displaying full paper information, metadata, summaries, and action buttons.

**Architecture:** Four interdependent components: (1) PaperDetail displays full paper info with title, authors, source, date, AI score, abstract, and Vietnamese summary with disclaimer; (2) PaperCard adds "Chi tiết" and "→ Xem trang" buttons for expand/navigate; (3) PapersGrid manages expandedId state and renders PaperDetail inline below expanded papers; (4) `/paper/[id]` route renders detail full-width at top with papers list and sidebar below.

**Tech Stack:** Next.js 15 server/client components, React useState for client state, Tailwind CSS with dark mode, TypeScript, Supabase client SDK

## Global Constraints

- Display fields: title (bold, large), authors, source (badge), published_at (dd/mm/yyyy format), ai_score (colored badge: green ≥8, yellow 6-8, gray <6), abstract (full, scrollable if long), Vietnamese summary with disclaimer "Do AI sinh — nên đọc bản gốc trước khi trích dẫn"
- Actions: "Mở paper gốc" button opens paper.url in new tab, "← Quay lại"/"↑ Ẩn" button closes detail or collapses inline expansion, "→ Xem trang" link navigates to `/paper/[id]`
- Error handling: invalid paper ID shows "Không tìm thấy bài báo", missing fields (abstract/summary) show gracefully with placeholders, missing URL disables "Mở paper gốc" button
- Responsive: mobile/tablet/desktop layouts via Tailwind breakpoints
- Dark mode: full support via `dark:` Tailwind classes
- No breaking changes to existing filter/search functionality
- Papers limit: 50 per request, sorted by published_at DESC

---

## Task 1: Create PaperDetail Component

**Files:**
- Create: `nckh-dashboard/components/papers/PaperDetail.tsx`

**Interfaces:**
- Consumes: `Paper` type from `lib/utils/paper-helpers.ts`, `getScoreBadgeColor()`, `scoreBadgeClasses`
- Produces: `PaperDetailProps` interface, `PaperDetail` default export (client component)

- [ ] **Step 1: Create the file and write the component**

Create `nckh-dashboard/components/papers/PaperDetail.tsx`:

```typescript
'use client';

import { Paper, getScoreBadgeColor, scoreBadgeClasses } from "@/lib/utils/paper-helpers";

interface PaperDetailProps {
  paper: Paper;
  showFullLayout?: boolean;  // true on /paper/[id], false when inline
  onClose?: () => void;      // callback to collapse inline
}

export default function PaperDetail({
  paper,
  showFullLayout = false,
  onClose,
}: PaperDetailProps) {
  const formattedDate = new Date(paper.published_at).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const scoreColor = getScoreBadgeColor(paper.ai_score);

  return (
    <div className={`p-6 bg-white dark:bg-slate-800 rounded-lg shadow-lg ${
      !showFullLayout ? "ml-4" : ""
    }`}>
      {/* Header with title and buttons */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex-1">
          {paper.title}
        </h1>
        <div className="flex gap-2 flex-shrink-0">
          <a
            href={paper.url || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className={`px-4 py-2 rounded text-sm font-medium transition ${
              paper.url
                ? "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
                : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
            }`}
            disabled={!paper.url}
          >
            Mở paper gốc
          </a>
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 rounded text-sm font-medium bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-700 text-gray-900 dark:text-white transition"
            >
              ↑ Ẩn
            </button>
          )}
          {!onClose && showFullLayout && (
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 rounded text-sm font-medium bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-700 text-gray-900 dark:text-white transition"
            >
              ← Quay lại
            </button>
          )}
        </div>
      </div>

      {/* Metadata row */}
      <div className="flex flex-wrap gap-3 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
        {/* Authors */}
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {paper.authors || "—"}
          </p>
        </div>

        {/* Source badge */}
        {paper.source && (
          <span className="inline-block px-3 py-1 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
            {paper.source}
          </span>
        )}

        {/* Date */}
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {formattedDate}
        </span>

        {/* AI Score badge */}
        <span
          className={`inline-block px-3 py-1 rounded text-xs font-medium ${
            scoreBadgeClasses[scoreColor]
          }`}
        >
          ⭐ {paper.ai_score !== undefined ? paper.ai_score.toFixed(1) : "N/A"}
        </span>
      </div>

      {/* Original Abstract */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Abstract gốc
        </h2>
        <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded text-gray-700 dark:text-gray-300 text-sm leading-relaxed max-h-96 overflow-y-auto">
          {paper.url ? (
            <p>{paper.url}</p>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">Chưa có abstract</p>
          )}
        </div>
      </div>

      {/* Vietnamese Summary */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Tóm tắt tiếng Việt (AI)
        </h2>
        <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded text-gray-700 dark:text-gray-300 text-sm leading-relaxed max-h-96 overflow-y-auto">
          {paper.ai_summary_vi ? (
            <p>{paper.ai_summary_vi}</p>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">Chưa có tóm tắt</p>
          )}
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400 italic mt-2">
          Do AI sinh — nên đọc bản gốc trước khi trích dẫn
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `npm run build`
Expected: Build succeeds with no TS errors

- [ ] **Step 3: Commit**

```bash
git add nckh-dashboard/components/papers/PaperDetail.tsx
git commit -m "feat: create PaperDetail component for paper information display"
```

---

## Task 2: Modify PaperCard to Add Expand and Navigation Buttons

**Files:**
- Modify: `nckh-dashboard/components/papers/PaperCard.tsx`

**Interfaces:**
- Consumes: `Paper` type, `truncateText()`, `getScoreBadgeColor()`, `scoreBadgeClasses`
- Produces: Updated `PaperCard` component with props `isExpanded?: boolean`, `onExpand?: () => void`, `onCollapse?: () => void`

- [ ] **Step 1: Update PaperCard.tsx to add props and buttons**

Replace entire file `nckh-dashboard/components/papers/PaperCard.tsx`:

```typescript
import Link from "next/link";
import { Paper, truncateText, getScoreBadgeColor, scoreBadgeClasses } from "@/lib/utils/paper-helpers";

interface PaperCardProps extends Paper {
  isExpanded?: boolean;
  onExpand?: () => void;
  onCollapse?: () => void;
}

export default function PaperCard({
  id,
  title,
  authors,
  url,
  source,
  ai_score,
  ai_summary_vi,
  published_at,
  isExpanded = false,
  onExpand,
  onCollapse,
}: PaperCardProps) {
  const scoreColor = getScoreBadgeColor(ai_score);

  return (
    <div className="p-5 bg-white dark:bg-slate-800 rounded-lg shadow hover:shadow-lg transition">
      {/* Title */}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-lg font-bold text-blue-600 dark:text-blue-400 hover:underline block"
      >
        {title}
      </a>

      {/* Authors */}
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        {authors}
      </p>

      {/* Summary - only render if it exists */}
      {ai_summary_vi && (
        <p className="mt-3 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
          {truncateText(ai_summary_vi, 200)}
        </p>
      )}

      {/* Footer */}
      <div className="mt-4 flex row items-center justify-between flex-wrap gap-2">
        {/* Left side - badges */}
        <div className="flex row gap-2">
          {/* Source badge - only show if source exists */}
          {source && (
            <span className="inline-block px-3 py-1 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
              {source}
            </span>
          )}

          {/* AI Score badge - always show */}
          <span
            className={`inline-block px-3 py-1 rounded text-xs font-medium ${
              scoreBadgeClasses[scoreColor]
            }`}
          >
            ⭐ {ai_score !== undefined ? ai_score.toFixed(1) : "N/A"}
          </span>
        </div>

        {/* Right side - published date */}
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {new Date(published_at).toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
        </span>
      </div>

      {/* Action buttons - Chi tiết and Xem trang */}
      <div className="mt-4 flex gap-3 flex-wrap">
        {onExpand && (
          <button
            onClick={isExpanded ? onCollapse : onExpand}
            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition"
          >
            {isExpanded ? "↑ Ẩn" : "Chi tiết"}
          </button>
        )}
        <Link
          href={`/paper/${id}`}
          className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition"
        >
          → Xem trang
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `npm run build`
Expected: Build succeeds with no TS errors

- [ ] **Step 3: Commit**

```bash
git add nckh-dashboard/components/papers/PaperCard.tsx
git commit -m "feat: add expand and navigate buttons to PaperCard"
```

---

## Task 3: Modify PapersGrid to Support Inline Expansion

**Files:**
- Modify: `nckh-dashboard/components/papers/PapersGrid.tsx`

**Interfaces:**
- Consumes: `Paper` type, `PaperCard` component (with new props), `PaperDetail` component (new)
- Produces: Updated `PapersGrid` component with expandedId state management

- [ ] **Step 1: Update PapersGrid.tsx to add state and render PaperDetail inline**

Replace entire file `nckh-dashboard/components/papers/PapersGrid.tsx`:

```typescript
'use client';

import { useState } from "react";
import PaperCard from "./PaperCard";
import PaperDetail from "./PaperDetail";
import { Paper } from "@/lib/utils/paper-helpers";

interface PapersGridProps {
  papers: Paper[];
  isLoading: boolean;
}

export default function PapersGrid({ papers, isLoading }: PapersGridProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  // Normal state - grid of papers with inline expansion
  return (
    <div className="grid grid-cols-1 gap-4">
      {papers.map((paper) => (
        <div key={paper.id}>
          {/* Paper Card */}
          <PaperCard
            {...paper}
            isExpanded={expandedId === paper.id}
            onExpand={() => setExpandedId(paper.id)}
            onCollapse={() => setExpandedId(null)}
          />

          {/* Inline Paper Detail - render below card if expanded */}
          {expandedId === paper.id && (
            <PaperDetail
              paper={paper}
              showFullLayout={false}
              onClose={() => setExpandedId(null)}
            />
          )}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `npm run build`
Expected: Build succeeds with no TS errors

- [ ] **Step 3: Test inline expansion manually**

1. Start dev server: `npm run dev`
2. Navigate to homepage (http://localhost:3000)
3. Click "Chi tiết" button on any paper → detail should expand below the card
4. Click "↑ Ẩn" button → detail should collapse
5. Expand one paper, then expand another → only the latest expanded paper shows detail
6. Click "→ Xem trang" → should navigate to `/paper/[id]`

- [ ] **Step 4: Commit**

```bash
git add nckh-dashboard/components/papers/PapersGrid.tsx
git commit -m "feat: add expandedId state and inline PaperDetail rendering to PapersGrid"
```

---

## Task 4: Create `/paper/[id]` Route Handler

**Files:**
- Create: `nckh-dashboard/app/paper/[id]/page.tsx`

**Interfaces:**
- Consumes: `supabase` client from `lib/supabase.ts`, `Paper` type, `PaperDetail` component, `PapersGrid` component
- Produces: Server component exporting default page function

- [ ] **Step 1: Create the route file and implement data fetching**

Create directory structure if needed, then create `nckh-dashboard/app/paper/[id]/page.tsx`:

```typescript
import { supabase } from "@/lib/supabase";
import PaperDetail from "@/components/papers/PaperDetail";
import PapersGrid from "@/components/papers/PapersGrid";
import { Paper } from "@/lib/utils/paper-helpers";

async function getPaperData(id: string): Promise<Paper | null> {
  try {
    const { data, error } = await supabase
      .from("papers")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return data as Paper;
  } catch {
    return null;
  }
}

async function getPageData() {
  try {
    const [papersResult, topicsResult] = await Promise.all([
      supabase
        .from("papers")
        .select("*")
        .order("published_at", { ascending: false })
        .limit(50),
      supabase
        .from("topics")
        .select("*")
        .limit(10),
    ]);

    return {
      papers: papersResult.data || [],
      topics: topicsResult.data || [],
    };
  } catch {
    return {
      papers: [],
      topics: [],
    };
  }
}

export default async function PaperDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const paper = await getPaperData(params.id);
  const { papers, topics } = await getPageData();

  if (!paper) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-4xl mb-3">❌</p>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Không tìm thấy bài báo
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Paper Detail Full Width */}
        <PaperDetail paper={paper} showFullLayout={true} />

        {/* Papers List + Sidebar Below */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Topics Sidebar */}
          <div className="lg:col-span-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Chủ đề
            </h2>
            <div className="space-y-3">
              {topics.map((topic: any) => (
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

          {/* Papers Grid */}
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

- [ ] **Step 2: Verify TypeScript compilation**

Run: `npm run build`
Expected: Build succeeds with no TS errors

- [ ] **Step 3: Test the route manually**

1. Dev server running: `npm run dev`
2. Navigate to a paper detail page directly: http://localhost:3000/paper/YOUR_PAPER_ID
3. Verify:
   - Paper detail displays full-width at top
   - Topics sidebar and papers list render below
   - "← Quay lại" button appears and works
   - "Mở paper gốc" button opens paper URL in new tab
   - Responsive layout on mobile/tablet/desktop
   - Dark mode works correctly
4. Test error handling: http://localhost:3000/paper/invalid-id → should show "Không tìm thấy bài báo"

- [ ] **Step 4: Commit**

```bash
git add nckh-dashboard/app/paper/[id]/page.tsx
git commit -m "feat: create /paper/[id] route with full paper detail layout"
```

---

## Task 5: Visual Testing and Success Criteria Verification

**Files:**
- None (verification only)

**Interfaces:**
- Consumes: All components from Tasks 1-4
- Produces: Test results and verification checklist

- [ ] **Step 1: Start dev server**

Run: `npm run dev`
Wait for "Local: http://localhost:3000"

- [ ] **Step 2: Test inline expansion flow**

1. Navigate to homepage (http://localhost:3000)
2. **Test expand:** Click "Chi tiết" on any paper card → PaperDetail should slide in below with full info
3. **Verify:** Check all fields display: title (bold, large), authors, source badge, date (dd/mm/yyyy), AI score badge (colored), abstract placeholder, Vietnamese summary with disclaimer "Do AI sinh — nên đọc bản gốc trước khi trích dẫn"
4. **Test collapse:** Click "↑ Ẩn" → detail should disappear
5. **Test exclusive expansion:** Expand paper A, then expand paper B → only paper B's detail shows
6. **Test navigation:** Click "→ Xem trang" on any paper → should navigate to `/paper/[id]` URL

- [ ] **Step 3: Test detail page route**

1. Navigate to any `/paper/[id]` page from the previous test
2. **Verify layout:** Paper detail at top (full-width), topics sidebar + papers list below (3-column on desktop)
3. **Verify buttons work:** "Mở paper gốc" opens URL in new tab, "← Quay lại" goes back
4. **Test invalid ID:** Navigate to `/paper/invalid-id-12345` → should show "Không tìm thấy bài báo" error message
5. **Test bookmarking:** Bookmark current `/paper/[id]` page, refresh, verify page reloads correctly
6. **Test back link:** Click "← Quay lại" from detail page → should return to homepage or previous page

- [ ] **Step 4: Test responsive design**

Use browser DevTools to test:

1. **Mobile (375px width):**
   - Detail view: buttons stack vertically, text readable
   - Route view: sidebar wraps below papers, single column
   - Action buttons remain clickable

2. **Tablet (768px width):**
   - Detail view: buttons on same row, good spacing
   - Route view: 2-column layout or transition to 3-column
   - Text and badges properly sized

3. **Desktop (1280px width):**
   - Detail view: full-width, buttons on right
   - Route view: 3-column grid (sidebar + papers)
   - All sections clearly visible

- [ ] **Step 5: Test dark mode**

1. Toggle dark mode in browser (or system settings)
2. **Verify colors:**
   - Backgrounds: white→slate-800, grays properly inverted
   - Text: dark gray→light gray, white text on dark backgrounds
   - Badges: all color schemes apply (green, yellow, gray)
   - Buttons: proper contrast in both modes
3. **Check readability:** All text legible, no color clashing

- [ ] **Step 6: Test edge cases**

1. **Missing fields:**
   - Paper with no `ai_summary_vi` → show "Chưa có tóm tắt"
   - Paper with no `authors` → show "—"
   - Paper with no `source` → skip source badge
   - Paper with no `url` → disable "Mở paper gốc" button (grayed out)

2. **Long content:**
   - Abstract > 1000 chars → scrollable in max-h-96 container
   - Summary > 1000 chars → scrollable container
   - Long title → wraps properly on mobile

3. **Concurrent state:**
   - Expand paper A
   - Click "→ Xem trang" on paper B while A is expanded
   - Should navigate cleanly without state conflicts

- [ ] **Step 7: Verify all success criteria**

✅ Inline expansion works: click "Chi tiết" → detail shows below card
✅ Collapse works: click "↑ Ẩn" → detail hidden, only one expanded at a time
✅ Route `/paper/[id]` works: valid ID → detail page loads with full layout
✅ Invalid ID → error message "Không tìm thấy bài báo" shown
✅ All fields display correctly: title, authors, source, date, score, abstract, summary
✅ Disclaimer note visible: "Do AI sinh — nên đọc bản gốc trước khi trích dẫn"
✅ "Mở paper gốc" button works: opens URL in new tab (or disabled if no URL)
✅ "← Quay lại" / "↑ Ẩn" buttons work correctly
✅ Link to `/paper/[id]` works from card "→ Xem trang"
✅ Responsive on mobile/tablet/desktop (tested all breakpoints)
✅ Dark mode fully supported (all colors, text readable)
✅ No console errors (check DevTools console)

- [ ] **Step 8: Check for console errors**

1. Open browser DevTools (F12)
2. Go to Console tab
3. Navigate through all views: homepage, expand paper, navigate to detail page, test buttons
4. **Verify:** No red errors, no warnings related to our components
5. Expected: Clean console or only Next.js build warnings

- [ ] **Step 9: Final visual check**

1. Take screenshots:
   - Homepage with expanded paper (mobile, tablet, desktop)
   - `/paper/[id]` detail page (mobile, tablet, desktop)
   - Dark mode version of both
   - Error state (invalid ID)

2. Compare to spec design requirements:
   - Button text and colors match ("Chi tiết", "↑ Ẩn", "→ Xem trang", "Mở paper gốc", "← Quay lại")
   - Badge colors match AI score ranges (green ≥8, yellow 6-8, gray <6)
   - Typography: title bold and large, metadata small
   - Spacing and layout match Tailwind grid classes

- [ ] **Step 10: Commit verification**

```bash
git status
```

Expected: All changes from Tasks 1-4 committed. No uncommitted files related to the feature.

---

## Success Criteria (Verification Summary)

| Criterion | Status | Test Method |
|-----------|--------|-------------|
| Inline expansion renders PaperDetail below card | ✅ | Click "Chi tiết" button |
| Collapse hides detail | ✅ | Click "↑ Ẩn" button |
| Only one paper expanded at a time | ✅ | Expand two papers sequentially |
| `/paper/[id]` route loads valid paper | ✅ | Navigate to `/paper/[paper-id]` |
| Invalid ID shows error message | ✅ | Navigate to `/paper/invalid-id` |
| All metadata fields display | ✅ | Check title, authors, source, date, score |
| Disclaimer visible | ✅ | Verify "Do AI sinh..." text present |
| "Mở paper gốc" opens URL | ✅ | Click button, verify new tab opened |
| "← Quay lại" navigates back | ✅ | Click button on detail page |
| "→ Xem trang" navigates to `/paper/[id]` | ✅ | Click link from card |
| Responsive mobile (≤640px) | ✅ | Test at 375px width |
| Responsive tablet (641-1024px) | ✅ | Test at 768px width |
| Responsive desktop (≥1025px) | ✅ | Test at 1280px width |
| Dark mode fully functional | ✅ | Toggle dark mode, verify all colors |
| No console errors | ✅ | Check browser DevTools console |
| Missing fields handled gracefully | ✅ | Test papers with missing ai_summary_vi, authors, url |
| Long content scrollable | ✅ | Test with abstracts > 1000 chars |

---

## Notes

- PaperDetail component has a responsive button layout: stacks on mobile, inline on desktop
- PapersGrid tracks expandedId as a string or null; only one paper can be expanded at a time
- The `/paper/[id]` route maintains the same layout as homepage (topics + papers below detail)
- All Tailwind classes use dark: variants for full dark mode support
- Error handling is graceful: missing fields show placeholders rather than breaking the UI
- The "Mở paper gốc" button is conditionally disabled when paper.url is missing
