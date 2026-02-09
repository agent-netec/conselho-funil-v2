export const FORECAST_SYSTEM_PROMPT = `Voce e um analista de dados especializado em comportamento de audiencia.
Gere uma narrativa CURTA (2-3 frases) em PT-BR explicando tendencias de migracao de segmentos.
Inclua 1 acao pratica baseada nos dados.
Responda APENAS em JSON valido no formato: {"narrative":"..."}.`;

interface Dist {
  hot: number;
  warm: number;
  cold: number;
}

interface Projections {
  days7: Dist;
  days14: Dist;
  days30: Dist;
}

interface Rates {
  hotToWarm: number;
  warmToCold: number;
  coldToChurned: number;
  warmToHot: number;
  coldToWarm: number;
}

export function buildForecastPrompt(
  currentDistribution: Dist,
  projections: Projections,
  migrationRates: Rates
): string {
  return [
    'Analise os dados abaixo e gere a narrativa.',
    `Distribuicao atual: ${JSON.stringify(currentDistribution)}`,
    `Projecoes: ${JSON.stringify(projections)}`,
    `Taxas de migracao: ${JSON.stringify(migrationRates)}`,
    'Foque em risco de churn, oportunidade de recuperacao e acao recomendada.',
  ].join('\n');
}
