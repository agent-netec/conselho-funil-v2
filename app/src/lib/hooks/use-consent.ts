'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { LocalConsent } from '@/types/consent';
import { CONSENT_VERSION } from '@/types/consent';

const LOCAL_STORAGE_KEY = 'mkthoney_cookie_consent';

export interface ConsentState {
  analytics: boolean;
  marketing: boolean;
  hasConsented: boolean;
  isLoading: boolean;
}

export interface UseConsentReturn extends ConsentState {
  acceptAll: () => Promise<void>;
  rejectOptional: () => Promise<void>;
  saveCustom: (analytics: boolean, marketing: boolean) => Promise<void>;
}

/**
 * Hook for managing cookie consent.
 * - For logged users: stores in Firestore users/{uid}/consent
 * - For non-logged users: stores in localStorage
 * - Syncs localStorage to Firestore on login
 */
export function useConsent(): UseConsentReturn {
  const { user, isLoading: authLoading } = useAuthStore();
  const [state, setState] = useState<ConsentState>({
    analytics: false,
    marketing: false,
    hasConsented: false,
    isLoading: true,
  });

  // Load consent on mount
  useEffect(() => {
    if (authLoading) return;

    const loadConsent = async () => {
      if (user) {
        // Logged user: check Firestore first
        const consentRef = doc(db, 'users', user.uid, 'consent', 'current');
        const snap = await getDoc(consentRef);

        if (snap.exists()) {
          const data = snap.data();
          setState({
            analytics: data.analytics ?? false,
            marketing: data.marketing ?? false,
            hasConsented: true,
            isLoading: false,
          });
          return;
        }

        // Check if there's localStorage consent to migrate
        const local = getLocalConsent();
        if (local) {
          // Migrate to Firestore
          await saveToFirestore(user.uid, local.analytics, local.marketing);
          clearLocalConsent();
          setState({
            analytics: local.analytics,
            marketing: local.marketing,
            hasConsented: true,
            isLoading: false,
          });
          return;
        }

        // No consent found
        setState(prev => ({ ...prev, hasConsented: false, isLoading: false }));
      } else {
        // Non-logged user: check localStorage
        const local = getLocalConsent();
        if (local) {
          setState({
            analytics: local.analytics,
            marketing: local.marketing,
            hasConsented: true,
            isLoading: false,
          });
        } else {
          setState(prev => ({ ...prev, hasConsented: false, isLoading: false }));
        }
      }
    };

    loadConsent();
  }, [user, authLoading]);

  const saveConsent = useCallback(async (analytics: boolean, marketing: boolean) => {
    if (user) {
      await saveToFirestore(user.uid, analytics, marketing);
    } else {
      saveLocalConsent(analytics, marketing);
    }
    setState({
      analytics,
      marketing,
      hasConsented: true,
      isLoading: false,
    });
  }, [user]);

  const acceptAll = useCallback(async () => {
    await saveConsent(true, true);
  }, [saveConsent]);

  const rejectOptional = useCallback(async () => {
    await saveConsent(false, false);
  }, [saveConsent]);

  const saveCustom = useCallback(async (analytics: boolean, marketing: boolean) => {
    await saveConsent(analytics, marketing);
  }, [saveConsent]);

  return {
    ...state,
    acceptAll,
    rejectOptional,
    saveCustom,
  };
}

// ============================================
// Firestore helpers
// ============================================

async function saveToFirestore(userId: string, analytics: boolean, marketing: boolean) {
  const consentRef = doc(db, 'users', userId, 'consent', 'current');
  await setDoc(consentRef, {
    essential: true,
    analytics,
    marketing,
    acceptedAt: Timestamp.now(),
    version: CONSENT_VERSION,
  });

  // Dispatch custom event for same-tab listeners (e.g., PostHog provider)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('consent-updated'));
  }
}

// ============================================
// LocalStorage helpers
// ============================================

function getLocalConsent(): LocalConsent | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as LocalConsent;
  } catch {
    return null;
  }
}

function saveLocalConsent(analytics: boolean, marketing: boolean) {
  if (typeof window === 'undefined') return;

  const consent: LocalConsent = {
    analytics,
    marketing,
    acceptedAt: new Date().toISOString(),
    version: CONSENT_VERSION,
  };
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(consent));

  // Dispatch custom event for same-tab listeners (e.g., PostHog provider)
  window.dispatchEvent(new CustomEvent('consent-updated'));
}

function clearLocalConsent() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(LOCAL_STORAGE_KEY);
}
