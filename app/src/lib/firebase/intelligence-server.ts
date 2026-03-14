/**
 * intelligence-server.ts — Server-only intelligence operations using Firebase Admin SDK.
 * Use these functions inside Next.js API routes instead of client SDK equivalents.
 * Admin SDK bypasses security rules — authorized by service account credentials.
 */
import { getAdminFirestore } from './admin';
import type { KeywordIntelligence } from '@/types/intelligence';

// Pure formatting function — no SDK dependency, safe to reuse
function formatKeywordsForPrompt(keywords: KeywordIntelligence[]): string {
  if (keywords.length === 0) return '';

  const byIntent: Record<string, string[]> = {
    transactional: [],
    commercial: [],
    informational: [],
    navigational: [],
  };

  for (const kw of keywords) {
    const bucket = byIntent[kw.intent] || byIntent.informational;
    bucket.push(`${kw.term} (score: ${kw.metrics?.opportunityScore ?? '?'})`);
  }

  const sections: string[] = [];
  if (byIntent.transactional.length > 0) {
    sections.push(`**Compra (prontos para converter):** ${byIntent.transactional.join(', ')}`);
  }
  if (byIntent.commercial.length > 0) {
    sections.push(`**Comparação (avaliando opções):** ${byIntent.commercial.join(', ')}`);
  }
  if (byIntent.informational.length > 0) {
    sections.push(`**Informativa (pesquisando):** ${byIntent.informational.join(', ')}`);
  }
  if (byIntent.navigational.length > 0) {
    sections.push(`**Navegação (buscando marca/site):** ${byIntent.navigational.join(', ')}`);
  }

  return `## PALAVRAS-CHAVE ESTRATÉGICAS DA MARCA (Intelligence Miner)\n\nEstas são as buscas reais do Google que o público-alvo está fazendo. Use-as para criar copy mais relevante e alinhada com as dores e desejos reais.\n\n${sections.join('\n')}`;
}

/**
 * Busca keywords salvas na subcoleção brands/{brandId}/keywords via Admin SDK.
 */
async function getSavedBrandKeywordsAdmin(
  brandId: string,
  maxResults = 50
): Promise<KeywordIntelligence[]> {
  try {
    const db = getAdminFirestore();
    const snap = await db
      .collection('brands')
      .doc(brandId)
      .collection('keywords')
      .orderBy('savedAt', 'desc')
      .limit(maxResults)
      .get();

    return snap.docs.map(d => {
      const data = d.data();
      return {
        term: data.term,
        intent: data.intent as KeywordIntelligence['intent'],
        metrics: {
          volume: data.volume,
          difficulty: data.difficulty,
          opportunityScore: data.opportunityScore,
        },
        relatedTerms: [],
        suggestedBy: 'manual',
        suggestion: data.suggestion,
      } as KeywordIntelligence;
    });
  } catch {
    return [];
  }
}

/**
 * Busca keywords legadas da subcoleção brands/{brandId}/intelligence via Admin SDK.
 */
async function getLegacyBrandKeywordsAdmin(
  brandId: string,
  maxResults = 15
): Promise<KeywordIntelligence[]> {
  try {
    const db = getAdminFirestore();
    const snap = await db
      .collection('brands')
      .doc(brandId)
      .collection('intelligence')
      .where('type', 'in', ['keyword'])
      .orderBy('collectedAt', 'desc')
      .limit(maxResults)
      .get();

    return snap.docs
      .map(d => (d.data().content as any)?.keywordData as KeywordIntelligence | undefined)
      .filter((kw): kw is KeywordIntelligence => !!kw && !!kw.term)
      .sort((a, b) => (b.metrics?.opportunityScore ?? 0) - (a.metrics?.opportunityScore ?? 0));
  } catch {
    return [];
  }
}

/**
 * Combina keywords salvas + legadas, deduplica e formata para prompt.
 * Equivalente Admin SDK de getAllBrandKeywordsForPrompt (intelligence.ts).
 */
export async function getAllBrandKeywordsForPromptAdmin(
  brandId: string,
  maxResults = 15
): Promise<string> {
  const [saved, legacy] = await Promise.all([
    getSavedBrandKeywordsAdmin(brandId, maxResults),
    getLegacyBrandKeywordsAdmin(brandId, maxResults),
  ]);

  const seen = new Set<string>();
  const merged: KeywordIntelligence[] = [];

  for (const kw of saved) {
    const key = kw.term.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(kw);
    }
  }

  for (const kw of legacy) {
    const key = kw.term.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(kw);
    }
  }

  merged.sort((a, b) => (b.metrics?.opportunityScore ?? 0) - (a.metrics?.opportunityScore ?? 0));

  return formatKeywordsForPrompt(merged.slice(0, maxResults));
}
