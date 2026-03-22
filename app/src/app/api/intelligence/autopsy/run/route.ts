export const dynamic = 'force-dynamic';
export const maxDuration = 120; // Scraping + Gemini analysis can take up to 90s
import { NextRequest, NextResponse } from 'next/server';
import { AutopsyEngine } from '@/lib/intelligence/autopsy/engine';
import { extractContentFromUrl } from '@/lib/ai/url-scraper';
import { AutopsyRunRequest, AutopsyRunResponse, AutopsyDocument } from '@/types/autopsy';
import { v4 as uuidv4 } from 'uuid';
import { Timestamp } from 'firebase-admin/firestore';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { parseJsonBody } from '@/app/api/_utils/parse-json';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { ApiError, handleSecurityError } from '@/lib/utils/api-security';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { consumeCredits } from '@/lib/firebase/firestore-server';

/**
 * Handler para execução do diagnóstico forense de funil.
 * POST /api/intelligence/autopsy/run
 * 
 * Este endpoint utiliza o Browser MCP (via Monara) para scraping
 * e o Gemini 1.5 Pro para análise heurística.
 */
export async function POST(req: NextRequest) {
  try {
    const parsed = await parseJsonBody<AutopsyRunRequest>(req);
    if (!parsed.ok) {
      return createApiError(400, parsed.error);
    }

    const body = parsed.data;
    const { brandId, url, depth = 'quick', context } = body;

    if (!brandId || !url) {
      return createApiError(400, 'Parâmetros obrigatórios ausentes (brandId, url).');
    }

    const { brandId: safeBrandId, userId: authUserId } = await requireBrandAccess(req, brandId);

    // Sprint 11: Deep analysis costs 2 credits (Launch Pad health check)
    // Quick analysis is free — caller handles credits (spy, chat)
    if (depth === 'deep' && authUserId) {
      try {
        await consumeCredits(authUserId, 2, 'health_check');
      } catch (err: any) {
        if (err.statusCode === 402) {
          return createApiError(402, err.message || 'Créditos insuficientes para health check (2 créditos)');
        }
        throw err;
      }
    }

    const startTime = Date.now();

    // 1. Scraping via Monara (Browser MCP) - Fallback para url-scraper local
    // Nota: Em produção, aqui invocaríamos o MCP via Monara. 
    // Por enquanto, usamos o extractContentFromUrl que já integra Jina/Readability.
    console.log(`[AUTOPSY] Iniciando scraping para: ${url}`);
    const scraped = await extractContentFromUrl(url, { brandId: safeBrandId });

    if (scraped.error) {
      return createApiError(422, `Falha no scraping: ${scraped.error}`);
    }
    if (!scraped.content?.trim()) {
      return createApiError(422, 'Conteúdo insuficiente para análise.');
    }

    const loadTimeMs = Date.now() - startTime;

    // 2. Detecção básica de Tech Stack (Heurística simples via HTML)
    const techStack: string[] = [];
    if (scraped.rawHtml) {
      if (scraped.rawHtml.includes('elementor')) techStack.push('Elementor');
      if (scraped.rawHtml.includes('clickfunnels')) techStack.push('ClickFunnels');
      if (scraped.rawHtml.includes('wp-content')) techStack.push('WordPress');
      if (scraped.rawHtml.includes('hotmart')) techStack.push('Hotmart');
    }

    // 3. Executar o motor de diagnóstico (Gemini 2.0 Flash)
    console.log(`[AUTOPSY] Executando análise heurística via Gemini 2.0 Flash`);
    const report = await AutopsyEngine.analyzeContent(
      url,
      scraped.content,
      body,
      {
        loadTimeMs,
        techStack,
        screenshotUrl: scraped.primaryImageUrl // Fallback para imagem principal se não houver screenshot real
      }
    );

    const response: AutopsyRunResponse = {
      id: `aut_${uuidv4()}`,
      status: 'completed',
      url,
      timestamp: Date.now(),
      report
    };

    const adminDb = getAdminFirestore();
    // S29-FT-02: Persistir no Firestore (fire-and-forget — padrão PropensityEngine)
    const autopsyDoc: AutopsyDocument = {
      id: response.id,
      brandId: safeBrandId,
      url,
      status: 'completed',
      request: body,
      result: report,
      createdAt: Timestamp.now() as any,
      updatedAt: Timestamp.now() as any,
      expiresAt: Timestamp.fromMillis(Date.now() + 30 * 24 * 60 * 60 * 1000) as any, // TTL 30 dias
    };

    const autopsyRef = adminDb.collection('brands').doc(safeBrandId).collection('autopsies').doc(response.id);
    // Firestore rejects undefined values — strip screenshotUrl if absent
    if (autopsyDoc.result?.metadata?.screenshotUrl === undefined && autopsyDoc.result?.metadata) {
      delete autopsyDoc.result.metadata.screenshotUrl;
    }

    // ERR-3: await persistence instead of fire-and-forget
    let persistWarning: string | undefined;
    try {
      await autopsyRef.set(autopsyDoc);
    } catch (err) {
      console.error('[Autopsy] Persist failed:', err);
      persistWarning = 'Análise concluída, mas houve erro ao salvar no histórico.';
    }

    return createApiSuccess({
      ...response,
      ...(persistWarning ? { warning: persistWarning } : {}),
    });
  } catch (error: unknown) {
    console.error('[AUTOPSY_API_ERROR]:', error);
    if (error instanceof ApiError) {
      return handleSecurityError(error);
    }
    const message = error instanceof Error ? error.message : 'Erro interno ao processar o diagnóstico.';
    return createApiError(500, message);
  }
}
// trigger redeploy 02/05/2026 12:48:19