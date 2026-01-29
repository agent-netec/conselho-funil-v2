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

// US-28.01: Mocks para o build
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

if (!isBuild && firebaseConfig.apiKey) {
  try {
    appInstance = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    authInstance = getAuth(appInstance);
    dbInstance = isServer 
      ? getFirestore(appInstance)
      : initializeFirestore(appInstance, {
          experimentalForceLongPolling: true,
          cacheSizeBytes: CACHE_SIZE_UNLIMITED,
        });
    storageInstance = getStorage(appInstance);
  } catch (e) {
    console.error('[Firebase] Error:', e);
  }
}

// No cliente, se não inicializou, tentamos forçar a inicialização sem travas
if (!isServer && !appInstance && firebaseConfig.apiKey) {
  try {
    appInstance = initializeApp(firebaseConfig);
    authInstance = getAuth(appInstance);
    dbInstance = initializeFirestore(appInstance, {
      experimentalForceLongPolling: true,
      cacheSizeBytes: CACHE_SIZE_UNLIMITED,
    });
    storageInstance = getStorage(appInstance);
  } catch (e) {}
}

// Se chegarmos aqui e não tivermos instâncias reais, usamos mocks apenas se for servidor
// No cliente, se não houver instâncias reais, deixamos como null para que o erro seja visível e não silencioso
export const auth = authInstance || (isServer ? mockService : null);
export const db = dbInstance || (isServer ? mockService : null);
export const storage = storageInstance || (isServer ? mockService : null);
export default appInstance;
