import { NextRequest, NextResponse } from 'next/server';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { handleSecurityError } from '@/lib/utils/api-security';
import { getServiceAccountToken, getServiceAccountEmail } from '@/lib/integrations/ads/google-service-account';
import { GOOGLE_ADS_API } from '@/lib/integrations/ads/constants';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/google/connect
 * Connects a brand to Google Ads using the platform service account.
 * Client must have added the SA email as a user in their Google Ads account.
 *
 * Body: { brandId, customerId, developerToken? }
 */
export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { brandId, customerId } = body;

  if (!brandId) return NextResponse.json({ error: 'brandId is required' }, { status: 400 });
  if (!customerId) return NextResponse.json({ error: 'customerId is required' }, { status: 400 });

  try {
    await requireBrandAccess(req, brandId);
  } catch (error) {
    return handleSecurityError(error);
  }

  // Normalize customer ID (remove dashes: 123-456-7890 → 1234567890)
  const normalizedCustomerId = customerId.replace(/-/g, '');

  try {
    // Get SA access token
    const accessToken = await getServiceAccountToken();
    const developerToken = process.env.GOOGLE_DEVELOPER_TOKEN || '';

    if (!developerToken) {
      return NextResponse.json({
        error: 'GOOGLE_DEVELOPER_TOKEN not configured on the platform.',
      }, { status: 500 });
    }

    // Test the connection: fetch customer info
    const testUrl = `${GOOGLE_ADS_API.BASE_URL}/customers/${normalizedCustomerId}`;
    const testRes = await fetch(testUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'developer-token': developerToken,
      },
    });

    if (!testRes.ok) {
      const errData = await testRes.json().catch(() => ({}));
      const msg = errData?.error?.message || testRes.statusText;

      if (testRes.status === 403) {
        return NextResponse.json({
          error: `Acesso negado. Certifique que adicionou o email ${getServiceAccountEmail()} como usuário na conta Google Ads ${customerId}.`,
          saEmail: getServiceAccountEmail(),
        }, { status: 403 });
      }

      return NextResponse.json({ error: `Google Ads error: ${msg}` }, { status: 400 });
    }

    const customerData = await testRes.json();
    const customerName = customerData?.customer?.descriptiveName || customerId;

    // Save integration to Firestore
    await setDoc(
      doc(db, 'brands', brandId, 'integrations', 'google'),
      {
        provider: 'google',
        method: 'service_account',
        customerId: normalizedCustomerId,
        customerName,
        saEmail: getServiceAccountEmail(),
        developerToken,
        connectedAt: Timestamp.now(),
        status: 'active',
      },
      { merge: true }
    );

    return NextResponse.json({
      success: true,
      customerId: normalizedCustomerId,
      customerName,
    });

  } catch (error: any) {
    console.error('[Google SA Connect] Error:', error);
    return NextResponse.json({
      error: error.message || 'Falha ao conectar com Google Ads',
    }, { status: 500 });
  }
}

/**
 * GET /api/auth/google/connect?brandId=xxx
 * Returns the SA email to display in the UI (no auth needed, it's public info).
 */
export async function GET() {
  return NextResponse.json({
    saEmail: getServiceAccountEmail(),
    instructions: [
      '1. Acesse sua conta Google Ads',
      '2. Vá em Ferramentas > Acesso e segurança > Usuários',
      '3. Clique em "+" e adicione o email abaixo com acesso "Somente leitura"',
      '4. Volte aqui, informe seu Customer ID e clique em Conectar',
    ],
  });
}
