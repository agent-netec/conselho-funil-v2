export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { Timestamp } from 'firebase/firestore';
import { MonaraTokenVault } from '@/lib/firebase/vault';

/**
 * GET /api/auth/linkedin/callback
 * OAuth callback for LinkedIn — exchanges code for access_token.
 * LinkedIn tokens last 60 days; refresh tokens last 365 days.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // brandId
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL(`/integrations?error=linkedin_denied`, req.url));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL(`/integrations?error=linkedin_missing_params`, req.url));
  }

  const brandId = state;
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = (process.env.LINKEDIN_CLIENT_SECRET || '').trim();
  const redirectUri = `${new URL(req.url).origin}/api/auth/linkedin/callback`;

  if (!clientId || !clientSecret) {
    console.error('[LinkedIn OAuth] Missing LINKEDIN_CLIENT_ID or LINKEDIN_CLIENT_SECRET env vars');
    return NextResponse.redirect(new URL(`/integrations?error=linkedin_config`, req.url));
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }).toString(),
    });

    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      console.error('[LinkedIn OAuth] Token exchange failed:', tokenData.error_description || tokenData.error);
      return NextResponse.redirect(new URL(`/integrations?error=linkedin_token_exchange`, req.url));
    }

    // Save to MonaraTokenVault
    await MonaraTokenVault.saveToken(brandId, {
      brandId,
      provider: 'linkedin',
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: Timestamp.fromMillis(Date.now() + (tokenData.expires_in || 5184000) * 1000),
      scopes: tokenData.scope?.split(',') || ['r_ads', 'r_ads_reporting'],
      metadata: {
        accountId: '',
        clientId,
        clientSecret,
      },
    });

    console.log(`[LinkedIn OAuth] Success for brand=${brandId}`);
    return NextResponse.redirect(new URL(`/integrations?success=linkedin`, req.url));

  } catch (err) {
    console.error('[LinkedIn OAuth] Error:', err);
    return NextResponse.redirect(new URL(`/integrations?error=linkedin_server`, req.url));
  }
}
