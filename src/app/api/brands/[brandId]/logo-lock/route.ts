import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRole, handleSecurityError } from '@/lib/utils/api-security';
import { updateLogoLock, toggleLogoLock } from '@/lib/ai/brand-governance';
import { getBrand } from '@/lib/firebase/firestore';

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
      return NextResponse.json(
        { error: 'variant e asset são obrigatórios' },
        { status: 400 }
      );
    }

    await updateLogoLock(brandId, variant, asset, user.id);

    return NextResponse.json({ success: true });
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
      return NextResponse.json(
        { error: 'locked (boolean) é obrigatório' },
        { status: 400 }
      );
    }

    await toggleLogoLock(brandId, locked, user.id);

    return NextResponse.json({ success: true, locked });
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
      return NextResponse.json(
        { error: 'Marca não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      logoLock: brand.brandKit?.logoLock || { variants: {}, locked: false }
    });
  } catch (error) {
    return handleSecurityError(error);
  }
}
