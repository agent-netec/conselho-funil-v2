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
import { updateFunnel, createProposal } from '@/lib/firebase/firestore';
import type { FunnelContext, Proposal } from '@/types/database';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120; // 2 minutes for generation

interface GenerateRequest {
  funnelId: string;
  context: FunnelContext;
}

const GENERATION_PROMPT = `Você é o Conselho de Funil, um sistema de inteligência composto por 6 especialistas em marketing e vendas.

## Especialistas do Conselho
- **Russell Brunson**: Arquitetura de Funil, Value Ladder, sequências de conversão
- **Dan Kennedy**: Oferta & Copy, headlines magnéticas, urgência
- **Frank Kern**: Psicologia & Comportamento, persuasão, conexão emocional  
- **Sam Ovens**: Aquisição & Qualificação, tráfego pago, leads qualificados
- **Ryan Deiss**: LTV & Retenção, Customer Value Journey, relacionamento
- **Perry Belcher**: Monetização Simples, ofertas de entrada, upsells

## Tarefa
Com base no contexto do negócio e na base de conhecimento, gere **2 propostas** de funil distintas.

## Formato de Saída (JSON)
Retorne APENAS um JSON válido, sem markdown, no formato:

{
  "proposals": [
    {
      "name": "Nome descritivo do funil",
      "summary": "Resumo de 2-3 linhas da estratégia",
      "architecture": {
        "stages": [
          {
            "order": 1,
            "name": "Nome da etapa",
            "type": "ad|landing|quiz|vsl|checkout|email|call|webinar",
            "objective": "Objetivo psicológico",
            "description": "Descrição detalhada",
            "metrics": {
              "expectedConversion": "X%",
              "kpi": "métrica principal"
            }
          }
        ]
      },
      "strategy": {
        "rationale": "Por que essa estrutura funciona",
        "counselorInsights": [
          {
            "counselor": "russell_brunson",
            "insight": "Insight específico deste conselheiro"
          }
        ],
        "risks": ["Risco 1", "Risco 2"],
        "recommendations": ["Recomendação 1", "Recomendação 2"]
      },
      "assets": {
        "headlines": ["Headline 1", "Headline 2", "Headline 3"],
        "hooks": ["Hook 1", "Hook 2"],
        "ctas": ["CTA 1", "CTA 2"]
      },
      "scorecard": {
        "clarity": 8,
        "offerStrength": 7,
        "qualification": 8,
        "friction": 6,
        "ltvPotential": 7,
        "expectedRoi": 7,
        "overall": 7.2
      }
    }
  ]
}

## Regras
1. Gere exatamente 2 propostas com abordagens diferentes
2. Cada proposta deve ter 4-7 etapas
3. Baseie-se no contexto da base de conhecimento
4. Scores de 1-10, overall é a média
5. Seja específico e acionável
6. Retorne APENAS JSON válido, sem explicações adicionais`;

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json();
    const { funnelId, context } = body;

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

    console.log(`🎯 Gerando propostas para funil ${funnelId}...`);

    // Update funnel status to generating
    await updateFunnel(funnelId, { status: 'generating' });

    // 1. Retrieve relevant knowledge
    const queryText = `
      Funil para ${context.objective}
      Mercado: ${context.market}
      Público: ${context.audience.who}
      Dor: ${context.audience.pain}
      Oferta: ${context.offer.what}
      Ticket: ${context.offer.ticket}
      Canal: ${context.channel.main}
    `;

    const chunks = await retrieveForFunnelCreation(
      context.objective,
      context.channel.main,
      context.audience.who,
      20 // More chunks for funnel creation
    );

    console.log(`📚 ${chunks.length} chunks de conhecimento recuperados`);

    // 2. Build context string
    const knowledgeContext = chunks.map(c => 
      `[${c.metadata.counselor || 'General'}] ${c.content}`
    ).join('\n\n---\n\n');

    // 3. Build the full prompt
    const contextPrompt = `
## Contexto do Negócio

**Empresa/Projeto:** ${context.company}
**Mercado/Nicho:** ${context.market}
**Maturidade:** ${context.maturity}
**Objetivo:** ${context.objective}
${context.restrictions ? `**Restrições:** ${context.restrictions}` : ''}

### Público-Alvo
- **Quem:** ${context.audience.who}
- **Dor Principal:** ${context.audience.pain}
- **Nível de Consciência:** ${context.audience.awareness}
${context.audience.objection ? `- **Objeção Dominante:** ${context.audience.objection}` : ''}

### Oferta
- **Produto/Serviço:** ${context.offer.what}
- **Ticket:** ${context.offer.ticket}
- **Tipo:** ${context.offer.type}

### Canais
- **Principal:** ${context.channel.main}
${context.channel.secondary ? `- **Secundário:** ${context.channel.secondary}` : ''}
${context.channel.owned ? `- **Owned Media:** ${context.channel.owned}` : ''}

## Base de Conhecimento do Conselho
${knowledgeContext}
`;

    const fullPrompt = `${GENERATION_PROMPT}\n\n${contextPrompt}`;

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
    
    for (let i = 0; i < proposalsData.proposals.length; i++) {
      const proposal = proposalsData.proposals[i];
      
      const proposalData: Omit<Proposal, 'id' | 'funnelId' | 'createdAt'> = {
        version: i + 1,
        name: proposal.name,
        summary: proposal.summary,
        architecture: proposal.architecture,
        strategy: proposal.strategy,
        assets: proposal.assets,
        scorecard: proposal.scorecard,
        status: 'pending',
      };

      const proposalId = await createProposal(funnelId, proposalData);
      savedProposals.push(proposalId);
      console.log(`💾 Proposta ${i + 1} salva: ${proposalId}`);
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

