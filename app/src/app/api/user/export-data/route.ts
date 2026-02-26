import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { requireUser } from '@/lib/auth/brand-guard';
import { handleSecurityError } from '@/lib/utils/api-security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * LGPD Data Export Endpoint
 * Returns all user data as JSON for portability.
 * Required by LGPD (Lei Geral de Proteção de Dados) - Art. 18, V.
 *
 * POST /api/user/export-data
 * Requires: Authorization: Bearer <idToken>
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Verify authentication
    const userId = await requireUser(req);
    const db = getAdminFirestore();

    // 2. Collect all user data
    const exportData: Record<string, unknown> = {
      exportedAt: new Date().toISOString(),
      userId,
    };

    // 2.1 User profile
    const userDoc = await db.collection('users').doc(userId).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      // Remove sensitive internal fields
      const { password, passwordHash, ...safeUserData } = userData || {};
      exportData.profile = {
        id: userId,
        ...safeUserData,
      };
    }

    // 2.2 Consent records (subcollection)
    const consentSnap = await db.collection('users').doc(userId).collection('consent').get();
    exportData.consentRecords = consentSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // 2.3 Brands
    const brandsSnap = await db.collection('brands').where('userId', '==', userId).get();
    const brands = brandsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    exportData.brands = brands;

    // 2.4 Brand Assets (for each brand)
    const allAssets: Array<Record<string, unknown>> = [];
    for (const brand of brandsSnap.docs) {
      const assetsSnap = await db.collection('brands').doc(brand.id).collection('assets').get();
      for (const asset of assetsSnap.docs) {
        const assetData = asset.data();
        // Export metadata only, not the actual file content
        allAssets.push({
          id: asset.id,
          brandId: brand.id,
          name: assetData.name,
          type: assetData.type,
          status: assetData.status,
          createdAt: assetData.createdAt,
          // Note: URL is included but file content is not exported
          url: assetData.url,
          metadata: assetData.metadata,
        });
      }
    }
    exportData.brandAssets = allAssets;

    // 2.5 Funnels
    const funnelsSnap = await db.collection('funnels').where('userId', '==', userId).get();
    const funnels: Array<Record<string, unknown>> = [];
    for (const funnel of funnelsSnap.docs) {
      const funnelData = funnel.data();

      // Get proposals subcollection
      const proposalsSnap = await db.collection('funnels').doc(funnel.id).collection('proposals').get();
      const proposals = proposalsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Get decisions subcollection
      const decisionsSnap = await db.collection('funnels').doc(funnel.id).collection('decisions').get();
      const decisions = decisionsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      funnels.push({
        id: funnel.id,
        ...funnelData,
        proposals,
        decisions,
      });
    }
    exportData.funnels = funnels;

    // 2.6 Conversations and Messages
    const conversationsSnap = await db.collection('conversations').where('userId', '==', userId).get();
    const conversations: Array<Record<string, unknown>> = [];
    for (const conv of conversationsSnap.docs) {
      const convData = conv.data();

      // Get messages subcollection
      const messagesSnap = await db.collection('conversations').doc(conv.id).collection('messages').get();
      const messages = messagesSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      conversations.push({
        id: conv.id,
        ...convData,
        messages,
      });
    }
    exportData.conversations = conversations;

    // 2.7 Campaigns
    const campaignsSnap = await db.collection('campaigns').where('userId', '==', userId).get();
    exportData.campaigns = campaignsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // 2.8 Integrations (if user has a tenant)
    if (userDoc.exists) {
      const tenantId = userDoc.data()?.tenantId;
      if (tenantId) {
        const integrationsSnap = await db.collection('tenants').doc(tenantId).collection('integrations').get();
        exportData.integrations = integrationsSnap.docs.map((doc) => {
          const data = doc.data();
          // Remove sensitive tokens
          const { accessToken, refreshToken, apiKey, ...safeData } = data.config || {};
          return {
            id: doc.id,
            provider: data.provider,
            status: data.status,
            createdAt: data.createdAt,
            // Config without tokens
            configKeys: Object.keys(data.config || {}),
          };
        });
      }
    }

    // 3. Return the data
    return NextResponse.json({
      success: true,
      data: exportData,
      message: 'Dados exportados com sucesso. Este arquivo contém todas as suas informacoes pessoais armazenadas em nossa plataforma.',
    });
  } catch (error) {
    return handleSecurityError(error);
  }
}
