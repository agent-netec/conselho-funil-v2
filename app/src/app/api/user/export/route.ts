/**
 * R-4.5: User Data Export (LGPD Art. 18) — export all user data.
 * GET /api/user/export
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { ApiError, handleSecurityError } from '@/lib/utils/api-security';

async function getUserIdFromToken(req: NextRequest): Promise<string> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new ApiError(401, 'Autenticação necessária');
  }

  const idToken = authHeader.split('Bearer ')[1];
  const apiKey = (process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '').trim();

  if (!apiKey) throw new ApiError(500, 'Firebase API Key não configurada');

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    }
  );

  if (!response.ok) throw new ApiError(401, 'Token inválido');
  const data = await response.json();
  const uid = data.users?.[0]?.localId;
  if (!uid) throw new ApiError(401, 'Usuário não encontrado');
  return uid;
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserIdFromToken(req);

    const exportData: Record<string, unknown> = {
      _exportedAt: new Date().toISOString(),
      _version: '1.0',
      _type: 'user-data-export',
    };

    // User profile
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    exportData.user = userSnap.exists()
      ? { id: userSnap.id, ...userSnap.data() }
      : null;

    // User's brands
    const brandsQuery = query(
      collection(db, 'brands'),
      where('userId', '==', userId)
    );
    const brandsSnap = await getDocs(brandsQuery);
    exportData.brands = brandsSnap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="user-${userId}-export.json"`,
      },
    });
  } catch (error) {
    return handleSecurityError(error);
  }
}
