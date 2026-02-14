import { generateWithGemini } from '@/lib/ai/gemini';
import {
  buildSourceSummaryPrompt,
  buildSynthesisPrompt,
  RESEARCH_SYSTEM_PROMPT,
} from '@/lib/ai/prompts/research-synthesis';
import { loadBrain } from '@/lib/intelligence/brains/loader';
import { buildScoringPromptFromBrain } from '@/lib/intelligence/brains/prompt-builder';
import type { CounselorId } from '@/types';
import type { MarketDossierSections, ResearchQuery, ResearchSource } from '@/types/research';

// ═══════════════════════════════════════════════════════
// RESEARCH → EXPERTS MAPPING (Brain Integration — Sprint D)
// ═══════════════════════════════════════════════════════

interface ResearchExpertMapping {
  counselorId: CounselorId;
  frameworkId: string;
}

const RESEARCH_EXPERT_MAP: ResearchExpertMapping[] = [
  { counselorId: 'eugene_schwartz', frameworkId: 'awareness_alignment' },
  { counselorId: 'russell_brunson', frameworkId: 'value_ladder_score' },
];

function buildResearchBrainContext(): string {
  const parts: string[] = [];

  for (const { counselorId, frameworkId } of RESEARCH_EXPERT_MAP) {
    const brain = loadBrain(counselorId);
    if (!brain) continue;

    const frameworkJson = buildScoringPromptFromBrain(counselorId, frameworkId);
    if (!frameworkJson) continue;

    parts.push(
      `### ${brain.name} — ${brain.subtitle}\n` +
      `**Filosofia:** ${brain.philosophy.slice(0, 200)}...\n` +
      `**Principios:** ${brain.principles.slice(0, 300)}...\n` +
      `**Framework (${frameworkId}):**\n${frameworkJson}`
    );
  }

  return parts.join('\n\n---\n\n');
}

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
    // Sprint D: Inject counselor perspective into synthesis
    const brainContext = buildResearchBrainContext();
    const baseSynthesisPrompt = buildSynthesisPrompt(summaries, query);
    const synthesisPrompt = brainContext
      ? `${baseSynthesisPrompt}\n\n## PERSPECTIVA DOS CONSELHEIROS (use para enriquecer a analise)\n${brainContext}\n\nConsidere os frameworks acima ao avaliar oportunidades, ameacas e recomendacoes. Identifique o nivel de consciencia do mercado (Schwartz) e oportunidades na escada de valor (Brunson).`
      : baseSynthesisPrompt;
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
