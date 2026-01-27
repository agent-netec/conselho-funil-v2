import { NextRequest, NextResponse } from 'next/server';
import { SpyAgent } from '@/lib/agents/spy/spy-agent';
import { DossierGenerator } from '@/lib/agents/spy/dossier-generator';
import { getCompetitorProfile, updateCompetitorProfile, getCompetitorAssets } from '@/lib/firebase/intelligence';
import { Timestamp } from 'firebase/firestore';

/**
 * @api {post} /api/intelligence/spy/scan Executa o Spy Agent Scan ou Gera Dossiê
 */
export async function POST(req: NextRequest) {
  try {
    const { brandId, competitorId, action } = await req.json();

    if (!brandId || !competitorId) {
      return NextResponse.json(
        { error: 'brandId and competitorId are required' },
        { status: 400 }
      );
    }

    // 1. Buscar perfil do concorrente
    const competitor = await getCompetitorProfile(brandId, competitorId);

    if (!competitor) {
      return NextResponse.json(
        { error: 'Competitor not found' },
        { status: 404 }
      );
    }

    // 2. Executar Ação (Scan, Track ou Dossier)
    if (action === 'track') {
      const assets = await SpyAgent.trackFunnel(competitor);
      return NextResponse.json({
        message: 'Funnel tracking completed',
        assetsCount: assets.length,
        assets: assets.map(a => ({ id: a.id, url: a.url, pageType: a.pageType })),
      });
    }

    if (action === 'dossier') {
      // Buscar ativos para alimentar o dossiê
      const assets = await getCompetitorAssets(brandId, competitorId);
      const dossier = await DossierGenerator.generate(brandId, competitor, assets);
      
      return NextResponse.json({
        message: 'Dossier generated successfully',
        dossier,
      });
    }

    // Default: Tech Stack Scan
    const result = await SpyAgent.scan(competitor);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Scan failed' },
        { status: 500 }
      );
    }

    // 3. Atualizar Firestore com a nova Tech Stack e timestamp
    await updateCompetitorProfile(brandId, competitorId, {
      techStack: {
        ...result.techStack,
        updatedAt: Timestamp.now(),
      } as any,
      lastSpyScan: Timestamp.now(),
    });

    return NextResponse.json({
      message: 'Scan completed successfully',
      techStack: result.techStack,
      durationMs: result.durationMs,
    });
  } catch (error) {
    console.error('[API Spy Scan] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
