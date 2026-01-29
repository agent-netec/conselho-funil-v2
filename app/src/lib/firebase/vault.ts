import { db } from './config';
import { collection, doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { encrypt, decrypt } from '../utils/encryption';

/**
 * @fileoverview Monara Token Vault (ST-20.2)
 * Gerencia o armazenamento seguro de tokens de API (Meta, Google, etc)
 * com criptografia AES-256 e isolamento por brandId.
 */

export interface MonaraToken {
  brandId: string;
  provider: 'meta' | 'google' | 'instagram' | 'stripe';
  accessToken: string;
  refreshToken?: string;
  expiresAt: Timestamp;
  scopes: string[];
  metadata: Record<string, any>;
  updatedAt: Timestamp;
}

export class MonaraTokenVault {
  private static getCollectionPath(brandId: string) {
    return `brands/${brandId}/secrets`;
  }

  /**
   * Salva um token no Vault com criptografia.
   */
  static async saveToken(brandId: string, tokenData: Omit<MonaraToken, 'updatedAt'>): Promise<void> {
    const secretRef = doc(db, this.getCollectionPath(brandId), `token_${tokenData.provider}`);
    
    // Criptografar tokens sensíveis
    const encryptedToken: MonaraToken = {
      ...tokenData,
      accessToken: encrypt(tokenData.accessToken),
      refreshToken: tokenData.refreshToken ? encrypt(tokenData.refreshToken) : undefined,
      updatedAt: Timestamp.now()
    };

    await setDoc(secretRef, encryptedToken);
  }

  /**
   * Recupera um token do Vault e o descriptografa.
   */
  static async getToken(brandId: string, provider: MonaraToken['provider']): Promise<MonaraToken | null> {
    const secretRef = doc(db, this.getCollectionPath(brandId), `token_${provider}`);
    const snap = await getDoc(secretRef);

    if (!snap.exists()) return null;

    const data = snap.data() as MonaraToken;

    return {
      ...data,
      accessToken: decrypt(data.accessToken),
      refreshToken: data.refreshToken ? decrypt(data.refreshToken) : undefined
    };
  }

  /**
   * Verifica se um token está expirado ou prestes a expirar (buffer de 24h).
   */
  static isTokenExpiring(token: MonaraToken): boolean {
    const buffer = 24 * 60 * 60 * 1000; // 24 horas
    const now = Date.now();
    return token.expiresAt.toMillis() - now < buffer;
  }
}
