export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { Timestamp } from 'firebase/firestore';
import { MonaraTokenVault } from '@/lib/firebase/vault';
import { GOOGLE_ADS_API } from '@/lib/integrations/ads/constants';

/**
 * GET /api/auth/google/callback
 * OAuth callback for Google Ads — exchanges code for refresh_token + access_token.
 * Uses offline access to get refresh_token for auto-refresh.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // brandId
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL(`/integrations?error=google_denied`, req.url));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL(`/integrations?error=google_missing_params`, req.url));
  }

  const brandId = state;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${new URL(req.url).origin}/api/auth/google/callback`;

  if (!clientId || !clientSecret) {
    console.error('[Google OAuth] Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET env vars');
    return NextResponse.redirect(new URL(`/integrations?error=google_config`, req.url));
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch(GOOGLE_ADS_API.TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }).toString(),
    });

    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      console.error('[Google OAuth] Token exchange failed:', tokenData.error_description || tokenData.error);
      return NextResponse.redirect(new URL(`/integrations?error=google_token_exchange`, req.url));
    }

    // Save to MonaraTokenVault
    await MonaraTokenVault.saveToken(brandId, {
      brandId,
      provider: 'google',
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: Timestamp.fromMillis(Date.now() + (tokenData.expires_in || 3600) * 1000),
      scopes: tokenData.scope?.split(' ') || ['https://www.googleapis.com/auth/adwords'],
      metadata: {
        customerId: '', // User must fill this in the integration form
        developerToken: process.env.GOOGLE_DEVELOPER_TOKEN || '',
        clientId,
        clientSecret,
      },
    });

    console.log(`[Google OAuth] Success for brand=${brandId}`);
    return NextResponse.redirect(new URL(`/integrations?success=google`, req.url));

  } catch (err) {
    console.error('[Google OAuth] Error:', err);
    return NextResponse.redirect(new URL(`/integrations?error=google_server`, req.url));
  }
}
