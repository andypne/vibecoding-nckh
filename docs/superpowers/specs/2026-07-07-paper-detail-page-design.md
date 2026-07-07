# Paper Detail Page Design

**Date:** 2026-07-07  
**Author:** Claude Code  
**Status:** In Design Review

---

## Overview

Add a dual-view paper detail feature: inline expandable rows in the papers list (quick view) and a dedicated `/paper/[id]` route (deep link / bookmarkable). Both views display the full paper information: title, authors, source, date, AI score, original abstract, and Vietnamese AI summary with disclaimer.

---

## Requirements

### Functional
- **Inline Expansion:** Click paper title or "Chi tiết" button in list → expand inline below card showing full details
- **Dedicated Route:** Navigate to `/paper/[id]` → full-width paper detail at top, then papers list + sidebar below
- **Display Fields:**
  - Title (bold, large)
  - Authors
  - Source (badge)
  - Published date (dd/mm/yyyy)
  - AI score (colored badge: green ≥8, yellow 6-8, gray <6)
  - Original abstract (full text)
  - Vietnamese summary (AI-generated) with disclaimer: "Do AI sinh — nên đọc bản gốc trước khi trích dẫn"
- **Actions:**
  - "Mở paper gốc" button → opens `paper.url` in new tab
  - "← Quay lại" / "← Ẩn" button → closes detail or navigates back
  - Link to `/paper/[id]` for bookmarking/sharing
- **Error Handling:**
  - Paper not found (invalid ID) → show "Không tìm thấy bài báo"
  - Missing fields → skip sections gracefully or show placeholder
  - Missing `url` → disable "Mở paper gốc" button

### Non-Functional
- Responsive: mobile/tablet/desktop layouts
- Dark mode support
- No separate backend API (Supabase client-side fetch)

---

## Architecture

### File Structure

```
nckh-dashboard/
├── app/
│   ├── page.tsx                    (MODIFIED - manage inline expand state)
│   ├── paper/
│   │   └── [id]/
│   │       └── page.tsx            (NEW - detail page route)
│   └── layout.tsx
├── components/
│   ├── papers/
│   │   ├── PaperCard.tsx           (MODIFIED - add expand/collapse buttons)
│   │   ├── PapersGrid.tsx          (MODIFIED - track expandedId state)
│   │   ├── PaperDetail.tsx         (NEW - detail display component)
│   │   └── FiltersBar.tsx          (existing)
│   └── filters/
│       └── ...
└── lib/
    ├── supabase.ts                 (existing)
    └── filters.ts                  (existing)
```

### Component Architecture

#### **PaperDetail.tsx** (Client Component - New)

**Purpose:** Display full paper details with all metadata and content.

**Props:**
```typescript
interface PaperDetailProps {
  paper: Paper;
  showFullLayout?: boolean;  // true on /paper/[id], false when inline
  onClose?: () => void;      // callback to collapse inline
}
```

**Sections:**
1. **Header:** Title (bold, large) + buttons (Back/Close, Open Paper)
2. **Metadata:** Authors, source badge, date, AI score badge (flex row)
3. **Original Abstract:** Section with full abstract text, scrollable if long
4. **Vietnamese Summary:** Section with AI summary + disclaimer note

**Styling:**
- Container: `p-6 bg-white dark:bg-slate-800 rounded-lg shadow-lg`
- Title: `text-3xl font-bold mb-4 text-gray-900 dark:text-white`
- Section headers: `text-lg font-semibold mt-6 mb-2`
- Abstract content: `p-4 bg-gray-50 dark:bg-slate-700 rounded text-gray-700 dark:text-gray-300 max-h-96 overflow-y-auto`
- Disclaimer: `text-sm text-gray-600 dark:text-gray-400 italic mt-2`
- Buttons: "Mở paper gốc" (blue), Back/Close (gray)

**Error Handling:**
- Missing `ai_summary_vi` → show "Chưa có tóm tắt"
- Missing `url` → disable "Mở paper gốc" button
- Other missing fields → show placeholder or skip section

#### **PapersGrid.tsx** (Client Component - Modified)

**Changes:**
- Add `expandedId` state: `useState<string | null>(null)`
- Map papers:
  - Render PaperCard with `isExpanded`, `onExpand`, `onCollapse` props
  - If `expandedId === paper.id`, render PaperDetail below card
  - Detail shows with margin-left, indented appearance

**Event handlers:**
- `onExpand` → set expandedId to paper.id
- `onCollapse` → set expandedId to null

#### **PaperCard.tsx** (Client Component - Modified)

**Changes:**
- Add "Chi tiết" button (blue link/button text)
  - Click → calls `onExpand()` to trigger inline expansion
  - When expanded, button text changes to "↑ Ẩn", click collapses
- Add "→ Xem trang" link (gray text link)
  - Navigate to `/paper/[id]`
  - Opens same page but as dedicated route

**Button styling:**
- "Chi tiết" / "↑ Ẩn": `text-blue-600 hover:text-blue-700 dark:text-blue-400`
- "Xem trang": `text-gray-600 hover:text-gray-700 dark:text-gray-400 ml-3`

#### **`app/paper/[id]/page.tsx`** (Server Component - New)

**Purpose:** Render detail page with full layout (detail + papers list + sidebar).

**Implementation:**
```typescript
async function getPaperData(id: string) {
  const { data: paper } = await supabase
    .from("papers")
    .select("*")
    .eq("id", id)
    .single();
  return paper;
}

async function getPageData() {
  // Fetch papers list and topics (same as homepage)
  const { data: papers } = await supabase
    .from("papers")
    .select("*")
    .order("published_at", { ascending: false })
    .limit(50);
  const { data: topics } = await supabase
    .from("topics")
    .select("*")
    .limit(10);
  return { papers, topics };
}

export default async function PaperDetailPage({ params }: { params: { id: string } }) {
  const paper = await getPaperData(params.id);
  const { papers, topics } = await getPageData();
  
  if (!paper) {
    return <ErrorPage message="Không tìm thấy bài báo" />;
  }
  
  return (
    <div className="min-h-screen bg-gradient...">
      <div className="max-w-6xl mx-auto">
        {/* Paper Detail Full Width */}
        <PaperDetail paper={paper} showFullLayout={true} />
        
        {/* Papers List + Sidebar (same as homepage) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          <div className="lg:col-span-1">
            {/* Topics sidebar */}
          </div>
          <div className="lg:col-span-2">
            {/* Papers grid (filtered, searchable) */}
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Layout:**
1. Paper detail at full-width top (full-height visual prominence)
2. Below: 3-column grid with topics sidebar + papers list
3. Papers list excludes the currently viewed paper (optional, for cleaner UX)

---

## Data Flow

**Homepage (inline expansion):**
```
PapersGrid (maintains expandedId state)
  ↓ click paper
  → PaperCard triggers onExpand()
  → expandedId set to paper.id
  → PaperDetail component renders below card with paper data
  → click "↑ Ẩn" or outside → onCollapse() → expandedId reset
```

**Direct route (`/paper/[id]`):**
```
/paper/[id] URL accessed
  → page.tsx calls getPaperData(id)
  → Supabase query: papers.select(*).eq("id", id).single()
  → paper data loaded
  → PaperDetail rendered full-width
  → Papers list + sidebar fetched separately
  → Full layout rendered below
```

**Navigation between views:**
- From homepage: click "→ Xem trang" link → navigate to `/paper/[id]`
- From detail page: "← Quay lại" → browser back (or link to `/`)
- Deep linking: User bookmarks `/paper/[id]` → direct access without homepage

---

## UI/UX Details

### Responsive Design

| Breakpoint | Layout |
|---|---|
| Mobile (default) | Detail full-width, buttons stack, papers below stack single-column |
| Tablet (md:) | Detail full-width, papers 2-column or sidebar wraps |
| Desktop (lg:) | Detail full-width, 3-column grid below (topics + papers) |

### Dark Mode

All elements use `dark:` Tailwind variants:
- Backgrounds: `dark:bg-slate-700`, `dark:bg-slate-800`
- Text: `dark:text-white`, `dark:text-gray-300`
- Accents: `dark:text-blue-400`

### Buttons & Links

- "Mở paper gốc": Blue button, white text, hover darker
- "← Quay lại" / "↑ Ẩn": Gray button, darker on hover
- "→ Xem trang": Text link, blue, underline on hover

---

## Error Handling & Edge Cases

1. **Paper not found:**
   - `/paper/invalid-id` → 404 or custom error page: "Không tìm thấy bài báo"
   - Inline: Show error toast or message, keep list visible

2. **Missing optional fields:**
   - No `ai_summary_vi` → skip section, show "Chưa có tóm tắt"
   - No `url` → disable "Mở paper gốc" button, show placeholder
   - No authors → show "—" or empty
   - No source → skip badge

3. **Long content:**
   - Abstract > 5000 chars → show full in scrollable container (max-h-96 overflow-y-auto)
   - Vietnamese summary > 1000 chars → show full, user scrolls

4. **Concurrent state:**
   - If paper is deleted while viewing → show "Bài báo không còn tồn tại"
   - If paper is updated while viewing → show current data (no real-time sync needed)

---

## Testing Strategy

**Manual Testing:**

1. **Inline expansion:**
   - [ ] Click "Chi tiết" → detail expands below card
   - [ ] Click "↑ Ẩn" → detail collapses
   - [ ] Expand two different papers → only latest expanded shows
   - [ ] Click "→ Xem trang" → navigates to `/paper/[id]`

2. **Direct route:**
   - [ ] Navigate to `/paper/[id]` with valid ID → detail shows full-width
   - [ ] Papers list + sidebar load below
   - [ ] Click "← Quay lại" → goes back (browser back)
   - [ ] Bookmark URL → can return to same paper directly

3. **Edge cases:**
   - [ ] Invalid paper ID → error message shown
   - [ ] Missing abstract/summary → sections skipped gracefully
   - [ ] Missing URL → "Mở paper gốc" button disabled
   - [ ] Very long abstract → scrollable, readable
   - [ ] Responsive: mobile, tablet, desktop layouts

4. **Dark mode:**
   - [ ] All text readable in dark mode
   - [ ] Buttons visible
   - [ ] Backgrounds appropriate contrast

---

## Success Criteria

✅ Inline expansion works: click "Chi tiết" → detail shows below card  
✅ Collapse works: click "↑ Ẩn" → detail hidden  
✅ Route `/paper/[id]` works: valid ID → detail page loads  
✅ Invalid ID → error shown  
✅ All fields display correctly: title, authors, source, date, score, abstract, summary  
✅ Disclaimer note visible: "Do AI sinh — nên đọc bản gốc trước khi trích dẫn"  
✅ "Mở paper gốc" button works: opens URL in new tab  
✅ "← Quay lại" / "↑ Ẩn" buttons work  
✅ Link to `/paper/[id]` works  
✅ Responsive on mobile/tablet/desktop  
✅ Dark mode fully supported  
✅ No console errors  

---

## Global Constraints

- Papers limit: 50 (on detail page, papers list)
- Sort order: `published_at` DESC
- No real-time sync (static data)
- Supabase client-side queries only
- Dark mode via Tailwind `dark:` classes
