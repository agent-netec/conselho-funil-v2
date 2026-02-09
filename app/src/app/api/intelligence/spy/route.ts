export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { SpyAgent } from '@/lib/agents/spy/spy-agent';
import { DossierGenerator } from '@/lib/agents/spy/dossier-generator';
import { db } from '@/lib/firebase/config';
import { getCompetitorProfile, updateCompetitorProfile, getCompetitorAssets } from '@/lib/firebase/intelligence';
import { Timestamp } from 'firebase/firestore';
import { parseJsonBody } from '@/app/api/_utils/parse-json';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { ApiError, handleSecurityError } from '@/lib/utils/api-security';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { withRateLimit } from '@/lib/middleware/rate-limiter';
import type { CompetitorTechStack, SpyScanResult } from '@/types/competitors';

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

/**
 * @api {post} /api/intelligence/spy/scan Executa o Spy Agent Scan ou Gera Dossiê
 */
async function handlePOST(req: NextRequest) {
  try {
    const parsed = await parseJsonBody<{ brandId?: string; competitorId?: string; action?: string }>(req);
    if (!parsed.ok) {
      return createApiError(400, parsed.error);
    }

    const { brandId, competitorId, action } = parsed.data;

    if (!brandId || !competitorId) {
      return createApiError(400, 'brandId and competitorId are required');
    }

    if (!db) {
      return createApiError(503, 'Firestore não inicializado no ambiente');
    }

    const { brandId: safeBrandId } = await requireBrandAccess(req, brandId);

    // 1. Buscar perfil do concorrente
    let competitor;
    try {
      competitor = await getCompetitorProfile(safeBrandId, competitorId);
    } catch (error: unknown) {
      console.error('[API Spy] Falha ao buscar concorrente:', error);
      return createApiError(503, getErrorMessage(error, 'Falha ao acessar Firestore'));
    }

    if (!competitor) {
      return createApiError(404, 'Competitor not found');
    }

    // 2. Executar Ação (Scan, Track ou Dossier)
    if (action === 'track') {
      try {
        const assets = await SpyAgent.trackFunnel(competitor);
        return createApiSuccess({
          message: 'Funnel tracking completed',
          assetsCount: assets.length,
          assets: assets.map(a => ({ id: a.id, url: a.url, pageType: a.pageType })),
        });
      } catch (error: unknown) {
        console.error('[API Spy Track] Error:', error);
        return createApiError(502, getErrorMessage(error, 'Falha ao rastrear funil.'));
      }
    }

    if (action === 'dossier') {
      try {
        // Buscar ativos para alimentar o dossiê
        const assets = await getCompetitorAssets(safeBrandId, competitorId);
        const dossier = await DossierGenerator.generate(safeBrandId, competitor, assets);
        
        return createApiSuccess({
          message: 'Dossier generated successfully',
          dossier,
        });
      } catch (error: unknown) {
        console.error('[API Spy Dossier] Error:', error);
        const message = getErrorMessage(error, 'Falha ao gerar dossiê.');
        const status = message.toLowerCase().includes('tech stack') ? 422 : 502;
        return createApiError(status, message);
      }
    }

    // Default: Tech Stack Scan
    let result: SpyScanResult | null = null;
    try {
      result = await SpyAgent.scan(competitor);
    } catch (error: unknown) {
      console.error('[API Spy Scan] Error:', error);
      return createApiError(502, getErrorMessage(error, 'Falha ao executar scan.'));
    }

    if (!result || !result.success) {
      return createApiError(502, result?.error || 'Scan failed');
    }

    // 3. Atualizar Firestore com a nova Tech Stack e timestamp
    let persistError: string | null = null;
    try {
      await updateCompetitorProfile(safeBrandId, competitorId, {
        techStack: {
          ...result.techStack,
          updatedAt: Timestamp.now(),
        } as CompetitorTechStack,
        lastSpyScan: Timestamp.now(),
      });
    } catch (error: unknown) {
      persistError = getErrorMessage(error, 'Falha ao persistir tech stack');
      console.error('[API Spy Scan] Persist error:', error);
    }

    return createApiSuccess({
      message: 'Scan completed successfully',
      techStack: result.techStack,
      durationMs: result.durationMs,
      persisted: !persistError,
      persistError,
    });
  } catch (error: unknown) {
    console.error('[API Spy] Unexpected error:', error);
    if (error instanceof ApiError) {
      return handleSecurityError(error);
    }
    const message = error instanceof Error ? error.message : 'Falha inesperada no spy.';
    return createApiError(502, message);
  }
}

// S32-RL-02: Rate limit — 5 req/min por brand
const rateLimitedPOST = withRateLimit(handlePOST, {
  maxRequests: 5,
  windowMs: 60_000,
  scope: 'spy',
});

export { rateLimitedPOST as POST };
