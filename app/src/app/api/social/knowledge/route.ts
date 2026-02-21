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
import { generateWithGemini, DEFAULT_GEMINI_MODEL } from '@/lib/ai/gemini';

const VALID_DOC_TYPES = ['social_policy', 'social_best_practices'] as const;
type SocialDocType = typeof VALID_DOC_TYPES[number];

const VALID_CHANNELS = [
  'instagram', 'tiktok', 'youtube', 'linkedin', 'twitter', 'general',
] as const;

// S2: AI categorization of social knowledge docs
interface KBCategorization {
  type: 'best_practice' | 'case_study' | 'policy' | 'trend';
  channel: string;
  tags: string[];
}

async function categorizeContent(title: string, content: string): Promise<KBCategorization | null> {
  try {
    const prompt = `Classifique o seguinte documento de knowledge base social.

Título: ${title}
Conteúdo (primeiros 500 chars): ${content.slice(0, 500)}

Responda APENAS em JSON válido:
{
  "type": "best_practice" | "case_study" | "policy" | "trend",
  "channel": "instagram" | "tiktok" | "linkedin" | "youtube" | "twitter" | "general",
  "tags": ["tag1", "tag2", "tag3"]
}

Regras:
- type: classifique baseado no conteúdo
- channel: qual canal é mais relevante (general se múltiplos)
- tags: 3-5 palavras-chave relevantes em português`;

    const response = await generateWithGemini(prompt, {
      model: DEFAULT_GEMINI_MODEL,
      temperature: 0.3,
      responseMimeType: 'application/json',
    });

    return JSON.parse(response) as KBCategorization;
  } catch (err) {
    console.warn('[Social/KB] Auto-categorization failed, using defaults:', err);
    return null;
  }
}

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

    // S2: Auto-categorize content with Gemini
    const categorization = await categorizeContent(title, content);
    const aiTags = categorization?.tags || [];
    const aiType = categorization?.type || 'best_practice';
    const aiChannel = categorization?.channel || channel;

    // Chunk content and generate embeddings
    const chunks = chunkText(content);
    const records = await Promise.all(
      chunks.map(async (chunk, i) => {
        const embedding = await generateEmbedding(chunk);
        const id = `social-kb-${brandId}-${docType}-${aiChannel}-${Date.now()}-${i}`;
        return buildPineconeRecord(id, embedding, {
          content: chunk,
          docType,
          channel: aiChannel,
          title,
          brandId,
          isApprovedForAI: true,
          status: 'approved',
          sourceFile: `social-kb/${title}`,
          sourceSection: `chunk-${i + 1}`,
          // S2: AI-generated metadata for filtered RAG queries
          aiType,
          aiTags: aiTags.join(','),
          category: 'social',
        });
      })
    );

    await upsertToPinecone(records, 'knowledge');

    console.log(`[Social/KB] Uploaded ${records.length} chunks: ${docType}/${aiChannel}/${title} [AI: ${aiType}, tags: ${aiTags.join(', ')}]`);

    return createApiSuccess({
      uploaded: records.length,
      docType,
      channel: aiChannel,
      title,
      categorization: categorization || undefined,
    });
  } catch (error: unknown) {
    if (error instanceof ApiError) return handleSecurityError(error);
    console.error('[Social/KB] Error:', error);
    return createApiError(500, 'Erro ao salvar no knowledge base.');
  }
}
