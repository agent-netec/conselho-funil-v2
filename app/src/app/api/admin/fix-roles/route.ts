/**
 * POST /api/admin/fix-roles — One-time fix: demote all users to 'member' except admin master.
 *
 * Only the admin master (by email) can run this.
 * After running, delete this endpoint.
 */

import { NextRequest } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { createApiSuccess, createApiError } from '@/lib/utils/api-response';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ADMIN_MASTER_EMAIL = process.env.ADMIN_MASTER_EMAIL || 'phsedicias@gmail.com';

export async function POST(request: NextRequest) {
  try {
    // Verify caller identity via Firebase Auth REST API
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return createApiError(401, 'Bearer token required');
    }

    const idToken = authHeader.split('Bearer ')[1];
    const apiKey = (process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '').trim();
    if (!apiKey) return createApiError(500, 'Firebase API key missing');

    const authRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      }
    );

    if (!authRes.ok) return createApiError(401, 'Invalid token');

    const authData = await authRes.json();
    const callerUid = authData.users?.[0]?.localId;
    if (!callerUid) return createApiError(401, 'User not found');

    // Check caller email in Firestore
    const db = getAdminFirestore();
    const callerSnap = await db.collection('users').doc(callerUid).get();
    if (!callerSnap.exists) return createApiError(403, 'Profile not found');

    const callerEmail = callerSnap.data()!.email;
    if (callerEmail !== ADMIN_MASTER_EMAIL) {
      return createApiError(403, 'Only admin master can run this fix');
    }

    // Fetch all users
    const usersSnap = await db.collection('users').get();

    let demoted = 0;
    let kept = 0;
    const batch = db.batch();

    for (const doc of usersSnap.docs) {
      const data = doc.data();
      if (data.email === ADMIN_MASTER_EMAIL) {
        // Ensure master IS admin
        if (data.role !== 'admin') {
          batch.update(doc.ref, { role: 'admin' });
        }
        kept++;
        continue;
      }

      if (data.role === 'admin') {
        batch.update(doc.ref, { role: 'member' });
        demoted++;
      }
    }

    await batch.commit();

    // Also store the master UID for future reference
    console.log(`[fix-roles] Admin master UID: ${callerUid} (${ADMIN_MASTER_EMAIL})`);

    return createApiSuccess({
      adminMasterUid: callerUid,
      adminMasterEmail: ADMIN_MASTER_EMAIL,
      totalUsers: usersSnap.size,
      demoted,
      keptAsAdmin: kept,
      message: `Done. ${demoted} users demoted to member. Set ADMIN_MASTER_UID=${callerUid} in Vercel env vars.`,
    });
  } catch (error) {
    console.error('[fix-roles] Error:', error);
    return createApiError(500, 'Failed to fix roles');
  }
}
