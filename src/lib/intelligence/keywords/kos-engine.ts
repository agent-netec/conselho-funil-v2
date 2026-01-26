import { 
  KeywordIntelligence, 
  SearchIntent 
} from '@/types/intelligence';

/**
 * KOS Engine (Keyword Opportunity Score)
 * 
 * Calcula a prioridade de uma palavra-chave com base na fórmula:
 * KOS = (Volume * 0.4) + (Relevância * 0.4) - (Dificuldade * 0.2)
 */
export class KOSEngine {
  /**
   * Calcula o KOS para uma keyword.
   * @param volume 0-100
   * @param relevance 0-100 (match semântico)
   * @param difficulty 0-100
   */
  static calculateScore(
    volume: number,
    relevance: number,
    difficulty: number
  ): number {
    const score = (volume * 0.4) + (relevance * 0.4) - (difficulty * 0.2);
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Infere a intenção de busca com base em modificadores comuns.
   */
  static inferIntent(term: string): SearchIntent {
    const t = term.toLowerCase();
    
    // Transacional
    if (/\b(comprar|preço|cupom|oferta|venda|aluguel|contratar)\b/.test(t)) {
      return 'transactional';
    }
    
    // Comercial
    if (/\b(melhor|top|review|comparativo|vs|análise|serviço|empresa)\b/.test(t)) {
      return 'commercial';
    }
    
    // Navegacional
    if (/\b(login|entrar|site|oficial|instagram|facebook|linkedin)\b/.test(t)) {
      return 'navigational';
    }
    
    // Default: Informacional
    return 'informational';
  }
}
