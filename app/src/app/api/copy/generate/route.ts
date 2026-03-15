export const dynamic = 'force-dynamic';
/**
 * API Route para Geração de Copy - Copywriting
 * 
 * POST /api/copy/generate
 * 
 * Gera propostas de copy baseadas no funil aprovado usando os 9 copywriters.
 */

import { NextRequest, NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { updateUserUsageAdmin, getBrandAdmin } from '@/lib/firebase/firestore-server';
import { ragQuery, retrieveBrandChunks, formatBrandContextForLLM, retrieveResearchContext } from '@/lib/ai/rag';
import { generateWithGemini } from '@/lib/ai/gemini';
import { getAllBrandKeywordsForPromptAdmin } from '@/lib/firebase/intelligence-server';
import type {
  Funnel,
  Proposal,
  CopyType,
  AwarenessStage,
  CopyScorecard,
  Brand,
} from '@/types/database';
import {
  AWARENESS_STAGES,
  COPY_TYPES
} from '@/lib/constants';
import { buildCopyPrompt } from '@/lib/ai/prompts';
import { parseAIJSON } from '@/lib/ai/formatters';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { buildCopyBrainContext } from '@/lib/ai/prompts/copy-brain-context';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { handleSecurityError } from '@/lib/utils/api-security';

export const runtime = 'nodejs';
export const maxDuration = 90; // Aumentado para lidar com RAG

/** Format Offer Lab data as rich prompt context */
function formatOfferForPrompt(offer: any): string {
  const c = offer.components;
  if (!c?.coreProduct) return '';

  const parts: string[] = [];
  parts.push(`**Promessa Principal:** ${c.coreProduct.promise}`);
  parts.push(`**Preco:** R$ ${c.coreProduct.price} | **Valor Percebido:** R$ ${c.coreProduct.perceivedValue}`);

  if (c.stacking?.length > 0) {
    parts.push(`**Value Stack (${c.stacking.length} itens):**`);
    c.stacking.forEach((s: any) => {
      parts.push(`  - ${s.name} (R$ ${s.value})${s.description ? ` — ${s.description}` : ''}`);
    });
  }

  if (c.bonuses?.length > 0) {
    parts.push(`**Bonus (${c.bonuses.length}):**`);
    c.bonuses.forEach((b: any) => {
      parts.push(`  - ${b.name} (R$ ${b.value})${b.description ? ` — resolve: ${b.description}` : ''}`);
    });
  }

  if (c.riskReversal) parts.push(`**Garantia:** ${c.riskReversal}`);
  if (c.scarcity) parts.push(`**Escassez:** ${c.scarcity}`);
  if (offer.scoring?.total) parts.push(`**Score de Irresistibilidade:** ${offer.scoring.total}/100`);

  return parts.join('\n');
}

// Map awareness from funnel context to copy awareness
function mapAwareness(funnelAwareness: string): AwarenessStage {
  const mapping: Record<string, AwarenessStage> = {
    'fria': 'unaware',
    'morna': 'problem_aware',
    'quente': 'product_aware',
  };
  return mapping[funnelAwareness] || 'problem_aware';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { funnelId, proposalId, copyType, awarenessStage, userId, conversationId } = body;

    // Validate required fields
    if (!funnelId || !proposalId || !copyType) {
      return createApiError(400, 'funnelId, proposalId, and copyType are required');
    }

    const adminDb = getAdminFirestore();

    // Get funnel and brand
    const funnelSnap = await adminDb.collection('funnels').doc(funnelId).get();

    if (!funnelSnap.exists) {
      return createApiError(404, 'Funnel not found');
    }

    const funnel = { id: funnelSnap.id, ...funnelSnap.data() } as Funnel;

    // Guard: funnel.context is required for copy generation
    if (!funnel.context) {
      return createApiError(400, 'Funnel context is missing. Please complete the funnel wizard first.');
    }

    // Auth guard: derive brandId from funnel, then verify access
    if (funnel.brandId) {
      try {
        await requireBrandAccess(request, funnel.brandId);
      } catch (err: any) {
        return handleSecurityError(err);
      }
    }

    // GAP-3C: load brand for AI config
    let brand: Brand | null = null;
    if (funnel.brandId) {
      try {
        brand = await getBrandAdmin(funnel.brandId);
      } catch (err) {
        console.warn('[Copy] Error loading brand for AI config:', err);
      }
    }

    // Get proposal
    const proposalSnap = await adminDb.collection('funnels').doc(funnelId).collection('proposals').doc(proposalId).get();

    if (!proposalSnap.exists) {
      return createApiError(404, 'Proposal not found');
    }

    const proposal = { id: proposalSnap.id, ...proposalSnap.data() } as Proposal;

    // --- ENRIQUECIMENTO DE CONTEXTO (RAG) ---
    console.log('🔍 Buscando contexto estratégico para copy...');
    
    // 1. Contexto de Conhecimento Geral (Copywriting)
    const market = funnel.context.market || 'digital';
    const objective = funnel.context.objective || 'sales';
    const offerWhat = funnel.context.offer?.what || 'produto/serviço';

    const { context: ragContext } = await ragQuery(
      `Copywriting para ${copyType} no mercado de ${market}. Foco em ${objective}.`,
      { topK: 8, minSimilarity: 0.2, filters: { category: 'copywriting' } }
    );

    // 2. Contexto de Marca (Assets)
    let brandContext = '';
    if (funnel.brandId) {
      const brandChunks = await retrieveBrandChunks(
        funnel.brandId,
        `Copywriting ${copyType} para ${offerWhat}. Voz e tom da marca.`,
        { topK: 5, minSimilarity: 0.5 }
      );
      brandContext = formatBrandContextForLLM(brandChunks);
    }

    // 3. Contexto de Keywords Estratégicas (Sprint N: merged brand keywords + mined)
    let keywordContext = '';
    if (funnel.brandId) {
      try {
        keywordContext = await getAllBrandKeywordsForPromptAdmin(funnel.brandId, 10);
        if (keywordContext) {
          console.log(`[Copy] Keywords context loaded for copy generation`);
        }
      } catch (err) {
        console.warn('[Copy] Erro ao buscar keywords:', err);
      }
    }

    // 4. Offer Lab context — load active offer from brand
    let offerContext = '';
    if (funnel.brandId) {
      try {
        const offersRef = adminDb.collection('brands').doc(funnel.brandId).collection('offers');
        const offersSnap = await offersRef
          .where('status', '==', 'active')
          .orderBy('updatedAt', 'desc')
          .limit(1)
          .get();
        if (offersSnap.empty) {
          // Fallback: most recent draft
          const draftSnap = await offersRef.orderBy('updatedAt', 'desc').limit(1).get();
          if (!draftSnap.empty) {
            const offer = draftSnap.docs[0].data();
            offerContext = formatOfferForPrompt(offer);
          }
        } else {
          const offer = offersSnap.docs[0].data();
          offerContext = formatOfferForPrompt(offer);
        }
        if (offerContext) {
          console.log(`[Copy] Offer Lab context injected for copy generation`);
        }
      } catch (err) {
        console.warn('[Copy] Erro ao buscar offer context:', err);
      }
    }

    // 5. Sprint O — O-3.5: Research context from Deep Research RAG
    let researchContext = '';
    if (funnel.brandId) {
      try {
        const { context } = await retrieveResearchContext(
          `${copyType} para ${market} ${objective}`,
          3
        );
        if (context) {
          researchContext = context;
          console.log(`[Copy] Research context injected from Deep Research RAG`);
        }
      } catch (err) {
        console.warn('[Copy] Erro ao buscar research context:', err);
      }
    }

    // 5. Contexto de Anexos do Chat (Busca no histórico da conversa)
    let attachmentsContext = '';
    if (conversationId) {
      const messagesSnap = await adminDb
        .collection('conversations').doc(conversationId).collection('messages')
        .orderBy('createdAt', 'desc').limit(20).get();
      
      const attachmentMessages = messagesSnap.docs
        .map(doc => doc.data().content as string)
        .filter(content => content.includes('[CONTEXTO DE ANEXOS]'));
      
      if (attachmentMessages.length > 0) {
        attachmentsContext = attachmentMessages.join('\n\n---\n\n');
        console.log(`📎 Encontrados ${attachmentMessages.length} contextos de anexos.`);
      }
    }

    // Determine awareness stage
    const finalAwarenessStage: AwarenessStage = awarenessStage ||
      mapAwareness(funnel.context.audience?.awareness || 'problem');

    // Sprint F: Build brain context from identity cards for this awareness stage
    let brainContext = '';
    try {
      brainContext = buildCopyBrainContext(finalAwarenessStage);
      if (brainContext) {
        console.log(`🧠 Brain context carregado para copy (awareness: ${finalAwarenessStage})`);
      }
    } catch (brainErr) {
      console.warn('⚠️ Falha ao carregar brain context para copy:', brainErr);
    }

    // Build prompt with all context
    const awarenessInfo = AWARENESS_STAGES[finalAwarenessStage];
    const prompt = buildCopyPrompt(
      funnel,
      proposal,
      copyType as CopyType,
      awarenessInfo,
      {
        ragContext: ragContext + researchContext,
        brandContext,
        keywordContext,
        attachmentsContext,
        brainContext,
        offerContext,
      }
    );

    // Generate with Gemini (shared client: timeout + retry on 429 + responseMimeType)
    const responseText = await generateWithGemini(prompt, {
      temperature: brand?.aiConfiguration?.temperature || 0.8,
      topP: brand?.aiConfiguration?.topP || 0.95,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json',
      timeoutMs: 70_000, // 70s — below Vercel maxDuration of 90s
    });

    // Parse response
    let parsedResponse;
    try {
      parsedResponse = parseAIJSON(responseText);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', responseText);
      return createApiError(500, 'Failed to parse AI response', { details: String(parseError) });
    }

    // Build CopyContent - ensure no undefined values (Firestore doesn't accept them)
    const content: Record<string, unknown> = {
      primary: parsedResponse.primary || '',
    };
    
    // Only add optional fields if they have values
    if (parsedResponse.variations && parsedResponse.variations.length > 0) {
      content.variations = parsedResponse.variations;
    }
    if (parsedResponse.structure) {
      content.structure = parsedResponse.structure;
    }
    if (parsedResponse.emails && parsedResponse.emails.length > 0) {
      content.emails = parsedResponse.emails;
    }
    if (parsedResponse.vslSections && parsedResponse.vslSections.length > 0) {
      content.vslSections = parsedResponse.vslSections;
    }

    // Build scorecard
    const scorecard: CopyScorecard = parsedResponse.scorecard || {
      headlines: 7,
      structure: 7,
      benefits: 7,
      offer: 7,
      proof: 7,
      overall: 7,
    };

    // F2-2: Boost offer score using real Offer Lab data
    if (offerContext) {
      try {
        const offersRef = adminDb.collection('brands').doc(funnel.brandId!).collection('offers');
        const activeSnap = await offersRef
          .where('status', '==', 'active')
          .orderBy('updatedAt', 'desc')
          .limit(1)
          .get();
        const offerSnap = activeSnap.empty
          ? (await offersRef.orderBy('updatedAt', 'desc').limit(1).get()).docs[0]
          : activeSnap.docs[0];

        if (offerSnap) {
          const offerLabScore = offerSnap.data().scoring?.total ?? 0;
          // Map Offer Lab score (0-100) to copy offer dimension (1-10)
          const offerDimensionFromLab = Math.max(1, Math.min(10, Math.round(offerLabScore / 10)));
          // Use the higher of AI estimate vs real data
          scorecard.offer = Math.max(scorecard.offer, offerDimensionFromLab);
          // Recalculate overall as average of all 5 dimensions
          scorecard.overall = Math.round(
            (scorecard.headlines + scorecard.structure + scorecard.benefits + scorecard.offer + scorecard.proof) / 5
          );
          console.log(`[Copy] Offer scorecard boosted: lab=${offerLabScore} → dim=${offerDimensionFromLab}, overall=${scorecard.overall}`);
        }
      } catch (err) {
        console.warn('[Copy] Erro ao ajustar offer score com dados reais:', err);
      }
    }

    // Create CopyProposal - filter out undefined values
    const copyProposalData: Record<string, unknown> = {
      funnelId,
      proposalId,
      type: copyType as CopyType,
      name: parsedResponse.name || `${COPY_TYPES[copyType as CopyType].label} - ${funnel.name}`,
      version: 1,
      status: 'pending',
      content,
      scorecard,
      awarenessStage: finalAwarenessStage,
      reasoning: parsedResponse.reasoning || '',
      copywriterInsights: parsedResponse.copywriterInsights || [],
      createdAt: Timestamp.now(),
    };

    // Save to Firestore
    const copyProposalsRef = adminDb.collection('funnels').doc(funnelId).collection('copyProposals');
    const newCopyDoc = await copyProposalsRef.add(copyProposalData);

    console.log(`✅ Copy gerado com sucesso: ${newCopyDoc.id}`);

    // ST-11.19: Decrementar 2 créditos por geração de copy (editorial completo com RAG + scorecard)
    if (userId) {
      try {
        await updateUserUsageAdmin(userId, -2);
        console.log(`[Copy] 2 créditos decrementados para usuário: ${userId}`);
      } catch (creditError) {
        console.error('[Copy] Erro ao atualizar créditos:', creditError);
      }
    }

    return createApiSuccess({
      copyProposal: {
        id: newCopyDoc.id,
        ...copyProposalData,
      },
    });

  } catch (error) {
    console.error('Copy generation error:', error);
    if (error instanceof Error) {
      const msg = error.message || '';
      if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('QUOTA_EXCEEDED') || msg.includes('429')) {
        return createApiError(429, 'Cota de IA excedida. Tente novamente em alguns minutos.');
      }
    }
    return createApiError(500, 'Failed to generate copy', { details: String(error) });
  }
}

// GET - List copy proposals for a funnel
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const funnelId = searchParams.get('funnelId');
    const proposalId = searchParams.get('proposalId');

    if (!funnelId) {
      return createApiError(400, 'funnelId is required');
    }

    const adminDb = getAdminFirestore();

    // Auth guard: derive brandId from funnel, then verify access
    const funnelDocSnap = await adminDb.collection('funnels').doc(funnelId).get();
    if (funnelDocSnap.exists) {
      const funnelBrandId = (funnelDocSnap.data() as any).brandId;
      if (funnelBrandId) {
        try {
          await requireBrandAccess(request, funnelBrandId);
        } catch (err: any) {
          return handleSecurityError(err);
        }
      }
    }

    const copyProposalsRef = adminDb.collection('funnels').doc(funnelId).collection('copyProposals');
    const snapshot = await (proposalId
      ? copyProposalsRef.where('proposalId', '==', proposalId).get()
      : copyProposalsRef.get());
    const copyProposals = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return createApiSuccess({ copyProposals });

  } catch (error) {
    console.error('Error fetching copy proposals:', error);
    return createApiError(500, 'Failed to fetch copy proposals', { details: String(error) });
  }
}
