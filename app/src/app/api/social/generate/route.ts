export const dynamic = 'force-dynamic';
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

    return NextResponse.json({
      success: true,
      hooks: parsed.hooks || []
    });

  } catch (error) {
    console.error('Social generation error:', error);
    return NextResponse.json({ error: 'Falha ao gerar hooks.' }, { status: 500 });
  }
}
