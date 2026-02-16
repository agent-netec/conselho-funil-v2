export const dynamic = 'force-dynamic';
/**
 * API Route para Geração de Copy - Conselho de Copywriting
 * 
 * POST /api/copy/generate
 * 
 * Gera propostas de copy baseadas no funil aprovado usando os 9 copywriters.
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  doc, 
  getDoc, 
  collection, 
  addDoc, 
  Timestamp,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { updateUserUsage } from '@/lib/firebase/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ragQuery, retrieveBrandChunks, formatBrandContextForLLM } from '@/lib/ai/rag';
import { getAllBrandKeywordsForPrompt } from '@/lib/firebase/intelligence';
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
import { DEFAULT_GEMINI_MODEL } from '@/lib/ai/gemini';

export const runtime = 'nodejs';
export const maxDuration = 90; // Aumentado para lidar com RAG

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

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

    // Get funnel and brand
    const funnelRef = doc(db, 'funnels', funnelId);
    const funnelSnap = await getDoc(funnelRef);
    
    if (!funnelSnap.exists()) {
      return createApiError(404, 'Funnel not found');
    }
    
    const funnel = { id: funnelSnap.id, ...funnelSnap.data() } as Funnel;

    // Get proposal
    const proposalRef = doc(db, 'funnels', funnelId, 'proposals', proposalId);
    const proposalSnap = await getDoc(proposalRef);
    
    if (!proposalSnap.exists()) {
      return createApiError(404, 'Proposal not found');
    }
    
    const proposal = { id: proposalSnap.id, ...proposalSnap.data() } as Proposal;

    // --- ENRIQUECIMENTO DE CONTEXTO (RAG) ---
    console.log('🔍 Buscando contexto estratégico para copy...');
    
    // 1. Contexto de Conhecimento Geral (Copywriting)
    const { context: ragContext } = await ragQuery(
      `Copywriting para ${copyType} no mercado de ${funnel.context.market}. Foco em ${funnel.context.objective}.`,
      { topK: 8, minSimilarity: 0.2, filters: { category: 'copywriting' } }
    );

    // 2. Contexto de Marca (Assets)
    let brandContext = '';
    if (funnel.brandId) {
      const brandChunks = await retrieveBrandChunks(
        funnel.brandId,
        `Copywriting ${copyType} para ${funnel.context.offer.what}. Voz e tom da marca.`,
        { topK: 5, minSimilarity: 0.5 }
      );
      brandContext = formatBrandContextForLLM(brandChunks);
    }

    // 3. Contexto de Keywords Estratégicas (Sprint N: merged brand keywords + mined)
    let keywordContext = '';
    if (funnel.brandId) {
      try {
        keywordContext = await getAllBrandKeywordsForPrompt(funnel.brandId, 10);
        if (keywordContext) {
          console.log(`[Copy] Keywords context loaded for copy generation`);
        }
      } catch (err) {
        console.warn('[Copy] Erro ao buscar keywords:', err);
      }
    }

    // 4. Contexto de Anexos do Chat (Busca no histórico da conversa)
    let attachmentsContext = '';
    if (conversationId) {
      const messagesRef = collection(db, 'conversations', conversationId, 'messages');
      const messagesSnap = await getDocs(query(messagesRef, orderBy('createdAt', 'desc'), limit(20)));
      
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
      mapAwareness(funnel.context.audience.awareness);

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
        ragContext,
        brandContext,
        keywordContext,
        attachmentsContext,
        brainContext,
      }
    );

    console.log(`\n✍️  Gerando ${copyType} enriquecido para funil "${funnel.name}"...`);

    // Generate with Gemini (using model from env or default to gemini-2.0-flash)
    const modelName = DEFAULT_GEMINI_MODEL;
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

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
    const copyProposalsRef = collection(db, 'funnels', funnelId, 'copyProposals');
    const newCopyDoc = await addDoc(copyProposalsRef, copyProposalData);

    console.log(`✅ Copy gerado com sucesso: ${newCopyDoc.id}`);

    // ST-11.19: Decrementar 2 créditos por geração de copy (editorial completo com RAG + scorecard)
    if (userId) {
      try {
        await updateUserUsage(userId, -2);
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

    const copyProposalsRef = collection(db, 'funnels', funnelId, 'copyProposals');
    
    let q;
    if (proposalId) {
      q = query(copyProposalsRef, where('proposalId', '==', proposalId));
    } else {
      q = copyProposalsRef;
    }

    const snapshot = await getDocs(q);
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
