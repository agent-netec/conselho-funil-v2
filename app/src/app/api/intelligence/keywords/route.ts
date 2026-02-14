export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { KeywordMiner } from '@/lib/intelligence/keywords/miner';
import { createIntelligenceDocument } from '@/lib/firebase/intelligence';
import { db } from '@/lib/firebase/config';
import { parseJsonBody } from '@/app/api/_utils/parse-json';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { ApiError, handleSecurityError } from '@/lib/utils/api-security';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { updateUserUsage } from '@/lib/firebase/firestore';
import type { CreateIntelligenceInput } from '@/types/intelligence';

function getRequestId(req: NextRequest) {
  return req.headers.get('x-request-id') || undefined;
}

function normalizeField(value: unknown) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req);
  try {
    const parsed = await parseJsonBody<{ brandId?: string; seedTerm?: string; userId?: string }>(req);
    if (!parsed.ok) {
      return createApiError(400, parsed.error, { code: 'INVALID_JSON', requestId });
    }

    if (!parsed.data || typeof parsed.data !== 'object') {
      return createApiError(400, 'Corpo JSON inválido', { code: 'INVALID_JSON', requestId });
    }

    const brandId = normalizeField(parsed.data.brandId);
    const seedTerm = normalizeField(parsed.data.seedTerm);
    const userId = normalizeField(parsed.data.userId);

    if (!brandId || !seedTerm) {
      return createApiError(400, 'brandId e seedTerm são obrigatórios', {
        code: 'VALIDATION_ERROR',
        details: {
          fields: {
            brandId: brandId ? 'ok' : 'required',
            seedTerm: seedTerm ? 'ok' : 'required',
          },
        },
        requestId,
      });
    }

    const { brandId: safeBrandId } = await requireBrandAccess(req, brandId);

    const miner = new KeywordMiner();
    const keywords = await miner.mine(safeBrandId, seedTerm);

    // Salvar no Firestore (não bloqueia o retorno da mineração)
    const savedIds: string[] = [];
    let saveError: string | null = null;

    if (!db) {
      saveError = 'Firebase não inicializado no ambiente';
    } else if (keywords.length > 0) {
      for (const kw of keywords) {
        try {
          const content: CreateIntelligenceInput['content'] = {
            text: kw.term,
            keywordData: kw,
          };
          const id = await createIntelligenceDocument({
            brandId: safeBrandId,
            type: 'keyword',
            source: {
              platform: 'google_autocomplete',
              fetchedVia: 'api',
            },
            content,
          });
          savedIds.push(id);
        } catch (error: unknown) {
          if (!saveError) {
            saveError = error instanceof Error ? error.message : 'Falha ao persistir keywords';
          }
        }
      }
    }

    // SIG-API-03: Decrementar 1 crédito por mineração de keywords
    if (userId) {
      try {
        await updateUserUsage(userId, -1);
        console.log(`[Intelligence/Keywords] 1 crédito decrementado para usuário: ${userId}`);
      } catch (creditError) {
        console.error('[Intelligence/Keywords] Erro ao atualizar créditos:', creditError);
      }
    }

    return createApiSuccess({
      count: keywords.length,
      keywords: keywords.map(k => ({
        term: k.term,
        intent: k.intent,
        volume: k.metrics.volume,
        difficulty: k.metrics.difficulty,
        opportunityScore: k.metrics.opportunityScore,
        ...(k.suggestion ? { suggestion: k.suggestion } : {}),
      })),
      persisted: savedIds.length,
      saveError,
    });

  } catch (error: unknown) {
    if (error instanceof ApiError) {
      return handleSecurityError(error);
    }
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return createApiError(500, message, { code: 'INTERNAL_ERROR', requestId });
  }
}

