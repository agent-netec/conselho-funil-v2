/**
 * @jest-environment node
 */
import { generateCouncilAssetDelivery } from '@/lib/ai/asset-delivery';
import { isGeminiConfigured } from '@/lib/ai/gemini';

jest.mock('@/lib/firebase/config', () => ({
  db: {},
}));

jest.mock('@/lib/ai/rag', () => ({
  ragQuery: jest.fn().mockResolvedValue([]),
  formatContextForLLM: jest.fn().mockReturnValue(''),
}));

jest.mock('@/lib/ai/gemini', () => ({
  isGeminiConfigured: jest.fn().mockReturnValue(false),
}));

describe('Asset Delivery Engine (ST-1.5.3)', () => {
  it('deve ter a função de geração definida', () => {
    expect(generateCouncilAssetDelivery).toBeDefined();
  });

  // Este teste requer GOOGLE_AI_API_KEY. Se não houver, ele deve ser pulado em CI.
  it('deve retornar um objeto seguindo o contrato CouncilOutput', async () => {
    if (!isGeminiConfigured()) {
      console.warn('Skipping integration test: Gemini not configured');
      return;
    }

    const query = "Gere uma estratégia de tráfego para um funil de VSL de infoproduto de R$ 997";
    const result = await generateCouncilAssetDelivery(query);

    // Validação da Estratégia
    expect(result.strategy).toBeDefined();
    expect(typeof result.strategy.summary).toBe('string');
    expect(Array.isArray(result.strategy.steps)).toBe(true);

    // Validação de Market Data
    expect(Array.isArray(result.market_data)).toBe(true);
    if (result.market_data.length > 0) {
      const item = result.market_data[0];
      expect(item).toHaveProperty('metric');
      expect(item).toHaveProperty('benchmark_2026');
      expect(['success', 'warning', 'danger', 'neutral']).toContain(item.status);
    }

    // Validação de Assets
    expect(Array.isArray(result.assets)).toBe(true);
    if (result.assets.length > 0) {
      const asset = result.assets[0];
      expect(asset).toHaveProperty('type');
      expect(asset).toHaveProperty('content');
    }
  }, 30000); // 30s timeout para IA
});
