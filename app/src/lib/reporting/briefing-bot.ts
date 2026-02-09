import { AIAnalysisResult, ReportMetrics } from '@/types/reporting';

/**
 * @fileoverview Briefing Bot & Webhook Integrator (ST-24.4)
 * Responsável por formatar e disparar resumos executivos para canais externos.
 */
export class BriefingBot {
  
  /**
   * Formata um resumo executivo para Slack/WhatsApp.
   */
  formatBriefing(
    clientName: string,
    analysis: AIAnalysisResult,
    metrics: ReportMetrics
  ): string {
    const statusEmoji = metrics.roi >= 2.0 ? '✅' : '⚠️';
    
    return `
*📊 Briefing Semanal: ${clientName}*
${statusEmoji} *Status:* ${metrics.roi >= 2.0 ? 'Performance Saudável' : 'Atenção Necessária'}

*Resumo Executivo:*
${analysis.summary}

*Principais Insights:*
${analysis.insights.map((i: string) => `• ${i}`).join('\n')}

*Próximos Passos:*
${analysis.recommendations.map((r: string) => `- ${r}`).join('\n')}

*Métricas Chave:*
- ROI: ${metrics.roi.toFixed(2)}x
- Investimento: R$ ${metrics.adSpend.toLocaleString()}
- Maturação LTV: ${metrics.ltvMaturation.toFixed(1)}%

_Gerado automaticamente pelo Conselho de Funil_
    `.trim();
  }

  /**
   * Dispara o briefing para um Webhook configurado.
   */
  async sendToWebhook(webhookUrl: string, payload: any): Promise<boolean> {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return response.ok;
    } catch (error) {
      console.error('[BriefingBot] Error sending to webhook:', error);
      return false;
    }
  }
}

export const briefingBot = new BriefingBot();
