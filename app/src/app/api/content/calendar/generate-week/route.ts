/**
 * Calendar Generate Week API — AI generates 5-7 posts based on content pillars
 * Sprint M — M-3.3
 *
 * @route POST /api/content/calendar/generate-week
 * @credits 3
 */

import { NextRequest } from 'next/server';
import { Timestamp } from 'firebase/firestore';
import { generateWithGemini, isGeminiConfigured, DEFAULT_GEMINI_MODEL } from '@/lib/ai/gemini';
import { getBrand } from '@/lib/firebase/brands';
import { createCalendarItem } from '@/lib/firebase/content-calendar';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { handleSecurityError } from '@/lib/utils/api-security';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { updateUserUsage } from '@/lib/firebase/firestore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const GENERATE_WEEK_PROMPT = `Você é o planejador de conteúdo do Conselho Social. Gere um plano semanal de 5-7 posts para a marca.

## Regras:
1. Distribua os pilares de conteúdo uniformemente pela semana
2. Varie os formatos (post, carousel, reel, story)
3. Cada post deve ter: titulo, hook de abertura, conteúdo completo, formato, plataforma
4. Respeite o tom de voz e a audiência da marca
5. Inclua CTAs estratégicos alinhados ao funil

## Saída Esperada (JSON APENAS):
{
  "posts": [
    {
      "dayOfWeek": 1,
      "title": "Título do post",
      "hook": "Gancho de abertura",
      "content": "Conteúdo completo do post / roteiro",
      "format": "post | carousel | reel | story",
      "platform": "instagram | linkedin | x | tiktok",
      "pillar": "nome do pilar de conteúdo"
    }
  ]
}

## Contexto da Marca:
{{brandContext}}

## Pilares de Conteúdo:
{{pillars}}

## Plataforma Principal:
{{platform}}
`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { brandId, pillars, platform, startDate } = body;

    if (!brandId) {
      return createApiError(400, 'brandId is required');
    }

    let userId = '';
    try {
      userId = (await requireBrandAccess(req, brandId)).userId;
    } catch (error) {
      return handleSecurityError(error);
    }

    if (!isGeminiConfigured()) {
      return createApiError(500, 'Gemini API not configured');
    }

    // 1. Load brand context
    let brandContext = 'Nenhuma marca selecionada.';
    const brand = await getBrand(brandId);
    if (brand) {
      brandContext = `
Marca: ${brand.name}
Vertical: ${brand.vertical}
Posicionamento: ${brand.positioning}
Tom de Voz: ${brand.voiceTone}
Audiência: ${brand.audience.who}
Dores: ${brand.audience.pain}
Oferta: ${brand.offer.what}
      `.trim();
    }

    // 2. Build prompt
    const defaultPillars = ['Educacional', 'Bastidores', 'Prova Social', 'Oferta/CTA', 'Entretenimento'];
    const prompt = GENERATE_WEEK_PROMPT
      .replace('{{brandContext}}', brandContext)
      .replace('{{pillars}}', (pillars || defaultPillars).join(', '))
      .replace('{{platform}}', platform || 'instagram');

    // 3. Generate with Gemini
    const response = await generateWithGemini(prompt, {
      model: DEFAULT_GEMINI_MODEL,
      temperature: 0.8,
    });

    // 4. Parse JSON
    let result;
    try {
      let jsonStr = response.trim();
      if (jsonStr.startsWith('```json')) jsonStr = jsonStr.slice(7);
      if (jsonStr.startsWith('```')) jsonStr = jsonStr.slice(3);
      if (jsonStr.endsWith('```')) jsonStr = jsonStr.slice(0, -3);
      result = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error('Error parsing week generation:', parseError);
      return createApiError(500, 'Erro ao processar plano semanal.');
    }

    // 5. Create calendar items
    const weekStart = startDate ? new Date(startDate) : getNextMonday();
    const createdItems = [];

    for (let i = 0; i < (result.posts || []).length; i++) {
      const post = result.posts[i];
      const scheduledDate = new Date(weekStart);
      // dayOfWeek: 1=Monday, 7=Sunday; fallback to sequential days
      const dayOffset = (post.dayOfWeek || (i + 1)) - 1;
      scheduledDate.setDate(weekStart.getDate() + dayOffset);
      scheduledDate.setHours(10, 0, 0, 0);

      const item = await createCalendarItem(brandId, {
        title: post.title,
        format: validateFormat(post.format),
        platform: validatePlatform(post.platform),
        scheduledDate: Timestamp.fromDate(scheduledDate),
        content: `${post.hook}\n\n${post.content}`,
        metadata: {
          generatedBy: 'ai',
          promptParams: {
            source: 'generate_week',
            pillar: post.pillar || '',
          },
        },
        order: i,
      });

      createdItems.push(item);
    }

    // 6. Debit 3 credits for batch generation
    if (userId) {
      try {
        await updateUserUsage(userId, -3);
        console.log(`[Calendar/GenerateWeek] 3 créditos decrementados para usuário: ${userId}`);
      } catch (creditError) {
        console.error('[Calendar/GenerateWeek] Erro ao atualizar créditos:', creditError);
      }
    }

    return createApiSuccess({ items: createdItems, count: createdItems.length });
  } catch (error) {
    console.error('[Calendar/GenerateWeek] POST error:', error);
    return createApiError(500, 'Failed to generate weekly content');
  }
}

function getNextMonday(): Date {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? 1 : 8 - day; // Next Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function validateFormat(f: string): 'post' | 'story' | 'carousel' | 'reel' {
  const valid = ['post', 'story', 'carousel', 'reel'];
  return valid.includes(f) ? f as any : 'post';
}

function validatePlatform(p: string): 'instagram' | 'linkedin' | 'x' | 'tiktok' {
  const valid = ['instagram', 'linkedin', 'x', 'tiktok'];
  return valid.includes(p) ? p as any : 'instagram';
}