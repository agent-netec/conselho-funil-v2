/**
 * Sprint O — O-2: Audience Analysis API
 * Scrapes social comments via Firecrawl → Gemini analysis → Persona generation
 *
 * POST /api/intelligence/research/audience
 * Body: { brandId, urls: string[], topic: string }
 * Returns: { voiceAnalysis, persona }
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest } from 'next/server';
import { ApiError, handleSecurityError } from '@/lib/utils/api-security';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { generateWithGemini, PRO_GEMINI_MODEL } from '@/lib/ai/gemini';
import { FirecrawlAdapter } from '@/lib/mcp/adapters/firecrawl';
import { updateUserUsage } from '@/lib/firebase/firestore';
import type { AudiencePersona } from '@/types/research';

const AUDIENCE_ANALYSIS_PROMPT = `Voce e um especialista em analise de audiencia e comportamento do consumidor.
Analise os comentarios e conteudo das fontes sociais abaixo e extraia:

1. **Tom predominante**: Como o publico se comunica (formal, informal, tecnico, emocional)
2. **Dores reais**: Frustrações, reclamações, problemas mencionados (citacoes diretas quando possivel)
3. **Desejos expressos**: O que querem alcançar, sonhos, objetivos mencionados
4. **Perguntas frequentes**: Duvidas que aparecem repetidamente
5. **Gatilhos de compra**: O que os motiva a agir, palavras-chave de decisao
6. **Objecoes comuns**: Resistencias e barreiras mencionadas

Retorne JSON valido:
{
  "tone": "descricao do tom predominante",
  "pains": ["dor 1 (com citacao)", "dor 2", ...],
  "desires": ["desejo 1", "desejo 2", ...],
  "questions": ["pergunta 1", "pergunta 2", ...],
  "triggers": ["gatilho 1", "gatilho 2", ...],
  "objections": ["objecao 1", "objecao 2", ...],
  "persona": {
    "name": "nome ficticio representativo",
    "age": "faixa etaria",
    "tone": "como essa pessoa fala",
    "pains": ["top 3 dores"],
    "desires": ["top 3 desejos"],
    "questions": ["top 3 perguntas"],
    "triggers": ["top 3 gatilhos"],
    "summary": "resumo executivo de 2-3 frases sobre essa persona"
  }
}

Escreva em PT-BR. Seja especifico e baseie-se nos dados reais das fontes.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { brandId, urls, topic } = body as {
      brandId?: string;
      urls?: string[];
      topic?: string;
    };

    if (!brandId || !topic) {
      return createApiError(400, 'brandId e topic são obrigatórios');
    }

    let userId = '';
    try {
      userId = (await requireBrandAccess(req, brandId)).userId;
    } catch (error) {
      return handleSecurityError(error);
    }

    // 1. Scrape URLs via Firecrawl (O-2.1)
    const firecrawl = new FirecrawlAdapter();
    const scrapedContent: string[] = [];

    if (urls?.length) {
      const results = await Promise.allSettled(
        urls.slice(0, 5).map(async (url) => {
          const task = {
            id: `audience-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            brandId: brandId!,
            type: 'url_to_markdown' as const,
            input: { url },
          };
          const result = await firecrawl.execute(task);
          if (result.success && result.data && typeof result.data === 'object') {
            const markdown = String((result.data as { markdown?: string }).markdown ?? '');
            if (markdown) return markdown.slice(0, 4000);
          }
          return null;
        })
      );

      for (const r of results) {
        if (r.status === 'fulfilled' && r.value) {
          scrapedContent.push(r.value);
        }
      }
    }

    // 2. Gemini analysis of active voice (O-2.2)
    const sourcesBlock = scrapedContent.length > 0
      ? scrapedContent.map((c, i) => `## Fonte ${i + 1}\n${c}`).join('\n\n---\n\n')
      : 'Nenhuma fonte social foi coletada. Gere a analise baseada no topico fornecido.';

    const prompt = [
      `# Analise de Audiencia — Voz Ativa`,
      `Topico: ${topic}`,
      `URLs analisadas: ${urls?.join(', ') || 'nenhuma'}`,
      '',
      `# CONTEUDO COLETADO (${scrapedContent.length} fontes)`,
      sourcesBlock,
      '',
      '# INSTRUCOES',
      AUDIENCE_ANALYSIS_PROMPT,
    ].join('\n');

    const responseText = await generateWithGemini(prompt, {
      model: PRO_GEMINI_MODEL,
      temperature: 0.4,
      maxOutputTokens: 4096,
      responseMimeType: 'application/json',
      feature: 'audience_analysis',
    });

    // 3. Parse response (O-2.3)
    let analysis: any;
    try {
      analysis = JSON.parse(responseText);
    } catch {
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/) || responseText.match(/(\{[\s\S]*\})/);
      if (jsonMatch?.[1]) {
        try { analysis = JSON.parse(jsonMatch[1].trim()); } catch { /* fallthrough */ }
      }
    }

    if (!analysis) {
      return createApiError(500, 'Falha ao parsear analise de audiencia');
    }

    const persona: AudiencePersona = analysis.persona || {
      name: 'Persona genérica',
      age: '25-45',
      tone: analysis.tone || 'não determinado',
      pains: (analysis.pains || []).slice(0, 3),
      desires: (analysis.desires || []).slice(0, 3),
      questions: (analysis.questions || []).slice(0, 3),
      triggers: (analysis.triggers || []).slice(0, 3),
      summary: 'Persona gerada com dados limitados.',
    };

    // Debit 2 credits
    if (userId) {
      try { await updateUserUsage(userId, -2); } catch (e) {
        console.error('[Audience] Credit error:', e);
      }
    }

    return createApiSuccess({
      voiceAnalysis: {
        tone: analysis.tone,
        pains: analysis.pains || [],
        desires: analysis.desires || [],
        questions: analysis.questions || [],
        triggers: analysis.triggers || [],
        objections: analysis.objections || [],
      },
      persona,
      sourcesScraped: scrapedContent.length,
    });
  } catch (error: unknown) {
    if (error instanceof ApiError) return handleSecurityError(error);
    console.error('[Audience] Error:', error);
    return createApiError(500, 'Erro interno na analise de audiencia.');
  }
}
