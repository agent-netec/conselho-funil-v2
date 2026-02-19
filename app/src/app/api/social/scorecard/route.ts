/**
 * Social Scorecard API — Calibrated evaluation with real brain frameworks
 * Sprint M: Now uses PRO model + real evaluation frameworks from 4 social counselors
 *
 * @route POST /api/social/scorecard
 * @credits 1
 */

import { NextRequest } from 'next/server';
import { ragQuery } from '@/lib/ai/rag';
import { generateWithGemini, isGeminiConfigured, PRO_GEMINI_MODEL, DEFAULT_GEMINI_MODEL } from '@/lib/ai/gemini';
import { getBrand } from '@/lib/firebase/brands';
import { SOCIAL_SCORECARD_PROMPT } from '@/lib/ai/prompts';
import { buildSocialBrainContext } from '@/lib/ai/prompts/social-brain-context';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { handleSecurityError } from '@/lib/utils/api-security';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { updateUserUsage } from '@/lib/firebase/firestore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // PRO model scoring

export async function POST(request: NextRequest) {
  try {
    const { brandId, platform, content } = await request.json();

    if (!brandId) {
      return createApiError(400, 'brandId é obrigatório.');
    }

    let userId = '';
    try {
      userId = (await requireBrandAccess(request, brandId)).userId;
    } catch (error) {
      return handleSecurityError(error);
    }

    if (!platform || !content) {
      return createApiError(400, 'Plataforma e conteúdo são obrigatórios.');
    }

    if (!isGeminiConfigured()) {
      return createApiError(500, 'API do Gemini não configurada.');
    }

    // 1. Load brand context
    let brandContext = 'Nenhuma marca selecionada.';
    try {
      const brand = await getBrand(brandId);
      if (brand) {
        brandContext = `
Marca: ${brand.name}
Vertical: ${brand.vertical}
Posicionamento: ${brand.positioning}
Tom de Voz: ${brand.voiceTone}
Audiência: ${brand.audience?.who || 'N/A'}
Dores: ${brand.audience?.pain || 'N/A'}
        `.trim();
      }
    } catch (brandErr) {
      console.warn('[Social/Scorecard] Brand load failed:', brandErr);
    }

    // 2. Build brain context with real evaluation frameworks
    const brainContext = buildSocialBrainContext();

    // 3. Fetch success heuristics via RAG
    const queryText = `Critérios de sucesso, métricas de retenção e heurísticas de viralização para ${platform}.`;
    const { context: knowledgeContext } = await ragQuery(queryText, {
      topK: 10,
      minSimilarity: 0.15,
      filters: { docType: 'heuristics' }
    });

    // 4. Build prompt with brain context injected
    const fullPrompt = SOCIAL_SCORECARD_PROMPT
      .replace('{{brainContext}}', brainContext)
      .replace('{{brandContext}}', brandContext)
      .replace('{{platform}}', platform)
      .replace('{{content}}', typeof content === 'string' ? content : JSON.stringify(content, null, 2))
      .replace('{{knowledgeContext}}', knowledgeContext || 'Use conhecimento geral sobre avaliação de performance em redes sociais.');

    // 5. Generate with PRO model, fallback to Flash if PRO fails
    let response: string;
    try {
      response = await generateWithGemini(fullPrompt, {
        model: PRO_GEMINI_MODEL,
        temperature: 0.2,
      });
    } catch (proErr: any) {
      console.warn(`[Social/Scorecard] PRO model failed: ${proErr?.message}. Falling back to Flash.`);
      response = await generateWithGemini(fullPrompt, {
        model: DEFAULT_GEMINI_MODEL,
        temperature: 0.2,
      });
    }

    // 6. Parse JSON
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

    // 7. Debit 1 credit
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
