/**
 * Recommendations Engine — Conversion Predictor
 * Sprint 25 · S25-ST-03
 *
 * Para cada dimensão com score < 60, gera sugestões concretas de melhoria
 * baseadas nos Elite Assets da base (RAG-powered via Pinecone).
 *
 * Prioridade:
 *   critical (<30), high (<45), medium (<60)
 *
 * Cross-Lane: ai_retrieval (readonly — buscar Elite Assets via RAG)
 * Graceful degradation: se Pinecone/RAG indisponível, retorna sugestões genéricas.
 *
 * @contract arch-sprint-25-predictive-creative-engine.md § 3
 */

import {
  Recommendation,
  DimensionScore,
  ConversionDimension,
} from '@/types/prediction';
import { UXIntelligence, UXAsset } from '@/types/intelligence';
import { generateWithGemini } from '@/lib/ai/gemini';
import { AICostGuard } from '@/lib/ai/cost-guard';

// ═══════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════

const FEATURE_TAG = 'predict_recommendations';
const TOKEN_BUDGET = 3000;

/** Threshold para gerar recomendação */
const RECOMMENDATION_THRESHOLD = 60;

/** Mapeamento de score para prioridade */
const PRIORITY_THRESHOLDS = {
  critical: 30,
  high: 45,
  medium: 60,
} as const;

/** Mapeamento dimensão → tipo de Elite Asset relevante */
const DIMENSION_ASSET_MAP: Record<ConversionDimension, ('headline' | 'cta' | 'hook' | 'visual')[]> = {
  headline_strength: ['headline'],
  cta_effectiveness: ['cta'],
  hook_quality: ['hook'],
  offer_structure: ['headline', 'cta'],
  funnel_coherence: ['headline', 'cta', 'hook'],
  trust_signals: ['visual', 'headline'],
};

/** Frameworks de copywriting dos Conselheiros */
const COPYWRITING_FRAMEWORKS: Record<string, FrameworkInfo> = {
  schwartz: {
    name: 'Eugene Schwartz — Níveis de Consciência',
    description: 'Adaptar mensagem ao nível de consciência do público (Unaware → Most Aware)',
    applicableTo: ['headline_strength', 'hook_quality', 'offer_structure'],
  },
  brunson: {
    name: 'Russell Brunson — Story, Offer, Close',
    description: 'Estruturar comunicação em narrativa → oferta irresistível → fechamento urgente',
    applicableTo: ['offer_structure', 'funnel_coherence', 'cta_effectiveness'],
  },
  halbert: {
    name: 'Gary Halbert — AIDA + Prova Social',
    description: 'Attention → Interest → Desire → Action, com ênfase em provas concretas',
    applicableTo: ['headline_strength', 'cta_effectiveness', 'trust_signals'],
  },
};

// ═══════════════════════════════════════════════════════
// INTERFACES INTERNAS
// ═══════════════════════════════════════════════════════

interface FrameworkInfo {
  name: string;
  description: string;
  applicableTo: ConversionDimension[];
}

interface EliteAsset {
  text: string;
  type: 'headline' | 'cta' | 'hook' | 'visual';
  relevanceScore: number;
  source?: string;
}

interface GeminiRecommendation {
  dimension: ConversionDimension;
  issue: string;
  suggestion: string;
  rewrittenAsset?: string;
  framework?: string;
}

interface GeminiRecommendationsResponse {
  recommendations: GeminiRecommendation[];
}

// ═══════════════════════════════════════════════════════
// API PÚBLICA
// ═══════════════════════════════════════════════════════

/**
 * Gera recomendações de melhoria para dimensões com score < 60.
 *
 * Pipeline:
 *   1. Filtrar dimensões abaixo do threshold
 *   2. Buscar Elite Assets via RAG/Pinecone (graceful degradation)
 *   3. Montar prompt contextualizado com frameworks
 *   4. Chamar Gemini para gerar sugestões concretas
 *   5. Classificar prioridade e retornar Recommendation[]
 *
 * @param brandId - ID da brand (isolamento multi-tenant)
 * @param breakdown - Array de DimensionScore da análise
 * @param uxData - UXIntelligence com assets originais do funil
 * @param userId - ID do usuário para cost-guard
 * @returns Array de Recommendation[]
 */
export async function generateRecommendations(
  brandId: string,
  breakdown: DimensionScore[],
  uxData: UXIntelligence,
  userId: string = 'system'
): Promise<Recommendation[]> {
  // 1. Filtrar dimensões que precisam de recomendação
  const weakDimensions = breakdown.filter(
    (d) => d.score < RECOMMENDATION_THRESHOLD
  );

  // Se todas as dimensões estão OK, retornar vazio
  if (weakDimensions.length === 0) {
    return [];
  }

  // 2. Buscar Elite Assets (graceful degradation)
  let eliteAssets: EliteAsset[] = [];
  let ragAvailable = false;

  try {
    eliteAssets = await fetchEliteAssets(brandId, uxData);
    ragAvailable = eliteAssets.length > 0;
  } catch (error) {
    console.warn(
      '[Recommendations] RAG/Pinecone indisponível, usando sugestões genéricas:',
      error
    );
  }

  // 3. Tentar gerar recomendações via IA
  try {
    const aiRecommendations = await generateAIRecommendations(
      brandId,
      weakDimensions,
      uxData,
      eliteAssets,
      ragAvailable,
      userId
    );

    return aiRecommendations;
  } catch (error) {
    console.warn(
      '[Recommendations] Falha na geração IA, usando fallback:',
      error
    );
    // Fallback: recomendações genéricas baseadas em heurísticas
    return buildFallbackRecommendations(weakDimensions, eliteAssets);
  }
}

// ═══════════════════════════════════════════════════════
// ELITE ASSETS (Cross-Lane: ai_retrieval — readonly)
// ═══════════════════════════════════════════════════════

/**
 * Busca Elite Assets (top 20% por relevanceScore) da brand.
 *
 * Tenta primeiro via Pinecone/RAG (cross-lane: ai_retrieval).
 * Fallback: busca direto dos UXAssets do uxData fornecido.
 *
 * @param brandId - ID da brand (multi-tenant isolation)
 * @param uxData - UXIntelligence com assets originais
 * @returns EliteAsset[] — assets de elite da brand
 */
async function fetchEliteAssets(
  brandId: string,
  uxData: UXIntelligence
): Promise<EliteAsset[]> {
  // Tentar buscar via Pinecone (se configurado)
  const pineconeAvailable = isPineconeConfigured();

  if (pineconeAvailable) {
    try {
      const pineconeAssets = await queryPineconeEliteAssets(brandId);
      if (pineconeAssets.length > 0) {
        return pineconeAssets;
      }
    } catch (error) {
      console.warn('[Recommendations] Pinecone query falhou, usando fallback local:', error);
    }
  }

  // Fallback: extrair elite assets dos dados locais (UXIntelligence)
  return extractLocalEliteAssets(uxData);
}

/**
 * Verifica se Pinecone está configurado.
 */
function isPineconeConfigured(): boolean {
  return !!(
    process.env.PINECONE_API_KEY &&
    process.env.PINECONE_INDEX
  );
}

/**
 * Query Pinecone para Elite Assets de uma brand.
 * Cross-lane: ai_retrieval (readonly).
 *
 * Busca os top 20% assets por relevanceScore no namespace da brand.
 */
async function queryPineconeEliteAssets(
  brandId: string
): Promise<EliteAsset[]> {
  const apiKey = process.env.PINECONE_API_KEY;
  const indexHost = process.env.PINECONE_INDEX;

  if (!apiKey || !indexHost) {
    return [];
  }

  try {
    // Buscar vetores com metadata brandId e alto relevanceScore
    // Usa uma query genérica com filter por brandId
    const response = await fetch(`https://${indexHost}/query`, {
      method: 'POST',
      headers: {
        'Api-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Query vector zerado — usamos apenas metadata filter + topK
        // Em produção, seria ideal usar embedding da dimensão fraca
        vector: new Array(1536).fill(0),
        topK: 20,
        includeMetadata: true,
        filter: {
          brandId: { $eq: brandId },
          relevanceScore: { $gte: 0.7 }, // Top ~20%
        },
        namespace: brandId,
      }),
    });

    if (!response.ok) {
      console.warn(`[Recommendations] Pinecone returned ${response.status}`);
      return [];
    }

    const data = await response.json();

    return (data.matches || [])
      .filter((match: { metadata?: Record<string, unknown> }) => match.metadata)
      .map((match: { metadata: Record<string, unknown>; score?: number }) => ({
        text: (match.metadata.text as string) || '',
        type: (match.metadata.type as EliteAsset['type']) || 'headline',
        relevanceScore: (match.metadata.relevanceScore as number) || match.score || 0.7,
        source: 'pinecone',
      }));
  } catch (error) {
    console.warn('[Recommendations] Pinecone query error:', error);
    return [];
  }
}

/**
 * Extrai Elite Assets dos UXAssets locais (fallback quando Pinecone indisponível).
 * Seleciona os top 20% por relevanceScore de cada tipo.
 */
function extractLocalEliteAssets(uxData: UXIntelligence): EliteAsset[] {
  const allAssets: EliteAsset[] = [];

  const assetGroups: { assets: UXAsset[]; type: EliteAsset['type'] }[] = [
    { assets: uxData.headlines || [], type: 'headline' },
    { assets: uxData.ctas || [], type: 'cta' },
    { assets: uxData.hooks || [], type: 'hook' },
    { assets: uxData.visualElements || [], type: 'visual' },
  ];

  for (const group of assetGroups) {
    if (group.assets.length === 0) continue;

    // Ordenar por relevanceScore desc
    const sorted = [...group.assets].sort(
      (a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0)
    );

    // Top 20% (mínimo 1)
    const topCount = Math.max(1, Math.ceil(sorted.length * 0.2));
    const topAssets = sorted.slice(0, topCount);

    for (const asset of topAssets) {
      allAssets.push({
        text: asset.text,
        type: group.type,
        relevanceScore: asset.relevanceScore || 0,
        source: 'local',
      });
    }
  }

  return allAssets;
}

// ═══════════════════════════════════════════════════════
// IA RECOMMENDATIONS (Gemini)
// ═══════════════════════════════════════════════════════

/**
 * Gera recomendações detalhadas via Gemini, contextualizadas com
 * Elite Assets e frameworks de copywriting.
 */
async function generateAIRecommendations(
  brandId: string,
  weakDimensions: DimensionScore[],
  uxData: UXIntelligence,
  eliteAssets: EliteAsset[],
  ragAvailable: boolean,
  userId: string
): Promise<Recommendation[]> {
  // Budget check
  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const hasBudget = await AICostGuard.checkBudget({
    userId,
    brandId,
    model,
    feature: FEATURE_TAG,
  });

  if (!hasBudget) {
    console.warn('[Recommendations] Budget excedido, usando fallback.');
    return buildFallbackRecommendations(weakDimensions, eliteAssets);
  }

  // Montar prompt
  const prompt = buildRecommendationsPrompt(
    weakDimensions,
    uxData,
    eliteAssets,
    ragAvailable
  );

  // Chamar Gemini
  const rawResponse = await generateWithGemini(prompt, {
    model,
    temperature: 0.4,
    maxOutputTokens: TOKEN_BUDGET,
    responseMimeType: 'application/json',
    userId,
    brandId,
    feature: FEATURE_TAG,
  });

  // Parsear resposta
  const parsed = parseGeminiRecommendations(rawResponse);

  // Mapear para Recommendation[] com prioridade calculada
  return parsed.recommendations.map((rec) => {
    const dimScore = weakDimensions.find((d) => d.dimension === rec.dimension);
    const score = dimScore?.score ?? 50;

    return {
      dimension: rec.dimension,
      priority: scoreToPriority(score),
      currentScore: score,
      issue: rec.issue,
      suggestion: rec.suggestion,
      rewrittenAsset: rec.rewrittenAsset,
      framework: rec.framework,
      basedOnEliteAsset: ragAvailable && !!rec.rewrittenAsset,
    };
  });
}

/**
 * Monta o prompt de recomendações contextualizado com frameworks e Elite Assets.
 */
function buildRecommendationsPrompt(
  weakDimensions: DimensionScore[],
  uxData: UXIntelligence,
  eliteAssets: EliteAsset[],
  ragAvailable: boolean
): string {
  // Dimensões fracas
  const dimensionsList = weakDimensions
    .map(
      (d) =>
        `- **${d.dimension}** (score: ${d.score}/100): ${d.explanation}${
          d.suggestions?.length
            ? `\n  Evidências: ${d.evidence?.join(', ') || 'N/A'}`
            : ''
        }`
    )
    .join('\n');

  // Elite Assets (se disponíveis)
  const eliteSection = eliteAssets.length > 0
    ? `\n## Elite Assets de Referência (${ragAvailable ? 'via RAG' : 'local'})\n${eliteAssets
        .map((a) => `- [${a.type}] "${a.text}" (relevance: ${a.relevanceScore})`)
        .join('\n')}`
    : '\nNenhum Elite Asset disponível para referência.';

  // Frameworks aplicáveis
  const applicableFrameworks = getApplicableFrameworks(
    weakDimensions.map((d) => d.dimension)
  );
  const frameworkSection = applicableFrameworks.length > 0
    ? `\n## Frameworks de Copywriting Aplicáveis\n${applicableFrameworks
        .map((f) => `- **${f.name}**: ${f.description}`)
        .join('\n')}`
    : '';

  // Assets originais do funil
  const origHeadlines = uxData.headlines
    .slice(0, 5)
    .map((h) => `- "${h.text}"`)
    .join('\n');
  const origCTAs = uxData.ctas
    .slice(0, 5)
    .map((c) => `- "${c.text}"`)
    .join('\n');
  const origHooks = uxData.hooks
    .slice(0, 5)
    .map((h) => `- "${h.text}"`)
    .join('\n');

  return `Você é um consultor especialista em conversão digital, treinado nas metodologias de Eugene Schwartz, Gary Halbert e Russell Brunson.

Analise as dimensões fracas de um funil de vendas e gere recomendações CONCRETAS e ACIONÁVEIS para cada uma.

## Dimensões que Precisam de Melhoria
${dimensionsList}

## Assets Originais do Funil
### Headlines
${origHeadlines || 'Nenhuma headline.'}
### CTAs
${origCTAs || 'Nenhum CTA.'}
### Hooks
${origHooks || 'Nenhum hook.'}
${eliteSection}
${frameworkSection}

## Instruções
Para CADA dimensão fraca, gere:
1. **issue**: O problema específico detectado (1-2 frases em português)
2. **suggestion**: Sugestão concreta de melhoria (2-3 frases em português)
3. **rewrittenAsset**: ${eliteAssets.length > 0 ? 'Reescreva um asset usando o Elite Asset como referência' : 'Proponha um novo asset melhorado'} (se aplicável)
4. **framework**: Nome do framework aplicado (Schwartz, Brunson, Halbert) — apenas se diretamente relevante

## Formato de Resposta (JSON)
Responda EXCLUSIVAMENTE com JSON válido:

{
  "recommendations": [
    {
      "dimension": "headline_strength",
      "issue": "O problema detectado",
      "suggestion": "Sugestão concreta de melhoria",
      "rewrittenAsset": "Novo headline melhorado usando framework X",
      "framework": "Schwartz"
    }
  ]
}

REGRAS:
- Gere exatamente ${weakDimensions.length} recomendações (uma por dimensão fraca).
- Suggestions devem ser em português, concretas e acionáveis.
- rewrittenAsset é opcional — incluir apenas quando fizer sentido reescrever um asset.
- framework é opcional — incluir apenas quando o framework for diretamente aplicável.
- Se houver Elite Assets de referência, USE-OS como inspiração para o rewrittenAsset.`;
}

/**
 * Retorna frameworks aplicáveis às dimensões fracas.
 */
function getApplicableFrameworks(
  dimensions: ConversionDimension[]
): FrameworkInfo[] {
  const applicable: FrameworkInfo[] = [];

  for (const [, framework] of Object.entries(COPYWRITING_FRAMEWORKS)) {
    const isApplicable = framework.applicableTo.some((d) =>
      dimensions.includes(d)
    );
    if (isApplicable) {
      applicable.push(framework);
    }
  }

  return applicable;
}

// ═══════════════════════════════════════════════════════
// PARSING
// ═══════════════════════════════════════════════════════

/**
 * Parseia a resposta JSON do Gemini para recomendações.
 */
function parseGeminiRecommendations(
  raw: string
): GeminiRecommendationsResponse {
  let jsonStr = raw.trim();

  // Remover wrappers markdown
  if (jsonStr.startsWith('```json')) jsonStr = jsonStr.slice(7);
  if (jsonStr.startsWith('```')) jsonStr = jsonStr.slice(3);
  if (jsonStr.endsWith('```')) jsonStr = jsonStr.slice(0, -3);

  try {
    const parsed = JSON.parse(jsonStr.trim()) as GeminiRecommendationsResponse;

    if (!parsed.recommendations || !Array.isArray(parsed.recommendations)) {
      throw new Error('Resposta sem array "recommendations".');
    }

    return parsed;
  } catch (error) {
    console.error(
      '[Recommendations] Falha ao parsear resposta do Gemini:',
      raw
    );
    throw new Error(
      `RECOMMENDATIONS_ERROR: Falha ao processar resposta da IA. ${
        error instanceof Error ? error.message : ''
      }`
    );
  }
}

// ═══════════════════════════════════════════════════════
// FALLBACK (Graceful Degradation)
// ═══════════════════════════════════════════════════════

/**
 * Recomendações genéricas quando Gemini/RAG não estão disponíveis.
 * Usa heurísticas locais baseadas nos frameworks dos Conselheiros.
 */
function buildFallbackRecommendations(
  weakDimensions: DimensionScore[],
  eliteAssets: EliteAsset[]
): Recommendation[] {
  return weakDimensions.map((dim) => {
    const priority = scoreToPriority(dim.score);
    const framework = findBestFramework(dim.dimension);
    const relevantElite = findRelevantEliteAsset(dim.dimension, eliteAssets);

    return {
      dimension: dim.dimension,
      priority,
      currentScore: dim.score,
      issue: dim.explanation || FALLBACK_ISSUES[dim.dimension],
      suggestion: FALLBACK_SUGGESTIONS[dim.dimension],
      rewrittenAsset: relevantElite?.text,
      framework: framework?.name.split(' — ')[0], // Apenas o nome (ex: "Schwartz")
      basedOnEliteAsset: !!relevantElite,
    };
  });
}

/**
 * Encontra o framework mais relevante para uma dimensão.
 */
function findBestFramework(
  dimension: ConversionDimension
): FrameworkInfo | undefined {
  for (const [, framework] of Object.entries(COPYWRITING_FRAMEWORKS)) {
    if (framework.applicableTo.includes(dimension)) {
      return framework;
    }
  }
  return undefined;
}

/**
 * Encontra um Elite Asset relevante para a dimensão.
 */
function findRelevantEliteAsset(
  dimension: ConversionDimension,
  eliteAssets: EliteAsset[]
): EliteAsset | undefined {
  const relevantTypes = DIMENSION_ASSET_MAP[dimension] || [];
  return eliteAssets.find((a) => relevantTypes.includes(a.type));
}

// ═══════════════════════════════════════════════════════
// UTILS
// ═══════════════════════════════════════════════════════

/**
 * Mapeia score para prioridade.
 */
function scoreToPriority(
  score: number
): 'critical' | 'high' | 'medium' {
  if (score < PRIORITY_THRESHOLDS.critical) return 'critical';
  if (score < PRIORITY_THRESHOLDS.high) return 'high';
  return 'medium';
}

/** Issues genéricos por dimensão (fallback) */
const FALLBACK_ISSUES: Record<ConversionDimension, string> = {
  headline_strength:
    'As headlines carecem de especificidade e não comunicam um benefício claro ao visitante.',
  cta_effectiveness:
    'Os CTAs não transmitem urgência nem clareza suficiente sobre a ação desejada.',
  hook_quality:
    'Os hooks não interrompem o padrão do visitante de forma eficaz.',
  offer_structure:
    'A estrutura da oferta não demonstra valor percebido suficiente.',
  funnel_coherence:
    'Há inconsistência narrativa entre as etapas do funil.',
  trust_signals:
    'Sinais de confiança insuficientes (provas sociais, garantias, autoridade).',
};

/** Sugestões genéricas por dimensão (fallback) */
const FALLBACK_SUGGESTIONS: Record<ConversionDimension, string> = {
  headline_strength:
    'Reescreva as headlines focando em benefícios específicos e mensuráveis. Use números, resultados concretos e apele à curiosidade. Framework recomendado: Schwartz (adaptar ao nível de consciência do público).',
  cta_effectiveness:
    'Reformule os CTAs com verbos de ação no imperativo, adicione senso de urgência temporal e reforce o benefício implícito. Ex: "Comece Agora — Grátis por 7 Dias".',
  hook_quality:
    'Crie hooks que interrompam o padrão do visitante nos primeiros 3 segundos. Use perguntas provocativas, dados surpreendentes ou declarações ousadas. Framework: Halbert (AIDA — Attention).',
  offer_structure:
    'Reestruture a oferta com stacking de valor, ancoragem de preço, garantia reversa e bônus complementares. Framework: Brunson (Story → Offer → Close).',
  funnel_coherence:
    'Alinhe a mensagem da headline ao CTA em cada etapa. A promessa feita no topo do funil deve ser cumprida progressivamente até o fechamento.',
  trust_signals:
    'Adicione provas sociais (depoimentos com foto/nome), badges de segurança, garantia explícita e indicadores de autoridade (certificações, mídia, números).',
};
