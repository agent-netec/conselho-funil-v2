export const dynamic = 'force-dynamic';
export const maxDuration = 120;

import { NextRequest } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { handleSecurityError, ApiError } from '@/lib/utils/api-security';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { consumeCredits, CREDIT_COSTS } from '@/lib/firebase/firestore-server';
import { generateWithGemini, PRO_GEMINI_MODEL } from '@/lib/ai/gemini';
import { buildVerdictPrompt, parseVerdictOutput } from '@/lib/ai/prompts/verdict-prompt';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * POST /api/brands/[brandId]/verdict
 * Sprint 08.5: Standalone verdict generation — saves to Firestore, not chat.
 *
 * - First verdict is FREE (onboarding aha moment)
 * - Re-generation costs 1 credit
 * - Saves to brands/{brandId}/verdicts/latest
 * - Stores previous scores for comparison
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ brandId: string }> }
) {
  try {
    const { brandId } = await params;

    if (!brandId) {
      return createApiError(400, 'brandId é obrigatório');
    }

    let userId = '';
    try {
      const access = await requireBrandAccess(request, brandId);
      userId = access.userId;
    } catch (error) {
      return handleSecurityError(error);
    }

    const db = getAdminFirestore();
    const verdictRef = db.collection('brands').doc(brandId).collection('verdicts').doc('latest');

    // Check if this is a re-generation (existing verdict)
    const existingDoc = await verdictRef.get();
    const isRegeneration = existingDoc.exists;

    // Re-generation costs 1 credit
    if (isRegeneration) {
      await consumeCredits(userId, 1, 'verdict_refresh');
    }

    // Fetch brand data
    const brandDoc = await db.collection('brands').doc(brandId).get();
    if (!brandDoc.exists) {
      return createApiError(404, 'Marca não encontrada');
    }
    const brand = { id: brandDoc.id, ...brandDoc.data() } as any;

    // Generate verdict via Gemini
    const prompt = buildVerdictPrompt(brand);
    let responseText: string;
    try {
      responseText = await generateWithGemini(prompt, {
        model: PRO_GEMINI_MODEL,
        temperature: 0.3,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json',
        feature: 'verdict',
        timeoutMs: 30_000,
      });
    } catch (aiError) {
      console.error('[Verdict API] AI generation error:', aiError);
      // Fallback verdict
      responseText = JSON.stringify({
        brandName: brand.name || 'Marca',
        scores: {
          positioning: { value: 6, label: 'Posicionamento em analise' },
          offer: { value: 6, label: 'Oferta em analise' },
        },
        analysis: {
          strengths: ['Marca configurada na plataforma', 'Perfil completo para análise'],
          weaknesses: ['Análise detalhada temporariamente indisponível'],
        },
        actions: [
          { title: 'Criar seu primeiro funil', description: 'O MKTHONEY propõe arquiteturas baseadas na sua marca' },
        ],
        followUpQuestion: 'Qual é o maior desafio que você enfrenta hoje?',
      });
    }

    const parsed = parseVerdictOutput(responseText);
    if (!parsed) {
      return createApiError(500, 'Falha ao parsear verdict');
    }

    // Store previous scores for comparison
    const previousScores = existingDoc.exists
      ? {
          positioning: existingDoc.data()?.scores?.positioning?.value ?? null,
          offer: existingDoc.data()?.scores?.offer?.value ?? null,
          generatedAt: existingDoc.data()?.generatedAt ?? null,
        }
      : null;

    // Save to Firestore
    const verdictData = {
      ...parsed,
      generatedAt: Timestamp.now(),
      previousScores,
      version: isRegeneration ? (existingDoc.data()?.version ?? 0) + 1 : 1,
    };

    await verdictRef.set(verdictData);

    console.log(`[Verdict API] Verdict ${isRegeneration ? 're-generated' : 'generated'} for brand ${brandId}`);

    return createApiSuccess({
      verdict: parsed,
      previousScores,
      isRegeneration,
    });
  } catch (error: unknown) {
    if (error instanceof ApiError) return handleSecurityError(error);
    console.error('[Verdict API] Error:', error);
    if (error instanceof Error) {
      const msg = error.message || '';
      if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('QUOTA_EXCEEDED') || msg.includes('429')) {
        return createApiError(429, 'Cota de IA excedida. Tente novamente em alguns minutos.');
      }
    }
    return createApiError(500, 'Erro interno ao gerar verdict.');
  }
}

/**
 * GET /api/brands/[brandId]/verdict
 * Fetch the latest verdict (for SSR or non-realtime use cases).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ brandId: string }> }
) {
  try {
    const { brandId } = await params;

    if (!brandId) {
      return createApiError(400, 'brandId é obrigatório');
    }

    try {
      await requireBrandAccess(request, brandId);
    } catch (error) {
      return handleSecurityError(error);
    }

    const db = getAdminFirestore();
    const doc = await db.collection('brands').doc(brandId).collection('verdicts').doc('latest').get();

    if (!doc.exists) {
      return createApiSuccess({ verdict: null });
    }

    return createApiSuccess({ verdict: doc.data() });
  } catch (error: unknown) {
    if (error instanceof ApiError) return handleSecurityError(error);
    console.error('[Verdict GET] Error:', error);
    return createApiError(500, 'Erro interno ao buscar verdict.');
  }
}
