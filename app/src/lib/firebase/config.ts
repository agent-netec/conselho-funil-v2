import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration
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

// US-28.01: Se estivermos em build, forçamos o uso de mocks para evitar crashes internos do SDK
const isBuild = process.env.NODE_ENV === 'production' && typeof window === 'undefined';

// Initialize Firebase only once
const app = (getApps().length === 0 && apiKey && typeof window !== 'undefined' && !isBuild)
  ? initializeApp(firebaseConfig) 
  : (getApps()[0] || null);

// Export services
const skipAuth = process.env.SKIP_AUTH === '1' || !app;

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
  getApp: () => app || { container: mockInternal.container },
  app: app || { container: mockInternal.container },
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

// Final safety check for the exported services
const getSafeService = (service: any) => {
  if (!service || typeof service !== 'object' || isBuild) return mockService;
  return service;
};

// US-28.01: Final attempt to bypass Firebase SDK internal access by mocking the module exports
export const auth = (app && !skipAuth && !isBuild) ? getSafeService(getAuth(app)) : mockService as any;
export const db = (app && process.env.SKIP_AUTH !== '1' && !isBuild) ? getSafeService(initializeFirestore(app, {
  experimentalForceLongPolling: true,
  cacheSizeBytes: CACHE_SIZE_UNLIMITED,
})) : mockService as any;
export const storage = (app && process.env.SKIP_AUTH !== '1' && !isBuild) ? getSafeService(getStorage(app)) : mockService as any;

// Force container property on exports
[auth, db, storage].forEach(s => {
  if (s) {
    try {
      if (!s.container) {
        Object.defineProperty(s, 'container', {
          get: () => mockInternal.container,
          configurable: true,
          enumerable: true
        });
      }
      if (!s.INTERNAL) s.INTERNAL = mockInternal;
    } catch (e) {}
  }
});

// US-28.01: Global process mock for Firebase SDK - forcing mocks on global object
if (isBuild && typeof global !== 'undefined') {
  const handler = {
    get: (target: any, prop: string) => {
      if (prop === 'container' || prop === 'INTERNAL') return mockInternal;
      return target[prop] || mockService;
    }
  };
  (global as any)._firebaseAuth = new Proxy(auth, handler);
  (global as any)._firebaseFirestore = new Proxy(db, handler);
  (global as any)._firebaseStorage = new Proxy(storage, handler);
  (global as any)._firebaseApp = new Proxy(app || mockService, handler);
  
  // US-28.01: Mocking the internal container directly on the global object for the SDK to find
  (global as any).firebaseAppInstance = new Proxy(mockService, handler);
  (global as any).firebaseApp = new Proxy(mockService, handler);
}

// US-28.01: Final attempt to bypass Firebase SDK internal access by mocking the module exports
if (isBuild && typeof module !== 'undefined') {
  try {
    const originalExports = (module as any).exports;
    if (originalExports) {
      (module as any).exports = {
        ...originalExports,
        auth: auth,
        db: db,
        storage: storage,
      };
    }
  } catch (e) {}
}

export default app;
