/**
 * Elite Asset Remixer — Creative Automation
 * Sprint 25 · S25-ST-05
 *
 * Reutiliza headlines/CTAs/hooks de elite (top 20% por relevanceScore)
 * da base para enriquecer a geração de anúncios com técnicas de copywriting.
 *
 * Frameworks aplicados:
 *   - Schwartz: Adaptar por nível de consciência do público
 *   - Halbert AIDA: Attention → Interest → Desire → Action
 *   - Brunson: Story → Offer → Close
 *
 * Cross-Lane: ai_retrieval (readonly — buscar top 20% assets via Pinecone)
 * Graceful degradation: se Pinecone/RAG indisponível, usa assets locais.
 *
 * @contract arch-sprint-25-predictive-creative-engine.md § 5
 */

import { UXIntelligence, UXAsset } from '@/types/intelligence';
import { CopyFramework, ConsciousnessLevel } from '@/types/creative-ads';

// ═══════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════

export interface EliteAsset {
  text: string;
  type: 'headline' | 'cta' | 'hook' | 'visual';
  relevanceScore: number;
  source: 'pinecone' | 'local';
}

export interface RemixResult {
  /** Assets de elite encontrados e disponíveis para uso */
  eliteAssets: EliteAsset[];
  /** Headlines de elite para rastreabilidade */
  headlines: string[];
  /** CTAs de elite para rastreabilidade */
  ctas: string[];
  /** Hooks de elite para rastreabilidade */
  hooks: string[];
  /** Framework recomendado com base nos assets */
  suggestedFrameworks: CopyFramework[];
  /** Explicação de cada framework sugerido */
  frameworkExplanations: Record<CopyFramework, string>;
  /** Se os assets vieram de Pinecone (RAG) ou local */
  sourceType: 'pinecone' | 'local';
  /** Total de elite assets encontrados */
  totalEliteAssets: number;
}

export interface RemixOptions {
  /** Nível de consciência do público (Schwartz) */
  audienceLevel?: ConsciousnessLevel;
  /** Frameworks preferidos (override da seleção automática) */
  preferredFrameworks?: CopyFramework[];
  /** Top N% dos assets a considerar como "elite" (default: 0.2 = 20%) */
  eliteThreshold?: number;
}

// ═══════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════

const DEFAULT_ELITE_THRESHOLD = 0.2; // Top 20%
const MIN_RELEVANCE_SCORE_PINECONE = 0.7;

/** Mapeamento de framework → explicação padrão */
const FRAMEWORK_EXPLANATIONS: Record<CopyFramework, string> = {
  schwartz:
    'Schwartz — Adaptação por nível de consciência: Headlines e CTAs ajustados ao grau de awareness do público-alvo.',
  halbert_aida:
    'Halbert AIDA — Attention → Interest → Desire → Action: Hook captura atenção, body gera interesse e desejo, CTA converte em ação.',
  brunson_story:
    'Brunson Story→Offer→Close — Narrativa persuasiva: Hook conta história, body apresenta oferta irresistível, CTA fecha a venda.',
  cialdini:
    'Cialdini — Princípios de persuasão: Aplicação de reciprocidade, prova social, autoridade, escassez, consistência e afinidade.',
  ogilvy:
    'Ogilvy — Copy longo e headline-driven: Headline poderosa como elemento central, suportada por body text informativo e detalhado.',
};

/** Frameworks recomendados por nível de consciência */
const FRAMEWORKS_BY_AUDIENCE: Record<ConsciousnessLevel, CopyFramework[]> = {
  unaware: ['brunson_story', 'ogilvy'],
  problem_aware: ['halbert_aida', 'brunson_story'],
  solution_aware: ['schwartz', 'halbert_aida'],
  product_aware: ['cialdini', 'schwartz'],
  most_aware: ['cialdini', 'halbert_aida'],
};

// ═══════════════════════════════════════════════════════
// MAIN FUNCTION
// ═══════════════════════════════════════════════════════

/**
 * Busca Elite Assets do mesmo brandId (top 20% por relevanceScore)
 * e prepara o remix com frameworks de copywriting.
 *
 * @param brandId - ID da brand (isolamento multi-tenant)
 * @param assets - UXIntelligence com assets originais
 * @param options - Opções de remix
 * @returns RemixResult com assets de elite e frameworks sugeridos
 */
export async function remixWithEliteAssets(
  brandId: string,
  assets: UXIntelligence,
  options: RemixOptions = {}
): Promise<RemixResult> {
  const eliteThreshold = options.eliteThreshold ?? DEFAULT_ELITE_THRESHOLD;

  // 1. Buscar Elite Assets (Pinecone com fallback local)
  let eliteAssets: EliteAsset[] = [];
  let sourceType: 'pinecone' | 'local' = 'local';

  try {
    eliteAssets = await fetchEliteAssets(brandId, assets, eliteThreshold);
    sourceType =
      eliteAssets.length > 0 && eliteAssets[0].source === 'pinecone'
        ? 'pinecone'
        : 'local';
  } catch (error) {
    console.warn(
      '[AssetRemixer] Falha ao buscar Elite Assets, usando assets locais:',
      error
    );
    eliteAssets = extractLocalEliteAssets(assets, eliteThreshold);
    sourceType = 'local';
  }

  // 2. Classificar assets por tipo para rastreabilidade
  const headlines = eliteAssets
    .filter((a) => a.type === 'headline')
    .map((a) => a.text);
  const ctas = eliteAssets
    .filter((a) => a.type === 'cta')
    .map((a) => a.text);
  const hooks = eliteAssets
    .filter((a) => a.type === 'hook')
    .map((a) => a.text);

  // 3. Selecionar frameworks com base no audienceLevel e assets disponíveis
  const suggestedFrameworks = selectFrameworks(options);

  // 4. Montar explicações por framework
  const frameworkExplanations = { ...FRAMEWORK_EXPLANATIONS };

  return {
    eliteAssets,
    headlines,
    ctas,
    hooks,
    suggestedFrameworks,
    frameworkExplanations,
    sourceType,
    totalEliteAssets: eliteAssets.length,
  };
}

// ═══════════════════════════════════════════════════════
// ELITE ASSET FETCHING
// ═══════════════════════════════════════════════════════

/**
 * Busca Elite Assets (top 20% por relevanceScore) da brand.
 * Tenta Pinecone primeiro, fallback para local.
 */
async function fetchEliteAssets(
  brandId: string,
  uxData: UXIntelligence,
  eliteThreshold: number
): Promise<EliteAsset[]> {
  // Tentar via Pinecone se configurado
  if (isPineconeConfigured()) {
    try {
      const pineconeAssets = await queryPineconeEliteAssets(brandId);
      if (pineconeAssets.length > 0) {
        return pineconeAssets;
      }
    } catch (error) {
      console.warn(
        '[AssetRemixer] Pinecone query falhou, usando fallback local:',
        error
      );
    }
  }

  // Fallback: assets locais
  return extractLocalEliteAssets(uxData, eliteThreshold);
}

/**
 * Verifica se Pinecone está configurado.
 */
function isPineconeConfigured(): boolean {
  return !!(process.env.PINECONE_API_KEY && process.env.PINECONE_INDEX);
}

/**
 * Query Pinecone para Elite Assets de uma brand.
 * Cross-lane: ai_retrieval (readonly).
 */
async function queryPineconeEliteAssets(
  brandId: string
): Promise<EliteAsset[]> {
  const apiKey = (process.env.PINECONE_API_KEY || '').trim();
  const indexHost = process.env.PINECONE_INDEX;

  if (!apiKey || !indexHost) {
    return [];
  }

  try {
    const response = await fetch(`https://${indexHost}/query`, {
      method: 'POST',
      headers: {
        'Api-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        vector: new Array(1536).fill(0),
        topK: 20,
        includeMetadata: true,
        filter: {
          brandId: { $eq: brandId },
          relevanceScore: { $gte: MIN_RELEVANCE_SCORE_PINECONE },
        },
        namespace: brandId,
      }),
    });

    if (!response.ok) {
      console.warn(`[AssetRemixer] Pinecone returned ${response.status}`);
      return [];
    }

    const data = await response.json();

    return (data.matches || [])
      .filter(
        (match: { metadata?: Record<string, unknown> }) => match.metadata
      )
      .map(
        (match: {
          metadata: Record<string, unknown>;
          score?: number;
        }) => ({
          text: (match.metadata.text as string) || '',
          type:
            (match.metadata.type as EliteAsset['type']) || 'headline',
          relevanceScore:
            (match.metadata.relevanceScore as number) ||
            match.score ||
            0.7,
          source: 'pinecone' as const,
        })
      );
  } catch (error) {
    console.warn('[AssetRemixer] Pinecone query error:', error);
    return [];
  }
}

/**
 * Extrai Elite Assets dos UXAssets locais (fallback quando Pinecone indisponível).
 * Seleciona os top N% por relevanceScore de cada tipo.
 */
function extractLocalEliteAssets(
  uxData: UXIntelligence,
  eliteThreshold: number = DEFAULT_ELITE_THRESHOLD
): EliteAsset[] {
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

    // Top N% (mínimo 1)
    const topCount = Math.max(
      1,
      Math.ceil(sorted.length * eliteThreshold)
    );
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
// FRAMEWORK SELECTION
// ═══════════════════════════════════════════════════════

/**
 * Seleciona frameworks de copywriting com base no audienceLevel.
 * Se preferredFrameworks fornecidos, usa esses.
 * Se audienceLevel fornecido, seleciona frameworks adequados.
 * Senão, retorna os 3 mais versáteis.
 */
function selectFrameworks(options: RemixOptions): CopyFramework[] {
  // Se o usuário preferiu frameworks específicos, usar esses
  if (options.preferredFrameworks?.length) {
    return options.preferredFrameworks;
  }

  // Se temos nível de audiência, usar mapeamento
  if (options.audienceLevel) {
    return FRAMEWORKS_BY_AUDIENCE[options.audienceLevel] || [
      'schwartz',
      'halbert_aida',
      'brunson_story',
    ];
  }

  // Default: os 3 mais versáteis
  return ['schwartz', 'halbert_aida', 'brunson_story'];
}
