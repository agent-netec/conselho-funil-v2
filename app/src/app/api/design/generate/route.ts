import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getBrandAdmin } from '@/lib/firebase/firestore-server';
import { updateUserUsageAdmin } from '@/lib/firebase/firestore-server';
import { getBrandAssetsAdmin } from '@/lib/firebase/assets-server';
import { requireBrandAccess, requireMinTier } from '@/lib/auth/brand-guard';
import { handleSecurityError } from '@/lib/utils/api-security';
import { consumeCredits, CREDIT_COSTS } from '@/lib/firebase/firestore-server';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { buildDesignBrainContext } from '@/lib/ai/prompts/design-brain-context';
import { loadCampaignContext } from '@/lib/ai/campaign-context';

/**
 * API Proxy para Geração de Imagens via Google AI (Imagen/Nanobanana)
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120; // Image generation can be slow (30-55s per model)

/**
 * Maps app-side aspect ratios to Gemini Image API valid values.
 * Gemini Image models accept: 1:1, 5:4, 3:4, 4:3, 9:16, 16:9, 21:9
 * App uses: 1:1, 16:9, 4:5, 9:16, 1.91:1
 */
function normalizeAspectRatio(ratio: string): string {
  const mapping: Record<string, string> = {
    '4:5': '3:4',      // portrait → closest supported portrait
    '1.91:1': '16:9',  // Facebook/Instagram wide → standard wide
  };
  const mapped = mapping[ratio];
  if (mapped) {
    console.log(`[Design] Aspect ratio mapped: ${ratio} → ${mapped}`);
  }
  return mapped || ratio;
}

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
      aspectRatio: rawAspectRatio = '16:9',
      imageSize = '2K',
      adjustPrompt,
      editOf,
      copyHeadline,
      copyLanguage,
      campaignId,
      // Design Director expansion
      characterId,
      inspirationTraits,
      styleDirection,
    } = body;

    const aspectRatio = normalizeAspectRatio(rawAspectRatio);

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
      const { effectiveTier, userId: authUserId } = await requireBrandAccess(request, brandId);
      requireMinTier(effectiveTier, 'pro');
      await consumeCredits(authUserId, CREDIT_COSTS.design_generate, 'design_generate');
    } catch (error) {
      return handleSecurityError(error);
    }

    const apiKey = (process.env.GOOGLE_AI_API_KEY || '').trim();
    if (!apiKey) {
      return createApiError(500, 'GOOGLE_AI_API_KEY não configurada');
    }

    // Sprint 06.4: Generate 2 variations per prompt (not 3, to avoid timeout).
    // Direct prompt approach — no LLM pre-call for variant generation.
    // Cost remains 5 credits for the pair.
    const variationCount = 2;
    
    // ... (keep brand/asset loading) ...
    let brandData = null;
    let imageReferences: string[] = [];
    let brandColors: string[] = [];
    let visualStyle = styleDirection || 'Professional and modern';
    let isLogoLocked = false;
    let brandTypography = '';

    if (brandId) {
      console.log(`🔍 Buscando BrandKit e Assets para a marca: ${brandId}`);
      brandData = await getBrandAdmin(brandId);

      if (brandData?.brandKit) {
        const kit = brandData.brandKit;
        brandColors = [kit.colors.primary, kit.colors.secondary, kit.colors.accent].filter(Boolean);
        visualStyle = kit.visualStyle || visualStyle;
        isLogoLocked = Boolean(kit.logoLock?.locked);

        // GAP-1 fix: extract typography
        if (kit.typography?.primaryFont) {
          brandTypography = `Heading: ${kit.typography.primaryFont}, Body: ${kit.typography.secondaryFont || kit.typography.primaryFont}`;
        }

        if (kit.logoLock?.variants?.primary?.url) {
          imageReferences.push(kit.logoLock.variants.primary.url);
        }
      }

      // Buscar até 3 fotos aprovadas (isApprovedForAI) – preparado para escalar até 14
      const assets = await getBrandAssetsAdmin(brandId);
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

      // Design Director: Add character photo as reference if selected
      if (characterId && brandData?.brandKit?.characters) {
        const character = (brandData.brandKit as any).characters.find((c: any) => c.id === characterId);
        if (character?.photoUrl) {
          imageReferences.unshift(character.photoUrl); // Priority reference
          console.log(`[Design] Character reference added: ${character.name}`);
        }
      }
    }

    // Design Director: Build inspiration traits injection
    let inspirationBlock = '';
    if (inspirationTraits?.length > 0) {
      inspirationBlock = `\n[INSPIRATION STYLE]\nThe user wants a style inspired by: ${inspirationTraits.join(', ')}.\nAdapt the visual direction to incorporate these elements while maintaining brand consistency.\n`;
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

    // Linha de Ouro: Load campaign brief for design context
    let campaignBrief = '';
    if (campaignId) {
      try {
        const campaignCtx = await loadCampaignContext(campaignId);
        if (campaignCtx) {
          const briefLines = ['[CAMPAIGN BRIEF]'];
          if (campaignCtx.bigIdea) briefLines.push(`Big Idea: ${campaignCtx.bigIdea}`);
          if (campaignCtx.targetAudience) briefLines.push(`Target: ${campaignCtx.targetAudience}`);
          if (campaignCtx.hooks.length > 0) briefLines.push(`Main Hook: ${campaignCtx.hooks[0]}`);
          if (campaignCtx.tone) briefLines.push(`Tone: ${campaignCtx.tone}`);
          campaignBrief = briefLines.join('\n');
          console.log(`[Design] Campaign brief loaded: ${campaignId}`);
        }
      } catch (campErr) {
        console.warn('[Design] Campaign context load failed:', campErr);
      }
    }

    // Sprint 06.7: Generate images WITHOUT embedded text.
    // Text (headline, CTA) is shown as a separate overlay on the card.
    // This avoids AI text rendering artifacts and gives users more control.
    const textOverlayBlock = `[CRITICAL TEXT RULE]\nDo NOT render any text, headlines, CTAs, or typography in the image.\nThe image should be a PURE VISUAL scene without any text overlays.\nText will be added separately by the user in their editor (Canva, Figma).\nFocus only on the visual composition, mood, lighting, and subjects.\n`;

    // Variant mode: Flash generates ENGLISH scene descriptions (image model works best in English)
    // Portuguese text is injected separately via textOverlayBlock at the final assembly point
    const promptRequest = `
You are a senior art director. Generate EXACTLY a JSON array with 3 detailed prompt strings for generative AI image models: ["v1","v2","v3"].

IMPORTANT: Write ALL prompts in ENGLISH (the image model performs best with English scene descriptions).
Do NOT include any text/headline/CTA content in the prompts — text overlays will be added separately.
Focus ONLY on the visual scene: composition, lighting, mood, subjects, props, colors.

${designBrainContext ? `${designBrainContext}\n\nApply the art direction principles above in each generated prompt.\n` : `Each prompt should apply these art direction principles:
1. Contrast: Integrate platform context with visual contrast appropriate to the objective.
2. Hierarchy: Define clear visual order (Eye Journey).
3. Atmosphere: Cinematic lighting style and emotional tone.
4. Palette & Props: Use brand palette, logo, and strategic visual elements.
5. Structure: Layered composition with depth, respecting Safe Zones.
6. Action: Planned negative space for Headline and CTA placement.
`}
Platform context: ${platformContext}
Visual style: "${visualStyle}"
Palette: ${brandColors.join(', ') || 'n/a'}
${brandTypography ? `Typography: ${brandTypography}\n` : ''}Logo: ${logoInstruction}
Technical heuristics: ${seniorHeuristics.lighting}, ${seniorHeuristics.composition}, ${seniorHeuristics.sharpness}.
Base briefing: ${basePrompt}.
Return ONLY the JSON array of strings.`;

    // Sprint 06.4: Build 2 prompt variants directly (no LLM pre-call)
    const brainBlock = designBrainContext
      ? `[VISUAL FRAMEWORK]\nApply art direction principles: High Contrast, Visual Hierarchy (eye journey), Human presence when appropriate, Proof elements, Composition with negative space for CTA.\n`
      : '';

    const styleBlock = styleDirection
      ? `[STYLE DIRECTION — MANDATORY]\n${styleDirection}\nFollow this style direction strictly. Do NOT default to generic "professional modern" style.\n`
      : '';
    const technicalBlock = !styleDirection
      ? `[TECHNICAL]\n${seniorHeuristics.lighting} | ${seniorHeuristics.composition} | ${seniorHeuristics.sharpness} | ${logoInstruction}`
      : `[TECHNICAL]\n${seniorHeuristics.sharpness} | ${logoInstruction}`;

    // V1: Main approach — faithful to briefing
    const v1 = `[SCENE - VARIATION 1: FAITHFUL]\n${basePrompt}\n\n${styleBlock}${brainBlock}${technicalBlock}`;
    // V2: Alternative approach — creative interpretation with different composition
    const v2 = `[SCENE - VARIATION 2: CREATIVE]\n${basePrompt}\n\nReinterpret the scene with a different composition angle and mood while keeping the same subject and message. Use more dramatic lighting, tighter framing, or an unexpected perspective.\n\n${styleBlock}${brainBlock}${technicalBlock}`;

    let promptVariants = [v1, v2].slice(0, variationCount);
    console.log(`✨ Gerando ${variationCount} variações${styleDirection ? ' com style direction do usuário' : ' com brain context'}.`);
    console.log(`[Design/Debug] styleDirection received:`, styleDirection ? styleDirection.substring(0, 200) : 'NONE');
    console.log(`[Design/Debug] basePrompt:`, basePrompt.substring(0, 200));

    // US-20.3: Geração de imagens com fallback chain de modelos
    // Tenta modelos em ordem de qualidade: Pro (3.0) → Flash (2.5)
    // Ref: contract 22-2, gemini-2.0-flash-exp is DEPRECATED
    const IMAGE_MODELS = [
      { id: 'gemini-3.1-flash-image-preview', name: 'Nano Banana 2 (3.1 Flash)' },
      { id: 'gemini-3-pro-image-preview', name: 'Nano Banana Pro (3.0)' },
      { id: 'gemini-2.5-flash-image', name: 'Nano Banana (Flash 2.5)' },
    ];
    const BASE_IMAGE_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';

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

    console.log(`🚀 Gerando imagem com fallback chain: ${IMAGE_MODELS.map(m => m.name).join(' → ')}`);

    const generationErrors: string[] = [];

    // Helper: tenta gerar imagem com um modelo específico
    async function tryGenerateWithModel(
      modelId: string,
      modelName: string,
      prompt: string,
      attempt: number
    ): Promise<{ data: any; modelUsed: string } | null> {
      const endpoint = `${BASE_IMAGE_ENDPOINT}/${modelId}:generateContent`;
      const contents = [
        {
          role: 'user',
          parts: [
            { text: prompt },
            ...referenceParts.filter(Boolean),
            ...(editImagePart ? [editImagePart] : []),
          ],
        },
      ];

      const payload = {
        contents,
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE'],
          imageConfig: {
            aspectRatio: aspectRatio,
          },
        },
      };

      console.log(`  🔄 [${attempt}] Tentando ${modelName} (${modelId})...`);

      const response = await fetchWithTimeout(
        endpoint,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify(payload),
        },
        55000
      );

      if (!response.ok) {
        const errorText = await response.text();
        const errMsg = `${modelName} HTTP ${response.status}: ${errorText.substring(0, 300)}`;
        console.warn(`  ❌ ${errMsg}`);
        generationErrors.push(errMsg);
        return null;
      }

      const data = await response.json();
      const inlineData =
        data?.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData ||
        data?.content?.parts?.find((p: any) => p.inlineData)?.inlineData;

      if (!inlineData?.data) {
        const noDataMsg = `${modelName}: sem imagem na resposta. ${JSON.stringify(data).substring(0, 200)}`;
        console.warn(`  ⚠️ ${noDataMsg}`);
        generationErrors.push(noDataMsg);
        return null;
      }

      console.log(`  ✅ ${modelName} gerou imagem com sucesso!`);
      return { data, modelUsed: modelId };
    }

    const generationPromises = promptVariants.map(async (promptVariant, index) => {
      try {
        const finalPrompt = `${textOverlayBlock}\n${campaignBrief ? campaignBrief + '\n\n' : ''}${inspirationBlock}${promptVariant}\n\n[LOGO_RULE]: ${logoInstruction}\n[REFERENCES]: ${imageReferences.join(', ')}`;

        // Fallback chain: tenta cada modelo em ordem
        let result: { data: any; modelUsed: string } | null = null;
        for (const model of IMAGE_MODELS) {
          try {
            result = await tryGenerateWithModel(model.id, model.name, finalPrompt, index + 1);
            if (result) break; // Sucesso — não precisa tentar o próximo
          } catch (modelErr: any) {
            const errMsg = modelErr?.message || String(modelErr);
            console.warn(`  ⚠️ ${model.name} falhou: ${errMsg}`);
            generationErrors.push(`${model.name}: ${errMsg}`);
          }
        }

        if (!result) return null;

        const { data, modelUsed } = result;
        const inlineData =
          data?.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData ||
          data?.content?.parts?.find((p: any) => p.inlineData)?.inlineData;

        const mimeType = inlineData.mimeType || 'image/png';
        const generatedId: string =
          data?.candidates?.[0]?.content?.parts?.[0]?.id || `gmi_${Date.now()}_${index}`;

        // Upload server-side via REST API do Firebase Storage
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
          console.log(`✅ Upload concluído para variante ${index + 1}`);
        } catch (uploadErr: any) {
          const errMsg = uploadErr?.message || String(uploadErr);
          console.error(`⚠️ Upload falhou para variante ${index + 1}:`, errMsg);
          imageUrl = `data:${mimeType};base64,${inlineData.data}`;
          (globalThis as any).__lastUploadError = errMsg;
        }

        return {
          url: imageUrl,
          processId: generatedId,
          promptUsed: promptVariant,
          checklist: { legibility200x112: 'pending', contrast: 'pending', ctaClear: 'pending' },
          model: modelUsed,
        };
      } catch (variantError: any) {
        const errorMsg = variantError?.message || String(variantError);
        console.error(`❌ Erro fatal na variante ${index + 1}:`, errorMsg);
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
      await updateUserUsageAdmin(userId, -5);
      console.log(`[Design] 5 créditos decrementados para usuário: ${userId}`);
    } catch (creditError) {
      console.error('[Design] Erro ao atualizar créditos:', creditError);
    }

    const modelUsed = generationResponses[0]?.model || 'unknown';
    console.log(`🎉 Geração concluída com modelo: ${modelUsed}`);

    return createApiSuccess({
      imageUrl: generationResponses[0]?.url,
      processId: generationResponses[0]?.processId,
      images: generationResponses,
      version: '11.25.0-model-fallback',
      uploadDebug: (globalThis as any).__lastUploadError || null,
      metadata: {
        type,
        aspectRatio,
        promptVariants,
        imageReferences,
        usingBrandAssets: imageReferences.length > 0,
        model: modelUsed,
        fallbackChain: IMAGE_MODELS.map(m => m.id),
      },
    });
  } catch (error) {
    console.error('Google Image Generation Error:', error);
    if (error instanceof Error) {
      const msg = error.message || '';
      if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('QUOTA_EXCEEDED') || msg.includes('429')) {
        return createApiError(429, 'Cota de IA excedida. Tente novamente em alguns minutos.');
      }
    }
    return createApiError(500, 'Failed to generate image via Google AI', { details: String(error) });
  }
}
