import { NextRequest, NextResponse } from 'next/server';
import { getBrand } from '@/lib/firebase/brands';
import { addMessage, getConversation } from '@/lib/firebase/firestore';
import { generateCouncilResponseWithGemini, isGeminiConfigured, PRO_GEMINI_MODEL } from '@/lib/ai/gemini';
import { buildVerdictPrompt, parseVerdictOutput, PROACTIVE_VERDICT_SYSTEM_PROMPT } from '@/lib/ai/prompts/verdict-prompt';
import { requireConversationAccess } from '@/lib/auth/conversation-guard';
import { handleSecurityError } from '@/lib/utils/api-security';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { parseJsonBody } from '@/app/api/_utils/parse-json';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

interface VerdictRequest {
  conversationId: string;
  brandId: string;
}

/**
 * POST /api/chat/verdict
 *
 * Gera um veredito proativo para uma marca recém-criada.
 * Sprint R2.2: Aha Moment - Veredito que aparece automaticamente após onboarding.
 *
 * - NÃO consome créditos (é grátis no onboarding)
 * - Usa PRO_GEMINI_MODEL com temperatura baixa para scoring consistente
 * - Retorna JSON estruturado para renderização especial
 */
export async function POST(request: NextRequest) {
  try {
    const parsed = await parseJsonBody<VerdictRequest>(request);
    if (!parsed.ok) {
      return createApiError(400, parsed.error);
    }

    const { conversationId, brandId } = parsed.data;

    if (!conversationId || !brandId) {
      return createApiError(400, 'conversationId and brandId are required');
    }

    // AUTH: Validate conversation ownership
    try {
      await requireConversationAccess(request, conversationId);
    } catch (error) {
      return handleSecurityError(error);
    }

    // Fetch conversation to verify it exists
    const conversation = await getConversation(conversationId);
    if (!conversation) {
      return createApiError(404, 'Conversation not found');
    }

    // Fetch brand data
    const brand = await getBrand(brandId);
    if (!brand) {
      return createApiError(404, 'Brand not found');
    }

    // Build the verdict prompt
    const verdictPrompt = buildVerdictPrompt(brand);

    let verdictResponse: string;

    if (!isGeminiConfigured()) {
      console.warn('[Verdict API] Gemini not configured, using fallback');
      verdictResponse = generateFallbackVerdict(brand.name);
    } else {
      try {
        console.log('[Verdict API] Generating proactive verdict for brand:', brand.name);

        // Use PRO model with low temperature for consistent scoring
        verdictResponse = await generateCouncilResponseWithGemini(
          'Analise esta marca e forneça o veredito estratégico.',
          verdictPrompt,
          PROACTIVE_VERDICT_SYSTEM_PROMPT,
          PRO_GEMINI_MODEL,
          {
            temperature: 0.3, // Low temperature for consistent scoring
            topP: 0.9,
          }
        );
      } catch (aiError) {
        console.error('[Verdict API] AI generation error:', aiError);
        verdictResponse = generateFallbackVerdict(brand.name);
      }
    }

    // Try to parse the structured output
    const parsedVerdict = parseVerdictOutput(verdictResponse);

    // Save the verdict as a message with special metadata
    try {
      await addMessage(conversationId, {
        role: 'assistant',
        content: verdictResponse, // Store raw response for persistence
        metadata: {
          type: 'verdict',
          counselors: ['estrategista'],
          sources: [],
          parsedVerdict: parsedVerdict, // Store parsed data for quick access
        } as any,
      });
      console.log('[Verdict API] Verdict message saved successfully');
    } catch (dbError) {
      console.error('[Verdict API] Error saving verdict message:', dbError);
      // Don't fail the request, the verdict was still generated
    }

    // NOTE: We do NOT consume credits for the verdict (free onboarding feature)

    return createApiSuccess({
      verdict: parsedVerdict,
      raw: verdictResponse,
      version: 'R2.2-verdict'
    });
  } catch (error) {
    console.error('[Verdict API] Error:', error);
    return createApiError(500, 'Internal server error');
  }
}

/**
 * Fallback verdict when Gemini is not available
 */
function generateFallbackVerdict(brandName: string): string {
  return JSON.stringify({
    brandName,
    scores: {
      positioning: { value: 6, label: 'Posicionamento em análise - configure o Gemini API para avaliação completa' },
      offer: { value: 6, label: 'Oferta em análise - configure o Gemini API para avaliação completa' }
    },
    analysis: {
      strengths: [
        'Você deu o primeiro passo criando sua marca na plataforma',
        'Seu perfil de marca está configurado e pronto para uso'
      ],
      weaknesses: [
        'Recomendamos configurar a API do Gemini para análises completas',
        'Adicione mais detalhes à sua marca para melhores recomendações'
      ]
    },
    actions: [
      {
        title: 'Configure a API do Gemini',
        description: 'Para obter análises estratégicas completas, configure sua chave de API do Gemini nas configurações.'
      },
      {
        title: 'Explore o Chat',
        description: 'Use o chat para conversar com o Conselho sobre estratégias de funil, copy, social e tráfego.'
      }
    ],
    followUpQuestion: 'Qual é o maior desafio que você enfrenta hoje para escalar suas vendas?'
  });
}
