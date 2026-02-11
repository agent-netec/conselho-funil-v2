export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { evaluateBrandRules } from '@/lib/automation/evaluate';

/**
 * POST /api/automation/evaluate
 * Avalia regras de automação de uma brand contra métricas reais.
 * Body: { brandId: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.brandId) {
      return createApiError(400, 'Missing required field: brandId');
    }

    await requireBrandAccess(req, body.brandId);

    const result = await evaluateBrandRules(body.brandId);

    return createApiSuccess({
      message: `Avaliação concluída para brand ${body.brandId}`,
      ...result,
    });
  } catch (error) {
    console.error('[Automation Evaluate API]:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = (error as { status?: number })?.status || 500;
    return createApiError(status, message);
  }
}
