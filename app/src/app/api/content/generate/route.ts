/**
 * Content Generation API
 * POST: Gera conteudo editorial via Generation Engine + Brand Voice
 *
 * @route /api/content/generate
 * @story S33-GEN-03
 */

import { NextRequest } from 'next/server';
import { Timestamp } from 'firebase/firestore';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { handleSecurityError } from '@/lib/utils/api-security';
import { generateContent } from '@/lib/content/generation-engine';
import { createCalendarItem } from '@/lib/firebase/content-calendar';
import { DEFAULT_GEMINI_MODEL } from '@/lib/ai/gemini';
import type { ContentGenerationParams } from '@/types/content';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      brandId,
      format,
      platform,
      topic,
      tone,
      keywords,
      targetAudience,
      insertToCalendar,
      scheduledDate,
    } = body as ContentGenerationParams & { brandId: string };

    if (!brandId || !format || !platform || !topic) {
      return createApiError(400, 'Missing required fields: brandId, format, platform, topic');
    }

    try {
      await requireBrandAccess(req, brandId);
    } catch (error) {
      return handleSecurityError(error);
    }

    // Gerar conteudo
    const result = await generateContent(brandId, {
      format,
      platform,
      topic,
      tone,
      keywords,
      targetAudience,
    });

    // Se insertToCalendar e conteudo gerado com sucesso: criar item no calendario
    if (insertToCalendar && result.generated) {
      try {
        const calendarItem = await createCalendarItem(brandId, {
          title: topic,
          format,
          platform,
          scheduledDate: scheduledDate
            ? Timestamp.fromMillis(Number(scheduledDate))
            : Timestamp.now(),
          content: JSON.stringify(result.content),
          metadata: {
            generatedBy: 'ai',
            promptParams: { topic, tone: tone || '', platform },
            generationModel: DEFAULT_GEMINI_MODEL,
            generatedAt: Timestamp.now(),
          },
        });
        return createApiSuccess({ ...result, calendarItem });
      } catch (calendarError) {
        console.error('[ContentGenerate] Calendar insert failed:', calendarError);
        // Retorna conteudo mesmo se insert falha
        return createApiSuccess({ ...result, calendarInsertError: true });
      }
    }

    return createApiSuccess(result);
  } catch (error) {
    console.error('[ContentGenerate] POST error:', error);
    return createApiError(500, 'Failed to generate content');
  }
}
