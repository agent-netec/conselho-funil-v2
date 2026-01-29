import { TranslationInput, TranslationResult, VoiceGuidelines } from '../../../types/social';

/**
 * Middleware de Style Transfer para garantir a voz da marca.
 * ST-17.2: BrandVoiceTranslator
 */
export class BrandVoiceTranslator {
  /**
   * Realiza a tradução de estilo do conteúdo baseado nas diretrizes da marca.
   * Nota: Em produção, isso chamaria um LLM com o prompt especificado no contrato.
   * Para esta ST, implementaremos a lógica de rigor e métricas.
   */
  static async translate(input: TranslationInput): Promise<TranslationResult> {
    const startTime = Date.now();
    const { content, guidelines } = input;

    // 1. Rigor de Voz: Remoção de Forbidden Words (Case Insensitive)
    let translatedText = content;
    const removedWords: string[] = [];

    guidelines.forbiddenWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      if (regex.test(translatedText)) {
        removedWords.push(word);
        translatedText = translatedText.replace(regex, '[REDACTED]');
      }
    });

    // 2. Rigor de Voz: Aplicação de Preferred Terms
    Object.entries(guidelines.preferredTerms).forEach(([original, preferred]) => {
      const regex = new RegExp(`\\b${original}\\b`, 'gi');
      translatedText = translatedText.replace(regex, preferred);
    });

    // 3. Simulação de Style Transfer (Prompt de Tom)
    // Em um cenário real, o LLM reescreveria o texto aqui.
    // Para o mock, vamos apenas simular a aplicação do tom no texto.
    if (guidelines.tone.toLowerCase().includes('sarcástico')) {
      translatedText = `${translatedText} (Não que você precise saber disso, mas enfim...)`;
    } else if (guidelines.tone.toLowerCase().includes('profissional')) {
      translatedText = `Informamos que: ${translatedText}`;
    }

    // 4. Formatação
    if (guidelines.formatting.useEmojis) {
      translatedText += ' 🚀✨';
    }

    const latencyMs = Date.now() - startTime;

    // 5. Cálculo de toneMatch (Simulado para auditoria)
    // Em produção, isso seria calculado comparando embeddings ou via LLM judge.
    const toneMatch = this.calculateToneMatch(translatedText, guidelines);

    return {
      translatedText,
      metrics: {
        toneMatch,
        latencyMs,
        forbiddenWordsRemoved: removedWords
      }
    };
  }

  /**
   * Calcula o nível de aderência ao tom de voz (0.0 a 1.0).
   */
  private static calculateToneMatch(text: string, guidelines: VoiceGuidelines): number {
    let score = 1.0;

    // Penaliza se ainda houver palavras proibidas (falha de segurança)
    guidelines.forbiddenWords.forEach(word => {
      if (text.toLowerCase().includes(word.toLowerCase())) {
        score -= 0.5;
      }
    });

    // Bônus por uso de termos preferidos
    Object.values(guidelines.preferredTerms).forEach(term => {
      if (text.toLowerCase().includes(term.toLowerCase())) {
        score += 0.05;
      }
    });

    return Math.min(Math.max(score, 0.0), 1.0);
  }
}
