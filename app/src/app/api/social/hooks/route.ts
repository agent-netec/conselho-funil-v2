import { NextRequest, NextResponse } from 'next/server';
import { ragQuery } from '@/lib/ai/rag';
import { generateWithGemini, isGeminiConfigured, DEFAULT_GEMINI_MODEL } from '@/lib/ai/gemini';
import { parseAIJSON } from '@/lib/ai/formatters';
import { getBrand } from '@/lib/firebase/brands';
import { SOCIAL_HOOKS_PROMPT } from '@/lib/ai/prompts';
import { requireBrandAccess, requireMinTier } from '@/lib/auth/brand-guard';
import { handleSecurityError } from '@/lib/utils/api-security';
import { consumeCredits, CREDIT_COSTS } from '@/lib/firebase/firestore-server';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { loadCampaignContext } from '@/lib/ai/campaign-context';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const { brandId, platform, topic, campaignType, contentFormats, campaignId, mode } = await request.json();
    const isQuickMode = mode === 'quick';

    if (!brandId) {
      return createApiError(400, 'brandId é obrigatório.');
    }

    let userId = '';
    try {
      const auth = await requireBrandAccess(request, brandId);
      userId = auth.userId;
      requireMinTier(auth.effectiveTier, 'starter');
    } catch (error) {
      return handleSecurityError(error);
    }

    // Consume credits based on mode: quick (1) or strategic (2)
    const creditCost = isQuickMode ? CREDIT_COSTS.social_quick : CREDIT_COSTS.social_strategic;
    try {
      await consumeCredits(userId, creditCost, isQuickMode ? 'social_quick' : 'social_strategic');
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
    let brand: any = null;
    try {
      brand = await getBrand(brandId);
      if (brand) {
        brandContext = `
Marca: ${brand.name}
Vertical: ${brand.vertical}
Posicionamento: ${brand.positioning}
Tom de Voz: ${brand.voiceTone}
Audiência: ${brand.audience?.who || 'N/A'}
Dores da Audiência: ${brand.audience?.pain || 'N/A'}
Oferta Principal: ${brand.offer?.what || 'N/A'}
Diferencial: ${brand.offer?.differentiator || 'N/A'}
        `.trim();
      }
    } catch (brandErr) {
      console.warn('[Social/Hooks] Brand load failed:', brandErr);
    }

    // 1b. Carregar contexto da campanha (Linha de Ouro)
    let campaignContext = '';
    try {
      const campaign = await loadCampaignContext(campaignId);
      if (campaign) {
        campaignContext = `\n\n${campaign.text}`;
        console.log(`[Social/Hooks] Campaign context loaded: ${campaignId}`);
      }
    } catch (campErr) {
      console.warn('[Social/Hooks] Campaign context load failed:', campErr);
    }

    // 2. Buscar heurísticas via RAG
    const queryText = `Heurísticas, ganchos e regras para ${platform}. Como viralizar e reter atenção no ${platform} com o tema ${topic}.`;
    const { context: knowledgeContext } = await ragQuery(queryText, {
      topK: 8,
      minSimilarity: 0.15,
      filters: { docType: 'heuristics' }
    });

    // 3. Montar Prompt
    let fullPrompt: string;
    if (isQuickMode) {
      // Quick mode: 3 full posts, simpler prompt, no content plan
      fullPrompt = `Você é o especialista de conteúdo social do MKTHONEY.

Gere exatamente 3 posts COMPLETOS e prontos para publicar na plataforma ${platform}.

## Tema: ${topic}

## Contexto da Marca:
${brandContext}

## Regras:
1. Cada post deve ser completo com: hook (gancho), body (corpo 2-4 parágrafos), cta (chamada para ação), hashtags (5-15)
2. Adapte o comprimento à plataforma:
   - Instagram feed: 150-300 palavras
   - LinkedIn: 200-400 palavras
   - X (Twitter): 240-280 caracteres total
   - TikTok caption: 50-150 palavras
3. Varie os estilos: 1 curiosidade, 1 emocional/identificação, 1 autoridade/dados
4. O hook deve parar o scroll nos primeiros 0.5s
5. O body deve desenvolver a ideia de forma envolvente
6. O CTA deve ser claro e natural

Retorne APENAS JSON:
{
  "platform": "${platform}",
  "hooks": [
    {
      "style": "estilo",
      "content": "hook (1 frase)",
      "body": "corpo do post (2-4 parágrafos separados por \\n\\n)",
      "cta": "chamada para ação",
      "hashtags": ["#tag1", "#tag2"],
      "suggestedVisual": "sugestão de visual",
      "reasoning": "justificativa",
      "postType": "post | reel | carousel"
    }
  ],
  "best_practices": []
}

${knowledgeContext ? `## Heurísticas:\n${knowledgeContext}` : ''}
${campaignContext}`;
    } else {
      fullPrompt = SOCIAL_HOOKS_PROMPT
        .replace('{{brandContext}}', brandContext)
        .replace('{{platform}}', platform)
        .replace('{{campaignType}}', campaignType || 'organic')
        .replace('{{contentFormats}}', (contentFormats || []).join(', ') || 'Todos os formatos')
        .replace('{{topic}}', topic)
        .replace('{{knowledgeContext}}', knowledgeContext || 'Use conhecimento geral sobre melhores práticas de redes sociais.')
        + campaignContext;
    }

    // 4. Gerar com Gemini
    const response = await generateWithGemini(fullPrompt, {
      model: DEFAULT_GEMINI_MODEL,
      temperature: brand?.aiConfiguration?.temperature || 0.85,
      topP: brand?.aiConfiguration?.topP || 0.95,
      maxOutputTokens: 8192,
      timeoutMs: 50_000,
      // responseMimeType omitted: free-text prompt with embedded JSON instructions
      // works better without constraint — parseAIJSON handles markdown wrapping
    });

    // 5. Parse JSON
    let result;
    try {
      if (!response?.trim()) {
        console.error('[Social/Hooks] Empty response from Gemini');
        return createApiError(500, 'A IA retornou uma resposta vazia. Tente novamente.');
      }
      result = parseAIJSON(response);
    } catch (parseError) {
      console.error('[Social/Hooks] Parse error:', parseError, '| response[:300]:', response?.slice(0, 300));
      return createApiError(500, 'Erro ao processar resposta da IA. Tente novamente.');
    }

    return createApiSuccess(result);
  } catch (error) {
    console.error('Hook generation error:', error);
    if (error instanceof Error) {
      const msg = error.message || '';
      if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('QUOTA_EXCEEDED') || msg.includes('429')) {
        return createApiError(429, 'Cota de IA excedida. Tente novamente em alguns minutos.');
      }
    }
    return createApiError(500, 'Erro interno no servidor', { details: String(error) });
  }
}






