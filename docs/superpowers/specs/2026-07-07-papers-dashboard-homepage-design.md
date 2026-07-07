# Papers Dashboard Homepage Design
**Date:** 2026-07-07  
**Author:** Claude Code  
**Status:** In Design Review

---

## Overview

Redesign the papers homepage to display a comprehensive list of research papers (50 limit) with improved card layout, color-coded AI score badges, truncated summaries, responsive design, and proper loading/empty states.

---

## Requirements

### Functional
- **Data source:** Supabase `papers` table, sorted by `published_at` DESC, limit 50
- **Display:** Card-based grid layout with:
  - Paper title (bold, clickable → opens original URL in new tab)
  - Authors
  - Source badge (website/journal name: arxiv, nature, etc.)
  - AI score badge (color-coded: green ≥8, yellow 6-8, gray <6)
  - Vietnamese summary truncated at 200 characters + "..."
  - Published date (dd/mm/yyyy format)
- **Loading state:** Full-screen spinner centered, message "Đang tải bài báo..."
- **Empty state:** Centered message "Chưa có bài báo nào" when no papers found
- **Responsive:** Mobile-first, single column on mobile, full width on desktop
- **Layout:** Keep existing topics sidebar (Topics on left, Papers on right, 3-column grid)

### Non-functional
- No filter/search (fixed sorted list)
- Dark mode support (existing Tailwind dark: classes)
- Accessibility: semantic HTML, proper alt text on badges

---

## Architecture

### File Structure
```
nckh-dashboard/
├── app/
│   ├── page.tsx                    (Home - fetch data, orchestrate layout)
│   └── layout.tsx                  (existing)
├── components/
│   └── papers/
│       ├── PaperCard.tsx           (individual paper card UI)
│       └── PapersGrid.tsx          (grid container + loading + empty)
└── lib/
    ├── supabase.ts                 (existing)
    └── utils/paper-helpers.ts      (NEW - truncateText, getScoreBadgeColor)
```

### Component Architecture

#### **PaperCard.tsx**
- **Purpose:** Render a single paper as a card
- **Props:**
  ```typescript
  interface PaperCardProps {
    id: string;
    title: string;
    authors: string;
    url: string;
    source?: string;           // website/journal name
    ai_score?: number;         // 0-10 scale
    ai_summary_vi?: string;    // Vietnamese summary
    published_at: string;      // ISO date string
  }
  ```
- **Styling:**
  - Container: `p-5 bg-white dark:bg-slate-800 rounded-lg shadow hover:shadow-lg transition`
  - Title: `text-lg font-bold`, wrapped in `<a>` with `target="_blank"`
  - Authors: `text-sm text-gray-600 dark:text-gray-400`
  - Summary: Single paragraph, 200-char truncation + "..."
  - Footer row:
    - **Left:** Source badge (gray: `bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200`)
    - **Left:** AI score badge (color-coded):
      - `score >= 8`: Green (`bg-green-100 dark:bg-green-900 text-green-800`)
      - `6 <= score < 8`: Yellow (`bg-yellow-100 dark:bg-yellow-900 text-yellow-800`)
      - `score < 6`: Gray (`bg-gray-100 dark:bg-gray-700 text-gray-800`)
    - **Right:** Published date formatted `dd/mm/yyyy` (Vietnamese locale)

#### **PapersGrid.tsx**
- **Purpose:** Manage papers list, handle loading/empty states
- **Props:**
  ```typescript
  interface PapersGridProps {
    papers: Paper[];
    isLoading: boolean;
  }
  ```
- **States:**
  - **Loading:** `isLoading === true` → centered spinner (Tailwind: `flex items-center justify-center h-64`, spinner icon)
  - **Empty:** `papers.length === 0 && !isLoading` → centered empty state card (📭 icon, message)
  - **Normal:** `papers.length > 0` → grid of PaperCard components
- **Layout:** `grid grid-cols-1 gap-4` (single column, 16px gap)

#### **page.tsx** (modified)
- **Change 1:** Update papers query: `limit(5)` → `limit(50)`
- **Change 2:** Remove inline paper rendering, replace with `<PapersGrid papers={papers} isLoading={false} />`
- **Topics sidebar:** No changes, keep existing
- **Layout:** Grid structure unchanged (lg:col-span-3), papers section now uses PapersGrid

---

## Data Flow

```
page.tsx (async)
├─ calls getResearchData()
│  ├─ Supabase query: papers limit 50, sort DESC by published_at
│  └─ Returns { papers, topics }
├─ Renders page layout
│  ├─ Topics sidebar (unchanged)
│  └─ PapersGrid component
│     ├─ Props: papers, isLoading=false
│     └─ Maps papers array → renders PaperCard for each
│        └─ PaperCard displays all fields + formatted date + colored badge
```

---

## Styling & Responsiveness

### Tailwind Utilities Used
- Grid: `grid grid-cols-1 lg:grid-cols-3 gap-8` (existing page layout)
- Card: `p-5 rounded-lg shadow hover:shadow-lg transition`
- Dark mode: `dark:bg-slate-800 dark:text-white` (existing pattern)
- Flex: `flex items-center justify-between` (footer layout)
- Spacing: `mt-2 mt-3 mb-4` for internal card spacing
- Text truncation: `text-sm text-gray-600`

### Responsive Behavior
- **Mobile (default):** Single column, full width cards
- **Desktop (lg):** Papers column spans 2/3 width, topics spans 1/3
- Existing layout already handles this (no CSS changes needed)

---

## Error Handling & Edge Cases

1. **Missing `source` field:** Display empty string or "Unknown"
2. **Missing `ai_summary_vi`:** Skip summary section (don't render empty space)
3. **Invalid `ai_score`:** Treat as undefined, show gray badge
4. **Invalid `published_at`:** Graceful date parsing with fallback
5. **Empty papers array:** Show empty state, not blank space

---

## Types & Helpers

### Paper Type
```typescript
interface Paper {
  id: string;
  title: string;
  authors: string;
  url: string;
  source?: string;
  ai_score?: number;         // 0-10
  ai_summary_vi?: string;
  published_at: string;      // ISO 8601
}
```

### Helper Functions (lib/utils/paper-helpers.ts)
```typescript
export function truncateText(text: string, maxLength: number = 200): string {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + "...";
}

export function getScoreBadgeColor(score?: number): 'green' | 'yellow' | 'gray' {
  if (!score) return 'gray';
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

---

## Loading & Empty States

### Loading Spinner
- **Trigger:** On initial page load, wrapped in `<Suspense>` boundary
- **Visual:** Centered spinner icon (Tailwind flex center)
- **Message:** "Đang tải bài báo..."
- **Implementation:** Next.js 15 Suspense fallback for server component data fetching
- **Duration:** Until data arrives from Supabase

### Empty State
- **Trigger:** `papers.length === 0` after loading completes
- **Visual:** Centered card with icon (📭)
- **Message:** "Chưa có bài báo nào"
- **Action:** None (no refresh button, assumes data will arrive soon)

---

## Testing Strategy

### Unit Tests
- PaperCard: Props render correctly, links open in new tab, truncation works
- truncateText helper: Boundary cases (empty, exact length, over length)
- getScoreBadgeColor helper: All score ranges return correct color

### Integration Tests
- page.tsx: Fetch papers, render PapersGrid
- PapersGrid with papers: Grid renders correctly, all cards visible
- PapersGrid empty: Empty state shows, no crash
- PapersGrid loading: Spinner displays

### Visual Regression
- Responsive layouts: Mobile, tablet, desktop
- Dark mode: All text readable, badges visible
- Hover states: Card shadow transitions smooth

---

## Success Criteria

✅ Papers display in descending date order (limit 50)  
✅ Each card shows title, authors, source, score badge, summary, date  
✅ Clickable title opens URL in new tab  
✅ AI score badge is green (≥8), yellow (6-8), or gray (<6)  
✅ Summary truncated at 200 chars + "..."  
✅ Responsive layout on mobile/tablet/desktop  
✅ Loading spinner shown while fetching  
✅ Empty state shown when no papers  
✅ Dark mode styling applied  
✅ No console errors  

---

## Open Questions / Assumptions

1. **Source field:** Assumed `source` column exists in `papers` table; if not, discuss whether to add it
2. **AI score range:** Assumed 0-10 scale; verify actual data range
3. **Summary availability:** Assumed `ai_summary_vi` exists for most papers; if sparse, show empty state gracefully
4. **Published date format:** Assumed ISO 8601; verify Supabase actual format
5. **Spinner UI:** No design mockup; recommend simple Tailwind SVG spinner or icon library

---

## Rollout Plan

1. **Phase 1:** Implement PaperCard + PapersGrid components
2. **Phase 2:** Update page.tsx to integrate new components
3. **Phase 3:** Add helper utilities + styling polish
4. **Phase 4:** Test responsive + dark mode
5. **Phase 5:** Deploy to production (merge to main)

---

## Appendix: Code Snippets

### Example Paper Object
```json
{
  "id": "uuid-1",
  "title": "Machine Learning in Healthcare",
  "authors": "John Doe, Jane Smith",
  "url": "https://arxiv.org/abs/2401.12345",
  "source": "arXiv",
  "ai_score": 8.5,
  "ai_summary_vi": "Bài báo này tìm hiểu ứng dụng của machine learning trong chẩn đoán bệnh. Kết quả cho thấy độ chính xác lên tới 95% trên dataset test.",
  "published_at": "2024-01-15T10:30:00Z"
}
```

### Badge Color Mapping
| Score Range | Badge Color | Tailwind Classes |
|---|---|---|
| ≥ 8 | Green | `bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200` |
| 6-8 | Yellow | `bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200` |
| < 6 | Gray | `bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200` |
| Undefined | Gray | (same as < 6) |
