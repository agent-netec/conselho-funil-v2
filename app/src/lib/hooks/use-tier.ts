'use client';

import { useEffect, useState, useCallback } from 'react';
import { doc, getDoc } from 'firebase/firestore';
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

export interface CreditInfo {
  monthlyCredits: number;
  creditsUsed: number;
  remaining: number;
  creditResetDate: Date | null;
  daysUntilReset: number;
}

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
  /** Monthly credit info (Sprint 02) */
  credits: CreditInfo;
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
  monthlyCreditsUsed: number;
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
  const [tier, setTier] = useState<Tier>('trial');
  const [trialExpiresAt, setTrialExpiresAt] = useState<Date | null>(null);
  const [usage, setUsage] = useState<TierUsage>({
    brands: 0,
    activeFunnels: 0,
    totalAssets: 0,
    ragDocs: 0,
    monthlyCreditsUsed: 0,
  });
  const [creditInfo, setCreditInfo] = useState<CreditInfo>({
    monthlyCredits: 0,
    creditsUsed: 0,
    remaining: 0,
    creditResetDate: null,
    daysUntilReset: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchTier = useCallback(async (retries = 0) => {
    if (!user?.uid) {
      setTier('trial');
      setIsLoading(false);
      return;
    }
    try {
      const snapshot = await getDoc(doc(db, 'users', user.uid));
      if (snapshot.exists()) {
        const data = snapshot.data();
        const userTier = (data.tier as Tier) || 'trial';
        setTier(userTier);
        if (data.trialExpiresAt) {
          setTrialExpiresAt(data.trialExpiresAt.toDate());
        } else if (userTier === 'trial') {
          const defaultExpiry = new Date();
          defaultExpiry.setDate(defaultExpiry.getDate() + 7);
          setTrialExpiresAt(defaultExpiry);
        }
        if (data.usage) {
          setUsage({
            brands: data.usage.brands || 0,
            activeFunnels: data.usage.activeFunnels || 0,
            totalAssets: data.usage.totalAssets || 0,
            ragDocs: data.usage.ragDocs || 0,
            monthlyCreditsUsed: data.usage.monthlyCreditsUsed || 0,
          });
        }

        // Sprint 02: Monthly credit info
        const monthly = data.monthlyCredits ?? TIER_LIMITS[userTier]?.maxMonthlyCredits ?? 0;
        const used = data.creditsUsed ?? 0;
        let resetDate: Date | null = null;
        let daysUntil = 0;
        if (data.creditResetDate) {
          resetDate = typeof data.creditResetDate.toDate === 'function'
            ? data.creditResetDate.toDate()
            : new Date(data.creditResetDate);
          daysUntil = Math.max(0, Math.ceil((resetDate!.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
        }
        setCreditInfo({
          monthlyCredits: monthly,
          creditsUsed: used,
          remaining: Math.max(0, monthly - used),
          creditResetDate: resetDate,
          daysUntilReset: daysUntil,
        });
      }
      setIsLoading(false);
    } catch (error: any) {
      if (error?.code === 'permission-denied' && retries < 4) {
        const delay = 300 * Math.pow(2, retries);
        setTimeout(() => fetchTier(retries + 1), delay);
      } else {
        console.warn('[useTier] Could not read tier, defaulting to trial:', error?.message);
        setTier('trial');
        setIsLoading(false);
      }
    }
  }, [user?.uid]);

  useEffect(() => {
    setIsLoading(true);
    fetchTier(0);
  }, [fetchTier]);

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
    credits: creditInfo,
    isTrial,
    isTrialExpired: trialExpired,
    trialDaysRemaining,
    tierDisplayName: getTierDisplayName(effectiveTier),
    isLoading,
  };
}
