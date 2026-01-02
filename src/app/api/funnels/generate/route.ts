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
import { updateFunnel, createProposal, getFunnel } from '@/lib/firebase/firestore';
import { getBrand } from '@/lib/firebase/brands';
import type { FunnelContext, Proposal, Brand } from '@/types/database';
import { 
  FUNNEL_GENERATION_PROMPT, 
  FUNNEL_ADJUSTMENT_PROMPT, 
  buildFunnelContextPrompt 
} from '@/lib/ai/prompts';

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
  try {
    const body: GenerateRequest = await request.json();
    const { funnelId, context, adjustments, originalProposalId, baseVersion } = body;

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
    await updateFunnel(funnelId, { status: 'generating' });

    // Load brand context if funnel has brandId
    let brandContext = '';
    try {
      const funnel = await getFunnel(funnelId);
      if (funnel?.brandId) {
        const brand = await getBrand(funnel.brandId);
        if (brand) {
          brandContext = buildBrandContextForFunnel(brand);
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
      model: 'gemini-2.0-flash-exp',
      temperature: 0.8,
      maxOutputTokens: 8192,
    });

    // 5. Parse JSON response
    let proposalsData;
    try {
      // Extract JSON from response (handle potential markdown wrapping)
      let jsonStr = response.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.slice(7);
      }
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.slice(3);
      }
      if (jsonStr.endsWith('```')) {
        jsonStr = jsonStr.slice(0, -3);
      }
      
      proposalsData = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      console.log('Raw response:', response.substring(0, 500));
      
      // Update status to error
      await updateFunnel(funnelId, { status: 'draft' });
      
      return NextResponse.json(
        { error: 'Failed to parse AI response. Please try again.' },
        { status: 500 }
      );
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

    return NextResponse.json({
      success: true,
      funnelId,
      proposalIds: savedProposals,
      proposalsCount: savedProposals.length,
    });

  } catch (error) {
    console.error('Funnel generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

// Build brand context string for funnel generation
function buildBrandContextForFunnel(brand: Brand): string {
  return `## CONTEXTO DA MARCA (PRIORIDADE MÁXIMA)

**Marca:** ${brand.name}
**Vertical:** ${brand.vertical}
**Posicionamento:** ${brand.positioning}
**Tom de Voz:** ${brand.voiceTone}

### Público-Alvo da Marca
- **Perfil:** ${brand.audience.who}
- **Dor Principal:** ${brand.audience.pain}
- **Consciência:** ${brand.audience.awareness}
${brand.audience.objections.length > 0 ? `- **Objeções Conhecidas:** ${brand.audience.objections.join(', ')}` : ''}

### Oferta Principal
- **Produto/Serviço:** ${brand.offer.what}
- **Ticket:** R$ ${brand.offer.ticket.toLocaleString('pt-BR')}
- **Tipo:** ${brand.offer.type}
- **Diferencial Competitivo:** ${brand.offer.differentiator}

---

**INSTRUÇÕES IMPORTANTES:**
1. Todas as propostas DEVEM alinhar-se com o tom de voz "${brand.voiceTone}"
2. As headlines e copy DEVEM refletir o posicionamento da marca
3. O funil DEVE endereçar as objeções conhecidas do público
4. Use o diferencial competitivo como eixo central da estratégia
5. Considere o ticket de R$ ${brand.offer.ticket.toLocaleString('pt-BR')} ao sugerir estratégias de conversão

---
`;
}

