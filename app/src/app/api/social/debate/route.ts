/**
 * Social Debate API — Council of 4 social experts debate generated hooks
 * Uses buildPartyPrompt() + buildPartyBrainContext() with PRO model
 *
 * @route POST /api/social/debate
 * @sprint M — M-2.1
 * @credits 1
 */

import { NextRequest } from 'next/server';
import { generateWithGemini, isGeminiConfigured, PRO_GEMINI_MODEL, DEFAULT_GEMINI_MODEL } from '@/lib/ai/gemini';
import { getBrand } from '@/lib/firebase/brands';
import { buildPartyPrompt } from '@/lib/ai/prompts/party-mode';
import { buildPartyBrainContext } from '@/lib/ai/prompts/party-brain-context';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { handleSecurityError } from '@/lib/utils/api-security';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { updateUserUsage } from '@/lib/firebase/firestore';
import { SOCIAL_COUNSELOR_IDS } from '@/lib/ai/prompts/social-brain-context';
import { retrieveSocialKnowledge } from '@/lib/ai/rag';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 90; // PRO model + 4 counselors debate = slow

export async function POST(request: NextRequest) {
  try {
    const { brandId, platform, hooks, campaignType, topic } = await request.json();

    if (!brandId) {
      return createApiError(400, 'brandId é obrigatório.');
    }

    let userId = '';
    try {
      userId = (await requireBrandAccess(request, brandId)).userId;
    } catch (error) {
      return handleSecurityError(error);
    }

    if (!platform || !hooks || !Array.isArray(hooks) || hooks.length === 0) {
      return createApiError(400, 'Plataforma e hooks são obrigatórios.');
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
Oferta: ${brand.offer?.what || 'N/A'}
Diferencial: ${brand.offer?.differentiator || 'N/A'}
        `.trim();
      }
    } catch (brandErr) {
      console.warn('[Social/Debate] Brand load failed:', brandErr);
    }

    // 2. Build brain context for the 4 social counselors
    let brainContext = '';
    try {
      brainContext = buildPartyBrainContext(SOCIAL_COUNSELOR_IDS);
    } catch (brainErr) {
      console.warn('[Social/Debate] Brain context failed:', brainErr);
    }

    // 3. Sprint O — O-5.4: Retrieve social knowledge base (policies & best practices)
    let socialKbContext = '';
    try {
      const channelKey = (platform || '').toLowerCase().replace(/[^a-z]/g, '');
      const { context } = await retrieveSocialKnowledge(
        `${campaignType || 'organic'} content ${platform} ${topic || ''}`,
        { channel: channelKey || undefined, topK: 5 }
      );
      socialKbContext = context;
      if (socialKbContext) {
        console.log(`[Social/Debate] KB context injected (${channelKey})`);
      }
    } catch (err) {
      console.warn('[Social/Debate] KB retrieval failed:', err);
    }

    // 4. Format hooks for the debate query
    const hooksText = hooks.map((h: { style: string; content: string }, i: number) =>
      `${i + 1}. [${h.style}] "${h.content}"`
    ).join('\n');

    const debateQuery = `Analisem os seguintes hooks gerados para ${platform} (objetivo: ${campaignType || 'organic'}, tema: "${topic || 'não especificado'}"):

${hooksText}
${socialKbContext ? `\n${socialKbContext}\n\nIMPORTANTE: Considerem as políticas e boas práticas acima ao avaliar os hooks. Se algum hook conflitar com uma política, indiquem o problema e sugiram correção.\n` : ''}
Cada conselheiro deve:
1. Avaliar os hooks sob sua perspectiva especializada
2. Indicar qual(is) hook(s) são mais fortes e por quê
3. Sugerir melhorias específicas baseadas em sua expertise
4. Recomendar o melhor hook para o objetivo de campanha
${socialKbContext ? '5. Verificar conformidade com políticas de plataforma' : ''}
O Veredito do Conselho deve consolidar as opiniões e recomendar o hook final com justificativa.`;

    // 5. Build party prompt with debate intensity
    const fullPrompt = buildPartyPrompt(
      debateQuery,
      brandContext,
      SOCIAL_COUNSELOR_IDS,
      { intensity: 'debate', brainContext }
    );

    // 6. Generate with PRO model, fallback to Flash if PRO fails
    let response: string;
    let modelUsed = PRO_GEMINI_MODEL;
    try {
      response = await generateWithGemini(fullPrompt, {
        model: PRO_GEMINI_MODEL,
        temperature: 0.7,
      });
    } catch (proErr: any) {
      console.warn(`[Social/Debate] PRO model failed: ${proErr?.message}. Falling back to Flash.`);
      modelUsed = DEFAULT_GEMINI_MODEL;
      response = await generateWithGemini(fullPrompt, {
        model: DEFAULT_GEMINI_MODEL,
        temperature: 0.7,
      });
    }

    // 7. Debit 1 credit
    if (userId) {
      try {
        await updateUserUsage(userId, -1);
        console.log(`[Social/Debate] 1 crédito decrementado para usuário: ${userId} (modelo: ${modelUsed})`);
      } catch (creditError) {
        console.error('[Social/Debate] Erro ao atualizar créditos:', creditError);
      }
    }

    return createApiSuccess({ debate: response, model: modelUsed });
  } catch (error: any) {
    console.error('Social debate error:', error);
    return createApiError(500, 'Erro interno no servidor', {
      details: error?.message || String(error),
      stage: 'debate_generation',
    });
  }
}
