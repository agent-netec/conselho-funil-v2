# T3 — Route Restructuring Design

## Goal

Restructure the Next.js route hierarchy to use route groups, moving all protected routes into `(app)/` with a shared auth layout. Simplify AppShell from a monolithic router to a thin provider wrapper.

## Current State

- Root `page.tsx` = dashboard
- `/landing/page.tsx` = landing page
- Middleware rewrites "/" to /landing for non-auth, passes through for auth
- AppShell handles: auth redirect, loading screen, sidebar toggle, email banner, public/auth/welcome detection
- ~15 protected route dirs scattered at root level
- Route groups exist for (auth), (public), (agency) but NOT for protected routes

## Target State

```
app/src/app/
  layout.tsx              <- Root: providers only (thin AppShell)
  not-found.tsx           <- 404 (stays)
  landing/page.tsx        <- Landing (middleware: "/" non-auth -> /landing)

  (app)/
    layout.tsx            <- Auth guard + sidebar + loading + email banner
    dashboard/page.tsx    <- Dashboard (middleware: "/" auth -> /dashboard)
    assets/
    automation/
    brand-hub/
    brands/
    campaigns/
    chat/
    content/
    funnels/
    integrations/
    intelligence/
    library/
    performance/
    settings/
    social/
    social-inbox/
    strategy/
    vault/

  (auth)/                 <- Already exists (login, signup)
  (public)/               <- Already exists (terms, privacy, cookies, refund, pricing)
  (agency)/               <- Already exists
  welcome/                <- Outside (app) — needs auth but no sidebar
  shared/                 <- Public shared pages
  auth/                   <- Firebase action links
  api/                    <- API routes
```

## Key Decisions

1. **Dashboard at `(app)/dashboard/page.tsx`** — resolves to /dashboard URL. Middleware rewrites "/" to /dashboard for auth users. No conflict with landing.

2. **Welcome stays outside (app)/** — needs auth but no sidebar. Handles its own auth check minimally.

3. **AppShell becomes thin** — only wraps providers (AuthProvider, PostHogProvider, BrandingProvider, Toaster, CookieBanner). All layout/auth logic moves to `(app)/layout.tsx`.

4. **Middleware updated** — "/" auth -> rewrite /dashboard (was: pass through to root page.tsx). Everything else stays the same.

5. **Landing stays at /landing/** — middleware rewrite for "/" non-auth continues as-is. No file move needed.

## Components Changed

### `(app)/layout.tsx` (NEW)
- Client component ('use client')
- Auth guard: redirect to /login if not authenticated
- Loading screen while auth initializes
- Sidebar rendering
- Email verification banner
- Background effects (dot pattern, radial gradient)
- AnimatePresence for page transitions

### `app-shell.tsx` (SIMPLIFIED)
- Remove: PUBLIC_PATHS, LoadingScreen, auth redirect, sidebar, email banner
- Keep: just renders children (providers are in root layout.tsx)
- Could potentially be removed entirely if providers move to root layout directly

### `middleware.ts` (UPDATED)
- "/" with auth -> rewrite to /dashboard (was: NextResponse.next())
- Remove /landing from any special handling if not needed
- PUBLIC_ROUTES updated to reflect new structure

### Root `page.tsx` (DELETED)
- Dashboard content moves to `(app)/dashboard/page.tsx`
- No more root page.tsx

## Files Moved (no content changes)

15 directories move from `app/src/app/X/` to `app/src/app/(app)/X/`:
- assets, automation, brand-hub, brands, campaigns, chat, content
- funnels, integrations, intelligence, library, performance
- settings, social, social-inbox, strategy, vault

## Files NOT Moved

- api/ (API routes, no layout needed)
- auth/ (Firebase action links, public)
- shared/ (public shared pages)
- welcome/ (auth but no sidebar)
- landing/ (public, middleware handles)
- (auth)/, (public)/, (agency)/ (already grouped)

## Acceptance Criteria

- [ ] Non-auth at "/" sees landing page
- [ ] Auth at "/" sees dashboard
- [ ] "/landing" redirects to "/" (301)
- [ ] All protected routes work with sidebar
- [ ] Welcome page works (auth, no sidebar)
- [ ] Login/signup redirect to "/" when already auth
- [ ] Email verification banner shows on protected pages
- [ ] Loading screen shows while auth initializes
- [ ] PUBLIC_PATHS in AppShell aligned with middleware
- [ ] Build passes
- [ ] No import breakage (all use @/ alias)

## Risks

- **Low:** Moving directories could break relative imports. Mitigated: project uses @/ alias exclusively.
- **Low:** (app)/layout.tsx client boundary might affect server components inside. Mitigated: pages inside are already client or use their own boundaries.
- **Medium:** welcome page auth check needs to be self-contained after AppShell simplification.
