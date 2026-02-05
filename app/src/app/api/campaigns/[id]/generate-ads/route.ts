import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { buildAdsGenerationPrompt } from '@/lib/ai/prompts/ads-generation';
import { parseAIJSON } from '@/lib/ai/formatters';
import { CampaignContext } from '@/types/campaign';
import { ragQuery, retrieveBrandChunks, formatBrandContextForLLM } from '@/lib/ai/rag';

export const runtime = 'nodejs';
export const maxDuration = 90;

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params;
    
    if (!campaignId) {
      return NextResponse.json({ error: 'Campaign ID is required' }, { status: 400 });
    }

    // 1. Get campaign context
    const campaignRef = doc(db, 'campaigns', campaignId);
    const campaignSnap = await getDoc(campaignRef);
    
    if (!campaignSnap.exists()) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }
    
    const campaign = { id: campaignSnap.id, ...campaignSnap.data() } as CampaignContext;
    
    // 2. RAG Injection (ST-11.15)
    console.log(`[ST-11.15] Injetando RAG para geração de Ads: ${campaignId}`);
    
    // Query focada em tráfego e conversão baseada no objetivo da campanha
    const ragSearchQuery = `Estratégias de tráfego pago, segmentação e escala para ${campaign.funnel?.mainGoal} focado em ${campaign.funnel?.targetAudience}`;
    
    // a) Busca na Base de Conhecimento Global (Especialistas)
    const { context: ragContext } = await ragQuery(ragSearchQuery, { 
      topK: 12, 
      minSimilarity: 0.2,
      filters: { scope: 'traffic' } 
    }, 'ads');
    
    // b) Busca em Assets da Marca (Brand Assets RAG)
    let brandContext = '';
    if (campaign.brandId) {
      try {
        const brandChunks = await retrieveBrandChunks(campaign.brandId, ragSearchQuery, 5);
        if (brandChunks.length > 0) {
          brandContext = formatBrandContextForLLM(brandChunks);
          console.log(`[ST-11.15] Injetados ${brandChunks.length} chunks da marca.`);
        }
      } catch (brandRagError) {
        console.error('Error in Brand RAG:', brandRagError);
      }
    }
    
    // 3. Build prompt with injected context
    const prompt = buildAdsGenerationPrompt(campaign, { ragContext, brandContext });
    
    // 4. Call AI
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // 5. Parse & Update
    let adsData;
    try {
      adsData = parseAIJSON(responseText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', responseText);
      return NextResponse.json(
        { error: 'Failed to parse AI response', details: String(parseError) },
        { status: 500 }
      );
    }
    
    // Update Firestore
    await updateDoc(campaignRef, {
      ads: adsData,
      updatedAt: Timestamp.now()
    });
    
    console.log(`✅ Ads generated for campaign ${campaignId}`);
    
    return NextResponse.json({ 
      success: true, 
      ads: adsData 
    });
    
  } catch (error) {
    console.error('Ads generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate ads strategy', details: String(error) },
      { status: 500 }
    );
  }
}
