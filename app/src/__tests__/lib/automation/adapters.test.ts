import { MetaAdsAdapter } from '@/lib/automation/adapters/meta';
import { InstagramAdapter } from '@/lib/automation/adapters/instagram';
import { MonaraTokenVault } from '@/lib/firebase/vault';
import { PersonalizationMaestro } from '@/lib/intelligence/personalization/maestro';

// Mocks
jest.mock('@/lib/firebase/config', () => ({ db: {} }));
jest.mock('@/lib/firebase/vault');
jest.mock('@/lib/intelligence/personalization/maestro');

describe('ST-20.4: Automação Meta & Instagram', () => {
  const brandId = 'test-brand-ads';
  const adapterMeta = new MetaAdsAdapter(brandId);
  const adapterInsta = new InstagramAdapter(brandId);

  beforeEach(() => {
    jest.clearAllMocks();
    (MonaraTokenVault.getToken as jest.Mock).mockResolvedValue({
      accessToken: 'valid_token'
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
