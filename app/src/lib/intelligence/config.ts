/**
 * Módulo de configuração de intelligence
 * Re-export de db + constantes de coleção para attribution
 * Ativado na Sprint 27 (Hybrid: Backlog Cleanup + Attribution Revival)
 */
export { db } from '@/lib/firebase/config';

// Collection constants for attribution
export const COLLECTIONS = {
  ATTRIBUTION_BRIDGES: 'attribution_bridges',
  EVENTS: 'events',
  TRANSACTIONS: 'transactions',
  CROSS_CHANNEL_METRICS: 'cross_channel_metrics',
  PERFORMANCE_METRICS: 'performance_metrics',
} as const;

// Attribution always-on após estabilização na Sprint 27 (feature flag removida na S28-CL-05)
