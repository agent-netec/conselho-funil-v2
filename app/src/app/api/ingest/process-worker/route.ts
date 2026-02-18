import { NextRequest, NextResponse } from 'next/server';
import { processAsset } from '@/lib/ai/worker';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Endpoint de processamento de assets (Ingestão v2).
 * Orquestra Extração -> Chunking -> Embedding -> Pinecone via Worker.
 *
 * NOTE: No auth guard (requireBrandAccess) here because this is an internal-only
 * endpoint called server-side by other API routes (e.g., ingest/url, assets/reanalyze).
 * It only receives an assetId with no brandId, and adding auth would break the
 * fire-and-forget pattern used by callers. Access control is enforced at the
 * caller level (the routes that trigger this worker).
 *
 * @param request - Body: { assetId: string, namespace?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const assetId = body?.assetId as string | undefined;
    const namespace = body?.namespace as string | undefined;

    if (!assetId) {
      return NextResponse.json({ ok: false, error: 'assetId é obrigatório.' }, { status: 400 });
    }

    console.log(`[Ingest API] Iniciando worker para asset: ${assetId} (namespace: ${namespace || 'default'})`);
    const result = await processAsset(assetId, namespace);

    return NextResponse.json({ ok: true, ...result }, { status: 200 });
  } catch (error: any) {
    const message = error?.message || 'Erro desconhecido ao processar asset.';
    console.error('[Ingest API] Falha no processamento:', message);
    
    return NextResponse.json({ 
      ok: false, 
      error: message,
      details: error?.stack
    }, { status: 500 });
  }
}
