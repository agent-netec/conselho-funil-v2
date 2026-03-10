/**
 * GET /api/admin/stats — Dashboard summary statistics
 */

import { NextRequest } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { verifyAdminRole, ApiError } from '@/lib/utils/api-security';
import { createApiSuccess, createApiError } from '@/lib/utils/api-response';
import { Timestamp } from 'firebase-admin/firestore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await verifyAdminRole(request);

    const db = getAdminFirestore();
    const usersRef = db.collection('users');
    const snapshot = await usersRef.get();

    const now = Date.now();
    const msPerDay = 86_400_000;
    const sevenDaysAgo = now - 7 * msPerDay;
    const thirtyDaysAgo = now - 30 * msPerDay;

    let totalUsers = 0;
    let signupsLast7 = 0;
    let signupsLast30 = 0;
    const byTier: Record<string, number> = {};

    snapshot.forEach(doc => {
      totalUsers++;
      const data = doc.data();

      // Count by tier
      const tier = data.tier || 'free';
      byTier[tier] = (byTier[tier] || 0) + 1;

      // Count recent signups
      const createdAt = data.createdAt as Timestamp | undefined;
      if (createdAt) {
        const createdMs = createdAt.toMillis();
        if (createdMs >= sevenDaysAgo) signupsLast7++;
        if (createdMs >= thirtyDaysAgo) signupsLast30++;
      }
    });

    return createApiSuccess({
      totalUsers,
      byTier,
      signupsLast7,
      signupsLast30,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return createApiError(error.status, error.message);
    }
    console.error('[Admin/Stats] Error:', error);
    return createApiError(500, 'Erro ao buscar estatisticas');
  }
}
