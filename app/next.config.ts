import type { NextConfig } from "next";
import withBundleAnalyzer from '@next/bundle-analyzer';

const nextConfig: NextConfig = {
  /* config options here */
  async redirects() {
    return [
      {
        source: '/campaign',
        destination: '/campaigns',
        permanent: true,
      },
      {
        source: '/campaign/:id',
        destination: '/campaigns/:id',
        permanent: true,
      },
      {
        source: '/analytics',
        destination: '/performance',
        permanent: true,
      },
      {
        source: '/strategy/autopsy',
        destination: '/funnels',
        permanent: false,
      },
    ];
  },

  // R-1.4: Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://apis.google.com https://www.googletagmanager.com https://cdn.jsdelivr.net",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https: http:",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.firebase.google.com https://*.firebaseapp.com https://*.cloudfunctions.net https://*.pinecone.io https://generativelanguage.googleapis.com https://*.posthog.com https://*.sentry.io wss://*.firebaseio.com",
              "frame-src 'self' https://*.firebaseapp.com https://accounts.google.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },

  // R-2.2: Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.jsdelivr.net' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: '*.googleusercontent.com' },
    ],
  },

  poweredByHeader: false,
  distDir: '.next',
  typescript: {
    ignoreBuildErrors: false,
  },
};

// PERF-6: Bundle analyzer — run with ANALYZE=true npm run build
const analyzer = withBundleAnalyzer({ enabled: process.env.ANALYZE === 'true' });
export default analyzer(nextConfig);
