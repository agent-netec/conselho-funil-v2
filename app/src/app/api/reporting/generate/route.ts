export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { reportingEngine } from '@/lib/reporting/engine';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { handleSecurityError } from '@/lib/utils/api-security';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';

/**
 * POST /api/reporting/generate
 * Gera um insight de IA baseado em métricas fornecidas.
 * Sprint 08.6: Aberto a qualquer usuário autenticado com acesso à marca (não mais admin-only).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { metrics, context } = body;

    if (!metrics || !context) {
      return createApiError(400, 'Parâmetros metrics e context são obrigatórios');
    }

    // Verify user has access to the brand (replaces verifyAdminRole)
    const brandId = context?.brandId;
    if (!brandId || brandId === 'TEST') {
      return createApiError(400, 'brandId válido é obrigatório no context');
    }
    await requireBrandAccess(request, brandId);

    // Execute the reporting engine
    const report = await reportingEngine.generateReport(metrics, context);

    return createApiSuccess(report);
  } catch (error) {
    console.error('[API Reporting] Error:', error);
    return handleSecurityError(error);
  }
}
