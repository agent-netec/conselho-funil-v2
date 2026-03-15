import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { requireUser } from '@/lib/auth/brand-guard';
import { handleSecurityError } from '@/lib/utils/api-security';
import { getPineconeIndex } from '@/lib/ai/pinecone';
import { getStorage } from 'firebase-admin/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120; // Account deletion can take time

/**
 * LGPD Account Deletion Endpoint
 * Permanently deletes all user data from:
 * - Firestore (user doc, brands, assets, funnels, conversations, campaigns)
 * - Pinecone (vector embeddings by brandId namespace)
 * - Firebase Storage (uploaded files)
 *
 * Required by LGPD (Lei Geral de Proteção de Dados) - Art. 18, VI.
 *
 * WARNING: This action is IRREVERSIBLE.
 *
 * POST /api/user/delete-account
 * Requires: Authorization: Bearer <idToken>
 * Body: { confirmation: "DELETE MY ACCOUNT" }
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Verify authentication
    const userId = await requireUser(req);

    // 2. Require explicit confirmation
    const body = await req.json();
    if (body.confirmation !== 'DELETE MY ACCOUNT') {
      return NextResponse.json(
        {
          success: false,
          error: 'Confirmacao necessaria. Envie { confirmation: "DELETE MY ACCOUNT" } no body.',
        },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    const bucket = getStorage().bucket();
    const deletionLog: string[] = [];

    // 3. Get all brands first (needed for Pinecone and Storage cleanup)
    const brandsSnap = await db.collection('brands').where('userId', '==', userId).get();
    const brandIds = brandsSnap.docs.map((doc) => doc.id);

    // 4. Delete from Pinecone (vector embeddings)
    try {
      const index = await getPineconeIndex();
      if (index) {
        for (const brandId of brandIds) {
          const namespacesToDelete = [
            `brand_${brandId}`,
            `brand-${brandId}`,
          ];

          for (const ns of namespacesToDelete) {
            try {
              const target = index.namespace(ns);
              // Delete all vectors in namespace
              await target.deleteAll();
              deletionLog.push(`Pinecone namespace: ${ns}`);
            } catch (err: any) {
              // Namespace might not exist, continue
              console.warn(`[LGPD Delete] Pinecone namespace ${ns} not found or error:`, err.message);
            }
          }
        }
      }
    } catch (err) {
      console.error('[LGPD Delete] Pinecone deletion error:', err);
      // Continue with Firestore deletion even if Pinecone fails
    }

    // 5. Delete Storage files for each brand
    for (const brandDoc of brandsSnap.docs) {
      const brandId = brandDoc.id;

      // Get all assets to find storage paths
      const assetsSnap = await db.collection('brands').doc(brandId).collection('assets').get();
      for (const assetDoc of assetsSnap.docs) {
        const assetData = assetDoc.data();
        if (assetData.storagePath || assetData.url) {
          try {
            // Try storagePath first, fallback to url
            const path = assetData.storagePath || assetData.url;
            await bucket.file(path).delete();
            deletionLog.push(`Storage: ${path}`);
          } catch (err: any) {
            // File might not exist, continue
            console.warn(`[LGPD Delete] Storage file deletion error:`, err.message);
          }
        }

        // Delete asset document
        await assetDoc.ref.delete();
      }

      // Delete vault assets subcollection
      const vaultAssetsSnap = await db.collection('brands').doc(brandId).collection('vault').doc('assets').collection('items').get();
      for (const vaultAsset of vaultAssetsSnap.docs) {
        const vaultData = vaultAsset.data();
        if (vaultData.storagePath) {
          try {
            await bucket.file(vaultData.storagePath).delete();
          } catch {
            // Continue
          }
        }
        await vaultAsset.ref.delete();
      }

      // Delete brand document
      await brandDoc.ref.delete();
      deletionLog.push(`Brand: ${brandId}`);
    }

    // 6. Delete funnels and subcollections
    const funnelsSnap = await db.collection('funnels').where('userId', '==', userId).get();
    for (const funnelDoc of funnelsSnap.docs) {
      // Delete proposals subcollection
      const proposalsSnap = await db.collection('funnels').doc(funnelDoc.id).collection('proposals').get();
      for (const proposal of proposalsSnap.docs) {
        await proposal.ref.delete();
      }

      // Delete decisions subcollection
      const decisionsSnap = await db.collection('funnels').doc(funnelDoc.id).collection('decisions').get();
      for (const decision of decisionsSnap.docs) {
        await decision.ref.delete();
      }

      await funnelDoc.ref.delete();
      deletionLog.push(`Funnel: ${funnelDoc.id}`);
    }

    // 7. Delete conversations and messages
    const conversationsSnap = await db.collection('conversations').where('userId', '==', userId).get();
    for (const convDoc of conversationsSnap.docs) {
      // Delete messages subcollection
      const messagesSnap = await db.collection('conversations').doc(convDoc.id).collection('messages').get();
      for (const message of messagesSnap.docs) {
        await message.ref.delete();
      }

      await convDoc.ref.delete();
      deletionLog.push(`Conversation: ${convDoc.id}`);
    }

    // 8. Delete campaigns
    const campaignsSnap = await db.collection('campaigns').where('userId', '==', userId).get();
    for (const campaignDoc of campaignsSnap.docs) {
      await campaignDoc.ref.delete();
      deletionLog.push(`Campaign: ${campaignDoc.id}`);
    }

    // 9. Delete integrations if user has a tenant
    const userDoc = await db.collection('users').doc(userId).get();
    if (userDoc.exists) {
      const tenantId = userDoc.data()?.tenantId;
      if (tenantId) {
        const integrationsSnap = await db.collection('tenants').doc(tenantId).collection('integrations').get();
        for (const integration of integrationsSnap.docs) {
          await integration.ref.delete();
          deletionLog.push(`Integration: ${integration.id}`);
        }
      }
    }

    // 10. Delete consent records
    const consentSnap = await db.collection('users').doc(userId).collection('consent').get();
    for (const consentDoc of consentSnap.docs) {
      await consentDoc.ref.delete();
    }

    // 11. Delete user document (last)
    await db.collection('users').doc(userId).delete();
    deletionLog.push(`User: ${userId}`);

    // 12. Return success
    return NextResponse.json({
      success: true,
      message: 'Conta excluida com sucesso. Todos os seus dados foram permanentemente removidos.',
      deletedItems: deletionLog.length,
      log: deletionLog,
    });
  } catch (error) {
    return handleSecurityError(error);
  }
}
