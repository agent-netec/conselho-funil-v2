import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const apiKey = process.env.GOOGLE_AI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      error: 'GOOGLE_AI_API_KEY not configured'
    }, { status: 500 });
  }

  try {
    // Test gemini-3-pro-image-preview with minimal payload
    const imageEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent';

    const payload = {
      contents: [{
        role: 'user',
        parts: [{ text: 'A simple red circle on white background' }]
      }],
      generationConfig: {
        responseModalities: ['IMAGE'],
        imageConfig: {
          aspectRatio: '1:1',
          imageSize: '2K'
        }
      }
    };

    console.log('📤 Sending request to:', imageEndpoint);
    console.log('📦 Payload:', JSON.stringify(payload, null, 2));

    const response = await fetch(imageEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    let responseData;

    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    console.log('📥 Response status:', response.status);
    console.log('📥 Response:', responseData);

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        status: response.status,
        error: responseData,
        headers: Object.fromEntries(response.headers.entries()),
        requestPayload: payload
      });
    }

    // Check if image was generated
    const inlineData = responseData?.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData;

    return NextResponse.json({
      success: true,
      status: response.status,
      hasImage: !!inlineData,
      imageSize: inlineData?.data ? inlineData.data.length : 0,
      fullResponse: responseData
    });

  } catch (error: any) {
    console.error('❌ Test failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
