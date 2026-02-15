import { NextRequest, NextResponse } from 'next/server';
import { analyzeMultimodalWithGemini, DEFAULT_GEMINI_MODEL } from '@/lib/ai/gemini';
import { buildVisionAnalysisPrompt } from '@/lib/ai/prompts/vision-heuristics';
import { getBrand, updateUserUsage } from '@/lib/firebase/firestore';
import { formatBrandContextForChat, parseAIJSON } from '@/lib/ai/formatters';
import { generateEmbedding } from '@/lib/ai/embeddings';
import { upsertToPinecone } from '@/lib/ai/pinecone';
import { v4 as uuidv4 } from 'uuid';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface VisionAnalysisRequest {
  imageUri: string;      // GS:// or HTTP link
  brandId: string;       // Contexto da marca
  userId: string;        // Necessário para controle de créditos
  context?: string;      // Contexto adicional
}

/**
 * Endpoint para Análise Visual de Criativos via Gemini Vision
 * ST-11.2 - "Olho do Conselho"
 */
export async function POST(request: NextRequest) {
  try {
    const body: VisionAnalysisRequest = await request.json();
    const { imageUri, brandId, userId, context: additionalContext } = body;

    if (!imageUri || !brandId || !userId) {
      return createApiError(400, 'imageUri, brandId and userId are required');
    }

    // 1. Carregar Contexto da Marca
    const brand = await getBrand(brandId);
    const brandContext = brand ? formatBrandContextForChat(brand) : '';

    // 2. Preparar Imagem (Fetch & Base64)
    console.log(`[Vision] Processando imagem: ${imageUri}`);
    let fileBase64: string;
    let mimeType: string = 'image/jpeg'; // Default

    try {
      const response = await fetch(imageUri);
      if (!response.ok) throw new Error(`Falha ao buscar imagem: ${response.statusText}`);
      
      const buffer = await response.arrayBuffer();
      fileBase64 = Buffer.from(buffer).toString('base64');
      
      const contentType = response.headers.get('content-type');
      if (contentType) mimeType = contentType;
    } catch (fetchError) {
      console.error('[Vision] Erro ao carregar imagem:', fetchError);
      return createApiError(422, 'Falha ao carregar a imagem para análise.');
    }

    // 3. Executar Análise Multimodal (Gemini Vision)
    const prompt = buildVisionAnalysisPrompt(brandContext, additionalContext);
    
    console.log('[Vision] Chamando Gemini Vision...');
    const rawResponse = await analyzeMultimodalWithGemini(
      prompt,
      fileBase64,
      mimeType,
      { model: DEFAULT_GEMINI_MODEL, temperature: 0.2 }
    );

    // 4. Parsear Resultado
    let insights;
    try {
      insights = parseAIJSON(rawResponse);
    } catch (parseError) {
      console.error('[Vision] Erro ao parsear JSON da IA:', rawResponse);
      return createApiError(500, 'A IA retornou um formato inválido. Tente novamente.');
    }

    // 5. Salvar no Pinecone (Vetorização para RAG Visual)
    try {
      const summaryText = `Análise Visual (${brand?.name || 'Marca'}): ${insights.strategicAdvice}. Score: ${insights.score}. Heurísticas: Legibilidade ${insights.heuristics.legibility.score}, Cores ${insights.heuristics.colorPsychology.score}.`;
      
      const embedding = await generateEmbedding(summaryText);
      const recordId = `vis_${uuidv4().substring(0, 8)}`;

      await upsertToPinecone([
        {
          id: recordId,
          values: embedding,
          metadata: {
            assetType: 'visual_analysis',
            brandId,
            userId,
            score: insights.score,
            heuristics_summary: JSON.stringify(insights.heuristics),
            strategicAdvice: insights.strategicAdvice,
            imageUri,
            createdAt: new Date().toISOString()
          }
        }
      ], { namespace: 'visual' });
      
      console.log(`[Vision] Insights salvos no Pinecone (ID: ${recordId})`);
    } catch (vectorError) {
      console.error('[Vision] Erro ao salvar no Pinecone:', vectorError);
      // Não interrompe o retorno ao usuário se falhar apenas a vetorização
    }

    // 6. Atualizar Uso de Créditos (ST-11.19: 2 créditos para análise multimodal)
    try {
      await updateUserUsage(userId, -2);
      console.log(`[Vision] 2 créditos decrementados para usuário: ${userId}`);
    } catch (creditError) {
      console.error('[Vision] Erro ao atualizar créditos:', creditError);
    }

    return createApiSuccess(insights);

  } catch (error: any) {
    console.error('Error in analyze-visual API:', error);
    return createApiError(500, 'Internal server error', { details: error.message });
  }
}
