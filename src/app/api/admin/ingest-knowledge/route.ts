import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, doc, setDoc, Timestamp } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const { chunks } = await request.json();

    if (!chunks || !Array.isArray(chunks)) {
      return NextResponse.json(
        { error: 'chunks array is required' },
        { status: 400 }
      );
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

    return NextResponse.json({
      success: true,
      message: `${count} chunks ingested successfully`,
      count,
    });
  } catch (error) {
    console.error('Error ingesting knowledge:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Failed to ingest knowledge', details: errorMessage },
      { status: 500 }
    );
  }
}



