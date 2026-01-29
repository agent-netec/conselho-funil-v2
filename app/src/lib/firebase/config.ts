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

// US-28.01: Mocks robustos para o build (evita erros de 'container' no servidor)
const mockService = {
  INTERNAL: { container: { get: () => ({}) } },
  container: { get: () => ({}) },
  _isMock: true,
} as any;

const isServer = typeof window === 'undefined';
const isBuild = isServer && process.env.NEXT_PHASE === 'phase-production-build';

let appInstance: any = null;
let authInstance: any = null;
let dbInstance: any = null;
let storageInstance: any = null;

if (!isBuild) {
  try {
    if (firebaseConfig.apiKey) {
      appInstance = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
      authInstance = getAuth(appInstance);
      dbInstance = isServer 
        ? getFirestore(appInstance)
        : initializeFirestore(appInstance, {
            experimentalForceLongPolling: true,
            cacheSizeBytes: CACHE_SIZE_UNLIMITED,
          });
      storageInstance = getStorage(appInstance);
    } else if (!isServer) {
      console.error('[Firebase] ERRO: NEXT_PUBLIC_FIREBASE_API_KEY não encontrada.');
    }
  } catch (e) {
    if (!isServer) console.error('[Firebase] Init Error:', e);
  }
}

export const auth = authInstance || mockService;
export const db = dbInstance || mockService;
export const storage = storageInstance || mockService;
export default appInstance;
