import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * MKTHONEY Middleware — T3
 *
 * Routing strategy:
 * - "/" without auth → REWRITE to /landing (user sees "/" in URL bar)
 * - "/" with auth    → pass through to dashboard (page.tsx)
 * - "/landing"       → 301 redirect to "/" (SEO canonical)
 * - Public routes    → pass through
 * - Protected routes → pass through (AppShell handles client-side auth)
 */

// Routes that are always public (no auth needed)
const PUBLIC_ROUTES = [
  '/login',
  '/signup',
  '/terms',
  '/privacy',
  '/cookies',
  '/refund',
  '/pricing',
  '/shared',
];

// Routes that should not be processed by middleware
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

// Cookie name for auth presence detection
const AUTH_COOKIE = 'mkthoney_auth';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for API routes, static files, etc.
  if (SKIP_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  const hasAuthCookie = request.cookies.has(AUTH_COOKIE);

  // "/" → rewrite to landing (non-auth) or pass through to dashboard (auth)
  if (pathname === '/') {
    if (!hasAuthCookie) {
      // REWRITE (not redirect) — user sees "/" in URL bar, content is from /landing
      return NextResponse.rewrite(new URL('/landing', request.url));
    }
    return NextResponse.next();
  }

  // "/landing" → redirect to "/" for backwards compat and SEO canonical
  if (pathname === '/landing') {
    return NextResponse.redirect(new URL('/', request.url), 301);
  }

  // Public routes pass through
  const isPublicRoute = PUBLIC_ROUTES.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // All other routes: let AppShell handle client-side auth
  return NextResponse.next();
}

export const config = {
  // Match all routes except static files
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
