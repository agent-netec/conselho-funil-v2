import { NextRequest } from 'next/server';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { handleSecurityError } from '@/lib/utils/api-security';
import { createApiSuccess, createApiError } from '@/lib/utils/api-response';
import { generateEmbedding } from '@/lib/ai/embeddings';
import { upsertToPinecone, buildPineconeRecord } from '@/lib/ai/pinecone';

export const dynamic = 'force-dynamic';

const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return createApiError(400, 'Invalid JSON body');
  }

  const { brandId, url, platform, notes } = body;

  if (!brandId) {
    return createApiError(400, 'brandId is required');
  }

  try {
    await requireBrandAccess(req, brandId);
  } catch (err: any) {
    return handleSecurityError(err);
  }

  try {
    if (!url) {
      return createApiError(400, 'URL is required');
    }

    const apiKey = (process.env.GOOGLE_AI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY || '').trim();
    if (!apiKey) return createApiError(500, 'AI API key not configured');

    // Analyze the reference campaign via Gemini
    const prompt = `Analise esta referência de campanha/anúncio:

URL: ${url}
Plataforma: ${platform || 'Não especificada'}
Notas do usuário: ${notes || 'Nenhuma'}

Gere uma análise em JSON:
{
  "title": "Título descritivo da campanha de referência",
  "analysis": "Análise detalhada da estratégia, copy e criativo",
  "strengths": ["ponto forte 1", "ponto forte 2"],
  "techniques": ["técnica usada 1", "técnica usada 2"],
  "applicability": "Como aplicar este padrão na marca do usuário",
  "score": 0-100,
  "tags": ["tag1", "tag2"],
  "creativeType": "carrossel" | "video" | "UGC" | "depoimento" | "produto" | "lifestyle" | "before-after"
}

Responda APENAS em JSON válido.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_GEMINI_MODEL}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 2048 },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('[assets/reference] Gemini API error:', errText);
      return createApiError(502, 'Erro ao processar com IA. Tente novamente.');
    }

    const result = await response.json();
    const aiText = result?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    let parsed;
    try {
      const jsonMatch = aiText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const cleaned = jsonMatch ? jsonMatch[1].trim() : aiText.trim();
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      parsed = JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
    } catch {
      parsed = { title: 'Referência', analysis: aiText, strengths: [], techniques: [], tags: [], score: 50 };
    }

    // Save as BrandAsset with type 'reference'
    const assetData = {
      brandId,
      name: parsed.title || `Referência: ${url}`,
      originalName: url,
      type: 'reference' as const,
      mimeType: 'text/html',
      size: 0,
      url,
      sourceUrl: url,
      status: 'ready' as const,
      isApprovedForAI: true,
      tags: parsed.tags || [],
      description: parsed.analysis,
      metadata: {
        sourceType: 'url' as const,
        sourceUrl: url,
        originalName: url,
        isApprovedForAI: true,
        extractedAt: new Date().toISOString(),
        processingMethod: 'text-direct' as const,
        creativeType: parsed.creativeType,
      },
      createdAt: Timestamp.now(),
    };

    const assetsRef = collection(db, 'brands', brandId, 'assets');
    const docRef = await addDoc(assetsRef, assetData);

    // Embed for RAG
    try {
      const embedding = await generateEmbedding(`Reference campaign: ${parsed.title}. ${parsed.analysis}`);
      const record = buildPineconeRecord(`ref_${docRef.id}`, embedding, {
        docType: 'reference_campaign',
        brandId,
        platform: platform || '',
        text: `${parsed.title}\n${parsed.analysis}`,
        status: 'approved',
        isApprovedForAI: true,
      });
      await upsertToPinecone([record], { namespace: `brand_${brandId}` });
    } catch (embErr) {
      console.error('[Reference] Embedding error (non-fatal):', embErr);
    }

    return createApiSuccess({
      id: docRef.id,
      ...parsed,
    });
  } catch (error: any) {
    console.error('[Reference Campaign] Error:', error);
    return createApiError(500, error.message || 'Failed to save reference campaign');
  }
}
