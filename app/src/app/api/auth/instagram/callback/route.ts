export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { Timestamp } from 'firebase/firestore';
import { MonaraTokenVault } from '@/lib/firebase/vault';
import { META_API } from '@/lib/integrations/ads/constants';

/**
 * GET /api/auth/instagram/callback
 * OAuth callback for Instagram — shares Graph API with Meta.
 * Uses Facebook Login with instagram_basic + pages_show_list scopes.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // brandId
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL(`/integrations?error=instagram_denied`, req.url));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL(`/integrations?error=instagram_missing_params`, req.url));
  }

  const brandId = state;
  const appId = process.env.META_APP_ID;
  const appSecret = (process.env.META_APP_SECRET || '').trim();
  const redirectUri = `${new URL(req.url).origin}/api/auth/instagram/callback`;

  if (!appId || !appSecret) {
    console.error('[Instagram OAuth] Missing META_APP_ID or META_APP_SECRET env vars');
    return NextResponse.redirect(new URL(`/integrations?error=instagram_config`, req.url));
  }

  try {
    // Exchange code for token (uses Meta Graph API)
    const tokenUrl = `${META_API.BASE_URL}/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`;
    const tokenRes = await fetch(tokenUrl);
    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      console.error('[Instagram OAuth] Token exchange failed:', tokenData.error);
      return NextResponse.redirect(new URL(`/integrations?error=instagram_token_exchange`, req.url));
    }

    // Exchange for long-lived token
    const longLivedUrl = `${META_API.BASE_URL}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${tokenData.access_token}`;
    const longLivedRes = await fetch(longLivedUrl);
    const longLivedData = await longLivedRes.json();

    const accessToken = longLivedData.access_token || tokenData.access_token;
    const expiresIn = longLivedData.expires_in || 5184000;

    // Get Instagram Business Account via pages
    const pagesRes = await fetch(`${META_API.BASE_URL}/me/accounts?fields=instagram_business_account,name&access_token=${accessToken}`);
    const pagesData = await pagesRes.json();
    const igAccountId = pagesData.data?.[0]?.instagram_business_account?.id || '';

    // Save to MonaraTokenVault
    await MonaraTokenVault.saveToken(brandId, {
      brandId,
      provider: 'instagram',
      accessToken,
      expiresAt: Timestamp.fromMillis(Date.now() + expiresIn * 1000),
      scopes: ['instagram_basic', 'instagram_manage_insights', 'pages_show_list'],
      metadata: {
        instagramAccountId: igAccountId,
        appId,
        appSecret,
      },
    });

    console.log(`[Instagram OAuth] Success for brand=${brandId} igAccount=${igAccountId}`);
    return NextResponse.redirect(new URL(`/integrations?success=instagram`, req.url));

  } catch (err) {
    console.error('[Instagram OAuth] Error:', err);
    return NextResponse.redirect(new URL(`/integrations?error=instagram_server`, req.url));
  }
}
