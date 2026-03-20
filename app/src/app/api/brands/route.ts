export const dynamic = 'force-dynamic';
/**
 * POST /api/brands
 * Creates a new brand document using Admin SDK (bypasses Firestore Security Rules).
 * Fixes client-side auth race condition where request.auth is null despite user being authenticated.
 */

import { NextRequest } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { requireUser } from '@/lib/auth/brand-guard';
import { ApiError, handleSecurityError } from '@/lib/utils/api-security';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { Tier, TIER_LIMITS } from '@/lib/tier-system';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const userId = await requireUser(request);

    // Sprint 02: Enforce brand limit per tier
    const adminDb = getAdminFirestore();
    const userSnap = await adminDb.collection('users').doc(userId).get();
    const userData = userSnap.exists ? (userSnap.data() as Record<string, any>) : {};
    const userTier = (userData.tier as Tier) || 'trial';
    let effectiveTier: Tier = userTier;
    if (userTier === 'trial') {
      const trialExp = userData.trialExpiresAt;
      if (trialExp) {
        const expDate = typeof trialExp.toDate === 'function' ? trialExp.toDate() : new Date(trialExp);
        effectiveTier = expDate < new Date() ? 'free' : 'pro';
      } else {
        effectiveTier = 'pro';
      }
    }
    const maxBrands = TIER_LIMITS[effectiveTier].maxBrands;
    const existingBrands = await adminDb.collection('brands').where('userId', '==', userId).count().get();
    const brandCount = existingBrands.data().count;
    if (brandCount >= maxBrands) {
      return createApiError(403, `Limite de marcas atingido (${maxBrands}). Faça upgrade para criar mais marcas.`);
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return createApiError(400, 'Request body required');
    }

    const { name, vertical, positioning, voiceTone, audience, offer } = body;

    if (!name || !vertical || !positioning || !voiceTone || !audience || !offer) {
      return createApiError(400, 'Missing required brand fields');
    }

    const now = Timestamp.now();

    const brandData = {
      userId,
      name,
      vertical,
      positioning,
      voiceTone,
      audience,
      offer,
      createdAt: now,
      updatedAt: now,
    };

    const brandRef = await adminDb.collection('brands').add(brandData);

    return createApiSuccess({ brandId: brandRef.id });
  } catch (error) {
    if (error instanceof ApiError) {
      return handleSecurityError(error);
    }
    console.error('[POST /api/brands] Error:', error);
    return createApiError(500, 'Failed to create brand');
  }
}
