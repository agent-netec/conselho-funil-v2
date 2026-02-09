export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { parseAIJSON } from '@/lib/ai/formatters';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { handleSecurityError } from '@/lib/utils/api-security';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { updateUserUsage } from '@/lib/firebase/firestore';

export const runtime = 'nodejs';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { funnelId, userId, brandId, context } = body;

    if (!brandId) {
      return createApiError(400, 'brandId é obrigatório.');
    }

    try {
      await requireBrandAccess(request, brandId);
    } catch (error) {
      return handleSecurityError(error);
    }

    if (!funnelId || !context?.copy) {
      return createApiError(400, 'Contexto de copy é obrigatório.');
    }

    const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
    const model = genAI.getGenerativeModel({ 
      model: modelName,
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
      Você é o Conselho de Social Media do "Conselho de Funil".
      Sua missão é extrair HOOKS (ganchos de atenção) magnéticos de uma copy aprovada.

      [CONTEXTO ESTRATÉGICO]
      Objetivo: ${context.objective}
      Público-alvo: ${context.targetAudience}
      
      [COPY DE REFERÊNCIA]
      ${context.copy}

      [INSTRUÇÕES]
      1. Crie 5 hooks diferentes focados em parar o scroll.
      2. Varie os estilos: Curiosidade, Medo/Alerta, Benefício Direto, Contra-intuitivo, Prova Social.
      3. Adapte cada hook para ser multi-plataforma (Instagram, LinkedIn, TikTok).
      
      Retorne APENAS um JSON no formato:
      {
        "hooks": [
          { "content": "Texto do hook...", "style": "Estilo", "platform": "Plataforma sugerida" }
        ]
      }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const parsed = parseAIJSON(responseText);

    // SIG-API-03: Decrementar 1 crédito por geração social
    if (userId) {
      try {
        await updateUserUsage(userId, -1);
        console.log(`[Social/Generate] 1 crédito decrementado para usuário: ${userId}`);
      } catch (creditError) {
        console.error('[Social/Generate] Erro ao atualizar créditos:', creditError);
      }
    }

    return createApiSuccess({
      hooks: parsed.hooks || []
    });

  } catch (error) {
    console.error('Social generation error:', error);
    return createApiError(500, 'Falha ao gerar hooks.');
  }
}
