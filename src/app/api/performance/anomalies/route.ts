import { NextRequest, NextResponse } from 'next/server';
import { SentryEngine } from '@/lib/performance/sentry-engine';
import { PerformanceAnomaly } from '@/types/performance';
import { Timestamp } from 'firebase/firestore';

/**
 * GET /api/performance/anomalies
 * Lista anomalias detectadas para uma marca.
 * Query Params: brandId, status?, limit?, mock?
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const brandId = searchParams.get('brandId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const mock = searchParams.get('mock') === 'true';

    if (!brandId) {
      return NextResponse.json({
        success: false,
        message: 'brandId é obrigatório.'
      }, { status: 400 });
    }

    if (mock) {
      const mockAnomalies = generateMockAnomalies(brandId);
      return NextResponse.json({
        success: true,
        data: mockAnomalies
      }, { status: 200 });
    }

    const anomalies = await SentryEngine.listAnomalies(brandId, status || undefined, limit);

    return NextResponse.json({
      success: true,
      data: anomalies
    }, { status: 200 });

  } catch (error) {
    console.error('[API Performance Anomalies] Erro:', error);
    return NextResponse.json({
      success: false,
      message: 'Erro interno ao buscar anomalias.'
    }, { status: 500 });
  }
}

/**
 * Gera anomalias mockadas para desenvolvimento da UI (Victor/Beto).
 */
function generateMockAnomalies(brandId: string): PerformanceAnomaly[] {
  const now = Timestamp.now();
  return [
    {
      id: 'anomaly_mock_1',
      brandId,
      metricType: 'roas',
      severity: 'critical',
      detectedAt: now,
      valueAtDetection: 1.2,
      expectedValue: 4.5,
      deviationPercentage: 73.3,
      status: 'new',
      aiInsight: {
        explanation: 'O ROAS caiu drasticamente devido a um aumento súbito no CPC no Meta Ads.',
        suggestedAction: 'Pausar campanhas com ROAS abaixo de 1.0 e revisar criativos.'
      }
    },
    {
      id: 'anomaly_mock_2',
      brandId,
      metricType: 'cac',
      severity: 'warning',
      detectedAt: now,
      valueAtDetection: 45.0,
      expectedValue: 30.0,
      deviationPercentage: 50.0,
      status: 'investigating'
    }
  ];
}
