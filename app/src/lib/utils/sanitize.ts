/**
 * R-1.6: Input sanitization utility for API routes.
 * Strips HTML tags and dangerous patterns to prevent XSS.
 * Lightweight — no external dependencies.
 */

const HTML_TAG_RE = /<\/?[^>]+(>|$)/g;
const SCRIPT_RE = /<script[\s\S]*?<\/script>/gi;
const EVENT_HANDLER_RE = /\s*on\w+\s*=\s*["'][^"']*["']/gi;
const JAVASCRIPT_URI_RE = /javascript\s*:/gi;
const DATA_URI_RE = /data\s*:\s*text\/html/gi;

/**
 * Sanitize a string by removing HTML tags and dangerous patterns.
 * Use for user input in API routes before storing or processing.
 */
export function sanitizeHtml(input: string): string {
  if (!input || typeof input !== 'string') return input;
  return input
    .replace(SCRIPT_RE, '')
    .replace(EVENT_HANDLER_RE, '')
    .replace(JAVASCRIPT_URI_RE, '')
    .replace(DATA_URI_RE, '')
    .replace(HTML_TAG_RE, '')
    .trim();
}

/**
 * Sanitize all string fields in an object (shallow).
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result = { ...obj };
  for (const key of Object.keys(result)) {
    if (typeof result[key] === 'string') {
      (result as Record<string, unknown>)[key] = sanitizeHtml(result[key] as string);
    }
  }
  return result;
}

/**
 * Escape HTML entities for safe rendering in responses.
 */
export function escapeHtml(input: string): string {
  if (!input || typeof input !== 'string') return input;
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}
