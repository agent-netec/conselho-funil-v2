import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * MKTHONEY Middleware — T3
 *
 * Routing strategy:
 * - "/" without auth -> REWRITE to /landing (user sees "/" in URL bar)
 * - "/" with auth    -> REWRITE to /home (user sees "/" in URL bar)
 * - "/landing"       -> 301 redirect to "/" (SEO canonical)
 * - "/home"          -> 301 redirect to "/" (SEO canonical, prevent direct access)
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

  // "/" -> rewrite to dashboard (auth) or redirect to login (non-auth)
  if (pathname === '/') {
    if (hasAuthCookie) {
      return NextResponse.rewrite(new URL('/home', request.url));
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // "/landing" -> redirect to main landing page
  if (pathname === '/landing') {
    return NextResponse.redirect(new URL('https://www.mkthoney.com', request.url), 301);
  }

  // "/home" direct access -> redirect to "/"
  if (pathname === '/home') {
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
