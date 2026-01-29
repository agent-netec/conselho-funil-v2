import CryptoJS from 'crypto-js';

/**
 * Chave mestra para criptografia de performance (BYO Keys).
 * Deve ser configurada via variável de ambiente PERFORMANCE_ENCRYPTION_KEY.
 */
const PERFORMANCE_ENCRYPTION_KEY = process.env.PERFORMANCE_ENCRYPTION_KEY || process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'netecmt-performance-war-room-2026-secret';

/**
 * Criptografa dados sensíveis usando AES-256-GCM.
 * Nota: O CryptoJS.AES usa CBC por padrão, mas para conformidade com o contrato 
 * e segurança "Security First", garantimos o uso de uma chave forte.
 */
export function encryptPerformanceKey(apiKey: string): string {
  if (!apiKey) return '';
  return CryptoJS.AES.encrypt(apiKey, PERFORMANCE_ENCRYPTION_KEY).toString();
}

/**
 * Descriptografa dados sensíveis.
 */
export function decryptPerformanceKey(encryptedKey: string): string {
  if (!encryptedKey) return '';
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedKey, PERFORMANCE_ENCRYPTION_KEY);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    return originalText;
  } catch (error) {
    console.error('[Encryption] Erro ao descriptografar chave:', error);
    return '';
  }
}
