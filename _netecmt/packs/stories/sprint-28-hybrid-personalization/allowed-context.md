# Allowed Context: Sprint 28 — Hybrid Full (Cleanup & Foundations + Personalization Advance)
**Lanes:** personalization_engine + intelligence_wing + ai_retrieval + performance_war_room + core
**Preparado por:** Leticia (SM)
**Data:** 06/02/2026

> Incorpora proibições do PRD (P1–P10) e Decision Topics do Architecture Review (DT-01 a DT-10).

---

## Contexto Global

### Leitura Obrigatória (antes de qualquer story)
- `_netecmt/packs/stories/sprint-28-hybrid-personalization/stories.md` — Stories, ACs e checklist
- `_netecmt/packs/stories/sprint-28-hybrid-personalization/story-pack-index.md` — Ordem de execução, estimativas, DTs
- `_netecmt/solutioning/architecture/arch-sprint-28.md` — Architecture Review completo (10 DTs, 3 Blocking)

### Referência de Tipos (LEITURA, NÃO MODIFICAR exceto se listado nas stories)
- `app/src/types/personalization.ts` — `AudienceScan`, `DynamicContentRule`, `LeadState`, `PropensityScore`
- `app/src/types/performance.ts` — **LEITURA APENAS** (schemas `PerformanceMetric` e `PerformanceMetricDoc`)
- `app/src/types/attribution.ts` — **LEITURA APENAS** (produção estável S27)
- `app/src/types/intelligence.ts` — LEITURA
- `app/src/types/database.ts` — LEITURA
- `app/src/types/context.ts` — LEITURA

### Tipos INTOCÁVEIS (Sprint 25 — produção estável)
- `app/src/types/prediction.ts` — **PROIBIDO** (P3)
- `app/src/types/creative-ads.ts` — **PROIBIDO** (P3)
- `app/src/types/text-analysis.ts` — **PROIBIDO** (P3)

---

## Epic 1: Cleanup & Foundations — Fase 1 (S28-CL-01 a CL-06)

### S28-CL-01: Remover dead test

| Arquivo | Ação |
|:--------|:-----|
| `app/src/app/api/ingest/__tests__/process.test.ts` | **DELETAR** |

### S28-CL-02: Fix contract-map + Lane Ownership (DT-01)

| Arquivo | Ação |
|:--------|:-----|
| `_netecmt/core/contract-map.yaml` | **MODIFICAR** — fix paths personalization_engine (Opção A), adicionar comentário intelligence_wing |

**Leitura:**
- `_netecmt/core/contract-map.yaml` — Verificar estado atual antes de editar

### S28-CL-03: Adapter layer aggregator (DT-04)

| Arquivo | Ação |
|:--------|:-----|
| `app/src/lib/intelligence/attribution/adapters/metric-adapter.ts` | **CRIAR** — pure function adapter |
| `app/src/lib/intelligence/attribution/aggregator.ts` | **MODIFICAR** — usar adapter no ponto de cast |

**Leitura (NÃO MODIFICAR):**
- `app/src/types/performance.ts` — Schemas `PerformanceMetric` (modern) e `PerformanceMetricDoc` (legacy)
- `app/src/lib/intelligence/attribution/aggregator.ts` — Entender ponto de uso antes de modificar

### S28-CL-04: Lane attribution no contract-map

| Arquivo | Ação |
|:--------|:-----|
| `_netecmt/core/contract-map.yaml` | **MODIFICAR** — adicionar attribution files às lanes |

### S28-CL-05: Remover feature flag

| Arquivo | Ação |
|:--------|:-----|
| `app/src/app/intelligence/attribution/page.tsx` | **MODIFICAR** — remover check feature flag |
| `app/src/app/api/intelligence/attribution/sync/route.ts` | **MODIFICAR** — remover guard (se existir) |
| `app/src/app/api/intelligence/attribution/stats/route.ts` | **MODIFICAR** — remover guard (se existir) |
| `app/src/app/api/intelligence/attribution/overlap/route.ts` | **MODIFICAR** — remover guard (se existir) |
| `app/.env.example` | **MODIFICAR** — remover variável |
| `app/src/lib/intelligence/config.ts` | **MODIFICAR** — remover referência (se existir) |

### S28-CL-06: Implementar RAG stubs (DT-05, DT-06, DT-10)

| Arquivo | Ação |
|:--------|:-----|
| `app/src/lib/ai/rag.ts` | **MODIFICAR** — implementar 3 funções |

**Leitura:**
- `app/src/__tests__/lib/ai/rag.test.ts` — Ajustar expectations para valores reais
- `app/src/lib/ai/embeddings.ts` — Referência (NÃO MODIFICAR)

---

## Epic 2: Personalization Advance — Fase 2 (S28-PS-01 a PS-06)

### S28-PS-01: Hardening API Scan (DT-02, DT-07, DT-08, DT-09)

| Arquivo | Ação |
|:--------|:-----|
| `app/src/lib/ai/gemini.ts` | **MODIFICAR** — estender options com `systemPrompt`, mapear para `system_instruction` |
| `app/src/lib/intelligence/personalization/engine.ts` | **MODIFICAR** — remover `as any`, adicionar retry logic |
| `app/src/app/api/intelligence/audience/scan/route.ts` | **MODIFICAR** — validação input robusta |
| `app/src/lib/intelligence/personalization/middleware.ts` | **INVESTIGAR** — DT-07, verificar se registrado no Next.js middleware |
| `app/src/middleware.ts` (root Next.js) | **LEITURA** — verificar se personalizationMiddleware está registrado |

**Leitura (contexto):**
- `app/src/lib/ai/prompts/audience-scan.ts` — System prompt (AUDIENCE_SCAN_SYSTEM_PROMPT)
- `app/src/types/personalization.ts` — `AudienceScan`, `DynamicContentRule`, `LeadState`
- `app/src/lib/firebase/scoped-data.ts` — Acesso multi-tenant

### S28-PS-02: Testes contrato + Zod Schema (DT-03)

| Arquivo | Ação |
|:--------|:-----|
| `app/src/lib/intelligence/personalization/schemas/audience-scan-schema.ts` | **CRIAR** — schema Zod |
| `app/src/lib/intelligence/personalization/engine.ts` | **MODIFICAR** — usar safeParse + fallback |
| `app/src/__tests__/lib/intelligence/personalization/audience-scan-contract.test.ts` | **CRIAR** — testes de contrato |

**Leitura:**
- `app/src/lib/ai/prompts/audience-scan.ts` — Validar ausência de PII no prompt

### S28-PS-03: Propensity Engine

| Arquivo | Ação |
|:--------|:-----|
| `app/src/lib/intelligence/personalization/propensity.ts` | **MODIFICAR** — scoring, recência, segmentação |

**Leitura:**
- `app/src/types/personalization.ts` — `LeadState`, `PropensityScore`
- `app/src/lib/intelligence/personalization/engine.ts` — Como propensity é chamado

### S28-PS-04: Dashboard Personalization

| Arquivo | Ação |
|:--------|:-----|
| `app/src/app/intelligence/personalization/page.tsx` | **MODIFICAR** — data binding, states, trigger scan |

**Leitura:**
- `app/src/lib/hooks/use-intelligence.ts` — Hook existente
- `app/src/types/personalization.ts` — `AudienceScan`, `DynamicContentRule`

### S28-PS-05: Componentes de Scan

| Arquivo | Ação |
|:--------|:-----|
| `app/src/components/intelligence/personalization/AudienceScanCard.tsx` | **CRIAR** |
| `app/src/components/intelligence/personalization/PersonaDetailView.tsx` | **CRIAR** |
| `app/src/components/intelligence/personalization/PropensityBadge.tsx` | **CRIAR** |

### S28-PS-06: CRUD Dynamic Content Rules (STRETCH)

| Arquivo | Ação |
|:--------|:-----|
| `app/src/app/intelligence/personalization/page.tsx` | **MODIFICAR** — seção de rules |
| `app/src/lib/firebase/personalization-rules.ts` | **CRIAR** — CRUD Firestore |

---

## Proibições (P1–P10)

### Proibições do PRD (P1–P10)

| # | Proibição | Escopo |
|:--|:----------|:-------|
| **P1** | **NUNCA alterar lógica de negócio** dos módulos Attribution core: `engine.ts`, `bridge.ts`, `aggregator.ts`, `overlap.ts` | Código testado S27 — respeitar estabilidade. **Exceção CL-03:** alterar apenas o ponto de cast no aggregator para usar adapter |
| **P2** | **NUNCA remover exports existentes** de `types/attribution.ts`, `types/intelligence.ts`, `types/performance.ts` | Interfaces contratuais — podem ser estendidas, nunca reduzidas |
| **P3** | **NUNCA alterar interfaces Sprint 25**: `prediction.ts`, `creative-ads.ts`, `text-analysis.ts` | Intocáveis — produção estável |
| **P4** | **NUNCA usar `firebase-admin`** ou `google-cloud/*` | Restrição de ambiente (Windows 11 24H2) — Client SDK only |
| **P5** | **NUNCA incluir PII em prompts** do Gemini (email, nome, IP, telefone) | Sanitização obrigatória. Validado em testes PS-02 |
| **P6** | **NUNCA usar `any`** em novos tipos ou correções | `unknown` com type guards quando necessário. DT-08 remove `as any` existente |
| **P7** | **NUNCA hardcodar `brandId`** em novos módulos | Multi-tenant first — brandId vem do contexto de auth/request |
| **P8** | **NUNCA iniciar Fase 2 sem Gate Check aprovado** | Ressalva R1 do Conselho |
| **P9** | **NUNCA alterar formato do `contract-map.yaml`** — apenas corrigir paths e adicionar lanes/comentários | Mudança cirúrgica, sem refatoração do YAML |
| **P10** | **NUNCA remover stubs que não são do escopo** | Stubs de assets (`firebase/assets.ts`, `use-intelligence-assets.ts`, `assets-panel.tsx`) permanecem para S29 |

---

## Resumo de Impacto por Contrato

| Lane (contract-map.yaml) | Contrato | Impacto | Risco |
|:--------------------------|:---------|:--------|:------|
| `personalization_engine` | `personalization-engine-spec.md` | Fix path (DT-01), engine hardening (DT-02/08/09), propensity hardening | ⚠️ Médio — core da sprint |
| `intelligence_wing` | `intelligence-storage.md` (v2.0) | API audience scan hardening, UI dashboard, comentário ownership | ⚠️ Médio — API + UI tocados |
| `ai_retrieval` | `retrieval-contracts.md` | RAG stubs implementados (DT-05/06/10), `embeddings.ts` intacto | ✅ Baixo |
| `performance_war_room` | `performance-spec.md` | Adapter layer (DT-04) — camada intermediária, sem alterar interfaces | ✅ Baixo |
| `core` | N/A | `contract-map.yaml` path fix e lanes | ✅ Mínimo |

**NENHUM contrato ativo será quebrado.** Justificativas:
1. `personalization-engine-spec.md` — Hardenings sobre código existente, sem alterar contrato de interface
2. `intelligence-storage.md` (v2.0) — API scan já existe e é coberta. Mudanças internas
3. `types/personalization.ts` — NENHUM export removido. Apenas adições possíveis
4. Sprint 25 types intocados — P3 respeitada
5. `types/performance.ts` — Ambas interfaces intocadas. Adapter é camada intermediária

---

## Módulos Protegidos (NÃO TOCAR — produção estável)

### Attribution Core (S27 — produção estável)
- `app/src/lib/intelligence/attribution/engine.ts` — **NÃO MODIFICAR lógica** (P1)
- `app/src/lib/intelligence/attribution/bridge.ts` — **NÃO MODIFICAR** (P1)
- `app/src/lib/intelligence/attribution/overlap.ts` — **NÃO MODIFICAR** (P1)
- `app/src/lib/hooks/use-attribution-data.ts` — **NÃO MODIFICAR** (estável S27)
- `app/src/app/intelligence/attribution/page.tsx` — Apenas remover feature flag check (CL-05)

### Sprint 25 Types
- `app/src/types/prediction.ts` — **PROIBIDO** (P3)
- `app/src/types/creative-ads.ts` — **PROIBIDO** (P3)
- `app/src/types/text-analysis.ts` — **PROIBIDO** (P3)

### Stubs Out-of-Scope (S29)
- `app/src/lib/firebase/assets.ts` — Não tocar (P10)
- `app/src/lib/hooks/use-intelligence-assets.ts` — Não tocar (P10)
- `app/src/components/intelligence/discovery/assets-panel.tsx` — Não tocar (P10)

---

## Resumo: Arquivos Novos a Criar (Sprint 28)

| Arquivo | Story | Tipo |
|:--------|:------|:-----|
| `app/src/lib/intelligence/attribution/adapters/metric-adapter.ts` | CL-03 | Adapter |
| `app/src/lib/intelligence/personalization/schemas/audience-scan-schema.ts` | PS-02 | Schema Zod |
| `app/src/__tests__/lib/intelligence/personalization/audience-scan-contract.test.ts` | PS-02 | Testes |
| `app/src/components/intelligence/personalization/AudienceScanCard.tsx` | PS-05 | Componente UI |
| `app/src/components/intelligence/personalization/PersonaDetailView.tsx` | PS-05 | Componente UI |
| `app/src/components/intelligence/personalization/PropensityBadge.tsx` | PS-05 | Componente UI |
| `app/src/lib/firebase/personalization-rules.ts` | PS-06 (stretch) | CRUD Firestore |

---

## Resumo: Arquivos Modificados (Sprint 28)

| Arquivo | Story(ies) | Tipo de Mudança |
|:--------|:-----------|:---------------|
| `_netecmt/core/contract-map.yaml` | CL-02, CL-04 | Fix paths, adicionar lanes |
| `app/src/lib/intelligence/attribution/aggregator.ts` | CL-03 | Usar adapter no cast |
| `app/.env.example` | CL-05 | Remover variável |
| `app/src/app/intelligence/attribution/page.tsx` | CL-05 | Remover feature flag check |
| `app/src/lib/intelligence/config.ts` | CL-05 | Remover referência flag (se existir) |
| `app/src/lib/ai/rag.ts` | CL-06 | Implementar 3 funções |
| `app/src/lib/ai/gemini.ts` | PS-01 | Estender options + system_instruction |
| `app/src/lib/intelligence/personalization/engine.ts` | PS-01, PS-02 | Remover as any, retry, safeParse |
| `app/src/app/api/intelligence/audience/scan/route.ts` | PS-01 | Validação input |
| `app/src/lib/intelligence/personalization/propensity.ts` | PS-03 | Scoring, segmentação |
| `app/src/app/intelligence/personalization/page.tsx` | PS-04, PS-06 | Dashboard, rules UI |

---
*Allowed Context preparado por Leticia (SM) — NETECMT v2.0*
*Incorpora proibições do PRD (Iuran) e Decision Topics do Architecture Review (Athos)*
*Sprint 28: Hybrid Full — Cleanup & Foundations + Personalization Advance | 06/02/2026*
