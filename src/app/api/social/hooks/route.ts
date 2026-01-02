import { NextRequest, NextResponse } from 'next/server';
import { ragQuery } from '@/lib/ai/rag';
import { generateWithGemini, isGeminiConfigured } from '@/lib/ai/gemini';
import { getBrand } from '@/lib/firebase/brands';
import { SOCIAL_HOOKS_PROMPT } from '@/lib/ai/prompts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { brandId, platform, topic } = await request.json();

    if (!platform || !topic) {
      return NextResponse.json(
        { error: 'Plataforma e tema são obrigatórios.' },
        { status: 400 }
      );
    }

    if (!isGeminiConfigured()) {
      return NextResponse.json(
        { error: 'API do Gemini não configurada.' },
        { status: 500 }
      );
    }

    // 1. Carregar contexto da marca
    let brandContext = 'Nenhuma marca selecionada. Use um tom de voz neutro, prático e focado em resultados.';
    if (brandId) {
      const brand = await getBrand(brandId);
      if (brand) {
        brandContext = `
Marca: ${brand.name}
Vertical: ${brand.vertical}
Posicionamento: ${brand.positioning}
Tom de Voz: ${brand.voiceTone}
Audiência: ${brand.audience.who}
Dores da Audiência: ${brand.audience.pain}
Oferta Principal: ${brand.offer.what}
Diferencial: ${brand.offer.differentiator}
        `.trim();
      }
    }

    // 2. Buscar heurísticas via RAG
    const queryText = `Heurísticas, ganchos e regras para ${platform}. Como viralizar e reter atenção no ${platform} com o tema ${topic}.`;
    const { context: knowledgeContext } = await ragQuery(queryText, {
      topK: 8,
      minSimilarity: 0.15,
      filters: { docType: 'heuristics' }
    });

    // 3. Montar Prompt
    const fullPrompt = SOCIAL_HOOKS_PROMPT
      .replace('{{brandContext}}', brandContext)
      .replace('{{platform}}', platform)
      .replace('{{topic}}', topic)
      .replace('{{knowledgeContext}}', knowledgeContext || 'Use conhecimento geral sobre melhores práticas de redes sociais.');

    // 4. Gerar com Gemini
    const response = await generateWithGemini(fullPrompt, {
      model: 'gemini-2.0-flash-exp',
      temperature: 0.85,
    });

    // 5. Parse JSON
    let result;
    try {
      let jsonStr = response.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.slice(7);
      }
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.slice(3);
      }
      if (jsonStr.endsWith('```')) {
        jsonStr = jsonStr.slice(0, -3);
      }
      result = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      return NextResponse.json(
        { error: 'Erro ao processar resposta da IA. Tente novamente.' },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Hook generation error:', error);
    return NextResponse.json(
      { error: 'Erro interno no servidor', details: String(error) },
      { status: 500 }
    );
  }
}

