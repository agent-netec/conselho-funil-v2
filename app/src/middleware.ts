import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * MKTHONEY Middleware — R5.2
 *
 * Handles routing between public and authenticated areas:
 * - "/" without auth → landing page
 * - "/" with auth → dashboard (pass through)
 * - Public routes: no auth required
 * - Protected routes: handled by client-side AppShell
 *
 * Auth detection uses a cookie set by the client on login.
 *
 * NOTE: middleware.ts is still the standard pattern in Next.js 16.x.
 * No migration needed. Re-evaluate if Next.js introduces a replacement API.
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
  '/landing',       // explicit landing page route
  '/shared',        // shared funnel pages
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

  // Check if this is a public route (always accessible)
  const isPublicRoute = PUBLIC_ROUTES.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Check for auth cookie (set by client on login)
  const hasAuthCookie = request.cookies.has(AUTH_COOKIE);

  // Root path "/" special handling
  if (pathname === '/') {
    if (!hasAuthCookie) {
      // Not authenticated → redirect to landing page
      // Note: Landing page will be created in R5.3
      // For now, redirect to /landing which will show the landing page
      const landingUrl = new URL('/landing', request.url);
      return NextResponse.redirect(landingUrl);
    }
    // Authenticated → let AppShell show the dashboard
    return NextResponse.next();
  }

  // All other routes: let AppShell handle client-side auth
  // This preserves the existing behavior where AppShell redirects
  // unauthenticated users to /login
  return NextResponse.next();
}

export const config = {
  // Match all routes except static files
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
