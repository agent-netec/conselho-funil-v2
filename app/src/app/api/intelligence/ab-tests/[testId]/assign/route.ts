import { NextRequest } from 'next/server';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { AssignVariantSchema } from '@/types/ab-testing';
import { ABTestEngine } from '@/lib/intelligence/ab-testing/engine';

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

export async function POST(req: NextRequest, context: { params: Promise<{ testId: string }> }) {
  try {
    const { testId } = await context.params;
    const body = await req.json();
    const parsed = AssignVariantSchema.parse(body);

    await requireBrandAccess(req, parsed.brandId);

    const variant = await ABTestEngine.assignVariant(parsed.brandId, testId, parsed.leadId);
    if (!variant) {
      return createApiError(400, 'Test is not running or has no active variants');
    }

    return createApiSuccess({
      testId,
      variantId: variant.id,
      variantName: variant.name,
      contentVariations: variant.contentVariations,
    });
  } catch (error) {
    const { status, message } = resolveError(error);
    return createApiError(status, message);
  }
}
