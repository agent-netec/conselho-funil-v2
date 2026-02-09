import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRole, handleSecurityError } from '@/lib/utils/api-security';
import { updateLogoLock, toggleLogoLock } from '@/lib/ai/brand-governance';
import { getBrand } from '@/lib/firebase/firestore';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';

/**
 * POST /api/brands/[brandId]/logo-lock
 * Body: { variant: 'primary' | 'horizontal' | 'icon', asset: LogoAsset }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ brandId: string }> }
) {
  try {
    const user = await verifyAdminRole(request);
    const { brandId } = await params;
    const body = await request.json();
    const { variant, asset } = body;

    if (!variant || !asset) {
      return createApiError(400, 'variant e asset são obrigatórios');
    }

    await updateLogoLock(brandId, variant, asset, user.id);

    return createApiSuccess({});
  } catch (error) {
    return handleSecurityError(error);
  }
}

/**
 * PATCH /api/brands/[brandId]/logo-lock
 * Body: { locked: boolean }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ brandId: string }> }
) {
  try {
    const user = await verifyAdminRole(request);
    const { brandId } = await params;
    const body = await request.json();
    const { locked } = body;

    if (typeof locked !== 'boolean') {
      return createApiError(400, 'locked (boolean) é obrigatório');
    }

    await toggleLogoLock(brandId, locked, user.id);

    return createApiSuccess({ locked });
  } catch (error) {
    return handleSecurityError(error);
  }
}

/**
 * GET /api/brands/[brandId]/logo-lock
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ brandId: string }> }
) {
  try {
    await verifyAdminRole(request);
    const { brandId } = await params;
    const brand = await getBrand(brandId);

    if (!brand) {
      return createApiError(404, 'Marca não encontrada');
    }

    return createApiSuccess({
      logoLock: brand.brandKit?.logoLock || { variants: {}, locked: false }
    });
  } catch (error) {
    return handleSecurityError(error);
  }
}
