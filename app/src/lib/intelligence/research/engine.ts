import { Timestamp } from 'firebase/firestore';
import { ExaAdapter } from '@/lib/mcp/adapters/exa';
import { FirecrawlAdapter } from '@/lib/mcp/adapters/firecrawl';
import { DossierGenerator } from '@/lib/intelligence/research/dossier-generator';
import { getCachedResearch, saveResearch } from '@/lib/firebase/research';
import type { MarketDossier, ResearchDepth, ResearchQuery, ResearchSource } from '@/types/research';

const DEPTH_CONFIG: Record<ResearchDepth, { exaResults: number; enrichTop: number }> = {
  quick: { exaResults: 3, enrichTop: 0 },
  standard: { exaResults: 5, enrichTop: 2 },
  deep: { exaResults: 10, enrichTop: 3 },
};

function isValidSourceUrl(value: string): boolean {
  if (!(value.startsWith('http://') || value.startsWith('https://'))) return false;
  if (value.includes('localhost')) return false;
  return !/\b(?:10|127|169\.254|192\.168)\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/.test(value);
}

export class ResearchEngine {
  static async generateDossier(input: ResearchQuery): Promise<MarketDossier> {
    const now = Timestamp.now();
    let cached: MarketDossier | null = null;
    try {
      cached = await getCachedResearch(input.brandId, input.topic);
    } catch {
      // Composite index may not exist yet — skip cache gracefully
    }
    if (cached) return cached;

    const cfg = DEPTH_CONFIG[input.depth];
    const sources = await this.collectSources(input, cfg.exaResults, cfg.enrichTop);
    if (sources.length === 0) {
      return this.failed(input.brandId, input.topic, now, 'Nenhuma fonte encontrada para o topico informado.');
    }

    try {
      const sections = await DossierGenerator.synthesize(sources, input);
      const dossier: MarketDossier = {
        id: '',
        brandId: input.brandId,
        topic: input.topic,
        status: 'completed',
        sections,
        sources,
        generatedAt: now,
        expiresAt:
          typeof Timestamp.fromMillis === 'function'
            ? Timestamp.fromMillis(now.toMillis() + 24 * 60 * 60 * 1000)
            : now,
      };
      const savedId = await saveResearch(input.brandId, dossier);
      dossier.id = savedId;
      return dossier;
    } catch (error) {
      return this.failed(
        input.brandId,
        input.topic,
        now,
        `Falha na sintese: ${error instanceof Error ? error.message : 'erro desconhecido'}`,
        sources
      );
    }
  }

  private static async collectSources(
    queryInput: ResearchQuery,
    exaResults: number,
    enrichTop: number
  ): Promise<ResearchSource[]> {
    const exa = new ExaAdapter();
    const firecrawl = new FirecrawlAdapter();
    const task = {
      id: `research-${queryInput.brandId}-${Timestamp.now().toMillis()}`,
      brandId: queryInput.brandId,
      type: 'semantic_search',
      input: {
        query: [
          queryInput.topic,
          queryInput.marketSegment ? `segmento: ${queryInput.marketSegment}` : '',
          queryInput.competitors?.length ? `concorrentes: ${queryInput.competitors.join(', ')}` : '',
          'mercado tendencias oportunidades 2026',
        ]
          .filter(Boolean)
          .join(' '),
        numResults: exaResults,
      },
    } as const;

    let sources: ResearchSource[] = [];
    try {
      const exaResult = await exa.execute(task);
      const rawResults =
        exaResult.success && exaResult.data && typeof exaResult.data === 'object'
          ? ((exaResult.data as { results?: unknown[] }).results ?? [])
          : [];
      sources = rawResults
        .map((entry) => entry as { url?: string; title?: string; snippet?: string; score?: number })
        .filter((entry) => typeof entry.url === 'string' && isValidSourceUrl(entry.url))
        .map((entry) => ({
          url: entry.url as string,
          title: entry.title ?? 'Fonte sem titulo',
          snippet: entry.snippet ?? '',
          relevanceScore: typeof entry.score === 'number' ? entry.score : 0,
          source: 'exa',
          fetchedAt: Timestamp.now(),
        }));
    } catch {
      sources = [];
    }

    const top = sources
      .slice()
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, enrichTop);

    // Firecrawl enrichment em PARALELO (não sequencial) para caber no timeout
    if (top.length > 0) {
      const enrichResults = await Promise.allSettled(
        top.map(async (src) => {
          const fireTask = {
            id: `firecrawl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            brandId: queryInput.brandId,
            type: 'url_to_markdown' as const,
            input: { url: src.url },
          };
          const fireResult = await firecrawl.execute(fireTask);
          if (fireResult.success && fireResult.data && typeof fireResult.data === 'object') {
            const markdown = String((fireResult.data as { markdown?: string }).markdown ?? '');
            if (markdown) return { url: src.url, markdown };
          }
          return null;
        })
      );

      for (const result of enrichResults) {
        if (result.status === 'fulfilled' && result.value) {
          const { url, markdown } = result.value;
          const idx = sources.findIndex((s) => s.url === url);
          if (idx >= 0) {
            sources[idx] = { ...sources[idx], snippet: markdown.slice(0, 3000), source: 'firecrawl', fetchedAt: Timestamp.now() };
          }
        }
        // graceful degradation: fontes que falharam mantém snippet original do Exa
      }
    }

    return sources;
  }

  private static failed(
    brandId: string,
    topic: string,
    now: Timestamp,
    message: string,
    sources: ResearchSource[] = []
  ): MarketDossier {
    return {
      id: '',
      brandId,
      topic,
      status: 'failed',
      sections: {
        marketOverview: message,
        marketSize: '',
        trends: [],
        competitors: [],
        opportunities: [],
        threats: [],
        recommendations: [],
      },
      sources,
      generatedAt: now,
      expiresAt: now,
    };
  }
}
