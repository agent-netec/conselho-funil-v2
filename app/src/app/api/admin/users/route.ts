/**
 * GET /api/admin/users — List users with pagination and filters
 */

import { NextRequest } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { verifyAdminRole, ApiError } from '@/lib/utils/api-security';
import { createApiSuccess, createApiError } from '@/lib/utils/api-response';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await verifyAdminRole(request);

    const { searchParams } = new URL(request.url);
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || searchParams.get('limit') || '20', 10), 100);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const offset = (page - 1) * pageSize;
    const tierFilter = searchParams.get('tier');
    const roleFilter = searchParams.get('role');
    const search = searchParams.get('search');
    const status = searchParams.get('status'); // 'active' | 'inactive'

    const db = getAdminFirestore();
    let query: FirebaseFirestore.Query = db.collection('users');

    // Apply filters that Firestore can handle natively
    if (tierFilter) {
      query = query.where('tier', '==', tierFilter);
    }
    if (roleFilter) {
      query = query.where('role', '==', roleFilter);
    }
    if (status === 'active') {
      query = query.where('active', '==', true);
    } else if (status === 'inactive') {
      query = query.where('active', '==', false);
    }

    query = query.orderBy('createdAt', 'desc');

    const snapshot = await query.get();

    // Apply search filter in memory (Firestore doesn't support LIKE)
    let users = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        email: data.email ?? '',
        name: data.name ?? '',
        tier: data.tier ?? 'free',
        role: data.role ?? 'member',
        credits: data.credits ?? 0,
        active: data.active ?? true,
        createdAt: data.createdAt ?? null,
        lastLogin: data.lastLogin ?? null,
      };
    });

    if (search) {
      const term = search.toLowerCase();
      users = users.filter(
        u => u.email.toLowerCase().includes(term) || u.name.toLowerCase().includes(term)
      );
    }

    const total = users.length;

    // Apply pagination
    const paginated = users.slice(offset, offset + pageSize);

    return createApiSuccess({
      users: paginated,
      total,
      page,
      pageSize,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return createApiError(error.status, error.message);
    }
    console.error('[Admin/Users] Error:', error);
    return createApiError(500, 'Erro ao listar usuarios');
  }
}
