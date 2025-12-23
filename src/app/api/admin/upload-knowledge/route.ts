/**
 * API Route para upload da base de conhecimento
 * 
 * Esta rota permite fazer upload dos chunks processados para o Firestore
 * usando o Firebase Client SDK (não requer service account)
 * 
 * POST /api/admin/upload-knowledge
 * Body: { chunks: ProcessedChunk[], clear?: boolean }
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  collection, 
  doc, 
  writeBatch,
  getDocs,
  deleteDoc,
  query,
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes timeout

interface ProcessedChunk {
  content: string;
  metadata: {
    counselor?: string;
    docType: string;
    scope?: string;
    channel?: string;
    stage?: string;
    tenantId?: string | null;
    status: string;
    version: string;
  };
  source: {
    file: string;
    section: string;
    lineStart: number;
    lineEnd: number;
  };
}

/**
 * Generate fallback embedding
 */
function generateEmbedding(text: string): number[] {
  const vector = new Array(768).fill(0);
  const normalized = text.toLowerCase().replace(/[^\w\s]/g, '');
  const words = normalized.split(/\s+/).filter(w => w.length > 2);
  
  const wordCounts: Record<string, number> = {};
  words.forEach(word => {
    wordCounts[word] = (wordCounts[word] || 0) + 1;
  });
  
  const hashString = (str: string): number => {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    }
    return hash;
  };
  
  Object.entries(wordCounts).forEach(([word, count]) => {
    const hash1 = hashString(word);
    const hash2 = hashString(word + '_secondary');
    const hash3 = hashString(word + '_tertiary');
    
    const indices = [
      Math.abs(hash1) % 768,
      Math.abs(hash2) % 768,
      Math.abs(hash3) % 768,
    ];
    
    const weight = Math.log(1 + count) / Math.log(1 + words.length);
    indices.forEach(idx => {
      vector[idx] += weight;
    });
  });
  
  words.slice(0, 10).forEach((word, i) => {
    const idx = Math.abs(hashString(word + '_pos')) % 768;
    vector[idx] += (10 - i) * 0.05;
  });
  
  const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  if (magnitude > 0) {
    return vector.map(v => v / magnitude);
  }
  
  return vector;
}

/**
 * Create deterministic document ID
 */
function createDocId(chunk: ProcessedChunk): string {
  const str = `${chunk.source.file}_${chunk.source.section}_${chunk.source.lineStart}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `chunk_${Math.abs(hash).toString(36)}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chunks, clear = false }: { chunks: ProcessedChunk[]; clear?: boolean } = body;

    if (!chunks || !Array.isArray(chunks)) {
      return NextResponse.json(
        { error: 'Chunks array is required' },
        { status: 400 }
      );
    }

    console.log(`📤 Iniciando upload de ${chunks.length} chunks...`);

    // Clear existing knowledge if requested
    if (clear) {
      console.log('🗑️ Limpando base existente...');
      let deleted = 0;
      let hasMore = true;
      
      while (hasMore) {
        const q = query(collection(db, 'knowledge'), limit(100));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
          hasMore = false;
          break;
        }
        
        const deletePromises = snapshot.docs.map(docSnap => 
          deleteDoc(doc(db, 'knowledge', docSnap.id))
        );
        await Promise.all(deletePromises);
        deleted += snapshot.docs.length;
        console.log(`   Deletados: ${deleted}`);
      }
      console.log(`✓ Base limpa: ${deleted} documentos removidos`);
    }

    // Upload in batches
    const batchSize = 20; // Firestore batch limit is 500, but we'll be conservative
    let uploaded = 0;
    let errors = 0;

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batchChunks = chunks.slice(i, i + batchSize);
      
      const uploadPromises = batchChunks.map(async (chunk) => {
        try {
          const embedding = generateEmbedding(chunk.content);
          const docId = createDocId(chunk);
          const docRef = doc(db, 'knowledge', docId);
          
          const { setDoc } = await import('firebase/firestore');
          await setDoc(docRef, {
            content: chunk.content,
            embedding: embedding,
            metadata: {
              ...chunk.metadata,
              status: 'approved',
            },
            source: chunk.source,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          
          return true;
        } catch (error) {
          console.error(`Error uploading chunk:`, error);
          return false;
        }
      });

      const results = await Promise.all(uploadPromises);
      uploaded += results.filter(Boolean).length;
      errors += results.filter(r => !r).length;
      
      console.log(`  Batch ${Math.floor(i / batchSize) + 1}: ${results.filter(Boolean).length} chunks`);
      
      // Small delay between batches
      if (i + batchSize < chunks.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    console.log(`✅ Upload concluído! Sucesso: ${uploaded}, Erros: ${errors}`);

    return NextResponse.json({
      success: true,
      uploaded,
      errors,
      total: chunks.length,
    });
  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

// GET - Check knowledge base status
export async function GET() {
  try {
    const q = query(collection(db, 'knowledge'), limit(1));
    const snapshot = await getDocs(q);
    
    // Count total (limited check)
    const countQuery = query(collection(db, 'knowledge'), limit(500));
    const countSnapshot = await getDocs(countQuery);
    
    return NextResponse.json({
      status: 'ok',
      hasDocuments: !snapshot.empty,
      approximateCount: countSnapshot.size,
      sample: snapshot.empty ? null : {
        id: snapshot.docs[0].id,
        docType: snapshot.docs[0].data().metadata?.docType,
        counselor: snapshot.docs[0].data().metadata?.counselor,
        hasEmbedding: !!snapshot.docs[0].data().embedding,
      },
    });
  } catch (error) {
    console.error('Knowledge check error:', error);
    return NextResponse.json(
      { error: 'Failed to check knowledge base', details: String(error) },
      { status: 500 }
    );
  }
}

