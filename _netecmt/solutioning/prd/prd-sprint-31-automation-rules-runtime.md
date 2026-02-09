# PRD: Automation Engine & Rules Runtime — Sprint 31

**Versao:** 1.0  
**Responsavel:** Iuran (PM)  
**Status:** Draft — Ready for Architecture Review  
**Data:** 07/02/2026  
**Predecessora:** Sprint 30 (Ads Integration Foundation) — CONCLUIDA (QA 98/100)  
**Tipo:** Feature Sprint (Automacao & Runtime)  
**Estimativa Total:** ~12-16h (4 items core + 1 STRETCH)

---

## 1. Contexto Estrategico

### 1.1 Baseline pos-Sprint 30

| Metrica | Valor |
|:--------|:------|
| Testes passando | 227/227 (42 suites, 0 fail) |
| TypeScript errors | 0 |
| Build | 103+ rotas (Next.js App Router) |
| Trajetoria QA | S25(93) → S26(97) → S27(97) → S28(98) → Sigma(99) → S29(100) → **S30(98)** |
| Auth cobertura | 100% — `requireBrandAccess` em TODAS as rotas brand-scoped |
| API formato | `createApiError`/`createApiSuccess` em 54+ rotas |
| Pinecone | Unificado (Sigma) |
| Ads Integration | Meta + Google reais (S30) — fetchMetrics, pause, budget, sync |
| LeadState | 12 campos concretos, `segment` funcional (PropensityEngine S28) |
| BYO Keys | MonaraTokenVault com AES-256 — `brands/{brandId}/secrets` |
| Personalization CRUD | Funcional — get/save/update/delete/toggle rules |
| PropensityEngine | calculate() + persistSegment() funcionais (S28-S29) |

### 1.2 Por que Sprint 31 e a sprint que LIGA O MOTOR

O Conselho de Funil possui agora uma **plataforma com Ads reais** (S30), inteligencia de audiencia (S28-S29) e regras de personalizacao (S25). Porem, tres areas criticas operam com **dados falsos ou sem persistencia**:

1. **Automation Page e um teatro de mocks** — `MOCK_RULES`, `MOCK_LOGS`, `MOCK_VARIATIONS` hardcoded. O usuario cria regras no UI mas nada persiste. Regras existentes no Firestore (`automation_rules`) nunca sao lidas.

2. **Kill-Switch nao persiste e nao notifica** — O endpoint registra a intencao no console.log e retorna sucesso, mas nada e salvo no Firestore e ninguem e notificado. Em cenario real, o trafego continua queimando.

3. **Webhooks falhados evaporam** — Quando o dispatcher falha, o erro e logado no console e perdido. Sem DLQ, erros de processamento sao irrecuperaveis.

4. **Rules Runtime nao existe** — Nao ha API para resolver qual conteudo dinamico mostrar para um lead especifico baseado nas DynamicContentRules ativas. O CRUD existe, mas a execucao em tempo real nao.

**Sprint 31 transforma infraestrutura morta em automacao real.** E o passo que liga:
- Regras de automacao vivas no Firestore → UI alimentado por dados reais
- Kill-Switch com persistencia + notificacao Slack → resposta em minutos, nao horas
- DLQ para webhooks → zero perda de eventos
- Rules Runtime → personalizacao real em tempo de execucao

### 1.3 Inventario de Stubs/TODOs a Eliminar (5 total)

| # | Arquivo | Linha(s) | TODO/Stub | Estado Atual |
|:--|:--------|:---------|:----------|:-------------|
| 1 | `app/automation/page.tsx` | L26, L71, L104 | `MOCK_RULES`, `MOCK_LOGS`, `MOCK_VARIATIONS` hardcoded | UI mostra dados falsos |
| 2 | `app/automation/page.tsx` | L109-110 | `useState(MOCK_LOGS)`, `useState(MOCK_RULES)` | State inicializado com mocks |
| 3 | `app/api/automation/kill-switch/route.ts` | L25-26 | TODO: Salvar no Firestore + Disparar notificacao | console.log apenas |
| 4 | `app/api/webhooks/dispatcher/route.ts` | L62-63 | TODO: Persistencia na DLQ | Erros perdidos |
| 5 | Rules Runtime | — | Nao existe | Zero resolucao de conteudo dinamico |

---

## 2. Objetivo da Sprint

> **"Substituir TODOS os mocks da Automation Page por dados reais do Firestore, implementar persistencia e notificacao no Kill-Switch, criar DLQ para webhooks falhados, e entregar o Rules Runtime que resolve conteudo dinamico por lead — transformando a automacao de teatro em motor real."**

### 2.1 North Star Metrics

| Metrica | Antes (S30) | Meta (S31) |
|:--------|:-----------|:-----------|
| Stubs/TODOs de Automation | **5** | **0** |
| Automation Page com dados reais | **0%** (100% mock) | **100%** (Firestore) |
| Kill-Switch persistencia | **0** (console.log) | **Firestore + Slack** |
| DLQ para webhooks falhados | **0** (erros perdidos) | **Funcional** (retry manual) |
| Rules Runtime | **Inexistente** | **API + Hook** |

### 2.2 Metricas Secundarias

| Metrica | Meta |
|:--------|:-----|
| Testes passando | >= 227/227 (zero regressao) + novos testes |
| TypeScript errors | 0 |
| Build rotas | >= 103+ |
| QA Score | >= 98/100 |
| Novas dependencias npm | 0 |
| Tempo de resolucao de regras | < 500ms (API resolve) |
| Latencia Slack notification | < 2s (fire-and-forget) |

---

## 3. Decisoes Estrategicas

### D-31.01: Rules Runtime — Hybrid API + Hook

**Opcoes avaliadas:**

| Opcao | Descricao | Complexidade | Tempo | Risco |
|:------|:----------|:------------|:------|:------|
| A — Middleware SSR | Edge middleware que intercepta requests e injeta variacoes | Alta | ~8h+ | Alto (middleware morto DT-07, complexidade SSR) |
| **B — API + Hook (Hybrid)** | **API `/api/personalization/resolve` + hook `usePersonalizedContent`** | **Media** | **~4h** | **Baixo (padrao existente, REST puro)** |
| C — Client-only | Hook que busca rules e resolve no client | Baixa | ~2h | Medio (logica duplicada, sem cache server) |

**DECISAO: OPCAO B** — Hybrid API + Hook.

**Justificativas:**
1. **API server-side resolve** — Busca DynamicContentRules ativas do Firestore, filtra por segmento do lead (via LeadState.segment), retorna contentVariations aplicaveis. Logica de filtragem fica no server.
2. **Hook client-side consome** — `usePersonalizedContent(brandId, leadId)` chama a API e expoe o resultado. Componentes consomem sem saber da logica.
3. **NAO usa o middleware morto** (DT-07 S28) — Proibicao P-06 respeitada.
4. **Infraestrutura existente** — `getPersonalizationRules(brandId)` ja funciona. O PropensityEngine.persistSegment() ja salva `segment` no lead. So falta conectar os pontos.
5. **Cache natural** — A API pode ser chamada 1x por sessao/lead. Hook faz cache local via useState.

### D-31.02: Automation Page — Firestore Direct (sem BFF)

**DECISAO: Conectar direto ao Firestore via client SDK**

| Aspecto | Estrategia |
|:--------|:-----------|
| **Rules** | Ler de `brands/{brandId}/automation_rules` via getDocs |
| **Logs** | Ler de `brands/{brandId}/automation_logs` via getDocs + orderBy timestamp |
| **Variations** | Ler de `brands/{brandId}/personalization_rules` (DynamicContentRule.contentVariations) |
| **Write** | approve/reject atualizam `automation_logs/{logId}.status` via updateDoc |
| **Toggle rule** | updateDoc em `automation_rules/{ruleId}.isEnabled` |

**Justificativa:** O codebase ja usa Firestore client SDK em todas as pages (performance, vault, intelligence). Criar BFF (API intermediaria) adicionaria complexidade sem beneficio. O `requireBrandAccess` ja esta no Firestore rules via brandId scoping.

### D-31.03: Kill-Switch Notification — Slack Incoming Webhook (REST puro)

**DECISAO: Slack via fetch() + In-App notification**

| Canal | S31 | Justificativa |
|:------|:----|:-------------|
| **Slack** | SIM — Incoming Webhook via fetch() | REST puro (P-07). URL armazenada no MonaraTokenVault ou .env |
| **In-App** | SIM — Collection `brands/{brandId}/notifications` | Firestore doc com type='kill_switch', badge no sidebar |
| **Push** | NAO | Fora de escopo (P-04) |
| **WhatsApp** | NAO | Fora de escopo (P-04) |
| **Email** | NAO | Fora de escopo |

**Implementacao Slack:**
```
POST {SLACK_WEBHOOK_URL}
Content-Type: application/json

{
  "text": "🚨 *Kill-Switch Triggered*\nBrand: {brandName}\nFunnel: {funnelId}\nReason: {reason}\nEntities: {count} ads affected\n<{appUrl}/automation|View in Dashboard>"
}
```

**Nota:** Slack webhook e fire-and-forget. Se falhar, log error + continuar. A persistencia no Firestore e o source of truth.

### D-31.04: Webhook DLQ — Firestore Collection com Retry Manual

**DECISAO: Collection simples + API de retry**

| Aspecto | Estrategia |
|:--------|:-----------|
| **Storage** | `brands/{brandId}/dead_letter_queue` |
| **Schema** | `{ id, webhookType, payload, error, timestamp, retryCount, status, resolvedAt? }` |
| **Retry** | `POST /api/webhooks/retry` — busca DLQ item, re-executa PersonalizationMaestro.processInteraction() |
| **UI** | Tab na Automation Page com lista de webhooks falhados + botao retry |
| **Limite** | maxRetryCount = 3. Apos isso, status = 'abandoned' |
| **Cloud Functions** | NAO (P-02). Retry e manual via API |

---

## 4. Escopo Detalhado

### Fase 1: Automation Page Real — Firestore Integration (~3-4h)

| ID | Item | Descricao | Esforco | Stubs Resolvidos |
|:---|:-----|:----------|:--------|:----------------|
| S31-AUTO-01 | **Automation Rules CRUD Firestore** | Criar funcoes `getAutomationRules(brandId)`, `saveAutomationRule(brandId, rule)`, `toggleAutomationRule(brandId, ruleId, enabled)` em novo arquivo `lib/firebase/automation.ts`. Collection: `brands/{brandId}/automation_rules`. Usar Timestamp (nao Date). | M (~1.5h) | Stub #1 (parcial) |
| S31-AUTO-02 | **Automation Logs Firestore** | Criar funcoes `getAutomationLogs(brandId, limit)`, `updateAutomationLogStatus(brandId, logId, status, executedBy?)` em `lib/firebase/automation.ts`. Collection: `brands/{brandId}/automation_logs`. OrderBy timestamp desc. | S (~1h) | Stub #1 (parcial) |
| S31-AUTO-03 | **Automation Page Conectada** | Substituir `MOCK_RULES`, `MOCK_LOGS`, `MOCK_VARIATIONS` por dados reais. Usar `useEffect` para carregar de Firestore no mount. Approve/reject atualizam Firestore via `updateAutomationLogStatus()`. Toggle rule atualiza via `toggleAutomationRule()`. Variations vem de `getPersonalizationRules()` (DynamicContentRule.contentVariations). | M (~1.5h) | Stubs #1, #2 |

**Gate Check 1:** Automation Page carrega rules e logs do Firestore. Approve/reject persiste. Toggle rule persiste. tsc=0 + tests passing.

### Fase 2: Kill-Switch Persistence & Notification (~3-4h)

| ID | Item | Descricao | Esforco | Stubs Resolvidos |
|:---|:-----|:----------|:--------|:----------------|
| S31-KS-01 | **Kill-Switch Firestore Persist** | No `kill-switch/route.ts`: apos validacao, salvar AutomationLog com status `pending_approval` em `brands/{brandId}/automation_logs`. Incluir `requireBrandAccess`. Gerar ID unico. Mapear cada `affectedAdEntity` para o campo `context.entityId`. | M (~1.5h) | Stub #3 (parcial) |
| S31-KS-02 | **Slack Notification** | Criar helper `sendSlackNotification(webhookUrl, message)` em `lib/notifications/slack.ts`. REST puro via fetch(). Fire-and-forget (.catch log). Chamar no kill-switch route apos persist. URL do webhook via `process.env.SLACK_WEBHOOK_URL` ou MonaraTokenVault (provider: 'slack'). | S (~1h) | Stub #3 (parcial) |
| S31-KS-03 | **In-App Notification** | Criar doc em `brands/{brandId}/notifications` com `{ type: 'kill_switch', title, message, ruleId, isRead: false, createdAt: Timestamp }`. Criar helper `createInAppNotification(brandId, notification)` em `lib/firebase/automation.ts`. | S (~1h) | Enhancement |
| S31-KS-04 | **Notification Badge (Sidebar)** | Adicionar badge de notificacoes nao-lidas no Sidebar no item "Automation". Query: `brands/{brandId}/notifications` where `isRead == false`. Exibir count. Ao clicar na Automation page, marcar como lidas. | XS (~30min) | Enhancement |

**Gate Check 2:** Kill-Switch POST salva no Firestore, dispara Slack (ou loga se URL ausente), cria notificacao in-app. Badge aparece no sidebar. tsc=0 + tests passing.

### Fase 3: Rules Runtime — Personalization Resolve (~3-4h)

| ID | Item | Descricao | Esforco | Stubs Resolvidos |
|:---|:-----|:----------|:--------|:----------------|
| S31-RT-01 | **API /api/personalization/resolve** | Nova rota `POST /api/personalization/resolve`. Recebe `{ brandId, leadId }`. Fluxo: (1) requireBrandAccess, (2) buscar LeadState do Firestore (`brands/{brandId}/leads/{leadId}`), (3) obter segment do lead, (4) buscar DynamicContentRules ativas via `getPersonalizationRules(brandId)`, (5) filtrar rules cujo targetPersonaId corresponde a um AudienceScan do mesmo segment, (6) retornar contentVariations aplicaveis. | M (~2h) | Stub #5 |
| S31-RT-02 | **Matching Engine** | Criar `PersonalizationResolver.resolve(brandId, leadId)` em `lib/intelligence/personalization/resolver.ts`. Logica: buscar lead → buscar rules ativas → buscar scans → match rule.targetPersonaId com scan.id onde scan.propensity.segment == lead.segment → retornar matched contentVariations. Fallback: se zero match, retornar `{ fallback: true, variations: [] }`. | M (~1.5h) | Core logic |
| S31-RT-03 | **Hook usePersonalizedContent** | Criar hook `usePersonalizedContent(brandId, leadId)` em `lib/hooks/use-personalized-content.ts`. Chama `POST /api/personalization/resolve` via fetch. Retorna `{ variations, isLoading, error, fallback }`. Cache local via useState (nao re-fetcha se brandId+leadId nao mudar). | XS (~30min) | Client consumer |

**Gate Check 3:** API resolve retorna variacoes corretas para lead hot/warm/cold. Hook funciona no client. Fallback quando zero rules match. tsc=0 + tests passing.

### Fase 4: Webhook DLQ — Dead Letter Queue (~2-3h)

| ID | Item | Descricao | Esforco | Stubs Resolvidos |
|:---|:-----|:----------|:--------|:----------------|
| S31-DLQ-01 | **DLQ Persist no Dispatcher** | No `webhooks/dispatcher/route.ts` catch block: salvar em `brands/{brandId}/dead_letter_queue` com `{ webhookType: platform, payload: rawBody (truncado a 10KB), error: errorMessage, timestamp: Timestamp.now(), retryCount: 0, status: 'pending' }`. Fire-and-forget (.catch log). | S (~1h) | Stub #4 |
| S31-DLQ-02 | **API /api/webhooks/retry** | Nova rota `POST /api/webhooks/retry`. Recebe `{ brandId, dlqItemId }`. Fluxo: (1) requireBrandAccess, (2) buscar DLQ item, (3) se retryCount >= 3 → retornar erro, (4) re-executar PersonalizationMaestro.processInteraction() com payload original, (5) se sucesso → status='resolved', resolvedAt=Timestamp.now(), (6) se falha → incrementar retryCount, atualizar error. | M (~1.5h) | Core |
| S31-DLQ-03 | **DLQ UI na Automation Page** | Adicionar tab "Dead Letter" na Automation Page. Listar items de `brands/{brandId}/dead_letter_queue` com status != 'resolved'. Exibir: timestamp, platform, error, retryCount. Botao "Retry" chama `POST /api/webhooks/retry`. Badge de count no tab. | XS (~30min) | UI |

**Gate Check 4:** Webhook falhado salva na DLQ. Retry re-processa com sucesso. UI lista e permite retry. tsc=0 + tests passing.

### Fase 5: Rate Limiting (STRETCH — herdado S29/S30) (~3-4h)

| ID | Item | Descricao | Esforco | Stubs Resolvidos |
|:---|:-----|:----------|:--------|:----------------|
| S31-RL-01 | **Rate Limiting por brandId** | Implementar guard `checkRateLimit(brandId, action)` com Firestore counters atomicos. Schema: `brands/{brandId}/quotas/{period}`. Limites default: 500 API calls/dia, 100 scans/dia, 1000 AI credits/dia. HTTP 429 quando excedido. NUNCA rate-limitar `/api/admin/*` (P-13 heranca). | M (~3-4h) | STRETCH S29/S30 |

---

## 5. Fora de Escopo (Nao-Sprint-31)

| Item | Sprint Planejada | Justificativa |
|:-----|:----------------|:-------------|
| OAuth2 Redirect Flow (consent screen + callback) | S32 | Complexidade de UI + security |
| Segmentacao Persistida (novo campo) | CANCELADO | Ja funcional desde S29 (LeadState.segment) |
| Push Notifications | S33+ | Requer service worker + Firebase Cloud Messaging |
| WhatsApp Notifications | S33+ | Requer Twilio/Meta WhatsApp Business API |
| Automation Scheduler (cron-like rules) | S33 | Depende de runtime funcional (S31) |
| A/B Testing de contentVariations | S34 | Depende de rules runtime (S31) |
| Middleware de personalizacao SSR | CANCELADO | DT-07 S28 — dead code, NAO reativar |
| Cloud Functions para DLQ auto-retry | CANCELADO | P-02 — Zero Cloud Functions |

---

## 6. Arquitetura Tecnica

### 6.1 Flow do Rules Runtime (S31-RT-01)

```
[POST /api/personalization/resolve]
  Body: { brandId: "X", leadId: "Y" }
  │
  ├── requireBrandAccess(req, brandId)
  │
  ├── PersonalizationResolver.resolve(brandId, leadId)
  │   │
  │   ├── getDoc(brands/{brandId}/leads/{leadId})
  │   │   └── LeadState { segment: 'hot', propensityScore: 0.85, ... }
  │   │
  │   ├── getPersonalizationRules(brandId)
  │   │   └── DynamicContentRule[] { targetPersonaId, contentVariations, isActive }
  │   │   └── Filtrar: isActive === true
  │   │
  │   ├── getAudienceScans(brandId)
  │   │   └── AudienceScan[] { id, propensity.segment, ... }
  │   │
  │   ├── Match: rule.targetPersonaId ∈ scans onde scan.propensity.segment === lead.segment
  │   │
  │   └── return { matched: ContentVariation[], fallback: boolean }
  │
  └── createApiSuccess({
        leadId,
        segment: lead.segment,
        variations: matched,
        fallback: matched.length === 0
      })
```

### 6.2 Flow do Kill-Switch com Persistencia (S31-KS-01/02/03)

```
[POST /api/automation/kill-switch]
  Body: KillSwitchRequest { brandId, funnelId, reason, severity, affectedAdEntities }
  │
  ├── requireBrandAccess(req, body.brandId)
  │
  ├── Validacao: brandId + funnelId + affectedAdEntities.length > 0
  │
  ├── Para cada affectedAdEntity:
  │   └── addDoc(brands/{brandId}/automation_logs, {
  │         ruleId: 'kill_switch_manual',
  │         action: 'pause_ads',
  │         status: 'pending_approval',
  │         context: { funnelId, entityId: entity.externalId, gapDetails: { reason, severity } },
  │         timestamp: Timestamp.now()
  │       })
  │
  ├── [Fire-and-forget] sendSlackNotification(webhookUrl, {
  │     text: "🚨 Kill-Switch: {reason} | {count} entities | Brand: {brandId}"
  │   }).catch(console.error)
  │
  ├── [Fire-and-forget] createInAppNotification(brandId, {
  │     type: 'kill_switch',
  │     title: 'Kill-Switch Acionado',
  │     message: reason,
  │     isRead: false,
  │     createdAt: Timestamp.now()
  │   }).catch(console.error)
  │
  └── createApiSuccess({
        message: 'Kill-Switch registered. Pending human approval.',
        status: 'pending_approval',
        logsCreated: affectedAdEntities.length,
        notifications: { slack: true, inApp: true }
      })
```

### 6.3 Flow da Automation Page Real (S31-AUTO-03)

```
[automation/page.tsx — useEffect on mount]
  │
  ├── brandId = useBrandStore().selectedBrand?.id
  │
  ├── Promise.all([
  │     getAutomationRules(brandId),
  │     getAutomationLogs(brandId, 50),
  │     getPersonalizationRules(brandId)
  │   ])
  │
  ├── setRules(firestoreRules)    // Substitui MOCK_RULES
  ├── setLogs(firestoreLogs)      // Substitui MOCK_LOGS
  ├── setVariations(              // Substitui MOCK_VARIATIONS
  │     personalizationRules
  │       .filter(r => r.isActive)
  │       .map(r => r.contentVariations)
  │   )
  │
  ├── handleApprove(logId):
  │   └── updateAutomationLogStatus(brandId, logId, 'executed', userId)
  │
  ├── handleReject(logId):
  │   └── updateAutomationLogStatus(brandId, logId, 'rejected', userId)
  │
  └── handleToggleRule(ruleId, enabled):
      └── toggleAutomationRule(brandId, ruleId, enabled)
```

### 6.4 Flow da DLQ (S31-DLQ-01/02)

```
[webhooks/dispatcher/route.ts — catch block]
  │
  ├── catch (error):
  │   ├── [Fire-and-forget] addDoc(brands/{brandId}/dead_letter_queue, {
  │   │     webhookType: platform,
  │   │     payload: rawBody.substring(0, 10240),  // Truncar a 10KB
  │   │     error: errorMessage,
  │   │     timestamp: Timestamp.now(),
  │   │     retryCount: 0,
  │   │     status: 'pending'
  │   │   }).catch(console.error)
  │   │
  │   └── return createApiError(500, 'Internal processing error')

[POST /api/webhooks/retry]
  Body: { brandId, dlqItemId }
  │
  ├── requireBrandAccess(req, brandId)
  │
  ├── getDoc(brands/{brandId}/dead_letter_queue/{dlqItemId})
  │   └── if retryCount >= 3 → updateDoc(status: 'abandoned') + return error
  │
  ├── try:
  │   ├── payload = JSON.parse(dlqItem.payload)
  │   ├── { leadId, interaction } = EventNormalizer.normalize(...)
  │   ├── await PersonalizationMaestro.processInteraction(brandId, leadId, interaction)
  │   └── updateDoc(status: 'resolved', resolvedAt: Timestamp.now())
  │
  └── catch:
      └── updateDoc(retryCount: retryCount + 1, error: newError, timestamp: Timestamp.now())
```

---

## 7. Requisitos Funcionais Detalhados

### RF-31.01: Automation Rules CRUD Firestore

**Arquivo novo:** `app/src/lib/firebase/automation.ts`

**Funcoes a implementar:**

```typescript
// Collection: brands/{brandId}/automation_rules
export async function getAutomationRules(brandId: string): Promise<AutomationRule[]>
export async function saveAutomationRule(brandId: string, rule: Omit<AutomationRule, 'id'>): Promise<string>
export async function updateAutomationRule(brandId: string, ruleId: string, data: Partial<AutomationRule>): Promise<void>
export async function toggleAutomationRule(brandId: string, ruleId: string, isEnabled: boolean): Promise<void>
export async function deleteAutomationRule(brandId: string, ruleId: string): Promise<void>

// Collection: brands/{brandId}/automation_logs
export async function getAutomationLogs(brandId: string, maxResults?: number): Promise<AutomationLog[]>
export async function createAutomationLog(brandId: string, log: Omit<AutomationLog, 'id'>): Promise<string>
export async function updateAutomationLogStatus(
  brandId: string,
  logId: string,
  status: AutomationLog['status'],
  executedBy?: string
): Promise<void>

// Collection: brands/{brandId}/notifications
export async function createInAppNotification(brandId: string, notification: {
  type: 'kill_switch' | 'automation' | 'system';
  title: string;
  message: string;
  ruleId?: string;
  isRead: boolean;
  createdAt: Timestamp;
}): Promise<string>
export async function getUnreadNotificationCount(brandId: string): Promise<number>
export async function markNotificationsAsRead(brandId: string): Promise<void>
```

**Padroes obrigatorios:**
- Todas as funcoes usam `Timestamp` (nao `Date`)
- Collection paths: `brands/{brandId}/automation_rules`, `brands/{brandId}/automation_logs`, `brands/{brandId}/notifications`
- Isolamento multi-tenant por brandId
- Import de Firestore: `collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, orderBy, limit, where, Timestamp`

### RF-31.02: Automation Page Conectada ao Firestore

**Arquivo:** `app/src/app/automation/page.tsx`

**Substituir:**
- L26-69: `MOCK_RULES` → carregar de `getAutomationRules(brandId)`
- L71-102: `MOCK_LOGS` → carregar de `getAutomationLogs(brandId, 50)`
- L104-106: `MOCK_VARIATIONS` → derivar de `getPersonalizationRules(brandId)`
- L109: `useState(MOCK_LOGS)` → `useState<AutomationLog[]>([])`
- L110: `useState(MOCK_RULES)` → `useState<AutomationRule[]>([])`

**Adicionar:**
- `useEffect` para carregar dados do Firestore no mount
- Loading state enquanto carrega
- Empty state quando zero rules/logs
- Error boundary para falhas de conexao

**Nota:** O `brandId` deve vir de `useBrandStore()` ou contexto de auth. Se brandId nao disponivel, exibir mensagem "Selecione uma marca".

### RF-31.03: Kill-Switch Firestore Persist

**Arquivo:** `app/src/app/api/automation/kill-switch/route.ts`

**Substituir:** TODO nas L25-26

**Implementar:**
```typescript
import { createAutomationLog, createInAppNotification } from '@/lib/firebase/automation';
import { sendSlackNotification } from '@/lib/notifications/slack';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { Timestamp } from 'firebase/firestore';

// Dentro do POST handler, apos validacao:

// 1. requireBrandAccess
await requireBrandAccess(req, body.brandId);

// 2. Persistir logs para cada entidade afetada
const logIds: string[] = [];
for (const entity of body.affectedAdEntities) {
  const logId = await createAutomationLog(body.brandId, {
    ruleId: 'kill_switch_manual',
    action: 'pause_ads',
    status: 'pending_approval',
    context: {
      funnelId: body.funnelId,
      entityId: entity.externalId,
      gapDetails: {
        reason: body.reason,
        severity: body.severity,
        platform: entity.platform,
        type: entity.type
      }
    },
    timestamp: Timestamp.now()
  });
  logIds.push(logId);
}

// 3. Notificacao Slack (fire-and-forget)
const slackUrl = process.env.SLACK_WEBHOOK_URL;
if (slackUrl) {
  sendSlackNotification(slackUrl, {
    text: `🚨 *Kill-Switch Triggered*\nBrand: ${body.brandId}\nFunnel: ${body.funnelId}\nReason: ${body.reason}\nEntities: ${body.affectedAdEntities.length} ads affected`
  }).catch(err => console.error('[Kill-Switch] Slack notification failed:', err));
}

// 4. Notificacao In-App (fire-and-forget)
createInAppNotification(body.brandId, {
  type: 'kill_switch',
  title: 'Kill-Switch Acionado',
  message: `${body.reason} — ${body.affectedAdEntities.length} entidades afetadas`,
  isRead: false,
  createdAt: Timestamp.now()
}).catch(err => console.error('[Kill-Switch] In-App notification failed:', err));
```

### RF-31.04: Slack Notification Helper

**Arquivo novo:** `app/src/lib/notifications/slack.ts`

**Implementar:**
```typescript
/**
 * Envia notificacao para Slack via Incoming Webhook.
 * REST puro via fetch() — ZERO dependencias npm.
 * Fire-and-forget: caller deve usar .catch() para nao bloquear.
 */
export async function sendSlackNotification(
  webhookUrl: string,
  payload: { text: string }
): Promise<void> {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(5000) // 5s timeout
  });

  if (!response.ok) {
    throw new Error(`Slack webhook failed: ${response.status} ${response.statusText}`);
  }
}
```

### RF-31.05: Personalization Resolve API

**Arquivo novo:** `app/src/app/api/personalization/resolve/route.ts`

**Implementar:**
```typescript
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { PersonalizationResolver } from '@/lib/intelligence/personalization/resolver';

export async function POST(req: NextRequest) {
  try {
    const { brandId, leadId } = await req.json();

    if (!brandId || !leadId) {
      return createApiError(400, 'brandId and leadId are required');
    }

    await requireBrandAccess(req, brandId);

    const result = await PersonalizationResolver.resolve(brandId, leadId);

    return createApiSuccess({
      leadId,
      segment: result.segment,
      variations: result.variations,
      fallback: result.fallback,
      matchedRuleCount: result.variations.length
    });

  } catch (error) {
    console.error('[Personalization Resolve Error]:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return createApiError(500, message);
  }
}
```

### RF-31.06: Personalization Resolver (Matching Engine)

**Arquivo novo:** `app/src/lib/intelligence/personalization/resolver.ts`

**Implementar:**
```typescript
import { getPersonalizationRules, getAudienceScans } from '@/lib/firebase/personalization';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { LeadState, DynamicContentRule, AudienceScan } from '@/types/personalization';

export interface ResolveResult {
  segment: string;
  variations: DynamicContentRule['contentVariations'][];
  fallback: boolean;
}

export class PersonalizationResolver {
  /**
   * Resolve quais contentVariations aplicar para um lead especifico.
   *
   * Logica:
   * 1. Buscar LeadState → obter segment
   * 2. Buscar DynamicContentRules ativas
   * 3. Buscar AudienceScans da marca
   * 4. Match: rule.targetPersonaId in scans onde scan.propensity.segment === lead.segment
   * 5. Retornar contentVariations matched
   */
  static async resolve(brandId: string, leadId: string): Promise<ResolveResult> {
    // 1. Buscar estado do lead
    const leadRef = doc(db, 'brands', brandId, 'leads', leadId);
    const leadSnap = await getDoc(leadRef);

    if (!leadSnap.exists()) {
      return { segment: 'unknown', variations: [], fallback: true };
    }

    const lead = leadSnap.data() as LeadState;
    const leadSegment = lead.segment || 'cold';

    // 2. Buscar rules ativas
    const allRules = await getPersonalizationRules(brandId);
    const activeRules = allRules.filter(r => r.isActive);

    if (activeRules.length === 0) {
      return { segment: leadSegment, variations: [], fallback: true };
    }

    // 3. Buscar scans
    const scans = await getAudienceScans(brandId);

    // 4. Build map: scanId → segment
    const scanSegmentMap = new Map<string, string>();
    for (const scan of scans) {
      scanSegmentMap.set(scan.id, scan.propensity.segment);
    }

    // 5. Match rules cujo targetPersonaId aponta para scan do MESMO segment do lead
    const matched = activeRules.filter(rule => {
      const scanSegment = scanSegmentMap.get(rule.targetPersonaId);
      return scanSegment === leadSegment;
    });

    return {
      segment: leadSegment,
      variations: matched.map(r => r.contentVariations),
      fallback: matched.length === 0
    };
  }
}
```

### RF-31.07: Hook usePersonalizedContent

**Arquivo novo:** `app/src/lib/hooks/use-personalized-content.ts`

**Implementar:**
```typescript
'use client';

import { useState, useEffect, useRef } from 'react';
import type { DynamicContentRule } from '@/types/personalization';

interface PersonalizedContentResult {
  variations: DynamicContentRule['contentVariations'][];
  segment: string;
  fallback: boolean;
  isLoading: boolean;
  error: string | null;
}

export function usePersonalizedContent(
  brandId: string | null,
  leadId: string | null
): PersonalizedContentResult {
  const [variations, setVariations] = useState<DynamicContentRule['contentVariations'][]>([]);
  const [segment, setSegment] = useState('unknown');
  const [fallback, setFallback] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastKey = useRef('');

  useEffect(() => {
    if (!brandId || !leadId) return;

    const key = `${brandId}:${leadId}`;
    if (key === lastKey.current) return; // Cache: nao re-fetch se mesmos params
    lastKey.current = key;

    setIsLoading(true);
    setError(null);

    fetch('/api/personalization/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brandId, leadId })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setVariations(data.data.variations);
          setSegment(data.data.segment);
          setFallback(data.data.fallback);
        } else {
          setError(data.error || 'Failed to resolve personalization');
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [brandId, leadId]);

  return { variations, segment, fallback, isLoading, error };
}
```

### RF-31.08: Webhook DLQ Persist

**Arquivo:** `app/src/app/api/webhooks/dispatcher/route.ts`

**Substituir:** TODO nas L62-63

**Implementar no catch block:**
```typescript
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

// Dentro do catch:
if (brandId) {
  const dlqRef = collection(db, 'brands', brandId, 'dead_letter_queue');
  addDoc(dlqRef, {
    webhookType: platform,
    payload: rawBody.substring(0, 10240), // Truncar a 10KB
    error: errorMessage,
    timestamp: Timestamp.now(),
    retryCount: 0,
    status: 'pending'
  }).catch(dlqErr => console.error('[DLQ] Failed to persist:', dlqErr));
}
```

### RF-31.09: Webhook Retry API

**Arquivo novo:** `app/src/app/api/webhooks/retry/route.ts`

**Implementar:**
```typescript
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { EventNormalizer } from '@/lib/automation/normalizer';
import { PersonalizationMaestro } from '@/lib/intelligence/personalization/maestro';

const MAX_RETRY_COUNT = 3;

export async function POST(req: NextRequest) {
  try {
    const { brandId, dlqItemId } = await req.json();

    if (!brandId || !dlqItemId) {
      return createApiError(400, 'brandId and dlqItemId are required');
    }

    await requireBrandAccess(req, brandId);

    // 1. Buscar DLQ item
    const dlqRef = doc(db, 'brands', brandId, 'dead_letter_queue', dlqItemId);
    const dlqSnap = await getDoc(dlqRef);

    if (!dlqSnap.exists()) {
      return createApiError(404, 'DLQ item not found');
    }

    const dlqItem = dlqSnap.data();

    // 2. Verificar retry count
    if (dlqItem.retryCount >= MAX_RETRY_COUNT) {
      await updateDoc(dlqRef, { status: 'abandoned' });
      return createApiError(422, `Max retry count (${MAX_RETRY_COUNT}) exceeded. Item abandoned.`);
    }

    // 3. Re-processar
    try {
      const payload = JSON.parse(dlqItem.payload);
      const { leadId, interaction } = EventNormalizer.normalize({
        platform: dlqItem.webhookType,
        brandId,
        payload
      });

      await PersonalizationMaestro.processInteraction(brandId, leadId, interaction);

      // 4. Sucesso → marcar como resolved
      await updateDoc(dlqRef, {
        status: 'resolved',
        resolvedAt: Timestamp.now()
      });

      return createApiSuccess({ message: 'Webhook re-processed successfully', dlqItemId });

    } catch (retryError) {
      // 5. Falha → incrementar retry count
      const errorMsg = retryError instanceof Error ? retryError.message : 'Unknown error';
      await updateDoc(dlqRef, {
        retryCount: dlqItem.retryCount + 1,
        error: errorMsg,
        timestamp: Timestamp.now()
      });

      return createApiError(502, `Retry failed: ${errorMsg}`);
    }

  } catch (error) {
    console.error('[Webhook Retry Error]:', error);
    return createApiError(500, 'Internal server error');
  }
}
```

---

## 8. Tipos Novos

### 8.1 DLQ Item Type

**Arquivo:** `app/src/types/automation.ts` (adicionar)

```typescript
/**
 * Collection: brands/{brandId}/dead_letter_queue
 */
export interface DeadLetterItem {
  id: string;
  webhookType: 'meta' | 'instagram' | 'google';
  payload: string;       // JSON stringified, truncado a 10KB
  error: string;
  timestamp: Timestamp;
  retryCount: number;
  status: 'pending' | 'resolved' | 'abandoned';
  resolvedAt?: Timestamp;
}
```

### 8.2 InAppNotification Type

**Arquivo:** `app/src/types/automation.ts` (adicionar)

```typescript
/**
 * Collection: brands/{brandId}/notifications
 */
export interface InAppNotification {
  id: string;
  type: 'kill_switch' | 'automation' | 'system';
  title: string;
  message: string;
  ruleId?: string;
  isRead: boolean;
  createdAt: Timestamp;
}
```

---

## 9. Success Criteria

| # | Criterio | Verificacao | Responsavel |
|:--|:---------|:-----------|:-----------|
| CS-31.01 | Automation Page carrega rules do Firestore (`brands/{brandId}/automation_rules`) | Rules aparecem na UI apos salvar no Firestore | Dandara |
| CS-31.02 | Automation Page carrega logs do Firestore (`brands/{brandId}/automation_logs`) | Logs aparecem na UI com status correto | Dandara |
| CS-31.03 | Automation Page carrega variations de `personalization_rules` | Variations tab mostra contentVariations de rules ativas | Dandara |
| CS-31.04 | Approve action persiste `status: 'executed'` no Firestore | getDoc apos approve mostra status atualizado | Dandara |
| CS-31.05 | Reject action persiste `status: 'rejected'` no Firestore | getDoc apos reject mostra status atualizado | Dandara |
| CS-31.06 | Toggle rule persiste `isEnabled` no Firestore | getDoc apos toggle mostra isEnabled atualizado | Dandara |
| CS-31.07 | Kill-Switch POST salva AutomationLog com status `pending_approval` | Doc existe em `brands/{brandId}/automation_logs` com dados corretos | Dandara |
| CS-31.08 | Kill-Switch dispara notificacao Slack (se URL configurada) | Log confirma envio ou warning se URL ausente | Dandara |
| CS-31.09 | Kill-Switch cria notificacao in-app | Doc existe em `brands/{brandId}/notifications` com isRead=false | Dandara |
| CS-31.10 | Notification badge no sidebar mostra count correto | Badge reflete notifications nao-lidas | Dandara |
| CS-31.11 | `POST /api/personalization/resolve` retorna variacoes para lead hot | Response contem variations matched por segment | Dandara |
| CS-31.12 | Rules Runtime retorna fallback quando zero match | Response contem `fallback: true, variations: []` | Dandara |
| CS-31.13 | `usePersonalizedContent` hook funciona no client | Hook retorna variations + isLoading + error corretamente | Dandara |
| CS-31.14 | Webhook falhado salva na DLQ | Doc existe em `brands/{brandId}/dead_letter_queue` | Dandara |
| CS-31.15 | `POST /api/webhooks/retry` re-processa com sucesso | DLQ item status muda para 'resolved' | Dandara |
| CS-31.16 | Retry respeita maxRetryCount = 3 | Item com retryCount >= 3 retorna erro e status 'abandoned' | Dandara |
| CS-31.17 | DLQ UI na Automation Page lista items pendentes | Tab Dead Letter mostra items com botao retry | Dandara |
| CS-31.18 | 227+ testes passando (zero regressao) | `npm test` em cada Gate | Dandara |
| CS-31.19 | tsc=0, build=103+ rotas | `npx tsc --noEmit && npm run build` | Dandara |

---

## 10. Proibicoes (The Council's Laws)

| # | Proibicao | Justificativa |
|:--|:----------|:-------------|
| P-01 | **NUNCA adicionar dependencias npm novas** | Zero deps desde S25. Manter disciplina. Slack via fetch(), DLQ via Firestore |
| P-02 | **NUNCA usar Cloud Functions** | Restricao de projeto — serverless via Next.js API routes apenas |
| P-03 | **NUNCA usar firebase-admin** | Restricao de ambiente Windows 11 24H2 (project-context.md) |
| P-04 | **NUNCA implementar Push notifications ou WhatsApp** | Fora de escopo S31. Push requer FCM, WhatsApp requer Twilio |
| P-05 | **NUNCA alterar contratos existentes sem atualizar contract-map.yaml** | Novas rotas e collections devem ser registradas |
| P-06 | **NUNCA ativar o middleware morto (middleware.ts DT-07)** | Dead code desde S28. NAO reativar. Rules Runtime usa API dedicada |
| P-07 | **REST puro via fetch() para Slack webhook** | Zero SDK, zero dependencia. Incoming Webhook e POST simples |
| P-08 | **Timestamp (nao Date) em todos os campos de data Firestore** | Padrao Sigma. `Timestamp.now()` sempre |
| P-09 | **NUNCA query collections raiz** | SEMPRE usar `brands/{brandId}/...` — isolamento multi-tenant |
| P-10 | **NUNCA bloquear response esperando Slack/notifications** | Fire-and-forget com .catch(). Persistencia Firestore e o source of truth |
| P-11 | **NUNCA quebrar os 227 testes existentes** | Zero regressao — novos testes ADICIONAM, nao substituem |
| P-12 | **NUNCA hardcodar webhook URLs** | Slack URL vem de `process.env.SLACK_WEBHOOK_URL` ou MonaraTokenVault |
| P-13 | **NUNCA armazenar payload DLQ > 10KB** | Truncar com substring(0, 10240). Payloads grandes causam lentidao no Firestore |

---

## 11. Riscos e Mitigacoes

| # | Risco | Probabilidade | Impacto | Mitigacao |
|:--|:------|:-------------|:--------|:----------|
| R-01 | **brandId nao disponivel na Automation Page** | Media (depende de auth state) | Media — page vazia | Verificar `useBrandStore().selectedBrand?.id` no mount. Se null, exibir "Selecione uma marca" |
| R-02 | **Slack webhook URL nao configurada** | Alta (nova config) | Baixa — notificacao nao enviada | Se URL ausente, log warning e continuar. Kill-Switch funciona sem Slack (Firestore e o source of truth) |
| R-03 | **DLQ payload corrompido impede retry** | Baixa | Media — item irrecuperavel | JSON.parse no retry com try/catch. Se falhar, status='abandoned' com erro descritivo |
| R-04 | **PersonalizationResolver sem scans gera zero matches** | Media (marca nova sem scans) | Baixa — fallback retornado | `fallback: true` com `variations: []` e comportamento esperado. UI exibe conteudo default |
| R-05 | **Firestore quota com DLQ acumulando** | Baixa (DLQ e para falhas, nao para todos webhooks) | Baixa — DLQ para de persistir | Fire-and-forget .catch() no persist. DLQ items tem TTL implicito (UI mostra apenas recentes) |
| R-06 | **Automation Page lenta com muitos logs** | Media (marcas ativas geram muitos logs) | Media — UX lenta | `getAutomationLogs(brandId, 50)` com limit. Paginacao futura se necessario |
| R-07 | **Sprint excede 16h** | Baixa (escopo bem definido) | Baixa — Rate Limiting (STRETCH) move para S32 |  Rate Limiting e STRETCH. Se estouro, S32 P0 obrigatorio |

---

## 12. Estimativas por Fase

| Fase | Items | Esforco | Acumulado |
|:-----|:------|:--------|:----------|
| **Fase 1: Automation Page Real** | S31-AUTO-01, AUTO-02, AUTO-03 | ~3-4h | ~3-4h |
| **Fase 2: Kill-Switch Persist** | S31-KS-01, KS-02, KS-03, KS-04 | ~3-4h | ~6-8h |
| **Fase 3: Rules Runtime** | S31-RT-01, RT-02, RT-03 | ~3-4h | ~9-12h |
| **Fase 4: Webhook DLQ** | S31-DLQ-01, DLQ-02, DLQ-03 | ~2-3h | ~11-15h |
| **QA Final** | Gate checks + regression | ~1h | ~12-16h |
| **STRETCH: Rate Limiting** | S31-RL-01 | ~3-4h | ~15-20h |

**Total sem STRETCH:** ~12-16h  
**Total com STRETCH:** ~15-20h

**Nota:** Estimativa conservadora. Nenhuma integracao com API externa (diferente de S30), o que reduz risco de surpresas.

---

## 13. Gate Checks

| Gate | Quando | Criterios | Acao se Falhar |
|:-----|:-------|:----------|:-------------|
| **Gate 1** | Apos Fase 1 (Automation Page) | Page carrega rules/logs do Firestore. Approve/reject/toggle persiste. tsc=0, tests passing | NAO prosseguir para Fase 2 |
| **Gate 2** | Apos Fase 2 (Kill-Switch) | Kill-Switch salva no Firestore + Slack funcional + in-app notification + badge. tsc=0, tests passing | NAO prosseguir para Fase 3 |
| **Gate 3** | Apos Fase 3 (Rules Runtime) | API resolve retorna variacoes corretas por segment. Hook funcional. Fallback OK. tsc=0, tests passing | NAO prosseguir para Fase 4 |
| **Gate 4** | Apos Fase 4 (DLQ) | Webhook falhado salva na DLQ. Retry funcional. UI lista items. tsc=0, tests passing | Finalizar sprint sem STRETCH |
| **Gate QA** | Apos todas as fases | CS-31.01 a CS-31.19 verificados. 227+ tests. tsc=0. Build OK. Zero regressao | Corrigir antes de fechar sprint |

---

## 14. Padroes Sigma Obrigatorios (Heranca)

Todos os padroes estabelecidos nas sprints anteriores DEVEM ser mantidos:

| Padrao | Descricao | Referencia |
|:-------|:----------|:-----------|
| `createApiError(status, message)` | Formato unico de resposta de erro API | Sigma PA-04 |
| `createApiSuccess(data)` | Formato unico de resposta de sucesso API | Sigma PA-04 |
| `requireBrandAccess(req, brandId)` | Auth em rotas brand-scoped | Sigma |
| `Timestamp` (nao `Date`) | Campos de data no Firestore | Sigma |
| `export const dynamic = 'force-dynamic'` | Rotas dinamicas no Vercel | Sigma |
| Isolamento multi-tenant por `brandId` | Zero acesso cross-tenant | Sigma |
| Fire-and-forget para persist nao-critica | `.catch()` para logging de persist | S29 PA-03 |
| Zero `[key: string]: unknown` | Interfaces tipadas | Sigma |
| Zero `firebase-admin` / `google-cloud/*` | Restricao de ambiente | project-context.md |
| REST puro via fetch() | Zero SDKs npm para APIs externas | S30 D-02 |

---

## 15. Arquivos Impactados (Mapa de Impacto)

### Arquivos Modificados

| Arquivo | Item(s) | Tipo de Mudanca |
|:--------|:--------|:---------------|
| `app/automation/page.tsx` | S31-AUTO-03 | Remover MOCK_RULES/LOGS/VARIATIONS, conectar Firestore |
| `app/api/automation/kill-switch/route.ts` | S31-KS-01 | Substituir TODOs por persist + notificacao |
| `app/api/webhooks/dispatcher/route.ts` | S31-DLQ-01 | Adicionar DLQ persist no catch block |
| `types/automation.ts` | S31-DLQ/KS | Adicionar DeadLetterItem + InAppNotification types |
| `components/layout/sidebar.tsx` | S31-KS-04 | Adicionar notification badge no item Automation |

### Arquivos Criados (Novos)

| Arquivo | Item | Descricao |
|:--------|:-----|:----------|
| `lib/firebase/automation.ts` | S31-AUTO-01/02 | CRUD para automation_rules, automation_logs, notifications |
| `lib/notifications/slack.ts` | S31-KS-02 | Helper de notificacao Slack via fetch() |
| `app/api/personalization/resolve/route.ts` | S31-RT-01 | API de resolucao de conteudo dinamico |
| `lib/intelligence/personalization/resolver.ts` | S31-RT-02 | Matching engine de personalizacao |
| `lib/hooks/use-personalized-content.ts` | S31-RT-03 | Hook client-side para conteudo personalizado |
| `app/api/webhooks/retry/route.ts` | S31-DLQ-02 | API de retry manual de webhooks falhados |

### Arquivos NAO Tocados (Preservados)

| Arquivo | Justificativa |
|:--------|:-------------|
| `lib/firebase/personalization.ts` | CRUD intocado — funcional desde S25 |
| `lib/intelligence/personalization/propensity.ts` | PropensityEngine intocado — funcional desde S28 |
| `lib/intelligence/personalization/engine.ts` | AudienceIntelligenceEngine intocado |
| `lib/intelligence/personalization/middleware.ts` | DEAD CODE (DT-07 S28) — NAO tocar |
| `lib/automation/engine.ts` | AutomationEngine intocado — ja funcional |
| `components/personalization/rule-editor.tsx` | UI CRUD intocado |
| `lib/firebase/vault.ts` | MonaraTokenVault intocado — ja funcional (S30) |
| `lib/utils/api-response.ts` | Helpers Sigma intocados |
| Todos os 227 testes existentes | P-11 — zero regressao |

---

## 16. Testes Recomendados (Novos)

| # | Teste | Tipo | Arquivo Sugerido |
|:--|:------|:-----|:----------------|
| T-01 | `getAutomationRules` retorna rules da collection correta | Unit | `__tests__/lib/firebase/automation.test.ts` |
| T-02 | `getAutomationLogs` respeita limit e orderBy | Unit | `__tests__/lib/firebase/automation.test.ts` |
| T-03 | `updateAutomationLogStatus` persiste status + executedBy | Unit | `__tests__/lib/firebase/automation.test.ts` |
| T-04 | Kill-Switch POST com dados validos cria logs + notifications | Integration | `__tests__/api/kill-switch.test.ts` |
| T-05 | Kill-Switch POST sem brandId retorna 400 | Integration | `__tests__/api/kill-switch.test.ts` |
| T-06 | `sendSlackNotification` com URL valida envia POST | Unit (mock fetch) | `__tests__/lib/notifications/slack.test.ts` |
| T-07 | `sendSlackNotification` com timeout dispara erro | Unit (mock fetch) | `__tests__/lib/notifications/slack.test.ts` |
| T-08 | `PersonalizationResolver.resolve` retorna variacoes para lead hot | Unit | `__tests__/lib/intelligence/resolver.test.ts` |
| T-09 | `PersonalizationResolver.resolve` retorna fallback para lead sem match | Unit | `__tests__/lib/intelligence/resolver.test.ts` |
| T-10 | `PersonalizationResolver.resolve` ignora rules inativas | Unit | `__tests__/lib/intelligence/resolver.test.ts` |
| T-11 | `POST /api/personalization/resolve` retorna 400 sem brandId | Integration | `__tests__/api/personalization-resolve.test.ts` |
| T-12 | DLQ persist no dispatcher trunca payload a 10KB | Unit | `__tests__/api/webhooks-dispatcher.test.ts` |
| T-13 | `POST /api/webhooks/retry` com item valido resolve | Integration | `__tests__/api/webhooks-retry.test.ts` |
| T-14 | `POST /api/webhooks/retry` respeita maxRetryCount=3 | Integration | `__tests__/api/webhooks-retry.test.ts` |
| T-15 | `usePersonalizedContent` hook retorna isLoading/error/variations | Unit (React Testing Library) | `__tests__/hooks/use-personalized-content.test.ts` |

**Nota:** Todos os testes de Firestore devem usar mocks de `firebase/firestore` (via `jest.mock()`). NUNCA chamar Firestore real em testes automatizados.

---

## 17. Sequencia de Execucao Recomendada

```
[FASE 1 — Automation Page Real (GATE)]
  S31-AUTO-01 (Automation CRUD Firestore, M) — fundacao
  S31-AUTO-02 (Automation Logs Firestore, S) — depende de AUTO-01
  S31-AUTO-03 (Automation Page Conectada, M) — depende de AUTO-01 + AUTO-02

  ── GATE CHECK 1 ── (Page real + tsc + build + tests) ──

[FASE 2 — Kill-Switch Persistence (GATE)]
  S31-KS-01 (Firestore Persist, M) — depende de AUTO-01 (createAutomationLog)
  S31-KS-02 (Slack Notification, S) — independente
  S31-KS-03 (In-App Notification, S) — depende de AUTO-01 (createInAppNotification)
  S31-KS-04 (Notification Badge, XS) — depende de KS-03

  ── GATE CHECK 2 ── (Kill-Switch completo + tsc + build + tests) ──

[FASE 3 — Rules Runtime (GATE)]
  S31-RT-02 (Matching Engine, M) — core (resolver.ts)
  S31-RT-01 (API /personalization/resolve, M) — depende de RT-02
  S31-RT-03 (Hook usePersonalizedContent, XS) — depende de RT-01

  ── GATE CHECK 3 ── (Runtime funcional + tsc + build + tests) ──

[FASE 4 — Webhook DLQ (GATE)]
  S31-DLQ-01 (DLQ Persist no Dispatcher, S) — independente
  S31-DLQ-02 (API /webhooks/retry, M) — depende de DLQ-01
  S31-DLQ-03 (DLQ UI na Automation Page, XS) — depende de DLQ-02

  ── GATE CHECK 4 ── (DLQ completa + tsc + build + tests) ──

[FASE 5 — STRETCH]
  S31-RL-01 (Rate Limiting, M) — somente apos Gate 4 aprovado

[QA FINAL]
  Dandara valida CS-31.01 a CS-31.19 + regressao completa
```

---

## 18. Dependencias

| Dependencia | Status | Acao |
|:-----------|:-------|:-----|
| Sprint 30 concluida (QA 98/100) | CONFIRMADA | Baseline seguro |
| `getPersonalizationRules(brandId)` funcional | CONFIRMADA | CRUD completo em personalization.ts |
| `getAudienceScans(brandId)` funcional | CONFIRMADA | Funcional em personalization.ts |
| PropensityEngine.persistSegment() funcional | CONFIRMADA | LeadState.segment salvo desde S28 |
| LeadState com campo `segment` | CONFIRMADA | 12 campos concretos (S29) |
| DynamicContentRule com `contentVariations` | CONFIRMADA | Type existente |
| AutomationRule + AutomationLog types | CONFIRMADA | Types em automation.ts |
| `createApiError`/`createApiSuccess` (Sigma) | CONFIRMADA | 54+ rotas |
| `requireBrandAccess` (Sigma) | CONFIRMADA | Auth em todas as rotas |
| MonaraTokenVault funcional (S18/S30) | CONFIRMADA | Para Slack URL opcional |
| EventNormalizer.normalize() funcional | CONFIRMADA | Para DLQ retry |
| PersonalizationMaestro.processInteraction() funcional | CONFIRMADA | Para DLQ retry |
| Nenhum MCP/CLI novo | CONFIRMADA | N/A |
| Nenhuma dependencia npm nova | CONFIRMADA | P-01 |
| Firebase Firestore (Client SDK) | CONFIRMADA | Configurado |

---

## 19. Mapa de Dependencias entre Items

```
S31-AUTO-01 (Automation CRUD Firestore)
  ↓
  ├── S31-AUTO-02 (Automation Logs Firestore)
  │     ↓
  │     S31-AUTO-03 (Automation Page Conectada) ←── depende de AUTO-01 + AUTO-02
  │
  ├── S31-KS-01 (Kill-Switch Persist) ←── usa createAutomationLog
  │     ↓
  │     S31-KS-03 (In-App Notification) ←── usa createInAppNotification
  │           ↓
  │           S31-KS-04 (Notification Badge) ←── usa getUnreadNotificationCount
  │
  └── S31-KS-02 (Slack Notification) ←── independente (novo arquivo)

S31-RT-02 (Matching Engine / resolver.ts)
  ↓
  S31-RT-01 (API /personalization/resolve) ←── depende de RT-02
    ↓
    S31-RT-03 (Hook usePersonalizedContent) ←── depende de RT-01

S31-DLQ-01 (DLQ Persist no Dispatcher) ←── independente
  ↓
  S31-DLQ-02 (API /webhooks/retry) ←── depende de DLQ-01 (precisa de items na DLQ)
    ↓
    S31-DLQ-03 (DLQ UI na Automation Page) ←── depende de DLQ-02

S31-RL-01 (Rate Limiting) ←── STRETCH, independente do resto
```

---

## Apendice A: Schema de Collections Firestore (Novas/Modificadas)

```
brands/{brandId}/
  ├── automation_rules/           ←── S31-AUTO-01
  │   └── {ruleId}
  │       ├── id: string
  │       ├── name: string
  │       ├── isEnabled: boolean
  │       ├── trigger: { type, metric?, operator, value, stepType? }
  │       ├── action: { type, params: { platform?, targetLevel, adjustmentValue? } }
  │       └── guardrails: { requireApproval: true, cooldownPeriod: number }
  │
  ├── automation_logs/            ←── S31-AUTO-02, S31-KS-01
  │   └── {logId}
  │       ├── id: string
  │       ├── ruleId: string
  │       ├── action: string
  │       ├── status: 'pending_approval' | 'executed' | 'rejected' | 'failed'
  │       ├── context: { funnelId, entityId, gapDetails }
  │       ├── executedBy?: string
  │       └── timestamp: Timestamp
  │
  ├── notifications/              ←── S31-KS-03
  │   └── {notificationId}
  │       ├── id: string
  │       ├── type: 'kill_switch' | 'automation' | 'system'
  │       ├── title: string
  │       ├── message: string
  │       ├── ruleId?: string
  │       ├── isRead: boolean
  │       └── createdAt: Timestamp
  │
  ├── dead_letter_queue/          ←── S31-DLQ-01
  │   └── {dlqItemId}
  │       ├── id: string
  │       ├── webhookType: 'meta' | 'instagram' | 'google'
  │       ├── payload: string (max 10KB)
  │       ├── error: string
  │       ├── timestamp: Timestamp
  │       ├── retryCount: number
  │       ├── status: 'pending' | 'resolved' | 'abandoned'
  │       └── resolvedAt?: Timestamp
  │
  ├── leads/{leadId}              ←── Existente (S28-S29), lido por RT-02
  ├── personalization_rules/      ←── Existente (S25), lido por RT-02
  ├── audience_scans/             ←── Existente (S29), lido por RT-02
  └── secrets/                    ←── Existente (S18/S30)
```

---

## Apendice B: Variaveis de Ambiente Novas

```env
# Slack Incoming Webhook URL (opcional — se ausente, notificacao Slack e skippada)
SLACK_WEBHOOK_URL=your-slack-webhook-url-here
```

**Nota:** Adicionar ao `.env.example` com valor placeholder. NAO commitar URL real.

---

## Apendice C: Referencia de Infraestrutura Existente

| Recurso | Arquivo | Status |
|:--------|:--------|:-------|
| Personalization CRUD | `lib/firebase/personalization.ts` | Funcional — getPersonalizationRules, savePersonalizationRule, etc. |
| Personalization Types | `types/personalization.ts` | Funcional — DynamicContentRule, LeadState, AudienceScan |
| PropensityEngine | `lib/intelligence/personalization/propensity.ts` | Funcional — calculate() + persistSegment() |
| AudienceIntelligenceEngine | `lib/intelligence/personalization/engine.ts` | Funcional — runDeepScan() |
| Rule Editor UI | `components/personalization/rule-editor.tsx` | Funcional — CRUD visual |
| AutomationEngine | `lib/automation/engine.ts` | Funcional — evaluateAutopsy, evaluatePerformanceMetrics, checkKillSwitch |
| AutomationRule/Log Types | `types/automation.ts` | Funcional — tipos definidos |
| API Response Helpers | `lib/utils/api-response.ts` | Funcional — createApiError, createApiSuccess |
| MonaraTokenVault | `lib/firebase/vault.ts` | Funcional — saveToken, getToken, getValidToken |
| EventNormalizer | `lib/automation/normalizer.ts` | Funcional — normalize() |
| PersonalizationMaestro | `lib/intelligence/personalization/maestro.ts` | Funcional — processInteraction() |
| Middleware (DEAD) | `lib/intelligence/personalization/middleware.ts` | DEAD CODE (DT-07 S28) — NAO usar |

---

*PRD elaborado por Iuran (PM) — NETECMT v2.0*  
*Sprint 31: Automation Engine & Rules Runtime | 07/02/2026*  
*Tipo: Feature Sprint | Automacao & Runtime*  
*Estimativa: ~12-16h (core) / ~15-20h (com STRETCH)*  
*5 stubs/TODOs eliminados | 6 arquivos novos | 0 dependencias npm | 0 Cloud Functions*  
*Proximo passo: Architecture Review (Athos)*
