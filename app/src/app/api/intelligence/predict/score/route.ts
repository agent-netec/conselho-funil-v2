export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { parseJsonBody } from '@/app/api/_utils/parse-json';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { ApiError, handleSecurityError } from '@/lib/utils/api-security';
import { createApiError } from '@/lib/utils/api-response';
import { calculateCPS } from '@/lib/intelligence/predictor/scoring-engine';
import { calculateBenchmark } from '@/lib/intelligence/predictor/benchmark';
import { generateRecommendations } from '@/lib/intelligence/predictor/recommendations';
import {
  PredictScoreRequest,
  PredictScoreResponse,
  DimensionWeights,
  DEFAULT_DIMENSION_WEIGHTS,
  validateWeights,
  Recommendation,
  BenchmarkComparison,
} from '@/types/prediction';
import { UXIntelligence } from '@/types/intelligence';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, collection, addDoc, Timestamp, query, where, getDocs, limit } from 'firebase/firestore';

/**
 * POST /api/intelligence/predict/score
 *
 * Calcula o Conversion Probability Score (CPS) de um funil
 * baseado em 6 dimensões de análise.
 *
 * @contract arch-sprint-25-predictive-creative-engine.md § 3
 * @token_budget 4.000 tokens (tag: predict_score)
 * @rate_limit 20 req/min per brandId
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Parse body
    const parsed = await parseJsonBody<PredictScoreRequest>(req);
    if (!parsed.ok) {
      return createApiError(400, parsed.error, { code: 'VALIDATION_ERROR' });
    }

    const body = parsed.data;
    const { brandId, funnelUrl, funnelData, options } = body;

    // 2. Validação de campos obrigatórios
    if (!brandId) {
      return createApiError(400, 'brandId é obrigatório.', { code: 'VALIDATION_ERROR' });
    }

    if (!funnelUrl && !funnelData) {
      return createApiError(400, 'Forneça funnelUrl ou funnelData.', { code: 'VALIDATION_ERROR' });
    }

    // 3. Validar pesos customizados (se fornecidos)
    let weights: DimensionWeights = DEFAULT_DIMENSION_WEIGHTS;
    if (options?.nicheWeights) {
      weights = {
        ...DEFAULT_DIMENSION_WEIGHTS,
        ...options.nicheWeights,
      };
      if (!validateWeights(weights)) {
        return createApiError(400, 'Soma dos pesos deve ser ~1.0 (tolerância: 0.01).', { code: 'INVALID_WEIGHTS' });
      }
    }

    // 4. Auth — requireBrandAccess
    const { userId, brandId: safeBrandId } = await requireBrandAccess(req, brandId);

    // 5. Resolver UXIntelligence
    let uxData: UXIntelligence;

    if (funnelData) {
      // Dados já fornecidos no request
      uxData = funnelData;
    } else if (funnelUrl) {
      // Buscar UXIntelligence existente no Firestore (NÃO scrape novamente — guardrail)
      const existingData = await fetchExistingUXIntelligence(safeBrandId, funnelUrl);
      if (!existingData) {
        return createApiError(400, 'Nenhum UXIntelligence encontrado para esta URL. Execute uma análise de URL primeiro.', { code: 'VALIDATION_ERROR' });
      }
      uxData = existingData;
    } else {
      return createApiError(400, 'Forneça funnelUrl ou funnelData.', { code: 'VALIDATION_ERROR' });
    }

    // 6. Executar Scoring Engine
    const scoringResult = await calculateCPS(safeBrandId, uxData, weights, userId);

    // 7. Benchmark Comparativo (S25-ST-02) e Recommendations (S25-ST-03)
    const includeRecommendations = options?.includeRecommendations !== false;
    const includeBenchmark = options?.includeBenchmark !== false;

    // Executar benchmark e recommendations em paralelo para melhor performance
    const [benchmark, recommendations] = await Promise.all([
      includeBenchmark
        ? calculateBenchmark(safeBrandId, scoringResult.score)
        : Promise.resolve<BenchmarkComparison>({
            totalFunnelsInBase: 0,
            averageCPS: 0,
            percentileRank: 0,
            topPerformersCPS: 0,
            comparisonLabel: 'Benchmark desabilitado neste request.',
          }),
      includeRecommendations
        ? generateRecommendations(safeBrandId, scoringResult.breakdown, uxData, userId)
        : Promise.resolve<Recommendation[]>([]),
    ]);

    // 8. Persistir no Firestore: brands/{brandId}/predictions
    const predictionDocId = await persistPrediction(safeBrandId, funnelUrl, scoringResult, recommendations, benchmark);

    // 9. Montar resposta
    const processingTimeMs = Date.now() - startTime;

    const response: PredictScoreResponse = {
      success: true,
      brandId: safeBrandId,
      score: scoringResult.score,
      grade: scoringResult.grade,
      breakdown: scoringResult.breakdown,
      recommendations,
      benchmark,
      metadata: {
        processedAt: new Date().toISOString(),
        modelUsed: scoringResult.modelUsed,
        tokensUsed: scoringResult.tokensUsed,
        processingTimeMs,
        weightsApplied: weights,
      },
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error('[PREDICT_SCORE_ERROR]:', error);

    if (error instanceof ApiError) {
      return handleSecurityError(error);
    }

    const message = error instanceof Error ? error.message : 'Erro interno ao processar scoring.';

    // Mapear erros internos para códigos HTTP
    if (message.includes('INVALID_WEIGHTS')) {
      return createApiError(400, message, { code: 'INVALID_WEIGHTS' });
    }
    if (message.includes('Budget limit')) {
      return createApiError(429, 'Limite de uso atingido.', { code: 'RATE_LIMITED' });
    }
    if (message.includes('SCORING_ERROR')) {
      return createApiError(500, message, { code: 'SCORING_ERROR' });
    }

    return createApiError(500, message, { code: 'SCORING_ERROR' });
  }
}

// ═══════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════

/**
 * Busca UXIntelligence existente no Firestore para uma URL.
 * Guardrail: NÃO faz scrape — apenas busca dados já processados.
 */
async function fetchExistingUXIntelligence(
  brandId: string,
  funnelUrl: string
): Promise<UXIntelligence | null> {
  try {
    const intelligenceRef = collection(db, 'brands', brandId, 'intelligence');
    const q = query(
      intelligenceRef,
      where('content.originalUrl', '==', funnelUrl),
      where('status', '==', 'processed'),
      limit(1)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const docData = snapshot.docs[0].data();
    return docData.uxIntelligence as UXIntelligence | null;
  } catch (error) {
    console.error('[PREDICT_SCORE] Erro ao buscar UXIntelligence existente:', error);
    return null;
  }
}

// Placeholders removidos — substituídos por:
//   - calculateBenchmark() (S25-ST-02: benchmark.ts)
//   - generateRecommendations() (S25-ST-03: recommendations.ts)

/**
 * Persiste o resultado do scoring no Firestore.
 * Collection: brands/{brandId}/predictions
 * TTL: 90 dias
 */
async function persistPrediction(
  brandId: string,
  funnelUrl: string | undefined,
  scoringResult: import('@/lib/intelligence/predictor/scoring-engine').ScoringResult,
  recommendations: Recommendation[],
  benchmark: BenchmarkComparison
): Promise<string> {
  try {
    const now = Timestamp.now();
    const expiresAt = Timestamp.fromDate(
      new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    );

    const predictionsRef = collection(db, 'brands', brandId, 'predictions');
    const docRef = await addDoc(predictionsRef, {
      brandId,
      funnelUrl: funnelUrl || null,
      score: scoringResult.score,
      grade: scoringResult.grade,
      breakdown: scoringResult.breakdown,
      recommendations,
      benchmark,
      inputType: funnelUrl ? 'url' : 'ux_intelligence',
      createdAt: now,
      expiresAt,
    });

    return docRef.id;
  } catch (error) {
    // Não-bloqueante: se persistência falhar, log e continue
    console.error('[PREDICT_SCORE] Erro ao persistir no Firestore:', error);
    return 'persistence-failed';
  }
}
