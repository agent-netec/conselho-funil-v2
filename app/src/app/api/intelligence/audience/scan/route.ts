import { NextRequest, NextResponse } from 'next/server';
import { AudienceIntelligenceEngine } from '@/lib/intelligence/personalization/engine';

/**
 * @fileoverview API Route para disparar o Audience Scan (ST-29.1)
 * POST /api/intelligence/audience/scan
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { brandId, leadLimit } = body;

    if (!brandId) {
      return NextResponse.json({ error: 'brandId é obrigatório' }, { status: 400 });
    }

    const scan = await AudienceIntelligenceEngine.runDeepScan(brandId, leadLimit || 100);

    return NextResponse.json({ 
      success: true, 
      scanId: scan.id,
      persona: scan.persona,
      propensity: scan.propensity
    });

  } catch (error: any) {
    console.error('[API Audience Scan] Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Erro interno ao processar scan' 
    }, { status: 500 });
  }
}
