import { NextRequest, NextResponse } from 'next/server';
import {
  ragQuery,
  retrieveChunks,
  formatContextForLLM,
  retrieveBrandChunks,
  formatBrandContextForLLM
} from '@/lib/ai/rag';
import { getAllBrandKeywordsForPromptAdmin } from '@/lib/firebase/intelligence-server';
import {
  generateCouncilResponseWithGemini,
  generatePartyResponseWithGemini,
  isGeminiConfigured,
  PRO_GEMINI_MODEL
} from '@/lib/ai/gemini';
import {
  getConversationAdmin,
  addMessageAdmin,
  updateConversationAdmin,
  getBrandAdmin,
  getUserBrandsAdmin,
  getUserCreditsAdmin,
  getFunnelAdmin,
  getFunnelProposalsAdmin,
  updateUserUsageAdmin,
  getUserFunnelsAdmin,
  getCampaignAdmin,
  getActiveCampaignForBrandAdmin,
} from '@/lib/firebase/firestore-server';
import type { Funnel, Proposal, Brand } from '@/types/database';
import {
  buildChatPrompt,
  CHAT_SYSTEM_PROMPT,
  COPY_CHAT_SYSTEM_PROMPT,
  SOCIAL_CHAT_SYSTEM_PROMPT,
  ADS_CHAT_SYSTEM_PROMPT,
  DESIGN_CHAT_SYSTEM_PROMPT,
  enrichChatPromptWithBrain
} from '@/lib/ai/prompts';
import { buildChatBrainContext } from '@/lib/ai/prompts/chat-brain-context';
import { buildPartyBrainContext } from '@/lib/ai/prompts/party-brain-context';
import { CONFIG } from '@/lib/config';
import { COUNSELORS_REGISTRY } from '@/lib/constants';
import { CounselorId } from '@/types';
import { 
  formatBrandContextForChat, 
  formatFunnelContextForChat 
} from '@/lib/ai/formatters';
import { parseJsonBody } from '@/app/api/_utils/parse-json';
import { requireConversationAccess } from '@/lib/auth/conversation-guard';
import { handleSecurityError } from '@/lib/utils/api-security';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { withRateLimit } from '@/lib/middleware/rate-limiter';
import { logger } from '@/lib/utils/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120; // PRO model + RAG + council response

interface ChatRequest {
  message: string;
  conversationId: string;
  brandId?: string; // Active brand from client — fallback if conversation has no brandId
  mode?: 'general' | 'funnel_creation' | 'funnel_evaluation' | 'funnel_review' | 'copy' | 'social' | 'ads' | 'design' | 'party';
  partyMode?: boolean;
  counselor?: string;
  funnelId?: string;
  campaignId?: string;
  selectedAgents?: string[];
  intensity?: 'debate' | 'consensus';
}

async function handlePOST(request: NextRequest) {
  try {
    const parsed = await parseJsonBody<ChatRequest>(request);
    if (!parsed.ok) {
      return createApiError(400, parsed.error);
    }

    const body = parsed.data;
    const {
      message,
      conversationId,
      brandId: requestBrandId,
      mode = 'general',
      partyMode = false,
      counselor,
      funnelId,
      campaignId,
      selectedAgents = [],
      intensity = 'debate'
    } = body;

    if (!message || !conversationId) {
      return createApiError(400, 'Message and conversationId are required');
    }

    // AUTH: Categoria B — Validar ownership da conversa (DT-01)
    try {
      await requireConversationAccess(request, conversationId);
    } catch (error) {
      return handleSecurityError(error);
    }

    // ST-11.24 Optimization: Fetch conversation first to get userId
    const conversation = await getConversationAdmin(conversationId);

    if (!conversation) {
      return createApiError(404, 'Conversation not found');
    }

    const userId = conversation.userId;
    const credits = await getUserCreditsAdmin(userId);

    // Só bloqueia se o limite estiver ativado
    if (CONFIG.ENABLE_CREDIT_LIMIT && credits <= 0) {
      return createApiError(403, 'insufficient_credits', { details: 'Saldo de créditos insuficiente. Faça upgrade para continuar.' });
    }

    const isPartyMode = mode === 'party' || partyMode === true;
    const effectiveMode = isPartyMode ? 'party' : mode;

    // Fix campaignId if it comes as "undefined" string
    const cleanCampaignId = campaignId === 'undefined' ? undefined : campaignId;

    // Parallelize all independent context fetching
    const contextPromises: Promise<any>[] = [];

    // 1. Funnel Context
    let funnelPromise = Promise.resolve('');
    if (funnelId) {
      funnelPromise = (async () => {
        try {
          const funnel = await getFunnelAdmin(funnelId);
          if (funnel) {
            const proposals = await getFunnelProposalsAdmin(funnelId);
            return formatFunnelContextForChat(funnel, proposals);
          }
        } catch (err) {
          logger.error('Error loading funnel', { route: '/api/chat', error: (err as Error).message });
        }
        return '';
      })();
    }

    // 2. Campaign Context (auto-detect active campaign if not provided)
    let campaignPromise = Promise.resolve('');
    const buildCampaignContextString = (campaign: any, autoDetected = false): string => {
      const tag = autoDetected ? ' (auto-detectada)' : '';
      let ctx = `## MANIFESTO DA CAMPANHA${tag} (LINHA DE OURO)\n` +
        `ID da Campanha: ${campaign.id}\n` +
        `Status: ${campaign.status || 'active'}\n` +
        `Objetivo: ${campaign.funnel?.mainGoal || 'N/A'}\n` +
        `Público: ${campaign.funnel?.targetAudience || 'N/A'}\n`;

      if (campaign.copywriting) {
        ctx += `\n[COPY APROVADA]\nBig Idea: ${campaign.copywriting.bigIdea}\n`;
        if (campaign.copywriting.tone) ctx += `Tom: ${campaign.copywriting.tone}\n`;
      }
      if (campaign.social) {
        ctx += `\n[ESTRATÉGIA SOCIAL]\n${campaign.social.hooks?.length || 0} Hooks aprovados.\n`;
      }
      if (campaign.design) {
        ctx += `\n[ESTILO VISUAL]\n${campaign.design.visualStyle}\n`;
      }
      if (campaign.offer?.promise) {
        ctx += `\n[OFERTA]\n${campaign.offer.promise}\n`;
      }
      return ctx;
    };

    if (cleanCampaignId) {
      campaignPromise = (async () => {
        try {
          const campaign = await getCampaignAdmin(cleanCampaignId);
          if (campaign) return buildCampaignContextString(campaign);
        } catch (err) {
          logger.error('Error loading campaign', { route: '/api/chat', error: (err as Error).message });
        }
        return '';
      })();
    } else if (conversation?.brandId || requestBrandId) {
      // WS-5: Auto-detect active campaign for this brand
      const autoDetectBrandId = conversation?.brandId || requestBrandId;
      campaignPromise = (async () => {
        try {
          const campaign = await getActiveCampaignForBrandAdmin(autoDetectBrandId!);
          if (campaign) {
            console.log(`[Chat API] Auto-detected active campaign: ${campaign.id}`);
            return buildCampaignContextString(campaign, true);
          }
        } catch (err) {
          logger.error('Error auto-detecting campaign', { route: '/api/chat', error: (err as Error).message });
        }
        return '';
      })();
    }

    // 3. User Funnels (if keywords present)
    let userFunnelsPromise = Promise.resolve('');
    const listFunnelsKeywords = ['meus funis', 'quais funis', 'listar funis', 'lista de funis', 'funis que temos'];
    const isListingFunnels = listFunnelsKeywords.some(k => message.toLowerCase().includes(k));
    if (isListingFunnels) {
      userFunnelsPromise = (async () => {
        try {
          const userFunnels = await getUserFunnelsAdmin(userId);
          if (userFunnels.length > 0) {
            return `## SEUS FUNIS EXISTENTES (${userFunnels.length})\n\n` + 
              userFunnels.map(f => `- **${f.name}**: ${f.description || 'Sem descrição'} (Status: ${f.status}, ID: ${f.id})`).join('\n') +
              `\n\n⚠️ INSTRUÇÃO: O usuário pediu para ver seus funis. Liste-os de forma amigável e pergunte se ele deseja analisar algum deles especificamente.`;
          }
          return `## SEUS FUNIS EXISTENTES\n\nVocê ainda não possui funis criados.`;
        } catch (err) {
          logger.error('Error loading user funnels', { route: '/api/chat', error: (err as Error).message });
        }
        return '';
      })();
    }

    // 4. Brand Context and Brand Assets RAG
    // Priority: conversation.brandId → requestBrandId (from client store) → user's first brand (auto-fallback)
    let effectiveBrandId = conversation?.brandId || requestBrandId;
    if (!effectiveBrandId) {
      try {
        const userBrands = await getUserBrandsAdmin(userId);
        if (userBrands.length > 0) effectiveBrandId = userBrands[0].id;
      } catch { /* ignore */ }
    }
    let brandContextPromise = Promise.resolve({ context: '', brandChunks: [] as any[], brand: null as Brand | null });
    if (effectiveBrandId) {
      brandContextPromise = (async () => {
        try {
          // ST-12.5: RAG Caching via sessionStorage (simulated in API for consistency)
          // Em um ambiente real de API, o cache seria Redis, mas aqui vamos simular
          // o comportamento de evitar chamadas repetitivas ao Pinecone se os dados forem idênticos.

          const brand = await getBrandAdmin(effectiveBrandId!);
          if (brand) {
            const bContext = formatBrandContextForChat(brand);
            const bChunks = await retrieveBrandChunks(effectiveBrandId!, message, 5);
            return { context: bContext, brandChunks: bChunks, brand };
          }
        } catch (err) {
          logger.error('Error loading brand context', { route: '/api/chat', error: (err as Error).message });
        }
        return { context: '', brandChunks: [], brand: null };
      })();
    }

    // 5. Knowledge Base RAG
    // Configure retrieval based on mode
    let retrievalConfig = {
      topK: 10,
      minSimilarity: 0.25,
      filters: {} as { counselor?: string; docType?: string; scope?: string },
    };
    
    // Choose system prompt based on mode
    // Sprint D: Enrich with brain context (identity cards)
    let systemPrompt = CHAT_SYSTEM_PROMPT;
    if (effectiveMode === 'copy') {
      systemPrompt = enrichChatPromptWithBrain(COPY_CHAT_SYSTEM_PROMPT, buildChatBrainContext('copy'));
      retrievalConfig.filters.docType = 'copywriting';
    } else if (effectiveMode === 'social') {
      systemPrompt = enrichChatPromptWithBrain(SOCIAL_CHAT_SYSTEM_PROMPT, buildChatBrainContext('social'));
      retrievalConfig.filters.counselor = 'social';
      retrievalConfig.topK = 15;
    } else if (effectiveMode === 'ads') {
      systemPrompt = enrichChatPromptWithBrain(ADS_CHAT_SYSTEM_PROMPT, buildChatBrainContext('ads'));
      retrievalConfig.filters.scope = 'traffic';
      retrievalConfig.topK = 15;
    } else if (effectiveMode === 'design') {
      systemPrompt = enrichChatPromptWithBrain(DESIGN_CHAT_SYSTEM_PROMPT, buildChatBrainContext('design'));
      retrievalConfig.filters.counselor = 'design_director';
      retrievalConfig.topK = 15;
    } else if (effectiveMode !== 'party') {
      // general / funnel_creation / funnel_evaluation / funnel_review → funnel council
      systemPrompt = enrichChatPromptWithBrain(CHAT_SYSTEM_PROMPT, buildChatBrainContext('funnel'));
    }

    switch (effectiveMode) {
      case 'funnel_creation':
        retrievalConfig.topK = 15;
        retrievalConfig.minSimilarity = 0.2;
        break;
      case 'funnel_evaluation':
      case 'funnel_review':
        retrievalConfig.topK = 12;
        retrievalConfig.filters.docType = 'scorecards';
        break;
    }

    if (counselor) {
      retrievalConfig.filters.counselor = counselor;
    }

    const knowledgePromise = retrieveChunks(message, retrievalConfig);

    // 6. Keywords Intelligence (mineradas pelo Keywords Miner)
    let keywordsPromise = Promise.resolve('');
    if (effectiveBrandId) {
      keywordsPromise = (async () => {
        try {
          const keywordStr = await getAllBrandKeywordsForPromptAdmin(effectiveBrandId, 10);
          if (keywordStr) {
            return keywordStr;
          }
        } catch (err) {
          console.warn('[Chat API] Keywords fetch failed:', err);
        }
        return '';
      })();
    }

    // Wait for everything in parallel
    console.log('[Chat API] Starting parallel context retrieval...');
    const [
      funnelContext,
      campaignContext,
      userFunnelsContext,
      brandResult,
      chunks,
      keywordContext
    ] = await Promise.all([
      funnelPromise,
      campaignPromise,
      userFunnelsPromise,
      brandContextPromise,
      knowledgePromise,
      keywordsPromise
    ]);
    console.log('[Chat API] Context retrieval completed.');

    const { context: brandContext, brandChunks, brand } = brandResult;
    const brandFilesContext = brandChunks.length > 0 ? formatBrandContextForLLM(brandChunks) : '';

    // Build context from retrieved chunks + brand + funnel data
    // US-1.2.3: Preparar sources estruturados para a UI
    const sources = [
      ...chunks.map(c => ({
        file: c.source.file,
        section: c.source.section,
        content: c.content.slice(0, 400) + (c.content.length > 400 ? '...' : ''),
        counselor: c.metadata.counselor,
        similarity: c.similarity,
        rerankScore: c.rerankScore,
        type: c.metadata.docType,
      })),
      ...brandChunks.map(c => ({
        file: c.assetName,
        section: 'Asset da Marca',
        content: c.content.slice(0, 400) + (c.content.length > 400 ? '...' : ''),
        counselor: 'brand',
        similarity: c.similarity,
        rerankScore: c.rerankScore,
        type: 'brand_asset',
      }))
    ];

    let context = formatContextForLLM(chunks);
    if (brandContext) {
      context = `## CONTEXTO DA MARCA (SEMPRE CONSIDERE)\n\n${brandContext}\n\n---\n\n${context}`;
    }
    if (brandFilesContext) {
      context = `${brandFilesContext}\n\n---\n\n${context}`;
    }
    if (funnelContext) {
      context = `## CONTEXTO DO FUNIL DO USUÁRIO\n\n${funnelContext}\n\n---\n\n${context}`;
    }
    if (campaignContext) {
      context = `${campaignContext}\n\n---\n\n${context}`;
    }
    if (userFunnelsContext) {
      context = `${userFunnelsContext}\n\n---\n\n${context}`;
    }
    if (keywordContext) {
      context = `${keywordContext}\n\n---\n\n${context}`;
    }

    // ST-12.5: Otimização de Resiliência - Context Truncation/Summarization
    // Se o contexto exceder ~30k tokens (estimado por caracteres), realizamos um trim
    const MAX_CONTEXT_CHARS = 120000; // Aprox 30k tokens
    if (context.length > MAX_CONTEXT_CHARS) {
      console.log(`[Chat API] Context too large (${context.length} chars). Truncating...`);
      // Mantém os 20k chars iniciais (instruções) e os 80k finais (contexto mais recente/relevante)
      const head = context.slice(0, 20000);
      const tail = context.slice(-100000);
      context = `${head}\n\n... [CONTEÚDO ANTIGO RESUMIDO PARA ECONOMIA DE CONTEXTO] ...\n\n${tail}`;
    }

    // Generate response using Gemini API
    let assistantResponse: string;
    
    try {
      if (!isGeminiConfigured()) {
        console.warn('Gemini API not configured, using fallback response');
        assistantResponse = generateFallbackResponse(message, chunks, systemPrompt);
      } else if (effectiveMode === 'party' && selectedAgents.length > 0) {
        console.log('Generating Party Mode response with agents:', selectedAgents);
        // Sprint D: Inject identity cards for selected agents
        const partyBrainCtx = buildPartyBrainContext(selectedAgents);
        assistantResponse = await generatePartyResponseWithGemini(
          message,
          context,
          selectedAgents,
          { intensity, brainContext: partyBrainCtx },
          PRO_GEMINI_MODEL
        );
      } else {
        // US-1.2.3: Se o RAG falhar em modo específico, avisamos a IA mas deixamos ela responder
        // Removida a trava que forçava fallback em caso de chunks vazios
        // ST-11.23: Não distrai o conselho de design com notas de falta de contexto se ele tiver contexto da marca/funil
        const hasStrategicContext = brandContext.length > 0 || funnelContext.length > 0 || campaignContext.length > 0;
        const enrichedContext = (chunks.length === 0 && context.length < 100 && !hasStrategicContext)
          ? `${context}\n\n⚠️ NOTA: A busca na base de conhecimento não retornou resultados específicos para esta pergunta. Responda com base no seu conhecimento geral como especialista de 2026, mas mencione se houver incerteza sobre diretrizes internas específicas.`
          : context;

        console.log(`Generating council response for mode: ${effectiveMode}`);
        // ST-11.6: Design usa 3.1-pro-preview; demais usam Pro para máxima qualidade
        const model = PRO_GEMINI_MODEL;
        // R1.5: Ler temperatura/topP da brand.aiConfiguration (se disponível)
        assistantResponse = await generateCouncilResponseWithGemini(message, enrichedContext, systemPrompt, model, {
          temperature: brand?.aiConfiguration?.temperature,
          topP: brand?.aiConfiguration?.topP,
        });
      }
    } catch (aiError) {
      logger.error('AI generation error', { route: '/api/chat', error: (aiError as Error).message });
      
      // Se houver erro na IA, aí sim usamos o fallback de segurança
      assistantResponse = generateFallbackResponse(message, chunks, systemPrompt);
    }

    // Save assistant message to Firestore and update metadata in parallel
    try {
      // US-1.3: Se for party mode, os conselheiros são os selecionados
      let activeCounselors = effectiveMode === 'party' 
        ? selectedAgents 
        : [...new Set(chunks.map(c => c.metadata.counselor).filter(Boolean) as string[])];
      
      if (activeCounselors.length === 0) {
        if (effectiveMode === 'copy') activeCounselors = ['copy_director'];
        else if (effectiveMode === 'social') activeCounselors = ['social_director'];
        else if (effectiveMode === 'ads') activeCounselors = ['traffic_director'];
        else if (effectiveMode === 'design') activeCounselors = ['design_director'];
      }

      const saveMessagePromise = addMessageAdmin(conversationId, {
        role: 'assistant',
        content: assistantResponse,
        metadata: {
          sources: sources,
          counselors: activeCounselors,
        },
      });

      const usagePromise = CONFIG.ENABLE_CREDIT_LIMIT
        ? updateUserUsageAdmin(userId, -1)
        : Promise.resolve();

      const titlePromise = updateConversationAdmin(conversationId, {
        title: message.slice(0, 50) + (message.length > 50 ? '...' : ''),
      });

      // Fire and forget or wait? Better to wait for data integrity, but in parallel
      await Promise.all([saveMessagePromise, usagePromise, titlePromise]);
      console.log('[Chat API] Post-processing completed.');
    } catch (dbError) {
      logger.error('Error in post-processing', { route: '/api/chat', error: (dbError as Error).message });
    }

    // DT-10: Wrap chat success in createApiSuccess
    return createApiSuccess({
      response: assistantResponse,
      sources: sources, // US-1.2.3: UI agora recebe snippets e rerankScore
      version: '11.24.5-perf'
    });
  } catch (error) {
    logger.error('Chat API unhandled error', { route: '/api/chat', error: (error as Error).message });
    if (error instanceof Error) {
      const msg = error.message || '';
      if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('QUOTA_EXCEEDED') || msg.includes('429')) {
        return createApiError(429, 'Cota de IA excedida. Tente novamente em alguns minutos.');
      }
    }
    return createApiError(500, 'Internal server error');
  }
}

// Fallback response when AI is not available
function generateFallbackResponse(
  message: string,
  chunks: Array<{ content: string; metadata: { counselor?: string; docType: string }; similarity: number }>,
  systemPrompt?: string
): string {
  if (chunks.length === 0) {
    const isCopy = systemPrompt?.includes('Copywriting');
    const isSocial = systemPrompt?.includes('Social');
    
    if (isSocial) {
      return `**Social**

Desculpe, não encontrei informações específicas sobre redes sociais na base de conhecimento para responder sua pergunta.

Os 4 especialistas sociais estão prontos para ajudar:
${Object.values(COUNSELORS_REGISTRY)
  .filter(c => ['lia_haberman', 'rachel_karten', 'nikita_beer', 'justin_welsh'].includes(c.id))
  .map(c => `- ${c.name} (${c.expertise})`)
  .join('\n')}`;
    }

    const isAds = systemPrompt?.includes('Ads');
    if (isAds) {
      return `**Ads & Tráfego**

Desculpe, não encontrei informações específicas sobre tráfego na base de conhecimento para responder sua pergunta.

Os 4 especialistas de Ads estão prontos para ajudar:
${Object.values(COUNSELORS_REGISTRY)
  .filter(c => ['justin_brooke', 'nicholas_kusmich', 'jon_loomer', 'savannah_sanchez'].includes(c.id))
  .map(c => `- ${c.name} (${c.expertise})`)
  .join('\n')}`;
    }

    const isDesign = systemPrompt?.includes('Design');
    if (isDesign) {
      return `**Design**

Desculpe, não encontrei informações específicas sobre design na base de conhecimento para responder sua pergunta.

O Diretor de Design está pronto para ajudar:
- Diretor de Design (Direção de Arte & Briefing)`;
    }
    
    const relevantIds = isCopy 
      ? ['eugene_schwartz', 'claude_hopkins', 'gary_halbert', 'joseph_sugarman', 'dan_kennedy_copy', 'david_ogilvy', 'john_carlton', 'drayton_bird', 'frank_kern_copy']
      : ['russell_brunson', 'dan_kennedy', 'frank_kern', 'sam_ovens', 'ryan_deiss', 'perry_belcher'];

    return `**${isCopy ? 'Copywriting' : 'MKTHONEY'}**

Desculpe, não encontrei informações específicas na base de conhecimento para responder sua pergunta.

Os ${isCopy ? '9 copywriters' : '6 especialistas'} estão prontos para ajudar:
${relevantIds.map(id => {
  const c = COUNSELORS_REGISTRY[id as CounselorId];
  return `- ${c?.name} (${c?.expertise})`;
}).join('\n')}`;
  }

  // Build a response from chunks
  const counselorsInvolved = [...new Set(
    chunks.map(c => c.metadata.counselor).filter(Boolean)
  )] as CounselorId[];

  let response = `## Análise do MKTHONEY\n\n`;

  if (counselorsInvolved.length > 0) {
    const names = counselorsInvolved
      .map(id => COUNSELORS_REGISTRY[id]?.name || id)
      .join(', ');
    response += `*Consultando: ${names}*\n\n`;
  }

  response += `Encontrei **${chunks.length}** referência(s) relevante(s) para sua pergunta:\n\n`;

  // Add top 3 chunks as quotes
  chunks.slice(0, 3).forEach((chunk, i) => {
    const counselor = chunk.metadata.counselor 
      ? (COUNSELORS_REGISTRY[chunk.metadata.counselor as CounselorId]?.name || chunk.metadata.counselor)
      : 'Base de Conhecimento';
    
    const relevance = (chunk.similarity * 100).toFixed(0);
    const excerpt = chunk.content.slice(0, 250).replace(/\n/g, ' ').trim();
    
    response += `### ${counselor} (${chunk.metadata.docType})\n`;
    response += `*Relevância: ${relevance}%*\n\n`;
    response += `> ${excerpt}...\n\n`;
  });

  response += `---\n📚 *${chunks.length} fonte(s) consultada(s) na base de conhecimento*\n\n`;
  response += `⚠️ *Nota: Esta é uma resposta baseada apenas em retrieval. Configure o Vertex AI para respostas completas do MKTHONEY.*`;

  return response;
}

// S32-RL-02: Rate limit — 30 req/min por brand
const rateLimitedPOST = withRateLimit(handlePOST, {
  maxRequests: 30,
  windowMs: 60_000,
  scope: 'chat',
});

export { rateLimitedPOST as POST };
