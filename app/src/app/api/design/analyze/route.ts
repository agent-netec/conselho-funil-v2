export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { parseAIJSON } from '@/lib/ai/formatters';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { handleSecurityError } from '@/lib/utils/api-security';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { DEFAULT_GEMINI_MODEL } from '@/lib/ai/gemini';
import { buildDesignBrainContext } from '@/lib/ai/prompts/design-brain-context';
import { loadCampaignContext } from '@/lib/ai/campaign-context';
import { getBrandAdmin } from '@/lib/firebase/firestore-server';

const genAI = new GoogleGenerativeAI((process.env.GOOGLE_AI_API_KEY || '').trim());

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { funnelId, campaignId, brandId, userId } = body;

    if (!brandId) {
      return createApiError(400, 'brandId é obrigatório.');
    }

    try {
      await requireBrandAccess(request, brandId);
    } catch (error) {
      return handleSecurityError(error);
    }

    if (!funnelId || !campaignId) {
      return createApiError(400, 'funnelId e campaignId são obrigatórios.');
    }

    // Load campaign context (Golden Thread)
    const campaignCtx = await loadCampaignContext(campaignId);
    if (!campaignCtx) {
      return createApiError(404, 'Campanha não encontrada ou sem dados.');
    }

    // Load brand (server-side)
    let brand: any = null;
    try {
      brand = await getBrandAdmin(brandId);
    } catch (err) {
      console.warn('[Design/Analyze] Error loading brand:', err);
    }

    // Build brand kit info
    const brandKit = brand
      ? {
          colors: brand.brandKit?.colors || brand.colors || [],
          typography: brand.brandKit?.typography || brand.typography || '',
          visualStyle: brand.brandKit?.visualStyle || brand.visualStyle || '',
        }
      : { colors: [], typography: '', visualStyle: '' };

    // Characters
    const characters = (brand?.characters || []).map((c: any) => ({
      name: c.name || '',
      role: c.role || '',
    }));

    // Load design brain context
    let designBrainContext = '';
    try {
      designBrainContext = buildDesignBrainContext();
    } catch (brainErr) {
      console.warn('[Design/Analyze] Failed to load brain context:', brainErr);
    }

    // Configure Gemini model
    const modelName = DEFAULT_GEMINI_MODEL;
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: brand?.aiConfiguration?.temperature || 0.7,
        topP: brand?.aiConfiguration?.topP || 0.95,
      },
    });

    const prompt = `
Você é o Diretor de Arte do MKTHONEY.
Analise o briefing completo abaixo e produza sua análise estratégica.

[CONTEXTO DA LINHA DE OURO]
- Objetivo: ${campaignCtx.mainGoal}
- Estágio de consciência: ${campaignCtx.awareness || 'não definido'}
- Público-alvo: ${campaignCtx.targetAudience}
- Big Idea: ${campaignCtx.bigIdea}
- Tom aprovado: ${campaignCtx.tone}
- Hooks aprovados: ${JSON.stringify(campaignCtx.hooks)}
- Copy principal: ${campaignCtx.mainScript}
- Benefícios-chave: ${JSON.stringify(campaignCtx.keyBenefits)}
- Social Hooks detalhados: ${JSON.stringify(campaignCtx.socialHooks)}
- BrandKit: ${JSON.stringify(brandKit)}
- Personagens disponíveis: ${JSON.stringify(characters)}

${designBrainContext}

[SUA MISSÃO]
1. Resuma o que você entendeu do contexto (1-2 frases) → contextSummary
2. Identifique o estágio de consciência do público → awarenessStage
3. Identifique 1-3 desafios/riscos visuais → challenges[]
4. Recomende um SISTEMA VISUAL de campanha (2-4 peças interconectadas) → recommendedPieces[]
5. Para cada peça, defina: role (hook/development/proof/retargeting), platform, format, safeZone, aspectRatio, rationale
6. Dê 1-3 recomendações gerais → recommendations[]
7. Explique qual perfil C.H.A.P.E.U aplicar → chapeuProfile

Retorne APENAS JSON no formato:
{
  "contextSummary": "string",
  "awarenessStage": "string",
  "challenges": ["string"],
  "recommendedPieces": [
    {
      "role": "hook | development | proof | retargeting",
      "platform": "string",
      "format": "string",
      "safeZone": "string",
      "aspectRatio": "string",
      "rationale": "string"
    }
  ],
  "recommendations": ["string"],
  "chapeuProfile": "string"
}
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const parsed = parseAIJSON(responseText);

    // Informational only — NO credit deduction

    return createApiSuccess(parsed);
  } catch (error) {
    console.error('[Design/Analyze] Error:', error);
    if (error instanceof Error) {
      const msg = error.message || '';
      if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('QUOTA_EXCEEDED') || msg.includes('429')) {
        return createApiError(429, 'Cota de IA excedida. Tente novamente em alguns minutos.');
      }
    }
    return createApiError(500, 'Falha ao analisar contexto de design.');
  }
}
