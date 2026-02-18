/**
 * Rate Limiter — HOF wrapper para rotas API
 * Usa Firestore transactions atomicas (DT-01 BLOCKING).
 * Firestore path: brands/{brandId}/rate_limits/{scope}
 *
 * @module lib/middleware/rate-limiter
 * @story S32-RL-01
 */

import { doc, runTransaction, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { createApiError } from '@/lib/utils/api-response';
import { NextRequest, NextResponse } from 'next/server';

export interface RateLimitConfig {
  maxRequests: number;   // Max requests na janela
  windowMs: number;      // Tamanho da janela em ms
  scope: string;         // Identificador unico (ex: 'chat', 'spy')
}

interface RateLimitDoc {
  count: number;
  windowStart: Timestamp;
}

/**
 * Extrai brandId do request (query param ou body).
 * Prioridade: query param > body.brandId
 * Defensivo: trata caso onde nextUrl nao esta disponivel (ex: mock requests).
 */
function extractBrandId(req: NextRequest, body?: Record<string, unknown>): string | null {
  try {
    const fromQuery = req.nextUrl?.searchParams?.get('brandId');
    if (fromQuery) return fromQuery;
  } catch {
    // nextUrl pode nao estar disponivel em ambientes de mock
  }
  if (body && typeof body.brandId === 'string') return body.brandId;
  return null;
}

/**
 * Higher-Order Function que aplica rate limiting a um handler de rota.
 *
 * Logica (dentro de runTransaction — DT-01):
 * 1. Read doc brands/{brandId}/rate_limits/{scope}
 * 2. Se doc nao existe OU window expirou → reset (count=1, windowStart=now)
 * 3. Se count >= maxRequests → reject 429
 * 4. Caso contrario → increment count
 *
 * @param handler - O handler original da rota
 * @param config - Configuracao de rate limiting
 */
export function withRateLimit(
  handler: (req: NextRequest, ...args: unknown[]) => Promise<NextResponse>,
  config: RateLimitConfig
) {
  return async (req: NextRequest, ...args: unknown[]): Promise<NextResponse> => {
    // Clone request para ler body sem consumir stream
    let body: Record<string, unknown> | undefined;
    try {
      const cloned = req.clone();
      body = await cloned.json();
    } catch {
      // Body nao e JSON ou vazio — ok, tentar query param
    }

    const brandId = extractBrandId(req, body);
    if (!brandId) {
      // Sem brandId, nao aplica rate limit (rota publica ou sem contexto)
      return handler(req, ...args);
    }

    const rateLimitRef = doc(db, 'brands', brandId, 'rate_limits', config.scope);
    const now = Timestamp.now();

    try {
      const allowed = await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(rateLimitRef);

        if (!snap.exists()) {
          // Primeiro request — criar doc
          transaction.set(rateLimitRef, {
            count: 1,
            windowStart: now,
          });
          return true;
        }

        const data = snap.data() as RateLimitDoc;
        const windowAge = now.toMillis() - data.windowStart.toMillis();

        if (windowAge >= config.windowMs) {
          // Window expirou — reset
          transaction.update(rateLimitRef, {
            count: 1,
            windowStart: now,
          });
          return true;
        }

        if (data.count >= config.maxRequests) {
          // Rate limit excedido
          return false;
        }

        // Dentro do limite — increment
        transaction.update(rateLimitRef, {
          count: data.count + 1,
        });
        return true;
      });

      if (!allowed) {
        const retryAfterSeconds = Math.ceil(config.windowMs / 1000);
        const errorResponse = createApiError(429, 'Rate limit exceeded', {
          code: 'RATE_LIMIT_EXCEEDED',
          details: {
            scope: config.scope,
            maxRequests: config.maxRequests,
            windowMs: config.windowMs,
          },
        });
        errorResponse.headers.set('Retry-After', String(retryAfterSeconds));
        return errorResponse;
      }

      return handler(req, ...args);
    } catch (error) {
      // R-1.3: Log failure but still allow request (fail-open with monitoring).
      // Fail-closed would block all requests if Firestore is temporarily unavailable.
      console.error(`[RateLimiter] Transaction failed for scope=${config.scope}, brandId=${brandId}:`, error);
      // TODO R-3.4: Send Slack alert for rate limiter failures
      return handler(req, ...args);
    }
  };
}
