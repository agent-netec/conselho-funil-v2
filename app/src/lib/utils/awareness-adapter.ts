/**
 * Adapter de compatibilidade para awareness stages.
 * Converte modelo legado PT (fria/morna/quente) para Schwartz canônico (inglês).
 * NÃO altera dados no Firestore (PA-01) — conversão somente em runtime.
 * Sprint Sigma: SIG-PRE-TYP
 */

export type LegacyAwareness = 'fria' | 'morna' | 'quente';
export type SchwartzAwareness = 'unaware' | 'problem' | 'solution' | 'product' | 'most_aware';

const LEGACY_TO_SCHWARTZ: Record<LegacyAwareness, SchwartzAwareness> = {
  'fria': 'unaware',
  'morna': 'solution',
  'quente': 'product',
};

/**
 * Normaliza awareness stage para modelo Schwartz canônico.
 * Se receber valor PT legado, converte. Se já for Schwartz, passa direto.
 */
export function normalizeAwareness(raw: string): SchwartzAwareness {
  if (raw in LEGACY_TO_SCHWARTZ) {
    return LEGACY_TO_SCHWARTZ[raw as LegacyAwareness];
  }
  return raw as SchwartzAwareness;
}
