# Stories Distilled: Sprint 25 — Predictive & Creative Engine
**Preparado por:** Leticia (SM)
**Data:** 06/02/2026
**Lane:** `intelligence_wing`

---

## Epic 1: Conversion Predictor

### S25-ST-01: Scoring Engine — 6 Dimensões + CPS [P0, M]

**Objetivo:** Implementar o motor de scoring preditivo que calcula o Conversion Probability Score (CPS) de um funil baseado em 6 dimensões de análise.

**Endpoint:** `POST /api/intelligence/predict/score`
**Módulo:** `app/src/lib/intelligence/predictor/scoring-engine.ts`
**Tipos:** `app/src/types/prediction.ts`

#### Distilled Requirements
1. Criar o módulo `scoring-engine.ts` em `app/src/lib/intelligence/predictor/`
2. Implementar cálculo de CPS (0-100) com 6 dimensões:
   - `headline_strength` (peso: 0.20)
   - `cta_effectiveness` (peso: 0.20)
   - `hook_quality` (peso: 0.15)
   - `offer_structure` (peso: 0.20)
   - `funnel_coherence` (peso: 0.15)
   - `trust_signals` (peso: 0.10)
3. Cada dimensão retorna: `score`, `label`, `explanation`, `evidence[]`, `suggestions[]`
4. Score final = média ponderada (pesos configuráveis via `DimensionWeights`)
5. Grading qualitativo: S (90-100), A (75-89), B (60-74), C (45-59), D (30-44), F (0-29)
6. Criar rota `app/src/app/api/intelligence/predict/score/route.ts`
7. Persistir resultado em Firestore `brands/{brandId}/predictions`

#### Acceptance Criteria
- [ ] Endpoint retorna 200 com `PredictScoreResponse` válido para input `UXIntelligence`
- [ ] Cada dimensão retorna score 0-100 com explicação textual
- [ ] Score final é média ponderada correta (validar com `validateWeights()`)
- [ ] Grading qualitativo correto (S/A/B/C/D/F)
- [ ] `export const dynamic = 'force-dynamic'` presente na rota
- [ ] `requireBrandAccess(req, brandId)` antes de qualquer operação
- [ ] Token budget ≤ 4.000 tokens (via `cost-guard.ts`)
- [ ] Resultado persistido no Firestore com `expiresAt` de 90 dias
- [ ] Erro 400 se `brandId` ausente ou `funnelUrl` e `funnelData` ambos vazios
- [ ] Rate limit: 20 req/min por brandId

#### Technical Snippet
```typescript
// app/src/lib/intelligence/predictor/scoring-engine.ts
import { DimensionScore, ConversionDimension, DimensionWeights, DEFAULT_DIMENSION_WEIGHTS, cpsToGrade } from '@/types/prediction';
import { UXIntelligence } from '@/types/intelligence';
import { callGeminiWithGuard } from '@/lib/ai/cost-guard';

export async function calculateCPS(
  brandId: string,
  data: UXIntelligence,
  weights: DimensionWeights = DEFAULT_DIMENSION_WEIGHTS
): Promise<{ score: number; grade: ConversionGrade; breakdown: DimensionScore[] }> {
  // 1. Montar prompt com dados de UXIntelligence
  // 2. Chamar Gemini com cost-guard (tag: 'predict_score', budget: 4000)
  // 3. Parsear resposta em DimensionScore[]
  // 4. Calcular média ponderada
  // 5. Converter para grade
}
```

---

### S25-ST-02: Benchmark Comparativo [P1, S]

**Objetivo:** Comparar o CPS de um funil com a base histórica, fornecendo ranking relativo e contexto competitivo.

**Módulo:** `app/src/lib/intelligence/predictor/benchmark.ts`
**Depende de:** S25-ST-01

#### Distilled Requirements
1. Criar `benchmark.ts` em `app/src/lib/intelligence/predictor/`
2. Consultar Firestore `brands/{brandId}/predictions` para calcular:
   - Total de funis na base
   - CPS médio geral
   - Percentil do funil analisado (Ex: "Top 15%")
   - CPS médio do top 10%
   - CPS médio do nicho (se identificável)
3. Cache de benchmarks: refresh a cada 24h por brandId (Firestore doc)
4. Retornar `BenchmarkComparison` com `comparisonLabel` descritivo

#### Acceptance Criteria
- [ ] `BenchmarkComparison` populado corretamente no response de `predict/score`
- [ ] `percentileRank` calculado corretamente em relação à base
- [ ] `comparisonLabel` em português, descritivo (Ex: "Acima da média — Top 15%")
- [ ] Cache de 24h funcional — não recalcular a cada request
- [ ] Funciona gracefully se base tiver 0 funis (retornar defaults)

#### Technical Snippet
```typescript
// app/src/lib/intelligence/predictor/benchmark.ts
import { BenchmarkComparison } from '@/types/prediction';

export async function calculateBenchmark(
  brandId: string,
  currentCPS: number
): Promise<BenchmarkComparison> {
  // 1. Verificar cache (Firestore doc: brands/{brandId}/predictions/_benchmark)
  // 2. Se cache válido (< 24h), usar
  // 3. Senão, query all predictions, calcular stats, salvar cache
  // 4. Retornar BenchmarkComparison
}
```

---

### S25-ST-03: Recommendations Engine [P1, M]

**Objetivo:** Para cada dimensão com score < 60, gerar sugestões concretas de melhoria baseadas nos Elite Assets da base (RAG-powered).

**Módulo:** `app/src/lib/intelligence/predictor/recommendations.ts`
**Depende de:** S25-ST-01
**Cross-Lane:** `ai_retrieval` (readonly — buscar Elite Assets via RAG)

#### Distilled Requirements
1. Criar `recommendations.ts` em `app/src/lib/intelligence/predictor/`
2. Para cada `DimensionScore` com score < 60:
   - Buscar Elite Assets relevantes via Pinecone/RAG (cross-lane: `ai_retrieval`)
   - Gerar sugestão concreta com asset reescrito
   - Classificar prioridade: `critical` (<30), `high` (<45), `medium` (<60)
   - Contextualizar com frameworks dos Conselheiros (Schwartz, Brunson, Halbert)
3. Retornar array de `Recommendation[]`
4. Indicar se sugestão foi inspirada em Elite Asset (`basedOnEliteAsset: true`)

#### Acceptance Criteria
- [ ] Recomendações geradas para TODAS as dimensões com score < 60
- [ ] Prioridade calculada corretamente (critical/high/medium)
- [ ] `rewrittenAsset` presente quando aplicável
- [ ] `framework` preenchido quando aplicável
- [ ] Elite Assets buscados respeitam isolamento multi-tenant (brandId)
- [ ] Graceful degradation se Pinecone/RAG indisponível (retornar sugestões genéricas)

---

## Epic 2: Creative Automation

### S25-ST-04: Ad Generation Pipeline [P0, L]

**Objetivo:** Gerar 3-5 variações de anúncio multi-formato a partir de Elite Assets, com CPS estimado por variação.

**Endpoint:** `POST /api/intelligence/creative/generate-ads`
**Módulo:** `app/src/lib/intelligence/creative-engine/ad-generator.ts`
**Tipos:** `app/src/types/creative-ads.ts`
**Depende de:** S25-ST-01 (para CPS estimado)

#### Distilled Requirements
1. Criar `ad-generator.ts` em `app/src/lib/intelligence/creative-engine/`
2. Input: `UXIntelligence` (Headlines, CTAs, Hooks) + Brand Voice + formatos desejados
3. Output: 3-5 variações por formato solicitado:
   - **Meta Feed**: headline (40ch) + body (125ch) + description (30ch) + CTA + imageSuggestion
   - **Meta Stories**: hook (3s) + body (5s) + ctaOverlay + visualDirection
   - **Google Search**: 3 headlines (30ch cada) + 2 descriptions (90ch cada)
4. Cada variação inclui `estimatedCPS` (chamando scoring engine)
5. Validar limites de caracteres usando `AD_CHAR_LIMITS`
6. Criar rota `app/src/app/api/intelligence/creative/generate-ads/route.ts`
7. Persistir resultado em Firestore `brands/{brandId}/generated_ads`

#### Acceptance Criteria
- [ ] Endpoint retorna 200 com `GenerateAdsResponse` válido
- [ ] Mínimo 3 variações geradas por formato solicitado
- [ ] Máximo 5 variações por request (hardcoded, não bypassável)
- [ ] Limites de caracteres respeitados por formato (`AD_CHAR_LIMITS`)
- [ ] `estimatedCPS` presente em cada variação (0-100)
- [ ] `export const dynamic = 'force-dynamic'` presente
- [ ] `requireBrandAccess(req, brandId)` antes de qualquer operação
- [ ] Token budget ≤ 8.000 tokens (via `cost-guard.ts`, tag: `generate_ads`)
- [ ] Rate limit: 10 req/min por brandId
- [ ] Erro 400 se `eliteAssets` sem headlines, CTAs nem hooks
- [ ] Resultado persistido no Firestore com `expiresAt` de 30 dias

#### Technical Snippet
```typescript
// app/src/lib/intelligence/creative-engine/ad-generator.ts
import { GeneratedAd, AdFormat, AdContent, AD_CHAR_LIMITS, GENERATION_LIMITS } from '@/types/creative-ads';
import { UXIntelligence } from '@/types/intelligence';
import { callGeminiWithGuard } from '@/lib/ai/cost-guard';

export async function generateAds(
  brandId: string,
  assets: UXIntelligence,
  formats: AdFormat[],
  options?: { maxVariations?: number; audienceLevel?: ConsciousnessLevel }
): Promise<GeneratedAd[]> {
  const maxVariations = Math.min(options?.maxVariations ?? 3, GENERATION_LIMITS.maxVariationsPerRequest);
  // 1. Montar prompt com assets + formato + audienceLevel
  // 2. Chamar Gemini (tag: 'generate_ads', budget: 8000)
  // 3. Parsear e validar limites de caracteres
  // 4. Calcular estimatedCPS para cada variação via scoring-engine
  // 5. Retornar GeneratedAd[]
}
```

---

### S25-ST-05: Elite Asset Remixing [P0, M]

**Objetivo:** Reutilizar headlines/CTAs de elite (top 20% por relevanceScore) da base para enriquecer a geração de anúncios com técnicas de copywriting.

**Módulo:** `app/src/lib/intelligence/creative-engine/asset-remixer.ts`
**Depende de:** S25-ST-04
**Cross-Lane:** `ai_retrieval` (readonly — buscar top 20% assets)

#### Distilled Requirements
1. Criar `asset-remixer.ts` em `app/src/lib/intelligence/creative-engine/`
2. Buscar Elite Assets (top 20% por `relevanceScore`) via Pinecone/RAG
3. Aplicar técnicas de copywriting dos Conselheiros:
   - **Schwartz**: Adaptar por nível de consciência do público
   - **Halbert**: Aplicar fórmula AIDA (Attention → Interest → Desire → Action)
   - **Brunson**: Estrutura Story → Offer → Close
4. Tag cada anúncio com framework aplicado + `frameworkExplanation`
5. Popular `sourceAssets` com os assets de elite usados como base
6. Respeitar isolamento multi-tenant (apenas assets do mesmo brandId)

#### Acceptance Criteria
- [ ] Top 20% assets recuperados corretamente da base (por `relevanceScore`)
- [ ] Cada ad gerado inclui `framework` + `frameworkExplanation` preenchidos
- [ ] `sourceAssets.headlines/ctas/hooks` rastreiam os assets de elite usados
- [ ] Assets buscados são filtrados por `brandId` (zero cross-brand)
- [ ] Pelo menos 2 frameworks diferentes aplicados nas variações
- [ ] Graceful degradation se nenhum Elite Asset disponível (gerar sem remix)

---

### S25-ST-06: Brand Voice Compliance Gate [P1, S]

**Objetivo:** Garantir que todo anúncio gerado passe pelo BrandVoiceTranslator com toneMatch mínimo de 0.75.

**Módulo:** `app/src/lib/intelligence/creative-engine/brand-compliance.ts`
**Depende de:** S25-ST-04
**Cross-Lane:** `brand_voice` (readonly — BrandVoiceTranslator + brand-validation.ts)

#### Distilled Requirements
1. Criar `brand-compliance.ts` em `app/src/lib/intelligence/creative-engine/`
2. Todo ad gerado DEVE passar pelo `BrandVoiceTranslator` (Sprint 17)
3. Threshold: `toneMatch >= 0.75` (configurável via `options.minToneMatch`)
4. Se toneMatch < threshold: rejeitar e regenerar (max 2 retries)
5. Se após 2 retries ainda falhar: incluir na response com `brandVoice.passed: false`
6. Registrar `adjustments[]` feitos para atingir compliance

#### Acceptance Criteria
- [ ] Todo ad gerado passa pelo Brand Voice validator antes de entrar na response
- [ ] Ads com `toneMatch < 0.75` são regenerados (max 2 retries)
- [ ] `brandVoice.toneMatch` e `brandVoice.passed` preenchidos em cada ad
- [ ] `brandVoice.adjustments[]` documenta ajustes feitos
- [ ] `metadata.totalRejected` conta ads que falharam mesmo após retries
- [ ] Sem crash se Brand Voice service indisponível (graceful degradation)

---

## Epic 3: Multi-Input Intelligence

### S25-ST-07: Text Input Analyzer [P1, M]

**Objetivo:** Implementar análise de texto bruto (colado pelo usuário) extraindo UXIntelligence com scoring de conversão.

**Endpoint:** `POST /api/intelligence/analyze/text`
**Módulo:** `app/src/lib/intelligence/text-analyzer/text-parser.ts`
**Tipos:** `app/src/types/text-analysis.ts`

#### Distilled Requirements
1. Criar módulo `text-analyzer/` em `app/src/lib/intelligence/`
2. Criar `text-parser.ts` — parser genérico para texto colado
3. Criar `sanitizer.ts` — sanitização obrigatória (RT-03):
   - Strip HTML/scripts
   - Rejeitar inputs com `<script>`, `eval(`, `import `, `process.env`, SQL injection
   - Limite: 50.000 chars (máx), 50 chars (mín)
   - Usar `TEXT_SANITIZATION_RULES` e `isSuspiciousInput()` de `text-analysis.ts`
4. Extrair Headlines, CTAs e Hooks do texto (mesmas heurísticas de URL)
5. Retornar `UXIntelligence` + opcionalmente rodar Conversion Predictor (ST-01)
6. Criar rota `app/src/app/api/intelligence/analyze/text/route.ts`
7. Se `persistResult: true`, salvar como `IntelligenceDocument` com `source.fetchedVia: 'text_input'`
8. Detecção de idioma automática (pt/en/es) via heurística + Gemini

#### Acceptance Criteria
- [ ] Endpoint retorna 200 com `AnalyzeTextResponse` válido
- [ ] `UXIntelligence` extraído corretamente de texto colado
- [ ] Sanitização rejeita inputs suspeitos com 400 `SUSPICIOUS_INPUT`
- [ ] Erro 400 `TEXT_TOO_LONG` se > 50.000 chars
- [ ] Erro 400 `TEXT_TOO_SHORT` se < 50 chars
- [ ] Scoring de conversão incluído se `includeScoring: true`
- [ ] `export const dynamic = 'force-dynamic'` presente
- [ ] `requireBrandAccess(req, brandId)` obrigatório
- [ ] Token budget ≤ 6.000 tokens (via `cost-guard.ts`, tag: `analyze_text`)
- [ ] Rate limit: 15 req/min por brandId
- [ ] Resultado persistido no Firestore se `persistResult: true`

#### Technical Snippet
```typescript
// app/src/lib/intelligence/text-analyzer/sanitizer.ts
import { TEXT_SANITIZATION_RULES, isSuspiciousInput } from '@/types/text-analysis';

export function sanitizeTextInput(text: string): { valid: boolean; sanitized: string; error?: string } {
  if (text.length > TEXT_SANITIZATION_RULES.maxLength) return { valid: false, sanitized: '', error: 'TEXT_TOO_LONG' };
  if (text.length < TEXT_SANITIZATION_RULES.minLength) return { valid: false, sanitized: '', error: 'TEXT_TOO_SHORT' };
  if (isSuspiciousInput(text)) return { valid: false, sanitized: '', error: 'SUSPICIOUS_INPUT' };
  
  let sanitized = text;
  if (TEXT_SANITIZATION_RULES.stripHtmlTags) {
    sanitized = sanitized.replace(/<[^>]*>/g, '');
  }
  return { valid: true, sanitized };
}
```

---

### S25-ST-08: VSL Transcript Parser [P2, M]

**Objetivo:** Parser especializado para transcrições de VSL, detectando estrutura narrativa (hook, problema, solução, oferta, fechamento).

**Módulo:** `app/src/lib/intelligence/text-analyzer/vsl-parser.ts`
**Depende de:** S25-ST-07

#### Distilled Requirements
1. Criar `vsl-parser.ts` em `app/src/lib/intelligence/text-analyzer/`
2. Parser especializado para `textType: 'vsl_transcript'`:
   - Detectar hook de abertura (primeiros ~30 segundos)
   - Identificar pontos de oferta e urgência
   - Mapear estrutura narrativa: `story_offer_close` | `problem_solution` | `aida` | `custom`
3. Suportar formatos: `txt`, `srt`, `vtt` (timestamp stripping para .srt/.vtt)
4. Estimar duração baseada em word count (150 palavras/minuto default)
5. Retornar `VSLStructure` preenchido na `StructuralAnalysis`
6. Integrar com Conversion Predictor (ST-01) para scoring de VSLs

#### Acceptance Criteria
- [ ] `VSLStructure` preenchido para inputs de tipo `vsl_transcript`
- [ ] `hookSegment` extraído corretamente (primeiros ~200 palavras ou 30s estimados)
- [ ] `narrativeArc` classificado entre os 4 tipos
- [ ] `estimatedDuration` calculado corretamente (usando `estimateDuration()`)
- [ ] Formatos `.srt` e `.vtt` processados corretamente (timestamps removidos)
- [ ] Scoring de conversão funcional para VSLs

---

### S25-ST-09: Ad Copy Analyzer [P2, S]

**Objetivo:** Analisar textos de anúncio existentes (colados da Ads Library), identificando efetividade e sugerindo melhorias.

**Módulo:** `app/src/lib/intelligence/text-analyzer/ad-copy-analyzer.ts`
**Depende de:** S25-ST-07

#### Distilled Requirements
1. Criar `ad-copy-analyzer.ts` em `app/src/lib/intelligence/text-analyzer/`
2. Input: texto de anúncio existente (`textType: 'ad_copy'`)
3. Retornar `AdCopyAnalysis`:
   - Classificar formato: `short_form` | `long_form` | `video_script`
   - Detectar presença de: hook, CTA, oferta, urgência, prova social
   - Listar `missingElements[]` para os itens ausentes
4. Cruzar com Elite Assets para identificar elementos que faltam
5. Gerar sugestões de melhoria via `TextSuggestion[]`

#### Acceptance Criteria
- [ ] `AdCopyAnalysis` preenchido para inputs de tipo `ad_copy`
- [ ] `format` classificado corretamente (short/long/video)
- [ ] Detecção de elementos (hook, CTA, offer, urgency, socialProof) funcional
- [ ] `missingElements[]` lista corretamente os itens ausentes
- [ ] `TextSuggestion[]` com sugestões práticas para os elementos faltantes
- [ ] Cruzamento com Elite Assets funcional (se disponível)

---

## Transversal

### S25-ST-10: UI — Painel de Predição + Preview de Ads [P0, L]

**Objetivo:** Criar a interface do Painel de Predição (CPS Dashboard) e o Preview de Anúncios gerados.

**Módulo:** `app/src/app/intelligence/predict/`
**Depende de:** S25-ST-01, S25-ST-04
**Bloqueio:** Mockups de Beto/Victor (pendente)

#### Distilled Requirements
1. Criar página `app/src/app/intelligence/predict/page.tsx`
2. **Painel de Predição (CPS Dashboard):**
   - Visualização do score CPS (0-100) com gauge/indicador visual
   - Grade qualitativo (S/A/B/C/D/F) com cor associada
   - Breakdown por dimensão (6 barras horizontais com labels)
   - Benchmark comparativo (posição relativa na base)
   - Lista de recomendações com prioridade
3. **Preview de Ads:**
   - Mock visual de cada formato (Meta Feed, Meta Stories, Google Search)
   - Seletor de variações (carousel ou tabs)
   - Badge de CPS estimado por variação
   - Indicador de Brand Voice compliance (toneMatch)
   - Botão de "Copiar" para cada elemento de texto
4. **Text Input (Discovery Hub):**
   - Campo de texto para colar texto/transcrição
   - Seletor de tipo: `vsl_transcript`, `ad_copy`, `landing_page`, `general`
   - Upload de arquivo (.txt, .srt, .vtt)
5. Seguir padrões de UI existentes (Tailwind + shadcn/ui)

#### Acceptance Criteria
- [ ] Painel de Predição renderiza CPS com gauge visual
- [ ] 6 dimensões visíveis com barras de progresso
- [ ] Benchmark comparativo exibido
- [ ] Recomendações listadas por prioridade (critical → low)
- [ ] Preview de ads funcional para os 3 formatos
- [ ] Seletor de variações navegável
- [ ] Brand Voice compliance visível por variação
- [ ] Campo de texto input no Discovery Hub funcional
- [ ] Upload de arquivo .txt/.srt/.vtt funcional
- [ ] Responsivo (desktop + mobile)
- [ ] Build limpo (zero erros TS/Lint)

---

*Stories preparadas por Leticia (SM) — NETECMT v2.0*
*Sprint 25: Predictive & Creative Engine | 06/02/2026*
*Legenda: S = Small (< 2h), M = Medium (2-4h), L = Large (4-8h)*
