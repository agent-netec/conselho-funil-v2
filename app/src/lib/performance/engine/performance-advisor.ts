import { generateWithGemini } from '../../ai/gemini';
import { buildPerformanceAdvisorPrompt } from '../../ai/prompts/performance-advisor';
import { PerformanceMetricDoc, PerformanceAlertDoc } from '../../../types/performance';
import type { SegmentBreakdownData } from '@/types/ab-testing';

export interface PerformanceInsight {
  summary: string;
  recommendations: Array<{
    entityId: string;
    platform: string;
    action: 'PAUSE' | 'SCALE' | 'ROTATE_CREATIVE' | 'MONITOR';
    reason: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  alertInsights: Array<{
    alertId: string;
    explanation: string;
  }>;
}

export class PerformanceAdvisor {
  /**
   * Gera insights estratégicos usando o Gemini
   */
  async generateInsights(
    metrics: PerformanceMetricDoc[],
    alerts: PerformanceAlertDoc[],
    targetRoas: number,
    segmentData?: SegmentBreakdownData
  ): Promise<PerformanceInsight> {
    const prompt = buildPerformanceAdvisorPrompt(metrics, alerts, targetRoas, segmentData);

    try {
      const response = await generateWithGemini(prompt, {
        model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
        responseMimeType: 'application/json',
        temperature: 0.3
      });

      return JSON.parse(response) as PerformanceInsight;
    } catch (error) {
      console.error('❌ [PerformanceAdvisor] Erro ao gerar insights:', error);
      throw new Error('Falha ao gerar insights de performance com IA.');
    }
  }
}
