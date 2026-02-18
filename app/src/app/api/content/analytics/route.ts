export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { handleSecurityError } from '@/lib/utils/api-security';
import { collection, getDocs, query, where, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { generateEmbedding } from '@/lib/ai/embeddings';
import { upsertToPinecone } from '@/lib/ai/pinecone';

/**
 * POST /api/content/analytics
 * W-5.1: Feedback loop — high performance → auto template, low → flag.
 * W-5.2: Index social case studies in RAG (Pinecone).
 *
 * @sprint W — W-5.1, W-5.2
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { brandId } = body;

    if (!brandId) {
      return createApiError(400, 'Missing required field: brandId');
    }

    let userId = '';
    try {
      userId = (await requireBrandAccess(req, brandId)).userId;
    } catch (error) {
      return handleSecurityError(error);
    }

    // 1. Fetch published content with metrics
    const calendarRef = collection(db, 'brands', brandId, 'content_calendar');
    const q = query(calendarRef, where('status', '==', 'published'));
    const snap = await getDocs(q);

    const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));

    if (items.length === 0) {
      return createApiSuccess({ templates: 0, flagged: 0, indexed: 0, message: 'No published content found' });
    }

    // 2. Calculate average engagement
    const engagements = items
      .filter(i => i.metrics?.engagement !== undefined)
      .map(i => i.metrics.engagement as number);

    if (engagements.length === 0) {
      return createApiSuccess({ templates: 0, flagged: 0, indexed: 0, message: 'No engagement data' });
    }

    const avgEngagement = engagements.reduce((a, b) => a + b, 0) / engagements.length;
    const highThreshold = avgEngagement * 2;
    const lowThreshold = avgEngagement * 0.5;

    let templatesCreated = 0;
    let flaggedCount = 0;
    let indexedCount = 0;

    for (const item of items) {
      const engagement = item.metrics?.engagement;
      if (engagement === undefined) continue;

      // W-5.1: High performance → save as CopyDNA template
      if (engagement > highThreshold) {
        try {
          const dnaRef = collection(db, 'brands', brandId, 'copy_dna');
          await addDoc(dnaRef, {
            brandId,
            name: `Auto-Template: ${item.title || item.copy?.slice(0, 40) || 'High Performer'}`,
            type: 'template',
            content: item.copy || item.content || '',
            platform_optimization: item.platform ? [item.platform] : [],
            performance_metrics: {
              avg_engagement: engagement,
              usage_count: 0,
            },
            tags: ['auto-generated', 'high-performer', item.platform || 'unknown'].filter(Boolean),
            updatedAt: Timestamp.now(),
            sourcePostId: item.id,
          });
          templatesCreated++;
        } catch (err) {
          console.error('[ContentAnalytics] Template creation failed:', err);
        }
      }

      // W-5.1: Low performance → flag for review
      if (engagement < lowThreshold) {
        try {
          await addDoc(collection(db, 'brands', brandId, 'notifications'), {
            type: 'automation',
            title: 'Post com baixo desempenho',
            message: `"${item.title || item.copy?.slice(0, 50) || 'Post'}" teve engagement ${engagement.toFixed(1)} (média: ${avgEngagement.toFixed(1)}). Revise a estratégia.`,
            isRead: false,
            createdAt: Timestamp.now(),
          });
          flaggedCount++;
        } catch (err) {
          console.error('[ContentAnalytics] Flag notification failed:', err);
        }
      }

      // W-5.2: Index as social case study in Pinecone
      try {
        const caseStudyText = buildCaseStudyText(item, engagement, avgEngagement);
        const embedding = await generateEmbedding(caseStudyText);

        if (embedding && embedding.length > 0) {
          await upsertToPinecone([{
            id: `social_case_${brandId}_${item.id}`,
            values: embedding,
            metadata: {
              docType: 'social_case_study',
              brandId,
              platform: item.platform || 'unknown',
              format: item.format || 'post',
              engagement,
              avgEngagement,
              performance: engagement > highThreshold ? 'winner' : engagement < lowThreshold ? 'underperforming' : 'stable',
              content: caseStudyText.slice(0, 1000),
              status: 'approved',
              isApprovedForAI: true,
            },
          }], { namespace: `social_${brandId}` });
          indexedCount++;
        }
      } catch (err) {
        console.error('[ContentAnalytics] RAG indexing failed:', err);
      }
    }

    return createApiSuccess({
      templates: templatesCreated,
      flagged: flaggedCount,
      indexed: indexedCount,
      avgEngagement: avgEngagement.toFixed(2),
      totalAnalyzed: items.length,
    });
  } catch (error) {
    console.error('[Content Analytics API]:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return createApiError(500, message);
  }
}

function buildCaseStudyText(item: any, engagement: number, avgEngagement: number): string {
  const performance = engagement > avgEngagement * 2 ? 'SUCESSO' : engagement < avgEngagement * 0.5 ? 'FRACASSO' : 'NORMAL';
  return `Social Case Study [${performance}]
Plataforma: ${item.platform || 'unknown'}
Formato: ${item.format || 'post'}
Engagement: ${engagement.toFixed(1)} (média: ${avgEngagement.toFixed(1)}, ${(engagement / avgEngagement * 100).toFixed(0)}% da média)
Conteúdo: ${item.copy || item.content || 'N/A'}
Hashtags: ${item.hashtags?.join(', ') || 'N/A'}
Horário: ${item.publishedAt ? new Date(item.publishedAt.seconds * 1000).toLocaleString('pt-BR') : 'N/A'}
Lições: ${performance === 'SUCESSO' ? 'Este formato/tom gerou alto engajamento. Replicar abordagem.' : performance === 'FRACASSO' ? 'Este formato/tom teve baixo engajamento. Evitar abordagem similar.' : 'Performance dentro da média.'}`;
}
