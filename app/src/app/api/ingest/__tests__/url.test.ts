/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';

// Mocks devem vir ANTES das importações que usam as libs problemáticas
jest.mock('@/lib/ai/url-scraper', () => ({
  extractContentFromUrl: jest.fn(),
}));

jest.mock('@/lib/ai/gemini', () => ({
  analyzeMultimodalWithGemini: jest.fn(),
  isGeminiConfigured: jest.fn(() => true),
}));

jest.mock('@/lib/firebase/assets', () => ({
  createAsset: jest.fn(),
  processAssetText: jest.fn(() => Promise.resolve()),
  updateAssetStatus: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  Timestamp: {
    now: jest.fn(() => ({ toMillis: () => Date.now() })),
  },
}));

// Agora importamos a rota e as funções mockadas
import { POST } from '../url/route';
import { extractContentFromUrl } from '@/lib/ai/url-scraper';
import { analyzeMultimodalWithGemini } from '@/lib/ai/gemini';
import { createAsset } from '@/lib/firebase/assets';

// Mock do fetch global
global.fetch = jest.fn();

describe('API Route: /api/ingest/url (Regressão & Smoke)', () => {
  const mockUserId = 'user-123';
  const mockBrandId = 'brand-456';
  const validUrl = 'https://exemplo.com';

  beforeEach(() => {
    jest.clearAllMocks();
    (createAsset as jest.Mock).mockResolvedValue('asset-id-999');
  });

  describe('Cenário: Validações de Erro 400', () => {
    it('deve falhar se brandId estiver ausente', async () => {
      const body = { url: validUrl, userId: mockUserId };
      const req = { json: async () => body } as any;
      const res = await POST(req);
      const data = await res.json();
      expect(res.status).toBe(400);
      expect(data.error).toBe('brandId é obrigatório');
    });

    it('deve falhar se a URL for inválida', async () => {
      const body = { url: 'ftp://invalido', brandId: mockBrandId, userId: mockUserId };
      const req = { json: async () => body } as any;
      const res = await POST(req);
      expect(res.status).toBe(400);
    });
  });

  describe('Cenário: URL Texto (Regressão)', () => {
    it('deve processar conteúdo textual com sucesso', async () => {
      const longText = 'Conteúdo extraído com sucesso pela ferramenta de scraping.'.repeat(5);
      (extractContentFromUrl as jest.Mock).mockResolvedValue({
        title: 'Sucesso Texto',
        content: longText,
        method: 'jina',
      });

      const body = { url: validUrl, brandId: mockBrandId, userId: mockUserId };
      const req = { json: async () => body } as any;
      
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.method).toBe('jina');
    });
  });

  describe('Cenário: URL Visual com Fallback OCR (Regressão)', () => {
    it('deve usar Gemini Vision se o texto for curto', async () => {
      (extractContentFromUrl as jest.Mock).mockResolvedValue({
        title: 'Página Visual',
        content: 'Curto',
        primaryImageUrl: 'https://exemplo.com/print.png',
        method: 'readability',
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        headers: { get: () => 'image/png' },
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(100)),
      });

      const ocrText = 'Texto extraído via IA do Gemini a partir da imagem.'.repeat(3);
      (analyzeMultimodalWithGemini as jest.Mock).mockResolvedValue(ocrText);

      const body = { url: validUrl, brandId: mockBrandId, userId: mockUserId };
      const req = { json: async () => body } as any;

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data.method).toBe('gemini-vision');
      expect(data.data.content).toBe(ocrText);
    });
  });

  describe('Cenário: Smoke Test (Integridade)', () => {
    it('deve garantir persistência do brandId no asset criado', async () => {
      const longText = 'Texto para teste de fumaça.'.repeat(10);
      (extractContentFromUrl as jest.Mock).mockResolvedValue({
        content: longText,
        method: 'jina',
      });

      const body = { url: validUrl, brandId: mockBrandId, userId: mockUserId };
      const req = { json: async () => body } as any;

      await POST(req);

      expect(createAsset).toHaveBeenCalledWith(expect.objectContaining({
        brandId: mockBrandId,
        userId: mockUserId,
        type: 'url'
      }));
    });
  });
});
