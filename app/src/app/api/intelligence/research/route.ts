export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest } from 'next/server';
import { ApiError, handleSecurityError } from '@/lib/utils/api-security';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { ResearchEngine } from '@/lib/intelligence/research/engine';
import { getAdminFirestore } from '@/lib/firebase/admin';
import type { ResearchDepth } from '@/types/research';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      brandId?: string;
      topic?: string;
      marketSegment?: string;
      competitors?: string[];
      depth?: ResearchDepth;
      templateId?: string;
      customUrls?: string[];
    };

    if (!body.brandId || !body.topic) {
      return createApiError(400, 'brandId e topic são obrigatórios');
    }

    const { brandId } = await requireBrandAccess(req, body.brandId);
    const dossier = await ResearchEngine.generateDossier({
      brandId,
      topic: body.topic,
      marketSegment: body.marketSegment,
      competitors: body.competitors,
      depth: body.depth ?? 'standard',
      templateId: body.templateId as any,
      customUrls: body.customUrls,
    });
    return createApiSuccess(dossier);
  } catch (error: unknown) {
    if (error instanceof ApiError) return handleSecurityError(error);
    return createApiError(500, 'Erro interno ao gerar research.');
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const brandId = searchParams.get('brandId');
    const limitParam = searchParams.get('limit');
    if (!brandId) {
      return createApiError(400, 'brandId é obrigatório');
    }

    const { brandId: safeBrandId } = await requireBrandAccess(req, brandId);
    const max = Number(limitParam ?? 20);
    const adminDb = getAdminFirestore();
    const snap = await adminDb
      .collection('brands')
      .doc(safeBrandId)
      .collection('research')
      .orderBy('generatedAt', 'desc')
      .limit(Number.isNaN(max) ? 20 : max)
      .get();
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return createApiSuccess(items);
  } catch (error: unknown) {
    if (error instanceof ApiError) return handleSecurityError(error);
    return createApiError(500, 'Erro interno ao listar research.');
  }
}
