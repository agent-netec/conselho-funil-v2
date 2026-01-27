import { CopyRefactorEngine } from '../engine';
import { CriticalGap } from '@/types/funnel';
import { CopyDNA } from '@/types/vault';
import * as gemini from '@/lib/ai/gemini';

// Mock do Gemini
jest.mock('@/lib/ai/gemini', () => ({
  generateWithGemini: jest.fn()
}));

describe('CopyRefactorEngine', () => {
  const mockGap: CriticalGap = {
    stepId: 'vsl_1',
    metric: 'conversionRate',
    currentValue: 0.01,
    targetValue: 0.03,
    lossEstimate: 15000
  };

  const mockDNAs: CopyDNA[] = [
    {
      id: 'dna_1',
      brandId: 'brand_1',
      name: 'Tom Autoritário',
      type: 'style_guide',
      content: 'Use frases curtas, diretas e com autoridade médica.',
      platform_optimization: ['Instagram'],
      tags: ['saude'],
      updatedAt: {} as any
    }
  ];

  test('should generate suggestions via Gemini', async () => {
    const mockResponse = JSON.stringify({
      suggestions: [
        {
          type: 'headline',
          original: '',
          variation: 'Nova Headline de Teste',
          reasoning: 'Teste de raciocínio',
          copywriterInsight: 'Insight de teste'
        }
      ]
    });

    (gemini.generateWithGemini as jest.Mock).mockResolvedValue(mockResponse);

    const suggestions = await CopyRefactorEngine.suggestRefactors('brand_1', mockGap, mockDNAs);
    
    expect(suggestions.length).toBe(1);
    expect(suggestions[0].variation).toBe('Nova Headline de Teste');
    expect(gemini.generateWithGemini).toHaveBeenCalled();
  });
});
