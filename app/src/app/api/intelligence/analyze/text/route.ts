export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { parseJsonBody } from '@/app/api/_utils/parse-json';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { ApiError, handleSecurityError } from '@/lib/utils/api-security';
import { createApiError } from '@/lib/utils/api-response';
import { parseText } from '@/lib/intelligence/text-analyzer/text-parser';
import { calculateCPS, ScoringResult } from '@/lib/intelligence/predictor/scoring-engine';
import {
  AnalyzeTextRequest,
  AnalyzeTextResponse,
  TextInputType,
} from '@/types/text-analysis';
import { PredictScoreResponse } from '@/types/prediction';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

/**
 * POST /api/intelligence/analyze/text
 *
 * Analisa texto bruto (colado pelo usuário) e extrai UXIntelligence
 * com scoring de conversão opcional.
 *
 * @contract arch-sprint-25-predictive-creative-engine.md § 5
 * @token_budget 6.000 tokens (tag: analyze_text)
 * @rate_limit 15 req/min per brandId
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Parse body
    const parsed = await parseJsonBody<AnalyzeTextRequest>(req);
    if (!parsed.ok) {
      return createApiError(400, parsed.error, { code: 'VALIDATION_ERROR' });
    }

    const body = parsed.data;
    const { brandId, text, textType, format, options } = body;

    // 2. Validação de campos obrigatórios
    if (!brandId) {
      return createApiError(400, 'brandId é obrigatório.', { code: 'VALIDATION_ERROR' });
    }

    if (!text) {
      return createApiError(400, 'text é obrigatório.', { code: 'VALIDATION_ERROR' });
    }

    // 3. Validar textType
    const validTextTypes: TextInputType[] = [
      'vsl_transcript',
      'ad_copy',
      'landing_page',
      'general',
    ];
    if (!textType || !validTextTypes.includes(textType)) {
      return createApiError(400, `textType inválido. Valores aceitos: ${validTextTypes.join(', ')}`, { code: 'INVALID_TEXT_TYPE' });
    }

    // 4. Auth — requireBrandAccess
    const { userId, brandId: safeBrandId } = await requireBrandAccess(req, brandId);

    // 5. Executar Text Parser
    const parserResult = await parseText({
      text,
      textType,
      format,
      brandId: safeBrandId,
      userId,
      options: {
        includeSuggestions: options?.includeSuggestions !== false,
        detectLanguage: options?.detectLanguage !== false,
      },
    });

    // 6. Scoring opcional (integração com S25-ST-01)
    let scoring: PredictScoreResponse | undefined;

    if (options?.includeScoring !== false) {
      try {
        const scoringResult: ScoringResult = await calculateCPS(
          safeBrandId,
          parserResult.uxIntelligence,
          undefined,
          userId
        );

        scoring = {
          success: true,
          brandId: safeBrandId,
          score: scoringResult.score,
          grade: scoringResult.grade,
          breakdown: scoringResult.breakdown,
          recommendations: [],
          benchmark: {
            totalFunnelsInBase: 0,
            averageCPS: 0,
            percentileRank: 0,
            topPerformersCPS: 0,
            comparisonLabel: 'Benchmark será calculado após mais análises na base.',
          },
          metadata: {
            processedAt: new Date().toISOString(),
            modelUsed: scoringResult.modelUsed,
            tokensUsed: scoringResult.tokensUsed,
            processingTimeMs: Date.now() - startTime,
            weightsApplied: {
              headlineStrength: 0.20,
              ctaEffectiveness: 0.20,
              hookQuality: 0.15,
              offerStructure: 0.20,
              funnelCoherence: 0.15,
              trustSignals: 0.10,
            },
          },
        };
      } catch (scoringError) {
        // Graceful degradation: scoring falhar não impede a análise de texto
        console.warn(
          '[ANALYZE_TEXT] Scoring falhou (graceful degradation):',
          scoringError instanceof Error ? scoringError.message : scoringError
        );
      }
    }

    // 7. Persistência opcional no Firestore
    let persistedDocId: string | undefined;

    if (options?.persistResult !== false) {
      persistedDocId = await persistIntelligenceDocument(
        safeBrandId,
        text,
        textType,
        parserResult
      );
    }

    // 8. Montar resposta
    const processingTimeMs = Date.now() - startTime;
    const totalTokensUsed =
      parserResult.tokensUsed + (scoring?.metadata.tokensUsed ?? 0);

    const response: AnalyzeTextResponse = {
      success: true,
      brandId: safeBrandId,
      uxIntelligence: parserResult.uxIntelligence,
      scoring,
      suggestions: parserResult.suggestions,
      structuralAnalysis: parserResult.structuralAnalysis,
      metadata: {
        textType,
        inputLength: text.length,
        detectedLanguage: parserResult.detectedLanguage,
        tokensUsed: totalTokensUsed,
        processingTimeMs,
        persistedDocId,
      },
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error('[ANALYZE_TEXT_ERROR]:', error);

    if (error instanceof ApiError) {
      return handleSecurityError(error);
    }

    const message =
      error instanceof Error ? error.message : 'Erro interno ao analisar texto.';

    // Mapear erros internos para códigos HTTP
    if (message === 'TEXT_TOO_LONG') {
      return createApiError(400, 'Texto excede o limite máximo de 50.000 caracteres.', { code: 'TEXT_TOO_LONG' });
    }
    if (message === 'TEXT_TOO_SHORT') {
      return createApiError(400, 'Texto deve ter no mínimo 50 caracteres.', { code: 'TEXT_TOO_SHORT' });
    }
    if (message === 'SUSPICIOUS_INPUT') {
      return createApiError(400, 'Input rejeitado: texto contém padrões suspeitos (código, SQL, etc.).', { code: 'SUSPICIOUS_INPUT' });
    }
    if (message.includes('Budget limit')) {
      return createApiError(429, 'Limite de uso atingido.', { code: 'RATE_LIMITED' });
    }
    if (message.includes('ANALYSIS_ERROR')) {
      return createApiError(500, message, { code: 'ANALYSIS_ERROR' });
    }

    return createApiError(500, message, { code: 'ANALYSIS_ERROR' });
  }
}

// ═══════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════

/**
 * Persiste o resultado como IntelligenceDocument no Firestore.
 * Collection: brands/{brandId}/intelligence
 * fetchedVia: 'text_input'
 */
async function persistIntelligenceDocument(
  brandId: string,
  originalText: string,
  textType: TextInputType,
  parserResult: Awaited<ReturnType<typeof parseText>>
): Promise<string | undefined> {
  try {
    const now = Timestamp.now();
    // TTL: 90 dias
    const expiresAt = Timestamp.fromDate(
      new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    );

    // Gerar hash simples do texto para deduplicação
    const textHash = simpleHash(originalText);

    const intelligenceRef = collection(db, 'brands', brandId, 'intelligence');
    const docRef = await addDoc(intelligenceRef, {
      brandId,
      type: 'mention',
      status: 'processed',
      source: {
        platform: 'custom',
        fetchedVia: 'text_input',
      },
      content: {
        title: `Análise de texto (${textType})`,
        text: originalText.slice(0, 5000), // Limitar armazenamento
        textHash,
        language: parserResult.detectedLanguage,
      },
      uxIntelligence: parserResult.uxIntelligence,
      collectedAt: now,
      processedAt: now,
      expiresAt,
      version: 1,
    });

    return docRef.id;
  } catch (error) {
    // Não-bloqueante: se persistência falhar, log e continue
    console.error('[ANALYZE_TEXT] Erro ao persistir no Firestore:', error);
    return undefined;
  }
}

/**
 * Hash simples para deduplicação de texto.
 * Não-criptográfico — apenas para comparação rápida.
 */
function simpleHash(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return `txt_${Math.abs(hash).toString(36)}`;
}
