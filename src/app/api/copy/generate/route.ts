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
  CopyType, 
  AwarenessStage,
  CopyScorecard,
} from '@/types/database';
import { 
  AWARENESS_STAGES, 
  COPY_TYPES 
} from '@/lib/constants';
import { buildCopyPrompt } from '@/lib/ai/prompts';

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
    const awarenessInfo = AWARENESS_STAGES[finalAwarenessStage];
    const prompt = buildCopyPrompt(funnel, proposal, copyType as CopyType, awarenessInfo);

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
