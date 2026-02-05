export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { KeywordMiner } from '@/lib/intelligence/keywords/miner';
import { createIntelligenceDocument } from '@/lib/firebase/intelligence';
import { db } from '@/lib/firebase/config';
import { parseJsonBody } from '@/app/api/_utils/parse-json';

type ErrorCode =
  | 'INVALID_JSON'
  | 'VALIDATION_ERROR'
  | 'BRAND_NOT_FOUND'
  | 'INTERNAL_ERROR';

type ErrorDetails = Record<string, unknown>;

function getRequestId(req: NextRequest) {
  return req.headers.get('x-request-id') || undefined;
}

function errorResponse(
  status: number,
  error: string,
  code?: ErrorCode,
  details?: ErrorDetails,
  requestId?: string
) {
  return NextResponse.json(
    { error, code, details, requestId },
    { status }
  );
}

function normalizeField(value: unknown) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req);
  try {
    const parsed = await parseJsonBody<{ brandId?: string; seedTerm?: string }>(req);
    if (!parsed.ok) {
      return errorResponse(400, parsed.error, 'INVALID_JSON', undefined, requestId);
    }

    if (!parsed.data || typeof parsed.data !== 'object') {
      return errorResponse(
        400,
        'Corpo JSON inválido',
        'INVALID_JSON',
        undefined,
        requestId
      );
    }

    const brandId = normalizeField(parsed.data.brandId);
    const seedTerm = normalizeField(parsed.data.seedTerm);

    if (!brandId || !seedTerm) {
      return errorResponse(
        400,
        'brandId e seedTerm são obrigatórios',
        'VALIDATION_ERROR',
        {
          fields: {
            brandId: brandId ? 'ok' : 'required',
            seedTerm: seedTerm ? 'ok' : 'required',
          },
        },
        requestId
      );
    }

    const miner = new KeywordMiner();
    const keywords = await miner.mine(brandId, seedTerm);

    // Salvar no Firestore (não bloqueia o retorno da mineração)
    const savedIds: string[] = [];
    let saveError: string | null = null;

    if (!db) {
      saveError = 'Firebase não inicializado no ambiente';
    } else if (keywords.length > 0) {
      for (const kw of keywords) {
        try {
          const id = await createIntelligenceDocument({
            brandId,
            type: 'keyword',
            source: {
              platform: 'google_autocomplete',
              fetchedVia: 'api',
            },
            content: {
              text: kw.term,
              keywordData: kw,
            } as any,
          });
          savedIds.push(id);
        } catch (error: any) {
          if (!saveError) {
            saveError = error?.message || 'Falha ao persistir keywords';
          }
        }
      }
    }

    return NextResponse.json({
      success: true, 
      count: keywords.length,
      keywords: keywords.map(k => k.term),
      persisted: savedIds.length,
      saveError,
    });

  } catch (error: any) {
    return errorResponse(
      500,
      error?.message || 'Unexpected error',
      'INTERNAL_ERROR',
      undefined,
      requestId
    );
  }
}
