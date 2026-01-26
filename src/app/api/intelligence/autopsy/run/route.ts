import { NextResponse } from 'next/server';
import { AutopsyEngine } from '@/lib/intelligence/autopsy/engine';
import { FunnelDocument } from '@/types/funnel';

/**
 * Handler para execução do diagnóstico forense de funil.
 * POST /api/intelligence/autopsy/run
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { brandId, funnelId, steps, averageTicket } = body;

    if (!brandId || !funnelId || !steps) {
      return NextResponse.json(
        { error: 'Parâmetros obrigatórios ausentes (brandId, funnelId, steps).' },
        { status: 400 }
      );
    }

    // Executar o motor de diagnóstico
    const report = AutopsyEngine.analyzeFunnel(funnelId, steps, averageTicket || 0);

    // Nota: Em um cenário real, salvaríamos o report no Firestore aqui.
    // brands/{brandId}/autopsy_reports/{report.id}

    return NextResponse.json({
      success: true,
      report
    });
  } catch (error: any) {
    console.error('[AUTOPSY_API_ERROR]:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar o diagnóstico.' },
      { status: 500 }
    );
  }
}
