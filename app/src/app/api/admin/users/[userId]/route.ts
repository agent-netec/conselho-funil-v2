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
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return createApiError(404, 'Usuario nao encontrado');
    }

    const data = userDoc.data()!;

    // Fetch audit log
    const auditSnap = await userRef.collection('auditLog')
      .orderBy('timestamp', 'desc')
      .limit(20)
      .get();
    const auditLog = auditSnap.docs.map(d => {
      const a = d.data();
      return {
        action: a.field,
        field: a.field,
        oldValue: String(a.oldValue ?? ''),
        newValue: String(a.newValue ?? ''),
        reason: a.reason ?? '',
        by: a.adminId ?? '',
        at: a.timestamp?.toDate?.()?.toISOString() ?? '',
      };
    });

    return createApiSuccess({
      id: userDoc.id,
      email: data.email ?? '',
      name: data.name ?? '',
      tier: data.tier ?? 'free',
      role: data.role ?? 'member',
      credits: data.credits ?? 0,
      status: data.active ?? true,
      stripeCustomerId: data.stripeCustomerId ?? null,
      stripeSubscriptionId: data.stripeSubscriptionId ?? null,
      subscriptionStatus: data.subscriptionStatus ?? null,
      createdAt: data.createdAt ?? null,
      lastLogin: data.lastLogin ?? null,
      auditLog,
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
    let firestoreValue: unknown;
    let oldValue: unknown;

    if (field === 'status') {
      // Frontend sends boolean true/false
      firestoreValue = typeof value === 'boolean' ? value : value === 'active';
      oldValue = userData.active;
    } else if (field === 'credits') {
      // Increment credits, not replace
      const amount = typeof value === 'number' ? value : parseInt(String(value), 10);
      if (isNaN(amount) || amount <= 0) {
        return createApiError(400, 'Quantidade de creditos deve ser um numero positivo');
      }
      firestoreValue = FieldValue.increment(amount);
      oldValue = userData.credits ?? 0;
    } else {
      firestoreValue = value;
      oldValue = userData[field];
    }

    // Perform update
    await userRef.update({ [firestoreField]: firestoreValue });

    // Write audit log
    const auditNewValue = field === 'credits'
      ? (oldValue as number) + (typeof value === 'number' ? value : parseInt(String(value), 10))
      : firestoreValue;

    await userRef.collection('auditLog').add({
      adminId: admin.id,
      field,
      oldValue: oldValue ?? null,
      newValue: auditNewValue,
      reason: reason || null,
      timestamp: FieldValue.serverTimestamp(),
    });

    // Return full updated user data (frontend expects UserDetail)
    const updatedDoc = await userRef.get();
    const updated = updatedDoc.data()!;

    // Fetch audit log
    const auditSnap = await userRef.collection('auditLog')
      .orderBy('timestamp', 'desc')
      .limit(20)
      .get();
    const auditLog = auditSnap.docs.map(d => {
      const a = d.data();
      return {
        action: a.field,
        field: a.field,
        oldValue: String(a.oldValue ?? ''),
        newValue: String(a.newValue ?? ''),
        reason: a.reason ?? '',
        by: a.adminId ?? '',
        at: a.timestamp?.toDate?.()?.toISOString() ?? '',
      };
    });

    return createApiSuccess({
      id: userId,
      email: updated.email ?? '',
      name: updated.name ?? '',
      tier: updated.tier ?? 'free',
      role: updated.role ?? 'member',
      credits: updated.credits ?? 0,
      status: updated.active ?? true,
      createdAt: updated.createdAt ?? null,
      lastLogin: updated.lastLogin ?? null,
      auditLog,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return createApiError(error.status, error.message);
    }
    console.error('[Admin/Users/Patch] Error:', error);
    return createApiError(500, 'Erro ao atualizar usuario');
  }
}
