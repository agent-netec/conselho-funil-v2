export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * GET /api/cron/scout-collect
 * Vercel Cron: collects intelligence from Google News + Reddit for all brands
 * with saved keywords. Analyzes sentiment + emotion via Gemini. Deduplicates.
 * Runs 1x/day at 07:00 UTC.
 *
 * Gap 3 — Intelligence Overview: Dados Reais
 */

import { NextRequest } from 'next/server';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { Timestamp } from 'firebase-admin/firestore';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { ScoutAgent } from '@/lib/agents/scout/scout-agent';
import { generateWithGemini } from '@/lib/ai/gemini';
import type { CreateIntelligenceInput } from '@/types/intelligence';

const MAX_KEYWORDS_PER_BRAND = 5;
const MAX_ITEMS_PER_KEYWORD = 10;
const SENTIMENT_BATCH_SIZE = 10;

interface AnalysisResult {
  sentiment: 'positive' | 'negative' | 'neutral';
  sentimentScore: number;
  emotion: string; // alegria, raiva, tristeza, surpresa, medo, neutro
  keywords: string[];
  relevanceScore: number;
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    const cronSecret = (process.env.CRON_SECRET || '').trim();

    if (!cronSecret || cronSecret.length < 8) {
      return createApiError(500, 'Internal error');
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return createApiError(401, 'Unauthorized');
    }

    const startTime = Date.now();
    const adminDb = getAdminFirestore();
    const scout = new ScoutAgent();

    // 1. Get all brands that have keywords
    const brandsSnap = await adminDb.collectionGroup('keywords')
      .select('term')
      .limit(500)
      .get();

    // Group keywords by brandId
    const brandKeywords = new Map<string, string[]>();
    for (const doc of brandsSnap.docs) {
      // Path: brands/{brandId}/keywords/{keywordId}
      const pathSegments = doc.ref.path.split('/');
      const brandId = pathSegments[1];
      const term = doc.data().term as string;
      if (!brandId || !term) continue;

      if (!brandKeywords.has(brandId)) {
        brandKeywords.set(brandId, []);
      }
      const terms = brandKeywords.get(brandId)!;
      if (terms.length < MAX_KEYWORDS_PER_BRAND) {
        terms.push(term);
      }
    }

    if (brandKeywords.size === 0) {
      return createApiSuccess({
        message: 'No brands with keywords found',
        brandsProcessed: 0,
      });
    }

    const results: Array<{
      brandId: string;
      keywordsUsed: number;
      itemsCollected: number;
      itemsSaved: number;
      duplicatesSkipped: number;
      error?: string;
    }> = [];

    // 2. For each brand, collect from Google News + Reddit
    for (const [brandId, keywords] of brandKeywords) {
      try {
        const allItems: CreateIntelligenceInput[] = [];

        for (const keyword of keywords) {
          // Google News
          const newsResult = await scout.collectFromGoogleNews(brandId, keyword);
          if (newsResult.success && newsResult.items) {
            allItems.push(...newsResult.items.slice(0, MAX_ITEMS_PER_KEYWORD));
          }

          // Reddit
          const redditResult = await scout.collectFromReddit(brandId, keyword);
          if (redditResult.success && redditResult.items) {
            allItems.push(...redditResult.items.slice(0, MAX_ITEMS_PER_KEYWORD));
          }
        }

        if (allItems.length === 0) {
          results.push({
            brandId,
            keywordsUsed: keywords.length,
            itemsCollected: 0,
            itemsSaved: 0,
            duplicatesSkipped: 0,
          });
          continue;
        }

        // 3. Deduplicate by textHash against existing docs
        const existingHashesSnap = await adminDb
          .collection('brands').doc(brandId).collection('intelligence')
          .where('status', 'in', ['raw', 'processed'])
          .orderBy('collectedAt', 'desc')
          .limit(200)
          .select('content.textHash')
          .get();

        const existingHashes = new Set<string>();
        for (const doc of existingHashesSnap.docs) {
          const hash = doc.data()?.content?.textHash;
          if (hash) existingHashes.add(hash);
        }

        const uniqueItems: CreateIntelligenceInput[] = [];
        for (const item of allItems) {
          const text = item.content.text || item.content.title || '';
          const hash = ScoutAgent.generateTextHash(text);
          if (!existingHashes.has(hash)) {
            existingHashes.add(hash); // prevent intra-batch duplicates
            uniqueItems.push({ ...item, content: { ...item.content, textHash: hash } as any });
          }
        }

        const duplicatesSkipped = allItems.length - uniqueItems.length;

        // 4. Analyze sentiment + emotion via Gemini (batch)
        const analyzed = await analyzeBatch(uniqueItems);

        // 5. Save to Firestore
        let saved = 0;
        const now = Timestamp.now();
        const batch = adminDb.batch();

        for (const { item, analysis } of analyzed) {
          const docRef = adminDb
            .collection('brands').doc(brandId).collection('intelligence')
            .doc();

          const expiresAt = calculateExpiresAt(item.type, now);

          batch.set(docRef, {
            brandId,
            type: item.type || 'mention',
            status: analysis ? 'processed' : 'raw',
            source: item.source,
            content: {
              title: item.content.title || '',
              text: (item.content.text || '').substring(0, 5000),
              textHash: (item.content as any).textHash || ScoutAgent.generateTextHash(item.content.text || ''),
              originalUrl: item.content.originalUrl,
              publishedAt: item.content.publishedAt || now,
            },
            analysis: analysis ? {
              sentiment: analysis.sentiment,
              sentimentScore: analysis.sentimentScore,
              sentimentConfidence: 0.8,
              keywords: analysis.keywords,
              matchedBrandKeywords: keywords.filter(k =>
                (item.content.text || '').toLowerCase().includes(k.toLowerCase())
              ),
              relevanceScore: analysis.relevanceScore,
              analyzedBy: 'gemini-flash',
              analyzedAt: now,
              emotion: analysis.emotion, // extra field for PublicEmotion component
            } : undefined,
            metrics: item.metrics || {},
            collectedAt: now,
            expiresAt,
            version: 1,
          });

          saved++;

          // Firestore batch limit is 500
          if (saved % 400 === 0) {
            await batch.commit();
          }
        }

        if (saved % 400 !== 0) {
          await batch.commit();
        }

        results.push({
          brandId,
          keywordsUsed: keywords.length,
          itemsCollected: allItems.length,
          itemsSaved: saved,
          duplicatesSkipped,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error(`[Scout Collect] Failed for brand ${brandId}:`, message);
        results.push({
          brandId,
          keywordsUsed: keywords.length,
          itemsCollected: 0,
          itemsSaved: 0,
          duplicatesSkipped: 0,
          error: message,
        });
      }
    }

    const durationMs = Date.now() - startTime;
    const totalCollected = results.reduce((s, r) => s + r.itemsCollected, 0);
    const totalSaved = results.reduce((s, r) => s + r.itemsSaved, 0);
    const totalDupes = results.reduce((s, r) => s + r.duplicatesSkipped, 0);

    // Fail if >50% brands errored
    const failedCount = results.filter(r => r.error).length;
    if (results.length > 0 && failedCount / results.length > 0.5) {
      return createApiError(500, `High failure rate: ${failedCount}/${results.length} failed`);
    }

    return createApiSuccess({
      brandsProcessed: results.length,
      totalCollected,
      totalSaved,
      totalDuplicatesSkipped: totalDupes,
      durationMs,
      results,
    });
  } catch (error) {
    console.error('[Scout Collect] Fatal error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return createApiError(500, message);
  }
}

// ─── Helpers ───

function calculateExpiresAt(type: string, collectedAt: Timestamp): Timestamp {
  const date = collectedAt.toDate();
  let days = 30;
  switch (type) {
    case 'mention': days = 30; break;
    case 'news': days = 14; break;
    case 'trend': days = 90; break;
  }
  date.setDate(date.getDate() + days);
  return Timestamp.fromDate(date);
}

/**
 * Batch analyze items for sentiment + emotion via Gemini.
 * Processes in groups of SENTIMENT_BATCH_SIZE to fit in a single prompt.
 */
async function analyzeBatch(
  items: CreateIntelligenceInput[]
): Promise<Array<{ item: CreateIntelligenceInput; analysis: AnalysisResult | null }>> {
  const results: Array<{ item: CreateIntelligenceInput; analysis: AnalysisResult | null }> = [];

  for (let i = 0; i < items.length; i += SENTIMENT_BATCH_SIZE) {
    const batch = items.slice(i, i + SENTIMENT_BATCH_SIZE);

    // Build batch prompt
    const entries = batch.map((item, idx) => {
      const text = (item.content.text || item.content.title || '').substring(0, 500);
      return `[${idx}] (${item.source.platform}) ${text}`;
    }).join('\n\n');

    const prompt = `Analyze the sentiment, emotion, and keywords for each text below.
Return a JSON array with one object per entry, in order.

Each object must have:
- sentiment: "positive" | "negative" | "neutral"
- sentimentScore: number from -1.0 (very negative) to 1.0 (very positive)
- emotion: one of "alegria", "raiva", "tristeza", "surpresa", "medo", "neutro"
- keywords: array of 2-5 relevant keywords extracted from the text
- relevanceScore: number from 0.0 to 1.0 (how relevant/useful this content is for brand intelligence)

Texts:
${entries}

Return ONLY valid JSON array, no markdown.`;

    try {
      const raw = await generateWithGemini(prompt, {
        responseMimeType: 'application/json',
        temperature: 0.1,
        maxOutputTokens: 2048,
        feature: 'scout-collect',
      });

      const parsed = JSON.parse(raw) as AnalysisResult[];

      for (let j = 0; j < batch.length; j++) {
        const analysis = parsed[j] || null;
        if (analysis) {
          // Normalize
          analysis.sentimentScore = Math.max(-1, Math.min(1, analysis.sentimentScore || 0));
          analysis.relevanceScore = Math.max(0, Math.min(1, analysis.relevanceScore || 0.5));
          if (!['positive', 'negative', 'neutral'].includes(analysis.sentiment)) {
            analysis.sentiment = analysis.sentimentScore > 0.2 ? 'positive' : analysis.sentimentScore < -0.2 ? 'negative' : 'neutral';
          }
          const validEmotions = ['alegria', 'raiva', 'tristeza', 'surpresa', 'medo', 'neutro'];
          if (!validEmotions.includes(analysis.emotion)) {
            analysis.emotion = 'neutro';
          }
        }
        results.push({ item: batch[j], analysis });
      }
    } catch (err) {
      console.warn('[Scout Collect] Gemini analysis failed for batch, saving as raw:', err);
      for (const item of batch) {
        results.push({ item, analysis: null });
      }
    }
  }

  return results;
}
