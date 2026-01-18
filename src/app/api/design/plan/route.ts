import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { parseAIJSON } from '@/lib/ai/formatters';

export const runtime = 'nodejs';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { funnelId, userId, context } = body;

    if (!funnelId || !context?.copy) {
      return NextResponse.json({ error: 'Contexto de copy é obrigatório.' }, { status: 400 });
    }

    const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp';
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

    return NextResponse.json({
      success: true,
      prompts: parsed.prompts || []
    });

  } catch (error) {
    console.error('Design plan error:', error);
    return NextResponse.json({ error: 'Falha ao planejar design.' }, { status: 500 });
  }
}
