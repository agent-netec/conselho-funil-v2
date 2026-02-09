/**
 * Engagement Scorer — Busca top interacoes de alta performance
 * Collection: brands/{brandId}/social_interactions
 *
 * @module lib/content/engagement-scorer
 * @story S34-GOV-02
 * @arch DT-02
 */

import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { SocialInteractionRecord } from '@/types/social';

/**
 * Busca as top-N interacoes com maior engagementScore para uma marca.
 *
 * DT-02: orderBy em campo unico (engagementScore) — index single-field automatico.
 * Docs sem engagementScore sao excluidos automaticamente pelo Firestore.
 * Se nenhuma interacao existir: retorna [] (graceful degradation).
 *
 * @param brandId - ID da marca
 * @param topN - Numero de exemplos a buscar (default: 5)
 * @returns Array de interacoes ordenadas por engagementScore desc
 */
export async function getTopEngagementExamples(
  brandId: string,
  topN: number = 5
): Promise<SocialInteractionRecord[]> {
  try {
    const colRef = collection(db, 'brands', brandId, 'social_interactions');
    const q = query(
      colRef,
      orderBy('engagementScore', 'desc'),
      limit(topN)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as SocialInteractionRecord[];
  } catch (error) {
    console.warn('[EngagementScorer] Failed to fetch examples:', error);
    return [];
  }
}

/**
 * Formata exemplos de alta performance para injecao no prompt de geracao.
 * Retorna string vazia se nao houver exemplos.
 */
export function formatEngagementContext(
  examples: SocialInteractionRecord[]
): string {
  if (!examples.length) return '';

  const formatted = examples
    .filter((e) => e.engagementScore && e.engagementScore > 0)
    .map((e) => `- "${e.content}" (engagement: ${(e.engagementScore! * 100).toFixed(0)}%, platform: ${e.platform})`)
    .join('\n');

  if (!formatted) return '';

  return `\n\n## High-Performance Content Examples from this Brand:\n${formatted}\n\nUse these successful examples as inspiration for tone, style, and engagement patterns.`;
}
