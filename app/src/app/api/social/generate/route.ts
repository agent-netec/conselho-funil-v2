export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { parseAIJSON } from '@/lib/ai/formatters';
import { requireBrandAccess, requireMinTier } from '@/lib/auth/brand-guard';
import { handleSecurityError } from '@/lib/utils/api-security';
import { consumeCredits, CREDIT_COSTS } from '@/lib/firebase/firestore-server';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { loadBrain } from '@/lib/intelligence/brains/loader';
import { buildScoringPromptFromBrain } from '@/lib/intelligence/brains/prompt-builder';
import type { CounselorId } from '@/types';
import { DEFAULT_GEMINI_MODEL } from '@/lib/ai/gemini';
import { loadCampaignContext } from '@/lib/ai/campaign-context';
import { loadBrandIntelligence } from '@/lib/intelligence/research/brand-context';

export const runtime = 'nodejs';
export const maxDuration = 60;

const genAI = new GoogleGenerativeAI((process.env.GOOGLE_AI_API_KEY || '').trim());

// ═══════════════════════════════════════════════════════
// SOCIAL → EXPERTS MAPPING (Brain Integration — Sprint C)
// ═══════════════════════════════════════════════════════

interface SocialExpertMapping {
  counselorId: CounselorId;
  frameworkId: string;
}

/** 4 social counselors with their primary frameworks */
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

/**
 * Sprint C: Builds brain context for social hook generation.
 * Loads frameworks + red_flags from the 4 social counselors.
 */
function buildSocialBrainContext(): string {
  const parts: string[] = [];

  for (const [area, experts] of Object.entries(SOCIAL_EXPERT_MAP)) {
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
    const body = await request.json();
    const { funnelId, userId, brandId, context, campaignId } = body;

    if (!brandId) {
      return createApiError(400, 'brandId é obrigatório.');
    }

    let authUserId: string;
    try {
      const auth = await requireBrandAccess(request, brandId);
      authUserId = auth.userId;
      requireMinTier(auth.effectiveTier, 'starter');
    } catch (error) {
      return handleSecurityError(error);
    }

    // Consume credits before heavy AI work
    try {
      await consumeCredits(authUserId, CREDIT_COSTS.social_strategic, 'social_strategic');
    } catch (error) {
      return handleSecurityError(error);
    }

    // Linha de Ouro: auto-load copy from campaign if not provided
    let campaignCtx: Awaited<ReturnType<typeof loadCampaignContext>> = null;
    if (campaignId) {
      try {
        campaignCtx = await loadCampaignContext(campaignId);
      } catch (err) {
        console.warn('[Social/Generate] Campaign context load failed:', err);
      }
    }

    // Auto-fill copy from campaign if missing
    if (!context?.copy && campaignCtx?.mainScript) {
      if (!context) (body as any).context = {};
      body.context.copy = campaignCtx.mainScript;
      console.log('[Social/Generate] Auto-loaded copy from campaign:', campaignId);
    }

    if (!funnelId || !body.context?.copy) {
      return createApiError(400, 'Contexto de copy é obrigatório.');
    }

    const modelName = DEFAULT_GEMINI_MODEL;
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: { responseMimeType: "application/json" }
    });

    // Sprint C: Build brain context with real identity cards
    const brainContext = buildSocialBrainContext();

    // Load Offer Lab context if available
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
            `**Preco:** R$ ${c.coreProduct.price} | **Valor Percebido:** R$ ${c.coreProduct.perceivedValue}`,
          ];
          if (c.bonuses?.length > 0) lines.push(`**Bonus:** ${c.bonuses.map((b: any) => b.name).join(', ')}`);
          if (c.riskReversal) lines.push(`**Garantia:** ${c.riskReversal}`);
          if (c.scarcity) lines.push(`**Escassez:** ${c.scarcity}`);
          if (o.scoring?.total) lines.push(`**Score:** ${o.scoring.total}/100`);
          offerSection = lines.join('\n');
          console.log(`[Social/Generate] Offer Lab context injected`);
        }
      }
    } catch (err) {
      console.warn('[Social/Generate] Erro ao buscar offer context:', err);
    }

    // Sprint 07 — Brand Intelligence for social hooks
    let intelSection = '';
    try {
      const intel = await loadBrandIntelligence(brandId);
      if (intel) {
        const parts: string[] = [];
        if (intel.persona) {
          parts.push(`## PERSONA DO PÚBLICO`);
          parts.push(`${intel.persona.name}${intel.persona.age ? `, ${intel.persona.age}` : ''}`);
          if (intel.persona.pains.length > 0) parts.push(`Dores: ${intel.persona.pains.join('; ')}`);
          if (intel.persona.desires.length > 0) parts.push(`Desejos: ${intel.persona.desires.join('; ')}`);
          if (intel.persona.triggers.length > 0) parts.push(`Gatilhos: ${intel.persona.triggers.join('; ')}`);
        }
        if (intel.keywords.topByKOS.length > 0) {
          parts.push(`\n## KEYWORDS TOP (use como temas/hashtags)`);
          parts.push(intel.keywords.topByKOS.join(', '));
        }
        if (parts.length > 0) {
          intelSection = parts.join('\n');
          console.log('[Social/Generate] Brand intelligence injected');
        }
      }
    } catch (err) {
      console.warn('[Social/Generate] Brand intelligence fetch failed:', err);
    }

    const prompt = `
      Você é o MKTHONEY — módulo Social, composto por 4 especialistas com frameworks reais de avaliação.
      Sua missão é extrair HOOKS (ganchos de atenção) magnéticos de uma copy aprovada.

      ## IDENTITY CARDS DOS ESPECIALISTAS (Frameworks Reais)

      ${brainContext}

      ## CONTEXTO ESTRATÉGICO
      Objetivo: ${body.context.objective}
      Público-alvo: ${body.context.targetAudience}

      ${offerSection}

      ${intelSection}

      ${campaignCtx ? `## LINHA DE OURO (Contexto da Campanha)
      ${campaignCtx.text}` : ''}

      ## COPY DE REFERÊNCIA
      ${body.context.copy}

      ## INSTRUÇÕES
      1. Crie 5 hooks diferentes focados em parar o scroll.
      2. Varie os estilos: Curiosidade, Medo/Alerta, Benefício Direto, Contra-intuitivo, Prova Social.
      3. Adapte cada hook para ser multi-plataforma (Instagram, LinkedIn, TikTok).
      4. Use os frameworks dos especialistas acima para fundamentar cada hook.
      5. Referencie qual framework/princípio justifica cada hook no campo "reasoning".

      Retorne APENAS um JSON no formato:
      {
        "hooks": [
          {
            "content": "Texto do hook...",
            "style": "Estilo",
            "platform": "Plataforma sugerida",
            "reasoning": "Por que este hook funciona, referenciando framework do especialista"
          }
        ]
      }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const parsed = parseAIJSON(responseText);

    return createApiSuccess({
      hooks: parsed.hooks || []
    });

  } catch (error) {
    console.error('Social generation error:', error);
    if (error instanceof Error) {
      const msg = error.message || '';
      if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('QUOTA_EXCEEDED') || msg.includes('429')) {
        return createApiError(429, 'Cota de IA excedida. Tente novamente em alguns minutos.');
      }
    }
    return createApiError(500, 'Falha ao gerar hooks.');
  }
}
