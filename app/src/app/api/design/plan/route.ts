export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { parseAIJSON } from '@/lib/ai/formatters';
import { requireBrandAccess, requireMinTier } from '@/lib/auth/brand-guard';
import { handleSecurityError } from '@/lib/utils/api-security';
import { consumeCredits, CREDIT_COSTS } from '@/lib/firebase/firestore-server';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { updateUserUsage } from '@/lib/firebase/firestore';
import { getBrand } from '@/lib/firebase/brands';
import { DEFAULT_GEMINI_MODEL } from '@/lib/ai/gemini';
import { buildDesignBrainContext } from '@/lib/ai/prompts/design-brain-context';
import { getChapeuProfilePrompt } from '@/lib/ai/prompts/design';
import { loadBrandIntelligence } from '@/lib/intelligence/research/brand-context';
import { loadCampaignContext } from '@/lib/ai/campaign-context';

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
      // User creative controls
      selectedStyles,      // string[] — general style IDs
      selectedBrandRefs,   // string[] — brand reference IDs
      freeStyleText,       // string — free-form style description
      selectedStyle,       // legacy single style (backward compat)
      selectedFormats,
      customPalette,
    } = body;

    if (!brandId) {
      return createApiError(400, 'brandId é obrigatório.');
    }

    try {
      const { effectiveTier, userId: authUserId } = await requireBrandAccess(request, brandId);
      requireMinTier(effectiveTier, 'pro');
      await consumeCredits(authUserId, CREDIT_COSTS.design_plan, 'design_plan');
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

    // Load campaign context (Golden Thread)
    let campaignContextBlock = '';
    try {
      const campaignId = body.campaignId || funnelId;
      const campaignCtx = await loadCampaignContext(campaignId);
      if (campaignCtx) {
        const parts: string[] = [];
        if (campaignCtx.bigIdea) parts.push(`Big Idea: ${campaignCtx.bigIdea}`);
        if (campaignCtx.awareness) parts.push(`Awareness: ${campaignCtx.awareness}`);
        if (campaignCtx.tone) parts.push(`Tom: ${campaignCtx.tone}`);
        if (campaignCtx.targetAudience) parts.push(`Público: ${campaignCtx.targetAudience}`);
        if (campaignCtx.hooks.length > 0) parts.push(`Hooks aprovados: ${campaignCtx.hooks.slice(0, 5).join(' | ')}`);
        if (campaignCtx.pain) parts.push(`Dor principal: ${campaignCtx.pain}`);
        if (campaignCtx.offerPromise) parts.push(`Promessa: ${campaignCtx.offerPromise}`);
        if (parts.length > 0) {
          campaignContextBlock = `\n[CONTEXTO DA CAMPANHA — LINHA DE OURO]\n${parts.join('\n')}\nDados reais do manifesto — prioridade sobre inputs do frontend.\n`;
          console.log('[Design/Plan] Campaign context injected');
        }
      }
    } catch (err) {
      console.warn('[Design/Plan] Campaign context fetch failed:', err);
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
        inspirationContext = `\n[INSPIRAÇÃO VISUAL]\nO usuário quer um estilo inspirado em: ${traits.join(', ')}.\nAdapte a direção visual para incorporar esses elementos.\n`;
      }
    }

    // Build art direction profile context — user's selected approach takes priority
    const selectedApproach = body.selectedApproach;
    let artDirectionContext = '';
    if (selectedApproach) {
      artDirectionContext = `\n[ABORDAGEM ESCOLHIDA PELO USUÁRIO: ${selectedApproach}]\nO usuário escolheu a abordagem "${selectedApproach}". TODA a direção visual deve seguir esta abordagem.\n`;
      // Try to get matching profile
      const profilePrompt = getChapeuProfilePrompt(selectedApproach);
      if (profilePrompt) artDirectionContext += profilePrompt;
    } else if (analysis?.artDirection || analysis?.chapeuProfile) {
      artDirectionContext = getChapeuProfilePrompt(analysis.artDirection || analysis.chapeuProfile);
    }

    // Build style direction from user selections
    const STYLE_DIRECTIONS: Record<string, string> = {
      'photography': 'Fotografia realista, editorial quality, lifestyle shots, natural lighting, real textures. Evite qualquer aparência de IA/CGI.',
      'minimal': 'Design minimalista, espaço negativo abundante, tipografia como elemento principal, máximo 3 cores, clean e sofisticado.',
      'bold': 'Design impactante, cores vibrantes e saturadas, tipografia grande e ousada, contraste máximo, elementos gráficos fortes.',
      'illustration': 'Ilustração flat design ou vetorial, personagens estilizados, cores sólidas, formas geométricas, estilo cartoon profissional.',
      '3d-render': 'Render 3D fotorrealista, objetos com profundidade, gradientes modernos, iluminação volumétrica, estética futurista/tech.',
      'collage': 'Colagem criativa, mix de fotos e texturas, layers sobrepostos, estética editorial moderna, recortes e justaposição.',
      'cinematic': 'Luz dramática cinematográfica, paleta escura com pontos de luz, composição widescreen, mood intenso, grain sutil.',
      'neon': 'Estética neon/cyber, fundo escuro com luzes neon vibrantes, glow effects, cores fluorescentes, atmosfera noturna urbana.',
    };

    const BRAND_REF_DIRECTIONS: Record<string, string> = {
      'apple': 'Estilo Apple: produto isolado em fundo clean (branco ou preto puro), tipografia San Francisco fina e leve, muito espaço negativo, composição centrada, iluminação studio perfeita, sem elementos decorativos desnecessários.',
      'nike': 'Estilo Nike: alto contraste preto e branco com acentos de cor, tipografia bold condensada (Futura-like), atleta em ação/movimento, ângulos dinâmicos, composição assimétrica agressiva, energia e velocidade.',
      'nubank': 'Estilo Nubank: paleta roxa (#820AD1) com acentos em branco, ilustrações geométricas flat, personagens simpáticos, cantos arredondados, vibe friendly e acessível, layout arejado.',
      'luxury': 'Estilo Luxury/Premium: dourado com preto ou creme, tipografia serif elegante (Didot/Bodoni), texturas sutis (mármore, linho), minimalismo sofisticado, composição equilibrada, sensação de exclusividade.',
      'fitness': 'Estilo Fitness Agressivo: vermelho/preto dominante, tipografia ultra-bold distressed, ângulos oblíquos, gradientes dramáticos, fotos de alta energia, antes/depois, números de resultado em destaque.',
      'tech-saas': 'Estilo Tech/SaaS: gradientes modernos (azul-violeta), glassmorphism, mockups de dashboard/interface, sombras suaves, formas geométricas fluidas, sensação de inovação e modernidade.',
      'organic': 'Estilo Orgânico/Natural: paleta terrosa (verde-sage, terracota, creme, marrom), texturas naturais (papel kraft, madeira, linho), tipografia handwritten ou serif orgânico, fotos de natureza, composição relaxada.',
    };

    // Assemble style context from all 3 blocks
    const styleBlocks: string[] = [];

    // Block 1: General styles (multi-select)
    const stylesArr = selectedStyles?.length > 0 ? selectedStyles : (selectedStyle ? [selectedStyle] : []);
    if (stylesArr.length > 0) {
      const directions = stylesArr
        .map((s: string) => STYLE_DIRECTIONS[s])
        .filter(Boolean);
      if (directions.length > 0) {
        styleBlocks.push(`Estilos gerais: ${stylesArr.join(' + ')}\n${directions.join('\n')}`);
      }
    }

    // Block 2: Brand references
    if (selectedBrandRefs?.length > 0) {
      const refDirections = selectedBrandRefs
        .map((r: string) => BRAND_REF_DIRECTIONS[r])
        .filter(Boolean);
      if (refDirections.length > 0) {
        styleBlocks.push(`Referências de marca:\n${refDirections.join('\n')}`);
      }
    }

    // Block 3: Free-text style
    if (freeStyleText?.trim()) {
      styleBlocks.push(`Descrição livre do usuário: "${freeStyleText.trim()}"`);
    }

    let styleContext = '';
    if (styleBlocks.length > 0) {
      styleContext = `\n[ESTILO VISUAL — ESCOLHIDO PELO USUÁRIO — OBRIGATÓRIO]\n${styleBlocks.join('\n\n')}\n\nCOMBINE todos os estilos acima em uma direção visual coesa. TODOS os criativos DEVEM seguir esta direção. NÃO gere estilo genérico "Professional and modern".\n`;
    }

    // Build format instructions from user selection
    let formatContext = '';
    if (selectedFormats?.length > 0) {
      formatContext = `\n[FORMATOS SOLICITADOS PELO USUÁRIO]\n${selectedFormats.map((f: any, i: number) =>
        `${i + 1}. ${f.label} — Ratio: ${f.ratio} — Plataforma: ${f.platform}${f.multi ? ' (CARROSSEL: gere 3-5 slides interconectados com progressão narrativa)' : ''}`
      ).join('\n')}\nGere EXATAMENTE ${selectedFormats.length} criativo(s), um para cada formato solicitado.\n`;
    }

    // Build custom palette context
    let paletteContext = '';
    if (customPalette?.length > 0) {
      paletteContext = `\n[PALETA DE CORES PERSONALIZADA — USE ESTAS CORES]\nCores definidas pelo usuário: ${customPalette.join(', ')}\nUse ESTAS cores como paleta principal, não as do BrandKit.\n`;
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
    } else if (selectedFormats?.length > 0) {
      // User selected specific formats — generate one per format
      pieceInstructions = formatContext;
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
        preferencesContext += `Incline para as preferências do usuário.\n`;
      }
    }

    // Sprint 07 — Brand Intelligence for design direction
    let designIntelContext = '';
    try {
      const intel = await loadBrandIntelligence(brandId);
      if (intel) {
        const parts: string[] = [];
        if (intel.audience.awareness) parts.push(`Estágio de consciência do público: ${intel.audience.awareness}`);
        if (intel.persona?.pains?.length) parts.push(`Dores do público: ${intel.persona.pains.slice(0, 3).join('; ')}`);
        if (intel.spyInsights.length > 0) {
          const emulate = intel.spyInsights.flatMap(s => s.emulate).slice(0, 3);
          const avoid = intel.spyInsights.flatMap(s => s.avoid).slice(0, 3);
          if (emulate.length > 0) parts.push(`Visual de concorrentes para emular: ${emulate.join('; ')}`);
          if (avoid.length > 0) parts.push(`Visual de concorrentes para evitar: ${avoid.join('; ')}`);
        }
        if (parts.length > 0) {
          designIntelContext = `\n[INTELIGÊNCIA DA MARCA]\n${parts.join('\n')}\n`;
          console.log('[Design/Plan] Brand intelligence injected');
        }
      }
    } catch (err) {
      console.warn('[Design/Plan] Brand intelligence fetch failed:', err);
    }

    const prompt = `
      Você é o MKTHONEY — módulo Design Estratégico.
      Sua missão é criar prompts visuais ESTRATÉGICOS com direção de arte inteligente.

      ${designBrainContext ? `${designBrainContext}\n\nConsidere os frameworks e princípios do Diretor de Arte ao criar a direção visual.\n` : ''}

      [CONTEXTO ESTRATÉGICO]
      Objetivo: ${context.objective}
      Copy aprovada: ${context.copy}
      Hooks aprovados: ${JSON.stringify(context.hooks)}
      ${campaignContextBlock}
      ${styleContext}
      ${paletteContext}
      ${characterContext}
      ${inspirationContext}
      ${artDirectionContext}
      ${preferencesContext}
      ${designIntelContext}

      [REGRA DE IDIOMA — OBRIGATÓRIO E INEGOCIÁVEL]
      O idioma da copy aprovada é: ${copyLanguage}.
      TODOS os textos de assets (headline, primaryText, callToAction) DEVEM ser escritos em ${copyLanguage}.
      O visualPrompt deve ser escrito em inglês (para o motor de imagem), mas DEVE incluir instruções explícitas
      para renderizar qualquer texto visível na imagem em ${copyLanguage}.
      EXCEÇÃO ÚNICA: termos técnicos consagrados do nicho (ex: "ROAS", "CPA", "Meta Ads") podem permanecer em inglês.
      Fora isso, headlines, CTAs, subtítulos e qualquer frase completa DEVEM estar em ${copyLanguage}.

      [PRINCÍPIOS DE DIREÇÃO DE ARTE]
      Para cada criativo, considere os seguintes pilares e adapte ao objetivo:
      1. Contraste: Diferença entre fundo e elementos-chave. Adapte a intensidade ao objetivo.
      2. Hierarquia Visual: "Jornada do Olhar" — o que o espectador vê PRIMEIRO, SEGUNDO e TERCEIRO.
      3. Presença Humana: Quando fizer sentido para o objetivo, inclua rostos e emoção.
      4. Credibilidade Visual: Elementos de prova quando o objetivo pedir (números, badges, depoimentos).
      5. Composição: Organização em camadas, espaço para headline e CTA, profundidade adequada.
      6. Direcionamento de Ação: Elemento que guia visualmente para a ação desejada.

      Princípios informam, preferências do usuário decidem.

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

    // Inject styleDirection + inspirationTraits into each prompt for the generate API
    console.log(`[Design/Plan] styleContext length: ${styleContext.length}, selectedStyles: ${JSON.stringify(selectedStyles)}, selectedBrandRefs: ${JSON.stringify(selectedBrandRefs)}, freeStyleText: ${freeStyleText ? 'yes' : 'no'}`);
    const enrichedPrompts = (parsed.prompts || []).map((p: any) => ({
      ...p,
      styleDirection: styleContext || undefined,
      inspirationTraits: inspirationRefs?.flatMap((ref: any) => ref.extractedTraits || []) || [],
    }));

    return createApiSuccess({ prompts: enrichedPrompts });

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
