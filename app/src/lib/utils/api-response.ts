/**
 * Utilitários de resposta API padronizada.
 * Sprint Sigma: SIG-API-01 (DT-09)
 *
 * Unifica os 5 formatos existentes em 2 helpers:
 * - createApiError(): { error: string, code?, details?, requestId }
 * - createApiSuccess(): { success: true, data: T, meta? }
 *
 * PA-04: Campo `error` SEMPRE presente em respostas de erro.
 */

import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

// ============================================
// ERROR RESPONSE
// ============================================

interface ApiErrorOptions {
  code?: string;
  details?: unknown;
  requestId?: string;
}

/**
 * Cria resposta de erro padronizada.
 * Shape: { error: string, code?: string, details?: unknown, requestId: string }
 *
 * RETROCOMPATIBILIDADE:
 * - Campo `error` (string) SEMPRE presente (PA-04)
 * - requestId gerado automaticamente se não fornecido
 */
export function createApiError(
  status: number,
  message: string,
  options: ApiErrorOptions = {}
): NextResponse {
  const { code, details, requestId } = options;

  return NextResponse.json(
    {
      error: message,
      ...(code && { code }),
      ...(details !== undefined && { details }),
      requestId: requestId || randomUUID(),
    },
    { status }
  );
}

// ============================================
// SUCCESS RESPONSE
// ============================================

interface ApiSuccessOptions {
  meta?: Record<string, unknown>;
  status?: number;
}

/**
 * Serializa Timestamps do Admin SDK recursivamente.
 * Admin SDK: { _seconds, _nanoseconds } → Frontend-safe: { seconds, nanoseconds }
 * Também converte Date objects para { seconds, nanoseconds }.
 */
function serializeTimestamps(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;

  // Admin SDK Timestamp: has _seconds property
  const record = obj as Record<string, unknown>;
  if ('_seconds' in record && '_nanoseconds' in record) {
    return { seconds: record._seconds, nanoseconds: record._nanoseconds };
  }

  // Date object
  if (obj instanceof Date) {
    return { seconds: Math.floor(obj.getTime() / 1000), nanoseconds: 0 };
  }

  // Array
  if (Array.isArray(obj)) {
    return obj.map(serializeTimestamps);
  }

  // Plain object — recurse
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    result[key] = serializeTimestamps(value);
  }
  return result;
}

/**
 * Cria resposta de sucesso padronizada.
 * Shape: { success: true, data: T, meta?: object }
 *
 * Serializa automaticamente Timestamps do Admin SDK para formato
 * compatível com o frontend ({ seconds, nanoseconds }).
 */
export function createApiSuccess<T>(
  data: T,
  options: ApiSuccessOptions = {}
): NextResponse {
  const { meta, status = 200 } = options;

  return NextResponse.json(
    {
      success: true as const,
      data: serializeTimestamps(data) as T,
      ...(meta && { meta }),
    },
    { status }
  );
}
