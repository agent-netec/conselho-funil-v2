import { collection, getDocs, query, Timestamp, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { generateWithGemini } from '@/lib/ai/gemini';
import { buildForecastPrompt, FORECAST_SYSTEM_PROMPT } from '@/lib/ai/prompts/predictive-forecast';
import type { AudienceForecast } from '@/types/predictive';

type Segment = 'hot' | 'warm' | 'cold';

export class AudienceForecaster {
  static async forecast(brandId: string): Promise<AudienceForecast> {
    const now = Timestamp.now();
    const currentDistribution = await this.getCurrentDistribution(brandId);
    const migrationRates = await this.estimateMigrationRates(brandId, currentDistribution);
    const projections = this.projectDistribution(currentDistribution, migrationRates);
    const trendsNarrative = await this.generateNarrative(currentDistribution, projections, migrationRates);

    return {
      brandId,
      currentDistribution,
      projections,
      migrationRates,
      trendsNarrative,
      calculatedAt: now,
    };
  }

  private static async getCurrentDistribution(
    brandId: string
  ): Promise<{ hot: number; warm: number; cold: number }> {
    const leadsRef = collection(db, 'brands', brandId, 'leads');
    const [hot, warm, cold] = await Promise.all([
      getDocs(query(leadsRef, where('segment', '==', 'hot'))),
      getDocs(query(leadsRef, where('segment', '==', 'warm'))),
      getDocs(query(leadsRef, where('segment', '==', 'cold'))),
    ]);
    return { hot: hot.size, warm: warm.size, cold: cold.size };
  }

  private static async estimateMigrationRates(
    brandId: string,
    currentDistribution: { hot: number; warm: number; cold: number }
  ): Promise<AudienceForecast['migrationRates']> {
    const eventsRef = collection(db, 'brands', brandId, 'journey_events');
    const recentEvents = await getDocs(
      query(eventsRef, where('timestamp', '>=', Timestamp.fromMillis(Timestamp.now().toMillis() - 30 * 86400000)))
    );

    const activityFactor = Math.min(recentEvents.size / Math.max(1, currentDistribution.hot + currentDistribution.warm), 1);
    const hotToWarm = Math.max(0.04, 0.12 - activityFactor * 0.05);
    const warmToCold = Math.max(0.05, 0.15 - activityFactor * 0.05);
    const coldToChurned = Math.max(0.02, 0.08 - activityFactor * 0.02);
    const warmToHot = Math.min(0.12, 0.04 + activityFactor * 0.05);
    const coldToWarm = Math.min(0.08, 0.02 + activityFactor * 0.03);

    return { hotToWarm, warmToCold, coldToChurned, warmToHot, coldToWarm };
  }

  private static projectDistribution(
    current: { hot: number; warm: number; cold: number },
    rates: AudienceForecast['migrationRates']
  ): AudienceForecast['projections'] {
    const applyDays = (days: number) => {
      const factor = days / 30;
      const hotLoss = current.hot * rates.hotToWarm * factor;
      const warmLoss = current.warm * rates.warmToCold * factor;
      const warmGain = current.warm * rates.warmToHot * factor;
      const coldGain = current.cold * rates.coldToWarm * factor;
      const coldLossChurn = current.cold * rates.coldToChurned * factor;

      const nextHot = Math.max(0, Math.round(current.hot - hotLoss + warmGain));
      const nextWarm = Math.max(0, Math.round(current.warm + hotLoss - warmLoss - warmGain + coldGain));
      const nextCold = Math.max(0, Math.round(current.cold + warmLoss - coldGain - coldLossChurn));
      return { hot: nextHot, warm: nextWarm, cold: nextCold };
    };

    return {
      days7: applyDays(7),
      days14: applyDays(14),
      days30: applyDays(30),
    };
  }

  private static async generateNarrative(
    currentDistribution: AudienceForecast['currentDistribution'],
    projections: AudienceForecast['projections'],
    migrationRates: AudienceForecast['migrationRates']
  ): Promise<string> {
    try {
      const prompt = buildForecastPrompt(currentDistribution, projections, migrationRates);
      const result = await generateWithGemini(prompt, {
        systemPrompt: FORECAST_SYSTEM_PROMPT,
        temperature: 0.3,
        responseMimeType: 'application/json',
        feature: 'predictive_forecast_narrative',
      });
      const parsed = JSON.parse(result) as { narrative?: string };
      return parsed.narrative?.trim() || 'Tendência estável com risco moderado de migração para segmentos frios.';
    } catch {
      return 'A base tende a perder parte dos leads quentes em 14-30 dias sem reforço de engajamento. Priorize campanhas de reativação para aquecer os segmentos warm e cold.';
    }
  }
}
