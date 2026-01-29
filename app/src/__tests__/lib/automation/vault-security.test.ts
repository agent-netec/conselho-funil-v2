import { MonaraTokenVault } from '@/lib/firebase/vault';
import { encrypt, decrypt } from '@/lib/utils/encryption';

// Mock do Firebase
jest.mock('@/lib/firebase/config', () => ({
  db: {}
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  Timestamp: {
    now: () => ({ toMillis: () => Date.now() })
  }
}));

describe('ST-20.4: Segurança do Vault e Criptografia AES-256', () => {
  const brandId = 'test-brand-security';
  const rawToken = 'meta_access_token_12345';

  it('Deve criptografar o token antes de salvar e descriptografar ao recuperar', async () => {
    const setDoc = require('firebase/firestore').setDoc;
    const getDoc = require('firebase/firestore').getDoc;

    // 1. Testar salvamento
    await MonaraTokenVault.saveToken(brandId, {
      brandId,
      provider: 'meta',
      accessToken: rawToken,
      expiresAt: { toMillis: () => Date.now() + 10000 } as any,
      scopes: ['ads_management'],
      metadata: {}
    });

    // Verifica se o setDoc foi chamado com o token criptografado
    const lastCall = setDoc.mock.calls[0][1];
    expect(lastCall.accessToken).not.toBe(rawToken);
    expect(decrypt(lastCall.accessToken)).toBe(rawToken);

    // 2. Testar recuperação
    getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => lastCall
    });

    const recoveredToken = await MonaraTokenVault.getToken(brandId, 'meta');
    expect(recoveredToken?.accessToken).toBe(rawToken);
  });

  it('Deve detectar tokens expirando (Resiliência)', () => {
    const expiringToken = {
      expiresAt: { toMillis: () => Date.now() + (12 * 60 * 60 * 1000) } // 12h (menos que o buffer de 24h)
    } as any;

    const freshToken = {
      expiresAt: { toMillis: () => Date.now() + (48 * 60 * 60 * 1000) } // 48h
    } as any;

    expect(MonaraTokenVault.isTokenExpiring(expiringToken)).toBe(true);
    expect(MonaraTokenVault.isTokenExpiring(freshToken)).toBe(false);
  });
});
