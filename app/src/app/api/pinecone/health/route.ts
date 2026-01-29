export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { checkPineconeHealth } from '@/lib/ai/pinecone';

// API Route para validar conectividade com o índice Pinecone.
export const runtime = 'nodejs';

export async function GET() {
  try {
    const status = await checkPineconeHealth();
    return NextResponse.json(status, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido ao checar o Pinecone.';
    console.error('[Pinecone] Health-check falhou', error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
