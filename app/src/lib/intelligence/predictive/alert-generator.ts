import { Timestamp } from 'firebase/firestore';
import type {
  AudienceForecast,
  ChurnBatchResult,
  LTVBatchResult,
  PredictiveAlert,
  PredictiveAlertType,
} from '@/types/predictive';

interface AlertThresholds {
  churnImminentCount: number;
  upsellMultiplier: number;
  segmentShiftPercent: number;
  minSegmentLeads: number;
}

const DEFAULT_THRESHOLDS: AlertThresholds = {
  churnImminentCount: 3,
  upsellMultiplier: 2,
  segmentShiftPercent: 20,
  minSegmentLeads: 10,
};

function createAlert(
  brandId: string,
  type: PredictiveAlertType,
  severity: PredictiveAlert['severity'],
  title: string,
  description: string,
  data: Record<string, unknown>
): PredictiveAlert {
  const ts = Timestamp.now();
  return {
    id: `${type}-${ts.toMillis()}`,
    brandId,
    type,
    severity,
    title,
    description,
    data,
    dismissed: false,
    createdAt: ts,
  };
}

export class PredictiveAlertGenerator {
  static generateAlerts(
    brandId: string,
    churnData: ChurnBatchResult,
    ltvData: LTVBatchResult,
    forecastData: AudienceForecast,
    thresholds: Partial<AlertThresholds> = {}
  ): PredictiveAlert[] {
    const cfg = { ...DEFAULT_THRESHOLDS, ...thresholds };
    const alerts: PredictiveAlert[] = [];

    if (churnData.totalLeads >= cfg.minSegmentLeads) {
      const hotCritical = churnData.predictions.filter(
        (p) => p.currentSegment === 'hot' && p.churnRisk >= 0.7
      ).length;
      if (hotCritical >= cfg.churnImminentCount) {
        alerts.push(
          createAlert(
            brandId,
            'churn_imminent',
            'critical',
            'Churn iminente em leads quentes',
            `${hotCritical} leads hot com risco critico de churn.`,
            { hotCritical }
          )
        );
      }
    }

    const warm = ltvData.cohorts.find((c) => c.segment === 'warm');
    if (warm && warm.leadsInCohort >= cfg.minSegmentLeads) {
      if (warm.avgRevenuePerLead > 0 && warm.projectedLTV.m3 > warm.avgRevenuePerLead * cfg.upsellMultiplier) {
        alerts.push(
          createAlert(
            brandId,
            'upsell_opportunity',
            'info',
            'Oportunidade de upsell no segmento warm',
            'Projeção m3 acima do multiplicador esperado para campanhas de expansão.',
            { projectedM3: warm.projectedLTV.m3, avgRevenuePerLead: warm.avgRevenuePerLead }
          )
        );
      }
    }

    if (forecastData.currentDistribution.hot >= cfg.minSegmentLeads) {
      const hotCurrent = Math.max(1, forecastData.currentDistribution.hot);
      const drop = ((hotCurrent - forecastData.projections.days14.hot) / hotCurrent) * 100;
      if (drop > cfg.segmentShiftPercent) {
        alerts.push(
          createAlert(
            brandId,
            'segment_shift',
            'warning',
            'Mudança de segmento acelerada',
            `Queda projetada de ${Math.round(drop)}% em hot nos próximos 14 dias.`,
            { dropPercent: drop }
          )
        );
      }
    }

    if (ltvData.overallLTV > 0 && ltvData.cohorts.some((c) => c.leadsInCohort >= cfg.minSegmentLeads)) {
      alerts.push(
        createAlert(
          brandId,
          'ltv_milestone',
          'info',
          'Marco de LTV atingido',
          'LTV médio da marca apresenta tração consistente no ciclo atual.',
          { overallLTV: ltvData.overallLTV }
        )
      );
    }

    return alerts;
  }
}
