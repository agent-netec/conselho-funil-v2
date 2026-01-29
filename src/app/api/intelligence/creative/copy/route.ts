export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getBrand } from '@/lib/firebase/brands';
import { CopyGenerationLab, CopyAngle } from '@/lib/intelligence/creative/copy-gen';

/**
 * @fileoverview API Route for AI Copy Variation Lab
 * @route POST /api/intelligence/creative/copy
 * @story ST-26.2
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { brandId, baseCopy, angle, targetAudience } = body;

    // 1. Validação de inputs
    if (!brandId || !baseCopy || !angle) {
      return NextResponse.json(
        { error: 'Missing required fields: brandId, baseCopy, angle' },
        { status: 400 }
      );
    }

    const validAngles: CopyAngle[] = ['fear', 'greed', 'authority', 'curiosity'];
    if (!validAngles.includes(angle as CopyAngle)) {
      return NextResponse.json(
        { error: `Invalid angle. Must be one of: ${validAngles.join(', ')}` },
        { status: 400 }
      );
    }

    // 2. Buscar marca e BrandKit
    const brand = await getBrand(brandId);
    if (!brand) {
      return NextResponse.json(
        { error: 'Brand not found' },
        { status: 404 }
      );
    }

    // 3. Inicializar motor e gerar variantes
    const lab = new CopyGenerationLab();
    const variants = await lab.generateVariants({
      baseCopy,
      angle: angle as CopyAngle,
      brand,
      targetAudience
    });

    // 4. Retornar variantes
    return NextResponse.json({
      brandId,
      angle,
      variants,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ [API Copy Lab] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
