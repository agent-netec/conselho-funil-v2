/**
 * Content Calendar API — CRUD
 * GET: Listar items por range de datas
 * POST: Criar item
 * PUT: Atualizar item
 * DELETE: Remover item
 *
 * @route /api/content/calendar
 * @story S33-CAL-02
 */

import { NextRequest } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { handleSecurityError } from '@/lib/utils/api-security';
import {
  createCalendarItem,
  getCalendarItems,
  updateCalendarItem,
  deleteCalendarItem,
} from '@/lib/firebase/content-calendar';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const brandId = req.nextUrl.searchParams.get('brandId');
    const start = req.nextUrl.searchParams.get('start');
    const end = req.nextUrl.searchParams.get('end');

    if (!brandId || !start || !end) {
      return createApiError(400, 'Missing required params: brandId, start, end');
    }

    try {
      await requireBrandAccess(req, brandId);
    } catch (error) {
      return handleSecurityError(error);
    }

    const startDate = Timestamp.fromMillis(Number(start));
    const endDate = Timestamp.fromMillis(Number(end));
    console.log(`[ContentCalendar] GET brandId=${brandId} range=${new Date(Number(start)).toISOString()} to ${new Date(Number(end)).toISOString()}`);
    const items = await getCalendarItems(brandId, startDate, endDate);
    console.log(`[ContentCalendar] GET found ${items.length} items`);

    // Serialize Timestamps to { seconds, nanoseconds } for frontend compatibility
    // Admin SDK Timestamps serialize as { _seconds, _nanoseconds } which breaks client code
    const serialized = items.map(item => ({
      ...item,
      scheduledDate: { seconds: (item.scheduledDate as any)._seconds ?? (item.scheduledDate as any).seconds, nanoseconds: 0 },
      createdAt: item.createdAt ? { seconds: (item.createdAt as any)._seconds ?? (item.createdAt as any).seconds, nanoseconds: 0 } : null,
      updatedAt: item.updatedAt ? { seconds: (item.updatedAt as any)._seconds ?? (item.updatedAt as any).seconds, nanoseconds: 0 } : null,
    }));

    return createApiSuccess({ items: serialized });
  } catch (error: any) {
    console.error('[ContentCalendar] GET error:', error?.message, error?.code, error?.stack?.split('\n').slice(0, 3).join(' > '));
    return createApiError(500, 'Failed to fetch calendar items', {
      details: error?.message || String(error),
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { brandId, title, format, platform, scheduledDate, content, metadata } = body;

    if (!brandId || !title || !format || !platform || !scheduledDate) {
      return createApiError(400, 'Missing required fields: brandId, title, format, platform, scheduledDate');
    }

    try {
      await requireBrandAccess(req, brandId);
    } catch (error) {
      return handleSecurityError(error);
    }

    const item = await createCalendarItem(brandId, {
      title,
      format,
      platform,
      scheduledDate: Timestamp.fromMillis(Number(scheduledDate)) as any,
      content: content || '',
      metadata: metadata || { generatedBy: 'manual' },
    });

    return createApiSuccess({ item });
  } catch (error) {
    console.error('[ContentCalendar] POST error:', error);
    return createApiError(500, 'Failed to create calendar item');
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { brandId, itemId, ...fields } = body;

    if (!brandId || !itemId) {
      return createApiError(400, 'Missing required fields: brandId, itemId');
    }

    try {
      await requireBrandAccess(req, brandId);
    } catch (error) {
      return handleSecurityError(error);
    }

    // Converter scheduledDate se presente
    if (fields.scheduledDate && typeof fields.scheduledDate === 'number') {
      fields.scheduledDate = Timestamp.fromMillis(fields.scheduledDate) as any;
    }

    await updateCalendarItem(brandId, itemId, fields);

    return createApiSuccess({ updated: true, itemId });
  } catch (error) {
    console.error('[ContentCalendar] PUT error:', error);
    return createApiError(500, 'Failed to update calendar item');
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { brandId, itemId } = body;

    if (!brandId || !itemId) {
      return createApiError(400, 'Missing required fields: brandId, itemId');
    }

    try {
      await requireBrandAccess(req, brandId);
    } catch (error) {
      return handleSecurityError(error);
    }

    await deleteCalendarItem(brandId, itemId);

    return createApiSuccess({ deleted: true, itemId });
  } catch (error) {
    console.error('[ContentCalendar] DELETE error:', error);
    return createApiError(500, 'Failed to delete calendar item');
  }
}
