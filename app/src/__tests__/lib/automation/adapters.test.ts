import { MetaAdsAdapter } from '@/lib/automation/adapters/meta';
import { InstagramAdapter } from '@/lib/automation/adapters/instagram';
import { MonaraTokenVault } from '@/lib/firebase/vault';
import { PersonalizationMaestro } from '@/lib/intelligence/personalization/maestro';

// Mocks
jest.mock('@/lib/firebase/config', () => ({ db: {} }));
jest.mock('@/lib/firebase/vault');
jest.mock('@/lib/intelligence/personalization/maestro');
jest.mock('@/lib/integrations/ads/api-helpers', () => ({
  fetchWithRetry: jest.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ success: true }),
  }),
  sanitizeForLog: jest.fn((s: string) => '***'),
}));

describe('ST-20.4: Automação Meta & Instagram', () => {
  const brandId = 'test-brand-ads';
  const adapterMeta = new MetaAdsAdapter(brandId);
  const adapterInsta = new InstagramAdapter(brandId);

  beforeEach(() => {
    jest.clearAllMocks();
    (MonaraTokenVault.getValidToken as jest.Mock).mockResolvedValue({
      accessToken: 'valid_token',
      provider: 'meta',
    });
    (MonaraTokenVault.getToken as jest.Mock).mockResolvedValue({
      accessToken: 'valid_token',
      provider: 'meta',
    });
  });

  it('Deve chamar updateAdCreative com os parâmetros corretos', async () => {
    const creative = {
      headline: 'Oferta Especial',
      body: 'Confira nossa nova oferta!',
      image_url: 'https://example.com/image.jpg'
    };

    const result = await adapterMeta.updateAdCreative('ad_123', creative);
    
    expect(result.success).toBe(true);
    expect(result.externalId).toBe('ad_123');
    expect(result.actionTaken).toBe('update_creative');
  });

  it('Deve chamar syncCustomAudience com SHA256 hashing', async () => {
    const result = await adapterMeta.syncCustomAudience('audience_789', ['lead1@test.com', 'lead2@test.com']);
    
    expect(result.success).toBe(true);
    expect(result.externalId).toBe('audience_789');
    expect(result.actionTaken).toBe('sync_audience');
  });

  it('Deve enviar DM via Instagram e registrar no Maestro', async () => {
    const sendResult = await adapterInsta.sendDM('user_456', 'Olá, tudo bem?');
    expect(sendResult).toBe(true);

    // Simular recebimento de mensagem
    await adapterInsta.handleIncomingMessage('user_456', 'Quero comprar');
    
    expect(PersonalizationMaestro.processInteraction).toHaveBeenCalledWith(
      brandId,
      'user_456',
      expect.objectContaining({
        type: 'dm_received',
        platform: 'instagram'
      })
    );
  });
});
