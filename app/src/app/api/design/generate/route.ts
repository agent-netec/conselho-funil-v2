import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getBrand, updateUserUsage } from '@/lib/firebase/firestore';
import { getBrandAssets } from '@/lib/firebase/assets';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { handleSecurityError } from '@/lib/utils/api-security';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';

/**
 * API Proxy para Geração de Imagens via Google AI (Imagen/Nanobanana)
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      prompt,
      type,
      platform,
      format,
      safeZone,
      brandId,
      userId,
      aspectRatio = '16:9',
      imageSize = '2K',
      adjustPrompt,
      editOf,
    } = body;

    const basePrompt = adjustPrompt || prompt;
    if (!basePrompt) {
      return createApiError(400, 'Prompt is required');
    }

    if (!userId) {
      return createApiError(400, 'userId is required for credit management');
    }

    if (!brandId) {
      return createApiError(400, 'brandId é obrigatório.');
    }

    try {
      await requireBrandAccess(request, brandId);
    } catch (error) {
      return handleSecurityError(error);
    }

    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      return createApiError(500, 'GOOGLE_AI_API_KEY não configurada');
    }

    // ST-11.24 Optimization: Se o prompt já vem detalhado (do card), não precisamos gerar variantes
    // Isso economiza tempo (uma chamada a menos de LLM) e evita timeouts de 3 imagens.
    const isSingleGeneration = !body.generateVariants;
    
    // ... (keep brand/asset loading) ...
    let brandData = null;
    let imageReferences: string[] = [];
    let brandColors: string[] = [];
    let visualStyle = 'Professional and modern';
    let isLogoLocked = false;

    if (brandId) {
      console.log(`🔍 Buscando BrandKit e Assets para a marca: ${brandId}`);
      brandData = await getBrand(brandId);

      if (brandData?.brandKit) {
        const kit = brandData.brandKit;
        brandColors = [kit.colors.primary, kit.colors.secondary, kit.colors.accent].filter(Boolean);
        visualStyle = kit.visualStyle || visualStyle;
        isLogoLocked = Boolean(kit.logoLock?.locked);

        if (kit.logoLock?.variants?.primary?.url) {
          imageReferences.push(kit.logoLock.variants.primary.url);
        }
      }

      // Buscar até 3 fotos aprovadas (isApprovedForAI) – preparado para escalar até 14
      const assets = await getBrandAssets(brandId);
      const approvedImages = assets
        .filter(
          (a) =>
            (a.type === 'image' || a.mimeType?.startsWith('image/')) &&
            a.mimeType !== 'image/svg+xml' && // QA: SVG não é suportado como referência pelo Gemini Image
            a.isApprovedForAI &&
            a.status === 'ready',
        )
        .slice(0, 3)
        .map((a) => a.url);

      imageReferences = [...imageReferences, ...approvedImages];
    }

    console.log(
      `🎨 Preparando geração [${type}] com ${imageReferences.length} referências, aspect ${aspectRatio}, size ${imageSize}`,
    );

    // US-22.3: Engenharia de Prompt Sênior (Iluminação, Composição, Nitidez)
    const seniorHeuristics = {
      lighting: 'Rim lighting, Cinematic lighting, Studio soft box, High-key lighting for clarity',
      composition: 'Rule of thirds, Leading lines, Negative space for copy placement, Eye-level framing',
      sharpness: '8k resolution, highly detailed, photorealistic, sharp focus, F-stop 1.8, Depth of field',
    };

    const logoInstruction = isLogoLocked
      ? 'CRITICAL: KEEP THE LOGO IDENTICAL AS PROVIDED IN REFERENCES. PLACE PROMINENTLY.'
      : 'Incorporate brand logo style naturally.';

    const genAI = new GoogleGenerativeAI(apiKey);

    // Geração de 3 variações de prompt via Flash
    const platformContext = platform 
      ? `Plataforma: ${platform}, Formato: ${format || 'n/a'}, Safe Zone: ${safeZone || 'n/a'}` 
      : '';

    const promptRequest = `
Você é um diretor de arte sênior. Gere EXATAMENTE um JSON array com 3 strings de prompts detalhados para IA Generativa: ["v1","v2","v3"].
Cada prompt deve aplicar rigorosamente o Framework C.H.A.P.E.U:
1. [C] Contexto: Integrar plataforma ${platformContext} e objetivo de conversão.
2. [H] Hierarquia: Definir ordem visual clara (Jornada do Olhar).
3. [A] Atmosfera: Estilo "${visualStyle}", iluminação cinematográfica e tom emocional.
4. [P] Paleta & Props: Usar paleta (${brandColors.join(', ') || 'n/a'}), logo (${logoInstruction}) e props estratégicos.
5. [E] Estrutura: Composição baseada em camadas e profundidade, respeitando Safe Zones.
6. [U] Única Ação: Espaço negativo planejado para Headline e CTA.

Heurísticas técnicas: ${seniorHeuristics.lighting}, ${seniorHeuristics.composition}, ${seniorHeuristics.sharpness}.
Briefing base: ${basePrompt}.
Retorne apenas o JSON array de strings.`;

    let promptVariants: string[] = [];
    
    if (isSingleGeneration) {
      // Caso simples: usa o prompt base diretamente com as heurísticas
      promptVariants = [`${basePrompt} | ${seniorHeuristics.lighting} | ${seniorHeuristics.composition} | ${seniorHeuristics.sharpness} | ${logoInstruction}`];
      console.log('✨ Usando modo de geração única para acelerar resposta.');
    } else {
      try {
        const flashModel = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });
        const flashResult = await flashModel.generateContent(promptRequest);
        const text = flashResult.response?.text?.();
        if (text) {
          try {
            const parsed = JSON.parse(text);
            if (Array.isArray(parsed) && parsed.length >= 3) {
              promptVariants = parsed.slice(0, 3).map((p) => String(p));
            }
          } catch (parseError) {
            console.warn('⚠️ Resposta do Flash não pôde ser parseada como JSON.', parseError);
          }
        }
      } catch (flashError) {
        console.warn('⚠️ Falha ao gerar variações no Flash, caindo para fallback.', flashError);
      }
    }

    if (promptVariants.length === 0) {
      promptVariants = [
        `[STANDARD] ${basePrompt} | ${seniorHeuristics.lighting} | ${seniorHeuristics.composition} | ${seniorHeuristics.sharpness} | ${logoInstruction}`,
      ];
      if (!isSingleGeneration) {
        promptVariants.push(
          `[ALTERNATIVE] ${basePrompt} | cinematic mood | ${seniorHeuristics.composition} | ${logoInstruction}`,
          `[CREATIVE] ${basePrompt} | bold contrast, experimental angles | ${seniorHeuristics.sharpness} | ${logoInstruction}`
        );
      }
    }

    // US-20.3: Geração de imagens com Gemini 3 Pro Image (Nano Banana Pro)
    const imageModelId = 'gemini-3-pro-image-preview';
    const imageEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${imageModelId}:generateContent?key=${apiKey}`;

    // Opcional: carregar a imagem-base para edição multi-turno
    const editImagePart = editOf
      ? await (async () => {
          try {
            const res = await fetch(editOf);
            if (!res.ok) return null;
            const mime = res.headers.get('content-type') || 'image/png';
            const buffer = Buffer.from(await res.arrayBuffer());
            return { inlineData: { data: buffer.toString('base64'), mimeType: mime } };
          } catch (e) {
            console.warn('⚠️ Não foi possível carregar imagem para edição.', e);
            return null;
          }
        })()
      : null;

    // Converter refs em partes de imagem (até 3) para fortalecer o grounding visual
    const referenceParts = await Promise.all(
      imageReferences.slice(0, 3).map(async (url) => {
        try {
          const res = await fetch(url);
          if (!res.ok) return null;
          const mime = res.headers.get('content-type') || 'image/png';
          
          // QA: Gemini Image API v1beta não aceita SVG como input de referência
          if (mime.includes('svg')) {
            console.warn('⚠️ Ignorando referência SVG: não suportado pela API de Geração.');
            return null;
          }

          const buffer = Buffer.from(await res.arrayBuffer());
          return { inlineData: { data: buffer.toString('base64'), mimeType: mime } };
        } catch (e) {
          console.warn('⚠️ Falha ao carregar referência de imagem.', e);
          return null;
        }
      }),
    );

    console.log('🚀 Enviando variações em PARALELO para Gemini 3 Pro Image (NanoBanana Pro)...');

    const generationPromises = promptVariants.map(async (promptVariant, index) => {
      try {
        const contents = [
          {
            role: 'user',
            parts: [
              { text: `${promptVariant}\n\n[LOGO_RULE]: ${logoInstruction}\n[REFERENCES]: ${imageReferences.join(', ')}` },
              ...referenceParts.filter(Boolean),
              ...(editImagePart ? [editImagePart] : []),
            ],
          },
        ];

        const payload = {
          contents,
          generationConfig: {
            responseModalities: ['IMAGE'],
            imageConfig: {
              aspectRatio: aspectRatio,
              imageSize: imageSize,
            },
          },
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
          ],
        };

        const response = await fetch(imageEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ [Gemini 3 Image] Erro na variante ${index + 1}:`, errorText);
          return null;
        }

        const data = await response.json();
        const inlineData =
          data?.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData ||
          data?.content?.parts?.find((p: any) => p.inlineData)?.inlineData;

        if (!inlineData?.data) {
          console.warn(`⚠️ Gemini Image API did not return inline image data for variant ${index + 1}`);
          return null;
        }

        const mimeType = inlineData.mimeType || 'image/png';
        const dataUrl = `data:${mimeType};base64,${inlineData.data}`;
        const generatedId: string =
          data?.candidates?.[0]?.content?.role === 'model' && data?.candidates?.[0]?.content?.parts?.[0]?.id
            ? data.candidates[0].content.parts[0].id
            : `gmi_${Date.now()}_${index}`;

        return {
          url: dataUrl,
          processId: generatedId,
          promptUsed: promptVariant,
          checklist: { legibility200x112: 'pending', contrast: 'pending', ctaClear: 'pending' },
          model: 'gemini-3-pro-image-preview',
        };
      } catch (variantError) {
        console.error(`❌ Erro em variante ${index + 1}:`, variantError);
        return null;
      }
    });

    const results = await Promise.all(generationPromises);
    const generationResponses = results.filter((r): r is NonNullable<typeof r> => r !== null);

    if (generationResponses.length === 0) {
      throw new Error('Todas as variações de geração de imagem falharam.');
    }

    // ST-11.19: Decrementar 5 créditos por geração de imagem (Gemini 2.0 Flash)
    try {
      await updateUserUsage(userId, -5);
      console.log(`[Design] 5 créditos decrementados para usuário: ${userId}`);
    } catch (creditError) {
      console.error('[Design] Erro ao atualizar créditos:', creditError);
    }

    return createApiSuccess({
      imageUrl: generationResponses[0]?.url,
      processId: generationResponses[0]?.processId,
      images: generationResponses,
      version: '11.24.5-parallel',
      metadata: {
        type,
        aspectRatio,
        imageSize,
        promptVariants,
        imageReferences,
        usingBrandAssets: imageReferences.length > 0,
        model: 'gemini-3-pro-image-preview',
      },
    });
  } catch (error) {
    console.error('Google Image Generation Error:', error);
    return createApiError(500, 'Failed to generate image via Google AI', { details: String(error) });
  }
}
