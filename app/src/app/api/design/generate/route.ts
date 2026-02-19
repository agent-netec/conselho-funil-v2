import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getBrand, updateUserUsage } from '@/lib/firebase/firestore';
import { getBrandAssets } from '@/lib/firebase/assets';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { handleSecurityError } from '@/lib/utils/api-security';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { buildDesignBrainContext } from '@/lib/ai/prompts/design-brain-context';

/**
 * API Proxy para Geração de Imagens via Google AI (Imagen/Nanobanana)
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// HOTFIX BUG-004: Timeout + Retry para evitar 504 Gateway Timeout
function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  return Promise.race([
    fetch(url, options),
    new Promise<Response>((_, reject) =>
      setTimeout(() => reject(new Error(`Request timeout após ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  timeoutMs: number,
  maxRetries: number = 1
): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options, timeoutMs);
      return response;
    } catch (error) {
      const isLastAttempt = attempt === maxRetries;
      if (isLastAttempt) {
        throw error;
      }
      console.warn(`⚠️ Tentativa ${attempt + 1} falhou, tentando novamente... (${error})`);
      // Reduz timeout na segunda tentativa para economizar tempo
      timeoutMs = Math.floor(timeoutMs * 0.8);
    }
  }
  throw new Error('Todas as tentativas falharam');
}

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
      copyHeadline,
      copyLanguage,
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
    // HOTFIX BUG-004: Força single generation para evitar 504 timeout (reduz de ~45s para ~20s)
    const isSingleGeneration = true; // Sempre gera apenas 1 imagem
    
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

    // Sprint F: Load brain context from design_director identity card
    let designBrainContext = '';
    try {
      designBrainContext = buildDesignBrainContext();
    } catch (brainErr) {
      console.warn('⚠️ Falha ao carregar brain context do design_director:', brainErr);
    }

    // Sprint I: Build language + text overlay blocks ONCE, inject into ALL modes
    const textOverlayBlock = (() => {
      const langPart = copyLanguage
        ? `[MANDATORY LANGUAGE RULE]\nAll visible text in this image MUST be written in ${copyLanguage}.\nNÃO use inglês para textos visíveis. Todo texto renderizado na imagem DEVE estar em ${copyLanguage}.\nThis is NON-NEGOTIABLE. Any headline, CTA, subtitle, or overlay text = ${copyLanguage} ONLY.\nException: established technical terms (ROAS, CPA, Meta Ads) may stay in English.\n`
        : '';
      const headlinePart = copyHeadline
        ? `[TEXT TO RENDER]\nExact headline to display: "${copyHeadline}"\nDo NOT translate or change this text. Render it exactly as provided.\n`
        : '';
      return langPart + headlinePart;
    })();

    // Variant mode: Flash generates ENGLISH scene descriptions (image model works best in English)
    // Portuguese text is injected separately via textOverlayBlock at the final assembly point
    const promptRequest = `
You are a senior art director. Generate EXACTLY a JSON array with 3 detailed prompt strings for generative AI image models: ["v1","v2","v3"].

IMPORTANT: Write ALL prompts in ENGLISH (the image model performs best with English scene descriptions).
Do NOT include any text/headline/CTA content in the prompts — text overlays will be added separately.
Focus ONLY on the visual scene: composition, lighting, mood, subjects, props, colors.

${designBrainContext ? `${designBrainContext}\n\nApply the frameworks above in each generated prompt.\n` : `Each prompt must rigorously apply the C.H.A.P.E.U Framework:
1. [C] Context: Integrate platform and conversion objective.
2. [H] Hierarchy: Define clear visual order (Eye Journey).
3. [A] Atmosphere: Cinematic lighting style and emotional tone.
4. [P] Palette & Props: Use brand palette, logo, and strategic props.
5. [E] Structure: Layered composition with depth, respecting Safe Zones.
6. [U] Unique Action: Planned negative space for Headline and CTA placement.
`}
Platform context: ${platformContext}
Visual style: "${visualStyle}"
Palette: ${brandColors.join(', ') || 'n/a'}
Logo: ${logoInstruction}
Technical heuristics: ${seniorHeuristics.lighting}, ${seniorHeuristics.composition}, ${seniorHeuristics.sharpness}.
Base briefing: ${basePrompt}.
Return ONLY the JSON array of strings.`;

    let promptVariants: string[] = [];
    
    if (isSingleGeneration) {
      // Sprint I: Single generation — scene in English, text overlay injected at final assembly
      const brainBlock = designBrainContext
        ? `[VISUAL FRAMEWORK]\nApply C.H.A.P.E.U: High Contrast, Visual Hierarchy (eye journey), Human presence (anthropomorphism), Proof elements, Emotional structure with negative space for CTA, Visual urgency.\n`
        : '';
      const technicalBlock = `[TECHNICAL]\n${seniorHeuristics.lighting} | ${seniorHeuristics.composition} | ${seniorHeuristics.sharpness} | ${logoInstruction}`;

      // Scene only — textOverlayBlock is prepended at the final assembly point (line ~253)
      promptVariants = [`[SCENE]\n${basePrompt}\n\n${brainBlock}${technicalBlock}`];
      console.log('✨ Usando modo de geração única com brain context.');
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
      // Fallback prompts: English scene descriptions (text overlay injected at final assembly)
      promptVariants = [
        `[SCENE - STANDARD] ${basePrompt} | ${seniorHeuristics.lighting} | ${seniorHeuristics.composition} | ${seniorHeuristics.sharpness}`,
      ];
      if (!isSingleGeneration) {
        promptVariants.push(
          `[SCENE - ALTERNATIVE] ${basePrompt} | cinematic mood | ${seniorHeuristics.composition}`,
          `[SCENE - CREATIVE] ${basePrompt} | bold contrast, experimental angles | ${seniorHeuristics.sharpness}`
        );
      }
    }

    // US-20.3: Geração de imagens com Gemini 3 Pro Image (Nano Banana Pro)
    const imageModelId = 'gemini-3-pro-image-preview';
    const imageEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${imageModelId}:generateContent`;

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

    const generationErrors: string[] = []; // DEBUG: Captura erros para troubleshooting

    const generationPromises = promptVariants.map(async (promptVariant, index) => {
      try {
        // Sprint I: textOverlayBlock (language + headline) prepended to ALL variants
        // Scene description in English + text overlay in target language = best results
        const finalPrompt = `${textOverlayBlock}\n${promptVariant}\n\n[LOGO_RULE]: ${logoInstruction}\n[REFERENCES]: ${imageReferences.join(', ')}`;
        const contents = [
          {
            role: 'user',
            parts: [
              { text: finalPrompt },
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

        // HOTFIX BUG-004: Usa fetchWithRetry com timeout de 25s (tenta 2x se falhar)
        const response = await fetchWithRetry(
          imageEndpoint,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': apiKey,
            },
            body: JSON.stringify(payload),
          },
          25000, // 25 segundos de timeout
          1 // 1 retry (2 tentativas total)
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ [Gemini 3 Image] HTTP ${response.status} na variante ${index + 1}:`, errorText);
          console.error(`❌ [Gemini 3 Image] Headers:`, Object.fromEntries(response.headers.entries()));
          // DEBUG: Lançar erro com detalhes para troubleshooting
          throw new Error(`Gemini API returned ${response.status}: ${errorText.substring(0, 500)}`);
        }
      } catch (fetchError: any) {
        // HOTFIX BUG-004: Mensagem de erro amigável para timeout
        if (fetchError.message?.includes('timeout')) {
          console.error(
            `⏱️ [Gemini 3 Image] Timeout na variante ${index + 1} após ${25}s. A geração de imagem está demorando mais que o esperado.`
          );
        } else {
          console.error(`❌ [Gemini 3 Image] Erro ao gerar variante ${index + 1}:`, fetchError);
        }
        return null;
      }

      try {

        const data = await response.json();
        const inlineData =
          data?.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData ||
          data?.content?.parts?.find((p: any) => p.inlineData)?.inlineData;

        if (!inlineData?.data) {
          console.warn(`⚠️ Gemini Image API did not return inline image data for variant ${index + 1}`);
          return null;
        }

        const mimeType = inlineData.mimeType || 'image/png';
        const generatedId: string =
          data?.candidates?.[0]?.content?.role === 'model' && data?.candidates?.[0]?.content?.parts?.[0]?.id
            ? data.candidates[0].content.parts[0].id
            : `gmi_${Date.now()}_${index}`;

        // Upload server-side via REST API do Firebase Storage (usa token do usuário autenticado)
        const ext = mimeType.split('/')[1] || 'png';
        const storagePath = `brand-assets/${userId}/${brandId}/${Date.now()}_design_${generatedId}.${ext}`;
        let imageUrl: string;
        try {
          const bucket = (process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '').trim();
          const authToken = request.headers.get('Authorization')?.replace('Bearer ', '');
          if (!bucket || !authToken) throw new Error('Storage bucket ou auth token ausente');

          const buffer = Buffer.from(inlineData.data, 'base64');
          const encodedPath = encodeURIComponent(storagePath);
          const uploadRes = await fetch(
            `https://firebasestorage.googleapis.com/v0/b/${bucket}/o?uploadType=media&name=${encodedPath}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': mimeType,
                'Authorization': `Firebase ${authToken}`,
              },
              body: buffer,
            }
          );

          if (!uploadRes.ok) {
            const errText = await uploadRes.text();
            throw new Error(`Storage REST API ${uploadRes.status}: ${errText}`);
          }

          const uploadData = await uploadRes.json();
          const downloadToken = uploadData.downloadTokens;
          imageUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodedPath}?alt=media&token=${downloadToken}`;
          console.log(`✅ Upload server-side concluído para variante ${index + 1}`);
        } catch (uploadErr: any) {
          const errMsg = uploadErr?.message || String(uploadErr);
          console.error(`⚠️ Upload server-side falhou para variante ${index + 1}:`, errMsg);
          imageUrl = `data:${mimeType};base64,${inlineData.data}`;
          // Surfar erro para debug no client
          (globalThis as any).__lastUploadError = errMsg;
        }

        return {
          url: imageUrl,
          processId: generatedId,
          promptUsed: promptVariant,
          checklist: { legibility200x112: 'pending', contrast: 'pending', ctaClear: 'pending' },
          model: 'gemini-3-pro-image-preview',
        };
      } catch (variantError: any) {
        const errorMsg = variantError?.message || String(variantError);
        console.error(`❌ Erro em variante ${index + 1}:`, variantError);
        generationErrors.push(`Variante ${index + 1}: ${errorMsg}`);
        return null;
      }
    });

    const results = await Promise.all(generationPromises);
    const generationResponses = results.filter((r): r is NonNullable<typeof r> => r !== null);

    if (generationResponses.length === 0) {
      const errorDetails = generationErrors.length > 0
        ? `\n\nDetalhes dos erros:\n${generationErrors.join('\n')}`
        : '';
      throw new Error(`Todas as variações de geração de imagem falharam.${errorDetails}`);
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
      version: '11.24.6-rest-upload',
      uploadDebug: (globalThis as any).__lastUploadError || null,
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
