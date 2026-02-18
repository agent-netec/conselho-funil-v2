export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { ApiError, handleSecurityError } from '@/lib/utils/api-security';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { decryptSensitiveFields } from '@/lib/utils/encryption';
import type { JourneyLead } from '@/types/journey';

/**
 * GET /api/intelligence/journey/recent?brandId=XXX&limit=20
 * Returns recent leads with status and last event info.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get('brandId');
    const limitCount = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);

    if (!brandId) {
      return createApiError(400, 'brandId é obrigatório');
    }

    await requireBrandAccess(request, brandId);

    // Query leads by brandId, ordered by most recently updated
    const leadsRef = collection(db, 'leads');
    const q = query(
      leadsRef,
      where('brandId', '==', brandId),
      orderBy('updatedAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    const leads: Array<{
      id: string;
      maskedEmail: string;
      status: string;
      metrics: JourneyLead['metrics'];
      createdAt: unknown;
      updatedAt: unknown;
    }> = [];

    for (const doc of snapshot.docs) {
      const data = doc.data() as JourneyLead;
      const decrypted = decryptSensitiveFields(data);

      // Mask email: j***@gmail.com
      const email = decrypted.pii?.email || 'unknown';
      const maskedEmail = maskEmail(email);

      leads.push({
        id: doc.id,
        maskedEmail,
        status: data.status || 'lead',
        metrics: data.metrics || { totalLtv: 0, transactionCount: 0, averageTicket: 0 },
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      });
    }

    return createApiSuccess({
      leads,
      total: leads.length,
      hasMore: snapshot.docs.length === limitCount,
    });
  } catch (error) {
    console.error('[Journey Recent Error]:', error);
    if (error instanceof ApiError) {
      return handleSecurityError(error);
    }
    return createApiError(500, 'Erro interno ao buscar leads recentes.');
  }
}

function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '***@***.com';
  const [local, domain] = email.split('@');
  if (local.length <= 1) return `*@${domain}`;
  return `${local[0]}${'*'.repeat(Math.min(local.length - 1, 3))}@${domain}`;
}
