/**
 * Content Autopilot Types & Zod Schemas
 * @sprint S33
 * @story S33-CAL-01, S33-GEN-02
 */

import { z } from 'zod';
import { Timestamp } from 'firebase/firestore';

// === Enums & Literals ===

export type ContentFormat = 'post' | 'story' | 'carousel' | 'reel';
export type ContentPlatform = 'instagram' | 'linkedin' | 'x' | 'tiktok';
export type CalendarItemStatus =
  | 'draft'
  | 'pending_review'
  | 'approved'
  | 'scheduled'
  | 'published'
  | 'rejected';

// === Calendar Item ===

export interface CalendarItemMetadata {
  generatedBy?: 'ai' | 'manual';
  promptParams?: Record<string, string>;
  generationModel?: string;
  generatedAt?: Timestamp;
}

export interface CalendarItem {
  id: string;
  title: string;
  format: ContentFormat;
  platform: ContentPlatform;
  scheduledDate: Timestamp;      // NAO Date (P-06)
  status: CalendarItemStatus;
  content: string;               // Corpo do conteudo gerado/editado
  metadata: CalendarItemMetadata;
  order: number;                 // Posicao no dia (para reorder)
  brandId: string;               // Redundante com path mas necessario para queries
  createdBy?: string;            // userId — audit trail (Ajuste Athos DT-03)
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// === Content Generation Params & Results ===

export interface ContentGenerationParams {
  format: ContentFormat;
  platform: ContentPlatform;
  topic: string;
  tone?: string;
  keywords?: string[];
  targetAudience?: string;
  insertToCalendar?: boolean;
  scheduledDate?: string;        // ISO string — convertido para Timestamp internamente
}

export interface ContentGenerationResult {
  content: Record<string, unknown>;
  metadata: {
    format: ContentFormat;
    platform: ContentPlatform;
    model: string;
    generatedAt: string;
    brandId: string;
  };
  suggestions: string[];
  generated: boolean;
  error?: string;
}

// === Zod Output Schemas (Gemini JSON validation — DT-07) ===

export const PostOutputSchema = z.object({
  text: z.string().min(1).max(2200),
  hashtags: z.array(z.string()).min(3).max(15),
  cta: z.string(),
  visualSuggestion: z.string(),
});

export const StoryOutputSchema = z.object({
  text: z.string().min(1).max(150),
  backgroundSuggestion: z.string(),
  stickerSuggestions: z.array(z.string()).max(5),
  ctaSwipeUp: z.string().optional(),
});

export const CarouselOutputSchema = z.object({
  title: z.string().min(1),
  slides: z.array(z.object({
    title: z.string(),
    body: z.string(),
  })).min(3).max(10),
  ctaFinal: z.string(),
  coverSuggestion: z.string(),
});

export const ReelOutputSchema = z.object({
  hook: z.string(),
  scenes: z.array(z.object({
    timing: z.string(),
    script: z.string(),
    overlay: z.string().optional(),
  })).min(1),
  musicReference: z.string().optional(),
  ctaFinal: z.string(),
});

/** Mapa de schemas por formato — selecao dinamica */
export const CONTENT_SCHEMAS = {
  post: PostOutputSchema,
  story: StoryOutputSchema,
  carousel: CarouselOutputSchema,
  reel: ReelOutputSchema,
} as const;

// === Approval Types ===

export interface ApprovalHistoryEntry {
  fromStatus: CalendarItemStatus;
  toStatus: CalendarItemStatus;
  comment?: string;
  timestamp: Timestamp;
  userId?: string;
}

export type ApprovalAction = 'submit_review' | 'approve' | 'reject' | 'schedule';

// === Reorder Types ===

export interface ReorderUpdate {
  itemId: string;
  order: number;
  scheduledDate?: Timestamp;
}

// === Content Template Types ===

export interface ContentTemplate {
  id: string;
  title: string;
  format: ContentFormat;
  platform: ContentPlatform;
  content: string;
  pillar?: string;
  tags?: string[];
  metadata?: CalendarItemMetadata;
  brandId: string;
  createdBy?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// === Recurrence Types ===

export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly';

export interface RecurrenceRule {
  id: string;
  templateId: string;
  frequency: RecurrenceFrequency;
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  pillar?: string;
  active: boolean;
  brandId: string;
  lastCreatedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// === Content Pillar Types ===

export interface ContentPillar {
  id: string;
  name: string;
  description: string;
  color: string;
  dayOfWeek?: number; // preferred day
  brandId: string;
}
