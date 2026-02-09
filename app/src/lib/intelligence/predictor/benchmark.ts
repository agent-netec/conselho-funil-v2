/**
 * Benchmark Comparativo — Conversion Predictor
 * Sprint 25 · S25-ST-02
 *
 * Compara o CPS de um funil com a base histórica da brand,
 * fornecendo ranking relativo e contexto competitivo.
 *
 * Cache: 24h por brandId (Firestore doc: brands/{brandId}/predictions/_benchmark)
 * Graceful degradation: se base = 0 funis, retorna defaults seguros.
 *
 * @contract arch-sprint-25-predictive-creative-engine.md § 3
 */

import { BenchmarkComparison } from '@/types/prediction';
import { db } from '@/lib/firebase/config';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  Timestamp,
} from 'firebase/firestore';

// ═══════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════

/** TTL do cache de benchmark em milissegundos (24h) */
const BENCHMARK_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/** Percentil do "top performers" (top 10%) */
const TOP_PERFORMERS_PERCENTILE = 0.10;

/** Benchmark default quando não há dados */
const DEFAULT_BENCHMARK: BenchmarkComparison = {
  totalFunnelsInBase: 0,
  averageCPS: 0,
  percentileRank: 0,
  topPerformersCPS: 0,
  comparisonLabel: 'Ainda não há dados suficientes para benchmark. Analise mais funis para desbloquear comparações.',
};

// ═══════════════════════════════════════════════════════
// INTERFACES INTERNAS
// ═══════════════════════════════════════════════════════

interface BenchmarkCache {
  totalFunnelsInBase: number;
  averageCPS: number;
  topPerformersCPS: number;
  /** Todos os scores ordenados (para cálculo de percentil) */
  sortedScores: number[];
  /** Timestamp de criação do cache */
  cachedAt: Timestamp;
  /** Timestamp de expiração */
  expiresAt: Timestamp;
}

// ═══════════════════════════════════════════════════════
// API PÚBLICA
// ═══════════════════════════════════════════════════════

/**
 * Calcula o benchmark comparativo para um funil.
 *
 * 1. Verifica cache (Firestore doc: brands/{brandId}/predictions/_benchmark)
 * 2. Se cache válido (< 24h), usa direto
 * 3. Senão, query all predictions, calcula stats, salva cache
 * 4. Calcula percentileRank do currentCPS contra a base
 * 5. Retorna BenchmarkComparison
 *
 * @param brandId - ID da brand (isolamento multi-tenant)
 * @param currentCPS - CPS do funil sendo analisado
 * @returns BenchmarkComparison com contexto competitivo
 */
export async function calculateBenchmark(
  brandId: string,
  currentCPS: number
): Promise<BenchmarkComparison> {
  try {
    // 1. Tentar ler cache
    const cached = await readBenchmarkCache(brandId);

    let stats: BenchmarkCache;

    if (cached && isCacheValid(cached)) {
      stats = cached;
    } else {
      // 2. Recalcular a partir da base
      stats = await computeBenchmarkStats(brandId);

      // 3. Salvar cache (não-bloqueante)
      saveBenchmarkCache(brandId, stats).catch((err) =>
        console.warn('[Benchmark] Falha ao salvar cache:', err)
      );
    }

    // 4. Se base vazia, retornar defaults
    if (stats.totalFunnelsInBase === 0) {
      return DEFAULT_BENCHMARK;
    }

    // 5. Calcular percentil do CPS atual
    const percentileRank = calculatePercentileRank(
      currentCPS,
      stats.sortedScores
    );

    // 6. Gerar label descritivo
    const comparisonLabel = buildComparisonLabel(
      currentCPS,
      stats.averageCPS,
      percentileRank
    );

    return {
      totalFunnelsInBase: stats.totalFunnelsInBase,
      averageCPS: round2(stats.averageCPS),
      percentileRank: Math.round(percentileRank),
      topPerformersCPS: round2(stats.topPerformersCPS),
      comparisonLabel,
    };
  } catch (error) {
    console.error('[Benchmark] Erro ao calcular benchmark:', error);
    // Graceful degradation: retornar defaults
    return {
      ...DEFAULT_BENCHMARK,
      comparisonLabel:
        'Benchmark temporariamente indisponível. Tente novamente mais tarde.',
    };
  }
}

// ═══════════════════════════════════════════════════════
// CACHE (Firestore)
// ═══════════════════════════════════════════════════════

/**
 * Lê o cache de benchmark do Firestore.
 * Path: brands/{brandId}/predictions/_benchmark
 */
async function readBenchmarkCache(
  brandId: string
): Promise<BenchmarkCache | null> {
  try {
    const cacheRef = doc(db, 'brands', brandId, 'predictions', '_benchmark');
    const snap = await getDoc(cacheRef);

    if (!snap.exists()) return null;

    return snap.data() as BenchmarkCache;
  } catch (error) {
    console.warn('[Benchmark] Erro ao ler cache:', error);
    return null;
  }
}

/**
 * Verifica se o cache ainda é válido (< 24h).
 */
function isCacheValid(cache: BenchmarkCache): boolean {
  if (!cache.expiresAt) return false;

  const expiresAtMs = cache.expiresAt.toMillis();
  return Date.now() < expiresAtMs;
}

/**
 * Salva o cache de benchmark no Firestore.
 * Path: brands/{brandId}/predictions/_benchmark
 */
async function saveBenchmarkCache(
  brandId: string,
  stats: BenchmarkCache
): Promise<void> {
  const cacheRef = doc(db, 'brands', brandId, 'predictions', '_benchmark');
  await setDoc(cacheRef, stats, { merge: false });
}

// ═══════════════════════════════════════════════════════
// COMPUTE STATS
// ═══════════════════════════════════════════════════════

/**
 * Query todas as predictions da brand e calcula stats agregadas.
 * Filtra documento de cache (_benchmark) pela presença de campo `score`.
 */
async function computeBenchmarkStats(
  brandId: string
): Promise<BenchmarkCache> {
  const predictionsRef = collection(db, 'brands', brandId, 'predictions');
  const snapshot = await getDocs(predictionsRef);

  // Extrair scores válidos (ignorar doc de cache e docs sem score)
  const scores: number[] = [];
  snapshot.forEach((docSnap) => {
    // Ignorar o documento de cache
    if (docSnap.id === '_benchmark') return;

    const data = docSnap.data();
    if (typeof data.score === 'number' && data.score >= 0 && data.score <= 100) {
      scores.push(data.score);
    }
  });

  if (scores.length === 0) {
    const now = Timestamp.now();
    return {
      totalFunnelsInBase: 0,
      averageCPS: 0,
      topPerformersCPS: 0,
      sortedScores: [],
      cachedAt: now,
      expiresAt: Timestamp.fromMillis(now.toMillis() + BENCHMARK_CACHE_TTL_MS),
    };
  }

  // Ordenar descendente para facilitar cálculos
  scores.sort((a, b) => b - a);

  // Média geral
  const averageCPS = scores.reduce((sum, s) => sum + s, 0) / scores.length;

  // Top performers (top 10%)
  const topCount = Math.max(1, Math.ceil(scores.length * TOP_PERFORMERS_PERCENTILE));
  const topScores = scores.slice(0, topCount);
  const topPerformersCPS =
    topScores.reduce((sum, s) => sum + s, 0) / topScores.length;

  const now = Timestamp.now();

  return {
    totalFunnelsInBase: scores.length,
    averageCPS,
    topPerformersCPS,
    sortedScores: scores,
    cachedAt: now,
    expiresAt: Timestamp.fromMillis(now.toMillis() + BENCHMARK_CACHE_TTL_MS),
  };
}

// ═══════════════════════════════════════════════════════
// PERCENTILE & LABEL
// ═══════════════════════════════════════════════════════

/**
 * Calcula o ranking percentil do CPS atual na base.
 * Ex: percentileRank = 85 significa "Top 15%"
 *
 * @param currentCPS - Score do funil atual
 * @param sortedScores - Scores da base ordenados descente
 * @returns Percentil (0-100). 100 = melhor da base.
 */
function calculatePercentileRank(
  currentCPS: number,
  sortedScores: number[]
): number {
  if (sortedScores.length === 0) return 0;

  // Contar quantos scores o currentCPS supera ou iguala
  // sortedScores está ordenado desc, inverter para asc
  const asc = [...sortedScores].reverse();

  const belowOrEqual = asc.filter((s) => s <= currentCPS).length;
  const percentile = (belowOrEqual / asc.length) * 100;

  return Math.min(100, Math.max(0, percentile));
}

/**
 * Gera um label descritivo em português para o benchmark.
 */
function buildComparisonLabel(
  currentCPS: number,
  averageCPS: number,
  percentileRank: number
): string {
  const topPercent = Math.round(100 - percentileRank);

  if (percentileRank >= 90) {
    return `Excepcional — Top ${topPercent}% da base (CPS ${currentCPS.toFixed(1)} vs média ${averageCPS.toFixed(1)})`;
  }
  if (percentileRank >= 75) {
    return `Acima da média — Top ${topPercent}% da base (CPS ${currentCPS.toFixed(1)} vs média ${averageCPS.toFixed(1)})`;
  }
  if (percentileRank >= 50) {
    return `Na média — Top ${topPercent}% da base (CPS ${currentCPS.toFixed(1)} vs média ${averageCPS.toFixed(1)})`;
  }
  if (percentileRank >= 25) {
    return `Abaixo da média — Top ${topPercent}% da base (CPS ${currentCPS.toFixed(1)} vs média ${averageCPS.toFixed(1)})`;
  }
  return `Precisa de melhorias — Top ${topPercent}% da base (CPS ${currentCPS.toFixed(1)} vs média ${averageCPS.toFixed(1)})`;
}

// ═══════════════════════════════════════════════════════
// UTILS
// ═══════════════════════════════════════════════════════

/** Arredonda para 2 casas decimais */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
