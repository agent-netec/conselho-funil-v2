import { NextRequest, NextResponse } from 'next/server';
import { 
  ragQuery, 
  retrieveChunks, 
  formatContextForLLM, 
  retrieveBrandChunks, 
  formatBrandContextForLLM 
} from '@/lib/ai/rag';
import { 
  generateCouncilResponseWithGemini, 
  generatePartyResponseWithGemini,
  isGeminiConfigured 
} from '@/lib/ai/gemini';
import { 
  addMessage, 
  updateConversation, 
  getFunnel, 
  getFunnelProposals, 
  getConversation,
  getUserCredits,
  updateUserUsage,
  getUserFunnels,
  getCampaign
} from '@/lib/firebase/firestore';
import { getBrand } from '@/lib/firebase/brands';
import type { Funnel, Proposal, Brand } from '@/types/database';
import { 
  buildChatPrompt, 
  CHAT_SYSTEM_PROMPT, 
  COPY_CHAT_SYSTEM_PROMPT, 
  SOCIAL_CHAT_SYSTEM_PROMPT,
  ADS_CHAT_SYSTEM_PROMPT,
  DESIGN_CHAT_SYSTEM_PROMPT
} from '@/lib/ai/prompts';
import { CONFIG } from '@/lib/config';
import { COUNSELORS_REGISTRY } from '@/lib/constants';
import { CounselorId } from '@/types';
import { 
  formatBrandContextForChat, 
  formatFunnelContextForChat 
} from '@/lib/ai/formatters';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ChatRequest {
  message: string;
  conversationId: string;
  mode?: 'general' | 'funnel_creation' | 'funnel_evaluation' | 'funnel_review' | 'copy' | 'social' | 'ads' | 'design' | 'party';
  partyMode?: boolean;
  counselor?: string;
  funnelId?: string;
  campaignId?: string;
  selectedAgents?: string[];
  intensity?: 'debate' | 'consensus';
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { 
      message, 
      conversationId, 
      mode = 'general', 
      partyMode = false,
      counselor, 
      funnelId,
      campaignId,
      selectedAgents = [],
      intensity = 'debate'
    } = body;

    if (!message || !conversationId) {
      return NextResponse.json(
        { error: 'Message and conversationId are required' },
        { status: 400 }
      );
    }

    // US-16.1: Validação de Créditos do Usuário
    const conversation = await getConversation(conversationId);
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const userId = conversation.userId;
    const credits = await getUserCredits(userId);

    // Só bloqueia se o limite estiver ativado
    if (CONFIG.ENABLE_CREDIT_LIMIT && credits <= 0) {
      return NextResponse.json(
        { error: 'insufficient_credits', message: 'Saldo de créditos insuficiente. Faça upgrade para continuar.' },
        { status: 403 }
      );
    }

    const isPartyMode = mode === 'party' || partyMode === true;
    const effectiveMode = isPartyMode ? 'party' : mode;

    // Fix campaignId if it comes as "undefined" string
    const cleanCampaignId = campaignId === 'undefined' ? undefined : campaignId;

    // Configure retrieval based on mode
    let retrievalConfig = {
      topK: 10,
      minSimilarity: 0.25,
      filters: {} as { counselor?: string; docType?: string; scope?: string },
    };
    
    // Choose system prompt based on mode
    let systemPrompt = CHAT_SYSTEM_PROMPT;
    if (effectiveMode === 'copy') {
      systemPrompt = COPY_CHAT_SYSTEM_PROMPT;
      retrievalConfig.filters.docType = 'copywriting';
    } else if (effectiveMode === 'social') {
      systemPrompt = SOCIAL_CHAT_SYSTEM_PROMPT;
      retrievalConfig.filters.counselor = 'social';
      retrievalConfig.topK = 15;
    } else if (effectiveMode === 'ads') {
      systemPrompt = ADS_CHAT_SYSTEM_PROMPT;
      retrievalConfig.filters.scope = 'traffic'; // Added in ingest script
      retrievalConfig.topK = 15;
    } else if (effectiveMode === 'design') {
      systemPrompt = DESIGN_CHAT_SYSTEM_PROMPT;
      retrievalConfig.filters.counselor = 'design_director';
      retrievalConfig.topK = 15;
    }

    // Adjust config based on mode
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

    // Filter by counselor if specified
    if (counselor) {
      retrievalConfig.filters.counselor = counselor;
    }

    // Load funnel data if funnelId is provided
    let funnelContext = '';
    if (funnelId) {
      try {
        const funnel = await getFunnel(funnelId);
        if (funnel) {
          const proposals = await getFunnelProposals(funnelId);
          funnelContext = formatFunnelContextForChat(funnel, proposals);
          console.log('Loaded funnel context for:', funnel.name);
        }
      } catch (err) {
        console.error('Error loading funnel:', err);
      }
    }

    // ST-11.15: Load Campaign Manifesto (Golden Thread Context)
    let campaignContext = '';
    if (cleanCampaignId) {
      try {
        const campaign = await getCampaign(cleanCampaignId);
        if (campaign) {
          campaignContext = `## MANIFESTO DA CAMPANHA (LINHA DE OURO)\n` +
            `ID da Campanha: ${campaign.id}\n` +
            `Status: ${campaign.status}\n` +
            `Objetivo: ${campaign.funnel?.mainGoal}\n` +
            `Público: ${campaign.funnel?.targetAudience}\n`;
          
          if (campaign.copywriting) {
            campaignContext += `\n[COPY APROVADA]\nBig Idea: ${campaign.copywriting.bigIdea}\n`;
          }
          if (campaign.social) {
            campaignContext += `\n[ESTRATÉGIA SOCIAL]\n${campaign.social.hooks?.length || 0} Hooks aprovados.\n`;
          }
          if (campaign.design) {
            campaignContext += `\n[ESTILO VISUAL]\n${campaign.design.visualStyle}\n`;
          }
          
          console.log('Loaded campaign context for:', campaign.id);
        }
      } catch (err) {
        console.error('Error loading campaign:', err);
      }
    }

    // US-LIST-FUNNELS: Detect intent to list user funnels
    let userFunnelsContext = '';
    const listFunnelsKeywords = ['meus funis', 'quais funis', 'listar funis', 'lista de funis', 'funis que temos'];
    const isListingFunnels = listFunnelsKeywords.some(k => message.toLowerCase().includes(k));
    
    if (isListingFunnels) {
      try {
        const userFunnels = await getUserFunnels(userId);
        if (userFunnels.length > 0) {
          userFunnelsContext = `## SEUS FUNIS EXISTENTES (${userFunnels.length})\n\n` + 
            userFunnels.map(f => `- **${f.name}**: ${f.description || 'Sem descrição'} (Status: ${f.status}, ID: ${f.id})`).join('\n') +
            `\n\n⚠️ INSTRUÇÃO: O usuário pediu para ver seus funis. Liste-os de forma amigável e pergunte se ele deseja analisar algum deles especificamente.`;
          console.log(`Loaded ${userFunnels.length} funnels for listing context`);
        } else {
          userFunnelsContext = `## SEUS FUNIS EXISTENTES\n\nVocê ainda não possui funis criados.`;
        }
      } catch (err) {
        console.error('Error loading user funnels:', err);
      }
    }

    // Load brand context if conversation has a brandId
    let brandContext = '';
    let brandFilesContext = ''; // Context from uploaded files (RAG)
    let brandChunks: any[] = [];
    try {
      if (conversation?.brandId) {
        const brandId = conversation.brandId;
        const brand = await getBrand(brandId);
        if (brand) {
          brandContext = formatBrandContextForChat(brand);
          console.log('Loaded brand context for:', brand.name);
          
          // US-15.3: Retrieve relevant chunks from brand assets using Vector Search
          console.log('Retrieving brand assets context (Semantic Search)...');
          brandChunks = await retrieveBrandChunks(brandId, message, 5);
          if (brandChunks.length > 0) {
            brandFilesContext = formatBrandContextForLLM(brandChunks);
            console.log(`Found ${brandChunks.length} relevant chunks in brand assets`);
          }
        }
      }
    } catch (err) {
      console.error('Error loading brand or asset context:', err);
    }

    // Retrieve relevant chunks from knowledge base
    console.log('Retrieving chunks for:', message.substring(0, 100));
    const chunks = await retrieveChunks(message, retrievalConfig);
    console.log(`Found ${chunks.length} relevant chunks`);

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

    // Generate response using Gemini API
    let assistantResponse: string;
    
    try {
      if (!isGeminiConfigured()) {
        console.warn('Gemini API not configured, using fallback response');
        assistantResponse = generateFallbackResponse(message, chunks, systemPrompt);
      } else if (effectiveMode === 'party' && selectedAgents.length > 0) {
        console.log('Generating Party Mode response with agents:', selectedAgents);
        assistantResponse = await generatePartyResponseWithGemini(
          message, 
          context, 
          selectedAgents, 
          { intensity }
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
        // ST-11.6: Alinhamento com Benchmark 2026 - Flash para Design Chat
        const model = effectiveMode === 'design' ? 'gemini-3-flash-preview' : undefined;
        assistantResponse = await generateCouncilResponseWithGemini(message, enrichedContext, systemPrompt, model);
      }
    } catch (aiError) {
      console.error('AI generation error:', aiError);
      
      // Se houver erro na IA, aí sim usamos o fallback de segurança
      assistantResponse = generateFallbackResponse(message, chunks, systemPrompt);
    }

    // Save assistant message to Firestore
    try {
      // US-1.3: Se for party mode, os conselheiros são os selecionados
      let activeCounselors = effectiveMode === 'party' 
        ? selectedAgents 
        : [...new Set(chunks.map(c => c.metadata.counselor).filter(Boolean) as string[])];
      
      // ST-11.23: Garantir que o selo do conselheiro apareça mesmo sem chunks de RAG
      if (activeCounselors.length === 0) {
        if (effectiveMode === 'copy') activeCounselors = ['copy_director'];
        else if (effectiveMode === 'social') activeCounselors = ['social_director'];
        else if (effectiveMode === 'ads') activeCounselors = ['traffic_director'];
        else if (effectiveMode === 'design') activeCounselors = ['design_director'];
      }

      await addMessage(conversationId, {
        role: 'assistant',
        content: assistantResponse,
        metadata: {
          sources: sources, // US-1.2.3: Enviando sources estruturados (snippets + scores)
          counselors: activeCounselors,
        },
      });

      // US-16.1: Decrementar crédito após sucesso da resposta
      if (CONFIG.ENABLE_CREDIT_LIMIT) {
        console.log(`Decrementing 1 credit for user: ${userId}`);
        await updateUserUsage(userId, -1);
      } else {
        console.log(`Credit limit disabled, skipping decrement for user: ${userId}`);
      }

      // Update conversation title if it's the first message
      const firstWords = message.slice(0, 50);
      await updateConversation(conversationId, {
        title: firstWords + (message.length > 50 ? '...' : ''),
      });
    } catch (dbError) {
      console.error('Error saving to Firestore:', dbError);
      // Continue even if saving fails
    }

    return NextResponse.json({
      response: assistantResponse,
      sources: sources, // US-1.2.3: UI agora recebe snippets e rerankScore
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
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
      return `**Conselho Social**

Desculpe, não encontrei informações específicas sobre redes sociais na base de conhecimento para responder sua pergunta.

Os 4 especialistas sociais estão prontos para ajudar:
${Object.values(COUNSELORS_REGISTRY)
  .filter(c => ['lia_haberman', 'rachel_karten', 'nikita_beer', 'justin_welsh'].includes(c.id))
  .map(c => `- ${c.name} (${c.expertise})`)
  .join('\n')}`;
    }

    const isAds = systemPrompt?.includes('Ads');
    if (isAds) {
      return `**Conselho de Ads**

Desculpe, não encontrei informações específicas sobre tráfego na base de conhecimento para responder sua pergunta.

Os 4 especialistas de Ads estão prontos para ajudar:
${Object.values(COUNSELORS_REGISTRY)
  .filter(c => ['justin_brooke', 'nicholas_kusmich', 'jon_loomer', 'savannah_sanchez'].includes(c.id))
  .map(c => `- ${c.name} (${c.expertise})`)
  .join('\n')}`;
    }

    const isDesign = systemPrompt?.includes('Design');
    if (isDesign) {
      return `**Conselho de Design**

Desculpe, não encontrei informações específicas sobre design na base de conhecimento para responder sua pergunta.

O Diretor de Design está pronto para ajudar:
- Diretor de Design (Direção de Arte & Briefing)`;
    }
    
    const relevantIds = isCopy 
      ? ['eugene_schwartz', 'claude_hopkins', 'gary_halbert', 'joseph_sugarman', 'dan_kennedy_copy', 'david_ogilvy', 'john_carlton', 'drayton_bird', 'frank_kern_copy']
      : ['russell_brunson', 'dan_kennedy', 'frank_kern', 'sam_ovens', 'ryan_deiss', 'perry_belcher'];

    return `**Conselho de ${isCopy ? 'Copywriting' : 'Funil'}**

Desculpe, não encontrei informações específicas na base de conhecimento para responder sua pergunta.

Os ${isCopy ? '9 copywriters' : '6 conselheiros'} estão prontos para ajudar:
${relevantIds.map(id => {
  const c = COUNSELORS_REGISTRY[id as CounselorId];
  return `- ${c?.name} (${c?.expertise})`;
}).join('\n')}`;
  }

  // Build a response from chunks
  const counselorsInvolved = [...new Set(
    chunks.map(c => c.metadata.counselor).filter(Boolean)
  )] as CounselorId[];

  let response = `## Análise do Conselho de Funil\n\n`;

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
  response += `⚠️ *Nota: Esta é uma resposta baseada apenas em retrieval. Configure o Vertex AI para respostas completas do Conselho.*`;

  return response;
}
