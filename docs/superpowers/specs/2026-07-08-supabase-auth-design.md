# Supabase Magic Link Authentication Design

**Date:** 2026-07-08  
**Author:** Claude Code  
**Status:** Design Review

---

## Overview

Add email magic link authentication via Supabase Auth to the papers dashboard. User flow: login via email → receive magic link → click link → automatic session creation → redirect to dashboard. Middleware protects all routes, requiring authentication. Header displays user email and logout button when authenticated.

---

## Requirements

### Functional
- **Login Flow:** Email input form → "Đăng nhập" button → receive email with magic link → click link → automatic login
- **Magic Link:** Supabase sends email with one-time link, auto-redirects to `/auth/callback` with code
- **Session Persistence:** Session persists on page refresh, cleared on logout
- **Protected Dashboard:** All routes (`/`, `/paper/[id]`) require authentication; unauthenticated users redirect to `/login`
- **Header:**
  - Unauthenticated: Show "Đăng nhập" link
  - Authenticated: Show user email + "Đăng xuất" button
- **Logout:** Click "Đăng xuất" → session cleared → redirect to `/login`

### Non-Functional
- **Security:** Middleware validates session before loading protected routes
- **UX:** No loading delays, smooth redirects, error messages for invalid links
- **Responsive:** Header works on mobile/tablet/desktop
- **Dark Mode:** Full dark mode support via Tailwind `dark:` classes
- **No Breaking Changes:** Existing paper list, filters, detail pages unchanged

---

## Architecture

### Component Hierarchy

```
RootLayout (with AuthProvider)
├── Header (shows email/login)
├── Middleware (protects routes)
├── /login
│   └── LoginPage (email form)
├── /auth/callback
│   └── CallbackPage (handles magic link)
└── / (dashboard, only if authenticated)
    ├── PapersGrid
    ├── FiltersBar
    └── TopicsSidebar
```

### Authentication Flow

```
1. User visits / (unauthenticated)
   ↓ (Middleware checks session, fails)
2. Redirect to /login
   ↓
3. User enters email, clicks "Đăng nhập"
   ↓
4. signInWithOtp() called → Supabase sends email with magic link
   ↓
5. User clicks link in email (e.g., https://app.com/auth/callback?code=ABC123)
   ↓
6. CallbackPage receives code
   ↓
7. exchangeCodeForSession(code) validates and creates session
   ↓
8. Redirect to / → Middleware allows → Dashboard loads
   ↓
9. Header displays user email + logout button
   ↓
10. (Optional) User clicks "Đăng xuất" → signOut() → redirect /login
```

---

## File Structure & Implementation

### 1. AuthContext (`lib/auth-context.tsx`)

**Purpose:** Provide centralized auth state management via React Context

**Exports:**
- `AuthProvider` component (wraps app in RootLayout)
- `useAuth()` hook (returns `{ user, isLoading, signOut }`)

**Implementation:**
- Listen to Supabase `onAuthStateChange()` event
- Update context state when user logs in/out
- Restore session on app mount
- Provide `signOut()` function to sign out

**User Type:**
```typescript
type User = {
  id: string;
  email: string;
}
```

### 2. Middleware (`middleware.ts`)

**Purpose:** Protect routes, redirect unauthenticated users to `/login`

**Routes:**
- **Public:** `/login`, `/auth/callback` (allow unauthenticated)
- **Protected:** `/`, `/paper/[id]`, `/` (require authentication)

**Logic:**
1. Get session from Supabase (via `getSession()` in request context)
2. If no session AND route is protected → redirect `/login`
3. If session exists AND on `/login` → redirect `/`
4. Otherwise → proceed

**Imports:** `@supabase/ssr` for server-side session validation

### 3. Login Page (`app/login/page.tsx`)

**Purpose:** Email input form for magic link login

**Content:**
- Header: "🔐 Đăng Nhập"
- Form with email input field
- "Đăng Nhập" button
- Message after submit: "Kiểm tra email của bạn để nhận magic link"
- Auto-redirect to `/` if already authenticated

**Logic:**
```typescript
async function handleLogin(email: string) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  if (error) show_error_message(error.message);
  else show_message("Kiểm tra email...");
}
```

**Styling:**
- Centered form, gradient background (same as existing pages)
- Dark mode support
- Responsive (mobile-friendly)

### 4. Callback Page (`app/auth/callback/page.tsx`)

**Purpose:** Handle magic link callback, exchange code for session

**Content:**
- Loading indicator initially
- On success: redirect to `/`
- On error: show error message + "Quay lại" link to `/login`

**Logic:**
```typescript
// On mount:
const code = searchParams.get('code');
if (code) {
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (!error) redirect('/');
  else show_error_message("Link không hợp lệ hoặc đã hết hạn");
}
```

**Error Message:** "Link không hợp lệ hoặc đã hết hạn. Vui lòng [Quay lại] và đăng nhập lại."

### 5. Header Component (`components/header.tsx`)

**Purpose:** Display authentication status and user info

**Client Component:** `'use client'`

**Content:**
- Logo/title on left
- Right side:
  - If `isLoading`: spinner
  - If `user` (authenticated): email + "Đăng xuất" button (gray text)
  - If not `user`: "Đăng Nhập" link (blue text)

**Logic:**
```typescript
'use client';
const { user, isLoading, signOut } = useAuth();

return (
  <header className="bg-white dark:bg-slate-800 shadow sticky top-0">
    <div className="flex justify-between items-center p-4 max-w-6xl mx-auto">
      <h1>🔍 Radar nghiên cứu</h1>
      <div>
        {isLoading ? <Spinner /> : (
          user ? (
            <>
              <span>{user.email}</span>
              <button onClick={signOut}>Đăng xuất</button>
            </>
          ) : (
            <Link href="/login">Đăng nhập</Link>
          )
        )}
      </div>
    </div>
  </header>
);
```

**Styling:**
- Fixed/sticky top position
- Flexbox layout (space-between)
- Dark mode: bg-white → dark:bg-slate-800, text colors inverted
- Responsive: stack vertically on mobile if needed

### 6. Updated RootLayout (`app/layout.tsx`)

**Changes:**
- Wrap `<body>` content with `<AuthProvider>`
- Import Header component
- Add `<Header />` component inside body (before children)
- Keep existing fonts and metadata

**Result:**
```typescript
<html>
  <body>
    <AuthProvider>
      <Header />
      {children}
    </AuthProvider>
  </body>
</html>
```

---

## Data Flow

**Login:**
1. User: enters email at `/login`
2. LoginPage: calls `signInWithOtp(email, redirectTo: /auth/callback)`
3. Supabase: sends email with magic link
4. User: clicks link (redirects to `/auth/callback?code=ABC`)
5. CallbackPage: calls `exchangeCodeForSession(code)`
6. Supabase: validates code, creates session
7. AuthContext: listens to `onAuthStateChange`, updates `user` state
8. Redirect: `/auth/callback` → `/`
9. Middleware: checks session, allows (now authenticated)
10. Homepage: loads, Header shows user email + logout button

**Logout:**
1. User: clicks "Đăng xuất" button in Header
2. Header: calls `signOut()`
3. Supabase: clears session
4. AuthContext: detects auth state change, updates to `user = null`
5. Redirect: triggered by middleware or explicit redirect, go to `/login`

**Session Persistence (Page Refresh):**
1. User refreshes page (F5)
2. Middleware: checks Supabase for active session
3. If session exists: allow request
4. AuthContext: on mount, restores user from Supabase `getSession()`
5. Header: re-renders with email + logout button

---

## Error Handling & Edge Cases

| Scenario | Handling |
|----------|----------|
| Invalid/expired magic link | Show error: "Link không hợp lệ hoặc đã hết hạn" + "Quay lại" link |
| Email not found in system | Supabase auto-creates user (auto sign-up) |
| Session expired during session | Middleware detects, redirects to `/login` |
| User accesses `/` without login | Middleware redirects to `/login` |
| User accesses `/login` while logged in | Middleware redirects to `/` |
| User refreshes page | Session persists via Supabase `getSession()` |
| Network error during login | Show error message, user can retry |

---

## Success Criteria

✅ Login page displays email input form and "Đăng nhập" button
✅ Magic link email sent successfully to provided email address
✅ Clicking magic link in email redirects to `/auth/callback?code=...`
✅ Callback page exchanges code for session automatically
✅ After successful login, user redirected to `/` (homepage)
✅ Header displays user email when authenticated
✅ Header shows "Đăng xuất" button (clickable)
✅ Clicking "Đăng xuất" signs out user and redirects to `/login`
✅ Header shows "Đăng nhập" link when not authenticated
✅ Middleware blocks unauthenticated access to `/` and `/paper/[id]`
✅ Middleware allows unauthenticated access to `/login` and `/auth/callback`
✅ Session persists on page refresh (F5)
✅ Error messages display gracefully (invalid link, network errors)
✅ Responsive design on mobile/tablet/desktop
✅ Full dark mode support
✅ No breaking changes to existing features (papers, filters, detail pages)

---

## Global Constraints

- Email magic link via Supabase Auth (no passwords)
- Auto sign-up (first-time users created automatically)
- Session stored in browser (via Supabase cookies)
- Middleware validates server-side before rendering protected routes
- Header always visible (sticky top)
- Dark mode via Tailwind `dark:` classes
- Vietnamese text for all UI strings
- No additional dependencies beyond Supabase already in use
