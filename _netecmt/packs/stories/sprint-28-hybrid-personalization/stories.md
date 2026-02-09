# Stories Distilled: Sprint 28 — Hybrid Full (Cleanup & Foundations + Personalization Advance)
**Preparado por:** Leticia (SM)
**Data:** 06/02/2026
**Lanes:** personalization_engine + intelligence_wing + ai_retrieval + performance_war_room + core

> **IMPORTANTE:** Este documento incorpora os **10 Decision Topics (DTs)** e **4 Correções de Premissa (CPs)** do Architecture Review (Athos). Cada DT incorporado está marcado com `[ARCH DT-XX]`. Os 3 blocking DTs (DT-02, DT-03, DT-07) estão destacados com `⚡ BLOCKING`.

---

## Epic 1: Cleanup & Foundations [Fase 1 — ~4.5-5.5h]

> **Sequência:** CL-01 → CL-02 (GATE) → CL-03 (GATE) → **GATE CHECK** → CL-04 ║ CL-05 ║ CL-06 (parallelizáveis)

---

### S28-CL-01: Remover dead test `process.test.ts` [P1, XS, ~15min]

**Objetivo:** O arquivo `app/src/app/api/ingest/__tests__/process.test.ts` importa a rota `/api/ingest/process` que foi removida em sprint anterior. 6 testes falhando nele. É um dead test.

**Ação:**
1. Deletar o arquivo `app/src/app/api/ingest/__tests__/process.test.ts`
2. Confirmar que a rota `/api/ingest/process` NÃO existe (não retornará)
3. Rodar `npm test` e confirmar redução de failures

**Arquivo afetado:**
- `app/src/app/api/ingest/__tests__/process.test.ts` — **DELETAR**

**AC:**
- [ ] Arquivo `process.test.ts` deletado
- [ ] `npm test` — 0 testes falhando (dead test era o último)
- [ ] Rota `/api/ingest/process` confirmada como inexistente

---

### S28-CL-02: Fix contract-map route personalization + Lane Ownership [P1, S, ~30min] — 🚧 GATE

**Objetivo:** Lane `personalization_engine` no `contract-map.yaml` aponta para `app/src/app/api/operations/personalization/**` — rota INEXISTENTE. Corrigir para paths corretos respeitando single-ownership.

> **[ARCH DT-01 — Lane Overlap Resolution]:** A correção óbvia (apontar para `intelligence/audience/**`) cria overlap com `intelligence_wing` que já cobre `app/src/app/api/intelligence/**`. **Solução aprovada: Opção A** — `personalization_engine` cobre APENAS engine code. API route fica sob `intelligence_wing`.

**Arquivo afetado:**
- `_netecmt/core/contract-map.yaml`

**Ação:**
1. Atualizar `personalization_engine.paths`:
   ```yaml
   personalization_engine:
     paths:
       - "app/src/lib/intelligence/personalization/**"
       # API route /api/intelligence/audience/** permanece sob intelligence_wing
       # (single-ownership: a rota é intelligence, o engine é personalization)
     contract: "_netecmt/contracts/personalization-engine-spec.md"
   ```
2. Adicionar comentário na lane `intelligence_wing` documentando a dualidade:
   ```yaml
   # Inclui /api/intelligence/audience/** (API do Personalization Engine)
   # Engine code vive em personalization_engine lane
   ```
3. Remover o path `app/src/app/api/operations/personalization/**` (inexistente)

> **PRD P9:** NUNCA alterar formato do `contract-map.yaml` — apenas corrigir paths e adicionar comentários.

**AC:**
- [ ] `personalization_engine.paths` contém APENAS `app/src/lib/intelligence/personalization/**`
- [ ] Path inexistente `operations/personalization/**` removido
- [ ] Comentário na lane `intelligence_wing` documentando ownership de `/api/intelligence/audience/**`
- [ ] Zero overlap entre lanes
- [ ] NENHUMA outra alteração estrutural no YAML

---

### S28-CL-03: Adapter layer aggregator (schema mismatch) [P1, M, ~2h] — 🚧 GATE

**Objetivo:** `CrossChannelAggregator.aggregate()` em `aggregator.ts` faz cast `as PerformanceMetricDoc` mas Firestore retorna `PerformanceMetric`. Campos `platform`/`source` e `metrics`/`data` divergem, produzindo `undefined` e zeros nos totais.

> **[ARCH DT-04 — Adapter Strategy]:** Criar uma **pure function** adapter (não classe). O adapter NUNCA altera as interfaces existentes. É camada intermediária de read-time sem side effects.

**Arquivos:**
- `app/src/lib/intelligence/attribution/adapters/metric-adapter.ts` — **CRIAR**
- `app/src/lib/intelligence/attribution/aggregator.ts` — **MODIFICAR** (usar adapter no ponto de cast)

**Ação:**
1. **Criar** `lib/intelligence/attribution/adapters/metric-adapter.ts`:
   ```typescript
   export function adaptToPerformanceMetricDoc(
     raw: Record<string, unknown>
   ): PerformanceMetricDoc {
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
2. No `aggregator.ts:45`, substituir o cast direto pelo adapter:
   ```typescript
   // ANTES:
   const rawMetrics = metricSnaps.docs.map(d => d.data() as PerformanceMetricDoc);
   // DEPOIS:
   const rawMetrics = metricSnaps.docs.map(d => adaptToPerformanceMetricDoc(d.data()));
   ```
3. Criar helper `mapSourceToPlatform()` para mapear `source` → `platform`
4. **Testes:** Cobrir ambos formatos (legacy e modern) + formato desconhecido (throw)

> **PRD P1:** NUNCA alterar lógica de negócio interna do aggregator — apenas substituir o ponto de cast.
> **PRD P2:** NUNCA remover exports de `types/performance.ts`. Ambas interfaces permanecem.

**Arquivos de leitura (contexto):**
- `app/src/types/performance.ts` — Schema `PerformanceMetric` (modern) e `PerformanceMetricDoc` (legacy)
- `app/src/lib/intelligence/attribution/aggregator.ts` — Ponto de uso do cast

**AC:**
- [ ] `metric-adapter.ts` criado com `adaptToPerformanceMetricDoc()` como pure function
- [ ] `mapSourceToPlatform()` helper criado
- [ ] `aggregator.ts` usa adapter no lugar do cast direto
- [ ] Testes cobrem: formato legacy, formato modern, formato desconhecido
- [ ] Interfaces `PerformanceMetric` e `PerformanceMetricDoc` INALTERADAS
- [ ] Lógica interna do aggregator INALTERADA (apenas ponto de cast)
- [ ] `npx tsc --noEmit` = 0

---

### ── GATE CHECK (~25min) ──

> **REGRA ABSOLUTA (Ressalva R1 do Conselho):** A Fase 2 NÃO pode iniciar sem:

- [ ] S28-CL-02 concluído — `contract-map.yaml` com paths corretos (Opção A)
- [ ] S28-CL-03 concluído — adapter layer funcional, testes passando
- [ ] `npx tsc --noEmit` = 0 erros
- [ ] `npm run build` sucesso
- [ ] Diff review visual de CL-02 e CL-03

> **Nota:** CL-04, CL-05 e CL-06 podem ser executados APÓS o gate check, em paralelo entre si, pois são independentes.

---

### S28-CL-04: Lane attribution no contract-map [P2, XS, ~15min]

**Objetivo:** Registrar arquivos de attribution que estão fora de qualquer lane no `contract-map.yaml` (Finding F4 da S27).

**Arquivo afetado:**
- `_netecmt/core/contract-map.yaml`

**Ação:**
1. Adicionar os seguintes arquivos à lane `intelligence_wing` (ou criar sublane `attribution` se preferível):
   - `app/src/lib/hooks/use-attribution-data.ts`
   - `app/src/types/attribution.ts`
   - `app/src/lib/intelligence/attribution/budget-optimizer.ts`
2. Manter formato YAML intacto — apenas adição de paths

> **PRD P9:** NUNCA alterar formato do YAML — apenas adicionar paths.

**AC:**
- [ ] 3 arquivos attribution registrados em lanes no `contract-map.yaml`
- [ ] NENHUMA outra alteração estrutural no YAML
- [ ] `npx tsc --noEmit` = 0

---

### S28-CL-05: Remover feature flag `NEXT_PUBLIC_ENABLE_ATTRIBUTION` [P3, S, ~1h]

**Objetivo:** A feature flag `NEXT_PUBLIC_ENABLE_ATTRIBUTION` não é mais necessária — attribution foi estabilizada na Sprint 27. Remover todas as referências e tornar attribution always-on.

**Arquivos afetados:**
- `app/src/app/intelligence/attribution/page.tsx` — Remover check de feature flag
- Rotas API attribution (3 rotas: `/sync`, `/stats`, `/overlap`) — Remover guards de feature flag
- `app/.env.example` — Remover variável
- `app/src/lib/intelligence/config.ts` (ou equivalente) — Remover referência

**Ação:**
1. `grep -r "NEXT_PUBLIC_ENABLE_ATTRIBUTION"` para encontrar todas as ocorrências
2. Remover verificações condicionais (if/early return) em cada arquivo
3. Remover a variável de `app/.env.example`
4. Tornar attribution always-on
5. Confirmar que attribution page e rotas continuam funcionando

> **PRD P1:** NUNCA alterar lógica de negócio dos módulos attribution core.

**AC:**
- [ ] `grep -r "NEXT_PUBLIC_ENABLE_ATTRIBUTION"` retorna 0 ocorrências
- [ ] Attribution page renderiza normalmente (sem gate de feature flag)
- [ ] 3 rotas API attribution acessíveis sem feature flag
- [ ] `.env.example` não contém mais a variável
- [ ] `npx tsc --noEmit` = 0

---

### S28-CL-06: Implementar RAG stubs [P2, M, ~1.5h]

**Objetivo:** 3 funções stub em `lib/ai/rag.ts` retornam valores dummy. Implementar com algoritmos reais para melhorar qualidade do chat/retrieval.

> **[ARCH CP-01]:** `hashString` já tem implementação funcional (bit-shift hash retornando hex). NÃO é um true stub. Apenas upgrade.

**Arquivo afetado:**
- `app/src/lib/ai/rag.ts`

**Ação por função:**

#### 1. `keywordMatchScore(text, keywords)` → [ARCH DT-10: Jaccard Similarity]

```typescript
export function keywordMatchScore(text: string, keywords: string[]): number {
  const textTokens = new Set(text.toLowerCase().split(/\s+/));
  const keywordTokens = new Set(keywords.map(k => k.toLowerCase()));
  const intersection = [...keywordTokens].filter(k => textTokens.has(k));
  return keywordTokens.size > 0 ? intersection.length / keywordTokens.size : 0;
}
```
- Zero dependências externas, determinístico, O(n) com Set
- Adequado para filtragem de relevância no pipeline RAG

#### 2. `generateLocalEmbedding(text)` → [ARCH DT-06: Hash-based 768d]

```typescript
export async function generateLocalEmbedding(text: string): Promise<number[]> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = new Uint8Array(hashBuffer);
  
  const embedding = new Array(768);
  for (let i = 0; i < 768; i++) {
    embedding[i] = (hashArray[i % 32] / 255) * 2 - 1; // Normalizar para [-1, 1]
  }
  return embedding;
}
```
- **ATENÇÃO:** Assinatura muda de síncrona para `async`. Verificar que chamadores suportam Promise.
- Se necessário manter síncrona: usar bit-shift approach expandido para 768d
- **DOCUMENTAR no código:** Hash-based embeddings têm **ZERO capacidade semântica** — textos similares NÃO produzem vetores similares. Adequado apenas para deduplicação e cache key, NÃO para busca semântica.

#### 3. `hashString(text)` → [ARCH DT-05: Upgrade djb2]

```typescript
export function hashString(text: string): string {
  let hash = 5381; // djb2 algorithm
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) + hash) + text.charCodeAt(i);
    hash = hash & 0xFFFFFFFF; // Force 32-bit
  }
  return hash.toString(16).padStart(8, '0');
}
```
- Mantém contrato síncrono
- djb2 é melhor distribuído que o atual `(hash << 5) - hash`
- Padding para 8 chars garante output consistente

**Arquivos de leitura (contexto):**
- `app/src/lib/ai/rag.ts` — Código atual dos stubs
- `app/src/__tests__/lib/ai/rag.test.ts` — Testes existentes (ajustar expectations para valores reais)
- `app/src/lib/ai/embeddings.ts` — `generateEmbedding()` via API (NÃO alterar)

**AC:**
- [ ] `keywordMatchScore` retorna valor Jaccard real (não 0)
- [ ] `generateLocalEmbedding` retorna vetor 768d real (não zeros)
- [ ] `hashString` usa djb2 com padding 8 chars
- [ ] Chamadores de `generateLocalEmbedding` verificados para async compatibility
- [ ] Comentário no código documentando zero capacidade semântica do generateLocalEmbedding
- [ ] Testes em `rag.test.ts` ajustados para validar implementação real
- [ ] `embeddings.ts` INALTERADO
- [ ] `npx tsc --noEmit` = 0

---

## Epic 2: Personalization Advance [Fase 2 — ~11.5-16.5h]

> **PRE-REQUISITO ABSOLUTO:** Gate Check da Fase 1 aprovado. F2 e F5 resolvidos.
>
> **Sequência Athos:** DT-02 (system_instruction) PRIMEIRO → PS-01 → PS-02 (Zod) → PS-03 → PS-04 → PS-05 → PS-06 (stretch)

### ⚡ Pre-flight: Blocking DTs Checklist (Seção 9 do Arch Review)

Antes de iniciar QUALQUER story da Fase 2, confirmar:

- [ ] **DT-02 compreendido**: `generateWithGemini` será estendido para suportar `systemPrompt` → `system_instruction` no body do Gemini API. Sem isso, o Gemini não recebe schema/segurança/formato.
- [ ] **DT-03 compreendido**: Schema Zod `AudienceScanResponseSchema` será criado em `lib/intelligence/personalization/schemas/audience-scan-schema.ts` com `safeParse` + fallback.
- [ ] **DT-07 investigado**: `personalizationMiddleware` verificado se está registrado no `middleware.ts` root do Next.js. Resultado documentado.

---

### S28-PS-01: Hardening API Audience Scan + system_instruction [P0, L+, ~5h]

**Objetivo:** Fortalecer `POST /api/intelligence/audience/scan` incorporando 4 Decision Topics do Arch Review. Esta story é o núcleo do motor de Personalização.

> ⚡ **[ARCH DT-02 — BLOCKING P0]:** O `systemPrompt` é passado ao `generateWithGemini()` mas IGNORADO. A assinatura de `generateWithGemini()` NÃO aceita `systemPrompt`. O `as any` no `engine.ts:58` mascara o erro de tipo. O Gemini recebe dados mas NUNCA recebe instruções de schema/segurança/formato. **DEVE ser o PRIMEIRO item implementado nesta story.**

**Arquivos afetados:**
- `app/src/lib/ai/gemini.ts` — **MODIFICAR** (estender interface de options)
- `app/src/lib/intelligence/personalization/engine.ts` — **MODIFICAR** (remover `as any`, retry logic)
- `app/src/app/api/intelligence/audience/scan/route.ts` — **MODIFICAR** (validação input)
- `app/src/lib/intelligence/personalization/middleware.ts` — **INVESTIGAR** (DT-07)

**Ação — Sub-tasks em ORDEM:**

#### Sub-task 1: Estender `generateWithGemini` (DT-02) — PRIMEIRO
1. Em `gemini.ts`, adicionar `systemPrompt?: string` à interface de options:
   ```typescript
   export async function generateWithGemini(
     prompt: string,
     options: {
       model?: string;
       temperature?: number;
       topP?: number;
       maxOutputTokens?: number;
       responseMimeType?: 'text/plain' | 'application/json';
       systemPrompt?: string;  // ← ADICIONAR
       userId?: string;
       brandId?: string;
       feature?: string;
     } = {}
   ): Promise<string>
   ```
2. No body da request, mapear `systemPrompt` para `system_instruction`:
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
3. **NÃO** alterar comportamento para chamadores existentes — `systemPrompt` é opcional com default `undefined`

> **[ARCH AR-02]:** `systemPrompt` opcional. Chamadores existentes não passam o campo, portanto zero impacto.

#### Sub-task 2: Remover `as any` do engine.ts (DT-08)
1. Em `engine.ts:58`, remover o cast `as any`:
   ```typescript
   // ANTES:
   } as any);
   // DEPOIS:
   });
   ```
2. Tipo agora é seguro — `systemPrompt` aceito pela interface

#### Sub-task 3: Investigar Middleware (DT-07) ⚡ BLOCKING CONDICIONAL
1. Verificar se `personalizationMiddleware` está registrado/importado no `middleware.ts` root do Next.js (`app/src/middleware.ts`)
2. **Se SIM (registrado):** Adicionar validação de auth. Se auth falhar, skippar tracking silenciosamente (não bloquear request)
3. **Se NÃO (dead code):** Documentar como dead code e adiar fix para S29. O risco é teórico.
4. **Documentar resultado** em comentário no código e no PR

#### Sub-task 4: Validação robusta de input na API route
1. `brandId` obrigatório — retornar 400 se ausente
2. `leadLimit` com default (50) e max (200)
3. Error handling com mensagens seguras (sem PII leak)

#### Sub-task 5: Retry Logic (DT-09)
1. Implementar retry **NO engine.ts** (NÃO no gemini.ts):
   ```typescript
   const RETRY_CONFIG = {
     maxRetries: 3,
     baseDelay: 1000,      // 1s → 2s → 4s
     maxDelay: 10000,       // Cap em 10s
     retryableStatuses: [429, 500, 502, 503],
   };
   ```
2. Exponential backoff wrapper para a chamada `generateWithGemini` dentro do engine
3. O retry NÃO deve ser implementado dentro de `generateWithGemini` (impactaria todos os chamadores)

#### Sub-task 6: Gemini JSON mode
1. Confirmar `responseMimeType: 'application/json'` está sendo passado
2. Com DT-02 resolvido, o system prompt agora define o schema esperado
3. Validação do response será na story PS-02 (Zod)

**Arquivos de leitura (contexto):**
- `app/src/lib/ai/prompts/audience-scan.ts` — System prompt (AUDIENCE_SCAN_SYSTEM_PROMPT)
- `app/src/types/personalization.ts` — `AudienceScan`, `DynamicContentRule`, `LeadState`
- `app/src/lib/firebase/scoped-data.ts` — Acesso a dados multi-tenant

> **PRD P5:** NUNCA incluir PII (email, nome, IP, telefone) em prompts do Gemini.
> **PRD P6:** NUNCA usar `any` em novos tipos.
> **PRD P7:** NUNCA hardcodar `brandId` — multi-tenant first.

**AC:**
- [ ] `generateWithGemini` aceita `systemPrompt` na interface (não mais ignorado)
- [ ] `system_instruction` enviado no body do Gemini API quando `systemPrompt` fornecido
- [ ] `as any` removido do `engine.ts` — tipo seguro
- [ ] DT-07 investigado — resultado documentado (registrado ou dead code)
- [ ] Se DT-07 registrado: auth guard adicionado ao middleware
- [ ] `brandId` validado como obrigatório na API route
- [ ] `leadLimit` com default 50 e max 200
- [ ] Retry logic no engine.ts: exponential backoff 1s→2s→4s, max 3 retries
- [ ] Retry NÃO está no gemini.ts
- [ ] Chamadores existentes de `generateWithGemini` não afetados
- [ ] `npx tsc --noEmit` = 0

---

### S28-PS-02: Testes de contrato Gemini + Zod Schema [P0, M, ~2.5h]

**Objetivo:** Criar schema Zod formal para validação do response do Gemini e testes de contrato que validam schema, fallback e PII sanitization.

> ⚡ **[ARCH DT-03 — BLOCKING P0]:** Sem validação, JSON malformado do Gemini propaga dados corrompidos. O schema Zod é o **artefato central** dos testes de contrato (Ressalva R2 do Conselho).

**Arquivos:**
- `app/src/lib/intelligence/personalization/schemas/audience-scan-schema.ts` — **CRIAR**
- `app/src/lib/intelligence/personalization/engine.ts` — **MODIFICAR** (usar safeParse)
- `app/src/__tests__/lib/intelligence/personalization/audience-scan-contract.test.ts` — **CRIAR**

**Ação:**

#### 1. Criar schema Zod (`audience-scan-schema.ts`):
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

#### 2. Usar safeParse no engine.ts:
```typescript
const parsed = AudienceScanResponseSchema.safeParse(JSON.parse(aiResponse));
if (!parsed.success) {
  console.error('[DeepScan] Gemini response validation failed:', parsed.error);
  return FALLBACK_SCAN_RESPONSE;
}
const result = parsed.data;
```
- Definir `FALLBACK_SCAN_RESPONSE` com valores seguros e defaults

#### 3. Criar testes de contrato:
- **Schema validation:** Validar que response com campos corretos passa o schema
- **Tipos corretos:** `sophisticationLevel` inteiro 1-5, `score` 0-1
- **Fallback:** Gemini retorna JSON inválido → engine retorna fallback
- **PII sanitization:** Nenhum email/nome/IP/telefone no prompt construído por `audience-scan.ts` — **OBRIGATÓRIO per Ressalva R2**

> **[ARCH AR-03]:** Verificar se Zod já está no `package.json`. Zod é peer dependency do Next.js. Se não estiver, adicionar.

**AC:**
- [ ] `AudienceScanResponseSchema` criado com Zod
- [ ] `audience-scan-schema.ts` em `lib/intelligence/personalization/schemas/`
- [ ] `engine.ts` usa `safeParse` + fallback (não mais parse sem validação)
- [ ] `FALLBACK_SCAN_RESPONSE` definido com valores seguros
- [ ] Teste: schema validation com dados corretos → passa
- [ ] Teste: tipos incorretos (ex: sophisticationLevel > 5) → falha
- [ ] Teste: JSON inválido → fallback retornado
- [ ] Teste: PII sanitization no prompt (ausência de email/nome/IP)
- [ ] Zod no `package.json` (verificar/adicionar)
- [ ] `npx tsc --noEmit` = 0

---

### S28-PS-03: Propensity Engine hot/warm/cold [P1, M, ~2h]

**Objetivo:** Fortalecer `lib/intelligence/personalization/propensity.ts` com scoring normalizado, bônus de recência, penalidade de inatividade e segmentação.

**Arquivo afetado:**
- `app/src/lib/intelligence/personalization/propensity.ts` — **MODIFICAR**

**Ação:**
1. **Score normalizado 0-1** com pesos por tipo de evento:
   - `page_view`: 0.1
   - `click`: 0.2
   - `form_submit`: 0.5
   - `purchase`: 1.0
   - (definir tabela de pesos conforme tipos disponíveis)
2. **Bônus de recência:** Eventos < 24h recebem multiplicador (ex: 1.5x)
3. **Penalidade de inatividade:** Último evento > 7 dias → penalidade (ex: 0.5x)
4. **Segmentação:**
   - `hot`: score >= 0.7
   - `warm`: score >= 0.3
   - `cold`: score < 0.3
5. **Persistência:** Salvar segment no lead state (`brands/{brandId}/leads/{leadId}`)
6. **Testes unitários:**
   - 0 eventos → cold (score 0)
   - Eventos antigos (> 7 dias) → penalidade aplicada
   - Mix de eventos recentes → segmentação correta
   - Edge case: apenas 1 evento recente de alto valor → hot

**Arquivos de leitura (contexto):**
- `app/src/types/personalization.ts` — `LeadState`, `PropensityScore`
- `app/src/lib/intelligence/personalization/engine.ts` — Como propensity é chamado no Maestro

> **PRD P7:** NUNCA hardcodar `brandId`.

**AC:**
- [ ] Score normalizado 0-1 com pesos por tipo de evento
- [ ] Bônus de recência (< 24h) implementado
- [ ] Penalidade de inatividade (> 7 dias) implementado
- [ ] Segmentação hot/warm/cold com thresholds definidos
- [ ] Persistência do segment no lead state
- [ ] Testes unitários cobrindo edge cases: 0 eventos, eventos antigos, mix, 1 evento alto valor
- [ ] `npx tsc --noEmit` = 0

---

### S28-PS-04: Dashboard de Personalization [P1, L, ~3h]

**Objetivo:** Fortalecer `/intelligence/personalization` (page.tsx) com dados reais e states completos.

> **Ressalva R2:** PS-02 (testes contrato) DEVE estar concluída antes desta story. Schema validado garante dados confiáveis para a UI.

**Arquivo afetado:**
- `app/src/app/intelligence/personalization/page.tsx` — **MODIFICAR**

**Ação:**
1. **Listar scans recentes** (até 10) com card resumo por scan
2. **Detalhe do scan:** persona (demographics, painPoints, desires, objections, sophisticationLevel)
3. **Propensity visual:** badge hot/warm/cold com score numérico
4. **Empty state:** Mensagem orientadora quando não há scans (ex: "Execute seu primeiro scan de audiência")
5. **Loading state:** Skeleton/spinner durante carregamento
6. **Error state:** Mensagem de erro com feedback (ex: "Não foi possível carregar scans. Tente novamente.")
7. **Ação de trigger:** Botão para iniciar novo scan (chama `POST /api/intelligence/audience/scan`)
8. **Integração:** Usar hook `useIntelligence` ou hook dedicado para buscar dados

**Arquivos de leitura (contexto):**
- `app/src/lib/hooks/use-intelligence.ts` — Hook existente
- `app/src/types/personalization.ts` — `AudienceScan`, `DynamicContentRule`

> **PRD P7:** NUNCA hardcodar `brandId` — multi-tenant first.

**AC:**
- [ ] Dashboard lista scans recentes (até 10)
- [ ] Detalhe do scan mostra persona completa (demographics, painPoints, desires, objections, sophisticationLevel)
- [ ] Badge hot/warm/cold renderiza com score
- [ ] Empty state implementado
- [ ] Loading state implementado
- [ ] Error state implementado com feedback
- [ ] Botão de trigger novo scan funcional
- [ ] `npx tsc --noEmit` = 0

---

### S28-PS-05: Componentes de Scan [P1, M, ~2h]

**Objetivo:** Criar/fortalecer componentes reutilizáveis para o módulo de Personalization.

**Arquivos:**
- `app/src/components/intelligence/personalization/AudienceScanCard.tsx` — **CRIAR**
- `app/src/components/intelligence/personalization/PersonaDetailView.tsx` — **CRIAR**
- `app/src/components/intelligence/personalization/PropensityBadge.tsx` — **CRIAR**

**Ação:**

#### 1. `AudienceScanCard`
- Card de resumo do scan: data, brandId (parcial), confidence score, propensity segment
- Clicável para expandir detalhe
- Responsivo (mobile-friendly)

#### 2. `PersonaDetailView`
- Detalhe completo da persona: demographics, painPoints (lista), desires (lista), objections (lista), sophisticationLevel (1-5 visual)
- Layout limpo com seções colapsáveis

#### 3. `PropensityBadge`
- Badge visual hot (vermelho/laranja) / warm (amarelo) / cold (azul)
- Score numérico exibido
- Variações de tamanho (sm, md, lg)

#### 4. Integração
- Conectar componentes ao dashboard (PS-04)
- Usar hook `useIntelligence` ou hook dedicado

**AC:**
- [ ] `AudienceScanCard` renderiza resumo do scan
- [ ] `PersonaDetailView` mostra persona completa
- [ ] `PropensityBadge` renderiza hot/warm/cold com cores corretas
- [ ] Componentes importados e usados no dashboard (PS-04)
- [ ] `npx tsc --noEmit` = 0

---

### S28-PS-06: CRUD de Dynamic Content Rules [P2, M, ~2h] — 🔶 STRETCH

> **STRETCH:** Só implementar se Epics PS-01 a PS-05 concluídos dentro do budget de horas. Adiável para S29 sem impacto.

**Objetivo:** Implementar CRUD de regras de conteúdo dinâmico por persona.

**Arquivos:**
- `app/src/app/intelligence/personalization/page.tsx` — **MODIFICAR** (seção de rules)
- `app/src/lib/firebase/personalization-rules.ts` — **CRIAR** (ou usar path existente)

**Ação:**
1. **Criar regra:** por persona/scan com campos:
   - `headline` (obrigatório)
   - `vslId` (opcional)
   - `offerId` (opcional)
2. **Ativar/desativar** regra (toggle)
3. **Persistência:** `brands/{brandId}/personalization_rules` no Firestore
4. **UI:** Edição inline na page de Personalization

**Firestore schema:**
```typescript
{
  id: string;
  brandId: string;
  scanId: string;
  personaSegment: 'hot' | 'warm' | 'cold';
  headline: string;
  vslId?: string;
  offerId?: string;
  active: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

> **Out-of-scope:** Aplicar rules em runtime (renderização condicional) — S30+.

> **PRD P7:** NUNCA hardcodar `brandId`.

**AC:**
- [ ] Criar regra com headline obrigatório
- [ ] Toggle ativar/desativar regra
- [ ] Persistência em `brands/{brandId}/personalization_rules`
- [ ] UI de edição inline funcional
- [ ] `npx tsc --noEmit` = 0

---

## Checklist de Pré-Execução (Darllyson)

### Antes de começar qualquer story:
- [ ] Ler este arquivo (`stories.md`) por completo
- [ ] Ler `allowed-context.md` para proibições (P1-P10)
- [ ] Confirmar `npx tsc --noEmit` = 0 erros (baseline pós-Sprint 27)
- [ ] Confirmar `npm run build` compila (baseline 99 rotas)
- [ ] Executar `npm test` e confirmar baseline de 1 failure (dead test)

### Validações incrementais — Fase 1:
- [ ] Após CL-01: `npm test` — 0 failures
- [ ] Após CL-02: `contract-map.yaml` personalization_engine com engine-only paths
- [ ] Após CL-03: adapter layer testado, aggregator usa adapter
- [ ] **GATE CHECK**: `tsc` + `build` limpos + diff review CL-02/CL-03
- [ ] Após CL-05: `grep -r "NEXT_PUBLIC_ENABLE_ATTRIBUTION"` retorna 0
- [ ] Após CL-06: RAG stubs retornam valores reais

### Validações incrementais — Fase 2:
- [ ] **PRE-FLIGHT**: DT-02, DT-03, DT-07 confirmados
- [ ] Após PS-01: `generateWithGemini` aceita `systemPrompt`, `as any` removido, DT-07 documentado
- [ ] Após PS-02: Schema Zod criado, testes de contrato passando, fallback implementado
- [ ] Após PS-03: Propensity segmenta corretamente, testes edge cases passando
- [ ] Após PS-04: Dashboard renderiza scans, 3 states (empty/loading/error) implementados
- [ ] Após PS-05: Componentes renderizam corretamente

### Validação final (AMBAS as fases):
- [ ] `npx tsc --noEmit` → `Found 0 errors`
- [ ] `npm run build` → Sucesso (99+ rotas)
- [ ] `npm test` → 0 failures
- [ ] Attribution dashboard intacto (zero regressão)
- [ ] `/intelligence/personalization` renderiza com dados
- [ ] `POST /api/intelligence/audience/scan` retorna JSON válido

---
*Stories preparadas por Leticia (SM) — NETECMT v2.0*
*Incorpora 10 Decision Topics + 4 Correções de Premissa do Architecture Review (Athos)*
*Sprint 28: Hybrid Full — Cleanup & Foundations + Personalization Advance | 06/02/2026*
*Legenda: XS = Extra Small (< 30min), S = Small (< 2h), M = Medium (2-4h), L = Large (4-8h), L+ = Large Extended*
