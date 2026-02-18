import { NextRequest } from 'next/server';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { handleSecurityError } from '@/lib/utils/api-security';
import { createApiSuccess, createApiError } from '@/lib/utils/api-response';
export const dynamic = 'force-dynamic';

const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

const VOICE_CONTEXTS = [
  'Headline de anúncio',
  'Post Instagram',
  'Resposta a comentário',
  'Email de boas-vindas',
  'CTA (Call to Action)',
];

export async function POST(req: NextRequest, { params }: { params: Promise<{ brandId: string }> }) {
  const { brandId } = await params;
  const body = await req.json();
  const { voiceProfile } = body;

  try {
    await requireBrandAccess(req, brandId);
  } catch (err: any) {
    return handleSecurityError(err);
  }

  try {
    if (!voiceProfile?.primaryTone) {
      return createApiError(400, 'voiceProfile.primaryTone is required');
    }

    const apiKey = (process.env.GOOGLE_AI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY || '').trim();
    if (!apiKey) return createApiError(500, 'AI API key not configured');

    const prompt = `Você é um copywriter especializado em brand voice.

Perfil de Voz da Marca:
- Tom Principal: ${voiceProfile.primaryTone}
${voiceProfile.secondaryTone ? `- Tom Secundário: ${voiceProfile.secondaryTone}` : ''}
${voiceProfile.preferredVocabulary?.length ? `- Vocabulário Preferido: ${voiceProfile.preferredVocabulary.join(', ')}` : ''}
${voiceProfile.forbiddenTerms?.length ? `- Termos Proibidos: ${voiceProfile.forbiddenTerms.join(', ')}` : ''}
${voiceProfile.samplePhrases?.length ? `- Frases de Referência: ${voiceProfile.samplePhrases.map((p: string) => `"${p}"`).join(', ')}` : ''}
- Idioma: ${voiceProfile.language || 'pt-BR'}

Gere exemplos de como a marca falaria em cada contexto abaixo.

Contextos: ${VOICE_CONTEXTS.join(', ')}

Responda APENAS em JSON:
{
  "samples": [
    { "context": "Headline de anúncio", "sample": "..." },
    { "context": "Post Instagram", "sample": "..." },
    { "context": "Resposta a comentário", "sample": "..." },
    { "context": "Email de boas-vindas", "sample": "..." },
    { "context": "CTA (Call to Action)", "sample": "..." }
  ]
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_GEMINI_MODEL}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('[brands/voice-samples] Gemini API error:', errText);
      return createApiError(502, 'Erro ao processar com IA. Tente novamente.');
    }

    const result = await response.json();
    const aiText = result?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    let parsed;
    try {
      const jsonMatch = aiText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const cleaned = jsonMatch ? jsonMatch[1].trim() : aiText.trim();
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      parsed = JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
    } catch {
      parsed = { samples: [] };
    }

    return createApiSuccess(parsed);
  } catch (error: any) {
    console.error('[Voice Samples] Error:', error);
    return createApiError(500, error.message || 'Failed to generate voice samples');
  }
}
