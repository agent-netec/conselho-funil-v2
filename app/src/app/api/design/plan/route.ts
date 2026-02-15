export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { parseAIJSON } from '@/lib/ai/formatters';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { handleSecurityError } from '@/lib/utils/api-security';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { updateUserUsage } from '@/lib/firebase/firestore';
import { DEFAULT_GEMINI_MODEL } from '@/lib/ai/gemini';
import { buildDesignBrainContext } from '@/lib/ai/prompts/design-brain-context';

export const runtime = 'nodejs';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { funnelId, userId, brandId, context } = body;

    if (!brandId) {
      return createApiError(400, 'brandId é obrigatório.');
    }

    try {
      await requireBrandAccess(request, brandId);
    } catch (error) {
      return handleSecurityError(error);
    }

    if (!funnelId || !context?.copy) {
      return createApiError(400, 'Contexto de copy é obrigatório.');
    }

    const modelName = DEFAULT_GEMINI_MODEL;
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: { responseMimeType: "application/json" }
    });

    // Sprint I: Load brain context from design_director identity card
    let designBrainContext = '';
    try {
      designBrainContext = buildDesignBrainContext();
    } catch (brainErr) {
      console.warn('⚠️ Falha ao carregar brain context do design_director:', brainErr);
    }

    // Detect language from copy content (default: Portuguese)
    const copyLanguage = context.language || 'português brasileiro';

    const prompt = `
      Você é o Conselho de Design Estratégico do "Conselho de Funil".
      Sua missão é criar prompts visuais ESTRATÉGICOS baseados no framework C.H.A.P.E.U.

      ${designBrainContext ? `${designBrainContext}\n\nAplique RIGOROSAMENTE os frameworks e princípios do Diretor de Arte acima.\n` : ''}

      [CONTEXTO ESTRATÉGICO]
      Objetivo: ${context.objective}
      Copy aprovada: ${context.copy}
      Hooks aprovados: ${JSON.stringify(context.hooks)}

      [REGRA DE IDIOMA — OBRIGATÓRIO E INEGOCIÁVEL]
      O idioma da copy aprovada é: ${copyLanguage}.
      TODOS os textos de assets (headline, primaryText, callToAction) DEVEM ser escritos em ${copyLanguage}.
      O visualPrompt deve ser escrito em inglês (para o motor de imagem), mas DEVE incluir instruções explícitas
      para renderizar qualquer texto visível na imagem em ${copyLanguage}.
      EXCEÇÃO ÚNICA: termos técnicos consagrados do nicho (ex: "ROAS", "CPA", "Meta Ads") podem permanecer em inglês.
      Fora isso, headlines, CTAs, subtítulos e qualquer frase completa DEVEM estar em ${copyLanguage}.

      [INSTRUÇÕES C.H.A.P.E.U — RIGOROSO]
      Para cada criativo, aplique TODOS os 6 pilares:
      1. [C] CONTRASTE ALTO: Diferença dramática entre fundo e elementos-chave. Use cores complementares, luz vs sombra, grande vs pequeno.
      2. [H] HIERARQUIA VISUAL: Defina a "Jornada do Olhar" — qual elemento o usuário vê PRIMEIRO, SEGUNDO e TERCEIRO.
      3. [A] ANTROPOMORFISMO: Presença humana OBRIGATÓRIA — rostos expressivos, olhar direto para câmera, emoção visível.
      4. [P] PROVA & PROPS: Elementos que transmitem credibilidade — números, badges, selos, depoimentos visuais.
      5. [E] ESTRUTURA & ESPAÇO: Composição em camadas com profundidade. Espaço negativo para headline e CTA.
      6. [U] URGÊNCIA VISUAL: Elemento que gera senso de ação imediata — timer, seta, brilho, destaque no CTA.

      Planeje EXATAMENTE 2 criativos diferentes (um para Feed e outro para Stories/Reels).

      Retorne APENAS um JSON no formato:
      {
        "prompts": [
          {
            "platform": "meta",
            "format": "square",
            "safeZone": "feed",
            "visualPrompt": "Scene description in English for image model. MANDATORY LANGUAGE RULE: ALL visible text, headlines, CTAs, subtitles rendered in the image MUST be written in ${copyLanguage} — NEVER in English. Include specific description of scene, lighting, composition, human presence, and emotional tone. End the prompt with: 'CRITICAL: Render all text overlays in ${copyLanguage} only.'",
            "aspectRatio": "1:1",
            "strategy": {
              "contrastFocus": "Descrição específica do contraste usado",
              "balanceType": "asymmetrical",
              "hierarchyOrder": ["Headline", "Product", "CTA"],
              "proximityLogic": "Como os elementos se agrupam",
              "unityTheme": "Tema visual unificador"
            },
            "assets": {
              "headline": "Headline CURTA e IMPACTANTE em ${copyLanguage} (extraída/adaptada da copy aprovada)",
              "primaryText": "Texto principal do Ad em ${copyLanguage}"
            }
          }
        ]
      }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const parsed = parseAIJSON(responseText);

    // SIG-API-03: Decrementar 2 créditos por geração de design plan
    if (userId) {
      try {
        await updateUserUsage(userId, -2);
        console.log(`[Design/Plan] 2 créditos decrementados para usuário: ${userId}`);
      } catch (creditError) {
        console.error('[Design/Plan] Erro ao atualizar créditos:', creditError);
      }
    }

    return createApiSuccess({ prompts: parsed.prompts || [] });

  } catch (error) {
    console.error('Design plan error:', error);
    return createApiError(500, 'Falha ao planejar design.');
  }
}
