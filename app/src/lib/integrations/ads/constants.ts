/**
 * @fileoverview Constantes de API para integrações Ads (S30-FN-01)
 * Meta Graph API v21.0 + Google Ads API v18 + Retry Config
 */

export const META_API = {
  BASE_URL: 'https://graph.facebook.com/v21.0',
  RATE_LIMIT: 200,           // calls per hour per ad account
  TIMEOUT_MS: 10_000,        // 10s
  TOKEN_REFRESH_BUFFER: 24 * 60 * 60 * 1000,  // 24h antes de expirar
} as const;

export const GOOGLE_ADS_API = {
  BASE_URL: 'https://googleads.googleapis.com/v18',
  TOKEN_URL: 'https://oauth2.googleapis.com/token',
  RATE_LIMIT: 15_000,        // operations per day per developer token
  TIMEOUT_MS: 15_000,        // 15s
  TOKEN_REFRESH_BUFFER: 15 * 60 * 1000,  // 15min antes de expirar
} as const;

export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  BASE_DELAY_MS: 1_000,
  MAX_DELAY_MS: 30_000,
  JITTER_FACTOR: 0.3,
  RETRYABLE_STATUS_CODES: [429, 500, 502, 503] as readonly number[],
} as const;

/** Cache TTL para performance metrics (DT-12) */
export const CACHE_TTL_MS = 15 * 60 * 1000;  // 15 minutos
