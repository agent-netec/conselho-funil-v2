import { generateWithGemini } from '@/lib/ai/gemini';
import { RESEARCH_SYSTEM_PROMPT } from '@/lib/ai/prompts/research-synthesis';
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

const SOURCE_SNIPPET_LIMIT = 2000;

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
  /**
   * Single-pass synthesis: all sources + brain context in ONE Gemini call.
   * Previous approach made N+1 sequential calls (per-source summary + final)
   * which exceeded Vercel's 60s timeout on standard depth.
   */
  static async synthesize(sources: ResearchSource[], query: ResearchQuery): Promise<MarketDossierSections> {
    const brainContext = buildResearchBrainContext();

    const sourcesBlock = sources
      .map((s, i) => [
        `## Fonte ${i + 1}: ${s.title}`,
        `URL: ${s.url}`,
        `Relevancia: ${s.relevanceScore.toFixed(2)}`,
        s.snippet.slice(0, SOURCE_SNIPPET_LIMIT),
      ].join('\n'))
      .join('\n\n---\n\n');

    const prompt = [
      `# Dossie de Mercado`,
      `Topico: ${query.topic}`,
      `Segmento: ${query.marketSegment ?? 'nao informado'}`,
      `Concorrentes: ${(query.competitors ?? []).join(', ') || 'nao informados'}`,
      '',
      `# FONTES COLETADAS (${sources.length})`,
      sourcesBlock,
      '',
      brainContext
        ? `# PERSPECTIVA DOS CONSELHEIROS\n${brainContext}\n\nConsidere os frameworks acima ao avaliar oportunidades, ameacas e recomendacoes. Identifique o nivel de consciencia do mercado (Schwartz) e oportunidades na escada de valor (Brunson).\n`
        : '',
      '# INSTRUCOES',
      'Analise TODAS as fontes acima e gere um dossie de mercado completo.',
      'Retorne JSON com EXATAMENTE estes campos:',
      '{"marketOverview":"visao geral do mercado (2-3 paragrafos)","marketSize":"tamanho estimado e potencial","trends":["tendencia 1","tendencia 2",...],"competitors":[{"name":"nome","strengths":["..."],"weaknesses":["..."]}],"opportunities":["oportunidade 1",...],"threats":["ameaca 1",...],"recommendations":["recomendacao acionavel 1",...]}',
      'Escreva em PT-BR com foco executivo. Seja especifico com dados e numeros das fontes.',
    ].filter(Boolean).join('\n');

    const finalText = await generateWithGemini(prompt, {
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
