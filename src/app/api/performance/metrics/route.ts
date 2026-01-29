import { NextRequest, NextResponse } from 'next/server';
import { Timestamp } from 'firebase/firestore';
import { PerformanceMetric } from '@/types/performance';

/**
 * GET /api/performance/metrics
 * Retorna métricas agregadas para o dashboard.
 * Query Params: brandId, startDate, endDate, period, mock?
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const brandId = searchParams.get('brandId');
    const mock = searchParams.get('mock') === 'true';
    const period = (searchParams.get('period') || 'daily') as 'hourly' | 'daily' | 'weekly';

    if (!brandId) {
      return NextResponse.json({
        success: false, message: 'brandId é obrigatório.'
      }, { status: 400 });
    }

    if (mock) {
      const metrics = generateMockMetrics(brandId, period);
      return NextResponse.json({
        success: true,
        data: metrics
      }, { status: 200 });
    }

    // TODO: Implementar busca real no Firestore/APIs externas
    return NextResponse.json({
      success: false,
      message: 'Busca real de métricas ainda não implementada. Use mock=true.'
    }, { status: 501 });

  } catch (error) {
    console.error('[API Performance Metrics] Erro:', error);
    return NextResponse.json({
      success: false, message: 'Erro interno ao buscar métricas.'
    }, { status: 500 });
  }
}

/**
 * Gera dados randômicos para o dashboard (Victor UI)
 */
function generateMockMetrics(brandId: string, period: string): PerformanceMetric[] {
  const sources: ('meta' | 'google' | 'organic' | 'aggregated')[] = ['meta', 'google', 'organic', 'aggregated'];
  const results: PerformanceMetric[] = [];
  const now = new Date();

  sources.forEach(source => {
    // Gerar 7 pontos de dados (ex: última semana)
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      const baseValue = source === 'aggregated' ? 2000 : 500;
      const variance = Math.random() * 0.4 + 0.8; // 80% a 120%

      results.push({
        id: `metric_${brandId}_${source}_${date.getTime()}`,
        brandId,
        source,
        timestamp: Timestamp.fromDate(date),
        period: period as any,
        data: {
          spend: source === 'organic' ? 0 : baseValue * variance,
          revenue: baseValue * 3 * variance,
          roas: source === 'organic' ? 0 : 3 * variance,
          cac: source === 'organic' ? 0 : 15 * variance,
          ctr: 0.02 * variance,
          cpc: 0.8 * variance,
          conversions: 50 * variance
        }
      });
    }
  });

  return results;
}
