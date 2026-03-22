/**
 * API Route para Geração de Propostas de Funil
 * 
 * POST /api/funnels/generate
 * Body: { funnelId: string, context: FunnelContext }
 * 
 * Gera 2-3 propostas de funil usando RAG + Gemini
 */

import { NextRequest, NextResponse } from 'next/server';
import { ragQuery, retrieveForFunnelCreation } from '@/lib/ai/rag';
import { generateWithGemini, isGeminiConfigured, DEFAULT_GEMINI_MODEL } from '@/lib/ai/gemini';
import { updateFunnelAdmin, createProposalAdmin, getFunnelAdmin, getBrandAdmin, getUserFunnelsAdmin } from '@/lib/firebase/firestore-server';
import type { FunnelContext, Proposal, Brand } from '@/types/database';
import {
  FUNNEL_GENERATION_PROMPT,
  FUNNEL_ADJUSTMENT_PROMPT,
  buildFunnelContextPrompt
} from '@/lib/ai/prompts';
import { formatBrandContextForFunnel, parseAIJSON } from '@/lib/ai/formatters';
import { buildFunnelBrainContext } from '@/lib/ai/prompts/funnel-brain-context';
import { retrieveBrandChunks } from '@/lib/ai/rag';
import { requireUser } from '@/lib/auth/brand-guard';
import { ApiError } from '@/lib/utils/api-security';
import { logger } from '@/lib/utils/logger';
import { checkDailyLimit, consumeCredits, CREDIT_COSTS } from '@/lib/firebase/firestore-server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { Tier } from '@/lib/tier-system';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120; // 2 minutes for generation

interface GenerateRequest {
  funnelId: string;
  context: FunnelContext;
  // Para regeneração com ajustes
  adjustments?: string[];
  originalProposalId?: string;
  baseVersion?: number;
}

export async function POST(request: NextRequest) {
  let _funnelId: string | undefined;
  try {
    // Auth: require authenticated user
    const userId = await requireUser(request);

    // Sprint 02: Daily limit for Free tier + credit consumption
    try {
      const adminDb = getAdminFirestore();
      const userSnap = await adminDb.collection('users').doc(userId).get();
      const userData = userSnap.exists ? (userSnap.data() as Record<string, any>) : {};
      const userTier = (userData.tier as Tier) || 'trial';
      let effectiveUserTier: Tier = userTier;
      if (userTier === 'trial') {
        const trialExp = userData.trialExpiresAt;
        if (trialExp) {
          const expDate = typeof trialExp.toDate === 'function' ? trialExp.toDate() : new Date(trialExp);
          effectiveUserTier = expDate < new Date() ? 'free' : 'pro';
        } else {
          effectiveUserTier = 'pro';
        }
      }
      if (effectiveUserTier === 'free') {
        await checkDailyLimit(userId, 'funnel');
      } else {
        await consumeCredits(userId, CREDIT_COSTS.chat, 'funnel_generate');
      }
    } catch (err: any) {
      if (err.statusCode === 429 || err.statusCode === 402) {
        return NextResponse.json({ error: err.message }, { status: err.statusCode });
      }
      console.warn('[Funnels API] Credit check error (non-blocking):', err.message);
    }

    const body: GenerateRequest = await request.json();
    const { funnelId, context, adjustments, originalProposalId, baseVersion } = body;
    _funnelId = funnelId;

    if (!funnelId || !context) {
      return NextResponse.json(
        { error: 'funnelId and context are required' },
        { status: 400 }
      );
    }

    if (!isGeminiConfigured()) {
      return NextResponse.json(
        { error: 'Gemini API not configured. Add GOOGLE_AI_API_KEY to .env.local' },
        { status: 500 }
      );
    }

    const isAdjustment = adjustments && adjustments.length > 0;
    console.log(`🎯 ${isAdjustment ? 'Regenerando com ajustes' : 'Gerando propostas'} para funil ${funnelId}...`);

    // Update funnel status to generating
    await updateFunnelAdmin(funnelId, { status: 'generating' });

    // Load brand context if funnel has brandId
    let brandContext = '';
    let brand: Brand | null = null;
    try {
      const funnel = await getFunnelAdmin(funnelId);
      if (funnel?.brandId) {
        brand = await getBrandAdmin(funnel.brandId);
        if (brand) {
          brandContext = formatBrandContextForFunnel(brand);
          console.log(`🏷️ Usando contexto da marca: ${brand.name}`);
        }
      }
    } catch (err) {
      logger.error('Error loading brand for funnel generation', { route: '/api/funnels/generate', error: (err as Error).message });
    }

    // 1. Retrieve relevant knowledge
    const queryText = `
      Funil para ${context.objective}
      Mercado: ${context.market}
      Público: ${context.audience.who}
      Dor: ${context.audience.pain}
      Oferta: ${context.offer?.what || 'N/A'}
      Ticket: ${context.offer?.ticket || 'N/A'}
      Canal: ${context.channel?.main || 'N/A'}
    `;

    const chunks = await retrieveForFunnelCreation(
      context.objective,
      context.channel?.main || 'generic',
      context.audience?.who || 'general',
      20 // More chunks for funnel creation
    );

    console.log(`📚 ${chunks.length} chunks de conhecimento recuperados`);

    // 2. Build context string
    const knowledgeContext = chunks.map(c => 
      `[${c.metadata.counselor || 'General'}] ${c.content}`
    ).join('\n\n---\n\n');

    // Sprint 13.1: Inject brain context (6 funnel counselor frameworks)
    const brainContext = buildFunnelBrainContext();

    // Sprint 13.3: Retrieve brand-specific knowledge from RAG
    let brandKnowledge = '';
    try {
      const funnel = await getFunnelAdmin(funnelId);
      if (funnel?.brandId) {
        const brandChunks = await retrieveBrandChunks(funnel.brandId,
          `${context.objective} ${context.audience?.who} ${context.offer?.what}`, 10);
        if (brandChunks.length > 0) {
          brandKnowledge = `\n\n## CONHECIMENTO ESPECÍFICO DA MARCA\n\n${
            brandChunks.map(c => c.content).join('\n\n')}`;
          console.log(`📖 ${brandChunks.length} brand-specific chunks recuperados`);
        }
      }
    } catch (err) {
      console.warn('[Funnels] Brand RAG failed (non-blocking):', (err as Error).message);
    }

    // Sprint 13.4: Load previous funnels for same brand to avoid repetition
    let previousFunnelsContext = '';
    try {
      const funnel = await getFunnelAdmin(funnelId);
      if (funnel?.brandId) {
        const allFunnels = await getUserFunnelsAdmin(userId);
        const sameBrand = allFunnels.filter(f => f.brandId === funnel.brandId && f.id !== funnelId);
        if (sameBrand.length > 0) {
          previousFunnelsContext = `\n\n## FUNIS ANTERIORES DESTA MARCA (evite repetir)\n\n${
            sameBrand.slice(0, 5).map(f =>
              `- "${f.name}" — Objetivo: ${f.context?.objective}, Canal: ${f.context?.channel?.main}, Status: ${f.status}`
            ).join('\n')
          }\n\nIMPORTANTE: Proponha estratégias DIFERENTES das listadas acima.`;
          console.log(`🔁 ${sameBrand.length} funis anteriores carregados para deduplicação`);
        }
      }
    } catch (err) {
      console.warn('[Funnels] Previous funnels load failed (non-blocking):', (err as Error).message);
    }

    // 3. Build the full prompt (include brain + brand + knowledge contexts)
    let contextPrompt = buildFunnelContextPrompt(context, knowledgeContext, adjustments);
    if (brainContext) {
      contextPrompt = `${brainContext}\n\n${contextPrompt}`;
    }
    if (brandContext) {
      contextPrompt = `${brandContext}\n\n${contextPrompt}`;
    }
    if (brandKnowledge) {
      contextPrompt = `${contextPrompt}\n\n${brandKnowledge}`;
    }
    if (previousFunnelsContext) {
      contextPrompt = `${contextPrompt}\n\n${previousFunnelsContext}`;
    }
    const basePrompt = isAdjustment ? FUNNEL_ADJUSTMENT_PROMPT : FUNNEL_GENERATION_PROMPT;
    const fullPrompt = `${basePrompt}\n\n${contextPrompt}`;

    // 4. Generate proposals with Gemini
    console.log('🤖 Gerando propostas com Gemini...');
    
    const response = await generateWithGemini(fullPrompt, {
      model: DEFAULT_GEMINI_MODEL,
      temperature: brand?.aiConfiguration?.temperature || 0.8,
      topP: brand?.aiConfiguration?.topP || 0.95,
      maxOutputTokens: 16384,
      responseMimeType: 'application/json',
      timeoutMs: 90_000, // 90s — funnel generation with 16k tokens needs more than the default 30s
    });

    // 5. Validate Gemini response is not empty
    if (!response || response.trim().length === 0) {
      console.error('❌ Gemini returned empty response');
      await updateFunnelAdmin(funnelId, { status: 'draft' });
      return NextResponse.json(
        { error: 'AI returned empty response. Please try again.' },
        { status: 500 }
      );
    }

    // 6. Parse JSON response
    let proposalsData;
    try {
      proposalsData = parseAIJSON(response);
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      console.log('Raw response (first 500):', response.substring(0, 500));

      // Update status to error
      await updateFunnelAdmin(funnelId, { status: 'draft' });

      return NextResponse.json(
        { error: 'Failed to parse AI response. Please try again.' },
        { status: 500 }
      );
    }

    // 7. Validate proposals array
    if (!proposalsData?.proposals || !Array.isArray(proposalsData.proposals) || proposalsData.proposals.length === 0) {
      console.error('❌ Parsed response missing proposals array:', JSON.stringify(proposalsData).substring(0, 300));
      await updateFunnelAdmin(funnelId, { status: 'draft' });
      return NextResponse.json(
        { error: 'AI response missing proposals. Please try again.' },
        { status: 500 }
      );
    }

    // 8. Save proposals to Firestore
    const savedProposals: string[] = [];
    const startVersion = baseVersion ? baseVersion + 1 : 1;

    for (let i = 0; i < proposalsData.proposals.length; i++) {
      const proposal = proposalsData.proposals[i];
      const version = isAdjustment ? startVersion : i + 1;
      
      const proposalData: Omit<Proposal, 'id' | 'funnelId' | 'createdAt'> = {
        version,
        name: isAdjustment ? `${proposal.name} (v${version})` : proposal.name,
        summary: proposal.summary,
        architecture: proposal.architecture,
        strategy: proposal.strategy,
        assets: proposal.assets,
        scorecard: proposal.scorecard,
        status: 'pending',
        ...(isAdjustment && originalProposalId ? { 
          parentProposalId: originalProposalId,
          appliedAdjustments: adjustments 
        } : {}),
      };

      const proposalId = await createProposalAdmin(funnelId, proposalData);
      savedProposals.push(proposalId);
      console.log(`💾 Proposta ${isAdjustment ? 'ajustada' : ''} v${version} salva: ${proposalId}`);
    }

    // 9. Update funnel status to review
    await updateFunnelAdmin(funnelId, { status: 'review' });

    console.log(`✅ ${savedProposals.length} propostas geradas com sucesso!`);

    return NextResponse.json({
      success: true,
      funnelId,
      proposalIds: savedProposals,
      proposalsCount: savedProposals.length,
    });

  } catch (error) {
    // Auth errors: return proper status code
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    logger.error('Funnel generation failed', { route: '/api/funnels/generate', error: (error as Error).message });

    // Reset funnel status to draft so it doesn't get stuck in 'generating'
    if (_funnelId) {
      try { await updateFunnelAdmin(_funnelId, { status: 'draft' }); } catch { /* best effort */ }
    }

    if (error instanceof Error) {
      const msg = error.message || '';
      if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('QUOTA_EXCEEDED') || msg.includes('429')) {
        return NextResponse.json(
          { error: 'Cota de IA excedida. Tente novamente em alguns minutos.' },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno ao gerar propostas' },
      { status: 500 }
    );
  }
}