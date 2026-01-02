import { NextResponse } from 'next/server';
import { collection, getDocs, query, limit, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get all chunks (limited)
    const allQuery = query(collection(db, 'knowledge'), limit(100));
    const allSnapshot = await getDocs(allQuery);
    
    // Get approved chunks only
    const approvedQuery = query(
      collection(db, 'knowledge'),
      where('metadata.status', '==', 'approved'),
      limit(100)
    );
    const approvedSnapshot = await getDocs(approvedQuery);

    // Analyze the chunks
    const analysis = {
      totalChunks: allSnapshot.size,
      approvedChunks: approvedSnapshot.size,
      bySource: {} as Record<string, number>,
      byCounselor: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      byDocType: {} as Record<string, number>,
      sampleChunks: [] as Array<{
        id: string;
        source: string;
        counselor?: string;
        status?: string;
        docType?: string;
        hasEmbedding: boolean;
        contentPreview: string;
      }>,
    };

    allSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      
      // By source file
      const sourceFile = data.source?.file || 'unknown';
      analysis.bySource[sourceFile] = (analysis.bySource[sourceFile] || 0) + 1;
      
      // By counselor
      const counselor = data.metadata?.counselor || 'none';
      analysis.byCounselor[counselor] = (analysis.byCounselor[counselor] || 0) + 1;
      
      // By status
      const status = data.metadata?.status || 'undefined';
      analysis.byStatus[status] = (analysis.byStatus[status] || 0) + 1;
      
      // By doc type
      const docType = data.metadata?.docType || 'undefined';
      analysis.byDocType[docType] = (analysis.byDocType[docType] || 0) + 1;
      
      // Sample chunks (first 5)
      if (analysis.sampleChunks.length < 5) {
        analysis.sampleChunks.push({
          id: doc.id,
          source: sourceFile,
          counselor: data.metadata?.counselor,
          status: data.metadata?.status,
          docType: data.metadata?.docType,
          hasEmbedding: Array.isArray(data.embedding) && data.embedding.length > 0,
          contentPreview: (data.content || '').substring(0, 100) + '...',
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: `Found ${allSnapshot.size} chunks (${approvedSnapshot.size} approved)`,
      analysis,
    });
  } catch (error) {
    console.error('Error checking knowledge:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: String(error),
        message: 'Failed to check knowledge base'
      },
      { status: 500 }
    );
  }
}


