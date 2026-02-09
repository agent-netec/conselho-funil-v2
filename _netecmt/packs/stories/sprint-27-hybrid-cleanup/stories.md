# Stories Distilled: Sprint 27 — Hybrid (Backlog Cleanup + Attribution Revival)
**Preparado por:** Leticia (SM)
**Data:** 06/02/2026
**Lane:** cross-cutting (intelligence_wing + test infra + contract hygiene)

> **IMPORTANTE:** Este documento incorpora as **6 correções de premissa** e **6 proibições adicionais** do Architecture Review (Athos). Cada correção está marcada com `[ARCH REVIEW]`.

---

## Epic 1: Test Infrastructure Fix [P1]

### S27-ST-01: Fix 6 testes com env vars ausentes [P1, M]

**Objetivo:** 6 testes falham porque dependem de variáveis de ambiente (`NEXT_PUBLIC_FIREBASE_API_KEY`, `GOOGLE_AI_API_KEY`, etc.) que não existem no ambiente de teste.

**Ação:**
1. Criar `app/.env.test` com valores mock para todas as env vars necessárias:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=test-api-key-mock
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=test.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=test-project
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=test.appspot.com
   GOOGLE_AI_API_KEY=test-gemini-key-mock
   PINECONE_API_KEY=test-pinecone-key-mock
   ```
2. Para testes que precisam do serviço real (não apenas env var), adicionar `describe.skipIf(!process.env.X)` condicional.

**Arquivos afetados:**
- `app/.env.test` (CRIAR)
- Testes que falhavam por env vars ausentes (6 arquivos — identificar via `npm test`)

**AC:**
- [ ] `.env.test` criado com todos os mocks necessários
- [ ] 6 testes de env vars resolvidos (passam ou skip condicional)
- [ ] Count de failures: 13 → ~7

**Dependência:** Executar APÓS ST-04 (Jest config).

---

### S27-ST-02: Fix 5 testes com mocks desatualizados [P1, M]

**Objetivo:** 5 testes têm mocks que não correspondem mais às interfaces atuais pós-Sprint 26.

**Arquivos afetados:**
- `app/src/__tests__/hooks/use-brands.test.ts` — Mock `Brand` incompleto
- `app/src/lib/agents/spy/__tests__/ethical-guardrails.test.ts` — `socialMedia` faltante em `CompetitorProfile`
- `app/src/__tests__/lib/automation/maestro-flow.test.ts` — `metadata` não existe em tipo
- `app/src/app/api/assets/metrics/route.test.ts` — Interface desatualizada
- `app/src/app/api/intelligence/keywords/__tests__/route.test.ts` — Interface desatualizada

**Ação:** Atualizar mocks para alinhar com interfaces atuais. Verificar cada tipo importado e completar campos obrigatórios.

> **[ARCH REVIEW — Risco Médio]:** Se a atualização de um mock expõe um bug real no módulo, **DOCUMENTAR** o finding mas NÃO corrigir a lógica do módulo. Apenas ajustar o mock. Bugs reais ficam como backlog Sprint 28.

**AC:**
- [ ] 5 test files com mocks atualizados
- [ ] Se bug real encontrado: documentado como finding (NÃO corrigido)
- [ ] `npx tsc --noEmit` = 0 nos arquivos de teste

---

### S27-ST-03: Fix 2 testes com stubs TODO [P1, S]

**Objetivo:** `rag.test.ts` espera implementação de `keywordMatchScore` e `generateLocalEmbedding` que são stubs (retornam 0/valor dummy).

**Arquivo afetado:**
- `app/src/__tests__/lib/ai/rag.test.ts`

**Ação:** Ajustar expectativas dos testes para refletir valores de stub (retornam 0). NÃO implementar as funções reais — fora de escopo (stubs de RAG ficam para Sprint 28).

> **PRD — P5:** NUNCA remover stubs que não são do escopo attribution.

**AC:**
- [ ] Testes ajustados para aceitar valores de stub
- [ ] 0 erros nos 2 testes

---

### S27-ST-04: Configurar Jest para excluir Playwright [P2, S]

**Objetivo:** Playwright specs em `tests/smoke/` são coletados pelo Jest runner, gerando colisão e 1 failure falso positivo.

**Arquivo afetado:**
- `app/jest.config.js` (ou `jest.config.ts`)

**Ação:** Adicionar `testPathIgnorePatterns: ['/node_modules/', 'tests/smoke']` no Jest config.

> **[ARCH REVIEW — Confirmado]:** Jest config atual não tem nenhum ignore pattern. Fix direto.

**AC:**
- [ ] `npm test` NÃO lista `api-smoke.spec.ts` na suite
- [ ] Count de failures: 14 → 13 (Playwright removido)

**EXECUTAR PRIMEIRO** — esta story é o ponto de partida da Frente 1.

---

## Epic 2: Contract & Type Hygiene [P2]

### S27-ST-05: Corrigir `contract-map.yaml` personalization path [P2, S]

**Objetivo:** `contract-map.yaml` mapeia `personalization_engine` para `app/src/lib/operations/personalization/**`, mas o código real está em `app/src/lib/intelligence/personalization/**`.

**Arquivo afetado:**
- `_netecmt/core/contract-map.yaml`

**Ação:** Mudança cirúrgica — alterar APENAS o value do path:
- **De:** `operations/personalization/**`
- **Para:** `intelligence/personalization/**`

> **PRD — P7:** NUNCA alterar o formato do YAML — apenas corrigir o path.

**AC:**
- [ ] Diff mostra APENAS mudança de `operations/personalization/**` → `intelligence/personalization/**`
- [ ] NENHUMA outra alteração no YAML
- [ ] Validação: path agora resolve para `maestro.ts` (4 consumers ativos)

---

### S27-ST-06: Resolver `@ts-ignore` em 5 MCP adapters [P3, M]

**Objetivo:** 5 `@ts-ignore` nos MCP adapters seguem o mesmo padrão (`window.mcp`).

**Arquivos afetados:**
- `app/src/lib/mcp/adapters/bright-data.ts`
- `app/src/lib/mcp/adapters/glimpse.ts`
- `app/src/lib/mcp/adapters/firecrawl.ts`
- `app/src/lib/mcp/adapters/exa.ts`
- `app/src/lib/mcp/adapters/browser.ts`

**Ação:**
1. **Criar** `app/src/types/mcp-global.d.ts`:
   ```typescript
   declare global {
     interface Window {
       mcp?: {
         callTool: (server: string, tool: string, args: Record<string, unknown>) => Promise<unknown>;
       };
     }
   }
   export {};
   ```
2. Remover `@ts-ignore` em cada adapter, um por vez.
3. Se tipo global não resolver completamente, substituir por `@ts-expect-error` com justificativa.
4. Rodar `npx tsc --noEmit` após cada adapter.

> **PRD — P8:** NUNCA alterar a lógica de chamada do adapter — apenas adicionar tipos.
> **[ARCH REVIEW — DT-04]:** Fix recomendado é tipo global para `Window.mcp`.

**AC:**
- [ ] `types/mcp-global.d.ts` criado
- [ ] `@ts-ignore` count ≤ 3 (≥ 2 removidos)
- [ ] Lógica de chamada dos adapters INALTERADA
- [ ] `npx tsc --noEmit` = 0

---

## Epic 3: Attribution Module Activation [P1]

### S27-ST-07: Completar tipo `CampaignAttributionStats` [P1, XS]

**Objetivo:** Remover marcação `@stub` do tipo `CampaignAttributionStats` em `types/attribution.ts`.

> **[ARCH REVIEW — Correção 3]:** O stub criado na Sprint 26 **já contém todos os campos corretos** que o hook e a page acessam (`campaignName`, `spend`, `conversions`, `roi`, `variation`). NÃO é necessário adicionar campos novos. Apenas remover tags.

**Arquivo afetado:**
- `app/src/types/attribution.ts`

**Ação:**
1. Remover `@stub`, `@todo`, `@see` do JSDoc de `CampaignAttributionStats`
2. NÃO alterar os campos — já estão corretos
3. Manter `[key: string]: unknown` por segurança (extensibilidade)

> **PRD — P2:** NUNCA remover exports existentes de `types/attribution.ts`.

**AC:**
- [ ] `@stub` removido de `CampaignAttributionStats`
- [ ] Campos NÃO alterados (verificar diff)
- [ ] Exports existentes preservados (`AttributionModel`, `AttributionPoint`, etc.)
- [ ] `npx tsc --noEmit` = 0

---

### S27-ST-08: Expandir `config.ts` para attribution [P1, XS]

**Objetivo:** Adicionar constantes de coleção ao `lib/intelligence/config.ts` para facilitar referência.

> **[ARCH REVIEW — Correção 4]:** O `config.ts` já funciona — exporta `{ db }` e é o único import usado pelos 3 módulos attribution (`bridge.ts`, `aggregator.ts`, `overlap.ts`). A expansão é **nice-to-have**, não bloqueante.

**Arquivo afetado:**
- `app/src/lib/intelligence/config.ts`

**Ação:**
1. Manter re-export de `db` **intocado**
2. Adicionar constantes de coleção (aditivas):
   ```typescript
   // Collection constants for attribution
   export const COLLECTIONS = {
     ATTRIBUTION_BRIDGES: 'attribution_bridges',
     EVENTS: 'events',
     TRANSACTIONS: 'transactions',
     CROSS_CHANNEL_METRICS: 'cross_channel_metrics',
     PERFORMANCE_METRICS: 'performance_metrics',
   } as const;
   ```

**AC:**
- [ ] Re-export de `db` preservado
- [ ] Constantes adicionadas (NÃO substituídas)
- [ ] `npx tsc --noEmit` = 0

---

### S27-ST-09: Conectar spend data no hook [P1, L]

**Objetivo:** `use-attribution-data.ts` atualmente seta `spend: 0`. Conectar a dados reais de spend.

> **[ARCH REVIEW — Correção 5, CRÍTICA]:** O aggregator espera `PerformanceMetricDoc` (campo `platform`, sub-objeto `metrics`), mas Firestore usa `PerformanceMetric` (campo `source`, sub-objeto `data`). **NÃO usar aggregator diretamente — causará runtime errors.**
>
> **Decisão Técnica DT-02:** Opção A (hook direto) — buscar spend diretamente da collection `performance_metrics` com mapping manual no hook.

**Arquivo afetado:**
- `app/src/lib/hooks/use-attribution-data.ts`

**Ação (Opção A — Hook Direto):**
1. No hook, buscar spend da collection `performance_metrics` (subcoleção de brand):
   ```typescript
   const metricsRef = collection(db, 'brands', activeBrand.id, 'performance_metrics');
   ```
2. Mapear `PerformanceMetric.data.spend` para `CampaignAttributionStats.spend`
3. Agrupar por campaign usando UTM ↔ campaign name mapping
4. **Se coleção vazia:** fallback visual "Sem dados de spend" (NÃO hardcoded 0)

> **PRD — P1:** NUNCA alterar lógica de negócio dos módulos core attribution. **Esclarecimento (Arch Review):** o hook NÃO é módulo core — pode ser alterado.
> **NOVA P12:** Se dados reais não existirem, usar fallback visual em vez de 0 hardcoded.

**Arquivos de leitura (contexto):**
- `app/src/types/performance.ts` — Schema `PerformanceMetric` (fonte real)
- `app/src/lib/intelligence/attribution/aggregator.ts` — **APENAS LEITURA** (não usar diretamente)

**AC:**
- [ ] Hook busca spend de `performance_metrics` (NÃO via aggregator)
- [ ] `spend` não é mais hardcoded 0
- [ ] Fallback visual quando coleção vazia
- [ ] Módulos core attribution (engine, bridge, aggregator, overlap) INALTERADOS
- [ ] `npx tsc --noEmit` = 0

---

### S27-ST-10: Wiring — registrar consumers para módulos attribution [P1, L]

**Objetivo:** Conectar módulos attribution dead code a consumers reais.

> **[ARCH REVIEW — Correções 1 e 2]:** Escopo REDUZIDO:
> - `engine.ts` — **JÁ WIRED** via `use-attribution-data.ts` → `page.tsx`. **PULAR.**
> - `overlap.ts` — **SEMI-WIRED** via `budget-optimizer.ts` (0 consumers dele). Expor via API.
> - `bridge.ts` — **DEAD CODE**. Criar consumer (rota API).
> - `aggregator.ts` — **DEAD CODE** + schema mismatch. Criar consumer mínimo (adapter simples ou rota com mapping).

**Ação por módulo:**

#### A) `engine.ts` — NENHUMA AÇÃO
Já ativo via hook. Skip.

#### B) `bridge.ts` — Criar rota API isolada
**Criar:** `app/src/app/api/intelligence/attribution/sync/route.ts`
- Consumer server-side para `AttributionBridgeService`
- Endpoint: `POST /api/intelligence/attribution/sync`
- Request: `{ brandId: string, days?: number }`
- Response: `{ success: true, data: { synced: number } }` ou `{ error: string }`
- Seguir padrão envelope existente (P14)

> **NOVA P11:** NUNCA injetar attribution consumers em pipelines existentes (chat, ingest, social). Criar rotas isoladas.

#### C) `aggregator.ts` — Consumer com adapter mínimo
**Criar:** `app/src/app/api/intelligence/attribution/stats/route.ts`
- Consumer server-side para `CrossChannelAggregator`
- Endpoint: `GET /api/intelligence/attribution/stats?brandId=X&days=30`
- Response: `{ success: true, data: { stats: CampaignAttributionStats[], meta: { processed: number } } }`
- **Se schema mismatch impedir:** criar adapter mínimo inline ou usar os dados do hook (ST-09) como fallback
- NÃO alterar lógica interna do `aggregator.ts` (P1)

#### D) `overlap.ts` — Expor via budget-optimizer
**Criar:** `app/src/app/api/intelligence/attribution/overlap/route.ts`
- Consumer para `ChannelOverlapAnalyzer` (via `budget-optimizer.ts` ou direto)
- Endpoint: `GET /api/intelligence/attribution/overlap?brandId=X`
- Response: `{ success: true, data: { overlaps: ChannelOverlapDoc[] } }`

**Arquivos NOVOS:**
- `app/src/app/api/intelligence/attribution/sync/route.ts`
- `app/src/app/api/intelligence/attribution/stats/route.ts`
- `app/src/app/api/intelligence/attribution/overlap/route.ts`

**Arquivos de LEITURA (contexto, NÃO modificar):**
- `app/src/lib/intelligence/attribution/engine.ts`
- `app/src/lib/intelligence/attribution/bridge.ts`
- `app/src/lib/intelligence/attribution/aggregator.ts`
- `app/src/lib/intelligence/attribution/overlap.ts`

> **NOVA P14:** Novas rotas API DEVEM seguir padrão envelope: `{ success: true, data: {...} }` ou `{ error: string, code: string }`.

**AC:**
- [ ] `engine.ts` — 0 alterações (já wired)
- [ ] `bridge.ts` — ≥ 1 consumer registrado (rota `/sync`)
- [ ] `aggregator.ts` — ≥ 1 consumer registrado (rota `/stats`)
- [ ] `overlap.ts` — ≥ 1 consumer registrado (rota `/overlap`)
- [ ] `grep -r "import.*from.*attribution"` retorna consumers reais para cada módulo
- [ ] Lógica interna dos 4 módulos core INALTERADA
- [ ] Rotas seguem padrão envelope
- [ ] `npx tsc --noEmit` = 0

---

### S27-ST-11: Verificar e testar page de Attribution [P1, M]

**Objetivo:** Validar que `/intelligence/attribution` renderiza com dados reais (ou seed) e que todo o pipeline funciona end-to-end.

**Arquivo afetado:**
- `app/src/app/intelligence/attribution/page.tsx` (possíveis ajustes de UI)

> **[ARCH REVIEW — Ressalva 4]:** Se coleções Firestore estiverem vazias, criar dados seed. Sem seed, validação impossível.

**Ação:**
1. Acessar `/intelligence/attribution` no browser
2. Verificar que model comparison funciona (Last Click, U-Shape, Linear, Time Decay)
3. Verificar bar chart renderiza com dados
4. Verificar tabela de performance mostra campaigns
5. Verificar cards de "Valor Oculto" / "Hidden Value" com variação correta
6. Verificar zero erros no console
7. Se necessário: criar script de seed ou dados mock em Firestore
8. Corrigir qualquer issue de UI encontrado (menor)

**AC:**
- [ ] `/intelligence/attribution` renderiza sem erros
- [ ] Gráfico mostra dados (pode ser seed)
- [ ] Tabela mostra modelos: Last Click, U-Shape, Linear
- [ ] Card "Valor Oculto" aparece com variação
- [ ] 0 erros no console do browser
- [ ] Screenshot salva para QA

---

## Epic 4: Attribution Stubs Resolution [P2]

### S27-ST-12: Resolver stubs TODO em módulos attribution [P2, XS]

**Objetivo:** Remover stubs marcados com TODO que eram dependência da attribution.

> **[ARCH REVIEW — Correções 3 e 4]:** Esforço mínimo — a maior parte já foi resolvida por ST-07 e ST-08.

**Arquivo afetado:**
- `app/src/types/attribution.ts` — Já resolvido por ST-07 (remover @stub)
- `app/src/lib/intelligence/config.ts` — Já resolvido por ST-08 (expandir config)
- Qualquer outro stub attribution restante

**Ação:**
1. Verificar se existem stubs TODO restantes nos módulos attribution
2. Se ST-07 e ST-08 já resolveram tudo, marcar como concluído
3. Contabilizar redução de BKL-04 (9 stubs → ≤ 5)

> **PRD — P5:** NUNCA remover stubs que NÃO são do escopo attribution. Stubs de RAG (`keywordMatchScore`, `generateLocalEmbedding`, `hashString`) e assets panel permanecem TODO.

**AC:**
- [ ] 0 stubs `@stub` em tipos attribution
- [ ] BKL-04 count: 9 → ≤ 5 (4 attribution resolvidos)
- [ ] Stubs NÃO-attribution preservados com `// TODO: Sprint XX`
- [ ] `npx tsc --noEmit` = 0

---

## Checklist de Pré-Execução (Darllyson)

### Antes de começar qualquer fix:
- [ ] Ler este arquivo (`stories.md`) por completo
- [ ] Ler `allowed-context.md` para proibições
- [ ] Confirmar `npx tsc --noEmit` = 0 erros (baseline pós-Sprint 26)
- [ ] Confirmar `npm run build` compila (baseline)
- [ ] Executar `npm test` e confirmar baseline de 14 failures

### Validações incrementais:
- [ ] Após ST-04: `npm test` NÃO lista Playwright specs
- [ ] Após ST-01: failures de env var resolvidas
- [ ] Após ST-06: `@ts-ignore` ≤ 3
- [ ] Após ST-07: `@stub` removido de `CampaignAttributionStats`
- [ ] Após ST-09: spend NÃO é mais 0 hardcoded
- [ ] Após ST-10: `grep -r "import.*from.*attribution"` mostra consumers reais

### Validação final (AMBAS as frentes):
- [ ] `npx tsc --noEmit` → `Found 0 errors`
- [ ] `npm run build` → Sucesso (96+ rotas)
- [ ] `npm test` → ≤ 2 failures (env-dependent aceitos)
- [ ] `grep -r "@ts-ignore" --include="*.ts" app/src/` → ≤ 3
- [ ] `grep -r "@stub" --include="*.ts" app/src/types/attribution.ts` → 0
- [ ] Attribution page acessível e renderiza dados

---
*Stories preparadas por Leticia (SM) — NETECMT v2.0*
*Incorpora 6 correções de premissa + 6 proibições do Architecture Review (Athos)*
*Sprint 27: Hybrid — Backlog Cleanup + Attribution Revival | 06/02/2026*
*Legenda: XS = Extra Small (< 30min), S = Small (< 2h), M = Medium (2-4h), L = Large (4-8h)*
