/**
 * Tier System — R4.4
 * Defines subscription tiers, limits, and feature access.
 */

// ============================================
// TIER TYPES
// ============================================

export type Tier = 'free' | 'trial' | 'starter' | 'pro' | 'agency';

export type Feature =
  // Core (Free tier)
  | 'dashboard'
  | 'chat_general'
  | 'brands'
  | 'funnels'
  | 'settings'
  | 'billing'
  // Starter tier
  | 'campaigns_basic'
  | 'social_quick'
  | 'calendar_basic'
  | 'chat_funnel'
  | 'chat_copy'
  | 'chat_social'
  // Pro tier
  | 'intelligence'
  | 'execution'
  | 'vault'
  | 'integrations'
  | 'party_mode'
  | 'offer_lab'
  | 'ab_testing'
  | 'ltv_analysis'
  | 'deep_research'
  | 'journey_tracking'
  | 'creative_analysis'
  | 'campaigns'
  | 'ads_traffic'
  | 'social'
  | 'social_inbox'
  | 'automation'
  | 'calendar'
  | 'approvals'
  | 'chat_ads'
  | 'chat_design'
  | 'design_generate'
  // Agency tier
  | 'personalization'
  | 'attribution'
  | 'cross_channel'
  | 'performance';

// ============================================
// TIER LIMITS
// ============================================

export interface TierLimits {
  maxBrands: number;
  maxActiveFunnels: number;
  maxMonthlyCredits: number;
  maxAssetsTotal: number;
  maxRagDocs: number;
  maxRagSizeMB: number;
  /** Daily chat limit for Free tier (0 = unlimited) */
  dailyChatLimit: number;
  /** Daily funnel creation limit for Free tier (0 = unlimited) */
  dailyFunnelLimit: number;
  /** Max campaigns per brand per day for Starter (0 = unlimited) */
  maxCampaignsPerBrandPerDay: number;
}

export const TIER_LIMITS: Record<Tier, TierLimits> = {
  free: {
    maxBrands: 1,
    maxActiveFunnels: 1,
    maxMonthlyCredits: 0,
    maxAssetsTotal: 10,
    maxRagDocs: 1,
    maxRagSizeMB: 1,
    dailyChatLimit: 1,
    dailyFunnelLimit: 1,
    maxCampaignsPerBrandPerDay: 0,
  },
  trial: {
    // Trial = Pro features for 7 days
    maxBrands: 5,
    maxActiveFunnels: 10,
    maxMonthlyCredits: 500,
    maxAssetsTotal: 500,
    maxRagDocs: 20,
    maxRagSizeMB: 25,
    dailyChatLimit: 0,
    dailyFunnelLimit: 0,
    maxCampaignsPerBrandPerDay: 0,
  },
  starter: {
    maxBrands: 3,
    maxActiveFunnels: 3,
    maxMonthlyCredits: 100,
    maxAssetsTotal: 100,
    maxRagDocs: 5,
    maxRagSizeMB: 10,
    dailyChatLimit: 0,
    dailyFunnelLimit: 0,
    maxCampaignsPerBrandPerDay: 1,
  },
  pro: {
    maxBrands: 5,
    maxActiveFunnels: 10,
    maxMonthlyCredits: 500,
    maxAssetsTotal: 500,
    maxRagDocs: 20,
    maxRagSizeMB: 25,
    dailyChatLimit: 0,
    dailyFunnelLimit: 0,
    maxCampaignsPerBrandPerDay: 0,
  },
  agency: {
    maxBrands: 25,
    maxActiveFunnels: 999,
    maxMonthlyCredits: 2000,
    maxAssetsTotal: 10000,
    maxRagDocs: 1000,
    maxRagSizeMB: 1000,
    dailyChatLimit: 0,
    dailyFunnelLimit: 0,
    maxCampaignsPerBrandPerDay: 0,
  },
};

// ============================================
// TIER FEATURES
// ============================================

/**
 * Features enabled for each tier.
 * Trial inherits from Pro.
 */
/**
 * Features enabled for each tier.
 * Use '*' sentinel in the array to mean "all features" (checked in checkTierAccess).
 */
const ALL_PRO_FEATURES: Feature[] = [
  // Core
  'dashboard', 'chat_general', 'brands', 'funnels', 'settings', 'billing',
  // Starter
  'campaigns_basic', 'social_quick', 'calendar_basic',
  'chat_funnel', 'chat_copy', 'chat_social',
  // Pro
  'intelligence', 'execution', 'vault', 'integrations',
  'party_mode', 'offer_lab', 'ab_testing', 'ltv_analysis',
  'deep_research', 'journey_tracking', 'creative_analysis',
  'campaigns', 'ads_traffic', 'social', 'social_inbox',
  'automation', 'calendar', 'approvals',
  'chat_ads', 'chat_design', 'design_generate',
];

const ALL_AGENCY_FEATURES: Feature[] = [
  ...ALL_PRO_FEATURES,
  'personalization', 'attribution', 'cross_channel', 'performance',
];

export const TIER_FEATURES: Record<Tier, Feature[]> = {
  free: [
    'dashboard', 'chat_general', 'brands', 'funnels', 'settings', 'billing',
  ],
  trial: ALL_PRO_FEATURES,
  starter: [
    // Core
    'dashboard', 'chat_general', 'brands', 'funnels', 'settings', 'billing',
    // Starter-specific
    'campaigns_basic', 'social_quick', 'calendar_basic',
    'chat_funnel', 'chat_copy', 'chat_social',
  ],
  pro: ALL_PRO_FEATURES,
  agency: ALL_AGENCY_FEATURES,
};

// ============================================
// TIER ORDER (for comparison)
// ============================================

export const TIER_ORDER: Record<Tier, number> = {
  free: 0,
  starter: 1,
  trial: 2, // Trial = Pro level access
  pro: 2,
  agency: 3,
};

// ============================================
// TIER PRICES (BRL)
// ============================================

export const TIER_PRICES = {
  starter: { monthly: 147, annual: 117 },
  pro:     { monthly: 497, annual: 397 },
  agency:  { monthly: 997, annual: 797 },
} as const;

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
 * Checks TIER_FEATURES from lowest tier upward.
 */
export function getMinimumTierForFeature(feature: Feature): Tier {
  if (TIER_FEATURES.free.includes(feature)) return 'free';
  if (TIER_FEATURES.starter.includes(feature)) return 'starter';
  if (TIER_FEATURES.pro.includes(feature)) return 'pro';
  return 'agency';
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
