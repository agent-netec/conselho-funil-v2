/**
 * Sprint O — O-4.1: Social Trend Research API
 * Exa search → Firecrawl enrich → Gemini synthesis
 *
 * POST /api/social/trends
 * Body: { brandId, platform, vertical }
 * Returns: { trends: TrendItem[] }
 * Credits: 1
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest } from 'next/server';
import { ApiError, handleSecurityError } from '@/lib/utils/api-security';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { generateWithGemini, DEFAULT_GEMINI_MODEL } from '@/lib/ai/gemini';
import { ExaAdapter } from '@/lib/mcp/adapters/exa';
import { FirecrawlAdapter } from '@/lib/mcp/adapters/firecrawl';
import { updateUserUsage } from '@/lib/firebase/firestore';
import { Timestamp } from 'firebase/firestore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { brandId, platform, vertical } = body as {
      brandId?: string;
      platform?: string;
      vertical?: string;
    };

    if (!brandId) {
      return createApiError(400, 'brandId é obrigatório');
    }

    let userId = '';
    try {
      userId = (await requireBrandAccess(req, brandId)).userId;
    } catch (error) {
      return handleSecurityError(error);
    }

    // 1. Exa semantic search for trending content
    const exa = new ExaAdapter();
    const searchQuery = `trending ${platform || 'social media'} content ${vertical || 'marketing digital'} 2026`;
    const task = {
      id: `trends-${Date.now()}`,
      brandId,
      type: 'semantic_search' as const,
      input: { query: searchQuery, numResults: 8 },
    };

    let exaResults: any[] = [];
    try {
      const exaResult = await exa.execute(task);
      if (exaResult.success && exaResult.data && typeof exaResult.data === 'object') {
        exaResults = ((exaResult.data as { results?: any[] }).results ?? []).slice(0, 8);
      }
    } catch {
      exaResults = [];
    }

    // 2. Firecrawl enrich top 2 results
    const firecrawl = new FirecrawlAdapter();
    const enriched: string[] = [];
    const topToEnrich = exaResults.slice(0, 2);

    if (topToEnrich.length > 0) {
      const enrichResults = await Promise.allSettled(
        topToEnrich.map(async (r) => {
          if (!r.url) return null;
          const fireTask = {
            id: `trend-enrich-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            brandId,
            type: 'url_to_markdown' as const,
            input: { url: r.url },
          };
          const res = await firecrawl.execute(fireTask);
          if (res.success && res.data && typeof res.data === 'object') {
            return String((res.data as { markdown?: string }).markdown ?? '').slice(0, 2000);
          }
          return null;
        })
      );
      for (const r of enrichResults) {
        if (r.status === 'fulfilled' && r.value) enriched.push(r.value);
      }
    }

    // 3. Gemini synthesis
    const sourcesBlock = exaResults.map((r, i) => `${i + 1}. "${r.title || 'Sem título'}" (${r.url || 'N/A'}) - relevância: ${(r.score || 0).toFixed(2)}`).join('\n');
    const enrichBlock = enriched.length > 0 ? enriched.map((e, i) => `## Conteúdo enriquecido ${i + 1}\n${e}`).join('\n\n') : '';

    const prompt = [
      `# Pesquisa de Tendências Sociais`,
      `Plataforma: ${platform || 'Geral'}`,
      `Vertical: ${vertical || 'Marketing Digital'}`,
      '',
      `# FONTES (${exaResults.length})`,
      sourcesBlock,
      enrichBlock ? `\n# CONTEÚDO ENRIQUECIDO\n${enrichBlock}` : '',
      '',
      '# INSTRUÇÕES',
      'Analise as fontes e identifique 5-8 tendências relevantes para social media.',
      'Para cada tendência, forneça: nome, descrição curta, estimativa de crescimento, tags relevantes.',
      'Retorne JSON válido:',
      '{"trends":[{"title":"nome da tendência","description":"descrição em 1-2 frases","growth":"alto|médio|baixo","growthPercent":120,"tags":["tag1","tag2"],"sourceUrl":"url da fonte"}]}',
      'Escreva em PT-BR.',
    ].filter(Boolean).join('\n');

    const responseText = await generateWithGemini(prompt, {
      model: DEFAULT_GEMINI_MODEL,
      temperature: 0.4,
      maxOutputTokens: 4096,
      responseMimeType: 'application/json',
      feature: 'social_trends',
    });

    let result: any;
    try {
      result = JSON.parse(responseText);
    } catch {
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/) || responseText.match(/(\{[\s\S]*\})/);
      if (jsonMatch?.[1]) {
        try { result = JSON.parse(jsonMatch[1].trim()); } catch { /* fallthrough */ }
      }
    }

    const trends = (result?.trends || []).map((t: any) => ({
      title: t.title || 'Sem título',
      description: t.description || '',
      growth: t.growth || 'médio',
      growthPercent: t.growthPercent || 0,
      tags: Array.isArray(t.tags) ? t.tags : [],
      sourceUrl: t.sourceUrl || '',
    }));

    // Debit 1 credit
    if (userId) {
      try { await updateUserUsage(userId, -1); } catch { /* non-critical */ }
    }

    return createApiSuccess({ trends, sourcesFound: exaResults.length });
  } catch (error: unknown) {
    if (error instanceof ApiError) return handleSecurityError(error);
    console.error('[Social/Trends] Error:', error);
    return createApiError(500, 'Erro interno na pesquisa de tendências.');
  }
}
