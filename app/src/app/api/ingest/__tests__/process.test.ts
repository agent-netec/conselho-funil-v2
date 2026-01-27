/**
 * @jest-environment node
 */
import { POST } from './route';
import { getAsset, updateAsset, updateAssetStatus, processAssetText } from '@/lib/firebase/assets';
import { analyzeMultimodalWithGemini } from '@/lib/ai/gemini';

// Mocks
jest.mock('@/lib/firebase/assets', () => ({
  getAsset: jest.fn(),
  updateAsset: jest.fn(),
  updateAssetStatus: jest.fn(),
  processAssetText: jest.fn(() => Promise.resolve()),
}));

jest.mock('@/lib/ai/gemini', () => ({
  analyzeMultimodalWithGemini: jest.fn(),
  isGeminiConfigured: jest.fn(() => true),
}));

// Mock do fetch global
global.fetch = jest.fn();

describe('API Route: /api/ingest/process', () => {
  const mockAssetId = 'asset-abc-123';
  const mockUserId = 'user-789';
  const mockBrandId = 'brand-000';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Cenário: Validações Iniciais', () => {
    it('deve retornar 400 se assetId não for fornecido', async () => {
      const req = { json: async () => ({}) } as any;
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('assetId é obrigatório');
    });

    it('deve retornar 404 se o asset não existir no Firebase', async () => {
      (getAsset as jest.Mock).mockResolvedValue(null);
      const req = { json: async () => ({ assetId: mockAssetId }) } as any;
      const res = await POST(req);

      expect(res.status).toBe(404);
    });

    it('deve retornar 400 se o asset não tiver brandId ou userId', async () => {
      (getAsset as jest.Mock).mockResolvedValue({ id: mockAssetId });
      const req = { json: async () => ({ assetId: mockAssetId }) } as any;
      const res = await POST(req);

      expect(res.status).toBe(400);
      expect(res.statusText).not.toBe('OK'); // Just checking for error status
    });
  });

  describe('Cenário: Processamento de Imagem (Happy Path)', () => {
    it('deve extrair texto de uma imagem via Gemini Vision', async () => {
      const mockAsset = {
        id: mockAssetId,
        brandId: mockBrandId,
        userId: mockUserId,
        type: 'image',
        mimeType: 'image/png',
        url: 'https://storage.com/img.png',
        name: 'test-image.png'
      };
      (getAsset as jest.Mock).mockResolvedValue(mockAsset);

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024))
      });

      const ocrText = 'Texto extraído da imagem de teste.';
      (analyzeMultimodalWithGemini as jest.Mock).mockResolvedValue(ocrText);

      const req = { json: async () => ({ assetId: mockAssetId }) } as any;
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(analyzeMultimodalWithGemini).toHaveBeenCalled();
      expect(updateAsset).toHaveBeenCalledWith(mockAssetId, expect.objectContaining({
        extractedText: ocrText
      }));
    });
  });

  describe('Cenário: Processamento de PDF (Happy Path)', () => {
    it('deve extrair texto de um PDF via Gemini Vision', async () => {
      const mockAsset = {
        id: mockAssetId,
        brandId: mockBrandId,
        userId: mockUserId,
        mimeType: 'application/pdf',
        url: 'https://storage.com/file.pdf',
        name: 'test.pdf'
      };
      (getAsset as jest.Mock).mockResolvedValue(mockAsset);

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024))
      });

      const ocrText = 'Conteúdo extraído do PDF.';
      (analyzeMultimodalWithGemini as jest.Mock).mockResolvedValue(ocrText);

      const req = { json: async () => ({ assetId: mockAssetId }) } as any;
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(updateAsset).toHaveBeenCalled();
    });
  });

  describe('Cenário: Limites e Erros de Download', () => {
    it('deve retornar 502 se falhar ao baixar o arquivo', async () => {
      (getAsset as jest.Mock).mockResolvedValue({
        id: mockAssetId,
        brandId: mockBrandId,
        userId: mockUserId,
        mimeType: 'image/png',
        url: 'https://broken-link.com'
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      const req = { json: async () => ({ assetId: mockAssetId }) } as any;
      const res = await POST(req);

      expect(res.status).toBe(502);
      expect(updateAssetStatus).toHaveBeenCalledWith(mockAssetId, 'error', expect.any(String));
    });

    it('deve retornar 400 se o arquivo exceder 25MB', async () => {
      (getAsset as jest.Mock).mockResolvedValue({
        id: mockAssetId,
        brandId: mockBrandId,
        userId: mockUserId,
        mimeType: 'image/png',
        url: 'https://large-file.com'
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve({ byteLength: 30 * 1024 * 1024 }) // 30MB
      });

      const req = { json: async () => ({ assetId: mockAssetId }) } as any;
      const res = await POST(req);

      expect(res.status).toBe(400);
      expect(updateAssetStatus).toHaveBeenCalledWith(mockAssetId, 'error', expect.stringContaining('muito grande'));
    });
  });
});
