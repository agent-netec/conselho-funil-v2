import { NextRequest, NextResponse } from 'next/server';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { handleSecurityError } from '@/lib/utils/api-security';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { updateUserUsage } from '@/lib/firebase/firestore';

/**
 * API Proxy para Motor de Upscale (NanoBanana)
 * 
 * POST /api/design/upscale
 * Body: { imageUrl: string, factor: 2 | 4, brandId: string }
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrl, factor = 2, brandId, userId } = body;

    if (!brandId) {
      return createApiError(400, 'brandId é obrigatório.');
    }

    try {
      await requireBrandAccess(request, brandId);
    } catch (error) {
      return handleSecurityError(error);
    }

    if (!imageUrl) {
      return createApiError(400, 'imageUrl is required');
    }

    console.log(`✨ Iniciando Upscale ${factor}x...`);
    console.log(`🖼️ Imagem: ${imageUrl.substring(0, 50)}...`);

    // US-20.3.3: O "Nanobanana" é o Gemini 3 Pro Image. Usamos a GOOGLE_AI_API_KEY.
    const apiKey = (process.env.GOOGLE_AI_API_KEY || '').trim();
    
    if (!apiKey) {
      console.warn('⚠️ GOOGLE_AI_API_KEY não configurada. Usando mock de upscale.');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return createApiSuccess({
        upscaledUrl: imageUrl,
        factor,
        processId: `up_mock_${Math.random().toString(36).substring(7)}`,
        isMock: true
      });
    }

    console.log(`🚀 Chamando API Google AI (Gemini 3 Pro Image) para Upscale ${factor}x...`);
    
    // O Gemini 3 Pro Image não possui um endpoint de "upscale" tradicional em v1beta.
    // O upscale é feito pedindo uma edição da imagem original com maior resolução (4K).
    const imageModelId = 'gemini-3-pro-image-preview';
    const imageEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${imageModelId}:generateContent?key=${apiKey}`;

    // Carregar imagem original para upscale
    let imagePart = null;
    try {
      const res = await fetch(imageUrl);
      if (res.ok) {
        const mime = res.headers.get('content-type') || 'image/png';
        const buffer = Buffer.from(await res.arrayBuffer());
        imagePart = { inlineData: { data: buffer.toString('base64'), mimeType: mime } };
      }
    } catch (e) {
      console.warn('⚠️ Não foi possível carregar imagem original para upscale.', e);
    }

    if (!imagePart) {
      throw new Error('Could not load source image for upscaling');
    }

    const payload = {
      contents: [{
        role: 'user',
        parts: [
          { text: `Upscale this image to high definition, maintaining all details exactly as they are. Output in ${factor === 4 ? '4K' : '2K'} resolution.` },
          imagePart
        ]
      }],
      generationConfig: {
        responseModalities: ['IMAGE'],
        imageConfig: {
          imageSize: factor === 4 ? '4K' : '2K'
        }
      }
    };

    const response = await fetch(imageEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google AI Upscale Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const inlineData = 
      data?.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData ||
      data?.content?.parts?.find((p: any) => p.inlineData)?.inlineData;

    if (!inlineData?.data) {
      throw new Error('Gemini Image API did not return upscaled image data');
    }

    const mimeType = inlineData.mimeType || 'image/png';
    const upscaledUrl = `data:${mimeType};base64,${inlineData.data}`;

    console.log(`✅ Upscale concluído via Google AI`);

    // SIG-API-03: Decrementar 3 créditos por upscale de imagem
    if (userId) {
      try {
        await updateUserUsage(userId, -3);
        console.log(`[Design/Upscale] 3 créditos decrementados para usuário: ${userId}`);
      } catch (creditError) {
        console.error('[Design/Upscale] Erro ao atualizar créditos:', creditError);
      }
    }

    return createApiSuccess({
      upscaledUrl,
      factor,
      processId: `up_${Date.now()}`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Upscale Error:', error);
    return createApiError(500, 'Failed to upscale image', { details: String(error) });
  }
}



