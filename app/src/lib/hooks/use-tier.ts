'use client';

import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuthStore } from '@/lib/stores/auth-store';
import {
  Tier,
  Feature,
  TierLimits,
  TIER_LIMITS,
  checkTierAccess,
  meetsMinimumTier,
  getTierDisplayName,
  isTrialExpired,
  getTrialDaysRemaining,
} from '@/lib/tier-system';

// ============================================
// TYPES
// ============================================

export interface UseTierReturn {
  /** Current user tier */
  tier: Tier;
  /** Effective tier (considers trial expiration) */
  effectiveTier: Tier;
  /** Check if user can access a feature */
  canAccess: (feature: Feature) => boolean;
  /** Check if user meets minimum tier requirement */
  meetsMinimum: (requiredTier: Tier) => boolean;
  /** Current tier limits */
  limits: TierLimits;
  /** Usage stats (brands, funnels, assets, queries) */
  usage: TierUsage;
  /** Is the user on trial? */
  isTrial: boolean;
  /** Has the trial expired? */
  isTrialExpired: boolean;
  /** Days remaining in trial (0 if not on trial or expired) */
  trialDaysRemaining: number;
  /** Display name for current tier */
  tierDisplayName: string;
  /** Loading state */
  isLoading: boolean;
}

export interface TierUsage {
  brands: number;
  activeFunnels: number;
  totalAssets: number;
  ragDocs: number;
  monthlyQueries: number;
  monthlyPageForensics: number;
}

// ============================================
// HOOK
// ============================================

/**
 * Hook to access the current user's tier and permissions.
 * Reads tier from Firestore user document.
 */
export function useTier(): UseTierReturn {
  const { user } = useAuthStore();
  const [tier, setTier] = useState<Tier>('trial'); // Default to trial for new users
  const [trialExpiresAt, setTrialExpiresAt] = useState<Date | null>(null);
  const [usage, setUsage] = useState<TierUsage>({
    brands: 0,
    activeFunnels: 0,
    totalAssets: 0,
    ragDocs: 0,
    monthlyQueries: 0,
    monthlyPageForensics: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Subscribe to user document for tier updates
  useEffect(() => {
    if (!user?.uid) {
      setTier('trial');
      setIsLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, 'users', user.uid),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();

          // Read tier (default to 'trial' for existing users without tier field)
          const userTier = (data.tier as Tier) || 'trial';
          setTier(userTier);

          // Read trial expiration
          if (data.trialExpiresAt) {
            setTrialExpiresAt(data.trialExpiresAt.toDate());
          } else if (userTier === 'trial') {
            // If trial but no expiration, set default 14 days from now
            const defaultExpiry = new Date();
            defaultExpiry.setDate(defaultExpiry.getDate() + 14);
            setTrialExpiresAt(defaultExpiry);
          }

          // Read usage from user document (if tracked there)
          if (data.usage) {
            setUsage({
              brands: data.usage.brands || 0,
              activeFunnels: data.usage.activeFunnels || 0,
              totalAssets: data.usage.totalAssets || 0,
              ragDocs: data.usage.ragDocs || 0,
              monthlyQueries: data.usage.monthlyQueries || 0,
              monthlyPageForensics: data.usage.monthlyPageForensics || 0,
            });
          }
        }
        setIsLoading(false);
      },
      (error) => {
        // Firestore permission errors on listeners can happen during the auth race
        // condition window. The getIdToken() prime in auth-store should prevent this,
        // but if it still occurs, log as warning (not error) since tier defaults to trial.
        console.warn('[useTier] Listener permission error (auth race?):', error.message);
        setTier('trial');
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  // Calculate effective tier
  const isTrial = tier === 'trial';
  const trialExpired = isTrial && isTrialExpired(trialExpiresAt);
  const effectiveTier: Tier = trialExpired ? 'free' : tier;
  const trialDaysRemaining = isTrial ? getTrialDaysRemaining(trialExpiresAt) : 0;

  return {
    tier,
    effectiveTier,
    canAccess: (feature: Feature) => checkTierAccess(effectiveTier, feature),
    meetsMinimum: (requiredTier: Tier) => meetsMinimumTier(effectiveTier, requiredTier),
    limits: TIER_LIMITS[effectiveTier],
    usage,
    isTrial,
    isTrialExpired: trialExpired,
    trialDaysRemaining,
    tierDisplayName: getTierDisplayName(effectiveTier),
    isLoading,
  };
}
