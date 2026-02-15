import { NextRequest, NextResponse } from 'next/server';
import { ragQuery } from '@/lib/ai/rag';
import { generateWithGemini, isGeminiConfigured, DEFAULT_GEMINI_MODEL } from '@/lib/ai/gemini';
import { getBrand } from '@/lib/firebase/brands';
import { SOCIAL_HOOKS_PROMPT } from '@/lib/ai/prompts';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { handleSecurityError } from '@/lib/utils/api-security';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { updateUserUsage } from '@/lib/firebase/firestore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { brandId, platform, topic, userId } = await request.json();

    if (!brandId) {
      return createApiError(400, 'brandId é obrigatório.');
    }

    try {
      await requireBrandAccess(request, brandId);
    } catch (error) {
      return handleSecurityError(error);
    }

    if (!platform || !topic) {
      return createApiError(400, 'Plataforma e tema são obrigatórios.');
    }

    if (!isGeminiConfigured()) {
      return createApiError(500, 'API do Gemini não configurada.');
    }

    // 1. Carregar contexto da marca
    let brandContext = 'Nenhuma marca selecionada. Use um tom de voz neutro, prático e focado em resultados.';
    if (brandId) {
      const brand = await getBrand(brandId);
      if (brand) {
        brandContext = `
Marca: ${brand.name}
Vertical: ${brand.vertical}
Posicionamento: ${brand.positioning}
Tom de Voz: ${brand.voiceTone}
Audiência: ${brand.audience.who}
Dores da Audiência: ${brand.audience.pain}
Oferta Principal: ${brand.offer.what}
Diferencial: ${brand.offer.differentiator}
        `.trim();
      }
    }

    // 2. Buscar heurísticas via RAG
    const queryText = `Heurísticas, ganchos e regras para ${platform}. Como viralizar e reter atenção no ${platform} com o tema ${topic}.`;
    const { context: knowledgeContext } = await ragQuery(queryText, {
      topK: 8,
      minSimilarity: 0.15,
      filters: { docType: 'heuristics' }
    });

    // 3. Montar Prompt
    const fullPrompt = SOCIAL_HOOKS_PROMPT
      .replace('{{brandContext}}', brandContext)
      .replace('{{platform}}', platform)
      .replace('{{topic}}', topic)
      .replace('{{knowledgeContext}}', knowledgeContext || 'Use conhecimento geral sobre melhores práticas de redes sociais.');

    // 4. Gerar com Gemini
    const response = await generateWithGemini(fullPrompt, {
      model: DEFAULT_GEMINI_MODEL,
      temperature: 0.85,
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
      return createApiError(500, 'Erro ao processar resposta da IA. Tente novamente.');
    }

    // SIG-API-03: Decrementar 1 crédito por geração de hooks
    if (userId) {
      try {
        await updateUserUsage(userId, -1);
        console.log(`[Social/Hooks] 1 crédito decrementado para usuário: ${userId}`);
      } catch (creditError) {
        console.error('[Social/Hooks] Erro ao atualizar créditos:', creditError);
      }
    }

    return createApiSuccess(result);
  } catch (error) {
    console.error('Hook generation error:', error);
    return createApiError(500, 'Erro interno no servidor', { details: String(error) });
  }
}






