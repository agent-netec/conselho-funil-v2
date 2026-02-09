import { NextRequest, NextResponse } from 'next/server';
import { ragQuery } from '@/lib/ai/rag';
import { generateWithGemini, isGeminiConfigured } from '@/lib/ai/gemini';
import { getBrand } from '@/lib/firebase/brands';
import { SOCIAL_SCORECARD_PROMPT } from '@/lib/ai/prompts';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { handleSecurityError } from '@/lib/utils/api-security';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { updateUserUsage } from '@/lib/firebase/firestore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { brandId, platform, content, userId } = await request.json();

    if (!brandId) {
      return createApiError(400, 'brandId é obrigatório.');
    }

    try {
      await requireBrandAccess(request, brandId);
    } catch (error) {
      return handleSecurityError(error);
    }

    if (!platform || !content) {
      return createApiError(400, 'Plataforma e conteúdo são obrigatórios.');
    }

    if (!isGeminiConfigured()) {
      return createApiError(500, 'API do Gemini não configurada.');
    }

    // 1. Carregar contexto da marca
    let brandContext = 'Nenhuma marca selecionada.';
    if (brandId) {
      const brand = await getBrand(brandId);
      if (brand) {
        brandContext = `
Marca: ${brand.name}
Vertical: ${brand.vertical}
Posicionamento: ${brand.positioning}
Tom de Voz: ${brand.voiceTone}
Audiência: ${brand.audience.who}
Dores: ${brand.audience.pain}
        `.trim();
      }
    }

    // 2. Buscar heurísticas de sucesso via RAG
    const queryText = `Critérios de sucesso, métricas de retenção e heurísticas de viralização para ${platform}.`;
    const { context: knowledgeContext } = await ragQuery(queryText, {
      topK: 10,
      minSimilarity: 0.15,
      filters: { docType: 'heuristics' }
    });

    // 3. Montar Prompt
    const fullPrompt = SOCIAL_SCORECARD_PROMPT
      .replace('{{brandContext}}', brandContext)
      .replace('{{platform}}', platform)
      .replace('{{content}}', typeof content === 'string' ? content : JSON.stringify(content, null, 2))
      .replace('{{knowledgeContext}}', knowledgeContext || 'Use conhecimento geral sobre avaliação de performance em redes sociais.');

    // 4. Gerar com Gemini
    const response = await generateWithGemini(fullPrompt, {
      model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
      temperature: 0.2, // Lower temperature for more consistent evaluation
    });

    // 5. Parse JSON
    let result;
    try {
      let jsonStr = response.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.slice(7);
      }
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.slice(3);
      }
      if (jsonStr.endsWith('```')) {
        jsonStr = jsonStr.slice(0, -3);
      }
      result = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      return createApiError(500, 'Erro ao processar avaliação do scorecard. Tente novamente.');
    }

    // SIG-API-03: Decrementar 1 crédito por geração de scorecard
    if (userId) {
      try {
        await updateUserUsage(userId, -1);
        console.log(`[Social/Scorecard] 1 crédito decrementado para usuário: ${userId}`);
      } catch (creditError) {
        console.error('[Social/Scorecard] Erro ao atualizar créditos:', creditError);
      }
    }

    return createApiSuccess(result);
  } catch (error) {
    console.error('Scorecard generation error:', error);
    return createApiError(500, 'Erro interno no servidor', { details: String(error) });
  }
}






