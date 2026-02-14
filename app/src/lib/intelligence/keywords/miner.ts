import {
  KeywordIntelligence
} from '@/types/intelligence';
import { KOSEngine } from './kos-engine';
import { generateWithGemini } from '@/lib/ai/gemini';

interface GeminiKeywordEnrichment {
  term: string;
  intent: string;
  volume: number;
  difficulty: number;
  suggestion: string;
}

/**
 * Keyword Miner
 *
 * Fluxo:
 * 1. Google Autocomplete → termos reais que as pessoas buscam
 * 2. Gemini AI → enriquece com intent, volume estimado, dificuldade e sugestão
 * 3. KOSEngine → calcula Opportunity Score final
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

      // Enrich with Gemini AI
      let enrichments: GeminiKeywordEnrichment[] = [];
      try {
        enrichments = await this.enrichWithGemini(seedTerm, terms);
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

        // Use Gemini data if available, fallback to regex/random
        const intent = this.validateIntent(enrichment?.intent) || KOSEngine.inferIntent(term);
        const volume = this.clamp(enrichment?.volume, 1, 100) ?? 30;
        const difficulty = this.clamp(enrichment?.difficulty, 1, 100) ?? 30;
        const relevance = 70;

        return {
          term,
          intent,
          metrics: {
            volume,
            difficulty,
            opportunityScore: KOSEngine.calculateScore(volume, relevance, difficulty),
            trend: 0,
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
    terms: string[]
  ): Promise<GeminiKeywordEnrichment[]> {
    const prompt = `Você é um especialista em SEO e marketing digital no Brasil.

Analise estas ${terms.length} palavras-chave relacionadas ao termo "${seedTerm}" e forneça dados estimados para cada uma.

Para CADA keyword, retorne um objeto com:
- "term": a keyword exata (copie sem modificar)
- "intent": classifique como "transactional", "commercial", "navigational" ou "informational"
  - transactional: pessoa quer comprar/contratar (ex: "comprar", "preço", "cupom", "oferta", "contratar")
  - commercial: pessoa está comparando opções (ex: "melhor", "review", "vale a pena", "vs", "comparativo")
  - navigational: pessoa procura algo específico (ex: "login", "site oficial", nome de marca)
  - informational: pessoa quer aprender (ex: "como", "o que é", "tutorial", "dicas")
- "volume": número de 1 a 100 estimando volume de busca mensal no Brasil (1=quase ninguém busca, 30=baixo, 50=moderado, 70=alto, 100=milhões de buscas). Base suas estimativas no mercado brasileiro real.
- "difficulty": número de 1 a 100 estimando competição para ranquear/anunciar (1=sem concorrência, 30=fácil, 50=competitivo, 70=difícil, 100=dominado por grandes players)
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
