import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const apiKey = process.env.GOOGLE_AI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      error: 'GOOGLE_AI_API_KEY not configured',
      hasKey: false
    }, { status: 500 });
  }

  // Test 1: Simple text generation
  try {
    const textEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';
    const textResponse = await fetch(textEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: 'Say hello' }]
        }]
      })
    });

    const textData = await textResponse.json();

    if (!textResponse.ok) {
      return NextResponse.json({
        test: 'text_generation',
        status: textResponse.status,
        error: textData,
        headers: Object.fromEntries(textResponse.headers.entries())
      }, { status: 200 });
    }

    // Test 2: Image generation
    const imageEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent';
    const imageResponse = await fetch(imageEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{ text: 'A simple red circle' }]
        }],
        generationConfig: {
          responseModalities: ['IMAGE'],
          imageConfig: {
            aspectRatio: '1:1',
            imageSize: '2K'
          }
        }
      })
    });

    const imageData = await imageResponse.json();

    return NextResponse.json({
      textTest: {
        success: textResponse.ok,
        status: textResponse.status,
        response: textData
      },
      imageTest: {
        success: imageResponse.ok,
        status: imageResponse.status,
        response: imageData,
        headers: Object.fromEntries(imageResponse.headers.entries())
      }
    });

  } catch (error: any) {
    return NextResponse.json({
      error: 'Test failed',
      message: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
