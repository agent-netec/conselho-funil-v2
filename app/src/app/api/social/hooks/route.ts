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
import { loadBrandIntelligence } from '@/lib/intelligence/research/brand-context';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { loadBrain } from '@/lib/intelligence/brains/loader';
import { buildScoringPromptFromBrain } from '@/lib/intelligence/brains/prompt-builder';
import type { CounselorId } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// ═══════════════════════════════════════════════════════
// 4 Social Counselors — Identity Cards (from social/generate)
// ═══════════════════════════════════════════════════════

interface SocialExpertMapping {
  counselorId: CounselorId;
  frameworkId: string;
}

const SOCIAL_EXPERT_MAP: Record<string, SocialExpertMapping[]> = {
  hooks_viral: [
    { counselorId: 'rachel_karten', frameworkId: 'hook_effectiveness' },
    { counselorId: 'nikita_beer', frameworkId: 'viral_potential' },
  ],
  funnel_algorithm: [
    { counselorId: 'justin_welsh', frameworkId: 'social_funnel_score' },
    { counselorId: 'lia_haberman', frameworkId: 'algorithm_alignment' },
  ],
};

function buildSocialBrainContext(): string {
  const parts: string[] = [];
  for (const [, experts] of Object.entries(SOCIAL_EXPERT_MAP)) {
    const expertParts: string[] = [];
    for (const { counselorId, frameworkId } of experts) {
      const brain = loadBrain(counselorId);
      if (!brain) continue;
      const frameworkJson = buildScoringPromptFromBrain(counselorId, frameworkId);
      if (!frameworkJson) continue;
      const redFlags = brain.redFlags.slice(0, 3).map(rf =>
        `- **${rf.label}**: "${rf.before}" → "${rf.after}"`
      ).join('\n');
      expertParts.push(
        `### ${brain.name} — ${brain.subtitle}\n` +
        `**Principios:** ${brain.principles.slice(0, 200)}...\n` +
        `**Framework (${frameworkId}):**\n${frameworkJson}\n` +
        (redFlags ? `**Erros a Evitar:**\n${redFlags}` : '')
      );
    }
    if (expertParts.length > 0) {
      parts.push(expertParts.join('\n\n'));
    }
  }
  return parts.join('\n\n---\n\n');
}

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

    // 1c. Sprint 07 — Brand Intelligence (persona + keywords + spy)
    let intelSection = '';
    try {
      const intel = await loadBrandIntelligence(brandId);
      if (intel) {
        const parts: string[] = [];
        if (intel.persona) {
          parts.push(`## PERSONA DO PÚBLICO (${intel.persona.source})`);
          parts.push(`${intel.persona.name}${intel.persona.age ? `, ${intel.persona.age}` : ''}`);
          if (intel.persona.pains.length > 0) parts.push(`Dores: ${intel.persona.pains.join('; ')}`);
          if (intel.persona.desires.length > 0) parts.push(`Desejos: ${intel.persona.desires.join('; ')}`);
          if (intel.persona.triggers.length > 0) parts.push(`Gatilhos: ${intel.persona.triggers.join('; ')}`);
        }
        if (intel.keywords.topByKOS.length > 0) {
          parts.push(`\n## KEYWORDS TOP (use como temas/hashtags)`);
          parts.push(intel.keywords.topByKOS.join(', '));
        }
        if (intel.spyInsights.length > 0) {
          parts.push(`\n## CONCORRENTES`);
          for (const spy of intel.spyInsights.slice(0, 2)) {
            if (spy.emulate.length > 0) parts.push(`${spy.competitorName} — Emular: ${spy.emulate.join('; ')}`);
            if (spy.avoid.length > 0) parts.push(`${spy.competitorName} — Evitar: ${spy.avoid.join('; ')}`);
          }
        }
        if (parts.length > 0) {
          intelSection = parts.join('\n');
          console.log('[Social/Hooks] Brand intelligence injected (persona + keywords + spy)');
        }
      }
    } catch (err) {
      console.warn('[Social/Hooks] Brand intelligence fetch failed:', err);
    }

    // 1d. Offer Lab context (oferta ativa da marca)
    let offerSection = '';
    try {
      const adminDb = getAdminFirestore();
      const activeSnap = await adminDb.collection('brands').doc(brandId).collection('offers')
        .where('status', '==', 'active').orderBy('updatedAt', 'desc').limit(1).get();
      const offerSnap = activeSnap.empty
        ? await adminDb.collection('brands').doc(brandId).collection('offers').orderBy('updatedAt', 'desc').limit(1).get()
        : activeSnap;
      if (!offerSnap.empty) {
        const o = offerSnap.docs[0].data();
        const c = o.components;
        if (c?.coreProduct) {
          const lines = [
            `## OFERTA ESTRUTURADA (Offer Lab)`,
            `**Promessa:** ${c.coreProduct.promise}`,
            `**Preço:** R$ ${c.coreProduct.price} | **Valor Percebido:** R$ ${c.coreProduct.perceivedValue}`,
          ];
          if (c.bonuses?.length > 0) lines.push(`**Bônus:** ${c.bonuses.map((b: any) => b.name).join(', ')}`);
          if (c.riskReversal) lines.push(`**Garantia:** ${c.riskReversal}`);
          if (c.scarcity) lines.push(`**Escassez:** ${c.scarcity}`);
          if (o.scoring?.total) lines.push(`**Score:** ${o.scoring.total}/100`);
          offerSection = lines.join('\n');
          console.log('[Social/Hooks] Offer Lab context injected');
        }
      }
    } catch (err) {
      console.warn('[Social/Hooks] Offer Lab fetch failed:', err);
    }

    // 1e. Competitor Profile Analysis (Gap 1D — feeds generation with competitor insights)
    let competitorSection = '';
    try {
      const adminDb = getAdminFirestore();
      const profilesSnap = await adminDb.collection('brands').doc(brandId)
        .collection('competitor_profiles').orderBy('createdAt', 'desc').limit(3).get();
      if (!profilesSnap.empty) {
        const profiles = profilesSnap.docs.map(d => d.data());
        const lines = [`## ANÁLISE DE CONCORRENTES (perfis analisados)`];
        for (const p of profiles) {
          const r = p.report;
          if (!r?.profileName) continue;
          lines.push(`\n### ${r.profileName} (${r.platform || 'N/A'})`);
          if (r.strengths?.length > 0) lines.push(`**Emular:** ${r.strengths.slice(0, 3).join('; ')}`);
          if (r.weaknesses?.length > 0) lines.push(`**Evitar:** ${r.weaknesses.slice(0, 3).join('; ')}`);
          if (r.opportunities?.length > 0) lines.push(`**Oportunidades:** ${r.opportunities.slice(0, 3).join('; ')}`);
          if (r.hookTypes?.length > 0) lines.push(`**Hooks que funcionam:** ${r.hookTypes.join(', ')}`);
        }
        if (lines.length > 1) {
          competitorSection = lines.join('\n');
          console.log(`[Social/Hooks] Competitor profiles injected (${profilesSnap.size} profiles)`);
        }
      }
    } catch (err) {
      console.warn('[Social/Hooks] Competitor profiles fetch failed:', err);
    }

    // 1f. Vault DNA — inject Copy DNA templates for style/tone consistency (Gap 6)
    let dnaSection = '';
    try {
      const adminDb = getAdminFirestore();
      const dnaSnap = await adminDb.collection('brands').doc(brandId)
        .collection('vault_dna').orderBy('updatedAt', 'desc').limit(5).get();
      if (!dnaSnap.empty) {
        const dnaLines = ['## COPY DNA (estilo e estrutura aprovados da marca)'];
        for (const d of dnaSnap.docs) {
          const data = d.data();
          if (!data.name || !data.content) continue;
          dnaLines.push(`\n### ${data.name} (${data.type || 'template'})`);
          dnaLines.push(data.content.substring(0, 300));
          if (data.tags?.length > 0) dnaLines.push(`Tags: ${data.tags.join(', ')}`);
        }
        if (dnaLines.length > 1) {
          dnaSection = dnaLines.join('\n');
        }
      }
    } catch (err) {
      console.warn('[Social/Hooks] Vault DNA fetch failed:', err);
    }

    // 1g. Brain context — identity cards dos 4 conselheiros sociais (strategic mode only)
    const brainContext = isQuickMode ? '' : buildSocialBrainContext();

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

${offerSection ? `${offerSection}\n` : ''}
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

${intelSection ? `## Inteligência da Marca:\n${intelSection}` : ''}
${competitorSection ? `${competitorSection}\n` : ''}
${dnaSection ? `${dnaSection}\n` : ''}
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
        + (brainContext ? `\n\n## IDENTITY CARDS DOS ESPECIALISTAS (Frameworks Reais)\n${brainContext}` : '')
        + (offerSection ? `\n\n${offerSection}` : '')
        + (intelSection ? `\n\n## Inteligência da Marca:\n${intelSection}` : '')
        + (competitorSection ? `\n\n${competitorSection}` : '')
        + (dnaSection ? `\n\n${dnaSection}` : '')
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






