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
 * Cria resposta de sucesso padronizada.
 * Shape: { success: true, data: T, meta?: object }
 *
 * RETROCOMPATIBILIDADE:
 * - Campo `success: true` adicionado para uniformidade
 * - Campo `data` contém o payload
 */
export function createApiSuccess<T>(
  data: T,
  options: ApiSuccessOptions = {}
): NextResponse {
  const { meta, status = 200 } = options;

  return NextResponse.json(
    {
      success: true as const,
      data,
      ...(meta && { meta }),
    },
    { status }
  );
}
