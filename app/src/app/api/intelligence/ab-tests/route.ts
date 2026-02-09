import { NextRequest } from 'next/server';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { CreateABTestSchema } from '@/types/ab-testing';
import { createABTest, getABTests } from '@/lib/firebase/ab-tests';

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CreateABTestSchema.parse(body);

    await requireBrandAccess(req, parsed.brandId);

    const test = await createABTest(parsed.brandId, {
      name: parsed.name,
      targetSegment: parsed.targetSegment,
      variants: parsed.variants.map((variant) => ({
        name: variant.name,
        contentVariations: variant.contentVariations,
      })),
      autoOptimize: parsed.autoOptimize,
    });

    return createApiSuccess(test, { status: 201 });
  } catch (error) {
    const { status, message } = resolveError(error);
    return createApiError(status, message);
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const brandId = searchParams.get('brandId');
    const status = searchParams.get('status') || undefined;

    if (!brandId) {
      return createApiError(400, 'brandId is required');
    }

    await requireBrandAccess(req, brandId);

    const tests = await getABTests(brandId, status as undefined | 'draft' | 'running' | 'paused' | 'completed');
    return createApiSuccess(tests);
  } catch (error) {
    const { status, message } = resolveError(error);
    return createApiError(status, message);
  }
}
