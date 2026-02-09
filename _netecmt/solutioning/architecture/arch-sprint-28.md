# 🏛️ Architecture Review: Sprint 28 — Hybrid Full: Cleanup & Foundations + Personalization Advance

**Versão:** 1.0  
**Responsável:** Athos (Architect)  
**Status:** ✅ APROVADO COM RESSALVAS (10 DTs, 3 Blocking)  
**Data:** 06/02/2026  
**PRD Ref:** `_netecmt/solutioning/prd/prd-sprint-28-hybrid-cleanup-personalization.md`  
**Sprint Predecessora:** Sprint 27 (QA 97/100) — `_netecmt/sprints/ACTIVE_SPRINT.md`

---

## 1. Sumário Executivo

Após análise profunda do codebase pós-Sprint 27, inspeção de 12 arquivos-fonte, validação de schemas, auditoria de lanes no `contract-map.yaml`, e verificação de segurança multi-tenant, esta Architecture Review **APROVA** a execução da Sprint 28 com **10 Decision Topics** (DT-01 a DT-10), sendo **3 blocking** que devem ser resolvidos durante a implementação.

### Descoberta Crítica #1: SystemPrompt Silenciosamente Ignorado

> **O `AudienceIntelligenceEngine.runDeepScan()` passa `systemPrompt` nas opções do `generateWithGemini()`, mas a função ignora esse parâmetro.**
>
> ```typescript
> // engine.ts:55-58
> const aiResponse = await generateWithGemini(prompt, {
>   systemPrompt: AUDIENCE_SCAN_SYSTEM_PROMPT,  // ← IGNORADO!
>   temperature: 0.3,
>   responseMimeType: 'application/json'
> } as any);
> ```
>
> A assinatura de `generateWithGemini()` aceita `model`, `temperature`, `topP`, `maxOutputTokens`, `responseMimeType`, `userId`, `brandId`, `feature` — **NÃO aceita `systemPrompt`**. O `as any` mascara o erro de tipo. O Gemini recebe o prompt de dados mas **nunca recebe as instruções de schema/segurança/formato**. Isso explica potenciais inconsistências no JSON mode.
>
> **Impacto:** P0 — Sem o system prompt, o Gemini não sabe o schema esperado, as regras anti-PII, nem o formato de saída. O `responseMimeType: 'application/json'` força JSON mas sem schema definido.

### Descoberta Crítica #2: Lane Overlap no Contract-Map

> A correção proposta no PRD para F2 (`operations/personalization/**` → `intelligence/audience/**`) cria um **overlap** com a lane `intelligence_wing` que já cobre `app/src/app/api/intelligence/**` via wildcard. Arquivos sob `/api/intelligence/audience/` pertenceriam a **duas lanes simultaneamente**, violando o princípio de single-ownership. Requer resolução explícita.

### Descoberta #3: `hashString` Não É Um True Stub

> O PRD afirma que os 3 stubs RAG "retornam 0". Na realidade, `hashString` já possui uma implementação funcional (bit-shift hash retornando hex string). Apenas `keywordMatchScore` e `generateLocalEmbedding` são true stubs. `hashString` precisa apenas de upgrade para SHA-256, não de implementação from-scratch.

---

## 2. Análise Ponto-a-Ponto (Solicitações do Conselho)

### 2.1 Contract-Map: Novos Paths para Personalization (F2) → DT-01

**Estado atual** (`contract-map.yaml:65-69`):
```yaml
personalization_engine:
  paths:
    - "app/src/lib/intelligence/personalization/**"
    - "app/src/app/api/operations/personalization/**"  # ← INEXISTENTE
  contract: "_netecmt/contracts/personalization-engine-spec.md"
```

**Rota real:** `app/src/app/api/intelligence/audience/scan/route.ts`

**Problema:** A lane `intelligence_wing` (`contract-map.yaml:89-116`) já possui o glob `app/src/app/api/intelligence/**`, que inclui `audience/**`. Apontar `personalization_engine` para `app/src/app/api/intelligence/audience/**` cria dual-lane membership.

**Decisão DT-01 — Resolução de Lane Overlap:**

| Opção | Descrição | Recomendação |
|:------|:----------|:-------------|
| **A (Recomendada)** | Manter a rota API sob `intelligence_wing` (já coberta pelo wildcard). Atualizar `personalization_engine.paths` para cobrir APENAS o código de engine: `app/src/lib/intelligence/personalization/**`. Remover o path de API da lane `personalization_engine`. | ✅ Zero overlap, respeita single-ownership |
| B | Adicionar `app/src/app/api/intelligence/audience/**` a `personalization_engine` e excluí-lo de `intelligence_wing` com negação | ❌ YAML do contract-map não suporta negação |
| C | Mover a rota API para `app/src/app/api/personalization/audience/scan/` (novo path) | ❌ Refatoração de rota desnecessária |

**Ação para S28-CL-02:**
```yaml
personalization_engine:
  paths:
    - "app/src/lib/intelligence/personalization/**"
    # API route /api/intelligence/audience/** permanece sob intelligence_wing
    # (single-ownership: a rota é intelligence, o engine é personalization)
  contract: "_netecmt/contracts/personalization-engine-spec.md"
```

**Adicionar comentário no `intelligence_wing` documentando a dualidade:**
```yaml
# Inclui /api/intelligence/audience/** (API do Personalization Engine)
# Engine code vive em personalization_engine lane
```

---

### 2.2 Adapter Layer: PerformanceMetricDoc vs PerformanceMetric (F5) → DT-04

**Análise de Schema Detalhada:**

| Campo | `PerformanceMetric` (atual) | `PerformanceMetricDoc` (legado) | Delta |
|:------|:---------------------------|:-------------------------------|:------|
| Platform/Source | `source: 'meta'\|'google'\|'organic'\|'aggregated'` | `platform: AdPlatform` (inclui `'tiktok'`) | Nome diferente + tipo mais amplo |
| Metrics container | `data: UnifiedAdsMetrics` | `metrics: UnifiedAdsMetrics & { clicks; impressions }` | Nome + extensão diferente |
| Extra fields | — | `name`, `level`, `externalId` | Campos adicionais no legado |
| Index signature | — | `[key: string]: unknown` | Legado permite extensão |

**Código afetado:** `CrossChannelAggregator.aggregate()` em `aggregator.ts:45`:
```typescript
const rawMetrics = metricSnaps.docs.map(d => d.data() as PerformanceMetricDoc);
// Acessa: m.platform, m.metrics.spend, m.metrics.clicks, m.metrics.impressions
```

Se o Firestore retorna `PerformanceMetric` (com `source` e `data`), o cast para `PerformanceMetricDoc` silenciosamente mapeia tudo para `undefined`, produzindo zeros em todos os totais.

**Decisão DT-04 — Adapter Strategy:**

Criar uma **pure function** adapter (não uma classe), localizada em `lib/intelligence/attribution/adapters/metric-adapter.ts`:

```typescript
// Contrato do Adapter
export function adaptToPerformanceMetricDoc(
  raw: Record<string, unknown>
): PerformanceMetricDoc {
  // Detecta formato e normaliza
  const isLegacy = 'platform' in raw && 'metrics' in raw;
  const isModern = 'source' in raw && 'data' in raw;
  
  if (isLegacy) return raw as PerformanceMetricDoc;
  if (isModern) return {
    id: raw.id as string,
    brandId: raw.brandId as string,
    platform: mapSourceToPlatform(raw.source as string),
    name: '',
    level: 'campaign' as AdEntityLevel,
    externalId: '',
    metrics: { ...(raw.data as UnifiedAdsMetrics), clicks: 0, impressions: 0 },
    timestamp: raw.timestamp as Timestamp,
  };
  throw new Error(`Unknown metric format: ${Object.keys(raw).join(',')}`);
}
```

**Regras:**
- O adapter NUNCA altera o `PerformanceMetricDoc` interface (proibição P2)
- O adapter NUNCA altera o `PerformanceMetric` interface (proibição P2)
- O adapter é uma camada intermediária de read-time, sem side effects
- Testes devem cobrir ambos os formatos + formato desconhecido

---

### 2.3 RAG Stubs: Estratégia de Implementação → DT-05, DT-06, DT-10

**Inventário Real dos Stubs (`lib/ai/rag.ts:243-262`):**

| Função | Estado Real | Retorno Atual | Estratégia |
|:-------|:-----------|:-------------|:-----------|
| `keywordMatchScore(text, keywords)` | **True stub** | `0` | **DT-10**: Implementar Jaccard Similarity |
| `generateLocalEmbedding(text)` | **True stub** | `Array(768).fill(0)` (zero vector) | **DT-06**: Hash-based 768d vector |
| `hashString(text)` | **Parcialmente implementado** | Hex string (bit-shift hash) | **DT-05**: Upgrade para SHA-256 |

#### DT-10 — `keywordMatchScore`: Jaccard Similarity

**Recomendação:** Implementar Jaccard Index (Intersection over Union de tokens).

```typescript
export function keywordMatchScore(text: string, keywords: string[]): number {
  const textTokens = new Set(text.toLowerCase().split(/\s+/));
  const keywordTokens = new Set(keywords.map(k => k.toLowerCase()));
  const intersection = [...keywordTokens].filter(k => textTokens.has(k));
  return keywordTokens.size > 0 ? intersection.length / keywordTokens.size : 0;
}
```

**Justificativa:** Zero dependências externas, determinístico, O(n) com Set, adequado para filtragem de relevância no pipeline RAG. TF-IDF seria over-engineering para este use case.

#### DT-06 — `generateLocalEmbedding`: Hash-Based Fallback

**Contexto:** O codebase já tem `generateEmbedding()` em `embeddings.ts` que usa `text-embedding-004` via API. A função `generateLocalEmbedding` serve como **fallback offline** quando a API não está disponível.

**Recomendação:** Implementar hash-based vector de 768 dimensões usando `crypto.subtle`:

```typescript
export async function generateLocalEmbedding(text: string): Promise<number[]> {
  // Hash-based pseudo-embedding (768d, determinístico, sem API)
  const encoder = new TextEncoder();
  const data = encoder.encode(text.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = new Uint8Array(hashBuffer);
  
  // Expandir 32 bytes para 768 dimensões via seed cycling
  const embedding = new Array(768);
  for (let i = 0; i < 768; i++) {
    embedding[i] = (hashArray[i % 32] / 255) * 2 - 1; // Normalizar para [-1, 1]
  }
  return embedding;
}
```

**Nota importante:** A assinatura muda de síncrona para `async` (usa `crypto.subtle`). Validar que os chamadores suportam Promise. Se necessário manter síncrona, usar o bit-shift approach expandido para 768d.

**Risco:** Hash-based embeddings têm **zero capacidade semântica** — textos similares NÃO produzem vetores similares. É adequado apenas para deduplicação e cache key, NÃO para busca semântica. Documentar essa limitação.

#### DT-05 — `hashString`: Upgrade para SHA-256

**Estado atual:** Implementação bit-shift funcional mas com espaço de colisão de 32 bits (~4 bilhões). Para uso em deduplicação no RAG cache, isso é insuficiente em escala.

**Recomendação:** Upgrade para SHA-256 via `crypto.subtle` (disponível em Node.js e browsers), mantendo compatibilidade síncrona:

```typescript
export function hashString(text: string): string {
  // Manter implementação síncrona para compatibilidade
  let hash = 5381; // djb2 algorithm
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) + hash) + text.charCodeAt(i);
    hash = hash & 0xFFFFFFFF; // Force 32-bit
  }
  return hash.toString(16).padStart(8, '0');
}
```

**Alternativa assíncrona (preferível se chamadores suportam):** Usar `crypto.subtle.digest('SHA-256', ...)` com output hex de 64 chars. Verificar chamadores antes de decidir.

**Nota:** O hash djb2 acima é melhor distribuído que o atual (que usa `(hash << 5) - hash`) mas mantém o mesmo contrato síncrono. Se colisões se tornarem problema em escala, migrar para SHA-256 async na S29.

---

### 2.4 Gemini JSON Mode: Riscos e Contrato de Response → DT-02, DT-03, DT-08, DT-09

#### DT-02 — SystemPrompt Não Chega ao Gemini (BLOCKING)

**Evidência de código:**

`engine.ts:55-58`:
```typescript
const aiResponse = await generateWithGemini(prompt, {
  systemPrompt: AUDIENCE_SCAN_SYSTEM_PROMPT, // IGNORADO
  temperature: 0.3,
  responseMimeType: 'application/json'
} as any); // ← as any mascara o erro
```

`gemini.ts:148-159` — assinatura de `generateWithGemini`:
```typescript
export async function generateWithGemini(
  prompt: string,
  options: {
    model?: string;
    temperature?: number;
    topP?: number;
    maxOutputTokens?: number;
    responseMimeType?: 'text/plain' | 'application/json';
    userId?: string;
    brandId?: string;
    feature?: string;
    // ← NÃO TEM systemPrompt!
  } = {}
): Promise<string>
```

`gemini.ts:186-207` — o body enviado ao Gemini:
```typescript
body: JSON.stringify({
  contents: [{ parts: [{ text: prompt }] }],
  generationConfig: { ... },
  safetySettings: [ ... ],
  // ← NÃO TEM system_instruction!
})
```

**O Gemini API v1beta suporta `system_instruction`** como campo top-level no body. Deve ser:
```json
{
  "system_instruction": { "parts": [{ "text": "..." }] },
  "contents": [{ "parts": [{ "text": "..." }] }],
  "generationConfig": { ... }
}
```

**Ação obrigatória para S28-PS-01:**

1. Estender a interface de options de `generateWithGemini` para aceitar `systemPrompt?: string`
2. No body da request, mapear para `system_instruction` do Gemini API:
   ```typescript
   const bodyPayload: Record<string, unknown> = {
     contents: [{ parts: [{ text: prompt }] }],
     generationConfig: { ... },
     safetySettings: [ ... ],
   };
   if (options.systemPrompt) {
     bodyPayload.system_instruction = { 
       parts: [{ text: options.systemPrompt }] 
     };
   }
   ```
3. Remover o `as any` do `engine.ts`

**Classificação:** BLOCKING — sem system_instruction, o Gemini produz JSON sem schema definido.

#### DT-03 — Zod Schema para Validação do Response Gemini (BLOCKING)

O PRD já exige testes de contrato (S28-PS-02, Ressalva R2). Athos **reforça** que o schema Zod deve ser definido como **contrato formal** e usado tanto na engine quanto nos testes.

**Contrato de Response (schema Zod):**

```typescript
import { z } from 'zod';

export const AudienceScanResponseSchema = z.object({
  persona: z.object({
    demographics: z.string().min(1),
    painPoints: z.array(z.string()).min(1),
    desires: z.array(z.string()).min(1),
    objections: z.array(z.string()).min(1),
    sophisticationLevel: z.number().int().min(1).max(5),
  }),
  propensity: z.object({
    score: z.number().min(0).max(1),
    segment: z.enum(['hot', 'warm', 'cold']),
    reasoning: z.string().min(1),
  }),
  confidence: z.number().min(0).max(1),
});

export type AudienceScanAIResponse = z.infer<typeof AudienceScanResponseSchema>;
```

**Uso na engine:**
```typescript
const parsed = AudienceScanResponseSchema.safeParse(JSON.parse(aiResponse));
if (!parsed.success) {
  console.error('[DeepScan] Gemini response validation failed:', parsed.error);
  // Fallback response com defaults seguros
  return FALLBACK_SCAN_RESPONSE;
}
const result = parsed.data;
```

**Localização:** `lib/intelligence/personalization/schemas/audience-scan-schema.ts`

**Classificação:** BLOCKING — sem validação, JSON malformado do Gemini propaga dados corrompidos.

#### DT-08 — Remover `as any` do Engine

Consequência direta do DT-02. Após estender `generateWithGemini`, o cast `as any` na linha 58 do `engine.ts` deve ser removido. Tipo seguro = detecção de erros em compile time.

**Classificação:** P2 — Resolvido automaticamente junto com DT-02.

#### DT-09 — Retry Logic com Exponential Backoff

O PRD menciona retry (S28-PS-01, item 4) mas não especifica o contrato. Athos define:

```typescript
// Contrato de retry para chamadas Gemini no Deep-Scan
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000,      // 1s → 2s → 4s
  maxDelay: 10000,       // Cap em 10s
  retryableStatuses: [429, 500, 502, 503],
};
```

**Regra:** O retry NÃO deve ser implementado dentro de `generateWithGemini` (impactaria todos os chamadores). Deve ser implementado **no `AudienceIntelligenceEngine`** como wrapper do chamada ao Gemini, localizado no próprio arquivo `engine.ts`.

**Classificação:** P1 — Importante mas não blocking.

---

### 2.5 Multi-Tenant: Isolamento de Persona/Propensity → DT-07

**Auditoria de Isolamento:**

| Componente | brandId Required | brandId Source | Auth Guard | Veredicto |
|:-----------|:----------------|:--------------|:-----------|:----------|
| `engine.ts` (runDeepScan) | ✅ Parâmetro obrigatório | API route → `requireBrandAccess` | ✅ Herdado | SEGURO |
| `scan/route.ts` (API) | ✅ `requireBrandAccess(req, brandId)` | Body → validado via auth | ✅ `brand-guard.ts` | SEGURO |
| `propensity.ts` (calculate) | N/A (pure function) | Recebe dados já filtrados | N/A | SEGURO |
| `maestro.ts` (processInteraction) | ✅ `brands/${brandId}/leads` | Parâmetro direto | ❌ **SEM AUTH** | ⚠️ RISCO |
| `middleware.ts` (personalizationMiddleware) | ⚠️ `req.nextUrl.searchParams.get('brandId')` | Query string | ❌ **SEM AUTH** | ⚠️ RISCO |
| `saveAudienceScan` (Firestore) | ✅ `brands/${brandId}/audience_scans` | Engine → API route | ✅ Herdado | SEGURO |

**DT-07 — Middleware de Personalização Sem Autenticação (BLOCKING)**

O `personalizationMiddleware` (`middleware.ts:13-14`) extrai `brandId` e `leadId` de query params:

```typescript
const brandId = req.nextUrl.searchParams.get('brandId');
const leadId = req.nextUrl.searchParams.get('leadId');
```

E então chama `PersonalizationMaestro.processInteraction()` que **escreve no Firestore** (`brands/{brandId}/leads/{leadId}/events`) sem qualquer validação de autenticação.

**Risco:** Qualquer request com `?brandId=X&leadId=Y` pode injetar eventos falsos na timeline de qualquer lead de qualquer marca.

**Ação obrigatória para S28-PS-01:**

1. **Opção A (Recomendada):** Adicionar validação de auth no middleware. Se auth falhar, skippar o tracking silenciosamente (não bloquear a requisição).
2. **Opção B:** Remover o middleware do escopo S28 e implementar tracking autenticado na S29. O middleware atual não é chamado por nenhum `middleware.ts` do Next.js (verificar se está registrado).

**Investigação adicional necessária:** Verificar se `personalizationMiddleware` está registrado no `middleware.ts` root do Next.js. Se não estiver registrado, o risco é **teórico** (código morto) e pode ser adiado. Se estiver registrado, é **P0 blocking**.

**Classificação:** BLOCKING até investigação confirmar status de registro.

---

## 3. Contract Safety Check

### 3.1 Lanes Impactadas

| Lane | Contrato | Mudanças | Risco |
|:-----|:---------|:---------|:------|
| `personalization_engine` | `personalization-engine-spec.md` | Fix path (DT-01), engine hardening, propensity hardening | ⚠️ Médio — core da sprint |
| `intelligence_wing` | `intelligence-storage.md` (v2.0) | API audience scan hardening, UI dashboard | ⚠️ Médio — API + UI tocados |
| `ai_retrieval` | `retrieval-contracts.md` | RAG stubs implementados (DT-05/06/10), embeddings.ts intacto | ✅ Baixo |
| `performance_war_room` | `performance-spec.md` | Adapter layer (DT-04) — camada intermediária, não altera interfaces | ✅ Baixo |
| `core` | N/A | `contract-map.yaml` path fix | ✅ Mínimo |

### 3.2 Veredito de Contratos

**NENHUM contrato ativo será quebrado.** Justificativas:

1. **`personalization-engine-spec.md`**: A spec define o Maestro como orchestrador. Todas as mudanças são **hardenings** (validação, retry, Zod) sobre código existente — não alteram o contrato de interface.
2. **`intelligence-storage.md` (v2.0)**: API audience scan já existe e é coberta. Mudanças são internas (validação, response shape mantido).
3. **`types/personalization.ts`**: `AudienceScan`, `DynamicContentRule`, `LeadState` — NENHUM export será removido (proibição P2). Apenas adições possíveis.
4. **Sprint 25 types intocados**: `prediction.ts`, `creative-ads.ts`, `text-analysis.ts` — proibição P3 respeitada.
5. **`types/performance.ts`**: `PerformanceMetric` e `PerformanceMetricDoc` intocados. Adapter é camada intermediária sem side effects.

### 3.3 Proibições Validadas

| # | Proibição | Validação | Status |
|:--|:----------|:----------|:-------|
| P1 | Não alterar lógica Attribution (engine, bridge, aggregator, overlap) | Adapter é camada intermediária, não toca internos | ✅ |
| P2 | Não remover exports existentes | Apenas adições ao schema Zod e adapter | ✅ |
| P3 | Não alterar interfaces Sprint 25 | Zero impacto | ✅ |
| P4 | Não usar `firebase-admin` ou `google-cloud/*` | Engine usa Client SDK, Gemini usa fetch direto | ✅ |
| P5 | Não incluir PII em prompts | `audience-scan.ts` já anonimiza (IDs parciais, sem email/nome) | ✅ Reforçar em testes |
| P6 | Não usar `any` em novos tipos | DT-08 remove o `as any` existente | ✅ |
| P7 | Não hardcodar brandId | `requireBrandAccess` valida via auth | ✅ |
| P8 | Gate Check obrigatório antes da Fase 2 | PRD define. Arch Review confirma | ✅ |
| P9 | Não alterar formato do contract-map | DT-01: apenas corrigir paths e adicionar comentários | ✅ |
| P10 | Não remover stubs fora do escopo | Stubs de assets permanecem. RAG stubs são escopo S28 | ✅ |

---

## 4. Tabela Consolidada de Decision Topics

| DT | Título | Severidade | Blocking? | Epic Impactado | Ação |
|:---|:-------|:-----------|:----------|:---------------|:-----|
| **DT-01** | Lane Overlap contract-map | P1 | Não | S28-CL-02 | Opção A: engine-only path para `personalization_engine`, API fica em `intelligence_wing` |
| **DT-02** | SystemPrompt ignorado pelo Gemini | **P0** | **SIM** | S28-PS-01 | Estender `generateWithGemini` com `systemPrompt` → `system_instruction` |
| **DT-03** | Sem validação Zod no response Gemini | **P0** | **SIM** | S28-PS-01/PS-02 | Criar `AudienceScanResponseSchema` com Zod, usar `safeParse` + fallback |
| **DT-04** | Adapter PerformanceMetricDoc ↔ PerformanceMetric | P1 | Não | S28-CL-03 | Pure function adapter em `adapters/metric-adapter.ts` |
| **DT-05** | hashString já parcialmente implementado | P3 | Não | S28-CL-06 | Upgrade para djb2 com padding, ou SHA-256 async se chamadores suportam |
| **DT-06** | generateLocalEmbedding: hash-based fallback | P2 | Não | S28-CL-06 | Hash-based 768d vector via `crypto.subtle`. Documentar: zero capacidade semântica |
| **DT-07** | Middleware sem autenticação | **P0** | **SIM** | S28-PS-01 | Verificar se registrado no Next.js middleware. Se sim: adicionar auth guard. Se não: dead code |
| **DT-08** | `as any` no engine.ts | P2 | Não | S28-PS-01 | Remover após DT-02 |
| **DT-09** | Retry logic não especificada | P1 | Não | S28-PS-01 | Exponential backoff (1s→2s→4s, max 3 retries) no engine, NÃO no gemini.ts |
| **DT-10** | keywordMatchScore: algoritmo | P2 | Não | S28-CL-06 | Jaccard Similarity com Set de tokens |

---

## 5. Correções nas Premissas do PRD

| # | Premissa do PRD | Realidade | Impacto na Estimativa |
|:--|:----------------|:----------|:---------------------|
| **CP-01** | "3 stubs retornando 0" | `hashString` já tem implementação funcional (hex hash), apenas precisa upgrade | -15min no S28-CL-06 |
| **CP-02** | Engine usa `systemPrompt` corretamente | `systemPrompt` é IGNORADO pelo `generateWithGemini` | +1h no S28-PS-01 (precisa estender gemini.ts) |
| **CP-03** | Multi-tenant OK para Personalization | Middleware tem gap de auth | +30min investigação + possível fix |
| **CP-04** | Contract-map fix é "XS" | Requer análise de overlap + decisão de lane ownership | +15min de design |

---

## 6. Estimativa Revisada (Athos)

### Fase 1 — Cleanup & Foundations

| Story | PRD Estimativa | Athos Estimativa | Delta | Justificativa |
|:------|:--------------|:-----------------|:------|:-------------|
| S28-CL-01 (dead test) | XS | XS (~15min) | = | Simples: deletar arquivo |
| S28-CL-02 (contract-map GATE) | XS | S (~30min) | +15min | DT-01: requer decisão de lane ownership e comentários |
| S28-CL-03 (adapter GATE) | M (~2h) | M (~2h) | = | DT-04: pure function adapter + testes |
| S28-CL-04 (lanes attribution) | XS | XS (~15min) | = | Adicionar paths ao YAML |
| S28-CL-05 (feature flag) | S (~1h) | S (~1h) | = | Grep + remover de page, rotas, .env, config |
| S28-CL-06 (RAG stubs) | M (~2h) | M (~1.5h) | -30min | CP-01: hashString já funciona, apenas upgrade |
| **Subtotal Fase 1** | **5-6h** | **4.5-5.5h** | **-30min** | |

### Gate Check

| Item | Estimativa |
|:-----|:----------|
| `npx tsc --noEmit` = 0 | 5min |
| `npm run build` sucesso | 10min |
| Diff review CL-02 + CL-03 | 10min |
| **Total Gate Check** | **~25min** |

### Fase 2 — Personalization Advance

| Story | PRD Estimativa | Athos Estimativa | Delta | Justificativa |
|:------|:--------------|:-----------------|:------|:-------------|
| S28-PS-01 (API scan hardening) | L (~4h) | L+ (~5h) | +1h | CP-02: DT-02 (estender gemini.ts) + DT-07 (middleware) + DT-09 (retry) |
| S28-PS-02 (testes contrato) | M (~2h) | M (~2.5h) | +30min | DT-03: Zod schema formal + testes de fallback + PII test |
| S28-PS-03 (propensity) | M (~2h) | M (~2h) | = | Código já 80% pronto, apenas testes + edge cases |
| S28-PS-04 (UI dashboard) | L (~3h) | L (~3h) | = | Fortalecimento de page existente |
| S28-PS-05 (componentes) | M (~2h) | M (~2h) | = | Cards, badges, detail view |
| S28-PS-06 (rules stretch) | M (~2h) | M (~2h) | = | Stretch: só se budget permitir |
| **Subtotal Fase 2** | **10-14h** | **11.5-16.5h** | **+1.5h** | |

### Total Consolidado

| Fase | Estimativa Revisada | Sem Stretch |
|:-----|:-------------------|:------------|
| Fase 1 (Cleanup) | 4.5-5.5h | 4.5-5.5h |
| Gate Check | ~25min | ~25min |
| Fase 2 (Personalization) | 11.5-16.5h | 9.5-14.5h |
| QA Final | 1-2h | 1-2h |
| **Total** | **~17-24h** | **~15.5-22h** |

**Nota:** Incremento de ~2h vs PRD, inteiramente justificado por DT-02 (system prompt) e DT-03 (Zod schema) que são obrigatórios para qualidade.

---

## 7. Riscos Adicionais Identificados (Além do PRD)

| # | Risco | Prob. | Impacto | Mitigação |
|:--|:------|:------|:--------|:----------|
| AR-01 | `generateLocalEmbedding` async break | Média | Médio | Verificar todos os chamadores antes de mudar assinatura. Se quebra, manter versão síncrona |
| AR-02 | `generateWithGemini` extensão afeta outros chamadores | Baixa | Alto | `systemPrompt` é opcional com default `undefined`. Chamadores existentes não passam o campo |
| AR-03 | Zod como nova dependência | Baixa | Baixo | Zod já é peer dependency do Next.js 16. Verificar se está no `package.json` |

---

## 8. Sequência de Execução Recomendada (Refinada)

```
[FASE 1 — Cleanup & Foundations]
  S28-CL-01 (dead test, XS)
    → S28-CL-02 (contract-map, S) [DT-01: Opção A]
      → S28-CL-03 (adapter, M) [DT-04: pure function]
  
  ── GATE CHECK ── (tsc + build + review) ──

  S28-CL-04 (lanes, XS) ║ S28-CL-05 (feature flag, S) ║ S28-CL-06 (RAG, M) [DT-05/06/10]
                         ║ (parallelizável)              ║

[FASE 2 — Personalization Advance]
  ★ Primeiro: Estender generateWithGemini (DT-02) — prerequisite de PS-01
  S28-PS-01 (API scan, L+) [DT-02, DT-07, DT-09]
    → S28-PS-02 (testes contrato, M) [DT-03: Zod schema]
      → S28-PS-03 (propensity, M)
        → S28-PS-04 (UI dashboard, L)
          → S28-PS-05 (componentes, M)
            → S28-PS-06 (rules, M — STRETCH)

[QA FINAL]
  Dandara valida CS-01 a CS-13 + valida DTs blocking resolvidos
```

**Nota crítica:** DT-02 (estender `generateWithGemini`) deve ser o PRIMEIRO item da Fase 2, antes mesmo de S28-PS-01 iniciar o hardening da API scan. Sem o system prompt chegando ao Gemini, nenhum teste de contrato passará.

---

## 9. Checklist de Blocking DTs (Gate para SM)

A Leticia (SM) NÃO deve iniciar Story Packing sem confirmar compreensão destes 3 DTs blocking:

- [ ] **DT-02**: Darllyson entende que precisa estender `generateWithGemini` para suportar `system_instruction`
- [ ] **DT-03**: Story S28-PS-02 inclui criação do Zod schema `AudienceScanResponseSchema` como primeiro deliverable
- [ ] **DT-07**: Darllyson investiga se `personalizationMiddleware` está registrado no Next.js `middleware.ts`

---

## 10. Veredito Final

### ✅ APROVADO COM RESSALVAS

O PRD da Sprint 28 está **bem estruturado**, com sequenciamento de fases correto, blocking gates identificados, e escopo adequado para um Hybrid Sprint. O padrão S27 → S28 demonstra maturidade no processo.

**Ressalvas obrigatórias:**

1. **DT-02 é P0**: O system prompt precisa chegar ao Gemini. Sem isso, o Deep-Scan produz JSON imprevisível.
2. **DT-03 é P0**: Validação Zod obrigatória. O Conselho (Ressalva R2) já exige testes de contrato — Athos reforça que o schema Zod deve ser o **artefato central** desses testes.
3. **DT-07 é P0 condicional**: Se o middleware está registrado, é blocking. Se é dead code, pode ser adiado para S29.
4. **DT-01 é P1**: Lane overlap deve ser resolvido com Opção A (single-ownership) antes de qualquer hardening.
5. **Estimativa ajustada +2h**: Inteiramente justificada pelos DTs blocking descobertos nesta review.

**O PRD pode prosseguir para Story Packing (Leticia) após confirmação dos 3 blocking DTs.**

---

*Architecture Review realizada por Athos (Architect) — NETECMT v2.0*  
*Sprint 28: Hybrid Full — Cleanup & Foundations + Personalization Advance | 06/02/2026*  
*10 Decision Topics | 3 Blocking | Estimativa revisada: ~15.5-24h*  
*Veredito: APROVADO COM RESSALVAS*
