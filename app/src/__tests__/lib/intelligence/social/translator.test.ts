import { BrandVoiceTranslator } from '../../../../lib/intelligence/social/translator';
import { VoiceGuidelines, TranslationInput } from '../../../../types/social';

describe('BrandVoiceTranslator (ST-17.2)', () => {
  const mockGuidelines: VoiceGuidelines = {
    tone: 'Profissional e prestativo',
    forbiddenWords: ['barato', 'promoção', 'desconto'],
    preferredTerms: {
      'cliente': 'membro',
      'comprar': 'aderir'
    },
    formatting: {
      useEmojis: true,
      paragraphStyle: 'short'
    }
  };

  it('should remove 100% of forbidden words', async () => {
    const input: TranslationInput = {
      content: 'Temos uma promoção muito barato com desconto especial para você.',
      guidelines: mockGuidelines
    };

    const result = await BrandVoiceTranslator.translate(input);
    
    expect(result.translatedText).not.toContain('promoção');
    expect(result.translatedText).not.toContain('barato');
    expect(result.translatedText).not.toContain('desconto');
    expect(result.metrics.forbiddenWordsRemoved).toContain('promoção');
    expect(result.metrics.forbiddenWordsRemoved).toContain('barato');
    expect(result.metrics.forbiddenWordsRemoved).toContain('desconto');
  });

  it('should apply preferred terms', async () => {
    const input: TranslationInput = {
      content: 'Olá cliente, você deseja comprar nosso plano?',
      guidelines: mockGuidelines
    };

    const result = await BrandVoiceTranslator.translate(input);
    
    expect(result.translatedText).toContain('membro');
    expect(result.translatedText).toContain('aderir');
    expect(result.translatedText).not.toContain('cliente');
    expect(result.translatedText).not.toContain('comprar');
  });

  it( 'should apply tone and formatting', async () => {
    const input: TranslationInput = {
      content: 'O sistema está online.',
      guidelines: mockGuidelines
    };

    const result = await BrandVoiceTranslator.translate(input);
    
    expect(result.translatedText).toContain('Informamos que:'); // Mock do tom profissional
    expect(result.translatedText).toContain('🚀✨'); // Mock do emoji
  });

  it('should calculate toneMatch correctly', async () => {
    const input: TranslationInput = {
      content: 'Olá cliente.',
      guidelines: mockGuidelines
    };

    const result = await BrandVoiceTranslator.translate(input);
    
    expect(result.metrics.toneMatch).toBeGreaterThan(0.8);
  });

  it('should respect SLA (latency < 2s)', async () => {
    const input: TranslationInput = {
      content: 'Teste de performance.',
      guidelines: mockGuidelines
    };

    const result = await BrandVoiceTranslator.translate(input);
    
    expect(result.metrics.latencyMs).toBeLessThan(2000);
  });
});
