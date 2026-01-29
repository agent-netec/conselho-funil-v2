// US-28.01: Mocks robustos para evitar crashes durante o build estático da Next.js
const mockInternal = {
  container: {
    get: () => ({}),
  }
};

const mockService = {
  currentUser: null,
  onAuthStateChanged: () => () => {},
  signOut: async () => {},
  getApp: () => ({ container: mockInternal.container }),
  app: { container: mockInternal.container },
  INTERNAL: mockInternal,
  container: mockInternal.container,
  collection: () => ({ doc: () => ({ get: async () => ({ exists: () => false }) }) }),
  doc: () => ({ get: async () => ({ exists: () => false }) }),
  ref: () => ({ put: async () => ({}) }),
};

// Global mocks for Firebase SDK internal access
if (typeof global !== 'undefined') {
  (global as any).firebase = (global as any).firebase || { INTERNAL: mockInternal };
  (global as any).firebaseApp = (global as any).firebaseApp || mockService;
  (global as any)._firebaseApp = (global as any)._firebaseApp || mockService;
  (global as any).firebaseInternalContainer = mockInternal.container;
}

// US-28.01: Detect build phase more reliably
const isBuild = typeof window === 'undefined' && 
  (process.env.NEXT_PHASE === 'phase-production-build' || process.env.NODE_ENV === 'production');

let appInstance: any = null;
let authInstance: any = null;
let dbInstance: any = null;
let storageInstance: any = null;

function initialize() {
  if (isBuild) return;
  if (appInstance) return;

  try {
    const { initializeApp, getApps } = require('firebase/app');
    const { getAuth } = require('firebase/auth');
    const { initializeFirestore, CACHE_SIZE_UNLIMITED } = require('firebase/firestore');
    const { getStorage } = require('firebase/storage');

    const apiKey = (process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '').trim();
    const firebaseConfig = {
      apiKey,
      authDomain: (process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '').trim(),
      projectId: (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '').trim(),
      storageBucket: (process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '').trim(),
      messagingSenderId: (process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '').trim(),
      appId: (process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '').trim(),
    };

    if (apiKey) {
      appInstance = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
      if (appInstance && process.env.SKIP_AUTH !== '1') {
        authInstance = getAuth(appInstance);
        dbInstance = initializeFirestore(appInstance, {
          experimentalForceLongPolling: true,
          cacheSizeBytes: CACHE_SIZE_UNLIMITED,
        });
        storageInstance = getStorage(appInstance);
      }
    }
  } catch (e) {
    // Silently fail during build
  }
}

// Export as getters to ensure they are not evaluated too early and can be mocked
export const auth = isBuild ? mockService : (initialize(), authInstance || mockService);
export const db = isBuild ? mockService : (initialize(), dbInstance || mockService);
export const storage = isBuild ? mockService : (initialize(), storageInstance || mockService);
export default isBuild ? null : (initialize(), appInstance);
