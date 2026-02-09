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
import { generateWithGemini, isGeminiConfigured } from '@/lib/ai/gemini';
import { updateFunnel, createProposal, getFunnel, updateUserUsage } from '@/lib/firebase/firestore';
import { getBrand } from '@/lib/firebase/brands';
import type { FunnelContext, Proposal, Brand } from '@/types/database';
import { 
  FUNNEL_GENERATION_PROMPT, 
  FUNNEL_ADJUSTMENT_PROMPT, 
  buildFunnelContextPrompt 
} from '@/lib/ai/prompts';
import { formatBrandContextForFunnel, parseAIJSON } from '@/lib/ai/formatters';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120; // 2 minutes for generation

interface GenerateRequest {
  funnelId: string;
  context: FunnelContext;
  userId?: string;
  // Para regeneração com ajustes
  adjustments?: string[];
  originalProposalId?: string;
  baseVersion?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json();
    const { funnelId, context, adjustments, originalProposalId, baseVersion, userId } = body;

    if (!funnelId || !context) {
      return createApiError(400, 'funnelId and context are required');
    }

    if (!isGeminiConfigured()) {
      return createApiError(500, 'Gemini API not configured. Add GOOGLE_AI_API_KEY to .env.local');
    }

    const isAdjustment = adjustments && adjustments.length > 0;
    console.log(`🎯 ${isAdjustment ? 'Regenerando com ajustes' : 'Gerando propostas'} para funil ${funnelId}...`);

    // Update funnel status to generating
    await updateFunnel(funnelId, { status: 'generating' });

    // Load brand context if funnel has brandId
    let brandContext = '';
    try {
      const funnel = await getFunnel(funnelId);
      if (funnel?.brandId) {
        const brand = await getBrand(funnel.brandId);
        if (brand) {
          brandContext = formatBrandContextForFunnel(brand);
          console.log(`🏷️ Usando contexto da marca: ${brand.name}`);
        }
      }
    } catch (err) {
      console.error('Error loading brand:', err);
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

    // 3. Build the full prompt (include brand context if available)
    let contextPrompt = buildFunnelContextPrompt(context, knowledgeContext, adjustments);
    if (brandContext) {
      contextPrompt = `${brandContext}\n\n${contextPrompt}`;
    }
    const basePrompt = isAdjustment ? FUNNEL_ADJUSTMENT_PROMPT : FUNNEL_GENERATION_PROMPT;
    const fullPrompt = `${basePrompt}\n\n${contextPrompt}`;

    // 4. Generate proposals with Gemini
    console.log('🤖 Gerando propostas com Gemini...');
    
    const response = await generateWithGemini(fullPrompt, {
      model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
      temperature: 0.8,
      maxOutputTokens: 8192,
    });

    // 5. Parse JSON response
    let proposalsData;
    try {
      proposalsData = parseAIJSON(response);
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      console.log('Raw response:', response.substring(0, 500));
      
      // Update status to error
      await updateFunnel(funnelId, { status: 'draft' });
      
      return createApiError(500, 'Failed to parse AI response. Please try again.');
    }

    // 6. Save proposals to Firestore
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

      const proposalId = await createProposal(funnelId, proposalData);
      savedProposals.push(proposalId);
      console.log(`💾 Proposta ${isAdjustment ? 'ajustada' : ''} v${version} salva: ${proposalId}`);
    }

    // 7. Update funnel status to review
    await updateFunnel(funnelId, { status: 'review' });

    console.log(`✅ ${savedProposals.length} propostas geradas com sucesso!`);

    // SIG-API-03: Decrementar 3 créditos por geração de funil
    if (userId) {
      try {
        await updateUserUsage(userId, -3);
        console.log(`[Funnels/Generate] 3 créditos decrementados para usuário: ${userId}`);
      } catch (creditError) {
        console.error('[Funnels/Generate] Erro ao atualizar créditos:', creditError);
      }
    }

    return createApiSuccess({
      funnelId,
      proposalIds: savedProposals,
      proposalsCount: savedProposals.length,
    });

  } catch (error) {
    console.error('❌ Erro ao gerar propostas:', error);
    return createApiError(500, error instanceof Error ? error.message : 'Erro interno ao gerar propostas');
  }
}
