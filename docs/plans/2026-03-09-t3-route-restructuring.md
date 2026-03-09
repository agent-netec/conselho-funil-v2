# T3 — Route Restructuring Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Move all protected routes into an `(app)/` route group with a shared auth layout, simplifying AppShell from a monolithic router to a thin provider wrapper.

**Architecture:** Create `(app)/layout.tsx` that handles auth guard, sidebar, loading screen, and email verification banner. Move 17 protected route directories into `(app)/`. Dashboard moves from root `page.tsx` to `(app)/dashboard/page.tsx`. Middleware rewrites "/" to /dashboard for auth users. AppShell becomes providers-only.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Firebase Auth (client-side), framer-motion (loading/transitions)

---

## Pre-flight: Current Route Map

Protected routes to move into (app)/:
```
assets/ automation/ brand-hub/ brands/ campaigns/ chat/ content/
funnels/ integrations/ intelligence/ library/ performance/
settings/ social/ social-inbox/ strategy/ vault/
```

Routes that stay at root:
```
(auth)/       — login, signup (already grouped)
(public)/     — terms, privacy, cookies, refund, pricing (already grouped)
(agency)/     — agency dashboard (already grouped)
api/          — API routes
auth/         — Firebase action links
shared/       — public shared pages
landing/      — public landing (middleware rewrites "/" here)
welcome/      — redirects to "/" (stays outside (app) — no sidebar)
```

---

### Task 1: Create (app)/ route group with layout

**Files:**
- Create: `app/src/app/(app)/layout.tsx`

**Step 1: Create the auth layout**

This layout extracts the protected-page logic from AppShell: auth guard, loading screen, sidebar, email banner, background effects, and page transitions.

```tsx
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Sidebar } from '@/components/layout/sidebar';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useSidebarStore } from '@/lib/stores/sidebar-store';
import { sendEmailVerification } from '@/lib/firebase/auth';
import { EmailVerificationBanner } from '@/components/auth/email-verification-banner';

function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#09090b]">
      <div className="absolute inset-0 bg-dot-pattern opacity-30" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(230,180,71,0.1),transparent)]" />
      <motion.div
        className="flex flex-col items-center gap-6"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="relative">
          <div className="absolute inset-0 rounded-2xl bg-[#E6B447]/20 blur-2xl animate-pulse" />
          <motion.div
            className="relative flex h-16 w-16 items-center justify-center"
            animate={{
              filter: [
                'drop-shadow(0 0 8px rgba(230, 180, 71, 0.2))',
                'drop-shadow(0 0 20px rgba(230, 180, 71, 0.5))',
                'drop-shadow(0 0 8px rgba(230, 180, 71, 0.2))',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Image
              src="/logo-mkthoney-icon.svg"
              alt="MKTHONEY"
              width={40}
              height={57}
              priority
              className="h-14 w-auto"
            />
          </motion.div>
        </div>
        <div className="w-32 h-1 rounded-full bg-zinc-800 overflow-hidden">
          <motion.div
            className="h-full bg-[#E6B447] rounded-full"
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
        <p className="text-sm text-zinc-500 font-medium">Carregando...</p>
      </motion.div>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuthStore();

  const user = auth?.user;
  const isLoading = auth?.isLoading;
  const isInitialized = auth?.isInitialized;
  const isFirebaseAvailable = !((auth as any)?._isMock);

  useEffect(() => {
    if (!isInitialized) return;
    if (!user) {
      router.push('/login');
    }
  }, [user, isInitialized, router]);

  // Loading while auth initializes
  if (!isInitialized || isLoading) {
    return <LoadingScreen />;
  }

  // Firebase not configured
  if (!isFirebaseAvailable) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white p-6 text-center">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-8 max-w-md">
          <h1 className="text-xl font-bold text-red-500 mb-4">Erro de Configuracao</h1>
          <p className="text-zinc-400 mb-6">
            O Firebase nao foi inicializado corretamente. Verifique se as variaveis de ambiente (API Keys) estao configuradas no painel da Vercel.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  // Not authenticated — redirect already triggered in useEffect
  if (!user) return <LoadingScreen />;

  const showVerificationBanner = !user.emailVerified;
  const { isExpanded } = useSidebarStore();

  return (
    <div className="min-h-screen bg-background selection:bg-[#E6B447]/20 selection:text-[#F5E8CE]">
      {/* Background effects */}
      <div className="fixed inset-0 bg-dot-pattern opacity-[0.15] pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(230,180,71,0.08),transparent)] pointer-events-none" />

      <Sidebar />

      <main
        className={cn(
          'min-h-screen relative flex flex-col transition-[margin-left] duration-200 ease-in-out',
          isExpanded ? 'md:ml-[256px]' : 'md:ml-[72px]'
        )}
      >
        {showVerificationBanner && (
          <EmailVerificationBanner onResend={() => sendEmailVerification(user)} />
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="flex-1"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
```

**Step 2: Verify file created**

Run: `ls app/src/app/\(app\)/layout.tsx`
Expected: file exists

---

### Task 2: Move dashboard to (app)/dashboard/

**Files:**
- Move: `app/src/app/page.tsx` -> `app/src/app/(app)/dashboard/page.tsx`
- Delete: `app/src/app/page.tsx`

**Step 1: Create directory and move file**

```bash
mkdir -p app/src/app/\(app\)/dashboard
mv app/src/app/page.tsx app/src/app/\(app\)/dashboard/page.tsx
```

**Step 2: Verify no import breakage**

All imports use `@/` alias (resolves from `src/`), so no path changes needed inside the file.

Run: `grep -n "from '\.\." app/src/app/\(app\)/dashboard/page.tsx`
Expected: no output (no relative imports)

---

### Task 3: Move all 17 protected route directories into (app)/

**Step 1: Move directories one by one**

```bash
cd app/src/app

# Single-level routes
for dir in assets automation brand-hub brands campaigns chat content funnels integrations library social social-inbox vault; do
  mv "$dir" "(app)/$dir"
done

# Routes with sub-routes
mv intelligence "(app)/intelligence"
mv performance "(app)/performance"
mv settings "(app)/settings"
mv strategy "(app)/strategy"
```

**Step 2: Verify all moves succeeded**

Run: `ls app/src/app/\(app\)/`
Expected: 17 directories + dashboard/ + layout.tsx

Run: `ls app/src/app/\(app\)/intelligence/`
Expected: page.tsx + subdirectories (ab-testing, attribution, creative, discovery, journey, ltv, offer-lab, personalization, predict, predictive, research)

Run: `ls app/src/app/\(app\)/settings/`
Expected: page.tsx + billing/ + tracking/ + integrations/

**Step 3: Verify no route directories left at root that should have been moved**

Run: `ls -d app/src/app/*/`
Expected: only (agency)/ (app)/ (auth)/ (public)/ api/ auth/ landing/ shared/ welcome/

---

### Task 4: Update middleware

**Files:**
- Modify: `app/src/middleware.ts`

**Step 1: Update "/" auth handling**

Change: "/" with auth cookie -> rewrite to /dashboard (was: NextResponse.next())

```typescript
// Replace the entire middleware file with:

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * MKTHONEY Middleware — T3
 *
 * Routing strategy:
 * - "/" without auth -> REWRITE to /landing (user sees "/" in URL bar)
 * - "/" with auth    -> REWRITE to /dashboard (user sees "/" in URL bar)
 * - "/landing"       -> 301 redirect to "/" (SEO canonical)
 * - "/dashboard"     -> 301 redirect to "/" (SEO canonical, prevent direct access)
 * - Public routes    -> pass through
 * - Protected routes -> pass through ((app)/layout.tsx handles auth)
 */

const PUBLIC_ROUTES = [
  '/login',
  '/signup',
  '/terms',
  '/privacy',
  '/cookies',
  '/refund',
  '/pricing',
  '/shared',
  '/auth',
];

const SKIP_ROUTES = [
  '/api/',
  '/_next/',
  '/favicon.ico',
  '/images/',
  '/fonts/',
  '/og-image.png',
  '/robots.txt',
  '/sitemap.xml',
];

const AUTH_COOKIE = 'mkthoney_auth';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (SKIP_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  const hasAuthCookie = request.cookies.has(AUTH_COOKIE);

  // "/" -> rewrite to landing (non-auth) or dashboard (auth)
  if (pathname === '/') {
    if (hasAuthCookie) {
      return NextResponse.rewrite(new URL('/dashboard', request.url));
    }
    return NextResponse.rewrite(new URL('/landing', request.url));
  }

  // "/landing" -> 301 redirect to "/"
  if (pathname === '/landing') {
    return NextResponse.redirect(new URL('/', request.url), 301);
  }

  // "/dashboard" direct access -> 301 redirect to "/"
  if (pathname === '/dashboard') {
    return NextResponse.redirect(new URL('/', request.url), 301);
  }

  // Public routes pass through
  const isPublicRoute = PUBLIC_ROUTES.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // All other routes: (app)/layout.tsx handles auth
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
```

**Step 2: Verify middleware compiles**

Run: `cd app && npx tsc --noEmit app/src/middleware.ts 2>&1 || echo "check build"`

---

### Task 5: Simplify AppShell

**Files:**
- Modify: `app/src/components/layout/app-shell.tsx`

**Step 1: Simplify to thin wrapper**

AppShell no longer needs: PUBLIC_PATHS, LoadingScreen, sidebar, auth redirect, email banner, Firebase error. All that is now in `(app)/layout.tsx`.

AppShell only handles:
- Public pages (landing, legal, pricing) -> render children directly
- Auth pages (login, signup) -> render with background effects
- Welcome page -> render with background effects
- Root "/" -> render children directly (middleware already rewrote to correct page)
- Everything else -> render children directly ((app)/layout.tsx handles chrome)

```tsx
'use client';

import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ToastNotifications } from '@/components/ui/toast-notifications';

interface AppShellProps {
  children: React.ReactNode;
}

const AUTH_PATHS = ['/login', '/signup'];

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  const isAuthPage = AUTH_PATHS.some(p => pathname?.startsWith(p));
  const isWelcomePage = pathname === '/welcome';

  // Auth & welcome pages — background effects, no sidebar
  if (isAuthPage || isWelcomePage) {
    return (
      <div className="min-h-screen bg-[#09090b]">
        <div className="fixed inset-0 bg-dot-pattern opacity-30 pointer-events-none" />
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(230,180,71,0.08),transparent)] pointer-events-none" />
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
        <ToastNotifications />
      </div>
    );
  }

  // All other pages — render directly
  // Protected pages get chrome from (app)/layout.tsx
  // Public pages (landing, legal) render without chrome
  return (
    <>
      {children}
      <ToastNotifications />
    </>
  );
}
```

**Step 2: Verify removed imports don't break**

Check that removed imports (Sidebar, useAuthStore, useSidebarStore, etc.) are not referenced.

---

### Task 6: Build verification

**Step 1: Run full build**

```bash
cd app && npm run build
```

Expected: all pages compile, zero errors. Check:
- `/landing` — static page
- `/dashboard` — dynamic (inside (app)/)
- `/chat`, `/funnels`, etc. — all inside (app)/
- `/login`, `/signup` — inside (auth)/
- `/welcome` — at root level

**Step 2: Verify route list**

In build output, verify:
- `/(app)/dashboard` appears (or just `/dashboard`)
- `/(app)/chat` appears (URL is `/chat`)
- `/landing` appears
- No duplicate "/" routes

---

### Task 7: Smoke test middleware rewrites

**Step 1: Test non-auth at "/"**

1. Open browser (incognito / no auth cookie)
2. Navigate to `http://localhost:3001/`
3. Expected: see landing page, URL bar shows "/"

**Step 2: Test auth at "/"**

1. Log in to the app
2. Navigate to `http://localhost:3001/`
3. Expected: see dashboard with sidebar, URL bar shows "/"

**Step 3: Test "/dashboard" redirect**

1. Navigate to `http://localhost:3001/dashboard`
2. Expected: 301 redirect to "/"

**Step 4: Test "/landing" redirect**

1. Navigate to `http://localhost:3001/landing`
2. Expected: 301 redirect to "/"

**Step 5: Test protected route**

1. While logged in, navigate to `/chat`
2. Expected: chat page with sidebar
3. While logged out, navigate to `/chat`
4. Expected: redirect to `/login`

---

### Task 8: Commit

**Step 1: Stage and commit**

```bash
git add app/src/app/\(app\)/ app/src/middleware.ts app/src/components/layout/app-shell.tsx
git add -u  # pick up deleted root page.tsx
git commit -m "refactor(T3): restructure routes into (app)/ group with auth layout

- Move 17 protected route directories into (app)/ route group
- Create (app)/layout.tsx with auth guard, sidebar, loading, email banner
- Move dashboard from root page.tsx to (app)/dashboard/page.tsx
- Simplify AppShell to thin wrapper (no more auth/sidebar logic)
- Update middleware: auth '/' rewrites to /dashboard, non-auth to /landing
- Add /dashboard -> '/' redirect (SEO canonical)"
```

---

## Rollback Plan

If build fails or routes break:

```bash
git checkout -- app/src/
```

All changes are filesystem moves + 3 file edits (layout, middleware, app-shell). No data or API changes. Fully reversible.

---

## Post-Implementation Checklist

- [ ] Non-auth at "/" sees landing
- [ ] Auth at "/" sees dashboard with sidebar
- [ ] "/landing" -> 301 to "/"
- [ ] "/dashboard" -> 301 to "/"
- [ ] All protected routes show sidebar
- [ ] Welcome page shows without sidebar
- [ ] Login/signup show background effects
- [ ] Loading screen appears while auth initializes
- [ ] Email verification banner shows when needed
- [ ] Build passes
- [ ] No broken imports
