import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

/**
 * Firebase Admin SDK — for server-only operations that bypass security rules.
 * Used by: cron jobs, webhooks, server-to-server calls.
 * Auth: FIREBASE_SERVICE_ACCOUNT_KEY env var (JSON string).
 */

let adminApp: App | null = null;
let adminDb: Firestore | null = null;

function getAdminApp(): App {
  if (adminApp) return adminApp;

  const existing = getApps();
  if (existing.length > 0) {
    adminApp = existing[0];
    return adminApp;
  }

  const serviceAccountKey = (process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '').trim();

  if (serviceAccountKey) {
    const serviceAccount = JSON.parse(serviceAccountKey);
    adminApp = initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });
  } else {
    // Fallback: use project ID only (works in GCP environments with ADC)
    adminApp = initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'conselho-de-funil',
    });
  }

  return adminApp;
}

export function getAdminFirestore(): Firestore {
  if (adminDb) return adminDb;
  adminDb = getFirestore(getAdminApp());
  return adminDb;
}
