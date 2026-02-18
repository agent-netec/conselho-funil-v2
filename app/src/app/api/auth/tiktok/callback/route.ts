export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { Timestamp } from 'firebase/firestore';
import { MonaraTokenVault } from '@/lib/firebase/vault';

/**
 * GET /api/auth/tiktok/callback
 * OAuth callback for TikTok for Business — exchanges auth_code for access_token.
 * TikTok tokens last 24h; refresh tokens last 365 days.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const authCode = searchParams.get('auth_code');
  const state = searchParams.get('state'); // brandId
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL(`/integrations?error=tiktok_denied`, req.url));
  }

  if (!authCode || !state) {
    return NextResponse.redirect(new URL(`/integrations?error=tiktok_missing_params`, req.url));
  }

  const brandId = state;
  const appId = process.env.TIKTOK_APP_ID;
  const appSecret = process.env.TIKTOK_APP_SECRET;

  if (!appId || !appSecret) {
    console.error('[TikTok OAuth] Missing TIKTOK_APP_ID or TIKTOK_APP_SECRET env vars');
    return NextResponse.redirect(new URL(`/integrations?error=tiktok_config`, req.url));
  }

  try {
    // Exchange auth_code for access token
    const tokenRes = await fetch('https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app_id: appId,
        secret: appSecret,
        auth_code: authCode,
      }),
    });

    const tokenData = await tokenRes.json();

    if (tokenData.code !== 0 || !tokenData.data?.access_token) {
      console.error('[TikTok OAuth] Token exchange failed:', tokenData.message || tokenData);
      return NextResponse.redirect(new URL(`/integrations?error=tiktok_token_exchange`, req.url));
    }

    const { access_token, advertiser_ids } = tokenData.data;
    const firstAdvertiserId = advertiser_ids?.[0] || '';

    // Save to MonaraTokenVault
    await MonaraTokenVault.saveToken(brandId, {
      brandId,
      provider: 'tiktok',
      accessToken: access_token,
      expiresAt: Timestamp.fromMillis(Date.now() + 24 * 60 * 60 * 1000), // 24h
      scopes: ['ad.read', 'ad.write'],
      metadata: {
        advertiserId: firstAdvertiserId,
        appId,
        appSecret,
      },
    });

    console.log(`[TikTok OAuth] Success for brand=${brandId} advertiser=${firstAdvertiserId}`);
    return NextResponse.redirect(new URL(`/integrations?success=tiktok`, req.url));

  } catch (err) {
    console.error('[TikTok OAuth] Error:', err);
    return NextResponse.redirect(new URL(`/integrations?error=tiktok_server`, req.url));
  }
}
