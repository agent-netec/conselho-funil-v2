import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Contract 22-2: gemini-2.0-flash-exp is DEPRECATED
const IMAGE_MODELS = [
  'gemini-3-pro-image-preview',
  'gemini-2.5-flash-image',
];

export async function GET(request: NextRequest) {
  const apiKey = process.env.GOOGLE_AI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'GOOGLE_AI_API_KEY not configured' }, { status: 500 });
  }

  const results: Record<string, any> = {};

  for (const modelId of IMAGE_MODELS) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent`;
    const payload = {
      contents: [{ role: 'user', parts: [{ text: 'Generate: a simple red circle on a white background' }] }],
      generationConfig: {
        responseModalities: ['TEXT', 'IMAGE'],
        imageConfig: { aspectRatio: '1:1' },
      },
    };

    try {
      const start = Date.now();
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(60000),
      });
      const elapsed = Date.now() - start;

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try { errorData = JSON.parse(errorText); } catch { errorData = errorText; }
        results[modelId] = { success: false, status: response.status, elapsed: `${elapsed}ms`, error: errorData };
        continue;
      }

      const data = await response.json();
      const inlineData = data?.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData;

      results[modelId] = {
        success: true,
        status: response.status,
        elapsed: `${elapsed}ms`,
        hasImage: !!inlineData,
        imageSizeBytes: inlineData?.data ? Math.round(inlineData.data.length * 0.75) : 0,
        mimeType: inlineData?.mimeType || null,
      };
    } catch (error: any) {
      results[modelId] = { success: false, error: error.message };
    }
  }

  // Summary
  const working = Object.entries(results).filter(([_, r]) => r.success && r.hasImage).map(([id]) => id);

  return NextResponse.json({
    summary: {
      totalTested: IMAGE_MODELS.length,
      working: working.length,
      workingModels: working,
      recommended: working[0] || 'none',
    },
    results,
  });
}
