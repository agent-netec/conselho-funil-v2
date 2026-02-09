# Allowed Context: Sprint 31 — Automation Engine & Rules Runtime
**Lanes:** automation + personalization_engine + operations_infrastructure (cross-cutting)
**Preparado por:** Leticia (SM)
**Data:** 07/02/2026

> Incorpora proibicoes do PRD (P-01 a P-13) e Proibicoes Arquiteturais do Arch Review (PA-01 a PA-06).
> Principio No Global Context: Darllyson le APENAS os arquivos listados aqui por fase.

---

## Contexto Global

### Leitura Obrigatoria (antes de qualquer story)
- `_netecmt/packs/stories/sprint-31-automation-rules/stories.md` — Stories, ACs e checklist
- `_netecmt/packs/stories/sprint-31-automation-rules/story-pack-index.md` — Ordem de execucao, DTs, gates

### Referencia de Padroes (LEITURA para contexto — NAO MODIFICAR)
- `app/src/lib/utils/api-response.ts` — Padrao `createApiError`/`createApiSuccess` (Sigma)
- `app/src/lib/firebase/config.ts` — Referencia de `db` (Firestore Client SDK)
- `app/src/lib/auth/brand-guard.ts` — `requireBrandAccess(req, brandId)` (Sigma)

### Referencia de Tipos (LEITURA para contexto)
- `app/src/types/automation.ts` — `AutomationRule`, `AutomationLog` (existentes) + `DeadLetterItem`, `InAppNotification` (S31)
- `app/src/types/personalization.ts` — `DynamicContentRule`, `LeadState`, `AudienceScan`
- `app/src/lib/stores/brand-store.ts` — `useBrandStore()` → `selectedBrand?.id` (NAO `activeBrandId`)

---

## Fase 1: Automation Page Real — Arquivos Permitidos

### S31-AUTO-01: Automation Rules CRUD Firestore

| Arquivo | Acao |
|:--------|:-----|
| `app/src/lib/firebase/automation.ts` | **CRIAR** — CRUD para automation_rules, automation_logs, notifications |

**Leitura (NAO MODIFICAR):**
- `app/src/lib/firebase/config.ts` — referencia de `db`
- `app/src/types/automation.ts` — tipos AutomationRule, AutomationLog

### S31-AUTO-02: Automation Logs + DLQ Types

| Arquivo | Acao |
|:--------|:-----|
| `app/src/types/automation.ts` | **MODIFICAR** — adicionar DeadLetterItem, InAppNotification, KillSwitchGapDetails + tipar gapDetails |

**Leitura (NAO MODIFICAR):**
- `app/src/lib/firebase/automation.ts` — CRUD (criado em AUTO-01)

**Verificacao de impacto (OBRIGATORIA):**
- Executar `rg "gapDetails" app/src/` para verificar que nenhum consumer quebra com a tipagem

### S31-AUTO-03: Automation Page Conectada

| Arquivo | Acao |
|:--------|:-----|
| `app/src/app/automation/page.tsx` | **MODIFICAR** — remover MOCK_RULES/LOGS/VARIATIONS, conectar Firestore, null check brandId |

**Leitura (NAO MODIFICAR):**
- `app/src/lib/firebase/automation.ts` — CRUD (criado em AUTO-01)
- `app/src/lib/firebase/personalization.ts` — `getPersonalizationRules(brandId)` (existente, intocado)
- `app/src/lib/stores/brand-store.ts` — `useBrandStore()` → `selectedBrand?.id` (DT-02)

---

## Fase 2: Kill-Switch Persistence — Arquivos Permitidos

### S31-KS-01: Kill-Switch Firestore Persist

| Arquivo | Acao |
|:--------|:-----|
| `app/src/app/api/automation/kill-switch/route.ts` | **MODIFICAR** — substituir TODOs por persist + requireBrandAccess + notificacoes |

**Leitura (NAO MODIFICAR):**
- `app/src/lib/firebase/automation.ts` — createAutomationLog, createInAppNotification
- `app/src/lib/notifications/slack.ts` — sendSlackNotification (criado em KS-02)
- `app/src/lib/auth/brand-guard.ts` — requireBrandAccess (import CORRETO — DT-01)
- `app/src/lib/utils/api-response.ts` — createApiError, createApiSuccess

### S31-KS-02: Slack Notification Helper

| Arquivo | Acao |
|:--------|:-----|
| `app/src/lib/notifications/slack.ts` | **CRIAR** — sendSlackNotification + isValidSlackWebhookUrl (anti-SSRF) |

### S31-KS-03: In-App Notification + Testes

| Arquivo | Acao |
|:--------|:-----|
| `app/src/__tests__/lib/firebase/automation.test.ts` | **CRIAR** — testes unitarios para CRUD automation.ts (T-01, T-02, T-03) |

**Leitura (NAO MODIFICAR):**
- `app/src/lib/firebase/automation.ts` — funcoes CRUD (criado em AUTO-01)

### S31-KS-04: Notification Badge no Sidebar

| Arquivo | Acao |
|:--------|:-----|
| `app/src/components/layout/sidebar.tsx` | **MODIFICAR** — adicionar badge de notificacoes (dot desktop, pill mobile) |

**Leitura (NAO MODIFICAR):**
- `app/src/lib/firebase/automation.ts` — getUnreadNotificationCount, markNotificationsAsRead
- `app/src/lib/stores/brand-store.ts` — `useBrandStore()` → `selectedBrand?.id`

---

## Fase 3: Rules Runtime — Arquivos Permitidos

### S31-RT-02: Matching Engine (PersonalizationResolver)

| Arquivo | Acao |
|:--------|:-----|
| `app/src/lib/intelligence/personalization/resolver.ts` | **CRIAR** — PersonalizationResolver.resolve() |

**Leitura (NAO MODIFICAR):**
- `app/src/lib/firebase/personalization.ts` — `getPersonalizationRules(brandId)` (existente, intocado)
- `app/src/lib/firebase/config.ts` — `db`
- `app/src/types/personalization.ts` — DynamicContentRule, AudienceScan, LeadState

**AVISO CRITICO (DT-06, PA-05):**
- NAO importar `getAudienceScans` de `lib/firebase/personalization.ts` — tem `limit(10)` que causa false negatives
- Buscar scans por `getDoc(doc(db, 'brands', brandId, 'audience_scans', targetPersonaId))` diretamente

### S31-RT-01: API /api/personalization/resolve

| Arquivo | Acao |
|:--------|:-----|
| `app/src/app/api/personalization/resolve/route.ts` | **CRIAR** — POST handler para resolucao de conteudo dinamico |
| `app/src/__tests__/api/personalization-resolve.test.ts` | **CRIAR** — testes (T-11) |

**Leitura (NAO MODIFICAR):**
- `app/src/lib/intelligence/personalization/resolver.ts` — PersonalizationResolver (criado em RT-02)
- `app/src/lib/auth/brand-guard.ts` — requireBrandAccess (import CORRETO — DT-01)
- `app/src/lib/utils/api-response.ts` — createApiError, createApiSuccess

### S31-RT-03: Hook usePersonalizedContent

| Arquivo | Acao |
|:--------|:-----|
| `app/src/lib/hooks/use-personalized-content.ts` | **CRIAR** — hook client-side |

---

## Fase 4: Webhook DLQ — Arquivos Permitidos

### S31-DLQ-01: DLQ Persist no Dispatcher

| Arquivo | Acao |
|:--------|:-----|
| `app/src/app/api/webhooks/dispatcher/route.ts` | **MODIFICAR** — fix platform extraction (DT-03) + DLQ persist no catch |

**Leitura (NAO MODIFICAR):**
- `app/src/lib/firebase/config.ts` — `db`
- `app/src/lib/utils/api-response.ts` — createApiError

### S31-DLQ-02: API /api/webhooks/retry

| Arquivo | Acao |
|:--------|:-----|
| `app/src/app/api/webhooks/retry/route.ts` | **CRIAR** — POST handler para retry de DLQ items |
| `app/src/lib/automation/normalizer.ts` | **MODIFICAR** — adicionar `case 'google': throw Error(...)` (DT-05) |

**Leitura (NAO MODIFICAR):**
- `app/src/lib/intelligence/personalization/maestro.ts` — PersonalizationMaestro.processInteraction (existente)
- `app/src/lib/automation/normalizer.ts` — EventNormalizer.normalize (existente, apenas adicionar case Google)
- `app/src/lib/auth/brand-guard.ts` — requireBrandAccess (import CORRETO — DT-01)
- `app/src/lib/firebase/config.ts` — `db`

### S31-DLQ-03: DLQ UI na Automation Page

| Arquivo | Acao |
|:--------|:-----|
| `app/src/app/automation/page.tsx` | **MODIFICAR** — adicionar tab Dead Letter com lista + retry |
| `app/src/lib/firebase/automation.ts` | **MODIFICAR** — adicionar getDLQItems() |

---

## Governanca — Arquivos Permitidos

### S31-GOV-01: Contract-Map Update

| Arquivo | Acao |
|:--------|:-----|
| `_netecmt/core/contract-map.yaml` | **MODIFICAR** — adicionar novos paths nas lanes automation, personalization_engine |

---

## STRETCH — Arquivos Permitidos

### S31-RL-01: Rate Limiting por brandId

| Arquivo | Acao |
|:--------|:-----|
| `app/src/lib/guards/rate-limiter.ts` | **CRIAR** — guard function checkRateLimit() |
| 7+ rotas API de alto consumo | **MODIFICAR** — integrar rate limiting |

**Leitura (NAO MODIFICAR):**
- `app/src/lib/guards/` — padroes de guard existentes
- `app/src/lib/firebase/config.ts` — referencia de `db`

---

## Proibicoes Consolidadas (PRD P-01 a P-13 + Arch Review PA-01 a PA-06)

### PRD (Iuran) — P-01 a P-13

| # | Proibicao | Escopo |
|:--|:----------|:-------|
| **P-01** | **NUNCA adicionar dependencias npm novas** | Zero deps desde S25. Slack via fetch(), DLQ via Firestore. ZERO npm install |
| **P-02** | **NUNCA usar Cloud Functions** | Serverless via Next.js API routes apenas. Zero Firebase Functions |
| **P-03** | **NUNCA usar firebase-admin** | Restricao de ambiente Windows 11 24H2. Sempre usar firebase client SDK |
| **P-04** | **NUNCA implementar Push notifications ou WhatsApp** | Fora de escopo S31. Apenas Slack + In-App |
| **P-05** | **NUNCA alterar contratos existentes sem atualizar contract-map.yaml** | Novas rotas e collections devem ser registradas (S31-GOV-01) |
| **P-06** | **NUNCA ativar o middleware morto (middleware.ts DT-07 S28)** | Dead code desde S28. NAO reativar. Rules Runtime usa API dedicada |
| **P-07** | **REST puro via fetch() para Slack webhook** | Zero SDK, zero dependencia. Incoming Webhook e POST simples |
| **P-08** | **Timestamp (nao Date) em todos os campos de data Firestore** | Padrao Sigma. `Timestamp.now()` sempre |
| **P-09** | **NUNCA query collections raiz** | SEMPRE usar `brands/{brandId}/...` — isolamento multi-tenant |
| **P-10** | **NUNCA bloquear response esperando Slack/notifications** | Fire-and-forget com `.catch()`. Persistencia Firestore e o source of truth |
| **P-11** | **NUNCA quebrar os 227 testes existentes** | Zero regressao — novos testes ADICIONAM, nao substituem |
| **P-12** | **NUNCA hardcodar webhook URLs** | Slack URL vem de `process.env.SLACK_WEBHOOK_URL` ou MonaraTokenVault |
| **P-13** | **NUNCA armazenar payload DLQ > 10KB** | Truncar com `substring(0, 10240)`. Payloads grandes causam lentidao |

### Arch Review (Athos) — PA-01 a PA-06

| # | Proibicao | Escopo |
|:--|:----------|:-------|
| **PA-01** | **NUNCA importar `requireBrandAccess` de `@/lib/guards/auth`** | Path CORRETO: `@/lib/auth/brand-guard`. PRD tinha path errado (DT-01) |
| **PA-02** | **NUNCA acessar `useBrandStore().activeBrandId`** | Property CORRETA: `useBrandStore().selectedBrand?.id`. PRD tinha property errada (DT-02) |
| **PA-03** | **NUNCA confiar em `pathname.split('/').pop()` para platform** | Retorna `'dispatcher'`, nao o nome da plataforma. Platform deve vir do query param (DT-03) |
| **PA-04** | **NUNCA aceitar Slack webhook URLs que nao iniciem com `https://hooks.slack.com/`** | Anti-SSRF. Validar hostname antes de enviar (DT-08) |
| **PA-05** | **NUNCA usar `getAudienceScans()` no Resolver para buscar scans por matching** | Tem `limit(10)` que causa false negatives. Usar `getDoc(targetPersonaId)` direto (DT-06) |
| **PA-06** | **NUNCA re-processar DLQ item sem verificar timestamp vs lead.lastInteraction** | Previne regressao de awareness level. Check antes de chamar Maestro (DT-11) |

---

## Modulos Protegidos (NAO TOCAR — producao estavel)

### Intelligence Core (S27-S29 — producao estavel)
- `app/src/lib/intelligence/attribution/*` — **NAO MODIFICAR** (Attribution Engine)
- `app/src/lib/intelligence/personalization/engine.ts` — **NAO MODIFICAR** (AudienceIntelligenceEngine)
- `app/src/lib/intelligence/personalization/middleware.ts` — **NAO MODIFICAR** (DEAD CODE DT-07 S28)
- `app/src/lib/intelligence/personalization/propensity.ts` — **NAO MODIFICAR** (PropensityEngine)
- `app/src/lib/intelligence/autopsy/engine.ts` — **NAO MODIFICAR** (AutopsyEngine)
- `app/src/lib/intelligence/offer-lab/scoring.ts` — **NAO MODIFICAR**
- `app/src/lib/intelligence/creative/*` — **NAO MODIFICAR**

### Personalization CRUD (S25 — producao estavel)
- `app/src/lib/firebase/personalization.ts` — **NAO MODIFICAR** (getPersonalizationRules, etc. — intocado)
- `app/src/components/personalization/rule-editor.tsx` — **NAO MODIFICAR** (UI CRUD)

### AI Pipeline Core (Sigma — producao estavel)
- `app/src/lib/ai/embeddings.ts` — **NAO MODIFICAR**
- `app/src/lib/ai/rag.ts` — **NAO MODIFICAR**
- `app/src/lib/ai/pinecone.ts` — **NAO MODIFICAR**
- `app/src/lib/ai/gemini.ts` — **NAO MODIFICAR**
- `app/src/lib/utils/api-response.ts` — **NAO MODIFICAR** (padrao Sigma)

### Firebase Core
- `app/src/lib/firebase/config.ts` — **NAO MODIFICAR** (configuracao)
- `app/src/lib/firebase/firestore.ts` — **NAO MODIFICAR**

### Automation Engine (existente, intocado)
- `app/src/lib/automation/engine.ts` — **NAO MODIFICAR** (AutomationEngine)
- `app/src/lib/automation/budget-optimizer.ts` — **NAO MODIFICAR**
- `app/src/lib/automation/adapters/` — **NAO MODIFICAR** (S30 — producao estavel)

### Vault & Security
- `app/src/lib/firebase/vault.ts` — **NAO MODIFICAR** (MonaraTokenVault S18/S30)
- `app/src/lib/utils/encryption.ts` — **NAO MODIFICAR**

### Sprint 25-29 Types (producao estavel)
- `app/src/types/prediction.ts` — **PROIBIDO**
- `app/src/types/creative-ads.ts` — **PROIBIDO**
- `app/src/types/text-analysis.ts` — **PROIBIDO**
- `app/src/types/autopsy.ts` — **NAO MODIFICAR**
- `app/src/types/offer.ts` — **NAO MODIFICAR**
- `app/src/types/personalization.ts` — **NAO MODIFICAR** (leitura apenas pelo Resolver)

### Testes existentes
- Todos os 227 testes existentes — **NAO MODIFICAR** (P-11, exceto adaptar imports se necessario)

---

## Resumo: Arquivos Novos a Criar (Sprint 31)

| Arquivo | Story | Tipo |
|:--------|:------|:-----|
| `app/src/lib/firebase/automation.ts` | S31-AUTO-01/02, KS-03 | CRUD Firestore para automation |
| `app/src/lib/notifications/slack.ts` | S31-KS-02 | Slack webhook helper |
| `app/src/lib/intelligence/personalization/resolver.ts` | S31-RT-02 | Matching engine |
| `app/src/app/api/personalization/resolve/route.ts` | S31-RT-01 | API Route |
| `app/src/lib/hooks/use-personalized-content.ts` | S31-RT-03 | React hook |
| `app/src/app/api/webhooks/retry/route.ts` | S31-DLQ-02 | API Route |
| `app/src/__tests__/lib/firebase/automation.test.ts` | S31-KS-03 | Testes unitarios |
| `app/src/__tests__/api/personalization-resolve.test.ts` | S31-RT-01 | Testes integracao |

---

## Resumo: Arquivos Modificados (Sprint 31 — por Fase)

### Fase 1: Automation Page Real

| Arquivo | Story | Tipo de Mudanca |
|:--------|:------|:---------------|
| `app/src/types/automation.ts` | S31-AUTO-02 | Adicionar DeadLetterItem, InAppNotification, KillSwitchGapDetails + tipar gapDetails |
| `app/src/app/automation/page.tsx` | S31-AUTO-03 | Remover MOCK_RULES/LOGS/VARIATIONS, conectar Firestore, null check brandId |

### Fase 2: Kill-Switch Persistence

| Arquivo | Story | Tipo de Mudanca |
|:--------|:------|:---------------|
| `app/src/app/api/automation/kill-switch/route.ts` | S31-KS-01 | Substituir TODOs, adicionar requireBrandAccess + persist + notificacoes |
| `app/src/components/layout/sidebar.tsx` | S31-KS-04 | Adicionar notification badge (dot desktop, pill mobile) |

### Fase 3: Rules Runtime

| Arquivo | Story | Tipo de Mudanca |
|:--------|:------|:---------------|
| *(Apenas criacao de arquivos novos — nenhum modificado)* | | |

### Fase 4: Webhook DLQ

| Arquivo | Story | Tipo de Mudanca |
|:--------|:------|:---------------|
| `app/src/app/api/webhooks/dispatcher/route.ts` | S31-DLQ-01 | Fix platform extraction (query param) + DLQ persist no catch |
| `app/src/lib/automation/normalizer.ts` | S31-DLQ-02 | Adicionar `case 'google': throw Error(...)` stub |
| `app/src/app/automation/page.tsx` | S31-DLQ-03 | Adicionar tab Dead Letter + retry button |
| `app/src/lib/firebase/automation.ts` | S31-DLQ-03 | Adicionar getDLQItems() |

### Governanca

| Arquivo | Story | Tipo de Mudanca |
|:--------|:------|:---------------|
| `_netecmt/core/contract-map.yaml` | S31-GOV-01 | Adicionar novos paths nas lanes |

---

## Variavel de Ambiente Nova

```env
# Slack Incoming Webhook URL (OPCIONAL — se ausente, notificacao Slack e skippada)
# NUNCA commitar URL real — usar apenas em .env.local
SLACK_WEBHOOK_URL=your-slack-webhook-url-here
```

**Acao:** Adicionar ao `.env.example` com valor placeholder.

---

## Resumo de Impacto por Contrato

| Lane (contract-map.yaml) | Contrato | Impacto | Risco |
|:--------------------------|:---------|:--------|:------|
| `automation` | N/A | CRUD novo, kill-switch atualizado, slack helper, types expandidos | Alto — core da Sprint |
| `personalization_engine` | `personalization-engine-spec.md` | Resolver novo, API nova | Alto — logica de matching |
| `operations_infrastructure` | `webhook-security-spec.md` | Dispatcher fix + DLQ persist + retry API | Alto — DLQ inteira |
| `intelligence_wing` (leitura) | `intelligence-storage.md` | Resolver LE scans/leads — NAO modifica | Baixo — leitura apenas |

**NENHUM contrato ativo sera quebrado.** Justificativas:
1. Rotas existentes mantem exatamente mesmos paths e response shapes (RC-01, RC-02)
2. Funcoes existentes de personalization.ts e personalization engine NAO sao modificadas (RC-04, RC-05)
3. Tipos sao EXPANDIDOS (novos tipos adicionados) — nunca reduzidos (RC-09)
4. 227/227 testes mantidos em cada gate (P-11)
5. Sidebar recebe badge aditivo — zero mudanca no layout existente (RC-10)
6. Novos arquivos sao isolados em modulos novos (`automation.ts`, `slack.ts`, `resolver.ts`)

---

## Mapa de Imports Corretos (Referencia Rapida — Apendice A do Arch Review)

```typescript
// ======================================
// === CORRETO (usar em TODAS as novas rotas) ===
// ======================================

// Auth
import { requireBrandAccess } from '@/lib/auth/brand-guard';

// API Response
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';

// Firestore
import { Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

// Brand Store (client pages)
import { useBrandStore } from '@/lib/stores/brand-store';
// USO: const { selectedBrand } = useBrandStore(); const brandId = selectedBrand?.id;

// ======================================
// === ERRADO (NUNCA usar) ===
// ======================================

// import { requireBrandAccess } from '@/lib/guards/auth';       ← NAO EXISTE (PA-01)
// useBrandStore().activeBrandId                                  ← NAO EXISTE (PA-02)
// req.nextUrl.pathname.split('/').pop()                          ← Retorna 'dispatcher' (PA-03)
// getAudienceScans(brandId) no Resolver                         ← limit(10) causa bugs (PA-05)
```

## Pattern de Brand Store (Referencia Rapida — Apendice B do Arch Review)

```typescript
'use client';
import { useBrandStore } from '@/lib/stores/brand-store';

export default function SomePage() {
  const { selectedBrand } = useBrandStore();

  // Null check OBRIGATORIO
  if (!selectedBrand) {
    return (
      <div className="flex items-center justify-center h-96 text-zinc-500">
        Selecione uma marca para continuar.
      </div>
    );
  }

  const brandId = selectedBrand.id;
  // ... carregar dados com brandId
}
```

---
*Allowed Context preparado por Leticia (SM) — NETECMT v2.0*
*Incorpora proibicoes do PRD (Iuran, P-01 a P-13) e Proibicoes Arquiteturais do Arch Review (Athos, PA-01 a PA-06)*
*Sprint 31: Automation Engine & Rules Runtime | 07/02/2026*
*15 stories | 8 arquivos novos | 7 arquivos modificados*
*Principio No Global Context: Darllyson le APENAS os arquivos listados aqui por fase*
