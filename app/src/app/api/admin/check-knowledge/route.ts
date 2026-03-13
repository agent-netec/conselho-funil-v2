import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { verifyAdminRole, handleSecurityError } from '@/lib/utils/api-security';
import { createApiSuccess } from '@/lib/utils/api-response';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Hardening: Verificar role de admin
    await verifyAdminRole(request);

    const adminDb = getAdminFirestore();

    // Get all chunks (limited)
    const allSnapshot = await adminDb.collection('knowledge').limit(100).get();

    // Get approved chunks only
    const approvedSnapshot = await adminDb.collection('knowledge')
      .where('metadata.status', '==', 'approved')
      .limit(100)
      .get();

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

    return createApiSuccess({
      message: `Found ${allSnapshot.size} chunks (${approvedSnapshot.size} approved)`,
      analysis,
    });
  } catch (error) {
    return handleSecurityError(error);
  }
}


