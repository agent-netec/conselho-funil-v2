'use client';

import { useState, useEffect } from 'react';
import { useActiveBrand } from './use-active-brand';
import { db } from '../firebase/config';
import { collection, query, where, getDocs, Timestamp, orderBy } from 'firebase/firestore';
import { AttributionEngine } from '../intelligence/attribution/engine';
import { JourneyEvent, JourneyTransaction } from '@/types/journey';
import { CampaignAttributionStats, AttributionModel } from '@/types/attribution';
import { PerformanceMetric } from '@/types/performance';

/**
 * Hook para processar e retornar dados de atribuição para o dashboard.
 * Integra o AttributionEngine com os dados reais do Firestore (events e transactions).
 * Sprint 27: Conecta spend real de performance_metrics (DT-02 Opção A — hook direto).
 */
export function useAttributionData(days: number = 30) {
  const activeBrand = useActiveBrand();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CampaignAttributionStats[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [hasSpendData, setHasSpendData] = useState(false);

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
          setHasSpendData(false);
          setLoading(false);
          return;
        }

        // 2. Buscar spend de performance_metrics (Sprint 27 — DT-02 Opção A)
        // Collection: brands/{brandId}/performance_metrics
        const metricsRef = collection(db, 'brands', activeBrand!.id, 'performance_metrics');
        const qMetrics = query(
          metricsRef,
          where('timestamp', '>=', startDate),
          orderBy('timestamp', 'desc')
        );
        const metricsSnap = await getDocs(qMetrics);
        const metrics = metricsSnap.docs.map(d => ({ id: d.id, ...d.data() } as PerformanceMetric));

        // Agregar spend total por source (platform)
        const spendBySource: Record<string, number> = {};
        let totalSpend = 0;
        for (const metric of metrics) {
          const source = metric.source || 'organic';
          spendBySource[source] = (spendBySource[source] || 0) + (metric.data?.spend || 0);
          totalSpend += metric.data?.spend || 0;
        }
        const spendDataAvailable = totalSpend > 0;
        setHasSpendData(spendDataAvailable);

        // 3. Para cada transação, buscar os eventos do lead e agregar
        const campaignAggregation: Record<string, CampaignAttributionStats & { _eventCountBySource: Record<string, number> }> = {};

        for (const transaction of transactions) {
          const eventsRef = collection(db, 'events');
          const qEvents = query(
            eventsRef,
            where('leadId', '==', transaction.leadId),
            orderBy('timestamp', 'asc')
          );
          const eventSnap = await getDocs(qEvents);
          const events = eventSnap.docs.map(d => ({ id: d.id, ...d.data() } as JourneyEvent));

          // 4. Aplicar modelos de atribuição
          const models: AttributionModel[] = ['last_touch', 'linear', 'u_shape', 'time_decay'];
          
          models.forEach(model => {
            let result;
            switch(model) {
              case 'linear': result = AttributionEngine.linear(events, transaction); break;
              case 'u_shape': result = AttributionEngine.uShape(events, transaction); break;
              case 'time_decay': result = AttributionEngine.timeDecay(events, transaction); break;
              default: // last_touch
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

            // 5. Agregar por campanha
            result.points.forEach(point => {
              const campaignKey = point.campaign;
              if (!campaignAggregation[campaignKey]) {
                campaignAggregation[campaignKey] = {
                  campaignName: campaignKey,
                  spend: 0,
                  conversions: { last_touch: 0, first_touch: 0, linear: 0, time_decay: 0, u_shape: 0 },
                  roi: { last_touch: 0, first_touch: 0, linear: 0, time_decay: 0, u_shape: 0 },
                  variation: 0,
                  _eventCountBySource: {},
                };
              }

              campaignAggregation[campaignKey].conversions[model] += point.weight;

              // Rastrear contagem de eventos por source para distribuição proporcional de spend
              const source = mapUtmSourceToMetricSource(point.source);
              campaignAggregation[campaignKey]._eventCountBySource[source] =
                (campaignAggregation[campaignKey]._eventCountBySource[source] || 0) + 1;
            });
          });
        }

        // 6. Distribuir spend proporcional por campanha (Sprint 27)
        if (spendDataAvailable) {
          // Calcular total de eventos por source (para distribuição proporcional)
          const totalEventsBySource: Record<string, number> = {};
          for (const agg of Object.values(campaignAggregation)) {
            for (const [source, count] of Object.entries(agg._eventCountBySource)) {
              totalEventsBySource[source] = (totalEventsBySource[source] || 0) + count;
            }
          }

          // Distribuir spend por campanha com base na proporção de eventos
          for (const agg of Object.values(campaignAggregation)) {
            let campaignSpend = 0;
            for (const [source, count] of Object.entries(agg._eventCountBySource)) {
              const sourceSpend = spendBySource[source] || 0;
              const sourceTotal = totalEventsBySource[source] || 1;
              campaignSpend += (sourceSpend * count) / sourceTotal;
            }
            agg.spend = Math.round(campaignSpend * 100) / 100;
          }
        }

        // 7. Calcular variações, ROI e formatar para o componente
        const finalStats: CampaignAttributionStats[] = Object.values(campaignAggregation).map(s => {
          const last = s.conversions.last_touch || 0.001; // evitar div por zero
          const multi = s.conversions.u_shape;

          // Calcular ROI por modelo (conversions * revenue / spend)
          const roi: Record<AttributionModel, number> = {
            last_touch: 0, first_touch: 0, linear: 0, time_decay: 0, u_shape: 0,
          };
          if (s.spend > 0) {
            const models: AttributionModel[] = ['last_touch', 'first_touch', 'linear', 'time_decay', 'u_shape'];
            for (const model of models) {
              roi[model] = Math.round(((s.conversions[model] || 0) / s.spend) * 10000) / 100;
            }
          }

          return {
            campaignName: s.campaignName,
            spend: s.spend,
            conversions: s.conversions,
            roi,
            variation: ((multi / last) - 1) * 100,
          };
        }).sort((a, b) => b.conversions.u_shape - a.conversions.u_shape);

        setStats(finalStats);
      } catch (err: unknown) {
        console.error('Error in useAttributionData:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    }

    fetchAndProcess();
  }, [activeBrand?.id, days]);

  return { stats, loading, error, hasSpendData };
}

/**
 * Mapeia UTM source (ex: "facebook", "google", "instagram") para o source
 * usado em PerformanceMetric ("meta", "google", "organic").
 */
function mapUtmSourceToMetricSource(utmSource: string): string {
  const normalized = utmSource.toLowerCase();
  if (normalized.includes('facebook') || normalized.includes('meta') || normalized.includes('instagram')) {
    return 'meta';
  }
  if (normalized.includes('google') || normalized.includes('gclid')) {
    return 'google';
  }
  if (normalized.includes('tiktok')) {
    return 'tiktok';
  }
  return 'organic';
}
