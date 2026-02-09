/**
 * Adapter layer: PerformanceMetric (modern) ↔ PerformanceMetricDoc (legacy)
 * Sprint 28 — S28-CL-03 (DT-04)
 *
 * Pure function adapter — camada intermediária de read-time, sem side effects.
 * Detecta formato legacy vs modern e normaliza para PerformanceMetricDoc.
 *
 * REGRAS:
 * - NUNCA altera interfaces PerformanceMetric ou PerformanceMetricDoc (P2)
 * - NUNCA altera lógica de negócio do aggregator (P1)
 * - Sem side effects, sem state
 */

import { Timestamp } from 'firebase/firestore';
import {
  PerformanceMetricDoc,
  AdPlatform,
  AdEntityLevel,
  UnifiedAdsMetrics,
} from '../../../../types/performance';

/**
 * Mapeia o campo `source` (formato modern PerformanceMetric) para `platform` (formato legacy PerformanceMetricDoc).
 * O formato modern não inclui 'tiktok' no source union, mas AdPlatform sim.
 */
export function mapSourceToPlatform(source: string): AdPlatform {
  const mapping: Record<string, AdPlatform> = {
    meta: 'meta',
    google: 'google',
    organic: 'organic',
    aggregated: 'aggregated',
    tiktok: 'tiktok',
  };
  return mapping[source] ?? 'aggregated';
}

/**
 * Adapta um documento raw do Firestore para PerformanceMetricDoc.
 * Detecta automaticamente se o documento está no formato legacy (platform/metrics)
 * ou modern (source/data) e normaliza para o formato esperado pelo aggregator.
 *
 * @param raw - Documento raw do Firestore (d.data())
 * @returns PerformanceMetricDoc normalizado
 * @throws Error se o formato não for reconhecido
 */
export function adaptToPerformanceMetricDoc(
  raw: Record<string, unknown>
): PerformanceMetricDoc {
  const isLegacy = 'platform' in raw && 'metrics' in raw;
  const isModern = 'source' in raw && 'data' in raw;

  if (isLegacy) {
    return raw as PerformanceMetricDoc;
  }

  if (isModern) {
    const data = raw.data as UnifiedAdsMetrics;
    return {
      id: (raw.id as string) ?? '',
      brandId: (raw.brandId as string) ?? '',
      platform: mapSourceToPlatform(raw.source as string),
      name: '',
      level: 'campaign' as AdEntityLevel,
      externalId: '',
      metrics: {
        ...data,
        clicks: 0,
        impressions: 0,
      },
      timestamp: raw.timestamp as Timestamp,
    };
  }

  throw new Error(
    `Unknown metric format: keys=[${Object.keys(raw).join(',')}]`
  );
}
