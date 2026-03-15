/**
 * Content Templates & Recurrence — Firestore Admin SDK CRUD Helpers
 * Collection: brands/{brandId}/content_templates
 * Collection: brands/{brandId}/recurrence_rules
 * Collection: brands/{brandId}/content_pillars
 *
 * Sprint M — M-4
 */

import { Timestamp as AdminTimestamp } from 'firebase-admin/firestore';
import { getAdminFirestore } from '@/lib/firebase/admin';
import type { ContentTemplate, RecurrenceRule, ContentPillar } from '@/types/content';

// ═══════════════════════════════════════════
// CONTENT TEMPLATES
// ═══════════════════════════════════════════

export async function createContentTemplate(
  brandId: string,
  data: {
    title: string;
    format: ContentTemplate['format'];
    platform: ContentTemplate['platform'];
    content: string;
    pillar?: string;
    tags?: string[];
    createdBy?: string;
  }
): Promise<ContentTemplate> {
  const adminDb = getAdminFirestore();
  const colRef = adminDb.collection('brands').doc(brandId).collection('content_templates');
  const now = AdminTimestamp.now() as any;

  const templateData = {
    title: data.title,
    format: data.format,
    platform: data.platform,
    content: data.content,
    pillar: data.pillar || '',
    tags: data.tags || [],
    brandId,
    createdBy: data.createdBy,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await colRef.add(templateData);
  return { id: docRef.id, ...templateData } as ContentTemplate;
}

export async function getContentTemplates(brandId: string): Promise<ContentTemplate[]> {
  const adminDb = getAdminFirestore();
  const colRef = adminDb.collection('brands').doc(brandId).collection('content_templates');
  const snapshot = await colRef.get();
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as ContentTemplate[];
}

export async function deleteContentTemplate(brandId: string, templateId: string): Promise<void> {
  const adminDb = getAdminFirestore();
  const docRef = adminDb.collection('brands').doc(brandId).collection('content_templates').doc(templateId);
  await docRef.delete();
}

// ═══════════════════════════════════════════
// RECURRENCE RULES
// ═══════════════════════════════════════════

export async function createRecurrenceRule(
  brandId: string,
  data: {
    templateId: string;
    frequency: RecurrenceRule['frequency'];
    dayOfWeek?: number;
    dayOfMonth?: number;
    pillar?: string;
  }
): Promise<RecurrenceRule> {
  const adminDb = getAdminFirestore();
  const colRef = adminDb.collection('brands').doc(brandId).collection('recurrence_rules');
  const now = AdminTimestamp.now() as any;

  const ruleData = {
    templateId: data.templateId,
    frequency: data.frequency,
    dayOfWeek: data.dayOfWeek,
    dayOfMonth: data.dayOfMonth,
    pillar: data.pillar || '',
    active: true,
    brandId,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await colRef.add(ruleData);
  return { id: docRef.id, ...ruleData } as RecurrenceRule;
}

export async function getActiveRecurrenceRules(brandId: string): Promise<RecurrenceRule[]> {
  const adminDb = getAdminFirestore();
  const colRef = adminDb.collection('brands').doc(brandId).collection('recurrence_rules');
  const snapshot = await colRef.where('active', '==', true).get();
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as RecurrenceRule[];
}

export async function updateRecurrenceRule(
  brandId: string,
  ruleId: string,
  data: Partial<Pick<RecurrenceRule, 'active' | 'frequency' | 'dayOfWeek' | 'dayOfMonth' | 'lastCreatedAt'>>
): Promise<void> {
  const adminDb = getAdminFirestore();
  const docRef = adminDb.collection('brands').doc(brandId).collection('recurrence_rules').doc(ruleId);
  await docRef.update({ ...data, updatedAt: AdminTimestamp.now() as any });
}

export async function deleteRecurrenceRule(brandId: string, ruleId: string): Promise<void> {
  const adminDb = getAdminFirestore();
  const docRef = adminDb.collection('brands').doc(brandId).collection('recurrence_rules').doc(ruleId);
  await docRef.delete();
}

// ═══════════════════════════════════════════
// CONTENT PILLARS
// ═══════════════════════════════════════════

const DEFAULT_PILLAR_COLORS = ['#f43f5e', '#8b5cf6', '#f59e0b', '#E6B447', '#3b82f6'];

export async function saveContentPillars(
  brandId: string,
  pillars: { name: string; description: string; dayOfWeek?: number }[]
): Promise<ContentPillar[]> {
  const adminDb = getAdminFirestore();
  const colRef = adminDb.collection('brands').doc(brandId).collection('content_pillars');

  // Delete existing pillars first (replace strategy)
  const existing = await colRef.get();
  for (const d of existing.docs) {
    await d.ref.delete();
  }

  const created: ContentPillar[] = [];
  for (let i = 0; i < pillars.length; i++) {
    const p = pillars[i];
    const data = {
      name: p.name,
      description: p.description,
      color: DEFAULT_PILLAR_COLORS[i % DEFAULT_PILLAR_COLORS.length],
      dayOfWeek: p.dayOfWeek,
      brandId,
    };
    const ref = await colRef.add(data);
    created.push({ id: ref.id, ...data });
  }

  return created;
}

export async function getContentPillars(brandId: string): Promise<ContentPillar[]> {
  const adminDb = getAdminFirestore();
  const colRef = adminDb.collection('brands').doc(brandId).collection('content_pillars');
  const snapshot = await colRef.get();
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as ContentPillar[];
}
