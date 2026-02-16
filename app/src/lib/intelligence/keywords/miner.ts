import {
  KeywordIntelligence
} from '@/types/intelligence';
import { KOSEngine } from './kos-engine';
import { generateWithGemini } from '@/lib/ai/gemini';
import {
  isDataForSEOConfigured,
  getKeywordMetricsCached,
  normalizeVolume,
  normalizeDifficulty,
} from '@/lib/integrations/seo/dataforseo';

interface GeminiKeywordEnrichment {
  term: string;
  intent: string;
  volume: number;
  difficulty: number;
  suggestion: string;
}

/**
 * Keyword Miner — Sprint N updated
 *
 * Flow:
 * 1. Google Autocomplete → real terms people search
 * 2. DataForSEO (if configured) → real volume/difficulty
 * 3. Gemini AI → intent classification + actionable suggestions
 * 4. KOSEngine → calculates Opportunity Score
 *
 * DataForSEO fallback: If not configured, Gemini estimates volume/difficulty
 */
export class KeywordMiner {
  async mine(
    brandId: string,
    seedTerm: string
  ): Promise<KeywordIntelligence[]> {
    const encodedTerm = encodeURIComponent(seedTerm);
    const endpoint = `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodedTerm}&hl=pt-br`;

    try {
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error('Google Autocomplete error');

      const [, suggestions] = await response.json();
      const terms = (suggestions as string[]).slice(0, 50);

      if (terms.length === 0) return [];

      // N-2: Try DataForSEO for real volume/difficulty
      let dataForSEOResults = new Map<string, { volume: number; difficulty: number; cpc: number }>();
      const useDataForSEO = isDataForSEOConfigured();

      if (useDataForSEO) {
        try {
          const metrics = await getKeywordMetricsCached(brandId, terms);
          for (const [key, data] of metrics) {
            dataForSEOResults.set(key, {
              volume: normalizeVolume(data.search_volume),
              difficulty: normalizeDifficulty(data.keyword_difficulty),
              cpc: data.cpc,
            });
          }
          console.log(`[KeywordMiner] DataForSEO enriched ${dataForSEOResults.size}/${terms.length} keywords`);
        } catch (error) {
          console.warn('[KeywordMiner] DataForSEO failed, falling back to Gemini:', error);
        }
      }

      // N-2.3: Gemini for intent + suggestions (always)
      // If DataForSEO not configured, Gemini also provides volume/difficulty estimates
      let enrichments: GeminiKeywordEnrichment[] = [];
      try {
        enrichments = await this.enrichWithGemini(seedTerm, terms, useDataForSEO && dataForSEOResults.size > 0);
        console.log(`[KeywordMiner] Gemini enriched ${enrichments.length}/${terms.length} keywords`);
      } catch (error) {
        console.error('[KeywordMiner] Gemini enrichment failed, using regex fallback:', error);
      }

      // Build enrichment lookup map (case-insensitive)
      const enrichmentMap = new Map<string, GeminiKeywordEnrichment>();
      for (const e of enrichments) {
        enrichmentMap.set(e.term.toLowerCase().trim(), e);
      }

      return terms.map(term => {
        const enrichment = enrichmentMap.get(term.toLowerCase().trim());
        const seoData = dataForSEOResults.get(term.toLowerCase().trim());

        // Intent: always from Gemini
        const intent = this.validateIntent(enrichment?.intent) || KOSEngine.inferIntent(term);

        // Volume/Difficulty: DataForSEO first, then Gemini estimate
        const volume = seoData?.volume ?? this.clamp(enrichment?.volume, 1, 100) ?? 30;
        const difficulty = seoData?.difficulty ?? this.clamp(enrichment?.difficulty, 1, 100) ?? 30;
        const relevance = 70;

        return {
          term,
          intent,
          metrics: {
            volume,
            difficulty,
            opportunityScore: KOSEngine.calculateScore(volume, relevance, difficulty),
            trend: 0,
            cpc: seoData?.cpc,
            dataSource: seoData ? 'dataforseo' : 'gemini_estimate',
          },
          relatedTerms: [],
          suggestedBy: 'scout' as const,
          suggestion: enrichment?.suggestion || undefined,
        };
      });
    } catch (error) {
      console.error('[KeywordMiner] Error:', error);
      return [];
    }
  }

  private async enrichWithGemini(
    seedTerm: string,
    terms: string[],
    skipVolumeEstimation = false
  ): Promise<GeminiKeywordEnrichment[]> {
    const volumeInstruction = skipVolumeEstimation
      ? '- "volume": 0 (não precisa estimar, já temos dados reais)\n- "difficulty": 0 (não precisa estimar, já temos dados reais)'
      : `- "volume": número de 1 a 100 estimando volume de busca mensal no Brasil (1=quase ninguém busca, 30=baixo, 50=moderado, 70=alto, 100=milhões de buscas). Base suas estimativas no mercado brasileiro real.
- "difficulty": número de 1 a 100 estimando competição para ranquear/anunciar (1=sem concorrência, 30=fácil, 50=competitivo, 70=difícil, 100=dominado por grandes players)`;

    const prompt = `Você é um especialista em SEO e marketing digital no Brasil.

Analise estas ${terms.length} palavras-chave relacionadas ao termo "${seedTerm}" e forneça dados estimados para cada uma.

Para CADA keyword, retorne um objeto com:
- "term": a keyword exata (copie sem modificar)
- "intent": classifique como "transactional", "commercial", "navigational" ou "informational"
  - transactional: pessoa quer comprar/contratar (ex: "comprar", "preço", "cupom", "oferta", "contratar")
  - commercial: pessoa está comparando opções (ex: "melhor", "review", "vale a pena", "vs", "comparativo")
  - navigational: pessoa procura algo específico (ex: "login", "site oficial", nome de marca)
  - informational: pessoa quer aprender (ex: "como", "o que é", "tutorial", "dicas")
${volumeInstruction}
- "suggestion": Uma sugestão PRÁTICA e ESPECÍFICA de como usar esta keyword em marketing digital ou tráfego pago. Seja direto e actionable. Exemplos: "Use como headline de anúncio no Google Ads com foco em preço baixo", "Crie um reels respondendo essa pergunta — gera autoridade e salva". 1-2 frases em português brasileiro.

Retorne APENAS um array JSON válido. Sem markdown, sem explicações, sem código.

Keywords:
${terms.map((t, i) => `${i + 1}. "${t}"`).join('\n')}`;

    const result = await generateWithGemini(prompt, {
      responseMimeType: 'application/json',
      temperature: 0.3,
      feature: 'keyword_enrichment',
    });

    const parsed = JSON.parse(result);
    return Array.isArray(parsed) ? parsed : [];
  }

  private validateIntent(intent: string | undefined): 'transactional' | 'commercial' | 'navigational' | 'informational' | null {
    const valid = ['transactional', 'commercial', 'navigational', 'informational'];
    if (intent && valid.includes(intent)) {
      return intent as 'transactional' | 'commercial' | 'navigational' | 'informational';
    }
    return null;
  }

  private clamp(value: number | undefined, min: number, max: number): number | null {
    if (typeof value !== 'number' || isNaN(value)) return null;
    return Math.max(min, Math.min(max, Math.round(value)));
  }
}
