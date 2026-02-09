export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { reportingEngine } from '@/lib/reporting/engine';
import { verifyAdminRole, handleSecurityError } from '@/lib/utils/api-security';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';

/**
 * POST /api/reporting/generate
 * Gera um insight de IA baseado em métricas fornecidas
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Segurança: Apenas admins podem disparar geração manual por enquanto
    await verifyAdminRole(request);

    const body = await request.json();
    const { metrics, context } = body;

    if (!metrics || !context) {
      return createApiError(400, 'Parâmetros metrics e context são obrigatórios');
    }

    // 2. Execução do Engine
    const report = await reportingEngine.generateReport(metrics, context);

    // 3. Retorno
    return createApiSuccess(report);
  } catch (error) {
    console.error('[API Reporting] Error:', error);
    return handleSecurityError(error);
  }
}
