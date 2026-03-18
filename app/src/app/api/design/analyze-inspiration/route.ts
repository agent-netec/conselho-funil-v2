import { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { handleSecurityError } from '@/lib/utils/api-security';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { DEFAULT_GEMINI_MODEL } from '@/lib/ai/gemini';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ANALYSIS_PROMPT = `Analise esta imagem de referência visual e extraia as características de estilo.
Identifique:
- Esquema de cores dominante (ex: "fundo escuro", "tons quentes", "monocromático")
- Estilo de composição (ex: "minimalista", "maximalist", "grid")
- Mood/atmosfera (ex: "luxuoso", "urgente", "calmo", "energético")
- Tipografia se visível (ex: "sans-serif bold", "script elegante")
- Elementos gráficos (ex: "gradientes", "formas geométricas", "texturas orgânicas")

Retorne APENAS um JSON: { "traits": ["trait1", "trait2", ...] }
Máximo 8 traits, mínimo 3. Cada trait deve ser curta (2-4 palavras em português).`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrl, brandId } = body;

    if (!imageUrl || typeof imageUrl !== 'string') {
      return createApiError(400, 'imageUrl é obrigatório.');
    }

    if (!brandId || typeof brandId !== 'string') {
      return createApiError(400, 'brandId é obrigatório.');
    }

    // Auth & brand access
    try {
      await requireBrandAccess(request, brandId);
    } catch (error) {
      return handleSecurityError(error);
    }

    const apiKey = (process.env.GOOGLE_AI_API_KEY || '').trim();
    if (!apiKey) {
      return createApiError(500, 'GOOGLE_AI_API_KEY não configurada.');
    }

    // Fetch image and convert to base64
    let imageBase64: string;
    let imageMimeType: string;

    try {
      const imageRes = await fetch(imageUrl);
      if (!imageRes.ok) {
        return createApiError(400, `Falha ao buscar imagem: HTTP ${imageRes.status}`);
      }

      imageMimeType = imageRes.headers.get('content-type') || 'image/png';
      const buffer = Buffer.from(await imageRes.arrayBuffer());
      imageBase64 = buffer.toString('base64');
    } catch (fetchErr) {
      console.error('[analyze-inspiration] Erro ao buscar imagem:', fetchErr);
      return createApiError(400, 'Não foi possível baixar a imagem da URL fornecida.');
    }

    // Send to Gemini Vision
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: DEFAULT_GEMINI_MODEL,
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const result = await model.generateContent([
      { text: ANALYSIS_PROMPT },
      {
        inlineData: {
          data: imageBase64,
          mimeType: imageMimeType,
        },
      },
    ]);

    const responseText = result.response?.text?.();
    if (!responseText) {
      return createApiError(500, 'Gemini não retornou resposta para análise da imagem.');
    }

    // Parse traits from JSON response
    let traits: string[] = [];
    try {
      const parsed = JSON.parse(responseText);
      if (Array.isArray(parsed.traits)) {
        traits = parsed.traits
          .filter((t: unknown) => typeof t === 'string' && t.trim().length > 0)
          .slice(0, 8);
      }
    } catch (parseErr) {
      console.error('[analyze-inspiration] Parse error:', parseErr, 'raw:', responseText);
      return createApiError(500, 'Falha ao interpretar resposta da análise visual.');
    }

    if (traits.length < 1) {
      return createApiError(500, 'Nenhuma trait extraída da imagem.');
    }

    console.log(`[analyze-inspiration] Extraídas ${traits.length} traits para brand ${brandId}`);

    return createApiSuccess({ traits });
  } catch (error) {
    console.error('[analyze-inspiration] Erro inesperado:', error);
    return createApiError(500, 'Erro interno ao analisar imagem de inspiração.', {
      details: String(error),
    });
  }
}
