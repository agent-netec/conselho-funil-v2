/**
 * API Route: POST /api/admin/process-asset
 * Processa um asset (chunking + embeddings) no servidor
 */

import { NextRequest, NextResponse } from 'next/server';
import { processAssetText } from '@/lib/firebase/assets-server';
import { verifyAdminRole, handleSecurityError } from '@/lib/utils/api-security';

export async function POST(request: NextRequest) {
  try {
    // Hardening: Verificar role de admin
    await verifyAdminRole(request);

    const { assetId, text } = await request.json();

    if (!assetId || text === undefined) {
      return NextResponse.json(
        { error: 'assetId and text are required' },
        { status: 400 }
      );
    }

    console.log(`[API Process] Processando asset ${assetId} no servidor...`);
    await processAssetText(assetId, text);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return handleSecurityError(error);
  }
}

