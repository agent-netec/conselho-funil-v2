import { db } from '../config';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  Timestamp,
  doc,
  setDoc
} from 'firebase/firestore';
import { AttributionBridge } from '../../types/attribution';
import { ChannelOverlapDoc } from '../../types/cross-channel';

/**
 * @class ChannelOverlapAnalyzer
 * @description Motor que identifica padrões de comportamento cross-channel (ST-28.3).
 * Analisa o overlap entre diferentes canais pagos e orgânicos antes da conversão.
 */
export class ChannelOverlapAnalyzer {
  private static BRIDGE_COLLECTION = 'attribution_bridges';
  private static OVERLAP_COLLECTION = 'channel_overlaps';

  /**
   * Gera um relatório de overlap para uma marca em um período específico
   */
  public static async analyze(brandId: string, startDate: Date, endDate: Date): Promise<ChannelOverlapDoc> {
    const startTs = Timestamp.fromDate(startDate);
    const endTs = Timestamp.fromDate(endDate);

    // 1. Buscar todas as pontes que tiveram atividade no período
    // Nota: Em um cenário real, filtraríamos por transações ocorridas no período
    // e buscaríamos as pontes desses leads.
    const q = query(
      collection(db, this.BRIDGE_COLLECTION),
      where('lastSyncAt', '>=', startTs),
      where('lastSyncAt', '<=', endTs)
    );

    const bridgeSnaps = await getDocs(q);
    const bridges = bridgeSnaps.docs.map(d => d.data() as AttributionBridge);

    const overlapMap: Record<string, { conversions: number; revenue: number; path: string[] }> = {};
    let totalConversions = 0;

    bridges.forEach(bridge => {
      if (bridge.touchpoints.length === 0) return;

      // 2. Extrair o caminho único de canais (deduplicado sequencialmente)
      // Ex: [Meta, Meta, Google, Meta] -> [Meta, Google, Meta]
      const path: string[] = [];
      bridge.touchpoints.forEach(tp => {
        const source = this.normalizeSource(tp.source);
        if (path.length === 0 || path[path.length - 1] !== source) {
          path.push(source);
        }
      });

      const pathKey = path.join(' > ');
      if (!overlapMap[pathKey]) {
        overlapMap[pathKey] = { conversions: 0, revenue: 0, path };
      }

      // 3. Incrementar métricas (aqui assumimos 1 conversão por ponte para simplificar a ST-28.3)
      // Em produção, cruzaríamos com a collection 'transactions'
      overlapMap[pathKey].conversions += 1;
      totalConversions += 1;
    });

    // 4. Formatar resultados para o schema ChannelOverlapDoc
    const overlaps = Object.values(overlapMap).map(item => ({
      path: item.path,
      conversions: item.conversions,
      revenue: item.revenue,
      percentage: totalConversions > 0 ? (item.conversions / totalConversions) * 100 : 0
    })).sort((a, b) => b.conversions - a.conversions);

    const result: ChannelOverlapDoc = {
      brandId,
      period: {
        start: startTs,
        end: endTs
      },
      overlaps
    };

    // 5. Persistir o resultado da análise
    const docId = `overlap_${brandId}_${startDate.toISOString().split('T')[0]}`;
    await setDoc(doc(db, this.OVERLAP_COLLECTION, docId), result);

    return result;
  }

  /**
   * Normaliza o nome da fonte para agrupamento
   */
  private static normalizeSource(source: string): string {
    const s = source.toLowerCase();
    if (s.includes('facebook') || s.includes('instagram') || s.includes('meta')) return 'Meta';
    if (s.includes('google') || s.includes('gads') || s.includes('youtube')) return 'Google';
    if (s.includes('tiktok')) return 'TikTok';
    if (s.includes('email') || s.includes('klaviyo') || s.includes('activecampaign')) return 'Email';
    if (s === '(direct)') return 'Direto';
    return source;
  }

  /**
   * Identifica "Vendas Assistidas"
   * Um canal recebe crédito de assistência se ele aparece no caminho mas não é o último toque.
   */
  public static calculateAssistedSales(overlaps: ChannelOverlapDoc['overlaps']): Record<string, number> {
    const assisted: Record<string, number> = {};

    overlaps.forEach(overlap => {
      const path = overlap.path;
      if (path.length < 2) return;

      // Todos exceto o último canal no caminho são considerados "assistentes"
      const assistants = new Set(path.slice(0, -1));
      assistants.forEach(channel => {
        assisted[channel] = (assisted[channel] || 0) + overlap.conversions;
      });
    });

    return assisted;
  }
}
