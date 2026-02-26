/**
 * Tier System — R4.4
 * Defines subscription tiers, limits, and feature access.
 */

// ============================================
// TIER TYPES
// ============================================

export type Tier = 'free' | 'trial' | 'starter' | 'pro' | 'agency';

export type Feature =
  // Navigation sections
  | 'intelligence'
  | 'execution'
  | 'vault'
  | 'integrations'
  // Specific features
  | 'party_mode'
  | 'offer_lab'
  | 'ab_testing'
  | 'ltv_analysis'
  | 'deep_research'
  | 'journey_tracking'
  | 'creative_analysis'
  | 'personalization'
  | 'attribution'
  | 'cross_channel'
  | 'campaigns'
  | 'ads_traffic'
  | 'social'
  | 'social_inbox'
  | 'automation'
  | 'calendar'
  | 'approvals'
  // Chat modes
  | 'chat_funnel'
  | 'chat_copy'
  | 'chat_social'
  | 'chat_ads'
  | 'chat_design';

// ============================================
// TIER LIMITS
// ============================================

export interface TierLimits {
  maxBrands: number;
  maxActiveFunnels: number;
  maxAssetsTotal: number;
  maxRagDocs: number;
  maxRagSizeMB: number;
  monthlyQueries: number;
  monthlyPageForensics: number;
  chatModes: number; // Number of chat modes available (general + N)
}

export const TIER_LIMITS: Record<Tier, TierLimits> = {
  free: {
    maxBrands: 1,
    maxActiveFunnels: 1,
    maxAssetsTotal: 10,
    maxRagDocs: 1,
    maxRagSizeMB: 1,
    monthlyQueries: 10,
    monthlyPageForensics: 1,
    chatModes: 1, // Only general
  },
  trial: {
    // Trial = Pro features for 14 days
    maxBrands: 3,
    maxActiveFunnels: 5,
    maxAssetsTotal: 500,
    maxRagDocs: 20,
    maxRagSizeMB: 25,
    monthlyQueries: 300,
    monthlyPageForensics: 15,
    chatModes: 6, // All modes
  },
  starter: {
    maxBrands: 1,
    maxActiveFunnels: 1,
    maxAssetsTotal: 50,
    maxRagDocs: 3,
    maxRagSizeMB: 5,
    monthlyQueries: 50,
    monthlyPageForensics: 3,
    chatModes: 2, // General + 1
  },
  pro: {
    maxBrands: 3,
    maxActiveFunnels: 5,
    maxAssetsTotal: 500,
    maxRagDocs: 20,
    maxRagSizeMB: 25,
    monthlyQueries: 300,
    monthlyPageForensics: 15,
    chatModes: 6, // All modes
  },
  agency: {
    maxBrands: 100, // "10+" in UI, but 100 for practical limit
    maxActiveFunnels: 1000, // Unlimited = high number
    maxAssetsTotal: 10000, // Unlimited
    maxRagDocs: 1000, // Unlimited
    maxRagSizeMB: 1000, // Unlimited
    monthlyQueries: 1000,
    monthlyPageForensics: 1000, // Unlimited
    chatModes: 6, // All modes
  },
};

// ============================================
// TIER FEATURES
// ============================================

/**
 * Features enabled for each tier.
 * Trial inherits from Pro.
 */
export const TIER_FEATURES: Record<Tier, Feature[]> = {
  free: [],
  trial: [
    // All Pro features during trial
    'intelligence',
    'execution',
    'vault',
    'integrations',
    'party_mode',
    'offer_lab',
    'ab_testing',
    'ltv_analysis',
    'deep_research',
    'journey_tracking',
    'creative_analysis',
    'personalization',
    'attribution',
    'cross_channel',
    'campaigns',
    'ads_traffic',
    'social',
    'social_inbox',
    'automation',
    'calendar',
    'approvals',
    'chat_funnel',
    'chat_copy',
    'chat_social',
    'chat_ads',
    'chat_design',
  ],
  starter: [
    // Starter only gets one extra chat mode (user's choice)
    'chat_funnel', // Default extra mode for starter
  ],
  pro: [
    'intelligence',
    'execution',
    'vault',
    'integrations',
    'party_mode',
    'offer_lab',
    'ab_testing',
    'ltv_analysis',
    'deep_research',
    'journey_tracking',
    'creative_analysis',
    'personalization',
    'attribution',
    'cross_channel',
    'campaigns',
    'ads_traffic',
    'social',
    'social_inbox',
    'automation',
    'calendar',
    'approvals',
    'chat_funnel',
    'chat_copy',
    'chat_social',
    'chat_ads',
    'chat_design',
  ],
  agency: [
    'intelligence',
    'execution',
    'vault',
    'integrations',
    'party_mode',
    'offer_lab',
    'ab_testing',
    'ltv_analysis',
    'deep_research',
    'journey_tracking',
    'creative_analysis',
    'personalization',
    'attribution',
    'cross_channel',
    'campaigns',
    'ads_traffic',
    'social',
    'social_inbox',
    'automation',
    'calendar',
    'approvals',
    'chat_funnel',
    'chat_copy',
    'chat_social',
    'chat_ads',
    'chat_design',
  ],
};

// ============================================
// TIER ORDER (for comparison)
// ============================================

export const TIER_ORDER: Record<Tier, number> = {
  free: 0,
  trial: 2, // Trial = Pro level access
  starter: 1,
  pro: 2,
  agency: 3,
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if a tier has access to a specific feature.
 */
export function checkTierAccess(tier: Tier, feature: Feature): boolean {
  return TIER_FEATURES[tier].includes(feature);
}

/**
 * Check if userTier meets or exceeds requiredTier.
 */
export function meetsMinimumTier(userTier: Tier, requiredTier: Tier): boolean {
  return TIER_ORDER[userTier] >= TIER_ORDER[requiredTier];
}

/**
 * Get limits for a specific tier.
 */
export function getTierLimits(tier: Tier): TierLimits {
  return TIER_LIMITS[tier];
}

/**
 * Get the display name for a tier.
 */
export function getTierDisplayName(tier: Tier): string {
  const names: Record<Tier, string> = {
    free: 'Free',
    trial: 'Trial',
    starter: 'Starter',
    pro: 'Pro',
    agency: 'Agency',
  };
  return names[tier];
}

/**
 * Get the minimum tier required for a feature.
 * Returns 'starter' as default if feature is not locked.
 */
export function getMinimumTierForFeature(feature: Feature): Tier {
  // Features available in starter
  const starterFeatures: Feature[] = ['chat_funnel'];
  if (starterFeatures.includes(feature)) return 'starter';

  // All other features require pro
  return 'pro';
}

/**
 * Check if a trial has expired.
 */
export function isTrialExpired(trialExpiresAt: Date | null): boolean {
  if (!trialExpiresAt) return false;
  return new Date() > trialExpiresAt;
}

/**
 * Calculate days remaining in trial.
 */
export function getTrialDaysRemaining(trialExpiresAt: Date | null): number {
  if (!trialExpiresAt) return 0;
  const now = new Date();
  const diff = trialExpiresAt.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}
