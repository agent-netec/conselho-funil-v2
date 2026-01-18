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
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Export services
// Scripts (ex: ingest) podem desativar auth via SKIP_AUTH=1 para evitar erros de key/host
const skipAuth = process.env.SKIP_AUTH === '1';
export const auth = skipAuth ? null : getAuth(app);

// QA Hardening: Force Long Polling to avoid ERR_QUIC_PROTOCOL_ERROR
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

export const storage = getStorage(app);
export default app;


