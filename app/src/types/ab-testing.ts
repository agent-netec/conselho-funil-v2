/**
 * A/B Testing & Segment Optimization Types
 * Collection: brands/{brandId}/ab_tests
 * Subcollection logs: brands/{brandId}/ab_tests/{testId}/optimization_log
 *
 * @sprint S34
 * @story S34-AB-01
 * @arch DT-03 (subcollection), DT-09 (threshold override)
 */

import { z } from 'zod';
import { Timestamp } from 'firebase/firestore';

// === Enums & Literals ===

export type ABTestStatus = 'draft' | 'running' | 'paused' | 'completed';
export type TargetSegment = 'hot' | 'warm' | 'cold' | 'all';
export type ABEventType = 'impression' | 'click' | 'conversion';
export type OptimizationAction = 'pause_variant' | 'declare_winner' | 'early_stop' | 'continue';

// === ABTestVariant (embedded array no ABTest) ===

export interface ABTestVariant {
  id: string;
  name: string;
  contentVariations: {
    headline: string;
    cta?: string;
    offerId?: string;
    vslId?: string;
    body?: string;
  };
  weight: number; // porcentagem do trafego (default 1/N)
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
}

// === ABTest (documento principal) ===

export interface ABTest {
  id: string;
  name: string;
  brandId: string;
  targetSegment: TargetSegment;
  variants: ABTestVariant[];
  status: ABTestStatus;
  metrics: {
    totalImpressions: number;
    totalConversions: number;
    totalRevenue: number;
  };
  winnerVariantId: string | null;
  significanceLevel: number | null;
  autoOptimize: boolean;
  startDate: Timestamp | null;
  endDate: Timestamp | null;
  minImpressionsForDecision?: number;
  significanceThreshold?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// === OptimizationDecision (subcollection optimization_log — DT-10) ===

export interface OptimizationDecision {
  id?: string;
  testId: string;
  variantId: string;
  action: OptimizationAction;
  reason: string;
  metrics: {
    impressions: number;
    conversions: number;
    cr: number;
    significance?: number;
  };
  executed: boolean; // false se Kill-Switch ativo (PB-04)
  timestamp: Timestamp;
}

// === Significance Result ===

export interface SignificanceResult {
  zScore: number;
  pValue: number;
  significance: number;
  isSignificant: boolean;
}

// === Segment Performance Types ===

export interface SegmentMetrics {
  segment: TargetSegment;
  totalLeads: number;
  conversions: number;
  totalRevenue: number;
  avgRevenue: number;
  conversionRate: number; // conversions/totalLeads * 100
}

export interface SegmentBreakdownData {
  hot: SegmentMetrics;
  warm: SegmentMetrics;
  cold: SegmentMetrics;
}

// === Zod Validation Schemas ===

export const CreateABTestSchema = z.object({
  name: z.string().min(1).max(200),
  brandId: z.string().min(1),
  targetSegment: z.enum(['hot', 'warm', 'cold', 'all']),
  variants: z.array(z.object({
    name: z.string().min(1),
    contentVariations: z.object({
      headline: z.string().min(1),
      cta: z.string().optional(),
      offerId: z.string().optional(),
      vslId: z.string().optional(),
      body: z.string().optional(),
    }),
  })).min(2).max(5),
  autoOptimize: z.boolean().optional().default(false),
});

export const RecordEventSchema = z.object({
  brandId: z.string().min(1),
  variantId: z.string().min(1),
  eventType: z.enum(['impression', 'click', 'conversion']),
  value: z.number().optional(),
});

export const AssignVariantSchema = z.object({
  brandId: z.string().min(1),
  leadId: z.string().min(1),
});

export const UpdateABTestSchema = z.object({
  brandId: z.string().min(1),
  action: z.enum(['start', 'pause', 'complete']).optional(),
  status: z.enum(['draft', 'running', 'paused', 'completed']).optional(),
  winnerVariantId: z.string().nullable().optional(),
  significanceLevel: z.number().nullable().optional(),
  autoOptimize: z.boolean().optional(),
});

export const OptimizeRequestSchema = z.object({
  brandId: z.string().min(1),
});
