/**
 * Content Templates & Recurrence — Firestore CRUD Helpers
 * Collection: brands/{brandId}/content_templates
 * Collection: brands/{brandId}/recurrence_rules
 * Collection: brands/{brandId}/content_pillars
 *
 * Sprint M — M-4
 */

import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
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
  const colRef = collection(db, 'brands', brandId, 'content_templates');
  const now = Timestamp.now();

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

  const docRef = await addDoc(colRef, templateData);
  return { id: docRef.id, ...templateData } as ContentTemplate;
}

export async function getContentTemplates(brandId: string): Promise<ContentTemplate[]> {
  const colRef = collection(db, 'brands', brandId, 'content_templates');
  const snapshot = await getDocs(colRef);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as ContentTemplate[];
}

export async function deleteContentTemplate(brandId: string, templateId: string): Promise<void> {
  const docRef = doc(db, 'brands', brandId, 'content_templates', templateId);
  await deleteDoc(docRef);
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
  const colRef = collection(db, 'brands', brandId, 'recurrence_rules');
  const now = Timestamp.now();

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

  const docRef = await addDoc(colRef, ruleData);
  return { id: docRef.id, ...ruleData } as RecurrenceRule;
}

export async function getActiveRecurrenceRules(brandId: string): Promise<RecurrenceRule[]> {
  const colRef = collection(db, 'brands', brandId, 'recurrence_rules');
  const q = query(colRef, where('active', '==', true));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as RecurrenceRule[];
}

export async function updateRecurrenceRule(
  brandId: string,
  ruleId: string,
  data: Partial<Pick<RecurrenceRule, 'active' | 'frequency' | 'dayOfWeek' | 'dayOfMonth' | 'lastCreatedAt'>>
): Promise<void> {
  const docRef = doc(db, 'brands', brandId, 'recurrence_rules', ruleId);
  await updateDoc(docRef, { ...data, updatedAt: Timestamp.now() });
}

export async function deleteRecurrenceRule(brandId: string, ruleId: string): Promise<void> {
  const docRef = doc(db, 'brands', brandId, 'recurrence_rules', ruleId);
  await deleteDoc(docRef);
}

// ═══════════════════════════════════════════
// CONTENT PILLARS
// ═══════════════════════════════════════════

const DEFAULT_PILLAR_COLORS = ['#f43f5e', '#8b5cf6', '#f59e0b', '#10b981', '#3b82f6'];

export async function saveContentPillars(
  brandId: string,
  pillars: { name: string; description: string; dayOfWeek?: number }[]
): Promise<ContentPillar[]> {
  const colRef = collection(db, 'brands', brandId, 'content_pillars');

  // Delete existing pillars first (replace strategy)
  const existing = await getDocs(colRef);
  for (const d of existing.docs) {
    await deleteDoc(d.ref);
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
    const ref = await addDoc(colRef, data);
    created.push({ id: ref.id, ...data });
  }

  return created;
}

export async function getContentPillars(brandId: string): Promise<ContentPillar[]> {
  const colRef = collection(db, 'brands', brandId, 'content_pillars');
  const snapshot = await getDocs(colRef);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as ContentPillar[];
}
