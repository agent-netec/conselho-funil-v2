/**
 * Content Calendar — CRUD Helpers Firestore
 * Collection: brands/{brandId}/content_calendar
 *
 * @module lib/firebase/content-calendar
 * @story S33-CAL-01
 *
 * DT-04 (BLOCKING): Range query em campo unico + in-memory sort. ZERO composite index.
 * DT-05 (BLOCKING): Reorder via writeBatch() para atomicidade. ZERO updates sequenciais.
 */

import { Timestamp } from 'firebase-admin/firestore';
import { getAdminFirestore } from '@/lib/firebase/admin';
import type { CalendarItem, CalendarItemMetadata, ReorderUpdate } from '@/types/content';

/**
 * Cria um item no calendario editorial.
 * Path: brands/{brandId}/content_calendar/{auto-id}
 */
export async function createCalendarItem(
  brandId: string,
  data: {
    title: string;
    format: CalendarItem['format'];
    platform: CalendarItem['platform'];
    scheduledDate: Timestamp;
    content: string;
    metadata?: CalendarItemMetadata;
    order?: number;
    createdBy?: string;
  }
): Promise<CalendarItem> {
  const adminDb = getAdminFirestore();
  const colRef = adminDb.collection('brands').doc(brandId).collection('content_calendar');
  const now = Timestamp.now();

  const itemData = {
    title: data.title,
    format: data.format,
    platform: data.platform,
    scheduledDate: data.scheduledDate,
    status: 'draft' as const,
    content: data.content,
    metadata: data.metadata || { generatedBy: 'manual' as const },
    order: data.order ?? 0,
    brandId,
    ...(data.createdBy ? { createdBy: data.createdBy } : {}),
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await colRef.add(itemData);

  return { id: docRef.id, ...itemData } as CalendarItem;
}

/**
 * Busca items do calendario por range de datas.
 *
 * DT-04 (BLOCKING): Range query em campo UNICO (scheduledDate).
 * NAO usa orderBy() combinado com where() em campo diferente.
 * Sort in-memory por scheduledDate e order.
 *
 * Firestore: where('scheduledDate', '>=', start).where('scheduledDate', '<=', end)
 * NAO requer composite index (range em campo unico).
 */
export async function getCalendarItems(
  brandId: string,
  startDate: Timestamp,
  endDate: Timestamp
): Promise<CalendarItem[]> {
  const adminDb = getAdminFirestore();
  const colRef = adminDb.collection('brands').doc(brandId).collection('content_calendar');

  const snapshot = await colRef
    .where('scheduledDate', '>=', startDate)
    .where('scheduledDate', '<=', endDate)
    .get();

  const items = snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as CalendarItem[];

  // In-memory sort: scheduledDate ASC, order ASC (DT-04)
  return items.sort((a, b) => {
    const dateDiff = a.scheduledDate.seconds - b.scheduledDate.seconds;
    return dateDiff !== 0 ? dateDiff : a.order - b.order;
  });
}

/**
 * Atualiza um item do calendario.
 */
export async function updateCalendarItem(
  brandId: string,
  itemId: string,
  data: Partial<Omit<CalendarItem, 'id' | 'brandId' | 'createdAt'>>
): Promise<void> {
  const adminDb = getAdminFirestore();
  const docRef = adminDb.collection('brands').doc(brandId).collection('content_calendar').doc(itemId);
  await docRef.update({
    ...data,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Remove um item do calendario.
 */
export async function deleteCalendarItem(
  brandId: string,
  itemId: string
): Promise<void> {
  const adminDb = getAdminFirestore();
  const docRef = adminDb.collection('brands').doc(brandId).collection('content_calendar').doc(itemId);
  await docRef.delete();
}

/**
 * Reordena items do calendario via writeBatch (atomico).
 *
 * DT-05 (BLOCKING): DEVE usar writeBatch() para garantir atomicidade.
 * ZERO updates sequenciais (updateDoc em loop).
 * Se um erro parcial ocorrer com updates sequenciais, items ficam com
 * order duplicado — estado inconsistente.
 *
 * @param brandId - ID da marca
 * @param updates - Array de updates: { itemId, order, scheduledDate? }
 */
export async function reorderCalendarItems(
  brandId: string,
  updates: ReorderUpdate[]
): Promise<void> {
  const adminDb = getAdminFirestore();
  const batch = adminDb.batch();

  for (const { itemId, order, scheduledDate } of updates) {
    const ref = adminDb.collection('brands').doc(brandId).collection('content_calendar').doc(itemId);
    const updateData: Record<string, unknown> = {
      order,
      updatedAt: Timestamp.now(),
    };
    if (scheduledDate) {
      updateData.scheduledDate = scheduledDate;
    }
    batch.update(ref, updateData);
  }

  await batch.commit();
}
