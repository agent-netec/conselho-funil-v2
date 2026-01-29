import { PerformanceMetricDoc, PerformanceAlertDoc } from '../../types/performance';

/**
 * Prompt para o Performance Advisor (Gemini)
 */
export const buildPerformanceAdvisorPrompt = (
  metrics: PerformanceMetricDoc[],
  alerts: PerformanceAlertDoc[],
  targetRoas: number
) => {
  const metricsSummary = metrics.map(m => `
- Plataforma: ${m.platform}
  Entidade: ${m.name} (${m.level})
  Gasto: $${m.metrics.spend.toFixed(2)}
  Clicks: ${m.metrics.clicks}
  Conversões: ${m.metrics.conversions}
  ROAS: ${m.metrics.roas.toFixed(2)}
  CPC: $${m.metrics.cpc.toFixed(2)}
  CTR: ${(m.metrics.ctr * 100).toFixed(2)}%
`).join('\n');

  const alertsSummary = alerts.map(a => `
- Alerta: ${a.message}
  Severidade: ${a.severity}
  Métrica: ${a.metricType}
  Desvio (Z-Score): ${a.context.deviation.toFixed(2)}
  Entidade: ${a.context.entityName}
`).join('\n');

  return `
Você é o Performance Advisor do "Conselho de Funil", um especialista sênior em tráfego pago (Meta Ads, Google Ads, TikTok Ads).
Sua missão é analisar as métricas e alertas abaixo e fornecer recomendações estratégicas acionáveis.

### Dados Atuais de Performance:
${metricsSummary}

### Alertas de Anomalia Detectados:
${alertsSummary}

### Meta de ROAS: ${targetRoas.toFixed(2)}

### Instruções de Resposta:
Sua resposta deve ser um JSON estrito seguindo o formato abaixo:

{
  "summary": "Breve resumo da performance geral (1-2 frases).",
  "recommendations": [
    {
      "entityId": "ID da campanha/anúncio",
      "platform": "meta | google | tiktok",
      "action": "PAUSE | SCALE | ROTATE_CREATIVE | MONITOR",
      "reason": "Explicação técnica curta baseada no ROAS alvo ou métricas secundárias.",
      "priority": "high | medium | low"
    }
  ],
  "alertInsights": [
    {
      "alertId": "ID do alerta",
      "explanation": "Explicação contextual sobre o porquê desta anomalia ter ocorrido (ex: Ad Fatigue, erro de pixel, sazonalidade, leilão caro)."
    }
  ]
}

### Regras de Negócio:
1. Se ROAS < ${targetRoas} e Gasto > 0: Sugerir PAUSE ou MONITOR se for início de campanha.
2. Se ROAS > ${targetRoas * 1.5}: Sugerir SCALE (aumento de orçamento).
3. Se CTR está caindo e CPC subindo: Sugerir ROTATE_CREATIVE (Ad Fatigue).
4. Seja direto e técnico. Use termos de gestor de tráfego.
`;
};
