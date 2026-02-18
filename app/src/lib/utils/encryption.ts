import CryptoJS from 'crypto-js';

/**
 * R-1.1: Chave mestra para criptografia — server-only.
 * Prioridade: ENCRYPTION_KEY > NEXT_PUBLIC_ENCRYPTION_KEY (migration).
 * Sem fallback hardcoded — falha se não configurada.
 */
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || process.env.NEXT_PUBLIC_ENCRYPTION_KEY;
if (!ENCRYPTION_KEY) {
  throw new Error('[Security] ENCRYPTION_KEY env var is required. Set it in Vercel/environment.');
}

/**
 * Criptografa um dado sensível usando AES-256.
 */
export function encrypt(data: string): string {
  if (!data) return data;
  return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
}

/**
 * Descriptografa um dado usando AES-256.
 */
export function decrypt(ciphertext: string): string {
  if (!ciphertext) return ciphertext;
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (e) {
    console.error('Erro ao descriptografar dado:', e);
    return ciphertext;
  }
}

/**
 * Criptografa recursivamente campos sensíveis em um objeto.
 * Procura por chaves como 'accessToken', 'refreshToken', 'token', 'clientSecret', 'email', 'firstName', 'lastName', 'phone'.
 */
export function encryptSensitiveFields(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;

  const sensitiveKeys = [
    'accessToken', 
    'refreshToken', 
    'token', 
    'clientSecret', 
    'apiKey',
    'developerToken',  // S30-PRE-03 (DT-14): Google Ads developer token
    'appSecret',       // S30-PRE-03 (DT-14): Meta App Secret
    'email',
    'firstName',
    'lastName',
    'phone',
    'ipAddress'
  ];
  const newObj = Array.isArray(obj) ? [] : {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      
      if (sensitiveKeys.includes(key) && typeof value === 'string') {
        (newObj as any)[key] = encrypt(value);
      } else if (typeof value === 'object') {
        (newObj as any)[key] = encryptSensitiveFields(value);
      } else {
        (newObj as any)[key] = value;
      }
    }
  }

  return newObj;
}

/**
 * Descriptografa recursivamente campos sensíveis em um objeto.
 */
export function decryptSensitiveFields(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;

  const sensitiveKeys = [
    'accessToken', 
    'refreshToken', 
    'token', 
    'clientSecret', 
    'apiKey',
    'developerToken',  // S30-PRE-03 (DT-14): Google Ads developer token
    'appSecret',       // S30-PRE-03 (DT-14): Meta App Secret
    'email',
    'firstName',
    'lastName',
    'phone',
    'ipAddress'
  ];
  const newObj = Array.isArray(obj) ? [] : {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      
      if (sensitiveKeys.includes(key) && typeof value === 'string' && value.length > 20) { // Check length to avoid decrypting non-encrypted strings
        try {
          const decrypted = decrypt(value);
          if (decrypted) {
            (newObj as any)[key] = decrypted;
          } else {
            (newObj as any)[key] = value;
          }
        } catch {
          (newObj as any)[key] = value;
        }
      } else if (typeof value === 'object') {
        (newObj as any)[key] = decryptSensitiveFields(value);
      } else {
        (newObj as any)[key] = value;
      }
    }
  }

  return newObj;
}
