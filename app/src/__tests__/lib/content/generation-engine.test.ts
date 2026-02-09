/**
 * Content Generation Engine Tests
 * @story S33-GEN-01, S33-GEN-03
 *
 * Testa geracao de conteudo em 4 formatos, fallback, e brand not found.
 */

jest.mock('@/lib/ai/gemini', () => ({
  generateWithGemini: jest.fn(),
}));

jest.mock('@/lib/firebase/firestore', () => ({
  getBrand: jest.fn(),
}));

import { generateContent } from '@/lib/content/generation-engine';
import { generateWithGemini } from '@/lib/ai/gemini';
import { getBrand } from '@/lib/firebase/firestore';

const mockGemini = generateWithGemini as jest.MockedFunction<typeof generateWithGemini>;
const mockGetBrand = getBrand as jest.MockedFunction<typeof getBrand>;

describe('Content Generation Engine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetBrand.mockResolvedValue({
      id: 'brand-1',
      userId: 'user-1',
      name: 'TestBrand',
      vertical: 'SaaS',
      positioning: 'Best in class',
      voiceTone: 'professional and friendly',
      audience: { who: 'developers', pain: 'time wasting', awareness: 'solution_aware', objections: [] },
      offer: { what: 'SaaS tool', ticket: 97, type: 'subscription', differentiator: 'AI-powered' },
    } as unknown as Awaited<ReturnType<typeof getBrand>>);
  });

  it('gera resultado valido para format "post"', async () => {
    const postOutput = JSON.stringify({
      text: 'Descubra como transformar seu negocio com estrategias inteligentes. #marketing',
      hashtags: ['#marketing', '#negocios', '#estrategia'],
      cta: 'Salve este post para depois!',
      visualSuggestion: 'Imagem de graficos em alta',
    });

    mockGemini.mockResolvedValue(postOutput);

    const result = await generateContent('brand-1', {
      format: 'post',
      platform: 'instagram',
      topic: 'Marketing digital',
    });

    expect(result.generated).toBe(true);
    expect(result.content).toBeDefined();
    expect(result.metadata.format).toBe('post');
    expect(result.metadata.platform).toBe('instagram');
    expect(result.metadata.model).toBe('gemini-2.0-flash');
    expect(result.error).toBeUndefined();
  });

  it('gera resultado valido para format "carousel"', async () => {
    const carouselOutput = JSON.stringify({
      title: '5 Estrategias de Marketing',
      slides: [
        { title: 'Estrategia 1', body: 'Descricao da estrategia 1' },
        { title: 'Estrategia 2', body: 'Descricao da estrategia 2' },
        { title: 'Estrategia 3', body: 'Descricao da estrategia 3' },
      ],
      ctaFinal: 'Salve e compartilhe!',
      coverSuggestion: 'Design moderno com cores da marca',
    });

    mockGemini.mockResolvedValue(carouselOutput);

    const result = await generateContent('brand-1', {
      format: 'carousel',
      platform: 'instagram',
      topic: 'Estrategias de marketing',
      keywords: ['marketing', 'estrategia'],
    });

    expect(result.generated).toBe(true);
    expect(result.content).toBeDefined();
    expect(result.metadata.format).toBe('carousel');
  });

  it('gera resultado valido para format "story"', async () => {
    const storyOutput = JSON.stringify({
      text: 'Oferta relampago hoje! Garanta ja.',
      backgroundSuggestion: 'Gradiente vibrante com cores da marca',
      stickerSuggestions: ['poll: voce ja testou?', 'question: qual sua maior duvida?'],
      ctaSwipeUp: 'Arraste para cima',
    });

    mockGemini.mockResolvedValue(storyOutput);

    const result = await generateContent('brand-1', {
      format: 'story',
      platform: 'instagram',
      topic: 'Oferta relampago',
      tone: 'urgente',
    });

    expect(result.generated).toBe(true);
    expect(result.content).toBeDefined();
    expect(result.metadata.format).toBe('story');
  });

  it('gera resultado valido para format "reel"', async () => {
    const reelOutput = JSON.stringify({
      hook: 'Pare tudo e veja isso!',
      scenes: [
        { timing: '0-3s', script: 'Mostre o problema rapidamente', overlay: 'Problema comum' },
        { timing: '3-10s', script: 'Apresente a solucao', overlay: 'Solucao simples' },
      ],
      musicReference: 'Trend upbeat',
      ctaFinal: 'Siga para mais dicas',
    });

    mockGemini.mockResolvedValue(reelOutput);

    const result = await generateContent('brand-1', {
      format: 'reel',
      platform: 'instagram',
      topic: 'Dica rapida',
      keywords: ['dica', 'agilidade'],
    });

    expect(result.generated).toBe(true);
    expect(result.content).toBeDefined();
    expect(result.metadata.format).toBe('reel');
  });

  it('fallback funciona quando Gemini retorna JSON invalido', async () => {
    mockGemini.mockResolvedValue('not valid json {{{');

    const result = await generateContent('brand-1', {
      format: 'post',
      platform: 'instagram',
      topic: 'Teste falha',
    });

    expect(result.generated).toBe(false);
    expect(result.error).toBe('generation_failed');
    expect(result.suggestions.length).toBeGreaterThan(0);
  });

  it('brand not found retorna generated: false', async () => {
    mockGetBrand.mockResolvedValue(null as unknown as Awaited<ReturnType<typeof getBrand>>);

    const result = await generateContent('brand-inexistente', {
      format: 'post',
      platform: 'instagram',
      topic: 'Teste',
    });

    expect(result.generated).toBe(false);
    expect(result.error).toBe('brand_not_found');
  });
});
