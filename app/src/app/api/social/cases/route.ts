import { NextRequest } from 'next/server';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { handleSecurityError } from '@/lib/utils/api-security';
import { createApiSuccess, createApiError } from '@/lib/utils/api-response';
import { generateEmbedding } from '@/lib/ai/embeddings';
import { upsertToPinecone, buildPineconeRecord } from '@/lib/ai/pinecone';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return createApiError(400, 'Invalid JSON body');
  }

  const { brandId, content, platform, outcome, metrics, analysis, tags } = body;

  if (!brandId) {
    return createApiError(400, 'brandId is required');
  }

  try {
    await requireBrandAccess(req, brandId);
  } catch (err: any) {
    return handleSecurityError(err);
  }

  try {
    if (!content || !platform || !outcome || !analysis) {
      return createApiError(400, 'Missing required fields: content, platform, outcome, analysis');
    }

    const caseData = {
      brandId,
      content,
      platform,
      outcome,
      metrics: metrics || {},
      analysis,
      tags: tags || [],
      createdAt: Timestamp.now(),
    };

    // 1. Save to Firestore
    const casesRef = collection(db, 'brands', brandId, 'social_cases');
    const docRef = await addDoc(casesRef, caseData);

    // 2. Embed for RAG
    try {
      const embedding = await generateEmbedding(`${outcome} case: ${content}. Analysis: ${analysis}`);
      const record = buildPineconeRecord(`case_${docRef.id}`, embedding, {
        docType: 'social_case_study',
        brandId,
        platform,
        outcome,
        tags: tags?.join(',') || '',
        text: `${content}\n${analysis}`,
        status: 'approved',
        isApprovedForAI: true,
      });
      await upsertToPinecone([record], { namespace: `social_${brandId}` });
    } catch (embErr) {
      console.error('[Social Cases] Embedding error (non-fatal):', embErr);
    }

    return createApiSuccess({ id: docRef.id, ...caseData });
  } catch (error: any) {
    console.error('[Social Cases] Error:', error);
    return createApiError(500, error.message || 'Failed to save social case');
  }
}
