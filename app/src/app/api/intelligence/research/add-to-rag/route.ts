/**
 * Sprint O — O-3.3/O-3.4: Add Research Sections to RAG (Pinecone)
 * Saves selected dossier sections as embeddings for counselor context.
 *
 * POST /api/intelligence/research/add-to-rag
 * Body: { brandId, dossierId, sections: string[] }
 * Returns: { chunksAdded, chunkIds }
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest } from 'next/server';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { ApiError, handleSecurityError } from '@/lib/utils/api-security';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { getResearch } from '@/lib/firebase/research';
import { generateEmbedding } from '@/lib/ai/embeddings';
import { upsertToPinecone, buildPineconeRecord } from '@/lib/ai/pinecone';

const MAX_RESEARCH_CHUNKS_PER_BRAND = 20;

const SECTION_LABELS: Record<string, string> = {
  marketOverview: 'Visão Geral do Mercado',
  marketSize: 'Tamanho do Mercado',
  trends: 'Tendências',
  opportunities: 'Oportunidades',
  threats: 'Ameaças',
  recommendations: 'Recomendações',
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { brandId, dossierId, sections } = body as {
      brandId?: string;
      dossierId?: string;
      sections?: string[];
    };

    if (!brandId || !dossierId || !sections?.length) {
      return createApiError(400, 'brandId, dossierId e sections são obrigatórios');
    }

    try {
      await requireBrandAccess(req, brandId);
    } catch (error) {
      return handleSecurityError(error);
    }

    // Load dossier
    const dossier = await getResearch(brandId, dossierId);
    if (!dossier) {
      return createApiError(404, 'Dossiê não encontrado');
    }

    // Build text chunks from selected sections
    const chunks: { id: string; text: string; section: string }[] = [];

    for (const sectionKey of sections) {
      const value = (dossier.sections as Record<string, unknown>)[sectionKey];
      if (!value) continue;

      let text = '';
      if (typeof value === 'string') {
        text = value;
      } else if (Array.isArray(value)) {
        if (sectionKey === 'competitors') {
          text = value.map((c: any) =>
            `${c.name}: Forças: ${(c.strengths || []).join(', ')}. Fraquezas: ${(c.weaknesses || []).join(', ')}`
          ).join('\n');
        } else {
          text = value.join('\n');
        }
      }

      if (text.trim()) {
        chunks.push({
          id: `research_${dossierId}_${sectionKey}`,
          text: `[Deep Research — ${dossier.topic}] ${SECTION_LABELS[sectionKey] || sectionKey}: ${text}`,
          section: sectionKey,
        });
      }
    }

    if (chunks.length === 0) {
      return createApiError(400, `Nenhuma seção com conteúdo para salvar. Seções solicitadas: ${sections.join(', ')}. Verifique se o dossiê possui dados nessas seções.`);
    }

    // Limit: max 20 research chunks per brand
    const existingChunkIds = dossier.ragChunkIds || [];
    const totalAfter = existingChunkIds.length + chunks.length;
    if (totalAfter > MAX_RESEARCH_CHUNKS_PER_BRAND) {
      const allowed = MAX_RESEARCH_CHUNKS_PER_BRAND - existingChunkIds.length;
      if (allowed <= 0) {
        return createApiError(400, `Limite de ${MAX_RESEARCH_CHUNKS_PER_BRAND} chunks de pesquisa atingido para esta marca.`);
      }
      chunks.splice(allowed);
    }

    // Generate embeddings and upsert to Pinecone (O-3.4)
    const records = [];
    const newChunkIds: string[] = [];

    for (const chunk of chunks) {
      try {
        const embedding = await generateEmbedding(chunk.text);
        const record = buildPineconeRecord(chunk.id, embedding, {
          content: chunk.text,
          docType: 'research_insight',
          brandId,
          dossierId,
          section: chunk.section,
          topic: dossier.topic,
          isApprovedForAI: true,
          status: 'approved',
        });
        records.push(record);
        newChunkIds.push(chunk.id);
      } catch (err) {
        console.warn(`[Research/RAG] Failed to embed chunk ${chunk.id}:`, err);
      }
    }

    if (records.length > 0) {
      await upsertToPinecone(records, { namespace: 'knowledge' });
    }

    // Save chunk IDs to dossier for tracking
    try {
      const dossierRef = doc(db, 'brands', brandId, 'research', dossierId);
      await updateDoc(dossierRef, {
        ragChunkIds: [...existingChunkIds, ...newChunkIds],
      });
    } catch (err) {
      console.warn('[Research/RAG] Failed to update dossier:', err);
    }

    return createApiSuccess({
      chunksAdded: records.length,
      chunkIds: newChunkIds,
    });
  } catch (error: unknown) {
    if (error instanceof ApiError) return handleSecurityError(error);
    console.error('[Research/RAG] Error:', error);
    return createApiError(500, 'Erro interno ao adicionar ao conselho.');
  }
}
