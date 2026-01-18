/**
 * API Route: POST /api/brands/[brandId]/assets/url
 * Adiciona uma URL como fonte de contexto para a marca
 * 
 * US-13.7: Extração de Contexto via URL
 */

import { NextRequest, NextResponse } from 'next/server';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { extractContentFromUrl } from '@/lib/ai/url-scraper';
import { processAssetText } from '@/lib/firebase/assets-server';

interface RequestBody {
  url: string;
  userId: string;
  type?: 'guideline' | 'brand_book' | 'strategy' | 'reference' | 'other';
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ brandId: string }> }
) {
  try {
    const { brandId } = await params;
    const body: RequestBody = await request.json();
    const { url, userId, type = 'reference' } = body;

    // Validação
    if (!url || !userId) {
      return NextResponse.json(
        { error: 'URL e userId são obrigatórios' },
        { status: 400 }
      );
    }

    // Validação de URL
    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        return NextResponse.json(
          { error: 'URL inválida. Use apenas http:// ou https://' },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: 'URL inválida' },
        { status: 400 }
      );
    }

    // Extrair conteúdo
    console.log('[URL Asset] Extraindo conteúdo de:', url);
    const scraped = await extractContentFromUrl(url);

    if (scraped.error) {
      return NextResponse.json(
        { error: scraped.error },
        { status: 400 }
      );
    }

    // Aceita conteúdo mínimo (já ajustado no scraper). Só falha se vier vazio.
    if (!scraped.content || scraped.content.length < 20) {
      return NextResponse.json(
        { error: 'Não foi possível extrair conteúdo útil desta URL' },
        { status: 400 }
      );
    }

    // Criar asset no Firestore (coleção única para compatibilidade com RAG/assets UI)
    const assetsRef = collection(db, 'brand_assets');
    const assetData = {
      brandId,
      userId,
      name: scraped.title || 'Documento sem título',
      originalName: scraped.title || url,
      type: 'url' as const,
      mimeType: 'text/html',
      size: 0, // URL não tem tamanho
      url, // A própria URL é o "storage URL"
      sourceUrl: url,
      extractedText: scraped.content,
      status: 'processing' as const,
      isApprovedForAI: false, // US-18.3: Adicionado flag de aprovação
      createdAt: serverTimestamp(),
    };

    const assetDoc = await addDoc(assetsRef, assetData);
    const assetId = assetDoc.id;

    console.log('[URL Asset] Asset criado:', assetId);

    // Processar chunking + embeddings (async, não bloqueia resposta)
    processAssetText(assetId, scraped.content)
      .then(() => {
        console.log('[URL Asset] Chunking concluído para:', assetId);
      })
      .catch((error) => {
        console.error('[URL Asset] Erro ao processar chunks:', error);
      });

    // Retornar asset criado
    return NextResponse.json(
      {
        id: assetId,
        ...assetData,
        createdAt: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[URL Asset] Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar URL' },
      { status: 500 }
    );
  }
}

