export const dynamic = 'force-dynamic';

/**
 * POST /api/vault/ab-test — Create an A/B test with 2 variants
 * GET /api/vault/ab-test?brandId=...&testId=... — Get test results
 *
 * Publishes 2 variants of the same content, measures performance after 24-72h,
 * and determines the winner.
 *
 * @story V-3.3
 */

import { NextRequest } from 'next/server';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { handleSecurityError } from '@/lib/utils/api-security';
import { doc, setDoc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { publishToInstagram } from '@/lib/integrations/social/instagram-graph';
import { publishToLinkedIn } from '@/lib/integrations/social/linkedin-graph';
import { fetchMediaInsights } from '@/lib/integrations/social/instagram-graph';
import { fetchLinkedInPostMetrics } from '@/lib/integrations/social/linkedin-graph';

interface ABTestVariant {
  id: string;
  copy: string;
  imageUrl?: string;
  externalId?: string;
  metrics?: Record<string, number>;
}

interface ABTestCreate {
  brandId: string;
  platform: 'instagram' | 'linkedin';
  variantA: { copy: string; imageUrl?: string };
  variantB: { copy: string; imageUrl?: string };
  dnaTemplateId?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ABTestCreate;
    const { brandId, platform, variantA, variantB, dnaTemplateId } = body;

    if (!brandId || !platform || !variantA?.copy || !variantB?.copy) {
      return createApiError(400, 'Missing required fields: brandId, platform, variantA.copy, variantB.copy');
    }

    try {
      await requireBrandAccess(req, brandId);
    } catch (error) {
      return handleSecurityError(error);
    }

    const testId = `abtest_${Date.now()}`;
    const variants: ABTestVariant[] = [
      { id: 'A', copy: variantA.copy, imageUrl: variantA.imageUrl },
      { id: 'B', copy: variantB.copy, imageUrl: variantB.imageUrl },
    ];

    // Publish both variants
    for (const variant of variants) {
      try {
        if (platform === 'instagram') {
          if (!variant.imageUrl) {
            variant.externalId = undefined;
            continue;
          }
          const result = await publishToInstagram(brandId, {
            caption: variant.copy,
            imageUrl: variant.imageUrl,
            mediaType: 'IMAGE',
          });
          variant.externalId = result.mediaId;
        } else if (platform === 'linkedin') {
          const result = await publishToLinkedIn(brandId, { text: variant.copy });
          variant.externalId = result.postId;
        }
      } catch (err) {
        console.error(`[AB Test] Failed to publish variant ${variant.id}:`, err);
      }
    }

    // Save test to Firestore
    const testRef = doc(db, 'brands', brandId, 'ab_tests', testId);
    await setDoc(testRef, {
      id: testId,
      brandId,
      platform,
      variants,
      dnaTemplateId,
      status: 'running',
      createdAt: Timestamp.now(),
      evaluateAfter: Timestamp.fromMillis(Date.now() + 24 * 60 * 60 * 1000), // 24h
    });

    return createApiSuccess({
      testId,
      status: 'running',
      variants: variants.map((v) => ({ id: v.id, externalId: v.externalId })),
    });
  } catch (error) {
    console.error('[AB Test Create] Error:', error);
    return createApiError(500, error instanceof Error ? error.message : 'Failed to create A/B test');
  }
}

export async function GET(req: NextRequest) {
  try {
    const brandId = req.nextUrl.searchParams.get('brandId');
    const testId = req.nextUrl.searchParams.get('testId');

    if (!brandId || !testId) {
      return createApiError(400, 'Missing required params: brandId, testId');
    }

    try {
      await requireBrandAccess(req, brandId);
    } catch (error) {
      return handleSecurityError(error);
    }

    const testRef = doc(db, 'brands', brandId, 'ab_tests', testId);
    const testSnap = await getDoc(testRef);

    if (!testSnap.exists()) {
      return createApiError(404, 'A/B test not found');
    }

    const test = testSnap.data();

    // If test is still running, fetch latest metrics
    if (test.status === 'running') {
      const variants = test.variants as ABTestVariant[];
      let metricsUpdated = false;

      for (const variant of variants) {
        if (!variant.externalId) continue;

        try {
          if (test.platform === 'instagram') {
            variant.metrics = await fetchMediaInsights(brandId, variant.externalId);
            metricsUpdated = true;
          } else if (test.platform === 'linkedin') {
            const liMetrics = await fetchLinkedInPostMetrics(brandId, variant.externalId);
            variant.metrics = { ...liMetrics };
            metricsUpdated = true;
          }
        } catch (err) {
          console.error(`[AB Test] Failed to fetch metrics for variant ${variant.id}:`, err);
        }
      }

      // Determine winner if evaluation time has passed
      const evaluateAfter = test.evaluateAfter?.toMillis?.() || 0;
      const isReady = Date.now() >= evaluateAfter;

      if (isReady && metricsUpdated) {
        const engagementA = variants[0]?.metrics?.engagement || 0;
        const engagementB = variants[1]?.metrics?.engagement || 0;
        const winner = engagementA >= engagementB ? 'A' : 'B';
        const confidence =
          engagementA + engagementB > 0
            ? Math.abs(engagementA - engagementB) / (engagementA + engagementB)
            : 0;

        await updateDoc(testRef, {
          variants,
          status: 'completed',
          winner,
          confidence: Math.round(confidence * 100) / 100,
          completedAt: Timestamp.now(),
        });

        return createApiSuccess({
          ...test,
          variants,
          status: 'completed',
          winner,
          confidence: Math.round(confidence * 100) / 100,
        });
      }

      // Update metrics but keep running
      if (metricsUpdated) {
        await updateDoc(testRef, { variants });
      }

      return createApiSuccess({
        ...test,
        variants,
        status: 'running',
        evaluateAfter: test.evaluateAfter,
      });
    }

    return createApiSuccess(test);
  } catch (error) {
    console.error('[AB Test Get] Error:', error);
    return createApiError(500, error instanceof Error ? error.message : 'Failed to get A/B test');
  }
}
