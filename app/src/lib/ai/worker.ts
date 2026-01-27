import { Buffer } from 'node:buffer';
import { Timestamp } from 'firebase/firestore';
import type { AssetChunk, BrandAsset } from '../../types/database';
import { createChunks } from './chunking';
import { generateEmbeddingsBatch } from './embeddings';
import { upsertToPinecone } from './pinecone';
import { fetchBrandAsset, updateBrandAsset } from '../firebase/assets';
import { saveAssetChunks } from '../firebase/assets-server';
import { extractContentFromUrl } from './url-scraper';

interface ProcessResult {
  assetId: string;
  chunkCount: number;
  pineconeUpserted: number;
}

async function extractTextFromAsset(asset: BrandAsset): Promise<string> {
  if (asset.extractedText?.trim()) return asset.extractedText;

  if (!asset.url) {
    throw new Error('Asset sem texto extraído e sem URL para processamento.');
  }

  // US-13.7: Se for uma URL, usamos o extrator profissional
  if (asset.type === 'url') {
    console.log(`[Worker] Detectada URL: ${asset.url}. Iniciando scraping inteligente...`);
    const scraped = await extractContentFromUrl(asset.url);
    if (scraped.error) {
      throw new Error(`Falha no scraping da URL: ${scraped.error}`);
    }
    return scraped.content;
  }

  const response = await fetch(asset.url);
  const contentType = response.headers.get('content-type') || '';

  // Tenta parsear PDF se possível; caso contrário, usa texto bruto.
  if (contentType.includes('application/pdf')) {
    try {
      const pdfParseModule: any = await import('pdf-parse');
      const pdfParse = pdfParseModule.default || pdfParseModule;
      const arrayBuffer = await response.arrayBuffer();
      const parsed = await pdfParse(Buffer.from(arrayBuffer));
      if (parsed?.text) return parsed.text;
    } catch (err) {
      console.warn('[Worker] Falha ao extrair PDF, retornando texto vazio.', err);
      return '';
    }
  }

  return await response.text();
}

function buildChunkPayloads(
  asset: BrandAsset & { id: string },
  contents: string[],
  embeddings: number[][]
): AssetChunk[] {
  const now = Timestamp.now();
  return contents.map((content, index) => ({
    id: `${asset.id}-chunk-${index + 1}`,
    brandId: asset.brandId,
    assetId: asset.id,
    userId: asset.userId,
    content,
    embedding: embeddings[index],
    order: index,
    createdAt: now,
    metadata: {
      sourceType: asset.metadata?.sourceType ?? 'text',
      sourceUrl: asset.metadata?.sourceUrl ?? asset.url ?? '', // Hotfix: Fallback para evitar undefined no Firestore
      originalName: asset.metadata?.originalName ?? asset.originalName ?? asset.name,
      isApprovedForAI: asset.metadata?.isApprovedForAI ?? asset.isApprovedForAI ?? false,
      extractedAt: asset.metadata?.extractedAt ?? now.toDate().toISOString(),
      processingMethod: asset.metadata?.processingMethod ?? 'worker-v2',
    },
  }));
}

function buildPineconeRecords(chunks: AssetChunk[]) {
  return chunks.map((chunk) => ({
    id: chunk.id,
    values: chunk.embedding ?? [],
    metadata: {
      brandId: chunk.brandId,
      assetId: chunk.assetId,
      originalName: chunk.metadata?.originalName,
      sourceType: chunk.metadata?.sourceType,
      sourceUrl: chunk.metadata?.sourceUrl,
      processingMethod: chunk.metadata?.processingMethod,
      content: chunk.content, // Adicionado para facilitar o RAG sem precisar do Firestore
    },
  }));
}

export async function processAsset(assetId: string, namespace?: string): Promise<ProcessResult> {
  const asset = await fetchBrandAsset(assetId);
  if (!asset) throw new Error('Asset não encontrado.');

  if (asset.isApprovedForAI !== true) {
    throw new Error('Asset não aprovado para IA.');
  }

  // ST-11.23: Reset status para 'processing' limpando erros anteriores
  await updateBrandAsset(asset.id, { 
    status: 'processing', 
    processingError: '' // Usar string vazia em vez de null para evitar problemas com alguns wrappers de Firestore
  });

  try {
    const extractedText = await extractTextFromAsset(asset);
    if (!extractedText?.trim()) {
      throw new Error('Texto extraído vazio ou inválido.');
    }

    const chunksText = createChunks(extractedText, 1500, 200);
    if (!chunksText.length) {
      throw new Error('Nenhum chunk gerado a partir do texto.');
    }

    const embeddings = await generateEmbeddingsBatch(chunksText);
    if (embeddings.length !== chunksText.length) {
      throw new Error('Falha ao gerar embeddings para todos os chunks.');
    }

    const chunkPayloads = buildChunkPayloads(asset, chunksText, embeddings);

    // Persistência em Firestore (subcoleção chunks)
    await saveAssetChunks(asset.id, chunkPayloads);

    // Upsert no Pinecone
    const pineconeRecords = chunkPayloads.map(chunk => ({
      id: chunk.id,
      values: chunk.embedding ?? [],
      metadata: {
        brandId: chunk.brandId,
        assetId: chunk.assetId,
        originalName: chunk.metadata?.originalName || '',
        sourceType: chunk.metadata?.sourceType || 'text',
        sourceUrl: chunk.metadata?.sourceUrl || '',
        processingMethod: 'worker-v2',
        content: chunk.content,
      },
    }));

    // ST-11.23 Hotfix: Garantir namespace correto para o Dashboard de Ativos
    const targetNamespace = namespace || `brand-${asset.brandId}`;
    const pineconeResult = await upsertToPinecone(pineconeRecords, { namespace: targetNamespace });

    await updateBrandAsset(asset.id, {
      status: 'ready',
      chunkCount: chunkPayloads.length,
      processedAt: Timestamp.now(),
      processingError: '',
    });

    return {
      assetId: asset.id,
      chunkCount: chunkPayloads.length,
      pineconeUpserted: pineconeResult.upserted,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido no worker.';
    await updateBrandAsset(asset.id, {
      status: 'error',
      processingError: message,
      processedAt: Timestamp.now(),
    });
    throw error;
  }
}
