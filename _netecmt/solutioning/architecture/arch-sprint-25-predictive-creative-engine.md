# 🏗️ Architecture Review: Sprint 25 — Predictive & Creative Engine

**Versão:** 1.0.0  
**Status:** Aprovado  
**Responsável:** Athos (Architect)  
**PRD Referência:** `_netecmt/solutioning/prd/prd-sprint-25-predictive-creative-engine.md`  
**Data:** 06/02/2026  
**Lane Primária:** `intelligence_wing`

---

## 1. Resumo Executivo

Este documento formaliza os **contratos de API**, **interfaces TypeScript**, **estrutura de módulos** e **extensão da lane `intelligence_wing`** para os 3 novos endpoints da Sprint 25:

| # | Endpoint | Módulo | Epic |
|:--|:---------|:-------|:-----|
| 1 | `POST /api/intelligence/predict/score` | Conversion Predictor | Epic 1 |
| 2 | `POST /api/intelligence/creative/generate-ads` | Creative Automation | Epic 2 |
| 3 | `POST /api/intelligence/analyze/text` | Text Analyzer | Epic 3 |

### Decisão Arquitetural Chave
Os 3 novos módulos residem dentro da lane `intelligence_wing` existente, como sub-módulos em `app/src/lib/intelligence/`. **Nenhuma lane nova é necessária** — a extensão é orgânica e compatível com os Guardrails Arquiteturais existentes (Multi-Tenant First, Build-Safe Firebase, Force-Dynamic API).

---

## 2. Arquitetura de Módulos (Novo)

```
app/src/lib/intelligence/
├── predictor/                    # NOVO: Epic 1 — Conversion Predictor
│   ├── scoring-engine.ts         # Motor de scoring (6 dimensões + CPS)
│   ├── benchmark.ts              # Comparativo com base histórica
│   ├── recommendations.ts        # Gerador de sugestões (RAG-powered)
│   └── types.ts                  # Tipos locais do módulo (re-exportados)
│
├── creative-engine/              # NOVO: Epic 2 — Creative Automation
│   ├── ad-generator.ts           # Pipeline de geração multi-formato
│   ├── asset-remixer.ts          # Elite Asset Remixing (top 20%)
│   ├── brand-compliance.ts       # Gate de Brand Voice (threshold 0.75)
│   └── types.ts                  # Tipos locais do módulo
│
├── text-analyzer/                # NOVO: Epic 3 — Multi-Input Intelligence
│   ├── text-parser.ts            # Parser genérico (texto colado)
│   ├── vsl-parser.ts             # Parser especializado para VSL
│   ├── ad-copy-analyzer.ts       # Análise de ad copy existente
│   ├── sanitizer.ts              # Input sanitization (RT-03)
│   └── types.ts                  # Tipos locais do módulo
│
├── creative/                     # EXISTENTE (Sprint 26 — Creative Scoring)
│   ├── scoring.ts
│   ├── fatigue.ts
│   └── copy-gen.ts
│
├── autopsy/                      # EXISTENTE
├── keywords/                     # EXISTENTE
├── ltv/                          # EXISTENTE
└── ...                           # Outros módulos existentes
```

### Novas Rotas de API

```
app/src/app/api/intelligence/
├── predict/
│   └── score/
│       └── route.ts              # NOVO: POST /api/intelligence/predict/score
│
├── creative/
│   ├── copy/route.ts             # EXISTENTE (Sprint 26)
│   ├── ranking/route.ts          # EXISTENTE (Sprint 26)
│   └── generate-ads/
│       └── route.ts              # NOVO: POST /api/intelligence/creative/generate-ads
│
├── analyze/
│   └── text/
│       └── route.ts              # NOVO: POST /api/intelligence/analyze/text
│
├── autopsy/                      # EXISTENTE
├── keywords/                     # EXISTENTE
└── ...
```

---

## 3. Contrato de API — Endpoint 1: Conversion Predictor

### `POST /api/intelligence/predict/score`

**Propósito:** Calcular o Conversion Probability Score (CPS) de um funil baseado em 6 dimensões de análise, retornando breakdown, benchmark comparativo e recomendações de melhoria.

**Stories:** S25-ST-01 (Scoring Engine), S25-ST-02 (Benchmark), S25-ST-03 (Recommendations)

#### Request

```typescript
interface PredictScoreRequest {
  brandId: string;                        // OBRIGATÓRIO — Multi-tenant isolation
  funnelUrl?: string;                     // URL do funil (se disponível)
  funnelData?: UXIntelligence;            // Dados já extraídos (se disponível)
  options?: {
    includeRecommendations?: boolean;     // Default: true
    includeBenchmark?: boolean;           // Default: true
    nicheWeights?: Partial<DimensionWeights>; // Override de pesos por nicho
  };
}

/** Pesos configuráveis por dimensão (somam 1.0) */
interface DimensionWeights {
  headlineStrength: number;       // Default: 0.20
  ctaEffectiveness: number;       // Default: 0.20
  hookQuality: number;            // Default: 0.15
  offerStructure: number;         // Default: 0.20
  funnelCoherence: number;        // Default: 0.15
  trustSignals: number;           // Default: 0.10
}
```

#### Response (200 OK)

```typescript
interface PredictScoreResponse {
  success: true;
  brandId: string;
  
  /** Score final composto (0-100) */
  score: number;
  
  /** Classificação qualitativa */
  grade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F';
  
  /** Breakdown por dimensão */
  breakdown: DimensionScore[];
  
  /** Recomendações de melhoria (se solicitado) */
  recommendations: Recommendation[];
  
  /** Benchmark comparativo (se solicitado) */
  benchmark: BenchmarkComparison;
  
  /** Metadata de processamento */
  metadata: {
    processedAt: string;           // ISO 8601
    modelUsed: string;             // Ex: 'gemini-2.0-flash'
    tokensUsed: number;
    processingTimeMs: number;
    weightsApplied: DimensionWeights;
  };
}

interface DimensionScore {
  dimension: ConversionDimension;
  score: number;                   // 0-100
  label: string;                   // Ex: "Headline Strength"
  explanation: string;             // Justificativa textual
  evidence: string[];              // Elementos encontrados que justificam o score
  suggestions?: string[];          // Sugestões de melhoria (score < 60)
}

type ConversionDimension = 
  | 'headline_strength'
  | 'cta_effectiveness' 
  | 'hook_quality'
  | 'offer_structure'
  | 'funnel_coherence'
  | 'trust_signals';

interface Recommendation {
  dimension: ConversionDimension;
  priority: 'critical' | 'high' | 'medium' | 'low';
  currentScore: number;
  issue: string;                   // O problema detectado
  suggestion: string;              // Sugestão concreta
  rewrittenAsset?: string;         // Asset reescrito (quando aplicável)
  framework?: string;              // Schwartz, Brunson, Halbert, etc.
  basedOnEliteAsset?: boolean;     // Se foi inspirado em Elite Asset da base
}

interface BenchmarkComparison {
  totalFunnelsInBase: number;
  averageCPS: number;
  percentileRank: number;          // Ex: 85 = "Top 15%"
  topPerformersCPS: number;        // Média do top 10%
  nicheAverage?: number;           // Média do nicho (se identificável)
  comparisonLabel: string;         // Ex: "Acima da média (Top 15%)"
}
```

#### Erros

| Status | Code | Quando |
|:-------|:-----|:-------|
| 400 | `VALIDATION_ERROR` | `brandId` ausente, ou `funnelUrl` e `funnelData` ambos vazios |
| 400 | `INVALID_WEIGHTS` | Soma de `nicheWeights` ≠ 1.0 |
| 404 | `BRAND_NOT_FOUND` | `brandId` inexistente |
| 429 | `RATE_LIMITED` | > 20 requests/minuto por brandId |
| 500 | `SCORING_ERROR` | Falha no Gemini ou processamento interno |

#### Guardrails

- `export const dynamic = 'force-dynamic';` no topo
- `requireBrandAccess(req, brandId)` antes de qualquer operação
- Token budget: **4.000 tokens** por scoring (via `cost-guard.ts`)
- Se `funnelUrl` fornecida sem `funnelData`, buscar UXIntelligence existente no Firestore (não scrape novamente)
- Cache de benchmark: refresh a cada 24h por brandId (Firestore doc)

---

## 4. Contrato de API — Endpoint 2: Creative Automation

### `POST /api/intelligence/creative/generate-ads`

**Propósito:** Gerar 3-5 variações de anúncio multi-formato a partir de Elite Assets, com Brand Voice Compliance obrigatório e CPS estimado por variação.

**Stories:** S25-ST-04 (Ad Pipeline), S25-ST-05 (Elite Remixing), S25-ST-06 (Brand Compliance)

#### Request

```typescript
interface GenerateAdsRequest {
  brandId: string;                        // OBRIGATÓRIO
  sourceUrl?: string;                     // URL fonte (para rastreabilidade)
  eliteAssets: UXIntelligence;            // Assets extraídos
  formats: AdFormat[];                    // Formatos desejados
  audienceLevel?: ConsciousnessLevel;     // Nível Schwartz do público
  options?: {
    maxVariations?: number;               // Default: 3, Max: 5
    minToneMatch?: number;                // Default: 0.75
    preferredFrameworks?: CopyFramework[];
    includeImageSuggestions?: boolean;     // Default: true
  };
}

type AdFormat = 'meta_feed' | 'meta_stories' | 'google_search';

type ConsciousnessLevel = 
  | 'unaware'           // Nível 1: Não sabe que tem o problema
  | 'problem_aware'     // Nível 2: Sabe do problema, não da solução
  | 'solution_aware'    // Nível 3: Sabe da solução, não do produto
  | 'product_aware'     // Nível 4: Sabe do produto, não convencido
  | 'most_aware';       // Nível 5: Pronto para comprar

type CopyFramework = 'schwartz' | 'halbert_aida' | 'brunson_story' | 'cialdini' | 'ogilvy';
```

#### Response (200 OK)

```typescript
interface GenerateAdsResponse {
  success: true;
  brandId: string;
  
  /** Anúncios gerados */
  ads: GeneratedAd[];
  
  /** Metadata agregada */
  metadata: {
    totalGenerated: number;
    totalRejected: number;           // Rejeitados pelo Brand Voice gate
    avgCPS: number;                  // Média do CPS estimado
    eliteAssetsUsed: number;         // Quantos Elite Assets foram reutilizados
    tokensUsed: number;
    processingTimeMs: number;
    frameworksApplied: CopyFramework[];
  };
}

interface GeneratedAd {
  id: string;                        // UUID para rastreabilidade
  format: AdFormat;
  
  /** Conteúdo do anúncio (varia por formato) */
  content: MetaFeedAd | MetaStoriesAd | GoogleSearchAd;
  
  /** CPS estimado para esta variação */
  estimatedCPS: number;              // 0-100
  
  /** Compliance de Brand Voice */
  brandVoice: {
    toneMatch: number;               // 0.0-1.0
    passed: boolean;                 // toneMatch >= threshold
    adjustments?: string[];          // Ajustes feitos para compliance
  };
  
  /** Rastreabilidade */
  sourceAssets: {
    headlines: string[];             // Headlines de elite usados como base
    ctas: string[];                  // CTAs de elite usados como base
    hooks: string[];                 // Hooks de elite usados como base
  };
  
  /** Técnica de copywriting aplicada */
  framework: CopyFramework;
  frameworkExplanation: string;      // Ex: "AIDA: Atenção via hook → Interesse..."
}

interface MetaFeedAd {
  type: 'meta_feed';
  headline: string;                  // Max 40 chars
  body: string;                      // Max 125 chars (primary text)
  description?: string;              // Max 30 chars
  cta: string;                       // Ex: "Saiba Mais", "Comprar Agora"
  imageSuggestion?: string;          // Descrição da imagem sugerida
}

interface MetaStoriesAd {
  type: 'meta_stories';
  hook: string;                      // Texto do hook (3s)
  body: string;                      // Texto do body (5s)
  ctaOverlay: string;                // CTA de overlay
  visualDirection?: string;          // Direção visual sugerida
}

interface GoogleSearchAd {
  type: 'google_search';
  headlines: [string, string, string]; // Exatamente 3, max 30 chars cada
  descriptions: [string, string];      // Exatamente 2, max 90 chars cada
  path?: [string, string?];            // Display path segments
}
```

#### Erros

| Status | Code | Quando |
|:-------|:-----|:-------|
| 400 | `VALIDATION_ERROR` | Campos obrigatórios ausentes |
| 400 | `INVALID_FORMAT` | `formats` contém valor não reconhecido |
| 400 | `EMPTY_ASSETS` | `eliteAssets` sem headlines, CTAs nem hooks |
| 404 | `BRAND_NOT_FOUND` | `brandId` inexistente |
| 429 | `RATE_LIMITED` | > 10 gerações/minuto por brandId (RT-02) |
| 500 | `GENERATION_ERROR` | Falha no Gemini ou Brand Voice |

#### Guardrails

- `export const dynamic = 'force-dynamic';` no topo
- `requireBrandAccess(req, brandId)` obrigatório
- Token budget: **8.000 tokens** por geração (RT-02, via `cost-guard.ts`)
- Max 5 variações por request (hardcoded, não bypassável)
- Brand Voice gate: `toneMatch < minToneMatch` → rejeita e tenta regenerar (max 2 retries)
- Multi-tenant: Elite Assets filtrados por `brandId` — NUNCA cross-brand
- Rate limit: 10 gerações/minuto por `brandId` (RT-02)

---

## 5. Contrato de API — Endpoint 3: Text Analyzer

### `POST /api/intelligence/analyze/text`

**Propósito:** Analisar texto bruto (transcrição de VSL, ad copy, landing page colada) extraindo UXIntelligence + CPS, expandindo o pipeline para além de URLs.

**Stories:** S25-ST-07 (Text Analyzer), S25-ST-08 (VSL Parser), S25-ST-09 (Ad Copy Analyzer)

#### Request

```typescript
interface AnalyzeTextRequest {
  brandId: string;                        // OBRIGATÓRIO
  text: string;                           // Texto para análise (max 50.000 chars)
  textType: TextInputType;                // Tipo do input
  format?: TextInputFormat;               // Formato de arquivo (se aplicável)
  options?: {
    includeScoring?: boolean;             // Default: true (roda Conversion Predictor)
    includeSuggestions?: boolean;          // Default: true
    detectLanguage?: boolean;             // Default: true
    persistResult?: boolean;              // Default: true (salvar no Firestore)
  };
}

type TextInputType = 
  | 'vsl_transcript'     // Transcrição de VSL
  | 'ad_copy'            // Texto de anúncio existente
  | 'landing_page'       // Texto de landing page colado
  | 'general';           // Texto genérico

type TextInputFormat = 'txt' | 'srt' | 'vtt';
```

#### Response (200 OK)

```typescript
interface AnalyzeTextResponse {
  success: true;
  brandId: string;
  
  /** UXIntelligence extraído do texto */
  uxIntelligence: UXIntelligence;
  
  /** Scoring de conversão (se solicitado) */
  scoring?: PredictScoreResponse;
  
  /** Sugestões de melhoria (se solicitado) */
  suggestions: TextSuggestion[];
  
  /** Análise estrutural (varia por textType) */
  structuralAnalysis: StructuralAnalysis;
  
  /** Metadata */
  metadata: {
    textType: TextInputType;
    inputLength: number;              // Caracteres processados
    detectedLanguage?: string;        // ISO 639-1
    tokensUsed: number;
    processingTimeMs: number;
    persistedDocId?: string;          // ID do doc no Firestore (se persistido)
  };
}

interface TextSuggestion {
  area: 'headline' | 'cta' | 'hook' | 'body' | 'offer' | 'structure';
  severity: 'critical' | 'improvement' | 'optional';
  issue: string;
  suggestion: string;
  rewritten?: string;                 // Trecho reescrito
  eliteReference?: string;            // Elite Asset usado como referência
}

/** Análise estrutural — shape varia por textType */
interface StructuralAnalysis {
  /** Comum a todos os tipos */
  wordCount: number;
  readabilityScore: number;           // 0-100 (Flesch adaptado)
  
  /** VSL Transcript específico */
  vslStructure?: {
    hookSegment: string;              // Primeiros ~30s
    problemSetup?: string;            // Identificação do problema
    solutionPresentation?: string;    // Apresentação da solução
    offerDetails?: string;            // Detalhes da oferta
    closeSegment?: string;            // Fechamento/CTA final
    narrativeArc: 'story_offer_close' | 'problem_solution' | 'aida' | 'custom';
    estimatedDuration?: string;       // Ex: "12:30" (mm:ss, baseado em word count)
  };
  
  /** Ad Copy específico */
  adCopyAnalysis?: {
    format: 'short_form' | 'long_form' | 'video_script';
    hasHook: boolean;
    hasCTA: boolean;
    hasOffer: boolean;
    hasUrgency: boolean;
    hasSocialProof: boolean;
    missingElements: string[];
  };
}
```

#### Erros

| Status | Code | Quando |
|:-------|:-----|:-------|
| 400 | `VALIDATION_ERROR` | Campos obrigatórios ausentes |
| 400 | `TEXT_TOO_LONG` | `text.length > 50000` (RT-03) |
| 400 | `TEXT_TOO_SHORT` | `text.length < 50` (mínimo para análise útil) |
| 400 | `INVALID_TEXT_TYPE` | `textType` não reconhecido |
| 400 | `SUSPICIOUS_INPUT` | Texto parece código ou dados sensíveis (RT-03) |
| 404 | `BRAND_NOT_FOUND` | `brandId` inexistente |
| 429 | `RATE_LIMITED` | > 15 análises/minuto por brandId |
| 500 | `ANALYSIS_ERROR` | Falha no parsing ou Gemini |

#### Guardrails

- `export const dynamic = 'force-dynamic';` no topo
- `requireBrandAccess(req, brandId)` obrigatório
- **Sanitização obrigatória** (RT-03): Strip HTML/scripts, rejeitar inputs com `<script>`, `eval(`, `import `, etc.
- Limite: 50.000 caracteres por input
- Detecção de idioma automática (pt/en/es) via heurística + Gemini
- Token budget: **6.000 tokens** por análise (via `cost-guard.ts`)
- Se `persistResult: true`, salvar `UXIntelligence` no Firestore como `IntelligenceDocument` com `source.fetchedVia: 'text_input'`

---

## 6. Novas Interfaces TypeScript

### 6.1 Arquivo: `app/src/types/prediction.ts` (NOVO)

```typescript
/**
 * @fileoverview Tipos para o módulo Conversion Predictor
 * @module types/prediction
 * @version 1.0.0 — Sprint 25
 */

export type ConversionDimension = 
  | 'headline_strength'
  | 'cta_effectiveness' 
  | 'hook_quality'
  | 'offer_structure'
  | 'funnel_coherence'
  | 'trust_signals';

export type ConversionGrade = 'S' | 'A' | 'B' | 'C' | 'D' | 'F';

export interface DimensionWeights {
  headlineStrength: number;
  ctaEffectiveness: number;
  hookQuality: number;
  offerStructure: number;
  funnelCoherence: number;
  trustSignals: number;
}

export interface DimensionScore {
  dimension: ConversionDimension;
  score: number;
  label: string;
  explanation: string;
  evidence: string[];
  suggestions?: string[];
}

export interface BenchmarkComparison {
  totalFunnelsInBase: number;
  averageCPS: number;
  percentileRank: number;
  topPerformersCPS: number;
  nicheAverage?: number;
  comparisonLabel: string;
}

export interface Recommendation {
  dimension: ConversionDimension;
  priority: 'critical' | 'high' | 'medium' | 'low';
  currentScore: number;
  issue: string;
  suggestion: string;
  rewrittenAsset?: string;
  framework?: string;
  basedOnEliteAsset?: boolean;
}

/** Configuração de grading (thresholds) */
export const CPS_GRADE_THRESHOLDS: Record<ConversionGrade, [number, number]> = {
  S: [90, 100],
  A: [75, 89],
  B: [60, 74],
  C: [45, 59],
  D: [30, 44],
  F: [0, 29],
};

/** Pesos default para dimensões */
export const DEFAULT_DIMENSION_WEIGHTS: DimensionWeights = {
  headlineStrength: 0.20,
  ctaEffectiveness: 0.20,
  hookQuality: 0.15,
  offerStructure: 0.20,
  funnelCoherence: 0.15,
  trustSignals: 0.10,
};
```

### 6.2 Arquivo: `app/src/types/creative-ads.ts` (NOVO)

```typescript
/**
 * @fileoverview Tipos para o módulo Creative Automation Engine
 * @module types/creative-ads
 * @version 1.0.0 — Sprint 25
 */

export type AdFormat = 'meta_feed' | 'meta_stories' | 'google_search';

export type ConsciousnessLevel = 
  | 'unaware'
  | 'problem_aware'
  | 'solution_aware'
  | 'product_aware'
  | 'most_aware';

export type CopyFramework = 'schwartz' | 'halbert_aida' | 'brunson_story' | 'cialdini' | 'ogilvy';

export interface MetaFeedAd {
  type: 'meta_feed';
  headline: string;
  body: string;
  description?: string;
  cta: string;
  imageSuggestion?: string;
}

export interface MetaStoriesAd {
  type: 'meta_stories';
  hook: string;
  body: string;
  ctaOverlay: string;
  visualDirection?: string;
}

export interface GoogleSearchAd {
  type: 'google_search';
  headlines: [string, string, string];
  descriptions: [string, string];
  path?: [string, string?];
}

export type AdContent = MetaFeedAd | MetaStoriesAd | GoogleSearchAd;

export interface GeneratedAd {
  id: string;
  format: AdFormat;
  content: AdContent;
  estimatedCPS: number;
  brandVoice: {
    toneMatch: number;
    passed: boolean;
    adjustments?: string[];
  };
  sourceAssets: {
    headlines: string[];
    ctas: string[];
    hooks: string[];
  };
  framework: CopyFramework;
  frameworkExplanation: string;
}

/** Limites de caracteres por formato */
export const AD_CHAR_LIMITS = {
  meta_feed: { headline: 40, body: 125, description: 30 },
  meta_stories: { hook: 50, body: 80, ctaOverlay: 25 },
  google_search: { headline: 30, description: 90 },
} as const;
```

### 6.3 Arquivo: `app/src/types/text-analysis.ts` (NOVO)

```typescript
/**
 * @fileoverview Tipos para o módulo Multi-Input Text Analyzer
 * @module types/text-analysis
 * @version 1.0.0 — Sprint 25
 */

export type TextInputType = 'vsl_transcript' | 'ad_copy' | 'landing_page' | 'general';
export type TextInputFormat = 'txt' | 'srt' | 'vtt';

export interface TextSuggestion {
  area: 'headline' | 'cta' | 'hook' | 'body' | 'offer' | 'structure';
  severity: 'critical' | 'improvement' | 'optional';
  issue: string;
  suggestion: string;
  rewritten?: string;
  eliteReference?: string;
}

export interface VSLStructure {
  hookSegment: string;
  problemSetup?: string;
  solutionPresentation?: string;
  offerDetails?: string;
  closeSegment?: string;
  narrativeArc: 'story_offer_close' | 'problem_solution' | 'aida' | 'custom';
  estimatedDuration?: string;
}

export interface AdCopyAnalysis {
  format: 'short_form' | 'long_form' | 'video_script';
  hasHook: boolean;
  hasCTA: boolean;
  hasOffer: boolean;
  hasUrgency: boolean;
  hasSocialProof: boolean;
  missingElements: string[];
}

export interface StructuralAnalysis {
  wordCount: number;
  readabilityScore: number;
  vslStructure?: VSLStructure;
  adCopyAnalysis?: AdCopyAnalysis;
}

/** Regras de sanitização (RT-03) */
export const TEXT_SANITIZATION_RULES = {
  maxLength: 50_000,
  minLength: 50,
  blockedPatterns: [
    /<script[\s>]/i,
    /eval\s*\(/i,
    /import\s+/i,
    /require\s*\(/i,
    /process\.env/i,
    /SELECT\s+.*\s+FROM/i,
    /DROP\s+TABLE/i,
  ],
  stripHtmlTags: true,
  supportedLanguages: ['pt', 'en', 'es'] as const,
} as const;
```

---

## 7. Extensão da Lane `intelligence_wing`

### 7.1 Novos Paths a Registrar no `contract-map.yaml`

```yaml
intelligence_wing:
  paths:
    # === EXISTENTES ===
    - "app/src/lib/intelligence/**"
    - "app/src/lib/firebase/intelligence.ts"
    - "app/src/lib/intelligence/competitors/**"
    - "app/src/app/api/intelligence/spy/**"
    - "app/src/types/intelligence.ts"
    - "app/src/types/intelligence-agents.ts"
    - "app/src/types/competitors.ts"
    - "app/src/lib/agents/scout/**"
    - "app/src/lib/agents/analyst/**"
    - "app/src/lib/agents/spy/**"
    - "app/src/components/intelligence/**"
    - "app/src/app/intelligence/**"
    - "app/src/app/api/intelligence/**"
    - "app/src/lib/hooks/use-intelligence*.ts"
    
    # === NOVOS: Sprint 25 — Predictive & Creative Engine ===
    - "app/src/types/prediction.ts"
    - "app/src/types/creative-ads.ts"
    - "app/src/types/text-analysis.ts"
```

> **Nota:** Os módulos `predictor/`, `creative-engine/` e `text-analyzer/` já estão cobertos pelo glob `app/src/lib/intelligence/**`. As rotas de API já estão cobertas por `app/src/app/api/intelligence/**`. Apenas os 3 novos arquivos de tipos precisam ser registrados explicitamente.

### 7.2 Dependências Cross-Lane (Controladas)

| Lane Dependente | O que usa | Direção | Justificativa |
|:----------------|:----------|:--------|:--------------|
| `ai_retrieval` | RAG para buscar Elite Assets | Intelligence → AI | Recommendations Engine (ST-03) e Elite Remixing (ST-05) precisam buscar assets de elite via Pinecone |
| `brand_voice` | `BrandVoiceTranslator` + `brand-validation.ts` | Intelligence → Brand | Brand Compliance Gate (ST-06) valida ads gerados |
| `scraping_engine` | `url-scraper.ts` (readonly) | Intelligence → Scraping | Apenas se `funnelUrl` for fornecida sem `funnelData` (fallback) |

**Regra:** Dependências cross-lane são sempre **readonly** e via interfaces públicas. Nenhum módulo da Sprint 25 pode importar internals de outra lane.

---

## 8. Firestore — Novos Documentos

### 8.1 Collection: `brands/{brandId}/predictions`

```typescript
interface PredictionDocument {
  id: string;                       // Auto-generated
  brandId: string;
  funnelUrl?: string;
  score: number;                    // CPS final
  grade: ConversionGrade;
  breakdown: DimensionScore[];
  recommendations: Recommendation[];
  benchmark: BenchmarkComparison;
  inputType: 'url' | 'ux_intelligence' | 'text';
  createdAt: Timestamp;
  expiresAt: Timestamp;             // 90 dias
}
```

### 8.2 Collection: `brands/{brandId}/generated_ads`

```typescript
interface GeneratedAdDocument {
  id: string;                       // UUID da geração
  brandId: string;
  sourceUrl?: string;
  ads: GeneratedAd[];               // Array de ads gerados
  metadata: {
    totalGenerated: number;
    avgCPS: number;
    frameworksApplied: CopyFramework[];
  };
  createdAt: Timestamp;
  expiresAt: Timestamp;             // 30 dias
}
```

---

## 9. Rate Limiting & Cost Guardrails

| Endpoint | Rate Limit | Token Budget | Retry Policy |
|:---------|:-----------|:-------------|:-------------|
| `predict/score` | 20 req/min per brandId | 4.000 tokens | 1 retry on Gemini timeout |
| `creative/generate-ads` | 10 req/min per brandId | 8.000 tokens | 2 retries on Brand Voice rejection |
| `analyze/text` | 15 req/min per brandId | 6.000 tokens | 1 retry on parse failure |

**Implementação:** Via `cost-guard.ts` existente (feature tag: `predict_score`, `generate_ads`, `analyze_text`).

---

## 10. Checklist de Validação (Implementation Readiness)

### Pre-flight (antes do Dev)
- [x] PRD Sprint 25 formalizado e aprovado
- [x] Contratos de API para os 3 endpoints definidos
- [x] Interfaces TypeScript especificadas
- [x] Lane `intelligence_wing` validada e estendida
- [x] Dependências cross-lane documentadas
- [x] Rate limits e token budgets definidos
- [x] Firestore collections especificadas
- [ ] Story Pack preparado por Leticia (`_netecmt/packs/stories/sprint-25-predictive-creative/`)
- [ ] Mockups do Painel de Predição (Beto/Victor)

### Invariantes de Build (Architect's Shield)
- [ ] Todas as rotas com `export const dynamic = 'force-dynamic';`
- [ ] Todas as rotas com `requireBrandAccess()` antes de operação
- [ ] Zero imports de `firebase-admin`
- [ ] `cost-guard.ts` integrado em todas as chamadas Gemini
- [ ] Sanitização de texto em `analyze/text` (RT-03)
- [ ] Build limpo na Vercel (zero erros de importação)

---

## 11. Referências

| Documento | Path |
|:----------|:-----|
| PRD Sprint 25 | `_netecmt/solutioning/prd/prd-sprint-25-predictive-creative-engine.md` |
| Contrato Intelligence Storage | `_netecmt/contracts/intelligence-storage.md` |
| Contrato Retrieval (RAG) | `_netecmt/contracts/retrieval-contracts.md` |
| Contrato Brand Voice | `_netecmt/contracts/brand-voice-spec.md` |
| Lane Map | `_netecmt/core/contract-map.yaml` |
| Cost Guard | `app/src/lib/ai/cost-guard.ts` |

---

*Architecture Review por Athos (Architect) — NETECMT v2.0*  
*Sprint 25: Predictive & Creative Engine | 06/02/2026*  
*"Contratos primeiro, código depois."*
