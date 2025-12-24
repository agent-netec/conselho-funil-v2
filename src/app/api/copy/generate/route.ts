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
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { 
  Funnel, 
  Proposal, 
  CopyProposal, 
  CopyType, 
  AwarenessStage,
  CopyScorecard,
  CopyContent,
} from '@/types/database';
import { COPY_COUNSELORS, AWARENESS_STAGES, COPY_TYPES } from '@/lib/constants';

export const runtime = 'nodejs';
export const maxDuration = 60;

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

// Build the generation prompt
function buildCopyPrompt(
  funnel: Funnel, 
  proposal: Proposal, 
  copyType: CopyType,
  awarenessStage: AwarenessStage
): string {
  const copywriters = Object.values(COPY_COUNSELORS);
  const copyTypeInfo = COPY_TYPES[copyType];
  const awarenessInfo = AWARENESS_STAGES[awarenessStage];
  
  const basePrompt = `Você é o Conselho de Copywriting, um sistema de inteligência composto por 9 mestres do copywriting de resposta direta:

${copywriters.map((c, i) => `${i + 1}. **${c.name}** — ${c.expertise}: ${c.specialty}`).join('\n')}

## CONTEXTO DO FUNIL

**Empresa:** ${funnel.context.company}
**Mercado:** ${funnel.context.market}
**Objetivo:** ${funnel.context.objective}

**Audiência:**
- Quem: ${funnel.context.audience.who}
- Dor: ${funnel.context.audience.pain}
- Nível de Consciência: ${awarenessInfo.label} (${awarenessInfo.description})
${funnel.context.audience.objection ? `- Objeção: ${funnel.context.audience.objection}` : ''}

**Oferta:**
- Produto: ${funnel.context.offer.what}
- Ticket: ${funnel.context.offer.ticket}
- Tipo: ${funnel.context.offer.type}

**Canal Principal:** ${funnel.context.channel?.main || funnel.context.channels?.primary || 'Não especificado'}

## PROPOSTA DE FUNIL APROVADA

**Nome:** ${proposal.name}
**Resumo:** ${proposal.summary}

**Etapas do Funil:**
${proposal.stages?.map((s, i) => `${i + 1}. ${s.name} — ${s.objective || s.description || ''}`).join('\n') || 'Não especificado'}

## TAREFA

Gere ${copyTypeInfo.label} (${copyTypeInfo.description}) para este funil.

**Estágio de Consciência do Mercado:** ${awarenessInfo.label}
- ${awarenessInfo.description}
- Comprimento de copy recomendada: ${awarenessInfo.copyLength}

`;

  // Type-specific instructions
  const typeInstructions: Record<CopyType, string> = {
    headline: `
## INSTRUÇÕES ESPECÍFICAS - HEADLINES

Gere 5 headlines para este funil, seguindo as regras de Gary Halbert e Eugene Schwartz:

1. **Headline Principal** - A mais forte, com curiosidade + benefício específico
2. **Headline de Dor** - Foca na dor do prospect
3. **Headline de Benefício** - Foca no benefício transformacional
4. **Headline de Prova** - Inclui número ou prova social
5. **Headline de Urgência** - Cria senso de urgência

Para cada headline:
- Use especificidade (números, prazos, valores)
- Desperte curiosidade
- Corresponda ao estágio de consciência "${awarenessInfo.label}"
- Máximo 15 palavras

## FORMATO DE RESPOSTA (JSON)

{
  "name": "Headlines - ${funnel.name}",
  "primary": "Headline principal aqui",
  "variations": ["Headline 2", "Headline 3", "Headline 4", "Headline 5"],
  "structure": {
    "headline": "Headline principal",
    "subheadline": "Subheadline de apoio"
  },
  "reasoning": "Explicação de por que essas headlines funcionam para este contexto",
  "copywriterInsights": [
    {"copywriterId": "gary_halbert", "copywriterName": "Gary Halbert", "expertise": "Headlines & Psicologia", "insight": "Insight específico"},
    {"copywriterId": "eugene_schwartz", "copywriterName": "Eugene Schwartz", "expertise": "Consciência de Mercado", "insight": "Insight específico"}
  ],
  "scorecard": {
    "headlines": 8,
    "structure": 7,
    "benefits": 8,
    "offer": 7,
    "proof": 6,
    "overall": 7.2
  }
}`,
    
    email_sequence: `
## INSTRUÇÕES ESPECÍFICAS - SEQUÊNCIA DE EMAILS

Gere uma sequência de 5 emails de follow-up, seguindo as regras de Dan Kennedy e Frank Kern:

1. **Email 1 (Dia 0)** - Entrega + Abertura de loop
2. **Email 2 (Dia 1)** - Aprofunda o problema
3. **Email 3 (Dia 3)** - Apresenta a solução
4. **Email 4 (Dia 5)** - Prova social + Urgência
5. **Email 5 (Dia 7)** - Última chamada

Para cada email:
- Subject line que gera curiosidade
- Corpo conversacional e autêntico
- CTA claro
- Transições suaves (Sugarman)

## FORMATO DE RESPOSTA (JSON)

{
  "name": "Sequência de Emails - ${funnel.name}",
  "primary": "Visão geral da sequência",
  "emails": [
    {"day": 0, "subject": "Subject 1", "preheader": "Preheader", "body": "Corpo do email...", "cta": "CTA", "goal": "Objetivo"},
    {"day": 1, "subject": "Subject 2", "preheader": "Preheader", "body": "Corpo...", "cta": "CTA", "goal": "Objetivo"},
    {"day": 3, "subject": "Subject 3", "preheader": "Preheader", "body": "Corpo...", "cta": "CTA", "goal": "Objetivo"},
    {"day": 5, "subject": "Subject 4", "preheader": "Preheader", "body": "Corpo...", "cta": "CTA", "goal": "Objetivo"},
    {"day": 7, "subject": "Subject 5", "preheader": "Preheader", "body": "Corpo...", "cta": "CTA", "goal": "Objetivo"}
  ],
  "reasoning": "Explicação da estratégia da sequência",
  "copywriterInsights": [
    {"copywriterId": "dan_kennedy_copy", "copywriterName": "Dan Kennedy", "expertise": "Oferta & Urgência", "insight": "Insight específico"},
    {"copywriterId": "frank_kern_copy", "copywriterName": "Frank Kern", "expertise": "Fluxo de Vendas", "insight": "Insight específico"}
  ],
  "scorecard": {
    "headlines": 8,
    "structure": 8,
    "benefits": 7,
    "offer": 8,
    "proof": 7,
    "overall": 7.6
  }
}`,

    offer_copy: `
## INSTRUÇÕES ESPECÍFICAS - COPY DE OFERTA

Gere a copy completa da oferta, seguindo as regras de Dan Kennedy e Joseph Sugarman:

Estrutura:
1. **Abertura** - Gancho que prende atenção
2. **Problema** - Aprofunda a dor
3. **Agitação** - Consequências de não resolver
4. **Solução** - Seu produto como solução
5. **Benefícios** - Lista de benefícios (não features)
6. **Prova** - Testimoniais, dados, casos
7. **Oferta** - Exatamente o que recebe
8. **Bônus** - Valor adicional
9. **Garantia** - Remove o risco
10. **Urgência** - Por que agora
11. **CTA** - Próximo passo claro

## FORMATO DE RESPOSTA (JSON)

{
  "name": "Oferta - ${funnel.name}",
  "primary": "Copy completa da oferta (formato markdown)",
  "structure": {
    "headline": "Headline da oferta",
    "subheadline": "Subheadline",
    "bullets": ["Benefício 1", "Benefício 2", "Benefício 3", "Benefício 4", "Benefício 5"],
    "cta": "Call to action",
    "guarantee": "Garantia",
    "urgency": "Elemento de urgência",
    "proof": "Elemento de prova"
  },
  "reasoning": "Explicação da estrutura e escolhas",
  "copywriterInsights": [
    {"copywriterId": "dan_kennedy_copy", "copywriterName": "Dan Kennedy", "expertise": "Oferta & Urgência", "insight": "Insight sobre a oferta"},
    {"copywriterId": "joseph_sugarman", "copywriterName": "Joseph Sugarman", "expertise": "Narrativa & Estrutura", "insight": "Insight sobre estrutura"}
  ],
  "scorecard": {
    "headlines": 7,
    "structure": 9,
    "benefits": 8,
    "offer": 9,
    "proof": 7,
    "overall": 8.0
  }
}`,

    vsl_script: `
## INSTRUÇÕES ESPECÍFICAS - SCRIPT DE VSL

Gere um script de VSL (Video Sales Letter), seguindo as regras de Joseph Sugarman e John Carlton:

Estrutura clássica:
1. **Hook (0-30s)** - Prende atenção imediatamente
2. **Problema (30s-2min)** - Identifica e aprofunda a dor
3. **Agitação (2-4min)** - Consequências, urgência emocional
4. **Credenciais (4-5min)** - Por que você pode ajudar
5. **Solução (5-8min)** - Sua abordagem única
6. **Benefícios (8-12min)** - Transformação específica
7. **Prova (12-15min)** - Casos, testimoniais, dados
8. **Oferta (15-18min)** - Exatamente o que recebe
9. **Bônus (18-20min)** - Valor adicional
10. **Garantia (20-21min)** - Remove objeções
11. **Urgência (21-22min)** - Por que agora
12. **CTA (22-25min)** - Chamada clara para ação

## FORMATO DE RESPOSTA (JSON)

{
  "name": "VSL Script - ${funnel.name}",
  "primary": "Resumo do VSL",
  "vslSections": [
    {"order": 1, "name": "Hook", "duration": "0-30s", "content": "Script do hook...", "notes": "Notas de direção"},
    {"order": 2, "name": "Problema", "duration": "30s-2min", "content": "Script...", "notes": "Notas"},
    {"order": 3, "name": "Agitação", "duration": "2-4min", "content": "Script...", "notes": "Notas"},
    {"order": 4, "name": "Credenciais", "duration": "4-5min", "content": "Script...", "notes": "Notas"},
    {"order": 5, "name": "Solução", "duration": "5-8min", "content": "Script...", "notes": "Notas"},
    {"order": 6, "name": "Benefícios", "duration": "8-12min", "content": "Script...", "notes": "Notas"},
    {"order": 7, "name": "Prova", "duration": "12-15min", "content": "Script...", "notes": "Notas"},
    {"order": 8, "name": "Oferta", "duration": "15-18min", "content": "Script...", "notes": "Notas"},
    {"order": 9, "name": "Bônus", "duration": "18-20min", "content": "Script...", "notes": "Notas"},
    {"order": 10, "name": "Garantia", "duration": "20-21min", "content": "Script...", "notes": "Notas"},
    {"order": 11, "name": "Urgência", "duration": "21-22min", "content": "Script...", "notes": "Notas"},
    {"order": 12, "name": "CTA", "duration": "22-25min", "content": "Script...", "notes": "Notas"}
  ],
  "reasoning": "Explicação da estrutura do VSL",
  "copywriterInsights": [
    {"copywriterId": "joseph_sugarman", "copywriterName": "Joseph Sugarman", "expertise": "Narrativa & Estrutura", "insight": "Insight sobre storytelling"},
    {"copywriterId": "john_carlton", "copywriterName": "John Carlton", "expertise": "Voz Autêntica", "insight": "Insight sobre voz"}
  ],
  "scorecard": {
    "headlines": 8,
    "structure": 9,
    "benefits": 8,
    "offer": 8,
    "proof": 7,
    "overall": 8.0
  }
}`,

    ad_creative: `
## INSTRUÇÕES ESPECÍFICAS - COPY DE ANÚNCIOS

Gere copy para 5 variações de anúncios (Meta/Instagram), seguindo as regras de Gary Halbert e Drayton Bird:

Para cada anúncio:
- **Hook** - Primeira linha que para o scroll
- **Body** - Corpo curto e direto
- **CTA** - Chamada clara

Variações:
1. **Dor** - Foca na dor/problema
2. **Benefício** - Foca no benefício transformacional
3. **Curiosidade** - Desperta curiosidade
4. **Prova Social** - Usa números/resultados
5. **Urgência** - Cria senso de urgência

## FORMATO DE RESPOSTA (JSON)

{
  "name": "Anúncios - ${funnel.name}",
  "primary": "Visão geral das variações",
  "variations": [
    "🔥 [Hook Dor]\\n\\n[Body]\\n\\n👉 [CTA]",
    "✨ [Hook Benefício]\\n\\n[Body]\\n\\n👉 [CTA]",
    "🤔 [Hook Curiosidade]\\n\\n[Body]\\n\\n👉 [CTA]",
    "📊 [Hook Prova]\\n\\n[Body]\\n\\n👉 [CTA]",
    "⏰ [Hook Urgência]\\n\\n[Body]\\n\\n👉 [CTA]"
  ],
  "structure": {
    "headline": "Hook principal",
    "cta": "CTA padrão"
  },
  "reasoning": "Explicação das variações e estratégia de teste",
  "copywriterInsights": [
    {"copywriterId": "gary_halbert", "copywriterName": "Gary Halbert", "expertise": "Headlines & Psicologia", "insight": "Insight sobre hooks"},
    {"copywriterId": "drayton_bird", "copywriterName": "Drayton Bird", "expertise": "Simplicidade & Eficiência", "insight": "Insight sobre clareza"}
  ],
  "scorecard": {
    "headlines": 9,
    "structure": 7,
    "benefits": 8,
    "offer": 7,
    "proof": 7,
    "overall": 7.6
  }
}`,

    landing_page: `
## INSTRUÇÕES ESPECÍFICAS - COPY DE LANDING PAGE

Gere a estrutura completa de copy para uma landing page, seguindo as regras de David Ogilvy e Joseph Sugarman:

Seções:
1. **Above the Fold** - Headline, subheadline, CTA
2. **Problema** - Identifica a dor
3. **Solução** - Sua abordagem
4. **Benefícios** - Lista de transformações
5. **Como Funciona** - 3 passos simples
6. **Prova Social** - Testimoniais
7. **FAQ** - Objeções respondidas
8. **Oferta** - Exatamente o que recebe
9. **Garantia** - Remove risco
10. **CTA Final** - Última chamada

## FORMATO DE RESPOSTA (JSON)

{
  "name": "Landing Page - ${funnel.name}",
  "primary": "Copy completa da landing page (formato markdown com seções)",
  "structure": {
    "headline": "Headline principal",
    "subheadline": "Subheadline de apoio",
    "bullets": ["Benefício 1", "Benefício 2", "Benefício 3"],
    "cta": "Call to action principal",
    "guarantee": "Garantia",
    "urgency": "Elemento de urgência",
    "proof": "Elemento de prova social"
  },
  "reasoning": "Explicação da estrutura e fluxo da página",
  "copywriterInsights": [
    {"copywriterId": "david_ogilvy", "copywriterName": "David Ogilvy", "expertise": "Brand Premium", "insight": "Insight sobre pesquisa e posicionamento"},
    {"copywriterId": "joseph_sugarman", "copywriterName": "Joseph Sugarman", "expertise": "Narrativa & Estrutura", "insight": "Insight sobre fluxo"}
  ],
  "scorecard": {
    "headlines": 8,
    "structure": 9,
    "benefits": 8,
    "offer": 8,
    "proof": 8,
    "overall": 8.2
  }
}`,
  };

  return basePrompt + typeInstructions[copyType] + `

## REGRAS IMPORTANTES

1. Retorne APENAS o JSON válido, sem markdown code blocks
2. Use o português brasileiro
3. Seja específico para o contexto deste funil
4. Aplique os princípios dos copywriters mencionados
5. Scores do scorecard devem ser realistas (6-9 range típico)
6. O campo "primary" deve conter a copy principal ou resumo
7. Inclua insights de pelo menos 2 copywriters relevantes`;
}

// Parse JSON from Gemini response
function parseGeminiResponse(text: string): any {
  // Remove markdown code blocks if present
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.trim();
  
  return JSON.parse(cleaned);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { funnelId, proposalId, copyType, awarenessStage, userId } = body;

    // Validate required fields
    if (!funnelId || !proposalId || !copyType) {
      return NextResponse.json(
        { error: 'funnelId, proposalId, and copyType are required' },
        { status: 400 }
      );
    }

    // Validate copy type
    if (!COPY_TYPES[copyType as CopyType]) {
      return NextResponse.json(
        { error: `Invalid copyType. Valid types: ${Object.keys(COPY_TYPES).join(', ')}` },
        { status: 400 }
      );
    }

    // Get funnel
    const funnelRef = doc(db, 'funnels', funnelId);
    const funnelSnap = await getDoc(funnelRef);
    
    if (!funnelSnap.exists()) {
      return NextResponse.json({ error: 'Funnel not found' }, { status: 404 });
    }
    
    const funnel = { id: funnelSnap.id, ...funnelSnap.data() } as Funnel;

    // Get proposal
    const proposalRef = doc(db, 'funnels', funnelId, 'proposals', proposalId);
    const proposalSnap = await getDoc(proposalRef);
    
    if (!proposalSnap.exists()) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }
    
    const proposal = { id: proposalSnap.id, ...proposalSnap.data() } as Proposal;

    // Determine awareness stage
    const finalAwarenessStage: AwarenessStage = awarenessStage || 
      mapAwareness(funnel.context.audience.awareness);

    // Build prompt
    const prompt = buildCopyPrompt(funnel, proposal, copyType as CopyType, finalAwarenessStage);

    console.log(`\n✍️  Gerando ${copyType} para funil "${funnel.name}"...`);

    // Generate with Gemini (using model from env or default to gemini-2.0-flash-exp)
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp';
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Parse response
    let parsedResponse;
    try {
      parsedResponse = parseGeminiResponse(responseText);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', responseText);
      return NextResponse.json(
        { error: 'Failed to parse AI response', details: String(parseError) },
        { status: 500 }
      );
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

    return NextResponse.json({
      success: true,
      copyProposal: {
        id: newCopyDoc.id,
        ...copyProposalData,
      },
    });

  } catch (error) {
    console.error('Copy generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate copy', details: String(error) },
      { status: 500 }
    );
  }
}

// GET - List copy proposals for a funnel
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const funnelId = searchParams.get('funnelId');
    const proposalId = searchParams.get('proposalId');

    if (!funnelId) {
      return NextResponse.json({ error: 'funnelId is required' }, { status: 400 });
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

    return NextResponse.json({ copyProposals });

  } catch (error) {
    console.error('Error fetching copy proposals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch copy proposals', details: String(error) },
      { status: 500 }
    );
  }
}


