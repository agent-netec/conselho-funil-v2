import { MetaAdsAdapter } from '../adapters/meta';
import { MonaraTokenVault, type MetaTokenMetadata } from '../../firebase/vault';
import { collection, query, where, getDocs, limit, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';

/**
 * @fileoverview Sincronizador de Lookalikes (S30-META-04)
 * Exporta leads "Hot" para Meta Custom Audiences via Graph API real.
 *
 * DT-03 BLOCKING fix: 
 *   1. Query scoped por brandId: brands/{brandId}/leads (não collection raiz)
 *   2. Constructor usa brandId (não metaToken)
 *   3. Signature simplificada: apenas brandId (token vem do vault)
 */

export class AdsLookalikeSync {
  /**
   * Sincroniza os top leads (Hot) com o Meta Ads via Custom Audiences.
   * 
   * S30-META-04: Signature mudou de (brandId, metaToken, adAccountId) → (brandId).
   * Token e adAccountId vêm do vault (PA-03, PA-04).
   */
  static async syncHotLeadsToMeta(brandId: string) {
    console.log(`[AdsLookalikeSync] Starting sync for brand ${brandId}`);

    // 1. Buscar credenciais do vault (PA-03: tokens vêm do vault, não de parâmetro)
    const token = await MonaraTokenVault.getToken(brandId, 'meta');
    if (!token) {
      throw new Error(`Meta token not found for brand ${brandId}`);
    }
    const metadata = token.metadata as MetaTokenMetadata;

    // 2. Buscar leads "Hot" no Firestore — DT-03 FIX: scoped por brandId
    const leadsRef = collection(db, 'brands', brandId, 'leads');
    const q = query(
      leadsRef,
      where('segment', '==', 'hot'),  // Campo PropensityEngine (S28)
      limit(100)
    );

    const snap = await getDocs(q);

    if (snap.empty) {
      console.log('[AdsLookalikeSync] No hot leads found for sync.');
      return { success: true, count: 0 };
    }

    const leadIds = snap.docs.map(d => d.id);

    // 3. Usar adapter com brandId correto — DT-03 FIX: brandId, não metaToken
    const metaAdapter = new MetaAdsAdapter(brandId, metadata?.adAccountId);

    // 4. Chamar syncCustomAudience real (implementado em META-03)
    const audienceId = (metadata as any)?.audienceId || '';
    if (!audienceId) {
      console.warn(`[AdsLookalikeSync] No audienceId configured for brand ${brandId}`);
      return { success: false, count: 0, error: 'No audienceId configured' };
    }

    const result = await metaAdapter.syncCustomAudience(audienceId, leadIds);

    console.log(`[AdsLookalikeSync] Sync complete: ${leadIds.length} leads, success=${result.success}`);

    return {
      success: result.success,
      count: leadIds.length,
      platform: 'meta' as const,
      syncedAt: Timestamp.now(),
    };
  }
}
