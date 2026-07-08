# Supabase Magic Link Authentication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement email magic link authentication via Supabase Auth with protected dashboard routes, login page, and authenticated header.

**Architecture:** AuthContext provides centralized auth state via React Context and useAuth hook. Middleware validates sessions server-side before loading protected routes. LoginPage collects email and triggers `signInWithOtp()`. CallbackPage exchanges magic link code for session. Header displays email/logout when authenticated or login link when not. RootLayout wraps app with AuthProvider and includes Header.

**Tech Stack:** Next.js 15 server components, React Context, Supabase Auth, TypeScript, Tailwind CSS with dark mode

## Global Constraints

- Magic link authentication via Supabase Auth only (no passwords)
- Auto sign-up: first-time users created automatically
- Session storage: Supabase cookies in browser
- Middleware validates server-side before rendering protected routes
- Vietnamese text for all UI strings (Đăng nhập, Đăng xuất, etc.)
- Full dark mode support via Tailwind `dark:` classes
- No breaking changes to existing paper list, filters, detail pages
- Email redirect for magic link: `${window.location.origin}/auth/callback`

---

## Task 1: Create AuthContext with useAuth Hook

**Files:**
- Create: `nckh-dashboard/lib/auth-context.tsx`

**Interfaces:**
- Produces: `AuthProvider` component, `useAuth()` hook returning `{ user: User | null, isLoading: boolean, signOut: () => Promise<void> }`
- User type: `{ id: string; email: string }`

- [ ] **Step 1: Create the AuthContext file**

Create `nckh-dashboard/lib/auth-context.tsx`:

```typescript
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';

export type User = {
  id: string;
  email: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user?.email) {
        setUser({
          id: session.user.id,
          email: session.user.email,
        });
      }
      setIsLoading(false);
    };

    getSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.email) {
        setUser({
          id: session.user.id,
          email: session.user.email,
        });
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signOut: handleSignOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `npm run build`
Expected: Build succeeds with no TypeScript errors

- [ ] **Step 3: Commit**

```bash
git add nckh-dashboard/lib/auth-context.tsx
git commit -m "feat: create AuthContext with useAuth hook for auth state management"
```

---

## Task 2: Create LoginPage with Email Form

**Files:**
- Create: `nckh-dashboard/app/login/page.tsx`

**Interfaces:**
- Consumes: `supabase` from `lib/supabase.ts`, `useAuth()` hook, `useRouter` from `next/navigation`
- Produces: LoginPage server component

- [ ] **Step 1: Create the login page**

Create `nckh-dashboard/app/login/page.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const { user } = useAuth();

  // Redirect if already logged in
  if (user) {
    router.push('/');
    return null;
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage('Kiểm tra email của bạn để nhận magic link');
      setEmail('');
    }
    setIsLoading(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 text-center">
            🔐 Đăng Nhập
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
            Nhập email để nhận magic link
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Đang gửi...' : 'Đăng Nhập'}
            </button>
          </form>

          {message && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded text-green-800 dark:text-green-200 text-sm">
              {message}
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded text-red-800 dark:text-red-200 text-sm">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `npm run build`
Expected: Build succeeds, `/login` route is recognized

- [ ] **Step 3: Test manually**

1. Dev server running: `npm run dev`
2. Navigate to http://localhost:3000/login
3. Verify login form displays with email input and button
4. Test with invalid input, verify error handling

- [ ] **Step 4: Commit**

```bash
git add nckh-dashboard/app/login/page.tsx
git commit -m "feat: create login page with email form for magic link"
```

---

## Task 3: Create CallbackPage to Handle Magic Link

**Files:**
- Create: `nckh-dashboard/app/auth/callback/page.tsx`

**Interfaces:**
- Consumes: `supabase` from `lib/supabase.ts`, `useSearchParams` and `useRouter` from `next/navigation`
- Produces: CallbackPage component handling magic link exchange

- [ ] **Step 1: Create the callback page**

Create `nckh-dashboard/app/auth/callback/page.tsx`:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function CallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function handleCallback() {
      try {
        const code = searchParams.get('code');

        if (!code) {
          setError('Không tìm thấy mã xác thực. Link có thể không hợp lệ.');
          setIsLoading(false);
          return;
        }

        // Exchange code for session
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          setError('Link không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.');
          setIsLoading(false);
          return;
        }

        // Success - redirect to home
        router.push('/');
      } catch (err) {
        setError('Đã xảy ra lỗi. Vui lòng thử lại.');
        setIsLoading(false);
      }
    }

    handleCallback();
  }, [searchParams, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Đang xác thực...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 text-center">
          <p className="text-4xl mb-4">❌</p>
          <p className="text-red-600 dark:text-red-400 mb-6">{error}</p>
          <a
            href="/login"
            className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium rounded-lg transition"
          >
            Quay lại
          </a>
        </div>
      </div>
    );
  }

  return null;
}
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `npm run build`
Expected: Build succeeds, `/auth/callback` route recognized

- [ ] **Step 3: Test manually**

1. Dev server running: `npm run dev`
2. Navigate to `/auth/callback?code=invalid` (simulate with fake code)
3. Verify error message shows
4. Verify "Quay lại" link to `/login` works

- [ ] **Step 4: Commit**

```bash
git add nckh-dashboard/app/auth/callback/page.tsx
git commit -m "feat: create callback page to handle magic link exchange"
```

---

## Task 4: Create Header Component

**Files:**
- Create: `nckh-dashboard/components/header.tsx`

**Interfaces:**
- Consumes: `useAuth()` hook returning `{ user, isLoading, signOut }`
- Produces: Header client component with responsive layout

- [ ] **Step 1: Create the header component**

Create `nckh-dashboard/components/header.tsx`:

```typescript
'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

export default function Header() {
  const { user, isLoading, signOut } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await signOut();
    router.push('/login');
  }

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-slate-800 shadow-md">
      <div className="max-w-6xl mx-auto px-8 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          🔍 Radar nghiên cứu
        </h1>

        <div className="flex items-center gap-4">
          {isLoading ? (
            <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 dark:border-blue-400"></div>
          ) : user ? (
            <>
              <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                {user.email}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition font-medium"
              >
                Đăng xuất
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition font-medium"
            >
              Đăng nhập
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `npm run build`
Expected: Build succeeds with no errors

- [ ] **Step 3: Commit**

```bash
git add nckh-dashboard/components/header.tsx
git commit -m "feat: create header with email display and logout button"
```

---

## Task 5: Create Middleware to Protect Routes

**Files:**
- Create: `nckh-dashboard/middleware.ts`

**Interfaces:**
- Consumes: Supabase client initialization, Next.js request context
- Produces: Middleware function protecting `/` and `/paper/[id]` routes

- [ ] **Step 1: Create middleware file**

Create `nckh-dashboard/middleware.ts` (at project root, same level as `nckh-dashboard/`):

```typescript
import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient, serialize } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const pathname = requestUrl.pathname;

  // Public routes - allow without auth
  const publicRoutes = ['/login', '/auth/callback'];
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Create Supabase client
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Check session
  const { data: { session }, error } = await supabase.auth.getSession();

  // If no session and trying to access protected route, redirect to login
  if (!session && !publicRoutes.some((route) => pathname.startsWith(route))) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // If session exists and trying to access login, redirect to home
  if (session && pathname.startsWith('/login')) {
    const homeUrl = new URL('/', request.url);
    return NextResponse.redirect(homeUrl);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `npm run build`
Expected: Build succeeds with no middleware errors

- [ ] **Step 3: Test middleware protection**

1. Dev server: `npm run dev`
2. Navigate to `/` without auth → should redirect to `/login`
3. Navigate to `/login` → should show login form
4. Verify `/auth/callback` is accessible publicly

- [ ] **Step 4: Commit**

```bash
git add middleware.ts
git commit -m "feat: create middleware to protect routes and handle auth redirects"
```

---

## Task 6: Update RootLayout to Integrate AuthProvider and Header

**Files:**
- Modify: `nckh-dashboard/app/layout.tsx`

**Interfaces:**
- Consumes: `AuthProvider` from `lib/auth-context.tsx`, `Header` from `components/header.tsx`
- Produces: Updated layout with auth integration

- [ ] **Step 1: Read the current layout**

File: `nckh-dashboard/app/layout.tsx`

Current structure has fonts and metadata. We need to:
1. Import AuthProvider and Header
2. Wrap body content with AuthProvider
3. Add Header component

- [ ] **Step 2: Update layout.tsx**

Replace `nckh-dashboard/app/layout.tsx`:

```typescript
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import Header from "@/components/header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "🔍 Radar nghiên cứu",
  description: "Theo dõi các bài báo nghiên cứu mới nhất",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white dark:bg-slate-900">
        <AuthProvider>
          <Header />
          <main className="flex-1">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Verify TypeScript compilation**

Run: `npm run build`
Expected: Build succeeds, no import errors

- [ ] **Step 4: Test integration**

1. Dev server: `npm run dev`
2. Navigate to `/login` → Header shows "Đăng nhập" link
3. Verify Header displays correctly at top of page

- [ ] **Step 5: Commit**

```bash
git add nckh-dashboard/app/layout.tsx
git commit -m "feat: integrate AuthProvider and Header into root layout"
```

---

## Task 7: Visual Testing and Success Criteria Verification

**Files:**
- None (verification only)

**Interfaces:**
- Consumes: All components from Tasks 1-6
- Produces: Test results and verification checklist

- [ ] **Step 1: Start dev server**

Run: `npm run dev`
Wait for "Local: http://localhost:3000"

- [ ] **Step 2: Test unauthenticated flow**

1. Navigate to http://localhost:3000
2. Verify redirected to `/login`
3. Verify login form shows: email input, "Đăng nhập" button
4. Enter email address, click "Đăng nhập"
5. Verify success message: "Kiểm tra email của bạn để nhận magic link"
6. Verify Header shows "Đăng nhập" link (top right)

- [ ] **Step 3: Test magic link flow**

1. Check email inbox for magic link from Supabase
2. Click magic link (simulated or real)
3. Verify callback page processes code
4. Verify automatic redirect to `/`
5. Verify session created and user logged in

- [ ] **Step 4: Test authenticated flow**

1. After login, verify Header shows user email + "Đăng xuất" button
2. Verify dashboard loads (papers grid, filters, etc.)
3. Verify `/paper/[id]` routes accessible
4. Refresh page (F5) → verify session persists, still logged in

- [ ] **Step 5: Test logout**

1. Click "Đăng xuất" button in Header
2. Verify redirected to `/login`
3. Verify session cleared
4. Navigate back to `/` → should redirect to `/login`

- [ ] **Step 6: Test route protection**

1. In new tab, navigate to `/` without logging in
2. Verify middleware redirects to `/login`
3. Verify `/auth/callback` is accessible
4. Navigate to `/login` while logged in → should redirect to `/`

- [ ] **Step 7: Test responsive design**

Use browser DevTools to test:
1. Mobile (375px): Header should display email/login on small screens
2. Tablet (768px): Header layout should adjust
3. Desktop (1280px): Header full layout

- [ ] **Step 8: Test dark mode**

1. Toggle dark mode in browser (or system settings)
2. Verify Header colors invert correctly
3. Verify login form has proper contrast in dark mode
4. Verify all text readable

- [ ] **Step 9: Test error handling**

1. Try accessing `/auth/callback?code=invalid`
2. Verify error message shows: "Link không hợp lệ hoặc đã hết hạn"
3. Verify "Quay lại" link to `/login` works

- [ ] **Step 10: Verify all 13 success criteria**

✅ Login page displays email input form and "Đăng nhập" button
✅ Magic link email sent successfully to provided email
✅ Clicking magic link redirects to `/auth/callback?code=...`
✅ Callback page exchanges code for session automatically
✅ After successful login, redirected to `/` (homepage)
✅ Header displays user email when authenticated
✅ Header shows "Đăng xuất" button (clickable)
✅ Clicking "Đăng xuất" signs out and redirects to `/login`
✅ Header shows "Đăng nhập" link when not authenticated
✅ Middleware blocks unauthenticated access to `/` and `/paper/[id]`
✅ Middleware allows public access to `/login` and `/auth/callback`
✅ Session persists on page refresh (F5)
✅ Error messages display gracefully (invalid link, network errors)

- [ ] **Step 11: Check console**

1. Open DevTools Console (F12)
2. Navigate through login flow
3. Verify no console errors (only warnings acceptable)

- [ ] **Step 12: Final commit**

```bash
git status  # Verify no uncommitted changes
git commit --allow-empty -m "test: verify auth implementation - all success criteria passing"
```

---

## Success Criteria (Verification Summary)

| Criterion | Status | Test Method |
|-----------|--------|-------------|
| Login page renders | ✅ | Navigate to `/login` |
| Email form input works | ✅ | Type email, submit form |
| Magic link email sent | ✅ | Check email inbox |
| Magic link callback works | ✅ | Click link, verify redirect |
| Session created after login | ✅ | Check auth state in Header |
| Header shows email | ✅ | Verify email displays after login |
| Logout button works | ✅ | Click logout, verify redirect |
| Session persists on refresh | ✅ | F5 page refresh, verify still logged in |
| Route protection (middleware) | ✅ | Try accessing `/` without auth |
| Public routes accessible | ✅ | Access `/login` and `/auth/callback` |
| Error handling for invalid link | ✅ | Test with fake code |
| Responsive design | ✅ | Test mobile/tablet/desktop |
| Dark mode support | ✅ | Toggle dark mode, verify colors |
| No console errors | ✅ | Check browser DevTools |

---

## Notes

- AuthContext uses Supabase's `onAuthStateChange()` to automatically update UI when session changes
- Middleware runs on every request, checking session before rendering protected routes
- LoginPage is a client component to use `useRouter` for navigation and form state
- CallbackPage exchanges code for session and redirects, completes auth flow
- Header is sticky/fixed at top for constant visibility
- Dark mode automatically applied via Tailwind's `dark:` classes based on system preference
- Session stored in Supabase cookies (automatic, no manual storage needed)
