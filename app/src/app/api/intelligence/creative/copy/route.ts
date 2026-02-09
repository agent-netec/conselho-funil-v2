export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getBrand } from '@/lib/firebase/brands';
import { CopyGenerationLab, CopyAngle } from '@/lib/intelligence/creative/copy-gen';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { ApiError, handleSecurityError } from '@/lib/utils/api-security';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { updateUserUsage } from '@/lib/firebase/firestore';

/**
 * @fileoverview API Route for AI Copy Variation Lab
 * @route POST /api/intelligence/creative/copy
 * @story ST-26.2
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { brandId, baseCopy, angle, targetAudience, userId } = body;

    // 1. Validação de inputs
    if (!brandId || !baseCopy || !angle) {
      return createApiError(400, 'Missing required fields: brandId, baseCopy, angle');
    }

    const validAngles: CopyAngle[] = ['fear', 'greed', 'authority', 'curiosity'];
    if (!validAngles.includes(angle as CopyAngle)) {
      return createApiError(400, `Invalid angle. Must be one of: ${validAngles.join(', ')}`);
    }

    const { brandId: safeBrandId } = await requireBrandAccess(req, brandId);

    // 2. Buscar marca e BrandKit
    const brand = await getBrand(safeBrandId);
    if (!brand) {
      return createApiError(404, 'Brand not found');
    }

    // 3. Inicializar motor e gerar variantes
    const lab = new CopyGenerationLab();
    const variants = await lab.generateVariants({
      baseCopy,
      angle: angle as CopyAngle,
      brand,
      targetAudience
    });

    // SIG-API-03: Decrementar 2 créditos por geração de copy variants
    if (userId) {
      try {
        await updateUserUsage(userId, -2);
        console.log(`[Intelligence/Copy] 2 créditos decrementados para usuário: ${userId}`);
      } catch (creditError) {
        console.error('[Intelligence/Copy] Erro ao atualizar créditos:', creditError);
      }
    }

    // 4. Retornar variantes
    return createApiSuccess({
      brandId: safeBrandId,
      angle,
      variants,
      timestamp: new Date().toISOString()
    });

  } catch (error: unknown) {
    console.error('❌ [API Copy Lab] Error:', error);
    if (error instanceof ApiError) {
      return handleSecurityError(error);
    }
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return createApiError(500, message);
  }
}
