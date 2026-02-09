# Story Pack: Sprint 31 — Automation Engine & Rules Runtime
**ID:** S31-00
**Lane:** automation + personalization_engine + operations_infrastructure (cross-cutting)
**Preparado por:** Leticia (SM)
**Data:** 07/02/2026

## Contents
- [Stories Distilled](stories.md)
- [Allowed Context](allowed-context.md)

## PRD & Architecture Review
- **PRD:** `_netecmt/solutioning/prd/prd-sprint-31-automation-rules-runtime.md` — Iuran (PM)
- **Arch Review:** `_netecmt/solutioning/architecture/arch-sprint-31.md` — Athos (Architect)
- **Arch Status:** APROVADO COM RESSALVAS (12 DTs, 3 Blocking → TODOS RESOLVIDOS)
- **Tipo:** Feature Sprint (Automacao & Runtime)

## Predecessora
- Sprint 30 (Ads Integration Foundation) — CONCLUIDA (QA 98/100)
- Baseline: `tsc --noEmit` = 0, `npm run build` = sucesso (103+ rotas), 227/227 testes passando

## Squad
| Papel | Agente | Responsabilidade |
|:------|:-------|:-----------------|
| PM | Iuran | PRD, escopo, proibicoes (P-01 a P-13) |
| Architect | Athos | 12 DTs, schemas, sequencia refinada, estimativa revisada |
| SM | Leticia | Story Pack, gates, allowed context |
| Dev | Darllyson | Implementacao guiada por stories |
| QA | Dandara | CS-31.01 a CS-31.19, RC-01 a RC-10 |

---

## Objetivo da Sprint

> **"Substituir TODOS os mocks da Automation Page por dados reais do Firestore, implementar persistencia e notificacao no Kill-Switch, criar DLQ para webhooks falhados, e entregar o Rules Runtime que resolve conteudo dinamico por lead — transformando a automacao de teatro em motor real."**

### North Star Metrics

| Metrica | Antes (S30) | Meta (S31) |
|:--------|:-----------|:-----------|
| Stubs/TODOs de Automation | **5** | **0** |
| Automation Page com dados reais | **0%** (100% mock) | **100%** (Firestore) |
| Kill-Switch persistencia | **0** (console.log) | **Firestore + Slack** |
| DLQ para webhooks falhados | **0** (erros perdidos) | **Funcional** (retry manual) |
| Rules Runtime | **Inexistente** | **API + Hook** |

---

## Success Criteria (Sprint Level)

| # | Criterio | Validacao | Responsavel |
|:--|:---------|:----------|:-----------|
| **CS-31.01** | Automation Page carrega rules do Firestore (`brands/{brandId}/automation_rules`) | Rules aparecem na UI apos salvar no Firestore | Dandara |
| **CS-31.02** | Automation Page carrega logs do Firestore (`brands/{brandId}/automation_logs`) | Logs aparecem na UI com status correto | Dandara |
| **CS-31.03** | Automation Page carrega variations de `personalization_rules` | Variations tab mostra contentVariations de rules ativas | Dandara |
| **CS-31.04** | Approve action persiste `status: 'executed'` no Firestore | getDoc apos approve mostra status atualizado | Dandara |
| **CS-31.05** | Reject action persiste `status: 'rejected'` no Firestore | getDoc apos reject mostra status atualizado | Dandara |
| **CS-31.06** | Toggle rule persiste `isEnabled` no Firestore | getDoc apos toggle mostra isEnabled atualizado | Dandara |
| **CS-31.07** | Kill-Switch POST salva AutomationLog com status `pending_approval` | Doc existe em `brands/{brandId}/automation_logs` com dados corretos | Dandara |
| **CS-31.08** | Kill-Switch dispara notificacao Slack (se URL configurada) | Log confirma envio ou warning se URL ausente | Dandara |
| **CS-31.09** | Kill-Switch cria notificacao in-app | Doc existe em `brands/{brandId}/notifications` com isRead=false | Dandara |
| **CS-31.10** | Notification badge no sidebar mostra count correto | Badge reflete notifications nao-lidas | Dandara |
| **CS-31.11** | `POST /api/personalization/resolve` retorna variacoes para lead hot | Response contem variations matched por segment | Dandara |
| **CS-31.12** | Rules Runtime retorna fallback quando zero match | Response contem `fallback: true, variations: []` | Dandara |
| **CS-31.13** | `usePersonalizedContent` hook funciona no client | Hook retorna variations + isLoading + error corretamente | Dandara |
| **CS-31.14** | Webhook falhado salva na DLQ | Doc existe em `brands/{brandId}/dead_letter_queue` | Dandara |
| **CS-31.15** | `POST /api/webhooks/retry` re-processa com sucesso | DLQ item status muda para 'resolved' | Dandara |
| **CS-31.16** | Retry respeita maxRetryCount = 3 | Item com retryCount >= 3 retorna erro e status 'abandoned' | Dandara |
| **CS-31.17** | DLQ UI na Automation Page lista items pendentes | Tab Dead Letter mostra items com botao retry | Dandara |
| **CS-31.18** | 227+ testes passando (zero regressao) | `npm test` em cada Gate | Dandara |
| **CS-31.19** | tsc=0, build=103+ rotas | `npx tsc --noEmit && npm run build` | Dandara |

---

## Estrutura: 4 Fases Core + 4 Gates + 1 STRETCH + 1 GOV

### Fase 1: Automation Page Real (~3.5-4.5h, Athos revisada)
- **3 Stories**: S31-AUTO-01, S31-AUTO-02, S31-AUTO-03
- **1 Gate**: S31-GATE-01

### -- GATE CHECK 1 -- (Page real + tsc=0 + build + tests) --

### Fase 2: Kill-Switch Persistence & Notification (~3.5-4.5h, Athos revisada)
- **4 Stories**: S31-KS-01, S31-KS-02, S31-KS-03, S31-KS-04
- **1 Gate**: S31-GATE-02

### -- GATE CHECK 2 -- (Kill-Switch completo + tsc=0 + build + tests) --

### Fase 3: Rules Runtime (~3.5-4.5h, Athos revisada)
- **3 Stories**: S31-RT-02, S31-RT-01, S31-RT-03
- **1 Gate**: S31-GATE-03

### -- GATE CHECK 3 -- (Runtime funcional + tsc=0 + build + tests) --

### Fase 4: Webhook DLQ (~3-4h, Athos revisada)
- **Pre-requisito**: Fix platform extraction no dispatcher (DT-03, ja resolvido)
- **3 Stories**: S31-DLQ-01, S31-DLQ-02, S31-DLQ-03
- **1 Gate**: S31-GATE-04

### -- GATE CHECK 4 -- (DLQ completa + tsc=0 + build + tests) --

### Governanca: Contract-Map Update
- **1 Story**: S31-GOV-01

### STRETCH: Rate Limiting (~3-4h)
- **1 Story**: S31-RL-01 — somente se core < 14h

### QA Final — ~1h
- Dandara valida CS-31.01 a CS-31.19 + RC-01 a RC-10

---

## Blocking DTs Checklist — Pre-flight (3 P0 BLOCKING do Arch Review — TODOS RESOLVIDOS)

> Os 3 blocking DTs foram **RESOLVIDOS ANTECIPADAMENTE** pelo Athos. As correcoes estao incorporadas nas stories abaixo.

- [x] **DT-01 (P0 BLOCKING → RESOLVIDO)**: Import path ERRADO para `requireBrandAccess` no PRD. Path real: `@/lib/auth/brand-guard` (NAO `@/lib/guards/auth`). Corrigido em TODAS as stories que criam novas rotas.
- [x] **DT-02 (P0 BLOCKING → RESOLVIDO)**: Brand store property ERRADA no PRD. Correto: `useBrandStore().selectedBrand?.id` (NAO `activeBrandId`). Corrigido em S31-AUTO-03.
- [x] **DT-03 (P0 BLOCKING → RESOLVIDO)**: Dispatcher extrai `platform` incorretamente (`.pop()` retorna `'dispatcher'`). Corrigido para query param `?platform=`. Incorporado como pre-requisito em S31-DLQ-01.

---

## Ordem de Execucao (Darllyson)

```
[FASE 1 — Automation Page Real (GATE)]
  S31-AUTO-01 (Automation CRUD Firestore, M ~1.5h) — fundacao
  S31-AUTO-02 (Automation Logs Firestore, S ~1h) — depende de AUTO-01
  S31-AUTO-03 (Automation Page Conectada, M+ ~2h) — depende de AUTO-01 + AUTO-02
    ★ FIX: Usar selectedBrand?.id (DT-02), NAO activeBrandId
    ★ ADICIONAR: null check + empty state + loading skeleton

  ── S31-GATE-01 ── (Page real + tsc=0 + build + tests = 227/227) ──

[FASE 2 — Kill-Switch Persistence (GATE)]
  S31-KS-01 (Firestore Persist, M ~1.5h) — depende de AUTO-01 (usa createAutomationLog)
    ★ FIX: Import de @/lib/auth/brand-guard (DT-01)
  S31-KS-02 (Slack Notification, S+ ~1.25h) — independente
    ★ ADICIONAR: isValidSlackWebhookUrl() anti-SSRF (DT-08)
  S31-KS-03 (In-App Notification, S ~1h) — depende de AUTO-01 (usa createInAppNotification)
  S31-KS-04 (Notification Badge, S ~45min) — depende de KS-03
    ★ ADAPTAR: dot indicator no desktop 72px, pill com numero no mobile (DT-09)

  ── S31-GATE-02 ── (Kill-Switch completo + tsc=0 + build + tests) ──

[FASE 3 — Rules Runtime (GATE)]
  S31-RT-02 (Matching Engine / resolver.ts, M+ ~1.75h) — core
    ★ ALTERAR: Buscar scans por getDoc(targetPersonaId) (DT-06)
    ★ NAO usar getAudienceScans() com limit(10) (PA-05)
    ★ Documentar race condition de segment stale (DT-10)
  S31-RT-01 (API /personalization/resolve, M ~2h) — depende de RT-02
    ★ FIX: Import de @/lib/auth/brand-guard (DT-01)
  S31-RT-03 (Hook usePersonalizedContent, XS ~30min) — depende de RT-01

  ── S31-GATE-03 ── (Runtime funcional + tsc=0 + build + tests) ──

[FASE 4 — Webhook DLQ (GATE)]
  ★ PRE-REQUISITO: Fix platform extraction no dispatcher (DT-03, incorporado em DLQ-01)
  S31-DLQ-01 (DLQ Persist no Dispatcher, M ~1.5h)
    ★ Usar collection name dead_letter_queue (DT-04, underscores)
    ★ webhookType incluir 'stripe' na union (DT-12)
  S31-DLQ-02 (API /webhooks/retry, M+ ~1.75h) — depende de DLQ-01
    ★ FIX: Import de @/lib/auth/brand-guard (DT-01)
    ★ ADICIONAR: Stub Google no EventNormalizer (DT-05)
    ★ ADICIONAR: Timestamp check antes de re-processar (DT-11)
  S31-DLQ-03 (DLQ UI na Automation Page, XS ~30min) — depende de DLQ-02

  ── S31-GATE-04 ── (DLQ completa + tsc=0 + build + tests) ──

[GOVERNANCA]
  S31-GOV-01 (Contract-Map Update, XS ~15min) — apos Gate 4

[STRETCH]
  S31-RL-01 (Rate Limiting por brandId, M ~3-4h) — somente apos Gate 4 aprovado com < 14h acumuladas

[QA FINAL]
  Dandara valida CS-31.01 a CS-31.19 + RC-01 a RC-10 + regressao completa
```

**Notas sobre dependencias:**
- F1: Sequencial — AUTO-01 → AUTO-02 → AUTO-03
- F2: KS-01 depende de AUTO-01. KS-02 e independente. KS-03 depende de AUTO-01. KS-04 depende de KS-03
- F3: Sequencial — RT-02 → RT-01 → RT-03
- F4: DLQ-01 (independente) → DLQ-02 → DLQ-03

---

## Estimativa Revisada (Arch Review — Athos, aceita pelo Conselho)

| Fase | Stories | Estimativa | Gate? | Delta vs PRD |
|:-----|:--------|:----------|:------|:-------------|
| **FASE 1** | | | | |
| Automation Page Real | S31-AUTO-01/02/03 | ~3.5-4.5h | — | +30min (DT-02: fix brandId + null check) |
| **— S31-GATE-01 —** | — | ~15min | **SIM** | — |
| **Subtotal F1** | **3 + 1 gate** | **~3.75-4.75h** | | **+30min** |
| **FASE 2** | | | | |
| Kill-Switch Persistence | S31-KS-01/02/03/04 | ~3.5-4.5h | — | +30min (DT-08: Slack validation + DT-09: sidebar) |
| **— S31-GATE-02 —** | — | ~15min | **SIM** | — |
| **Subtotal F2** | **4 + 1 gate** | **~3.75-4.75h** | | **+30min** |
| **FASE 3** | | | | |
| Rules Runtime | S31-RT-02/01/03 | ~3.5-4.5h | — | +15min (DT-06: buscar scans por ID) |
| **— S31-GATE-03 —** | — | ~15min | **SIM** | — |
| **Subtotal F3** | **3 + 1 gate** | **~3.75-4.75h** | | **+15min** |
| **FASE 4** | | | | |
| Webhook DLQ | S31-DLQ-01/02/03 | ~3-4h | — | +45min (DT-03: platform fix + DT-11: timestamp) |
| **— S31-GATE-04 —** | — | ~15min | **SIM** | — |
| **Subtotal F4** | **3 + 1 gate** | **~3.25-4.25h** | | **+45min** |
| **Governanca** | S31-GOV-01 | ~15min | Nao | Adicionado |
| **QA Final** | — | ~1h | — | — |
| **TOTAL (sem STRETCH)** | **14 stories + 4 gates + 1 GOV** | **~14-18h** | **4 gates** | **+2h vs PRD** |
| **STRETCH** | | | | |
| Rate Limiting | S31-RL-01 | ~3-4h | Nao | = |
| **TOTAL (com STRETCH)** | **15 stories + 4 gates + 1 GOV** | **~17-22h** | **4 gates** | **+2h vs PRD** |

**Razao do delta +2h justificada por:**
- DT-02: +10min (fix brandId access + null check na Automation Page)
- DT-03: +30min (fix platform extraction no dispatcher — pre-requisito DLQ)
- DT-06: +20min (approach de busca por ID no Resolver)
- DT-08: +15min (Slack URL validation anti-SSRF)
- DT-09: +15min (sidebar badge layout icon-only 72px)
- DT-11: +15min (timestamp check no DLQ retry)
- DT-12: +5min (adicionar 'stripe' a union)

---

## Decision Topics Incorporados (12 DTs do Arch Review)

| DT | Titulo | Severidade | Blocking? | Story Incorporada | Acao |
|:---|:-------|:-----------|:----------|:-------------------|:-----|
| **DT-01** | Import path errado: requireBrandAccess | **P0** | **RESOLVIDO** | S31-KS-01, RT-01, DLQ-02 | Usar `@/lib/auth/brand-guard` em TODAS as novas rotas |
| **DT-02** | Brand store: selectedBrand?.id | **P0** | **RESOLVIDO** | S31-AUTO-03 | `useBrandStore().selectedBrand?.id`, nao `activeBrandId` |
| **DT-03** | Dispatcher: platform via query param | **P0** | **RESOLVIDO** | S31-DLQ-01 | Platform via `req.nextUrl.searchParams.get('platform')` |
| DT-04 | DLQ collection name: underscores | P1 | **RESOLVIDO** | S31-DLQ-01 | Usar `dead_letter_queue` (nao `dead-letter-queue`) |
| DT-05 | EventNormalizer: stub Google | P1 | **RESOLVIDO** | S31-DLQ-02 | Adicionar `case 'google': throw Error(...)` descritivo |
| DT-06 | getAudienceScans limit(10) → getDoc por ID | P1 | Nao | S31-RT-02 | Buscar scans por `getDoc(targetPersonaId)` diretamente |
| DT-07 | gapDetails: tipar (remover `any`) | P2 | **RESOLVIDO** | S31-KS-01 | Union type com campos tipados no `types/automation.ts` |
| DT-08 | Slack URL validation (anti-SSRF) | P1 | Nao | S31-KS-02 | `isValidSlackWebhookUrl()` — hostname check |
| DT-09 | Sidebar badge: 72px icon-only | P2 | Nao | S31-KS-04 | Dot indicator desktop, pill com numero mobile |
| DT-10 | Resolver: segment stale (race condition) | P1 | Nao | S31-RT-02 | Documentar como limitacao conhecida |
| DT-11 | DLQ retry: timestamp check | P1 | Nao | S31-DLQ-02 | Verificar timestamp vs lead.lastInteraction antes de retry |
| DT-12 | DeadLetterItem.webhookType: adicionar 'stripe' | P2 | Nao | S31-DLQ-01 | Union `'meta' \| 'instagram' \| 'google' \| 'stripe'` |

---

## Schemas Firestore (Referencia Arch Review — Apendice A)

| Collection | Path | Story | Status |
|:-----------|:-----|:------|:-------|
| Automation Rules | `brands/{brandId}/automation_rules/{ruleId}` | S31-AUTO-01 | Existente (estrutura) — CRUD novo |
| Automation Logs | `brands/{brandId}/automation_logs/{logId}` | S31-AUTO-02, KS-01 | Existente (estrutura) — CRUD novo |
| Notifications | `brands/{brandId}/notifications/{notificationId}` | S31-KS-03 | Novo |
| Dead Letter Queue | `brands/{brandId}/dead_letter_queue/{dlqItemId}` | S31-DLQ-01 | Novo |
| Leads | `brands/{brandId}/leads/{leadId}` | S31-RT-02 | Existente (S28-S29) — lido pelo Resolver |
| Personalization Rules | `brands/{brandId}/personalization_rules/{ruleId}` | S31-RT-02 | Existente (S25) — lido pelo Resolver |
| Audience Scans | `brands/{brandId}/audience_scans/{scanId}` | S31-RT-02 | Existente (S29) — lido pelo Resolver |

---

## Arquivos Criados (Novos)

| Arquivo | Story | Descricao |
|:--------|:------|:----------|
| `app/src/lib/firebase/automation.ts` | S31-AUTO-01/02, KS-03 | CRUD para automation_rules, automation_logs, notifications |
| `app/src/lib/notifications/slack.ts` | S31-KS-02 | Helper de notificacao Slack via fetch() |
| `app/src/app/api/personalization/resolve/route.ts` | S31-RT-01 | API de resolucao de conteudo dinamico |
| `app/src/lib/intelligence/personalization/resolver.ts` | S31-RT-02 | Matching engine de personalizacao |
| `app/src/lib/hooks/use-personalized-content.ts` | S31-RT-03 | Hook client-side para conteudo personalizado |
| `app/src/app/api/webhooks/retry/route.ts` | S31-DLQ-02 | API de retry manual de webhooks falhados |

## Arquivos Modificados

| Arquivo | Story | Tipo de Mudanca |
|:--------|:------|:---------------|
| `app/src/app/automation/page.tsx` | S31-AUTO-03 | Remover MOCK_RULES/LOGS/VARIATIONS, conectar Firestore |
| `app/src/app/api/automation/kill-switch/route.ts` | S31-KS-01 | Substituir TODOs por persist + notificacao |
| `app/src/components/layout/sidebar.tsx` | S31-KS-04 | Adicionar notification badge |
| `app/src/app/api/webhooks/dispatcher/route.ts` | S31-DLQ-01 | Fix platform extraction + DLQ persist no catch |
| `app/src/types/automation.ts` | S31-DLQ-01, KS-01 | Adicionar DeadLetterItem + InAppNotification + tipar gapDetails |
| `app/src/lib/automation/normalizer.ts` | S31-DLQ-02 | Adicionar stub Google no switch |
| `_netecmt/core/contract-map.yaml` | S31-GOV-01 | Registrar novos paths nas lanes |

---

## Milestones

| Milestone | Validacao | Stories Concluidas |
|:----------|:----------|:-------------------|
| **M1: Automation Real** | Gate Check 1 — Page com dados reais do Firestore | S31-AUTO-01/02/03, GATE-01 |
| **M2: Kill-Switch Live** | Gate Check 2 — Persist + Slack + In-App + Badge | S31-KS-01/02/03/04, GATE-02 |
| **M3: Runtime Live** | Gate Check 3 — API resolve + Hook funcional | S31-RT-02/01/03, GATE-03 |
| **M4: DLQ Operational** | Gate Check 4 — DLQ persist + retry + UI | S31-DLQ-01/02/03, GATE-04 |
| **M5: Sprint Complete** | CS-31.01 a CS-31.19 aprovados | S31-GOV-01 + QA Final (Dandara) |
| **M6: (STRETCH) Rate Limited** | Rate limiting funcional | S31-RL-01 |

---

## Retrocompatibilidade (RC-01 a RC-10, do Arch Review)

| # | Item | Verificacao | Responsavel |
|:--|:-----|:-----------|:-----------|
| RC-01 | Kill-Switch route mantém mesmo path (`POST /api/automation/kill-switch`) | URL identica — adiciona persist interno | Dandara |
| RC-02 | Dispatcher route mantém mesmo path (`POST /api/webhooks/dispatcher`) | Adiciona DLQ persist. Response identica | Dandara |
| RC-03 | `AutomationControlCenter` component props nao mudam | `rules`, `logs`, callbacks — mesma interface | Dandara |
| RC-04 | `getPersonalizationRules()` signature intocada | `(brandId: string) => Promise<DynamicContentRule[]>` | Dandara |
| RC-05 | `getAudienceScans()` signature intocada | Resolver usa getDoc direto — funcao existente nao muda | Dandara |
| RC-06 | 227+ testes passando em cada Gate | `npm test` em G1, G2, G3, G4 | Dandara |
| RC-07 | tsc=0 em cada Gate | `npx tsc --noEmit` | Dandara |
| RC-08 | Build 103+ rotas | `npm run build` | Dandara |
| RC-09 | Tipos existentes `AutomationRule`, `AutomationLog` sem breaking changes | Apenas ADICIONA DeadLetterItem e InAppNotification | Dandara |
| RC-10 | Sidebar visual identico (exceto badge novo) | Badge e aditivo, zero mudanca no layout | Dandara |

---

## Ressalvas do Conselho (R1-R10)

| # | Ressalva | Incorporacao no Story Pack |
|:--|:---------|:--------------------------|
| R1 | Gate Checks sao BLOQUEANTES (4 gates) | S31-GATE-01 a GATE-04 entre cada fase |
| R2 | Rate Limiting e STRETCH | S31-RL-01 so apos Gate 4 aprovado com tempo |
| R3 | Padroes Sigma sao lei | `createApiError`, `requireBrandAccess`, `Timestamp`, `force-dynamic` obrigatorios |
| R4 | REST puro — zero dependencia npm nova | Slack via fetch(), DLQ via Firestore (P-01) |
| R5 | 3 Blocking DTs RESOLVIDOS antecipadamente | DT-01 (import), DT-02 (brand store), DT-03 (dispatcher platform) |
| R6 | Estimativa revisada +2h vs PRD | Aceita pelo Conselho (14-18h sem STRETCH) |
| R7 | Resolver busca scans por ID (DT-06) | PA-05: NAO usar getAudienceScans() com limit(10) |
| R8 | Slack URL validation obrigatoria (DT-08) | PA-04: Anti-SSRF hostname check |
| R9 | DLQ retry com timestamp check (DT-11) | PA-06: Prevenir regressao de awareness |
| R10 | Contract-map DEVE ser atualizado (GOV-01) | Novos paths registrados antes de fechar sprint |

---
*Story Pack preparado por Leticia (SM) — NETECMT v2.0*
*Sprint 31: Automation Engine & Rules Runtime | 07/02/2026*
*15 stories (13 feature core + 1 GOV + 1 STRETCH) | 12 DTs incorporados | 3 Blocking (resolvidos) | 4 Gates*
*Estimativa: 14-18h (sem STRETCH) / 17-22h (com STRETCH)*
*Baseline: 227/227 testes, tsc=0, build=103+ rotas, QA=98/100*
