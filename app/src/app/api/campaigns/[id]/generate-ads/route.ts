export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { buildAdsGenerationPrompt } from '@/lib/ai/prompts/ads-generation';
import { buildAdsBrainContext } from '@/lib/ai/prompts/ads-brain-context';
import { parseAIJSON } from '@/lib/ai/formatters';
import { CampaignContext } from '@/types/campaign';
import { ragQuery, retrieveBrandChunks, formatBrandContextForLLM } from '@/lib/ai/rag';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { updateUserUsage } from '@/lib/firebase/firestore';

export const runtime = 'nodejs';
export const maxDuration = 90;

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params;

    // Extract userId from request body for credit tracking
    let userId: string | undefined;
    try {
      const body = await request.json();
      userId = body?.userId;
    } catch {
      // No request body or invalid JSON — credit tracking skipped
    }
    
    if (!campaignId) {
      return createApiError(400, 'Campaign ID is required');
    }

    // 1. Get campaign context
    const campaignRef = doc(db, 'campaigns', campaignId);
    const campaignSnap = await getDoc(campaignRef);
    
    if (!campaignSnap.exists()) {
      return createApiError(404, 'Campaign not found');
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
    });
    
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
    
    // 3. Sprint C: Build brain context from identity cards (server-only)
    const brainContext = buildAdsBrainContext();

    // 4. Build prompt with injected context
    const prompt = buildAdsGenerationPrompt(campaign, { ragContext, brandContext, brainContext });
    
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
      return createApiError(500, 'Failed to parse AI response', { details: String(parseError) });
    }
    
    // Update Firestore
    await updateDoc(campaignRef, {
      ads: adsData,
      updatedAt: Timestamp.now()
    });
    
    console.log(`✅ Ads generated for campaign ${campaignId}`);

    // SIG-API-03: Decrementar 3 créditos por geração de ads
    if (userId) {
      try {
        await updateUserUsage(userId, -3);
        console.log(`[Campaigns/GenerateAds] 3 créditos decrementados para usuário: ${userId}`);
      } catch (creditError) {
        console.error('[Campaigns/GenerateAds] Erro ao atualizar créditos:', creditError);
      }
    }
    
    return createApiSuccess({ ads: adsData });
    
  } catch (error) {
    console.error('Ads generation error:', error);
    return createApiError(500, 'Failed to generate ads strategy', { details: String(error) });
  }
}
