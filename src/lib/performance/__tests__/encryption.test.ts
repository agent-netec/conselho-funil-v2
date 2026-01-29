import { encryptPerformanceKey, decryptPerformanceKey } from '../encryption';

describe('Performance Encryption (AES-256-GCM)', () => {
  const testKey = 'meta_ads_sk_123456789';

  it('deve criptografar uma chave e retornar uma string diferente da original', () => {
    const encrypted = encryptPerformanceKey(testKey);
    expect(encrypted).toBeDefined();
    expect(encrypted).not.toBe(testKey);
    expect(encrypted.length).toBeGreaterThan(20);
  });

  it('deve descriptografar corretamente uma chave criptografada', () => {
    const encrypted = encryptPerformanceKey(testKey);
    const decrypted = decryptPerformanceKey(encrypted);
    expect(decrypted).toBe(testKey);
  });

  it('deve retornar string vazia para entradas vazias', () => {
    expect(encryptPerformanceKey('')).toBe('');
    expect(decryptPerformanceKey('')).toBe('');
  });

  it('deve lidar com erros de descriptografia graciosamente', () => {
    const invalidCipher = 'invalid-cipher-text';
    const decrypted = decryptPerformanceKey(invalidCipher);
    expect(decrypted).toBe('');
  });
});
