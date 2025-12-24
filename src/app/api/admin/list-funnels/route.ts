/**
 * API Admin para listar funis
 */

import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const q = query(
      collection(db, 'funnels'),
      orderBy('updatedAt', 'desc'),
      limit(20)
    );

    const snapshot = await getDocs(q);
    const funnels = snapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      status: doc.data().status,
    }));

    return NextResponse.json({ funnels, total: funnels.length });
  } catch (error) {
    console.error('Error listing funnels:', error);
    return NextResponse.json(
      { error: 'Failed to list funnels', details: String(error) },
      { status: 500 }
    );
  }
}


