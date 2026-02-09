import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, doc, setDoc, Timestamp } from 'firebase/firestore';
import { verifyAdminRole, handleSecurityError } from '@/lib/utils/api-security';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Hardening: Verificar role de admin
    await verifyAdminRole(request);

    const { chunks } = await request.json();

    if (!chunks || !Array.isArray(chunks)) {
      return createApiError(400, 'chunks array is required');
    }

    const knowledgeCollection = collection(db, 'knowledge_chunks');
    let count = 0;

    for (const chunk of chunks) {
      const docRef = doc(knowledgeCollection);
      await setDoc(docRef, {
        ...chunk,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      count++;
    }

    return createApiSuccess({ message: `${count} chunks ingested successfully`, count });
  } catch (error) {
    return handleSecurityError(error);
  }
}



