import type { ResearchQuery, ResearchSource } from '@/types/research';

export const RESEARCH_SYSTEM_PROMPT = `Voce e um analista de mercado senior.
Gere analise em PT-BR com foco em clareza executiva.
Responda SEMPRE em JSON valido, sem markdown e sem texto extra.`;

export function buildSourceSummaryPrompt(source: Pick<ResearchSource, 'title' | 'snippet' | 'url'>): string {
  return [
    'Resuma a fonte em no maximo 6 bullets curtos.',
    `Titulo: ${source.title}`,
    `URL: ${source.url}`,
    `Conteudo: ${source.snippet}`,
    'Retorne JSON: {"summary":"...","trends":["..."],"signals":["..."]}',
  ].join('\n');
}

export function buildSynthesisPrompt(
  summaries: string[],
  query: Pick<ResearchQuery, 'topic' | 'marketSegment' | 'competitors'>
): string {
  return [
    `Topico: ${query.topic}`,
    `Segmento: ${query.marketSegment ?? 'nao informado'}`,
    `Concorrentes: ${(query.competitors ?? []).join(', ') || 'nao informados'}`,
    'Resumos de fontes (JSON/string):',
    ...summaries.map((s, index) => `Fonte ${index + 1}: ${s}`),
    'Gere JSON final com campos:',
    '{"marketOverview":"","marketSize":"","trends":[],"competitors":[{"name":"","strengths":[],"weaknesses":[]}],"opportunities":[],"threats":[],"recommendations":[]}',
  ].join('\n');
}
