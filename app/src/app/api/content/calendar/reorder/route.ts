/**
 * Content Calendar Reorder API
 * POST: Reorder items via writeBatch (atomico — DT-05 BLOCKING)
 *
 * @route /api/content/calendar/reorder
 * @story S33-CAL-02
 */

import { NextRequest } from 'next/server';
import { Timestamp } from 'firebase/firestore';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { reorderCalendarItems } from '@/lib/firebase/content-calendar';
import type { ReorderUpdate } from '@/types/content';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { brandId, updates } = body as {
      brandId: string;
      updates: Array<{ itemId: string; order: number; scheduledDate?: number }>;
    };

    if (!brandId || !updates || !Array.isArray(updates) || updates.length === 0) {
      return createApiError(400, 'Missing required fields: brandId, updates[]');
    }

    await requireBrandAccess(req, brandId);

    // Converter scheduledDate de ms para Timestamp se presente
    const typedUpdates: ReorderUpdate[] = updates.map((u) => ({
      itemId: u.itemId,
      order: u.order,
      scheduledDate: u.scheduledDate
        ? Timestamp.fromMillis(u.scheduledDate)
        : undefined,
    }));

    await reorderCalendarItems(brandId, typedUpdates);

    return createApiSuccess({ reordered: true, count: updates.length });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('[ContentCalendar] Reorder error:', error);
    return createApiError(500, 'Failed to reorder calendar items');
  }
}
