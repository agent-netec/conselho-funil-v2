import { NextRequest } from 'next/server';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { ABTestEngine } from '@/lib/intelligence/ab-testing/engine';
import { getABTest, updateABTest, deleteABTest } from '@/lib/firebase/ab-tests';
import type { ABTestStatus } from '@/types/ab-testing';
import { UpdateABTestSchema } from '@/types/ab-testing';

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

export async function GET(req: NextRequest, context: { params: { testId: string } }) {
  try {
    const { searchParams } = new URL(req.url);
    const brandId = searchParams.get('brandId');
    const { testId } = context.params;

    if (!brandId) {
      return createApiError(400, 'brandId is required');
    }

    await requireBrandAccess(req, brandId);

    const test = await getABTest(brandId, testId);
    if (!test) {
      return createApiError(404, 'AB Test not found');
    }

    return createApiSuccess(test);
  } catch (error) {
    const { status, message } = resolveError(error);
    return createApiError(status, message);
  }
}

export async function PUT(req: NextRequest, context: { params: { testId: string } }) {
  try {
    const { testId } = context.params;
    const body = await req.json();
    const parsed = UpdateABTestSchema.parse(body);
    const { brandId, action, ...updates } = parsed as {
      brandId: string;
      action?: 'start' | 'pause' | 'complete';
      status?: ABTestStatus;
      winnerVariantId?: string | null;
      significanceLevel?: number | null;
    };

    if (!brandId) {
      return createApiError(400, 'brandId is required');
    }

    await requireBrandAccess(req, brandId);

    if (action === 'start') {
      await ABTestEngine.startTest(brandId, testId);
    } else if (action === 'pause') {
      await ABTestEngine.pauseTest(brandId, testId);
    } else if (action === 'complete') {
      await ABTestEngine.completeTest(
        brandId,
        testId,
        updates.winnerVariantId ?? undefined,
        updates.significanceLevel ?? undefined
      );
    } else {
      await updateABTest(brandId, testId, updates);
    }

    const updated = await getABTest(brandId, testId);
    return createApiSuccess(updated);
  } catch (error) {
    const { status, message } = resolveError(error);
    return createApiError(status, message);
  }
}

export async function DELETE(req: NextRequest, context: { params: { testId: string } }) {
  try {
    const { testId } = context.params;
    const { searchParams } = new URL(req.url);
    const brandId = searchParams.get('brandId');

    if (!brandId) {
      return createApiError(400, 'brandId is required');
    }

    await requireBrandAccess(req, brandId);

    const test = await getABTest(brandId, testId);
    if (!test) {
      return createApiError(404, 'AB Test not found');
    }

    if (test.status !== 'draft') {
      return createApiError(400, 'Only draft tests can be deleted');
    }

    await deleteABTest(brandId, testId);
    return createApiSuccess({ deleted: true });
  } catch (error) {
    const { status, message } = resolveError(error);
    return createApiError(status, message);
  }
}
