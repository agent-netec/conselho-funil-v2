import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const apiKey = (process.env.GOOGLE_AI_API_KEY || '').trim();

  if (!apiKey) {
    return NextResponse.json({
      error: 'GOOGLE_AI_API_KEY not configured',
      hasKey: false
    }, { status: 500 });
  }

  // List available models
  try {
    const listModelsEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models';
    const listResponse = await fetch(listModelsEndpoint, {
      method: 'GET',
      headers: {
        'x-goog-api-key': apiKey,
      }
    });

    const modelsData = await listResponse.json();

    if (!listResponse.ok) {
      return NextResponse.json({
        test: 'list_models',
        status: listResponse.status,
        error: modelsData
      }, { status: 200 });
    }

    // Filter models that support generateContent
    const generateContentModels = modelsData.models?.filter((m: any) =>
      m.supportedGenerationMethods?.includes('generateContent')
    ) || [];

    // Filter image generation models
    const imageModels = generateContentModels.filter((m: any) =>
      m.name?.toLowerCase().includes('image') ||
      m.name?.toLowerCase().includes('nano') ||
      m.displayName?.toLowerCase().includes('image')
    );

    return NextResponse.json({
      totalModels: modelsData.models?.length || 0,
      generateContentModels: generateContentModels.map((m: any) => ({
        name: m.name,
        displayName: m.displayName,
        description: m.description,
        supportedMethods: m.supportedGenerationMethods
      })),
      imageModels: imageModels.map((m: any) => ({
        name: m.name,
        displayName: m.displayName,
        description: m.description
      }))
    });

  } catch (error: any) {
    return NextResponse.json({
      error: 'Test failed',
      message: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
