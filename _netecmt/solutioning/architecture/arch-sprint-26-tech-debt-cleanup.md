# 🏛️ Architecture Review: Sprint 26 — Technical Debt Cleanup

**Versão:** 1.0  
**Responsável:** Athos (Architect)  
**Status:** ✅ APROVADO com Ressalvas  
**Data:** 06/02/2026  
**PRD Ref:** `_netecmt/solutioning/prd/prd-sprint-26-tech-debt-cleanup.md`  
**Stories Ref:** `_netecmt/packs/stories/sprint-26-tech-debt-cleanup/stories.md`

---

## 1. Sumário Executivo

Após análise profunda do codebase, inventário de erros e mapeamento de contratos, esta Architecture Review **APROVA** a execução do Sprint 26 com **3 ressalvas importantes** e **6 correções nas premissas** das stories que mudam a abordagem de fix.

### Descoberta Crítica

> **A maioria dos "módulos inexistentes" do inventário NÃO são inexistentes.** Os type files (`performance.ts`, `attribution.ts`, `cross-channel.ts`, `personalization.ts`, `reporting.ts`) e módulos de infraestrutura (`firebase/intelligence.ts`, `firebase/vault.ts`, `ai/embeddings.ts`, `ai/prompts/performance-advisor.ts`) **TODOS EXISTEM** no codebase. O problema real é de **paths relativos incorretos** nos imports, não de módulos faltantes.

Isso muda fundamentalmente a estratégia: em vez de criar stubs massivos, a maioria dos fixes são **correções de paths de import** (`../../types/x` → `@/types/x` ou `../../../types/x`).

---

## 2. Contract Safety Check

### 2.1 Lanes Impactadas

| Lane (contract-map.yaml) | Contrato | Status | Risco |
|:--------------------------|:---------|:-------|:------|
| `intelligence_wing` | `intelligence-storage.md` (v2.0, Active) | ⚠️ ATENÇÃO | Médio — módulos attribution e personalization tocados |
| `performance_war_room` | `performance-spec.md` (v1.0, DRAFT) | ✅ SEGURO | Baixo — apenas dead code tocado |
| `social_intelligence` | `social-api-spec.md` | ✅ SEGURO | Baixo — apenas dead code (mocks.ts, normalizer.ts) |
| `ai_retrieval` | `retrieval-contracts.md` | ✅ SEGURO | Mínimo — apenas tipagem de callbacks |
| `funnel_autopsy` | `funnel-autopsy-spec.md` | ✅ SEGURO | Mínimo — apenas imports de componentes |

### 2.2 Veredito de Contratos

**NENHUM contrato ativo será quebrado.** Justificativas:

1. **Nenhuma interface pública é alterada** — Todos os fixes são internos (paths, destructuring, tipagem).
2. **Types files recebem ADIÇÕES, nunca REMOÇÕES** — Stubs são exports novos que não conflitam com existentes.
3. **Nenhum endpoint de API muda sua assinatura** — Apenas tipagem interna de route handlers.
4. **`contract-map.yaml` permanece intocado** — Conforme PRD.

### 2.3 Anomalia Detectada (NÃO bloqueia Sprint 26)

> ⚠️ O `contract-map.yaml` mapeia `personalization_engine` para `app/src/lib/operations/personalization/**`, mas o código real de personalização está em `app/src/lib/intelligence/personalization/**`. Isso significa que o `maestro.ts` cai sob a lane `intelligence_wing`, NÃO sob `personalization_engine`. **Ação**: Registrar no backlog para Sprint 27+ a correção do contract-map.

---

## 3. Análise de Código Morto vs Código Ativo

### 3.1 CÓDIGO MORTO CONFIRMADO (0 consumers, safe to stub)

| Módulo | Consumers | Import Chain | Veredicto |
|:-------|:----------|:------------|:----------|
| `lib/intelligence/attribution/aggregator.ts` | **0** | Nenhum import externo | ✅ STUB seguro |
| `lib/intelligence/attribution/bridge.ts` | **0** | Nenhum import externo | ✅ STUB seguro |
| `lib/intelligence/attribution/overlap.ts` | **0** | Nenhum import externo | ✅ STUB seguro |
| `lib/intelligence/attribution/engine.ts` | **0** | Nenhum import externo | ✅ STUB seguro |
| `lib/performance/engine/performance-advisor.ts` | **0** | Nenhum import externo | ✅ STUB seguro |
| `lib/performance/engine/anomaly-engine.ts` | **0** | Nenhum import externo | ✅ STUB seguro |
| `lib/agents/publisher/curation-engine.ts` | **0** | Nenhum import externo | ✅ STUB seguro |
| `lib/intelligence/social/mocks.ts` | **0** | Nenhum import externo | ✅ STUB seguro |
| `lib/intelligence/social/normalizer.ts` | **0** | Nenhum import externo | ✅ STUB seguro |
| `lib/agents/trend/trend-agent.ts` | **0** | Nenhum import externo | ✅ STUB seguro |
| `lib/reporting/briefing-bot.ts` | **0** | Nenhum import externo | ✅ STUB seguro |
| `components/intelligence/sources-tab.tsx` | **0** | Nenhum import externo | ✅ STUB seguro |

### 3.2 CÓDIGO ATIVO (tem consumers, requer fix real)

| Módulo | Consumers | Fix Necessário |
|:-------|:----------|:--------------|
| `lib/intelligence/personalization/maestro.ts` | **4** (`audience/scan/route.ts`, `webhooks/dispatcher/route.ts`, `middleware.ts`, 2 tests) | Criar `LeadState` stub em `types/personalization.ts` |
| `lib/intelligence/personalization/engine.ts` | **1** (`audience/scan/route.ts`) | Verificar types — imports parecem corretos via `../../firebase/config` |
| `lib/hooks/use-attribution-data.ts` | **1** (`intelligence/attribution/page.tsx`) | Criar `CampaignAttributionStats` stub — **NÃO é dead code** |
| `lib/performance/sentry-engine.ts` | **1** (`api/performance/anomalies/route.ts`) | Já no path correto — sem ação |

### 3.3 Tipos Fantasmas (não existem nos types files)

| Tipo Importado | Arquivo de Types | Existe? | Importado por | Ação |
|:---------------|:-----------------|:--------|:-------------|:-----|
| `PerformanceMetricDoc` | `types/performance.ts` | ❌ (existe `PerformanceMetric`) | Dead code | Criar type alias: `export type PerformanceMetricDoc = PerformanceMetric` |
| `PerformanceAlertDoc` | `types/performance.ts` | ❌ (existe `PerformanceAnomaly`) | Dead code | Criar type alias: `export type PerformanceAlertDoc = PerformanceAnomaly` |
| `LeadState` | `types/personalization.ts` | ❌ | **ATIVO** (maestro.ts) | **CRIAR STUB obrigatório** |
| `CampaignAttributionStats` | Nenhum | ❌ | **ATIVO** (use-attribution-data.ts) | **CRIAR STUB em `types/attribution.ts`** |
| `AIAnalysisResult` | `types/reporting.ts` | ❌ | Dead code | Criar stub |
| `ReportMetrics` | `types/reporting.ts` | ❌ | Dead code | Criar stub |
| `MonitoringSource` | `types/intelligence.ts` | ❌ | Dead code (sources-tab.tsx) | Criar stub |
| `SemanticSearchResult` | `types/intelligence.ts` | ❌ | Dead code (trend-agent.ts) | Criar stub |

---

## 4. Correções nas Premissas das Stories

### ⚠️ Correção 1: ST-02 — O problema NÃO é "módulos inexistentes"

**Premissa original (stories.md):** "Módulos importados que não existem"

**Realidade após análise:**

| Arquivo | Import "faltante" | O módulo existe? | Problema real |
|:--------|:-----------------|:----------------|:-------------|
| `attribution/aggregator.ts` | `../config` | ❌ | `lib/intelligence/config` genuinamente não existe |
| `attribution/aggregator.ts` | `../../types/performance` | ✅ | Path errado: `../../` resolve para `lib/types/` em vez de `src/types/` |
| `attribution/bridge.ts` | `../../types/attribution` | ✅ | Path errado: idem |
| `attribution/overlap.ts` | `../../types/cross-channel` | ✅ | Path errado: idem |
| `performance-advisor.ts` | `../ai/gemini` | ✅ | Path errado: `../ai/` resolve para `performance/ai/` em vez de `lib/ai/` |
| `performance-advisor.ts` | `../ai/prompts/performance-advisor` | ✅ | Path errado: idem |
| `anomaly-engine.ts` | `../../types/performance` | ✅ | Path errado: `../../types/` resolve errado |
| `curation-engine.ts` | `../firebase/intelligence` | ✅ | Path errado: `../firebase/` resolve para `agents/firebase/` |
| `curation-engine.ts` | `../vault/pinecone-vault` | ✅ | Path errado: `../vault/` resolve para `agents/vault/` |
| `curation-engine.ts` | `../ai/embeddings` | ✅ | Path errado: `../ai/` resolve para `agents/ai/` |

**Impacto:** Para **código morto** (0 consumers), o fix é idêntico na prática (stub ou corrigir path — ambos eliminam o erro TS). Mas a **clareza** importa: o dev deve saber que o módulo existe, para evitar criar stubs desnecessários quando uma correção de path resolve.

### ⚠️ Correção 2: ST-02 — `use-attribution-data.ts` é CÓDIGO ATIVO

**Premissa:** Listado genericamente como "import faltante"  
**Realidade:** `use-attribution-data.ts` é importado por `intelligence/attribution/page.tsx`. O tipo `CampaignAttributionStats` precisa de um stub **real** em `types/attribution.ts` porque afeta uma página renderizável.

### ⚠️ Correção 3: ST-02 — `maestro.ts` precisa de fix cuidadoso

**Premissa:** Listado como "stub ou remover"  
**Realidade:** `maestro.ts` tem **4 consumers ativos** incluindo rotas de API e webhooks. O `LeadState` DEVE ser stubado em `types/personalization.ts` e o stub deve ser **minimamente funcional** (não vazio), pois o código ativo pode acessar propriedades.

### ⚠️ Correção 4: Tipos Fantasmas vs Tipos Renomeados

`PerformanceMetricDoc` e `PerformanceAlertDoc` não existem, mas `PerformanceMetric` e `PerformanceAnomaly` existem. Isso sugere uma **convenção de naming** que mudou entre sprints (sufixo `Doc` removido). O fix mais seguro é criar **type aliases**:

```typescript
// Em types/performance.ts — Aliases para compatibilidade com módulos legados
export type PerformanceMetricDoc = PerformanceMetric;
export type PerformanceAlertDoc = PerformanceAnomaly;
```

### ⚠️ Correção 5: `../config` nos módulos de attribution

O import `from '../config'` em todos os 3 módulos de attribution resolve para `lib/intelligence/config` que **genuinamente não existe**. Como são dead code, a solução mais limpa é:

```typescript
// Stub mínimo: lib/intelligence/config.ts
// TODO: Sprint XX — Módulo de configuração de intelligence não implementado
import { getFirestore } from 'firebase/firestore';
import { app } from '@/lib/firebase/config';
export const db = getFirestore(app);
```

Ou alternativamente, corrigir o import para `@/lib/firebase/config` (que é onde o `db` real vive).

### ⚠️ Correção 6: social/mocks.ts e normalizer.ts

**Premissa (stories.md):** "Redirecionar para `@/types/social-inbox`"  
**Realidade:** Ambos os tipos `social.ts` E `social-inbox.ts` existem. A decisão de para qual redirecionar depende dos types que o módulo usa. Verificar se importam `SocialInteraction` (que está em `social.ts`, não `social-inbox.ts`).

---

## 5. Decisões Técnicas

### DT-01: Stub Types vs Remoção de Módulos

| Cenário | Decisão | Justificativa |
|:--------|:--------|:-------------|
| Módulo dead code + type inexistente | **Criar stub type** | Conforme PRD: "código morto marca com TODO, não deleta" |
| Módulo dead code + path errado para módulo existente | **Corrigir path** (preferido) OU stub | Path fix é mais limpo e factual |
| Módulo ativo + type inexistente | **Criar stub type real** | OBRIGATÓRIO — afeta runtime potencial |
| Módulo dead code + config inexistente | **Criar stub config** | Menos arriscado que reescrever imports |

### DT-02: Padrão de Stub Types

Todos os stubs DEVEM seguir este padrão:

```typescript
/**
 * @stub Tipo placeholder — módulo não completamente implementado
 * @todo Implementar na Sprint XX quando o módulo for ativado
 * @see _netecmt/solutioning/architecture/arch-sprint-26-tech-debt-cleanup.md
 */
export interface LeadState {
  leadId: string;
  brandId: string;
  // TODO: Sprint XX — Expandir com campos reais quando personalização for ativada
  [key: string]: unknown; // Index signature para evitar erros de acesso
}
```

**Regras de Stub:**
- SEMPRE incluir `@stub` e `@todo` no JSDoc
- SEMPRE incluir campos obrigatórios mínimos que o consumer usa (verificar no código)
- NUNCA usar `any` — preferir `unknown` com index signature
- SEMPRE linkar ao arch review no `@see`

### DT-03: Módulos Referenciados em Contratos Ativos

| Módulo | Contrato Ativo | Referenciado no Contrato? | Ação |
|:-------|:---------------|:--------------------------|:-----|
| `lib/intelligence/attribution/*` | `intelligence-storage.md` (via path glob) | Não explicitamente | ✅ Stub seguro — contrato não menciona attribution |
| `lib/performance/engine/*` | `performance-spec.md` (DRAFT) | Sim — concepts align | ✅ Stub seguro — contrato é DRAFT |
| `lib/intelligence/personalization/maestro.ts` | `intelligence-storage.md` (via path glob) | Não explicitamente | ⚠️ Fix real — tem consumers ativos |
| `lib/intelligence/social/*` | `social-api-spec.md` | Não explicitamente | ✅ Stub seguro — zero consumers |
| `types/performance.ts` | `performance-spec.md` | Sim — schemas idênticos | ⚠️ CUIDADO — adicionar aliases, não modificar existentes |

### DT-04: Performance Types — Aliases, Não Alterações

O `types/performance.ts` está referenciado no contrato `performance-spec.md`. As interfaces `UnifiedAdsMetrics`, `PerformanceMetric`, `PerformanceAnomaly` e `PerformanceConfig` são **contratuais**.

**Regra:** APENAS adicionar exports novos. NUNCA renomear ou alterar interfaces existentes.

```typescript
// ✅ PERMITIDO — Adicionar aliases no final do arquivo
export type PerformanceMetricDoc = PerformanceMetric;
export type PerformanceAlertDoc = PerformanceAnomaly;

// ❌ PROIBIDO — Renomear interface existente
// export interface PerformanceMetricDoc { ... } // substituindo PerformanceMetric
```

---

## 6. Mapa de Risco de Regressão

### 6.1 Tier 1 — Risco de Regressão: BAIXO ✅

| Story | Ação | Risco | Mitigação |
|:------|:-----|:------|:----------|
| ST-01 | Destructuring → assignment direto | Muito Baixo | Mesmo valor, diferente acesso |
| ST-02 | Path fixes + stubs | Baixo | Dead code na maioria; 2 arquivos ativos precisam stubs reais |
| ST-03 | `params` → `Promise<params>` | Muito Baixo | Padrão Next.js 15 documentado |

### 6.2 Tier 2 — Risco de Regressão: MÉDIO ⚠️

| Story | Ação | Risco | Mitigação |
|:------|:-----|:------|:----------|
| ST-04 | Stub/remover imports mortos | Baixo | Testes que nunca rodavam continuarão sem rodar |
| ST-05 | Atualizar mocks | **Médio** | Mocks incorretos podem expor bugs reais nos testes |
| ST-06 | Remover `.ts` de imports | Muito Baixo | Operação textual trivial |
| ST-07 | Fix tipos em legados | **Médio-Alto** | 61 erros em 25+ arquivos — maior superfície de mudança |

**ST-07 é a story mais arriscada da sprint.** Recomendo:
- Subdividir em sub-batches por módulo (attribution, offer, funnels, etc.)
- `tsc --noEmit` após CADA sub-batch, não apenas no final da story
- Manter PR separado ou commit granular por módulo

### 6.3 Tier 3 — Risco de Regressão: BAIXO ✅

| Story | Ação | Risco | Mitigação |
|:------|:-----|:------|:----------|
| ST-08 | Framer-motion fixes | Muito Baixo | Apenas casting de tipos |
| ST-09 | Implicit any → tipos explícitos | Muito Baixo | Anotação, não lógica |
| ST-10 | Imports de ícones | Muito Baixo | Adicionar import statements |
| ST-11 | Miscellaneous | Baixo | Isolados por natureza |

---

## 7. Validação de Proibições (Allowed Context)

### 7.1 Proibições Existentes — SUFICIENTES? ⚠️ Parcialmente

| # | Proibição Atual | Avaliação |
|:--|:---------------|:----------|
| 1 | NUNCA alterar lógica de negócio | ✅ Suficiente |
| 2 | NUNCA remover funcionalidade | ✅ Suficiente |
| 3 | NUNCA alterar `contract-map.yaml` | ✅ Suficiente |
| 4 | NUNCA alterar tipos Sprint 25 | ✅ Suficiente |
| 5 | NUNCA introduzir novos erros | ✅ Suficiente |
| 6 | Código morto: TODO em vez de deletar | ✅ Suficiente |

### 7.2 Proibições FALTANTES — Recomendações

| # | Nova Proibição Recomendada | Justificativa |
|:--|:--------------------------|:-------------|
| 7 | **NUNCA alterar exports existentes em type files** — apenas ADICIONAR novos | `types/performance.ts` e `types/attribution.ts` têm interfaces contratuais. Adicionar aliases é seguro; alterar assinaturas existentes não é. |
| 8 | **NUNCA criar stubs com `any`** — usar `unknown` com index signature | Manter strict mode efetivo mesmo em stubs |
| 9 | **NUNCA converter paths relativos para `@/` aliases em módulos dead code** que não serão tocados por outros fixes | Reduz surface de mudança desnecessária; se é dead code, stub mínimo resolve |
| 10 | **NUNCA alterar `types/social-inbox.ts`** | Usado ativamente por módulos de social command center que funcionam |
| 11 | **Para ST-07: commitar por sub-módulo** e rodar `tsc --noEmit` após cada commit | Maior story da sprint (61 erros) — granularidade protege rollback |

---

## 8. Inventário de Stubs Necessários

### 8.1 Stubs em Types Files Existentes

```yaml
# types/performance.ts — ADICIONAR ao final (NÃO alterar existentes)
stubs:
  - name: PerformanceMetricDoc
    type: type alias → PerformanceMetric
    consumers: [performance-advisor.ts (dead), anomaly-engine.ts (dead)]
    risk: none

  - name: PerformanceAlertDoc  
    type: type alias → PerformanceAnomaly
    consumers: [performance-advisor.ts (dead), anomaly-engine.ts (dead)]
    risk: none

# types/attribution.ts — ADICIONAR ao final
stubs:
  - name: CampaignAttributionStats
    type: interface stub com campos mínimos
    consumers: [use-attribution-data.ts (ATIVO → attribution/page.tsx)]
    risk: LOW — verificar quais campos o consumer acessa

# types/personalization.ts — ADICIONAR ao final
stubs:
  - name: LeadState
    type: interface stub com campos mínimos
    consumers: [maestro.ts (ATIVO → 4 consumers)]
    risk: MEDIUM — verificar quais campos maestro.ts acessa antes de stubbar

# types/reporting.ts — ADICIONAR ao final
stubs:
  - name: AIAnalysisResult
    type: interface stub genérico
    consumers: [briefing-bot.ts (dead)]
    risk: none

  - name: ReportMetrics
    type: interface stub genérico  
    consumers: [briefing-bot.ts (dead)]
    risk: none

# types/intelligence.ts — ADICIONAR ao final
stubs:
  - name: MonitoringSource
    type: interface stub genérico
    consumers: [sources-tab.tsx (dead)]
    risk: none

  - name: SemanticSearchResult
    type: interface stub genérico
    consumers: [trend-agent.ts (dead)]
    risk: none
```

### 8.2 Novo Módulo de Config (Opção A — Preferida)

```yaml
# lib/intelligence/config.ts — NOVO ARQUIVO
purpose: Re-export de db do firebase/config para módulos de intelligence
consumers: [attribution/aggregator.ts, attribution/bridge.ts, attribution/overlap.ts] (todos dead code)
content: |
  // TODO: Sprint XX — Módulo de configuração dedicado para intelligence
  // Re-export temporário para compatibilidade com módulos legados
  export { db } from '@/lib/firebase/config';
risk: none — todos os consumers são dead code
```

**Opção B (Alternativa):** Corrigir os imports nos 3 arquivos de attribution para apontar direto para `@/lib/firebase/config`. Ambas são válidas; Opção A minimiza a superfície de mudança.

---

## 9. Diagrama de Dependências Impactadas

```
┌─────────────────────────────────────────────────────────────────┐
│                    SPRINT 26 — IMPACT MAP                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌── TIER 1 (Runtime) ─────────────────────────────────────┐    │
│  │                                                          │    │
│  │  [ATIVO] intelligence/creative/page.tsx ──→ useActiveBrand│    │
│  │  [ATIVO] hooks/use-intelligence.ts ──→ useActiveBrand    │    │
│  │  [ATIVO] hooks/use-attribution-data.ts ──→ useActiveBrand│    │
│  │           └──→ CampaignAttributionStats (PHANTOM TYPE)   │    │
│  │  [ATIVO] api/journey/[leadId]/route.ts ──→ Promise<params>│   │
│  │                                                          │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ┌── TIER 2 (Dead Code) ───────────────────────────────────┐    │
│  │                                                          │    │
│  │  [DEAD] attribution/aggregator ──→ ../config (MISSING)   │    │
│  │  [DEAD] attribution/bridge ──→ ../config (MISSING)       │    │
│  │  [DEAD] attribution/overlap ──→ ../config (MISSING)      │    │
│  │  [DEAD] performance/advisor ──→ ../ai/gemini (WRONG PATH)│    │
│  │  [DEAD] performance/anomaly ──→ ../../types (WRONG PATH) │    │
│  │  [DEAD] curation-engine ──→ ../firebase/* (WRONG PATH)   │    │
│  │  [DEAD] social/mocks,normalizer ──→ ../../types/social   │    │
│  │  [DEAD] trend-agent ──→ SemanticSearchResult (PHANTOM)   │    │
│  │  [DEAD] briefing-bot ──→ AIAnalysisResult (PHANTOM)      │    │
│  │  [DEAD] sources-tab ──→ MonitoringSource (PHANTOM)       │    │
│  │                                                          │    │
│  │  ⚠️ EXCEÇÃO ATIVA NO TIER 2:                            │    │
│  │  [ATIVO] personalization/maestro ──→ LeadState (PHANTOM) │    │
│  │      └── Consumers: audience/scan, webhooks, middleware   │    │
│  │                                                          │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ┌── CONTRATOS TOCADOS ────────────────────────────────────┐    │
│  │                                                          │    │
│  │  intelligence-storage.md (v2.0, Active) ── APENAS ADIÇÕES│    │
│  │  performance-spec.md (v1.0, DRAFT) ── APENAS ALIASES     │    │
│  │  social-api-spec.md ── NÃO TOCADO                       │    │
│  │  contract-map.yaml ── NÃO TOCADO                        │    │
│  │                                                          │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 10. Checklist de Pré-Execução (para Darllyson)

### Antes de começar qualquer fix:

- [ ] **Ler este architecture review por completo**
- [ ] **Verificar quais campos `maestro.ts` acessa de `LeadState`** antes de criar o stub
- [ ] **Verificar quais campos `use-attribution-data.ts` acessa de `CampaignAttributionStats`** antes de criar o stub
- [ ] **Confirmar que `tsc --noEmit` retorna exatamente 161 erros** (baseline)

### Após cada Tier:

- [ ] `npx tsc --noEmit` — contar erros restantes
- [ ] `git diff --stat` — verificar que apenas arquivos esperados mudaram
- [ ] Nenhum arquivo de contrato ou `contract-map.yaml` foi modificado

### Após conclusão:

- [ ] `npx tsc --noEmit` → `Found 0 errors`
- [ ] `npm test` — sem regressão
- [ ] Contagem de `@ts-ignore` / `@ts-expect-error` igual ou menor que antes
- [ ] Todos os stubs têm `// TODO: Sprint XX` e `@stub` no JSDoc

---

## 11. Ressalvas da Aprovação

### Ressalva 1: ST-07 precisa de granularidade

A story ST-07 (61 erros em 25+ arquivos) é a maior superfície de mudança. **Recomendação mandatória:** subdividir em commits por sub-módulo e rodar `tsc` após cada um.

### Ressalva 2: Stubs de tipos ativos devem ser verificados

Antes de criar stubs para `LeadState` e `CampaignAttributionStats`, o dev DEVE verificar no código consumer quais propriedades são acessadas, para que o stub seja funcional e não apenas cosmético.

### Ressalva 3: Backlog item para contract-map

A discrepância `personalization_engine` path vs realidade (`operations/personalization` vs `intelligence/personalization`) deve ser registrada como item de backlog para Sprint 27+.

---

## 12. Registro de Decisão Arquitetural

| Campo | Valor |
|:------|:------|
| **ID** | ADR-S26-001 |
| **Data** | 06/02/2026 |
| **Decisor** | Athos (Architect) |
| **Contexto** | 161 erros TS em 73 arquivos; stories propostas assumem módulos inexistentes |
| **Descoberta** | Maioria dos "módulos inexistentes" existem — problema é de import paths |
| **Decisão** | Aprovar sprint com 6 correções de premissa e 5 novas proibições |
| **Alternativa rejeitada** | Aceitar premissas das stories como estão — geraria stubs desnecessários |
| **Consequências** | Stories ST-02 e ST-07 ganham clareza; dev ganha confiança para fix vs stub |

---

*Architecture Review por Athos (Architect) — NETECMT v2.0*  
*Sprint 26: Technical Debt Cleanup | 06/02/2026*  
*Status: ✅ APROVADO com 3 Ressalvas*
