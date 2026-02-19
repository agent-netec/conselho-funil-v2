import { NextRequest, NextResponse } from 'next/server';
import { analyzeMultimodalWithGemini } from '@/lib/ai/gemini';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * POST /api/intelligence/analyze/image
 * Server-side proxy for multimodal (image/PDF) analysis via Gemini.
 * Keeps GOOGLE_AI_API_KEY server-only instead of exposing it to the client.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, fileBase64, mimeType, userId, brandId } = body;

    if (!prompt || !fileBase64 || !mimeType) {
      return NextResponse.json(
        { error: 'prompt, fileBase64 and mimeType are required' },
        { status: 400 }
      );
    }

    const insight = await analyzeMultimodalWithGemini(prompt, fileBase64, mimeType, {
      userId: userId || 'system',
      brandId,
      feature: 'chat_attachment_analysis',
    });

    return NextResponse.json({ insight });
  } catch (error: any) {
    console.error('[analyze/image] Error:', error?.message || error);
    return NextResponse.json(
      { error: error?.message || 'Failed to analyze image' },
      { status: 500 }
    );
  }
}
