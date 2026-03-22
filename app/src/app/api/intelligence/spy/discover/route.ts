export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest } from 'next/server';
import { ExaAdapter } from '@/lib/mcp/adapters/exa';
import { generateWithGemini } from '@/lib/ai/gemini';
import { parseJsonBody } from '@/app/api/_utils/parse-json';
import { requireBrandAccess, requireMinTier } from '@/lib/auth/brand-guard';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { consumeCredits, CREDIT_COSTS } from '@/lib/firebase/firestore-server';
import { getBrand } from '@/lib/firebase/brands';

export interface DiscoveredCompetitor {
  url: string;
  name: string;
  type: 'direto' | 'indireto' | 'referencia';
  relevance: number;
  reason: string;
}

/**
 * POST /api/intelligence/spy/discover
 * Descobre concorrentes automaticamente usando brand context + Exa + Gemini
 */
export async function POST(req: NextRequest) {
  try {
    const parsed = await parseJsonBody<{ brandId?: string; clusterKeywords?: string[] }>(req);
    if (!parsed.ok) return createApiError(400, parsed.error);

    const brandId = parsed.data?.brandId;
    const clusterKeywords = Array.isArray(parsed.data?.clusterKeywords) ? parsed.data.clusterKeywords : [];
    if (!brandId) return createApiError(400, 'brandId é obrigatório');

    const { userId, effectiveTier } = await requireBrandAccess(req, brandId);
    requireMinTier(effectiveTier, 'pro');
    await consumeCredits(userId, CREDIT_COSTS.spy_discover, 'spy_discover');

    // 1. Load brand context
    const brand = await getBrand(brandId);
    if (!brand) return createApiError(404, 'Marca não encontrada');

    const vertical = brand.vertical || '';
    const offerWhat = brand.offer?.what || '';
    const audienceWho = brand.audience?.who || '';
    const differentiator = brand.offer?.differentiator || '';

    if (!vertical && !offerWhat) {
      return createApiError(400, 'Complete o perfil da marca (vertical e oferta) antes de descobrir concorrentes');
    }

    // 2. Search via Exa
    const keywordsContext = clusterKeywords.length > 0
      ? clusterKeywords.slice(0, 5).join(' ')
      : '';
    const searchQuery = [
      vertical,
      offerWhat,
      keywordsContext,
      audienceWho ? `para ${audienceWho}` : '',
      'site landing page',
    ].filter(Boolean).join(' ');

    const exa = new ExaAdapter();
    const task = {
      id: `spy-discover-${brandId}-${Date.now()}`,
      brandId,
      type: 'semantic_search' as const,
      input: {
        query: searchQuery,
        numResults: 10,
      },
    };

    let urls: { url: string; title: string }[] = [];
    try {
      const exaResult = await exa.execute(task);
      const rawResults =
        exaResult.success && exaResult.data && typeof exaResult.data === 'object'
          ? ((exaResult.data as { results?: unknown[] }).results ?? [])
          : [];
      urls = rawResults
        .map((r) => r as { url?: string; title?: string })
        .filter((r) => typeof r.url === 'string' && r.url.startsWith('http'))
        .map((r) => ({ url: r.url as string, title: r.title || '' }));
    } catch {
      return createApiError(502, 'Erro ao buscar concorrentes na web');
    }

    if (urls.length === 0) {
      return createApiSuccess({ competitors: [], message: 'Nenhum resultado encontrado para o nicho' });
    }

    // 3. Gemini classifies
    const prompt = `Você é um analista de mercado especializado em marketing digital no Brasil.

Analise estes sites encontrados para o nicho "${vertical}":
${urls.map((r, i) => `${i + 1}. ${r.url} — ${r.title}`).join('\n')}

Contexto da marca do usuário:
- Vertical: ${vertical}
- Oferta: ${offerWhat}
- Público: ${audienceWho}
- Diferencial: ${differentiator}${clusterKeywords.length > 0 ? `\n- Keywords do cluster: ${clusterKeywords.join(', ')}` : ''}

Classifique cada site como:
- "direto": mesmo público + oferta similar (concorrente direto)
- "indireto": mesmo público + oferta diferente (concorrente indireto)
- "referencia": nicho adjacente + boas práticas para se inspirar
- "irrelevante": sem relação com o nicho

Para cada site relevante (NÃO irrelevante), retorne:
- "url": URL exata
- "name": nome do site/empresa (extraia do título ou URL)
- "type": "direto", "indireto" ou "referencia"
- "relevance": 0-100 (quão relevante para o usuário)
- "reason": 1 frase explicando por que é relevante

Retorne APENAS um array JSON válido. Sem markdown. Exclua os irrelevantes.`;

    const result = await generateWithGemini(prompt, {
      responseMimeType: 'application/json',
      temperature: 0.3,
      feature: 'spy_discover',
    });

    let competitors: DiscoveredCompetitor[] = [];
    try {
      const parsed = JSON.parse(result);
      competitors = (Array.isArray(parsed) ? parsed : [])
        .filter((c: DiscoveredCompetitor) => c.url && c.name && c.type && typeof c.relevance === 'number')
        .sort((a: DiscoveredCompetitor, b: DiscoveredCompetitor) => b.relevance - a.relevance)
        .slice(0, 10);
    } catch {
      return createApiError(500, 'Erro ao processar classificação de concorrentes');
    }

    return createApiSuccess({ competitors });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      const e = error as { statusCode: number; message: string };
      return createApiError(e.statusCode, e.message);
    }
    const message = error instanceof Error ? error.message : 'Erro inesperado ao descobrir concorrentes';
    return createApiError(500, message);
  }
}
