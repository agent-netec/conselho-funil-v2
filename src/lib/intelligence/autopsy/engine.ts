import { FunnelStep, AutopsyReport, CriticalGap } from '@/types/funnel';
import { Timestamp } from 'firebase/firestore';

/**
 * Motor de Diagnóstico Forense (Funnel Autopsy Engine)
 * Responsável por calcular scores de saúde e identificar gargalos financeiros.
 */
export class AutopsyEngine {
  /**
   * Executa a análise completa de um funil.
   */
  static analyzeFunnel(
    funnelId: string,
    steps: FunnelStep[],
    averageTicket: number
  ): AutopsyReport {
    const criticalGaps: CriticalGap[] = [];
    const stepAnalysis: AutopsyReport['stepAnalysis'] = {};
    const actionPlan: AutopsyReport['actionPlan'] = [];

    let totalHealth = 0;

    steps.forEach((step) => {
      const frictionPoints: string[] = [];
      const hypotheses: string[] = [];
      let priority: 'low' | 'medium' | 'high' = 'low';

      // 1. Verificar se há benchmark para comparação
      if (step.benchmarks) {
        const { industryAvg, deviation } = step.benchmarks;
        
        // Se a conversão está abaixo do benchmark
        if (deviation < 0) {
          priority = Math.abs(deviation) > 20 ? 'high' : 'medium';
          
          if (priority === 'high') {
            frictionPoints.push(`Conversão ${Math.abs(deviation)}% abaixo da média do mercado.`);
            
            // Gerar hipóteses baseadas no tipo de etapa
            hypotheses.push(...this.generateHypotheses(step.type));

            // Calcular perda estimada (Loss Estimate)
            // Perda = (Visitantes * Benchmark) - (Visitantes * Conversão Atual) * Ticket Médio
            const potentialConversions = step.metrics.visitors * industryAvg;
            const actualConversions = step.metrics.conversions;
            const lostConversions = Math.max(0, potentialConversions - actualConversions);
            const lossEstimate = lostConversions * averageTicket;

            criticalGaps.push({
              stepId: step.id,
              metric: 'conversionRate',
              currentValue: step.metrics.conversionRate,
              targetValue: industryAvg,
              lossEstimate: lossEstimate
            });

            actionPlan.push({
              task: `Otimizar ${step.type.toUpperCase()}: ${hypotheses[0]}`,
              expectedImpact: `Recuperação estimada de R$ ${lossEstimate.toLocaleString('pt-BR')} / mês`,
              difficulty: 'medium'
            });
          }
        }

        // Contribuição para o healthScore (baseado no desvio médio)
        totalHealth += Math.max(0, 100 + deviation);
      } else {
        totalHealth += 100; // Se não tem benchmark, assume "neutro"
      }

      stepAnalysis[step.id] = {
        frictionPoints,
        hypotheses,
        priority
      };
    });

    const overallHealth = Math.round(totalHealth / steps.length);

    return {
      id: `rep_${Date.now()}`,
      funnelId,
      timestamp: Timestamp.now(),
      overallHealth,
      criticalGaps,
      stepAnalysis,
      actionPlan: actionPlan.sort((a, b) => {
        // Ordenar plano de ação por impacto financeiro (extraído da string)
        const impactA = parseFloat(a.expectedImpact.replace(/[^\d]/g, '')) || 0;
        const impactB = parseFloat(b.expectedImpact.replace(/[^\d]/g, '')) || 0;
        return impactB - impactA;
      })
    };
  }

  /**
   * Gera hipóteses de falha baseadas no tipo de etapa.
   */
  private static generateHypotheses(type: FunnelStep['type']): string[] {
    switch (type) {
      case 'ads':
        return ['Segmentação de público incorreta', 'Criativo saturado', 'Falta de congruência com a LP'];
      case 'optin':
        return ['Headline fraca', 'Formulário com muitos campos', 'Velocidade de carregamento baixa'];
      case 'vsl':
        return ['Hook inicial não retém', 'Mecanismo único mal explicado', 'Oferta demora a aparecer'];
      case 'checkout':
        return ['Fricção no pagamento', 'Falta de selos de segurança', 'Checkout muito complexo'];
      case 'upsell':
        return ['Oferta não complementa o produto principal', 'Preço muito agressivo', 'Copy confusa'];
      default:
        return ['Copy não persuasiva', 'Design amador', 'Problemas técnicos'];
    }
  }
}
