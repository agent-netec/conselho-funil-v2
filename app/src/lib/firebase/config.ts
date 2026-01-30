import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, CACHE_SIZE_UNLIMITED, getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: (process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '').trim(),
  authDomain: (process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '').trim(),
  projectId: (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '').trim(),
  storageBucket: (process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '').trim(),
  messagingSenderId: (process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '').trim(),
  appId: (process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '').trim(),
};

const isServer = typeof window === 'undefined';
// US-28.01: Apenas ignora inicialização se for EXPLICITAMENTE a fase de build estático
const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';

let appInstance: any = null;
let authInstance: any = null;
let dbInstance: any = null;
let storageInstance: any = null;

if (!isBuildPhase && firebaseConfig.apiKey) {
  try {
    appInstance = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    authInstance = getAuth(appInstance);
    
    // No servidor usamos getFirestore (mais leve), no cliente usamos a versão completa
    dbInstance = isServer 
      ? getFirestore(appInstance)
      : initializeFirestore(appInstance, {
          experimentalForceLongPolling: true,
          cacheSizeBytes: CACHE_SIZE_UNLIMITED,
        });
        
    storageInstance = getStorage(appInstance);
  } catch (e) {
    if (!isServer) console.error('[Firebase] Erro ao inicializar SDK real:', e);
  }
} else if (!isBuildPhase && !isServer) {
  console.error('[Firebase] ERRO: NEXT_PUBLIC_FIREBASE_API_KEY ausente no navegador.');
}

export const auth = authInstance;
export const db = dbInstance;
export const storage = storageInstance;
export default appInstance;
