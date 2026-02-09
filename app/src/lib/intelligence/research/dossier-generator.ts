import { generateWithGemini } from '@/lib/ai/gemini';
import {
  buildSourceSummaryPrompt,
  buildSynthesisPrompt,
  RESEARCH_SYSTEM_PROMPT,
} from '@/lib/ai/prompts/research-synthesis';
import type { MarketDossierSections, ResearchQuery, ResearchSource } from '@/types/research';

const SOURCE_SNIPPET_LIMIT = 3000;

function normalizeSections(value: unknown): MarketDossierSections {
  const raw = (value ?? {}) as Partial<MarketDossierSections>;
  return {
    marketOverview: typeof raw.marketOverview === 'string' ? raw.marketOverview : '',
    marketSize: typeof raw.marketSize === 'string' ? raw.marketSize : '',
    trends: Array.isArray(raw.trends) ? raw.trends.map(String) : [],
    competitors: Array.isArray(raw.competitors)
      ? raw.competitors.map((c) => ({
          name: String((c as { name?: unknown }).name ?? ''),
          strengths: Array.isArray((c as { strengths?: unknown[] }).strengths)
            ? (c as { strengths: unknown[] }).strengths.map(String)
            : [],
          weaknesses: Array.isArray((c as { weaknesses?: unknown[] }).weaknesses)
            ? (c as { weaknesses: unknown[] }).weaknesses.map(String)
            : [],
        }))
      : [],
    opportunities: Array.isArray(raw.opportunities) ? raw.opportunities.map(String) : [],
    threats: Array.isArray(raw.threats) ? raw.threats.map(String) : [],
    recommendations: Array.isArray(raw.recommendations) ? raw.recommendations.map(String) : [],
  };
}

export class DossierGenerator {
  static async synthesize(sources: ResearchSource[], query: ResearchQuery): Promise<MarketDossierSections> {
    // Fase 1 (DT-12): resumo individual por fonte
    const summaries: string[] = [];
    for (const source of sources) {
      const prompt = buildSourceSummaryPrompt({
        title: source.title,
        url: source.url,
        snippet: source.snippet.slice(0, SOURCE_SNIPPET_LIMIT),
      });
      try {
        const summary = await generateWithGemini(prompt, {
          systemPrompt: RESEARCH_SYSTEM_PROMPT,
          temperature: 0.4,
          responseMimeType: 'application/json',
          feature: 'research_source_summary',
        });
        summaries.push(summary);
      } catch {
        summaries.push(JSON.stringify({ summary: source.snippet.slice(0, 600), trends: [], signals: [] }));
      }
    }

    // Fase 2 (DT-12): síntese final consolidada com os resumos
    const synthesisPrompt = buildSynthesisPrompt(summaries, query);
    const finalText = await generateWithGemini(synthesisPrompt, {
      systemPrompt: RESEARCH_SYSTEM_PROMPT,
      temperature: 0.4,
      responseMimeType: 'application/json',
      feature: 'research_final_synthesis',
    });

    try {
      return normalizeSections(JSON.parse(finalText));
    } catch {
      return {
        marketOverview: 'Nao foi possivel consolidar o dossie com confianca.',
        marketSize: '',
        trends: [],
        competitors: [],
        opportunities: [],
        threats: [],
        recommendations: [],
      };
    }
  }
}
