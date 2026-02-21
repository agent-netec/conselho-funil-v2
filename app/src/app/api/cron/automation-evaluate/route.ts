export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest } from 'next/server';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { getAllBrandIds } from '@/lib/firebase/firestore';
import { evaluateBrandRules, EvaluationResult } from '@/lib/automation/evaluate';

/**
 * GET /api/cron/automation-evaluate
 * Vercel Cron: avalia regras de automação para TODAS as brands a cada hora.
 * Auth: CRON_SECRET (Vercel envia Authorization: Bearer <CRON_SECRET>).
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    const cronSecret = (process.env.CRON_SECRET || '').trim();

    if (!cronSecret) {
      console.error('[Cron] CRON_SECRET env var not configured');
      return createApiError(500, 'Cron configuration error');
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return createApiError(401, 'Unauthorized');
    }

    const brandIds = await getAllBrandIds();

    const results: EvaluationResult[] = [];
    const errors: { brandId: string; error: string }[] = [];

    for (const brandId of brandIds) {
      try {
        const result = await evaluateBrandRules(brandId);
        results.push(result);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error(`[Cron] Failed to evaluate brand ${brandId}:`, message);
        errors.push({ brandId, error: message });
      }
    }

    const totalLogsCreated = results.reduce((sum, r) => sum + r.logsCreated, 0);

    return createApiSuccess({
      brandsProcessed: results.length,
      brandsErrored: errors.length,
      totalLogsCreated,
      results,
      errors,
    });
  } catch (error) {
    console.error('[Cron Automation Evaluate]:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return createApiError(500, message);
  }
}
