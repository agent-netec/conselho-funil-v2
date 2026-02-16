/**
 * DataForSEO Client — Sprint N-2
 * Provides real search volume and keyword difficulty data.
 * Falls back to Gemini estimation if DataForSEO is not configured.
 *
 * Env vars: DATAFORSEO_LOGIN + DATAFORSEO_PASSWORD
 * Cost: ~$12/month for 200 users
 */

import { collection, doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export interface DataForSEOKeywordData {
  keyword: string;
  search_volume: number;
  keyword_difficulty: number;
  cpc: number;
  competition: number;
  competition_level: 'LOW' | 'MEDIUM' | 'HIGH';
}

interface DataForSEOResponse {
  tasks: Array<{
    result: Array<{
      items: DataForSEOKeywordData[];
    }>;
    status_code: number;
    status_message: string;
  }>;
}

const DATAFORSEO_API_URL = 'https://api.dataforseo.com/v3';

function getCredentials(): { login: string; password: string } | null {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;
  if (!login || !password) return null;
  return { login, password };
}

function getAuthHeader(creds: { login: string; password: string }): string {
  const encoded = Buffer.from(`${creds.login}:${creds.password}`).toString('base64');
  return `Basic ${encoded}`;
}

/**
 * Check if DataForSEO is configured
 */
export function isDataForSEOConfigured(): boolean {
  return getCredentials() !== null;
}

/**
 * Fetch real search volume and difficulty from DataForSEO.
 * Uses Keywords Data → Search Volume endpoint.
 */
export async function getKeywordMetrics(
  keywords: string[],
  language_code = 'pt',
  location_code = 2076 // Brazil
): Promise<Map<string, DataForSEOKeywordData>> {
  const creds = getCredentials();
  if (!creds) {
    throw new Error('DataForSEO not configured. Set DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD.');
  }

  const result = new Map<string, DataForSEOKeywordData>();

  // DataForSEO accepts up to 700 keywords per request
  const batchSize = 100;
  for (let i = 0; i < keywords.length; i += batchSize) {
    const batch = keywords.slice(i, i + batchSize);

    const response = await fetch(`${DATAFORSEO_API_URL}/keywords_data/google_ads/search_volume/live`, {
      method: 'POST',
      headers: {
        'Authorization': getAuthHeader(creds),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([{
        keywords: batch,
        language_code,
        location_code,
      }]),
    });

    if (!response.ok) {
      console.error(`[DataForSEO] API error: ${response.status} ${response.statusText}`);
      continue;
    }

    const data: DataForSEOResponse = await response.json();

    for (const task of data.tasks) {
      if (task.status_code !== 20000) {
        console.warn(`[DataForSEO] Task error: ${task.status_message}`);
        continue;
      }
      for (const resultItem of task.result || []) {
        for (const item of resultItem.items || []) {
          result.set(item.keyword.toLowerCase(), item);
        }
      }
    }
  }

  return result;
}

// ============================================
// CACHE (Firestore: brands/{id}/seo_cache)
// ============================================

interface CachedKeywordData {
  data: DataForSEOKeywordData;
  cachedAt: Timestamp;
}

/**
 * Get cached keyword data. Cache TTL: 30 days (volume changes monthly).
 */
export async function getCachedKeywordData(
  brandId: string,
  keyword: string
): Promise<DataForSEOKeywordData | null> {
  try {
    const cacheRef = doc(db, 'brands', brandId, 'seo_cache', keyword.toLowerCase().replace(/\s+/g, '_'));
    const snap = await getDoc(cacheRef);
    if (!snap.exists()) return null;

    const cached = snap.data() as CachedKeywordData;
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    if (cached.cachedAt.toMillis() < thirtyDaysAgo) return null; // Expired

    return cached.data;
  } catch {
    return null;
  }
}

/**
 * Cache keyword data in Firestore.
 */
export async function cacheKeywordData(
  brandId: string,
  keyword: string,
  data: DataForSEOKeywordData
): Promise<void> {
  try {
    const cacheRef = doc(db, 'brands', brandId, 'seo_cache', keyword.toLowerCase().replace(/\s+/g, '_'));
    await setDoc(cacheRef, {
      data,
      cachedAt: Timestamp.now(),
    });
  } catch (error) {
    console.warn('[DataForSEO] Cache write failed:', error);
  }
}

/**
 * Get metrics with cache-first strategy.
 * 1. Check Firestore cache
 * 2. If miss, fetch from DataForSEO API
 * 3. Cache results
 */
export async function getKeywordMetricsCached(
  brandId: string,
  keywords: string[]
): Promise<Map<string, DataForSEOKeywordData>> {
  const result = new Map<string, DataForSEOKeywordData>();
  const uncached: string[] = [];

  // 1. Check cache
  for (const kw of keywords) {
    const cached = await getCachedKeywordData(brandId, kw);
    if (cached) {
      result.set(kw.toLowerCase(), cached);
    } else {
      uncached.push(kw);
    }
  }

  // 2. Fetch uncached from API
  if (uncached.length > 0 && isDataForSEOConfigured()) {
    try {
      const apiResults = await getKeywordMetrics(uncached);
      for (const [key, data] of apiResults) {
        result.set(key, data);
        // 3. Cache
        cacheKeywordData(brandId, key, data).catch(() => {});
      }
    } catch (error) {
      console.warn('[DataForSEO] API fetch failed, using Gemini fallback:', error);
    }
  }

  return result;
}

/**
 * Normalize DataForSEO volume to 1-100 scale for compatibility with existing UI.
 */
export function normalizeVolume(searchVolume: number): number {
  if (searchVolume <= 0) return 1;
  if (searchVolume >= 100000) return 100;
  // Log scale normalization
  return Math.min(100, Math.max(1, Math.round(Math.log10(searchVolume) * 20)));
}

/**
 * Normalize DataForSEO difficulty (already 0-100).
 */
export function normalizeDifficulty(difficulty: number): number {
  return Math.min(100, Math.max(1, Math.round(difficulty)));
}
