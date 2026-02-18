import { NextRequest } from 'next/server';
import { collection, addDoc, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { createApiSuccess, createApiError } from '@/lib/utils/api-response';
import { requireUser } from '@/lib/auth/brand-guard';
import { handleSecurityError } from '@/lib/utils/api-security';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * Hash an API key for storage (never store plaintext)
 */
async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// GET /api/settings/api-keys — List user's API keys (without full key)
export async function GET(req: NextRequest) {
  let userId: string;
  try {
    userId = await requireUser(req);
  } catch (error) {
    return handleSecurityError(error);
  }

  try {
    const keysRef = collection(db, 'users', userId, 'api_keys');
    const q = query(keysRef, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);

    const keys = snap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        prefix: data.prefix, // "cf_xxxx..." (first 8 chars)
        scopes: data.scopes,
        createdAt: data.createdAt,
        lastUsedAt: data.lastUsedAt || null,
        expiresAt: data.expiresAt || null,
      };
    });

    return createApiSuccess(keys);
  } catch (error: any) {
    return createApiError(500, error.message || 'Failed to list API keys');
  }
}

// POST /api/settings/api-keys — Create new API key
export async function POST(req: NextRequest) {
  let userId: string;
  try {
    userId = await requireUser(req);
  } catch (error) {
    return handleSecurityError(error);
  }

  try {
    const body = await req.json();
    const { name, scopes, expiresInDays } = body;

    if (!name) {
      return createApiError(400, 'name is required');
    }

    // Generate API key
    const rawKey = `cf_${randomUUID().replace(/-/g, '')}`;
    const hashedKey = await hashApiKey(rawKey);
    const prefix = rawKey.substring(0, 11) + '...';

    const expiresAt = expiresInDays
      ? Timestamp.fromMillis(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    const keyData: Record<string, any> = {
      name,
      hashedKey,
      prefix,
      scopes: scopes || ['read'],
      createdAt: Timestamp.now(),
    };

    if (expiresAt) {
      keyData.expiresAt = expiresAt;
    }

    const keysRef = collection(db, 'users', userId, 'api_keys');
    const docRef = await addDoc(keysRef, keyData);

    // Return the raw key ONLY on creation (never again)
    return createApiSuccess({
      id: docRef.id,
      name,
      key: rawKey, // Show once only
      prefix,
      scopes: scopes || ['read'],
      expiresAt: expiresAt?.toDate().toISOString() || null,
    }, { status: 201 });
  } catch (error: any) {
    return createApiError(500, error.message || 'Failed to create API key');
  }
}
