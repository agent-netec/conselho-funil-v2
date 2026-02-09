import { NextRequest } from 'next/server';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { AutoOptimizer } from '@/lib/intelligence/ab-testing/auto-optimizer';
import { getKillSwitchState } from '@/lib/firebase/automation';
import { getABTest } from '@/lib/firebase/ab-tests';
import { OptimizeRequestSchema } from '@/types/ab-testing';

export const dynamic = 'force-dynamic';

function resolveError(error: unknown): { status: number; message: string } {
  if (error && typeof error === 'object' && 'status' in error) {
    const status = Number((error as { status?: number }).status);
    if (!Number.isNaN(status)) {
      const message = (error as { message?: string }).message ?? 'Request failed';
      return { status, message };
    }
  }
  if (error instanceof Error) {
    return { status: 500, message: error.message };
  }
  return { status: 500, message: 'Internal server error' };
}

export async function POST(req: NextRequest, context: { params: { testId: string } }) {
  try {
    const { testId } = context.params;
    const body = await req.json();
    const { brandId } = OptimizeRequestSchema.parse(body);

    if (!brandId) {
      return createApiError(400, 'brandId is required');
    }

    await requireBrandAccess(req, brandId);

    const test = await getABTest(brandId, testId);
    if (!test) {
      return createApiError(404, 'AB Test not found');
    }
    if (!test.autoOptimize || test.status !== 'running') {
      return createApiError(400, 'Test is not eligible for auto-optimization');
    }

    const killSwitchActive = await getKillSwitchState(brandId);
    const decisions = await AutoOptimizer.evaluate(brandId, testId, killSwitchActive);

    return createApiSuccess(decisions);
  } catch (error) {
    const { status, message } = resolveError(error);
    return createApiError(status, message);
  }
}
