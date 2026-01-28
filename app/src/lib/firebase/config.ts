import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration
// IMPORTANT: we trim env vars because Vercel values sometimes end up with trailing whitespace/newlines.
const apiKey = (process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '').trim();
const authDomain = (process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '').trim();
const projectId = (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '').trim();
const storageBucket = (process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '').trim();
const messagingSenderId = (process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '').trim();
const appId = (process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '').trim();

const firebaseConfig = {
  apiKey,
  authDomain,
  projectId,
  storageBucket,
  messagingSenderId,
  appId,
};

// Debug: Log config to verify env vars are loaded (REMOVE IN PRODUCTION)
if (typeof window !== 'undefined') {
  const missing = Object.entries(firebaseConfig)
    .filter(([, v]) => !v)
    .map(([k]) => k);

  if (missing.length > 0) {
    console.warn('⚠️ Firebase Config está incompleta! Verifique seu .env.local', { missing });
  }
}

// Initialize Firebase only once
// US-11.24 Fix: Evitar crash durante o build da Vercel se as chaves estiverem vazias
const app = getApps().length === 0 && apiKey 
  ? initializeApp(firebaseConfig) 
  : (getApps()[0] || null);

// Export services
// Scripts (ex: ingest) podem desativar auth via SKIP_AUTH=1 para evitar erros de key/host
const skipAuth = process.env.SKIP_AUTH === '1' || !app || process.env.NODE_ENV === 'production';

// Fix: Ensure auth is only initialized if app exists to avoid "Cannot read properties of null (reading 'container')"
// US-28.01: Se app for null ou estivermos em build, retornamos null para evitar crash no build das rotas de API.
export const auth = skipAuth ? null : getAuth(app!);

// QA Hardening: Force Long Polling to avoid ERR_QUIC_PROTOCOL_ERROR
export const db = (skipAuth || !app) ? null : initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

export const storage = (skipAuth || !app) ? null : getStorage(app);

// US-28.01: Se não houver app (ambiente de build), exportamos mocks seguros para evitar crashes.
if (!app && process.env.NODE_ENV === 'production') {
  console.warn('[Firebase] App not initialized during build. Exporting null services.');
}
export default app;


