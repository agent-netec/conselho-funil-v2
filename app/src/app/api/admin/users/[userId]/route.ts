/**
 * GET/PATCH /api/admin/users/[userId] — Single user details & updates
 */

import { NextRequest } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { verifyAdminRole, ApiError } from '@/lib/utils/api-security';
import { createApiSuccess, createApiError } from '@/lib/utils/api-response';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_FIELDS = ['tier', 'role', 'credits', 'status'] as const;
type AllowedField = (typeof ALLOWED_FIELDS)[number];

const ADMIN_MASTER_UID = process.env.ADMIN_MASTER_UID || '';
const ADMIN_MASTER_EMAIL = process.env.ADMIN_MASTER_EMAIL || 'phsedicias@gmail.com';

// ---------- GET ----------

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await verifyAdminRole(request);

    const { userId } = await params;
    const db = getAdminFirestore();
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return createApiError(404, 'Usuario nao encontrado');
    }

    const data = userDoc.data()!;
    return createApiSuccess({
      id: userDoc.id,
      email: data.email ?? '',
      name: data.name ?? '',
      tier: data.tier ?? 'free',
      role: data.role ?? 'member',
      credits: data.credits ?? 0,
      active: data.active ?? true,
      stripeCustomerId: data.stripeCustomerId ?? null,
      stripeSubscriptionId: data.stripeSubscriptionId ?? null,
      subscriptionStatus: data.subscriptionStatus ?? null,
      createdAt: data.createdAt ?? null,
      lastLogin: data.lastLogin ?? null,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return createApiError(error.status, error.message);
    }
    console.error('[Admin/Users/Get] Error:', error);
    return createApiError(500, 'Erro ao buscar usuario');
  }
}

// ---------- PATCH ----------

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const admin = await verifyAdminRole(request);

    const { userId } = await params;
    const body = await request.json();
    const { field, value, reason } = body as {
      field: AllowedField;
      value: unknown;
      reason?: string;
    };

    if (!field || value === undefined) {
      return createApiError(400, 'Campos "field" e "value" sao obrigatorios');
    }

    if (!ALLOWED_FIELDS.includes(field)) {
      return createApiError(400, `Campo invalido. Permitidos: ${ALLOWED_FIELDS.join(', ')}`);
    }

    const db = getAdminFirestore();
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return createApiError(404, 'Usuario nao encontrado');
    }

    const userData = userDoc.data()!;

    // Role guard: only ADMIN_MASTER can promote to admin (check UID or email)
    if (field === 'role' && value === 'admin') {
      const isMasterByUid = ADMIN_MASTER_UID && admin.id === ADMIN_MASTER_UID;
      const isMasterByEmail = ADMIN_MASTER_EMAIL && admin.email === ADMIN_MASTER_EMAIL;
      if (!isMasterByUid && !isMasterByEmail) {
        return createApiError(403, 'Somente o admin master pode conceder role admin');
      }
    }

    // Map field → Firestore update
    const firestoreField = field === 'status' ? 'active' : field;
    const firestoreValue = field === 'status' ? value === 'active' : value;
    const oldValue = field === 'status' ? userData.active : userData[field];

    // Perform update
    await userRef.update({ [firestoreField]: firestoreValue });

    // Write audit log
    await userRef.collection('auditLog').add({
      adminId: admin.id,
      field,
      oldValue: oldValue ?? null,
      newValue: firestoreValue,
      reason: reason || null,
      timestamp: FieldValue.serverTimestamp(),
    });

    return createApiSuccess({
      userId,
      field,
      oldValue: oldValue ?? null,
      newValue: firestoreValue,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return createApiError(error.status, error.message);
    }
    console.error('[Admin/Users/Patch] Error:', error);
    return createApiError(500, 'Erro ao atualizar usuario');
  }
}
