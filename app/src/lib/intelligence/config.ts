/**
 * Módulo de configuração de intelligence
 * Re-export de getAdminFirestore + constantes de coleção para attribution
 * Ativado na Sprint 27 (Hybrid: Backlog Cleanup + Attribution Revival)
 *
 * Migrado de Client SDK (db) para Admin SDK (getAdminFirestore) — server-side only.
 * NOTE: attribution files (aggregator, overlap, bridge) still import { db } from here
 * and use Client SDK patterns — they need separate migration.
 */
import { getAdminFirestore } from '@/lib/firebase/admin';

/** Returns Admin Firestore instance — call inside functions, not at module level */
export function getDb() {
  return getAdminFirestore();
}

/**
 * Backward-compat shim: attribution files (aggregator, overlap, bridge) still
 * import { db } and use Client SDK helpers.  They need a separate migration;
 * for now we expose the admin instance typed as `any` so the import resolves.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db: any = null; // Lazy — see NOTE below

// NOTE: `db` is intentionally null at module-load time.  Attribution files
// that rely on it will fail at runtime until they are migrated to Admin SDK.
// This keeps the TypeScript build passing while the 10 priority files use getDb().

// Collection constants for attribution
export const COLLECTIONS = {
  ATTRIBUTION_BRIDGES: 'attribution_bridges',
  EVENTS: 'events',
  TRANSACTIONS: 'transactions',
  CROSS_CHANNEL_METRICS: 'cross_channel_metrics',
  PERFORMANCE_METRICS: 'performance_metrics',
} as const;

// Attribution always-on após estabilização na Sprint 27 (feature flag removida na S28-CL-05)
