export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { checkPineconeHealth } from '@/lib/ai/pinecone';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';

// API Route para validar conectividade com o índice Pinecone.
export const runtime = 'nodejs';

export async function GET() {
  try {
    const status = await checkPineconeHealth();
    return createApiSuccess(status);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido ao checar o Pinecone.';
    console.error('[Pinecone] Health-check falhou', error);
    return createApiError(500, message);
  }
}
