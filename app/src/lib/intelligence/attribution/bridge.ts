import { db } from '../config';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs, 
  Timestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import { AttributionBridge, AttributionPoint, AttributionResult } from '../../../types/attribution';
import { JourneyEvent, JourneyTransaction } from '../../../types/journey';
import { AttributionEngine } from './engine';

/**
 * @class AttributionBridgeService
 * @description Serviço responsável por gerenciar a ponte de atribuição (ST-28.2).
 * Vincula IDs externos (fbclid, gclid, ttclid) ao leadId interno e consolida touchpoints.
 */
export class AttributionBridgeService {
  private static COLLECTION = 'attribution_bridges';

  /**
   * Obtém ou cria uma ponte de atribuição para um lead
   */
  public static async getBridge(leadId: string): Promise<AttributionBridge | null> {
    const bridgeRef = doc(db, this.COLLECTION, leadId);
    const bridgeSnap = await getDoc(bridgeRef);

    if (bridgeSnap.exists()) {
      return bridgeSnap.data() as AttributionBridge;
    }

    return null;
  }

  /**
   * Sincroniza eventos de jornada para atualizar a ponte de atribuição
   * @param leadId ID do lead interno
   * @param events Lista de eventos recentes para processar
   */
  public static async syncEvents(leadId: string, events: JourneyEvent[]): Promise<void> {
    const bridgeRef = doc(db, this.COLLECTION, leadId);
    const bridgeSnap = await getDoc(bridgeRef);
    
    let bridge: AttributionBridge;

    if (!bridgeSnap.exists()) {
      bridge = {
        leadId,
        externalIds: {},
        touchpoints: [],
        lastSyncAt: Timestamp.now()
      };
    } else {
      bridge = bridgeSnap.data() as AttributionBridge;
    }

    // Extrair novos IDs externos e touchpoints
    events.forEach(event => {
      const { utmSource, utmMedium, utmCampaign } = event.session;
      
      // Mapeamento de IDs de Clique (Click IDs)
      const metadata = event.payload.metadata || {};
      const fbclid = metadata.fbclid || metadata.fbc;
      const gclid = metadata.gclid;
      const ttclid = metadata.ttclid;

      if (fbclid) bridge.externalIds.meta = fbclid;
      if (gclid) bridge.externalIds.google = gclid;
      if (ttclid) bridge.externalIds.tiktok = ttclid;

      // Adicionar touchpoint se tiver UTMs ou Click IDs
      if (utmSource || utmMedium || fbclid || gclid || ttclid) {
        const point: AttributionPoint = {
          source: utmSource || '(direct)',
          medium: utmMedium || '(none)',
          campaign: utmCampaign || '(not set)',
          timestamp: event.timestamp,
          weight: 0, // O peso é calculado pelo AttributionEngine
          fbclid,
          gclid,
          ttclid
        };

        // Evitar duplicatas simples por timestamp e source
        const isDuplicate = bridge.touchpoints.some(p => 
          p.timestamp.toMillis() === point.timestamp.toMillis() && 
          p.source === point.source
        );

        if (!isDuplicate) {
          bridge.touchpoints.push(point);
        }
      }
    });

    // Ordenar touchpoints por data
    bridge.touchpoints.sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis());
    bridge.lastSyncAt = Timestamp.now();

    await setDoc(bridgeRef, bridge);
  }

  /**
   * Resolve um leadId a partir de um ID externo (ex: gclid)
   */
  public static async findLeadByExternalId(platform: 'meta' | 'google' | 'tiktok', externalId: string): Promise<string | null> {
    const q = query(
      collection(db, this.COLLECTION),
      where(`externalIds.${platform}`, '==', externalId)
    );

    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].id;
    }

    return null;
  }

  /**
   * Atribui uma transação usando os touchpoints da ponte
   */
  public static async attributeTransaction(
    transaction: JourneyTransaction, 
    model: 'linear' | 'time_decay' | 'u_shape' = 'u_shape'
  ): Promise<AttributionResult | null> {
    const bridge = await this.getBridge(transaction.leadId);
    if (!bridge || bridge.touchpoints.length === 0) return null;

    // Converter AttributionPoint de volta para JourneyEvent (parcial) para o Engine
    // O Engine espera JourneyEvent para filtrar UTMs
    const mockEvents: JourneyEvent[] = bridge.touchpoints.map((p, idx) => ({
      id: `mock_${idx}`,
      leadId: transaction.leadId,
      type: 'page_view',
      source: 'web',
      payload: { metadata: { fbclid: p.fbclid, gclid: p.gclid, ttclid: p.ttclid } },
      session: {
        sessionId: 'mock_session',
        utmSource: p.source,
        utmMedium: p.medium,
        utmCampaign: p.campaign
      },
      timestamp: p.timestamp
    }));

    switch (model) {
      case 'linear':
        return AttributionEngine.linear(mockEvents, transaction);
      case 'time_decay':
        return AttributionEngine.timeDecay(mockEvents, transaction);
      case 'u_shape':
      default:
        return AttributionEngine.uShape(mockEvents, transaction);
    }
  }

  /**
   * Job de Integração: Busca transações recentes e processa a atribuição
   */
  public static async processRecentTransactions(brandId: string, limitCount: number = 50): Promise<void> {
    const transactionsRef = collection(db, 'brands', brandId, 'transactions');
    const q = query(transactionsRef, orderBy('createdAt', 'desc'), limit(limitCount));
    const snap = await getDocs(q);

    for (const docSnap of snap.docs) {
      const transaction = docSnap.data() as JourneyTransaction;
      const result = await this.attributeTransaction(transaction);
      
      if (result) {
        // Salvar resultado da atribuição para análise de MMM e Overlap
        const resultRef = doc(db, 'brands', brandId, 'attribution_results', transaction.id);
        await setDoc(resultRef, {
          ...result,
          processedAt: Timestamp.now()
        });
      }
    }
  }
}
