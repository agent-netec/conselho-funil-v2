/**
 * Sentiment Analyzer — Sprint V (V-1.2)
 * Real sentiment analysis via Gemini for social interactions.
 *
 * @module lib/ai/sentiment-analyzer
 * @story V-1.2
 */

import { generateWithGemini } from '@/lib/ai/gemini';
import type { SocialInteraction } from '@/types/social-inbox';

interface SentimentResult {
  score: number; // 0.0 to 1.0
  label: 'positive' | 'neutral' | 'negative';
  tags: string[];
  priority: number; // 0 to 10
  requires_human_review: boolean;
}

const SENTIMENT_PROMPT = `You are a social media sentiment analyzer for a brand.
Analyze the following social media interaction and return a JSON object with:
- score: number from 0.0 (most negative) to 1.0 (most positive)
- label: "positive", "neutral", or "negative"
- tags: array of relevant tags (e.g., "lead", "support", "complaint", "praise", "spam", "question", "feedback")
- priority: number from 0 (low) to 10 (urgent)
- requires_human_review: boolean (true if sentiment < 0.3 or if content is ambiguous/sensitive)

Platform: {platform}
Type: {type}
Author: {author}
Content: {content}

Return ONLY valid JSON, no markdown or explanation.`;

/**
 * Analyze sentiment of a single interaction via Gemini.
 */
export async function analyzeSentiment(interaction: SocialInteraction): Promise<SentimentResult> {
  const prompt = SENTIMENT_PROMPT
    .replace('{platform}', interaction.platform)
    .replace('{type}', interaction.type)
    .replace('{author}', interaction.author.handle)
    .replace('{content}', interaction.content.text);

  try {
    const result = await generateWithGemini(prompt, {
      responseMimeType: 'application/json',
    });

    const rawText = typeof result === 'string' ? result : '';
    const parsed = JSON.parse(rawText) as SentimentResult;

    // Validate ranges
    const score = Math.max(0, Math.min(1, parsed.score || 0.5));
    const label =
      score >= 0.6 ? 'positive' : score <= 0.4 ? 'negative' : 'neutral';

    return {
      score,
      label,
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      priority: Math.max(0, Math.min(10, parsed.priority || 0)),
      requires_human_review: score < 0.3 || parsed.requires_human_review === true,
    };
  } catch (error) {
    console.error('[SentimentAnalyzer] Gemini parse failed, using fallback:', error);
    return {
      score: 0.5,
      label: 'neutral',
      tags: [],
      priority: 0,
      requires_human_review: false,
    };
  }
}

/**
 * Batch analyze sentiments for multiple interactions.
 * Processes in parallel with concurrency limit.
 */
export async function analyzeSentimentBatch(
  interactions: SocialInteraction[],
  concurrency: number = 5
): Promise<SocialInteraction[]> {
  const enriched: SocialInteraction[] = [];

  // Process in batches to respect rate limits
  for (let i = 0; i < interactions.length; i += concurrency) {
    const batch = interactions.slice(i, i + concurrency);
    const results = await Promise.allSettled(
      batch.map(async (interaction) => {
        const sentiment = await analyzeSentiment(interaction);
        return {
          ...interaction,
          metadata: {
            ...interaction.metadata,
            sentimentScore: sentiment.score,
            sentimentLabel: sentiment.label,
            requires_human_review: sentiment.requires_human_review,
            tags: sentiment.tags,
            priority: sentiment.priority,
          },
        };
      })
    );

    for (const result of results) {
      if (result.status === 'fulfilled') {
        enriched.push(result.value);
      }
    }
  }

  return enriched;
}
