export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { parseAIJSON } from '@/lib/ai/formatters';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { handleSecurityError } from '@/lib/utils/api-security';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { updateUserUsage } from '@/lib/firebase/firestore';
import { getBrand } from '@/lib/firebase/brands';
import { DEFAULT_GEMINI_MODEL } from '@/lib/ai/gemini';
import { buildDesignBrainContext } from '@/lib/ai/prompts/design-brain-context';
import { getChapeuProfilePrompt } from '@/lib/ai/prompts/design';

export const runtime = 'nodejs';
export const maxDuration = 60;

const genAI = new GoogleGenerativeAI((process.env.GOOGLE_AI_API_KEY || '').trim());

/** Maps piece roles to strategic direction for prompt generation */
const PIECE_ROLE_DIRECTIONS: Record<string, string> = {
  hook: 'Pattern interrupt, curiosidade, alto contraste. Tráfego FRIO. Deve parar o scroll imediatamente. Foco em emoção e surpresa visual.',
  development: 'Explica a oferta, benefícios, tom mais quente. Tráfego MORNO. Deve educar e gerar desejo. Foco em clareza e storytelling.',
  proof: 'Testimonial, números, badges. Credibilidade e confiança. Deve validar a decisão. Foco em prova social e resultados reais.',
  retargeting: 'Urgência, escassez, CTA direto. Tráfego QUENTE. Deve converter. Foco em ação imediata e oferta clara.',
  standalone: 'Peça autônoma que funciona sozinha. Deve cobrir todo o espectro: atenção + informação + CTA.',
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      funnelId,
      userId,
      brandId,
      context,
      // Design Director expansion
      campaignSystemEnabled,
      selectedCharacterIds,
      inspirationRefs,
      analysis,
    } = body;

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

    // Load brand for AI config + characters
    let brand: any = null;
    if (brandId) {
      try {
        brand = await getBrand(brandId);
      } catch (err) {
        console.warn('[Design/Plan] Error loading brand for AI config:', err);
      }
    }

    const modelName = DEFAULT_GEMINI_MODEL;
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        responseMimeType: "application/json",
        temperature: brand?.aiConfiguration?.temperature || 0.7,
        topP: brand?.aiConfiguration?.topP || 0.95,
      }
    });

    // Load brain context
    let designBrainContext = '';
    try {
      designBrainContext = buildDesignBrainContext();
    } catch (brainErr) {
      console.warn('⚠️ Falha ao carregar brain context do design_director:', brainErr);
    }

    // Detect language
    const copyLanguage = context.language || 'português brasileiro';

    // Build character context
    let characterContext = '';
    if (selectedCharacterIds?.length > 0 && brand?.brandKit?.characters) {
      const selectedChars = brand.brandKit.characters.filter(
        (c: any) => selectedCharacterIds.includes(c.id)
      );
      if (selectedChars.length > 0) {
        characterContext = `\n[PERSONAGENS SELECIONADOS]\n${selectedChars.map(
          (c: any) => `- ${c.name} (${c.role}): ${c.description || 'Sem descrição'}. Frequência: ${c.useFrequency}. Foto disponível como referência.`
        ).join('\n')}\nINCLUA esses personagens nos criativos quando possível. Use seus nomes e papéis no contexto visual.\n`;
      }
    }

    // Build inspiration context
    let inspirationContext = '';
    if (inspirationRefs?.length > 0) {
      const traits = inspirationRefs.flatMap((ref: any) => ref.extractedTraits || []);
      if (traits.length > 0) {
        inspirationContext = `\n[INSPIRAÇÃO VISUAL]\nO usuário quer um estilo inspirado em: ${traits.join(', ')}.\nAdapte a direção visual para incorporar esses elementos mantendo compliance C.H.A.P.E.U.\n`;
      }
    }

    // Build C.H.A.P.E.U profile context
    let chapeuProfileContext = '';
    if (analysis?.chapeuProfile) {
      chapeuProfileContext = getChapeuProfilePrompt(analysis.chapeuProfile);
    }

    // Determine pieces to generate
    const isSystemMode = campaignSystemEnabled && analysis?.recommendedPieces?.length;
    let pieceInstructions = '';

    if (isSystemMode) {
      const pieces = analysis.recommendedPieces;
      pieceInstructions = `
      [MODO SISTEMA DE CAMPANHA — ${pieces.length} PEÇAS INTERCONECTADAS]
      Gere EXATAMENTE ${pieces.length} criativos interconectados com DNA visual compartilhado.
      Todas as peças devem usar a MESMA paleta, tipografia e elementos de marca.

      ${pieces.map((p: any, i: number) => `
      PEÇA ${i + 1}/${pieces.length}:
      - Papel: ${p.role} — ${PIECE_ROLE_DIRECTIONS[p.role] || PIECE_ROLE_DIRECTIONS.standalone}
      - Plataforma: ${p.platform}
      - Formato: ${p.format}
      - Safe Zone: ${p.safeZone}
      - Aspect Ratio: ${p.aspectRatio}
      - Justificativa do Diretor: ${p.rationale}
      ${i > 0 ? `- REFERÊNCIA: Esta é a peça ${i + 1} de ${pieces.length}. Deve ser uma progressão natural da peça anterior.` : '- Esta é a PRIMEIRA peça — define o DNA visual do sistema.'}
      `).join('\n')}

      Cada prompt DEVE incluir "pieceRole" no JSON.
      `;
    } else {
      pieceInstructions = `Planeje EXATAMENTE 2 criativos diferentes (um para Feed e outro para Stories/Reels).`;
    }

    // Build preferences context
    let preferencesContext = '';
    // Preferences are loaded server-side if available (from design-preferences collection)
    // This is injected by the caller or loaded here
    // For now, we check if preferences were passed in the body
    if (body.preferences) {
      const prefs = body.preferences;
      if (prefs.preferredStyles?.length > 0 || prefs.avoidPatterns?.length > 0) {
        preferencesContext = `\n[PREFERÊNCIAS DO USUÁRIO]\n`;
        if (prefs.preferredStyles.length > 0) {
          preferencesContext += `Estilos preferidos: ${prefs.preferredStyles.join(', ')}.\n`;
        }
        if (prefs.avoidPatterns.length > 0) {
          preferencesContext += `Evitar: ${prefs.avoidPatterns.join(', ')}.\n`;
        }
        preferencesContext += `Incline para as preferências mantendo compliance C.H.A.P.E.U.\n`;
      }
    }

    const prompt = `
      Você é o MKTHONEY — módulo Design Estratégico.
      Sua missão é criar prompts visuais ESTRATÉGICOS baseados no framework C.H.A.P.E.U.

      ${designBrainContext ? `${designBrainContext}\n\nAplique RIGOROSAMENTE os frameworks e princípios do Diretor de Arte acima.\n` : ''}

      [CONTEXTO ESTRATÉGICO]
      Objetivo: ${context.objective}
      Copy aprovada: ${context.copy}
      Hooks aprovados: ${JSON.stringify(context.hooks)}
      ${characterContext}
      ${inspirationContext}
      ${chapeuProfileContext}
      ${preferencesContext}

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

      ${pieceInstructions}

      Retorne APENAS um JSON no formato:
      {
        "prompts": [
          {
            "platform": "meta",
            "format": "square",
            "safeZone": "feed",
            "visualPrompt": "Scene description in English for image model. MANDATORY LANGUAGE RULE: ALL visible text, headlines, CTAs, subtitles rendered in the image MUST be written in ${copyLanguage} — NEVER in English. Include specific description of scene, lighting, composition, human presence, and emotional tone. End the prompt with: 'CRITICAL: Render all text overlays in ${copyLanguage} only.'",
            "aspectRatio": "1:1",
            "pieceRole": "hook",
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

    // Deduct 2 credits
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
    if (error instanceof Error) {
      const msg = error.message || '';
      if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('QUOTA_EXCEEDED') || msg.includes('429')) {
        return createApiError(429, 'Cota de IA excedida. Tente novamente em alguns minutos.');
      }
    }
    return createApiError(500, 'Falha ao planejar design.');
  }
}
