/**
 * Sprint O — O-5.1 & O-5.2: Social Knowledge Base Upload
 * Upload platform policies and best practices for RAG retrieval.
 *
 * POST /api/social/knowledge
 * Body: { brandId, docType: 'social_policy' | 'social_best_practices', channel, title, content }
 * Credits: 0 (admin/setup action)
 */

export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { ApiError, handleSecurityError } from '@/lib/utils/api-security';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { generateEmbedding } from '@/lib/ai/embeddings';
import { upsertToPinecone, buildPineconeRecord } from '@/lib/ai/pinecone';

const VALID_DOC_TYPES = ['social_policy', 'social_best_practices'] as const;
type SocialDocType = typeof VALID_DOC_TYPES[number];

const VALID_CHANNELS = [
  'instagram', 'tiktok', 'youtube', 'linkedin', 'twitter', 'general',
] as const;

function chunkText(text: string, maxLen = 800): string[] {
  const paragraphs = text.split(/\n{2,}/);
  const chunks: string[] = [];
  let buffer = '';

  for (const para of paragraphs) {
    if ((buffer + '\n\n' + para).length > maxLen && buffer) {
      chunks.push(buffer.trim());
      buffer = para;
    } else {
      buffer = buffer ? buffer + '\n\n' + para : para;
    }
  }
  if (buffer.trim()) chunks.push(buffer.trim());
  return chunks;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { brandId, docType, channel, title, content } = body as {
      brandId?: string;
      docType?: string;
      channel?: string;
      title?: string;
      content?: string;
    };

    if (!brandId || !docType || !channel || !title || !content) {
      return createApiError(400, 'brandId, docType, channel, title e content são obrigatórios');
    }

    if (!VALID_DOC_TYPES.includes(docType as SocialDocType)) {
      return createApiError(400, `docType deve ser: ${VALID_DOC_TYPES.join(', ')}`);
    }

    if (!VALID_CHANNELS.includes(channel as any)) {
      return createApiError(400, `channel deve ser: ${VALID_CHANNELS.join(', ')}`);
    }

    try {
      await requireBrandAccess(req, brandId);
    } catch (error) {
      return handleSecurityError(error);
    }

    // Chunk content and generate embeddings
    const chunks = chunkText(content);
    const records = await Promise.all(
      chunks.map(async (chunk, i) => {
        const embedding = await generateEmbedding(chunk);
        const id = `social-kb-${brandId}-${docType}-${channel}-${Date.now()}-${i}`;
        return buildPineconeRecord(id, embedding, {
          content: chunk,
          docType,
          channel,
          title,
          brandId,
          isApprovedForAI: true,
          status: 'approved',
          sourceFile: `social-kb/${title}`,
          sourceSection: `chunk-${i + 1}`,
        });
      })
    );

    await upsertToPinecone(records, 'knowledge');

    console.log(`[Social/KB] Uploaded ${records.length} chunks: ${docType}/${channel}/${title}`);

    return createApiSuccess({
      uploaded: records.length,
      docType,
      channel,
      title,
    });
  } catch (error: unknown) {
    if (error instanceof ApiError) return handleSecurityError(error);
    console.error('[Social/KB] Error:', error);
    return createApiError(500, 'Erro ao salvar no knowledge base.');
  }
}
