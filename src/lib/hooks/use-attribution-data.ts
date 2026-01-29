'use client';

import { useState, useEffect } from 'react';
import { useActiveBrand } from './use-active-brand';
import { db } from '../firebase/config';
import { collection, query, where, getDocs, Timestamp, orderBy } from 'firebase/firestore';
import { AttributionEngine } from '../intelligence/attribution/engine';
import { JourneyEvent, JourneyTransaction } from '@/types/journey';
import { CampaignAttributionStats, AttributionModel } from '@/types/attribution';

/**
 * Hook para processar e retornar dados de atribuição para o dashboard.
 * Integra o AttributionEngine com os dados reais do Firestore (events e transactions).
 */
export function useAttributionData(days: number = 30) {
  const { activeBrand } = useActiveBrand();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CampaignAttributionStats[]>([]);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!activeBrand?.id) return;

    async function fetchAndProcess() {
      setLoading(true);
      try {
        const now = Timestamp.now();
        const startDate = new Timestamp(now.seconds - (days * 24 * 60 * 60), 0);

        // 1. Buscar transações da marca no período
        const transactionsRef = collection(db, 'transactions');
        const qTransactions = query(
          transactionsRef,
          where('brandId', '==', activeBrand!.id),
          where('createdAt', '>=', startDate),
          orderBy('createdAt', 'desc')
        );
        const transactionSnap = await getDocs(qTransactions);
        const transactions = transactionSnap.docs.map(d => ({ id: d.id, ...d.data() } as JourneyTransaction));

        if (transactions.length === 0) {
          setStats([]);
          setLoading(false);
          return;
        }

        // 2. Para cada transação, buscar os eventos do lead
        // Em um cenário real, isso seria otimizado via Cloud Function ou batching
        const campaignAggregation: Record<string, CampaignAttributionStats> = {};

        for (const transaction of transactions) {
          const eventsRef = collection(db, 'events');
          const qEvents = query(
            eventsRef,
            where('leadId', '==', transaction.leadId),
            orderBy('timestamp', 'asc')
          );
          const eventSnap = await getDocs(qEvents);
          const events = eventSnap.docs.map(d => ({ id: d.id, ...d.data() } as JourneyEvent));

          // 3. Aplicar modelos de atribuição
          const models: AttributionModel[] = ['last_touch', 'linear', 'u_shape', 'time_decay'];
          
          models.forEach(model => {
            let result;
            switch(model) {
              case 'linear': result = AttributionEngine.linear(events, transaction); break;
              case 'u_shape': result = AttributionEngine.uShape(events, transaction); break;
              case 'time_decay': result = AttributionEngine.timeDecay(events, transaction); break;
              default: // last_touch (simulado via engine se necessário ou lógica simples)
                const validEvents = events.filter(e => e.session.utmCampaign);
                const lastEvent = validEvents[validEvents.length - 1];
                result = {
                  points: lastEvent ? [{
                    source: lastEvent.session.utmSource || '(direct)',
                    medium: lastEvent.session.utmMedium || '(none)',
                    campaign: lastEvent.session.utmCampaign || '(not set)',
                    weight: 1.0
                  }] : []
                };
            }

            // 4. Agregar por campanha
            result.points.forEach(point => {
              const campaignKey = point.campaign;
              if (!campaignAggregation[campaignKey]) {
                campaignAggregation[campaignKey] = {
                  campaignName: campaignKey,
                  spend: 0, // Spend viria de outra API (Meta/Google)
                  conversions: { last_touch: 0, first_touch: 0, linear: 0, time_decay: 0, u_shape: 0 },
                  roi: { last_touch: 0, first_touch: 0, linear: 0, time_decay: 0, u_shape: 0 },
                  variation: 0
                };
              }

              campaignAggregation[campaignKey].conversions[model] += point.weight;
            });
          });
        }

        // 5. Calcular variações e formatar para o componente
        const finalStats = Object.values(campaignAggregation).map(s => {
          const last = s.conversions.last_touch || 0.001; // evitar div por zero
          const multi = s.conversions.u_shape;
          return {
            ...s,
            variation: ((multi / last) - 1) * 100
          };
        }).sort((a, b) => b.conversions.u_shape - a.conversions.u_shape);

        setStats(finalStats);
      } catch (err: any) {
        console.error('Error in useAttributionData:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    fetchAndProcess();
  }, [activeBrand?.id, days]);

  return { stats, loading, error };
}
