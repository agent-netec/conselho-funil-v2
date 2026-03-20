export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { parseAIJSON } from '@/lib/ai/formatters';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { handleSecurityError } from '@/lib/utils/api-security';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { DEFAULT_GEMINI_MODEL } from '@/lib/ai/gemini';
import { buildDesignBrainContext } from '@/lib/ai/prompts/design-brain-context';

export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * Sprint 06.5 — Design Evaluation (opt-in)
 * POST /api/design/evaluate
 *
 * Uses Gemini Vision to evaluate a generated image.
 * Returns a 0-100 score + specific feedback.
 * Cost: 0 credits (informational only, uses Flash model).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrl, prompt, campaignId, brandId } = body;

    if (!brandId) {
      return createApiError(400, 'brandId é obrigatório.');
    }

    try {
      await requireBrandAccess(request, brandId);
    } catch (error) {
      return handleSecurityError(error);
    }

    if (!imageUrl) {
      return createApiError(400, 'imageUrl é obrigatório.');
    }

    const apiKey = (process.env.GOOGLE_AI_API_KEY || '').trim();
    if (!apiKey) {
      return createApiError(500, 'GOOGLE_AI_API_KEY não configurada');
    }

    // Load brain context for evaluation criteria
    let designBrainContext = '';
    try {
      designBrainContext = buildDesignBrainContext();
    } catch {
      // Continue without brain context
    }

    // Fetch image and convert to base64 for Gemini Vision
    let imagePart: { inlineData: { data: string; mimeType: string } } | null = null;
    try {
      const imgResponse = await fetch(imageUrl);
      if (imgResponse.ok) {
        const buffer = Buffer.from(await imgResponse.arrayBuffer());
        const mimeType = imgResponse.headers.get('content-type') || 'image/png';
        imagePart = { inlineData: { data: buffer.toString('base64'), mimeType } };
      }
    } catch {
      return createApiError(400, 'Não foi possível carregar a imagem para avaliação.');
    }

    if (!imagePart) {
      return createApiError(400, 'Imagem não disponível para avaliação.');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: DEFAULT_GEMINI_MODEL,
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    });

    const evaluationPrompt = `Você é o Diretor de Arte do MKTHONEY avaliando um criativo gerado por IA.

${designBrainContext || ''}

${prompt ? `[PROMPT ORIGINAL]\n${prompt}\n` : ''}

[SUA MISSÃO]
Avalie esta imagem como um diretor de arte experiente. Seja específico e construtivo.

Critérios de avaliação:
1. Composição e hierarquia visual (0-20)
2. Impacto e capacidade de parar o scroll (0-20)
3. Coerência com o briefing/prompt (0-20)
4. Qualidade técnica (nitidez, cores, iluminação) (0-20)
5. Potencial de conversão/engajamento (0-20)

Retorne APENAS JSON:
{
  "score": number (0-100, soma dos critérios),
  "breakdown": {
    "composicao": number,
    "impacto": number,
    "coerencia": number,
    "qualidade": number,
    "conversao": number
  },
  "feedback": "string (2-3 frases específicas sobre pontos fortes e fracos)",
  "sugestoes": ["string (1-2 sugestões concretas de melhoria)"]
}`;

    const result = await model.generateContent([
      { text: evaluationPrompt },
      imagePart,
    ]);

    const responseText = result.response.text();
    const parsed = parseAIJSON(responseText);

    // No credit deduction — informational only

    return createApiSuccess(parsed);
  } catch (error) {
    console.error('[Design/Evaluate] Error:', error);
    if (error instanceof Error) {
      const msg = error.message || '';
      if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('QUOTA_EXCEEDED') || msg.includes('429')) {
        return createApiError(429, 'Cota de IA excedida. Tente novamente em alguns minutos.');
      }
    }
    return createApiError(500, 'Falha ao avaliar criativo.');
  }
}
