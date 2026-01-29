import { BrandVoiceTranslator } from '../../../../lib/intelligence/social/translator';
import { VoiceGuidelines, TranslationInput } from '../../../../types/social';

describe('BrandVoiceTranslator - Rigor de Voz (Dandara Validation)', () => {
  const mockGuidelines: VoiceGuidelines = {
    tone: 'Profissional',
    forbiddenWords: ['barato', 'promoção', 'desconto', 'grátis'],
    preferredTerms: {
      'cliente': 'membro',
      'comprar': 'aderir'
    },
    formatting: {
      useEmojis: true,
      paragraphStyle: 'short'
    }
  };

  it('deve bloquear 100% das palavras proibidas mesmo com variações de case e pontuação', async () => {
    const input: TranslationInput = {
      content: 'Isso é GRÁTIS? Ou tem alguma PROMOÇÃO? Quero algo BARATO!',
      guidelines: mockGuidelines
    };

    const result = await BrandVoiceTranslator.translate(input);
    
    const forbiddenFound = mockGuidelines.forbiddenWords.some(word => 
      result.translatedText.toLowerCase().includes(word.toLowerCase())
    );

    expect(forbiddenFound).toBe(false);
    expect(result.translatedText).toContain('[REDACTED]');
    expect(result.metrics.forbiddenWordsRemoved.length).toBe(3);
  });

  it('deve lidar com palavras proibidas coladas em pontuação', async () => {
    const input: TranslationInput = {
      content: 'Aproveite a promoção! É grátis.',
      guidelines: mockGuidelines
    };

    const result = await BrandVoiceTranslator.translate(input);
    
    expect(result.translatedText.toLowerCase()).not.toContain('promoção');
    expect(result.translatedText.toLowerCase()).not.toContain('grátis');
  });

  it('não deve substituir substrings que não são palavras completas (ex: "grátis" vs "gratitude")', async () => {
    const input: TranslationInput = {
      content: 'Sinto muita gratitude por este serviço.',
      guidelines: mockGuidelines
    };

    const result = await BrandVoiceTranslator.translate(input);
    
    expect(result.translatedText).toContain('gratitude');
    expect(result.translatedText).not.toContain('[REDACTED]');
  });
});
