export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { Timestamp } from 'firebase/firestore';
import { MonaraTokenVault } from '@/lib/firebase/vault';
import { META_API } from '@/lib/integrations/ads/constants';

/**
 * GET /api/auth/meta/callback
 * OAuth callback for Meta (Facebook) — exchanges code for long-lived token.
 * Flow: code → short-lived token → fb_exchange_token → long-lived token (60 days)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // brandId
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL(`/integrations?error=meta_denied`, req.url));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL(`/integrations?error=meta_missing_params`, req.url));
  }

  const brandId = state;
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  const redirectUri = `${new URL(req.url).origin}/api/auth/meta/callback`;

  if (!appId || !appSecret) {
    console.error('[Meta OAuth] Missing META_APP_ID or META_APP_SECRET env vars');
    return NextResponse.redirect(new URL(`/integrations?error=meta_config`, req.url));
  }

  try {
    // Step 1: Exchange code for short-lived token
    const tokenUrl = `${META_API.BASE_URL}/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`;
    const tokenRes = await fetch(tokenUrl);
    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      console.error('[Meta OAuth] Token exchange failed:', tokenData.error);
      return NextResponse.redirect(new URL(`/integrations?error=meta_token_exchange`, req.url));
    }

    // Step 2: Exchange for long-lived token
    const longLivedUrl = `${META_API.BASE_URL}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${tokenData.access_token}`;
    const longLivedRes = await fetch(longLivedUrl);
    const longLivedData = await longLivedRes.json();

    if (longLivedData.error) {
      console.error('[Meta OAuth] Long-lived exchange failed:', longLivedData.error);
      return NextResponse.redirect(new URL(`/integrations?error=meta_long_lived`, req.url));
    }

    // Step 3: Get user info (ad accounts)
    const meRes = await fetch(`${META_API.BASE_URL}/me?fields=id,name,adaccounts{account_id,name}&access_token=${longLivedData.access_token}`);
    const meData = await meRes.json();

    const firstAdAccount = meData.adaccounts?.data?.[0]?.account_id || '';

    // Step 4: Save to MonaraTokenVault
    await MonaraTokenVault.saveToken(brandId, {
      brandId,
      provider: 'meta',
      accessToken: longLivedData.access_token,
      expiresAt: Timestamp.fromMillis(Date.now() + (longLivedData.expires_in || 5184000) * 1000),
      scopes: ['ads_read', 'read_insights', 'ads_management'],
      metadata: {
        adAccountId: firstAdAccount ? `act_${firstAdAccount}` : '',
        appId,
        appSecret,
      },
    });

    console.log(`[Meta OAuth] Success for brand=${brandId} user=${meData.name}`);
    return NextResponse.redirect(new URL(`/integrations?success=meta`, req.url));

  } catch (err) {
    console.error('[Meta OAuth] Error:', err);
    return NextResponse.redirect(new URL(`/integrations?error=meta_server`, req.url));
  }
}
