export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { SpyAgent } from '@/lib/agents/spy/spy-agent';
import { DossierGenerator } from '@/lib/agents/spy/dossier-generator';
import { db } from '@/lib/firebase/config';
import { getCompetitorProfile, updateCompetitorProfile, getCompetitorAssets } from '@/lib/firebase/intelligence';
import { Timestamp } from 'firebase/firestore';
import { parseJsonBody } from '@/app/api/_utils/parse-json';

/**
 * @api {post} /api/intelligence/spy/scan Executa o Spy Agent Scan ou Gera Dossiê
 */
export async function POST(req: NextRequest) {
  try {
    const parsed = await parseJsonBody<{ brandId?: string; competitorId?: string; action?: string }>(req);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { brandId, competitorId, action } = parsed.data;

    if (!brandId || !competitorId) {
      return NextResponse.json(
        { error: 'brandId and competitorId are required' },
        { status: 400 }
      );
    }

    if (!db) {
      return NextResponse.json(
        { error: 'Firestore não inicializado no ambiente' },
        { status: 503 }
      );
    }

    // 1. Buscar perfil do concorrente
    let competitor;
    try {
      competitor = await getCompetitorProfile(brandId, competitorId);
    } catch (error: any) {
      console.error('[API Spy] Falha ao buscar concorrente:', error);
      return NextResponse.json(
        { error: error?.message || 'Falha ao acessar Firestore' },
        { status: 503 }
      );
    }

    if (!competitor) {
      return NextResponse.json(
        { error: 'Competitor not found' },
        { status: 404 }
      );
    }

    // 2. Executar Ação (Scan, Track ou Dossier)
    if (action === 'track') {
      try {
        const assets = await SpyAgent.trackFunnel(competitor);
        return NextResponse.json({
          success: true,
          message: 'Funnel tracking completed',
          assetsCount: assets.length,
          assets: assets.map(a => ({ id: a.id, url: a.url, pageType: a.pageType })),
        });
      } catch (error: any) {
        console.error('[API Spy Track] Error:', error);
        return NextResponse.json(
          { success: false, error: error?.message || 'Falha ao rastrear funil.' },
          { status: 502 }
        );
      }
    }

    if (action === 'dossier') {
      try {
        // Buscar ativos para alimentar o dossiê
        const assets = await getCompetitorAssets(brandId, competitorId);
        const dossier = await DossierGenerator.generate(brandId, competitor, assets);
        
        return NextResponse.json({
          success: true,
          message: 'Dossier generated successfully',
          dossier,
        });
      } catch (error: any) {
        console.error('[API Spy Dossier] Error:', error);
        const message = error?.message || 'Falha ao gerar dossiê.';
        const status = message.toLowerCase().includes('tech stack') ? 422 : 502;
        return NextResponse.json(
          { success: false, error: message },
          { status }
        );
      }
    }

    // Default: Tech Stack Scan
    let result;
    try {
      result = await SpyAgent.scan(competitor);
    } catch (error: any) {
      console.error('[API Spy Scan] Error:', error);
      return NextResponse.json(
        { success: false, error: error?.message || 'Falha ao executar scan.' },
        { status: 502 }
      );
    }

    if (!result || !result.success) {
      return NextResponse.json(
        { success: false, error: result?.error || 'Scan failed' },
        { status: 502 }
      );
    }

    // 3. Atualizar Firestore com a nova Tech Stack e timestamp
    let persistError: string | null = null;
    try {
      await updateCompetitorProfile(brandId, competitorId, {
        techStack: {
          ...result.techStack,
          updatedAt: Timestamp.now(),
        } as any,
        lastSpyScan: Timestamp.now(),
      });
    } catch (error: any) {
      persistError = error?.message || 'Falha ao persistir tech stack';
      console.error('[API Spy Scan] Persist error:', error);
    }

    return NextResponse.json({
      success: true,
      message: 'Scan completed successfully',
      techStack: result.techStack,
      durationMs: result.durationMs,
      persisted: !persistError,
      persistError,
    });
  } catch (error: unknown) {
    console.error('[API Spy] Unexpected error:', error);
    const message = error instanceof Error ? error.message : 'Falha inesperada no spy.';
    return NextResponse.json(
      { error: message },
      { status: 502 }
    );
  }
}
