/**
 * Converte qualquer formato de Timestamp para Date de forma segura.
 *
 * Suporta:
 * - Firebase Client SDK Timestamp (tem .toDate())
 * - Firebase Admin SDK Timestamp (tem .toDate() e ._seconds)
 * - JSON serializado do Admin SDK: { _seconds, _nanoseconds }
 * - JSON serializado normalizado: { seconds, nanoseconds }
 * - Date objects
 * - Number (epoch ms)
 * - ISO string
 *
 * @returns Date object ou fallback (default: new Date())
 */
export function toSafeDate(ts: unknown, fallback?: Date): Date {
  if (!ts) return fallback ?? new Date();

  // Already a Date
  if (ts instanceof Date) return ts;

  // Number (epoch ms)
  if (typeof ts === 'number') return new Date(ts);

  // String (ISO)
  if (typeof ts === 'string') {
    const d = new Date(ts);
    return isNaN(d.getTime()) ? (fallback ?? new Date()) : d;
  }

  const obj = ts as Record<string, unknown>;

  // Has .toDate() method (real Firestore Timestamp — Client or Admin SDK)
  if (typeof obj.toDate === 'function') {
    return (obj.toDate as () => Date)();
  }

  // Serialized Timestamp: { seconds } or { _seconds }
  const secs = (obj.seconds ?? obj._seconds) as number | undefined;
  if (typeof secs === 'number') {
    return new Date(secs * 1000);
  }

  return fallback ?? new Date();
}

/**
 * Extrai milissegundos de qualquer formato de Timestamp.
 * Retorna 0 se inválido.
 */
export function toSafeMs(ts: unknown): number {
  const d = toSafeDate(ts, new Date(0));
  return d.getTime();
}
