/**
 * Google Ads Service Account Auth
 * Generates access tokens from the platform service account key (no OAuth popup needed).
 * Clients grant access by adding the SA email as a user in their Google Ads account.
 */

const SA_EMAIL = process.env.GOOGLE_ADS_SERVICE_ACCOUNT_EMAIL || '';
const SA_KEY_B64 = process.env.GOOGLE_ADS_SERVICE_ACCOUNT_KEY || '';

const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const GOOGLE_ADS_SCOPE = 'https://www.googleapis.com/auth/adwords';

// Simple in-memory cache (per cold start, ~1h validity)
let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * Get a valid Google Ads access token using the platform service account.
 * Caches the token until 5 minutes before expiry.
 */
export async function getServiceAccountToken(): Promise<string> {
  const now = Date.now();

  if (cachedToken && cachedToken.expiresAt > now + 5 * 60 * 1000) {
    return cachedToken.token;
  }

  if (!SA_EMAIL || !SA_KEY_B64) {
    throw new Error('GOOGLE_ADS_SERVICE_ACCOUNT_KEY or EMAIL not configured');
  }

  // Decode base64 key
  const keyJson = JSON.parse(Buffer.from(SA_KEY_B64, 'base64').toString('utf-8'));
  const privateKey = keyJson.private_key as string;

  // Build JWT
  const iat = Math.floor(now / 1000);
  const exp = iat + 3600;

  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: SA_EMAIL,
    scope: GOOGLE_ADS_SCOPE,
    aud: TOKEN_ENDPOINT,
    iat,
    exp,
  };

  const b64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
  const b64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signingInput = `${b64Header}.${b64Payload}`;

  // Sign with RS256 using Node.js crypto
  const { createSign } = await import('crypto');
  const sign = createSign('RSA-SHA256');
  sign.update(signingInput);
  const signature = sign.sign(privateKey, 'base64url');

  const jwt = `${signingInput}.${signature}`;

  // Exchange JWT for access token
  const res = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }).toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Service account token error: ${err}`);
  }

  const data = await res.json();

  if (!data.access_token) {
    throw new Error(`No access_token in response: ${JSON.stringify(data)}`);
  }

  cachedToken = {
    token: data.access_token,
    expiresAt: now + (data.expires_in || 3600) * 1000,
  };

  return cachedToken.token;
}

/**
 * Email the client should add as a Google Ads user.
 * Standard access level: Read only is enough for metrics.
 * Admin access needed for creating/managing campaigns.
 */
export function getServiceAccountEmail(): string {
  return SA_EMAIL;
}
