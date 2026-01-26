import { NextRequest, NextResponse } from 'next/server';
import { reportingEngine } from '@/lib/reporting/engine';
import { verifyAdminRole, handleSecurityError } from '@/lib/utils/api-security';

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
      return NextResponse.json(
        { error: 'Parâmetros metrics e context são obrigatórios' },
        { status: 400 }
      );
    }

    // 2. Execução do Engine
    const report = await reportingEngine.generateReport(metrics, context);

    // 3. Retorno
    return NextResponse.json(report);
  } catch (error) {
    console.error('[API Reporting] Error:', error);
    return handleSecurityError(error);
  }
}
