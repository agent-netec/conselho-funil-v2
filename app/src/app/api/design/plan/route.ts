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
      Você é o Conselho de Design Estratégico do "Conselho de Funil".
      Sua missão é criar prompts visuais baseados no framework C.H.A.P.E.U.

      [CONTEXTO ESTRATÉGICO]
      Objetivo: ${context.objective}
      Copy: ${context.copy}
      Hooks: ${JSON.stringify(context.hooks)}

      [INSTRUÇÕES C.H.A.P.E.U]
      1. Planeje 3 criativos visuais diferentes.
      2. Foque em Contraste Alto e Hierarquia Visual.
      3. Use Antropomorfismo (presença humana ou rostos expressivos).
      4. Indique as Safe Zones (Meta Stories, Feed, LinkedIn).
      
      Retorne APENAS um JSON no formato:
      {
        "prompts": [
          { 
            "platform": "meta", 
            "format": "square", 
            "safeZone": "feed", 
            "visualPrompt": "Prompt detalhado em inglês...", 
            "aspectRatio": "1:1",
            "strategy": {
              "contrastFocus": "Descrição do contraste...",
              "balanceType": "asymmetrical",
              "hierarchyOrder": ["Headline", "Product", "CTA"]
            },
            "assets": {
              "headline": "Texto curto para imagem",
              "primaryText": "Texto principal do Ad"
            }
          }
        ]
      }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const parsed = parseAIJSON(responseText);

    // SIG-API-03: Decrementar 2 créditos por geração de design plan
    if (userId) {
      try {
        await updateUserUsage(userId, -2);
        console.log(`[Design/Plan] 2 créditos decrementados para usuário: ${userId}`);
      } catch (creditError) {
        console.error('[Design/Plan] Erro ao atualizar créditos:', creditError);
      }
    }

    return createApiSuccess({ prompts: parsed.prompts || [] });

  } catch (error) {
    console.error('Design plan error:', error);
    return createApiError(500, 'Falha ao planejar design.');
  }
}
