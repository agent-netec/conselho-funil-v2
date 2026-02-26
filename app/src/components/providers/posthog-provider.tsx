'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { useEffect, useState } from 'react';
import type { LocalConsent } from '@/types/consent';

const LOCAL_STORAGE_KEY = 'mkthoney_cookie_consent';

/**
 * Checks if analytics consent was given.
 * For LGPD compliance: PostHog only initializes if user opted-in.
 */
function hasAnalyticsConsent(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!stored) return false;
    const consent = JSON.parse(stored) as LocalConsent;
    return consent.analytics === true;
  } catch {
    return false;
  }
}

/**
 * PostHog provider with LGPD-compliant consent check.
 * Only initializes PostHog if user has consented to analytics cookies.
 */
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

    // LGPD: Only initialize if analytics consent was given
    if (key && hasAnalyticsConsent()) {
      posthog.init(key, {
        api_host: host,
        person_profiles: 'identified_only',
        capture_pageview: true,
        capture_pageleave: true,
        autocapture: true,
      });
      setInitialized(true);
    }

    // Listen for consent changes (user accepts cookies after page load)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === LOCAL_STORAGE_KEY && !initialized && key) {
        if (hasAnalyticsConsent()) {
          posthog.init(key, {
            api_host: host,
            person_profiles: 'identified_only',
            capture_pageview: true,
            capture_pageleave: true,
            autocapture: true,
          });
          setInitialized(true);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [initialized]);

  // Also check for consent changes in same tab (custom event)
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

    const handleConsentUpdate = () => {
      if (!initialized && key && hasAnalyticsConsent()) {
        posthog.init(key, {
          api_host: host,
          person_profiles: 'identified_only',
          capture_pageview: true,
          capture_pageleave: true,
          autocapture: true,
        });
        setInitialized(true);
      }
    };

    window.addEventListener('consent-updated', handleConsentUpdate);
    return () => window.removeEventListener('consent-updated', handleConsentUpdate);
  }, [initialized]);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}


