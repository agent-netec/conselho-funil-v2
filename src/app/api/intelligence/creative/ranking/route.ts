import { NextRequest, NextResponse } from 'next/server';
import { getCreativePerformanceRanking } from '@/lib/firebase/creative-intelligence';

/**
 * @fileoverview API Route for Creative Intelligence Ranking
 * @route GET /api/intelligence/creative/ranking
 * @story ST-26.3
 */

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const brandId = searchParams.get('brandId');

    if (!brandId) {
      return NextResponse.json(
        { error: 'Missing brandId parameter' },
        { status: 400 }
      );
    }

    const ranking = await getCreativePerformanceRanking(brandId);

    return NextResponse.json({
      brandId,
      ranking,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ [API Creative Ranking] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
