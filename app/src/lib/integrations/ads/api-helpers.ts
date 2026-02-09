/**
 * @fileoverview Helpers compartilhados para chamadas a APIs de Ads (S30-FN-01, DT-13)
 * - fetchWithRetry(): retry com exponential backoff + Retry-After (PA-05)
 * - sanitizeForLog(): mascarar access_token e Bearer em URLs/headers (P-02, PA-06)
 * - sleep(): helper de delay
 */

import { RETRY_CONFIG } from './constants';

/**
 * Delay helper.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Mascara tokens sensíveis em URLs e headers para logging seguro.
 * P-02: NUNCA colocar access_token em logs.
 * PA-06: Usar sanitizeForLog() em toda URL logada.
 */
export function sanitizeForLog(input: string): string {
  return input
    .replace(/access_token=[^&\s]+/gi, 'access_token=***REDACTED***')
    .replace(/Bearer [^\s"]+/gi, 'Bearer ***REDACTED***')
    .replace(/token=[^&\s]+/gi, 'token=***REDACTED***');
}

/**
 * Fetch com retry, exponential backoff e timeout (PA-05).
 * Respeita header Retry-After em respostas 429.
 * Usa AbortSignal.timeout() para timeout obrigatório.
 *
 * @param url - URL da API externa
 * @param options - RequestInit padrão do fetch
 * @param config - Configuração de retry (opcional, usa RETRY_CONFIG como default)
 * @returns Response do fetch
 * @throws Error se todas as tentativas falharem
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit,
  config: {
    maxRetries?: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
    timeoutMs?: number;
    retryOn?: readonly number[];
  } = {}
): Promise<Response> {
  const {
    maxRetries = RETRY_CONFIG.MAX_RETRIES,
    baseDelayMs = RETRY_CONFIG.BASE_DELAY_MS,
    maxDelayMs = RETRY_CONFIG.MAX_DELAY_MS,
    timeoutMs = 10_000,
    retryOn = RETRY_CONFIG.RETRYABLE_STATUS_CODES,
  } = config;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(timeoutMs),
      });

      // Sucesso ou status não-retryable → retornar imediatamente
      if (response.ok || !retryOn.includes(response.status)) {
        return response;
      }

      // Rate limited (429) — respeitar Retry-After header
      if (response.status === 429) {
        const retryAfterHeader = response.headers.get('Retry-After');
        if (retryAfterHeader) {
          const retryAfterMs = parseInt(retryAfterHeader, 10) * 1000;
          if (retryAfterMs > 0 && retryAfterMs <= maxDelayMs) {
            console.log(`[fetchWithRetry] 429 — waiting ${retryAfterMs}ms (Retry-After) for ${sanitizeForLog(url)}`);
            await sleep(retryAfterMs);
            continue;
          }
        }
      }

      // Última tentativa — retornar o response com erro
      if (attempt === maxRetries) {
        return response;
      }

      console.log(`[fetchWithRetry] Status ${response.status} — retry ${attempt + 1}/${maxRetries} for ${sanitizeForLog(url)}`);

    } catch (error) {
      // Última tentativa — propagar o erro
      if (attempt === maxRetries) {
        throw error;
      }

      console.log(`[fetchWithRetry] Error — retry ${attempt + 1}/${maxRetries} for ${sanitizeForLog(url)}:`, 
        error instanceof Error ? error.message : 'Unknown error');
    }

    // Exponential backoff com jitter
    const jitter = 0.7 + Math.random() * 0.6; // 70% a 130%
    const delay = Math.min(baseDelayMs * Math.pow(2, attempt) * jitter, maxDelayMs);
    await sleep(delay);
  }

  // Unreachable — safety fallback
  throw new Error(`fetchWithRetry: all ${maxRetries} retries exhausted for ${sanitizeForLog(url)}`);
}
