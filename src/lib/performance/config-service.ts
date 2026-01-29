import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
  import { db } from '../firebase/config';
  import { withResilience } from '../firebase/resilience';
  import { PerformanceConfig } from '@/types/performance';
  import { encryptPerformanceKey } from './encryption';
  
  /**
   * Busca a configuração de performance de uma marca.
   * Collection: brands/{brandId}/performance_configs/config
   */
  export async function getPerformanceConfig(brandId: string): Promise<PerformanceConfig | null> {
    const configRef = doc(db, 'brands', brandId, 'performance_configs', 'config');
    const snap = await getDoc(configRef);
    
    if (!snap.exists()) return null;
    return snap.data() as PerformanceConfig;
  }
  
  /**
   * Salva ou atualiza a configuração de performance com chaves criptografadas.
   * Implementa "Security First" e isolamento por brandId.
   */
  export async function savePerformanceConfig(
    brandId: string, 
    config: Partial<PerformanceConfig>,
    rawKeys?: { meta_ads?: string; google_ads?: string }
  ) {
    const configRef = doc(db, 'brands', brandId, 'performance_configs', 'config');
    const now = Timestamp.now();
  
    // Prepara as integrações com chaves criptografadas se fornecidas
    const integrations: PerformanceConfig['integrations'] = { ...config.integrations };
  
    if (rawKeys?.meta_ads) {
      integrations.meta_ads = {
        ...integrations.meta_ads,
        encryptedApiKey: encryptPerformanceKey(rawKeys.meta_ads),
        accountId: integrations.meta_ads?.accountId || '',
        status: 'active',
        lastValidated: now,
      };
    }
  
    if (rawKeys?.google_ads) {
      integrations.google_ads = {
        ...integrations.google_ads,
        encryptedApiKey: encryptPerformanceKey(rawKeys.google_ads),
        accountId: integrations.google_ads?.accountId || '',
        status: 'active',
        lastValidated: now,
      };
    }
  
    const finalConfig = {
      ...config,
      brandId,
      integrations,
      updatedAt: now,
    };
  
    await withResilience(async () => {
      await setDoc(configRef, finalConfig, { merge: true });
    });
  
    return true;
  }
  