/**
 * Middleware wrapper for tier-gated API routes — R4.4
 * Verifies user tier before processing requests.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { Tier, Feature, checkTierAccess, meetsMinimumTier, isTrialExpired as checkTrialExpired } from '@/lib/tier-system';

// ============================================
// TYPES
// ============================================

export interface TierCheckContext {
  uid: string;
  tier: Tier;
  effectiveTier: Tier;
}

export type TierCheckedHandler = (
  request: NextRequest,
  context: TierCheckContext
) => Promise<NextResponse>;

// ============================================
// MIDDLEWARE
// ============================================

/**
 * Wrap an API route handler with tier verification.
 * Returns 403 if user doesn't meet the required tier.
 *
 * @param handler - The route handler to wrap
 * @param requiredTier - Minimum tier required to access this route
 * @returns Wrapped handler that checks tier before executing
 *
 * @example
 * ```ts
 * export const POST = withTierCheck(
 *   async (request, context) => {
 *     // context.uid, context.tier, context.effectiveTier available
 *     return NextResponse.json({ success: true });
 *   },
 *   'pro'
 * );
 * ```
 */
export function withTierCheck(
  handler: TierCheckedHandler,
  requiredTier: Tier
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Get UID from request (assumes auth middleware already ran)
      const uid = request.headers.get('x-user-id');

      if (!uid) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      // Get user document
      const userDoc = await getAdminFirestore().collection('users').doc(uid).get();

      if (!userDoc.exists) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      const userData = userDoc.data();
      const tier: Tier = userData?.tier || 'trial';

      // Check trial expiration
      let effectiveTier: Tier = tier;
      if (tier === 'trial' && userData?.trialExpiresAt) {
        const trialExpiry = userData.trialExpiresAt.toDate();
        if (checkTrialExpired(trialExpiry)) {
          effectiveTier = 'free';
        }
      }

      // Check if user meets minimum tier
      if (!meetsMinimumTier(effectiveTier, requiredTier)) {
        return NextResponse.json(
          {
            error: 'Upgrade required',
            message: `This feature requires ${requiredTier} tier or higher`,
            currentTier: effectiveTier,
            requiredTier,
          },
          { status: 403 }
        );
      }

      // Tier check passed, execute handler
      return handler(request, { uid, tier, effectiveTier });
    } catch (error) {
      console.error('[withTierCheck] Error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Wrap an API route handler with feature verification.
 * Returns 403 if user doesn't have access to the required feature.
 *
 * @param handler - The route handler to wrap
 * @param requiredFeature - Feature required to access this route
 * @returns Wrapped handler that checks feature access before executing
 */
export function withFeatureCheck(
  handler: TierCheckedHandler,
  requiredFeature: Feature
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const uid = request.headers.get('x-user-id');

      if (!uid) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      const userDoc = await getAdminFirestore().collection('users').doc(uid).get();

      if (!userDoc.exists) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      const userData = userDoc.data();
      const tier: Tier = userData?.tier || 'trial';

      let effectiveTier: Tier = tier;
      if (tier === 'trial' && userData?.trialExpiresAt) {
        const trialExpiry = userData.trialExpiresAt.toDate();
        if (checkTrialExpired(trialExpiry)) {
          effectiveTier = 'free';
        }
      }

      if (!checkTierAccess(effectiveTier, requiredFeature)) {
        return NextResponse.json(
          {
            error: 'Feature not available',
            message: `This feature is not available in your current plan`,
            currentTier: effectiveTier,
            requiredFeature,
          },
          { status: 403 }
        );
      }

      return handler(request, { uid, tier, effectiveTier });
    } catch (error) {
      console.error('[withFeatureCheck] Error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}
