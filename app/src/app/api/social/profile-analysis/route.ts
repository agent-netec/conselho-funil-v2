/**
 * Sprint O — O-4.3: Competitor Profile Analysis API
 * Firecrawl scrape public profile → Gemini analysis
 *
 * POST /api/social/profile-analysis
 * Body: { brandId, profileUrl }
 * Returns: { report }
 * Credits: 2
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { brandId, profileUrl } = body as {
      brandId?: string;
      profileUrl?: string;
    };

    if (!brandId || !profileUrl) {
      return createApiError(400, 'brandId e profileUrl são obrigatórios');
    }

    let userId = '';
    try {
      userId = (await requireBrandAccess(req, brandId)).userId;
    } catch (error) {
      return handleSecurityError(error);
    }

    // 1. Scrape profile via Firecrawl
    const firecrawl = new FirecrawlAdapter();
    let profileContent = '';

    try {
      const task = {
        id: `profile-${Date.now()}`,
        brandId,
        type: 'url_to_markdown' as const,
        input: { url: profileUrl },
      };
      const result = await firecrawl.execute(task);
      if (result.success && result.data && typeof result.data === 'object') {
        profileContent = String((result.data as { markdown?: string }).markdown ?? '').slice(0, 6000);
      }
    } catch {
      profileContent = '';
    }

    if (!profileContent) {
      return createApiError(400, 'Não foi possível acessar o perfil. Verifique a URL.');
    }

    // 2. Gemini analysis
    const prompt = [
      '# Análise de Perfil Social — Competidor',
      `URL: ${profileUrl}`,
      '',
      '# CONTEÚDO DO PERFIL',
      profileContent,
      '',
      '# INSTRUÇÕES',
      'Analise este perfil social como um estrategista de conteúdo e identifique:',
      '1. **Frequência de postagem** (diária, semanal, irregular)',
      '2. **Tipos de hooks** mais usados (pergunta, polêmica, storytelling, dado)',
      '3. **Padrões de engajamento** (o que gera mais interação)',
      '4. **Pontos fortes** (o que fazem bem)',
      '5. **Pontos fracos** (o que pode ser explorado)',
      '6. **Padrões de conteúdo** (formatos, temas recorrentes, tom)',
      '7. **Oportunidades** (gaps que podemos explorar)',
      '',
      'Retorne JSON válido:',
      '{"profileName":"nome do perfil","platform":"plataforma detectada","frequency":"frequência","hookTypes":["tipo1","tipo2"],"engagementPatterns":["padrão1","padrão2"],"strengths":["ponto forte 1"],"weaknesses":["ponto fraco 1"],"contentPatterns":["padrão 1"],"opportunities":["oportunidade 1"],"summary":"resumo executivo em 2-3 frases"}',
      'Escreva em PT-BR com foco acionável.',
    ].join('\n');

    const responseText = await generateWithGemini(prompt, {
      model: PRO_GEMINI_MODEL,
      temperature: 0.4,
      maxOutputTokens: 4096,
      responseMimeType: 'application/json',
      feature: 'profile_analysis',
    });

    let report: any;
    try {
      report = JSON.parse(responseText);
    } catch {
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/) || responseText.match(/(\{[\s\S]*\})/);
      if (jsonMatch?.[1]) {
        try { report = JSON.parse(jsonMatch[1].trim()); } catch { /* fallthrough */ }
      }
    }

    if (!report) {
      return createApiError(500, 'Falha ao parsear análise de perfil');
    }

    // Debit 2 credits
    if (userId) {
      try { await updateUserUsage(userId, -2); } catch { /* non-critical */ }
    }

    return createApiSuccess({ report });
  } catch (error: unknown) {
    if (error instanceof ApiError) return handleSecurityError(error);
    console.error('[Social/Profile] Error:', error);
    return createApiError(500, 'Erro interno na análise de perfil.');
  }
}
