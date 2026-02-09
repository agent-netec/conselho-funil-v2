# Stories Distilled: Sprint 31 — Automation Engine & Rules Runtime
**Preparado por:** Leticia (SM)
**Data:** 07/02/2026
**Lanes:** automation + personalization_engine + operations_infrastructure (cross-cutting)
**Tipo:** Feature Sprint (Automacao & Runtime)

> **IMPORTANTE:** Este documento incorpora os **12 Decision Topics (DTs)** e as **Proibicoes Arquiteturais (PA-01 a PA-06)** do Architecture Review (Athos). Cada DT incorporado esta marcado com `[ARCH DT-XX]`. Os 3 blocking DTs (DT-01, DT-02, DT-03) foram RESOLVIDOS e as correcoes estao embutidas nas stories.
>
> **Padroes Sigma OBRIGATORIOS** em todo codigo novo: `createApiError`/`createApiSuccess`, `requireBrandAccess` (de `@/lib/auth/brand-guard`), `Timestamp` (nao Date), `force-dynamic`, isolamento multi-tenant por `brandId`, REST puro via `fetch()` (zero SDK npm novo).

---

## Fase 1: Automation Page Real [~3.5-4.5h + Gate]

> **Sequencia:** AUTO-01 → AUTO-02 → AUTO-03 → **GATE CHECK 1**
>
> Esta fase elimina os 5 stubs/TODOs de mock na Automation Page, conectando-a ao Firestore.

---

### S31-AUTO-01: Automation Rules CRUD Firestore [M, ~1.5h]

**Objetivo:** Criar modulo `lib/firebase/automation.ts` com funcoes CRUD para `automation_rules`, `automation_logs` e `notifications` — fundacao para todas as stories da sprint.

**Acao:**
1. CRIAR `app/src/lib/firebase/automation.ts` com as seguintes funcoes:

```typescript
import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc,
  query, orderBy, limit, where, Timestamp, getCountFromServer
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { AutomationRule, AutomationLog } from '@/types/automation';

// ====== AUTOMATION RULES ======
// Collection: brands/{brandId}/automation_rules

export async function getAutomationRules(brandId: string): Promise<AutomationRule[]> {
  const rulesRef = collection(db, 'brands', brandId, 'automation_rules');
  const snap = await getDocs(rulesRef);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as AutomationRule));
}

export async function saveAutomationRule(
  brandId: string,
  rule: Omit<AutomationRule, 'id'>
): Promise<string> {
  const rulesRef = collection(db, 'brands', brandId, 'automation_rules');
  const docRef = await addDoc(rulesRef, rule);
  return docRef.id;
}

export async function updateAutomationRule(
  brandId: string,
  ruleId: string,
  data: Partial<AutomationRule>
): Promise<void> {
  const ruleRef = doc(db, 'brands', brandId, 'automation_rules', ruleId);
  await updateDoc(ruleRef, data);
}

export async function toggleAutomationRule(
  brandId: string,
  ruleId: string,
  isEnabled: boolean
): Promise<void> {
  const ruleRef = doc(db, 'brands', brandId, 'automation_rules', ruleId);
  await updateDoc(ruleRef, { isEnabled });
}

export async function deleteAutomationRule(
  brandId: string,
  ruleId: string
): Promise<void> {
  const ruleRef = doc(db, 'brands', brandId, 'automation_rules', ruleId);
  await deleteDoc(ruleRef);
}

// ====== AUTOMATION LOGS ======
// Collection: brands/{brandId}/automation_logs

export async function getAutomationLogs(
  brandId: string,
  maxResults: number = 50
): Promise<AutomationLog[]> {
  const logsRef = collection(db, 'brands', brandId, 'automation_logs');
  const q = query(logsRef, orderBy('timestamp', 'desc'), limit(maxResults));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as AutomationLog));
}

export async function createAutomationLog(
  brandId: string,
  log: Omit<AutomationLog, 'id'>
): Promise<string> {
  const logsRef = collection(db, 'brands', brandId, 'automation_logs');
  const docRef = await addDoc(logsRef, log);
  return docRef.id;
}

export async function updateAutomationLogStatus(
  brandId: string,
  logId: string,
  status: AutomationLog['status'],
  executedBy?: string
): Promise<void> {
  const logRef = doc(db, 'brands', brandId, 'automation_logs', logId);
  const updateData: Record<string, unknown> = { status };
  if (executedBy) updateData.executedBy = executedBy;
  await updateDoc(logRef, updateData);
}

// ====== NOTIFICATIONS ======
// Collection: brands/{brandId}/notifications

export async function createInAppNotification(
  brandId: string,
  notification: {
    type: 'kill_switch' | 'automation' | 'system';
    title: string;
    message: string;
    ruleId?: string;
    isRead: boolean;
    createdAt: Timestamp;
  }
): Promise<string> {
  const notifRef = collection(db, 'brands', brandId, 'notifications');
  const docRef = await addDoc(notifRef, notification);
  return docRef.id;
}

export async function getUnreadNotificationCount(brandId: string): Promise<number> {
  const notifRef = collection(db, 'brands', brandId, 'notifications');
  const q = query(notifRef, where('isRead', '==', false));
  const snap = await getCountFromServer(q);
  return snap.data().count;
}

export async function markNotificationsAsRead(brandId: string): Promise<void> {
  const notifRef = collection(db, 'brands', brandId, 'notifications');
  const q = query(notifRef, where('isRead', '==', false));
  const snap = await getDocs(q);
  const updates = snap.docs.map(d => updateDoc(d.ref, { isRead: true }));
  await Promise.all(updates);
}
```

**Padroes obrigatorios:**
- Todas as funcoes usam `Timestamp` (nao `Date`) — P-08
- Collection paths SEMPRE com `brands/{brandId}/...` — P-09
- Import de Firestore client SDK (NUNCA firebase-admin) — P-03

**Arquivos:**
- `app/src/lib/firebase/automation.ts` — **CRIAR**

**DTs referenciados:** Nenhum blocking (modulo novo)
**Dependencias:** Nenhuma
**Gate Check:** S31-GATE-01 (Sim)
**SC mapeados:** CS-31.01, CS-31.02, CS-31.04, CS-31.05, CS-31.06

**AC:**
- [ ] `getAutomationRules(brandId)` retorna rules de `brands/{brandId}/automation_rules`
- [ ] `getAutomationLogs(brandId, limit)` retorna logs ordenados por `timestamp desc`
- [ ] `createAutomationLog(brandId, log)` adiciona doc e retorna ID
- [ ] `updateAutomationLogStatus(brandId, logId, status, executedBy?)` atualiza status
- [ ] `toggleAutomationRule(brandId, ruleId, isEnabled)` atualiza isEnabled
- [ ] `createInAppNotification(brandId, notification)` cria doc e retorna ID
- [ ] `getUnreadNotificationCount(brandId)` retorna count de `isRead == false`
- [ ] `markNotificationsAsRead(brandId)` atualiza todos `isRead` para `true`
- [ ] Todas as funcoes usam `Timestamp` (zero `Date`)
- [ ] `npx tsc --noEmit` = 0

---

### S31-AUTO-02: Automation Logs Firestore — DLQ Types [S, ~1h]

**Objetivo:** Adicionar tipos `DeadLetterItem` e `InAppNotification` em `types/automation.ts` e tipar `gapDetails` (removendo `any`).

> **[ARCH DT-07 — P2, RESOLVIDO]:** `gapDetails: any` → tipo estruturado.
> **[ARCH DT-12 — P2]:** `DeadLetterItem.webhookType` deve incluir `'stripe'`.

**Acao:**
1. Em `app/src/types/automation.ts`, ADICIONAR os tipos novos e MODIFICAR `gapDetails`:

```typescript
import { Timestamp } from 'firebase/firestore';

/**
 * gapDetails — tipado (substitui `any` — DT-07)
 */
export interface KillSwitchGapDetails {
  reason: string;
  severity: string;
  platform?: string;
  type?: string;
}

// ATUALIZAR o tipo context em AutomationLog:
// gapDetails: any → gapDetails: KillSwitchGapDetails | Record<string, unknown>

/**
 * Collection: brands/{brandId}/dead_letter_queue
 * Story: S31-DLQ-01
 */
export interface DeadLetterItem {
  id: string;
  webhookType: 'meta' | 'instagram' | 'google' | 'stripe'; // DT-12: inclui 'stripe'
  payload: string;       // JSON stringified, truncado a 10KB
  error: string;
  timestamp: Timestamp;
  retryCount: number;
  status: 'pending' | 'resolved' | 'abandoned';
  resolvedAt?: Timestamp;
}

/**
 * Collection: brands/{brandId}/notifications
 * Story: S31-KS-03
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

2. MODIFICAR o campo `gapDetails` no tipo `AutomationLog.context`:
   - Substituir `gapDetails: any` por `gapDetails: KillSwitchGapDetails | Record<string, unknown>`
   - Verificar que nenhum outro consumer quebra (rg "gapDetails" para confirmar)

**Arquivos:**
- `app/src/types/automation.ts` — **MODIFICAR** (adicionar tipos + tipar gapDetails)

**DTs referenciados:** DT-07, DT-12
**Dependencias:** S31-AUTO-01 concluido (types usados pelas funcoes CRUD)
**Gate Check:** S31-GATE-01 (Sim)
**SC mapeados:** CS-31.14, CS-31.19

**AC:**
- [ ] `DeadLetterItem` interface exportada com todos os campos
- [ ] `DeadLetterItem.webhookType` inclui `'stripe'` (DT-12)
- [ ] `InAppNotification` interface exportada com todos os campos
- [ ] `KillSwitchGapDetails` interface exportada
- [ ] `gapDetails` tipado (nao mais `any`) — DT-07
- [ ] Zero breaking change em consumers existentes de `AutomationLog`
- [ ] `npx tsc --noEmit` = 0

---

### S31-AUTO-03: Automation Page Conectada ao Firestore [M+, ~2h]

**Objetivo:** Substituir `MOCK_RULES`, `MOCK_LOGS`, `MOCK_VARIATIONS` por dados reais do Firestore. Adicionar loading state, empty state e null check para brandId.

> **[ARCH DT-02 — P0, RESOLVIDO]:** `useBrandStore()` NAO tem `activeBrandId`. O acesso correto e `selectedBrand?.id`.

**Acao:**
1. Em `app/src/app/automation/page.tsx`:
   - REMOVER `MOCK_RULES` (L26-69), `MOCK_LOGS` (L71-102), `MOCK_VARIATIONS` (L104-106)
   - REMOVER `useState(MOCK_LOGS)` (L109) e `useState(MOCK_RULES)` (L110)
   - ADICIONAR imports:
     ```typescript
     import { getAutomationRules, getAutomationLogs, updateAutomationLogStatus, toggleAutomationRule } from '@/lib/firebase/automation';
     import { getPersonalizationRules } from '@/lib/firebase/personalization';
     import { useBrandStore } from '@/lib/stores/brand-store';
     ```
   - ADICIONAR pattern de brandId seguro (DT-02):
     ```typescript
     const { selectedBrand } = useBrandStore();
     
     if (!selectedBrand) {
       return (
         <div className="flex items-center justify-center h-96 text-zinc-500">
           Selecione uma marca para continuar.
         </div>
       );
     }
     
     const brandId = selectedBrand.id;
     ```
   - ADICIONAR `useState` inicializados com `[]` (nao mocks):
     ```typescript
     const [rules, setRules] = useState<AutomationRule[]>([]);
     const [logs, setLogs] = useState<AutomationLog[]>([]);
     const [variations, setVariations] = useState<any[]>([]);
     const [isLoading, setIsLoading] = useState(true);
     ```
   - ADICIONAR `useEffect` para carregar dados do Firestore no mount:
     ```typescript
     useEffect(() => {
       if (!brandId) return;
       setIsLoading(true);
       
       Promise.all([
         getAutomationRules(brandId),
         getAutomationLogs(brandId, 50),
         getPersonalizationRules(brandId),
       ])
         .then(([firestoreRules, firestoreLogs, personalizationRules]) => {
           setRules(firestoreRules);
           setLogs(firestoreLogs);
           setVariations(
             personalizationRules
               .filter(r => r.isActive)
               .map(r => r.contentVariations)
           );
         })
         .catch(err => console.error('[Automation Page] Failed to load data:', err))
         .finally(() => setIsLoading(false));
     }, [brandId]);
     ```
   - ADICIONAR loading skeleton:
     ```typescript
     if (isLoading) {
       return <div className="animate-pulse space-y-4 p-8">
         <div className="h-8 bg-zinc-800 rounded w-1/3" />
         <div className="h-64 bg-zinc-800 rounded" />
       </div>;
     }
     ```
   - MODIFICAR handlers de approve/reject/toggle:
     ```typescript
     const handleApprove = async (logId: string) => {
       await updateAutomationLogStatus(brandId, logId, 'executed', selectedBrand?.name || 'user');
       setLogs(prev => prev.map(l => l.id === logId ? { ...l, status: 'executed' } : l));
     };
     
     const handleReject = async (logId: string) => {
       await updateAutomationLogStatus(brandId, logId, 'rejected', selectedBrand?.name || 'user');
       setLogs(prev => prev.map(l => l.id === logId ? { ...l, status: 'rejected' } : l));
     };
     
     const handleToggleRule = async (ruleId: string, enabled: boolean) => {
       await toggleAutomationRule(brandId, ruleId, enabled);
       setRules(prev => prev.map(r => r.id === ruleId ? { ...r, isEnabled: enabled } : r));
     };
     ```

**Arquivos:**
- `app/src/app/automation/page.tsx` — **MODIFICAR** (substituir mocks + conectar Firestore)

**Leitura (NAO MODIFICAR):**
- `app/src/lib/firebase/automation.ts` — CRUD (criado em AUTO-01)
- `app/src/lib/firebase/personalization.ts` — `getPersonalizationRules(brandId)` (existente, intocado)
- `app/src/lib/stores/brand-store.ts` — `useBrandStore()` (existente, intocado)

**DTs referenciados:** DT-02 (BLOCKING — RESOLVIDO)
**Dependencias:** S31-AUTO-01 + S31-AUTO-02 concluidos
**Gate Check:** S31-GATE-01 (Sim)
**SC mapeados:** CS-31.01, CS-31.02, CS-31.03, CS-31.04, CS-31.05, CS-31.06

**AC:**
- [ ] Zero `MOCK_RULES`, `MOCK_LOGS`, `MOCK_VARIATIONS` no arquivo
- [ ] `brandId` obtido via `useBrandStore().selectedBrand?.id` (DT-02 — NAO `activeBrandId`)
- [ ] Null check para `selectedBrand` com mensagem "Selecione uma marca"
- [ ] `useEffect` carrega dados do Firestore no mount
- [ ] Loading skeleton enquanto carrega
- [ ] Approve persiste `status: 'executed'` via `updateAutomationLogStatus()`
- [ ] Reject persiste `status: 'rejected'` via `updateAutomationLogStatus()`
- [ ] Toggle rule persiste `isEnabled` via `toggleAutomationRule()`
- [ ] Variations derivadas de `getPersonalizationRules(brandId).filter(r => r.isActive)`
- [ ] `npx tsc --noEmit` = 0

---

### S31-GATE-01: Gate Check 1 — Automation Page Real [XS, ~15min] — GATE

**Objetivo:** Validar que a Automation Page esta conectada ao Firestore. **Fase 2 NAO pode iniciar sem este gate aprovado.**

**Checklist de Validacao:**

| # | Verificacao | Comando/Metodo | Resultado Esperado |
|:--|:-----------|:--------------|:------------------|
| G1-01 | Zero mocks | `rg "MOCK_RULES\|MOCK_LOGS\|MOCK_VARIATIONS" app/src/app/automation/page.tsx` | 0 matches |
| G1-02 | Firestore CRUD criado | `rg "getAutomationRules" app/src/lib/firebase/automation.ts` | 1+ match |
| G1-03 | BrandId correto | `rg "selectedBrand" app/src/app/automation/page.tsx` | 1+ match (NAO activeBrandId) |
| G1-04 | Zero activeBrandId | `rg "activeBrandId" app/src/app/automation/page.tsx` | 0 matches |
| G1-05 | Types atualizados | `rg "DeadLetterItem" app/src/types/automation.ts` | 1+ match |
| G1-06 | gapDetails tipado | `rg "gapDetails: any" app/src/types/automation.ts` | 0 matches |
| G1-07 | TypeScript limpo | `npx tsc --noEmit` | Exit code 0 |
| G1-08 | Build sucesso | `npm run build` | Exit code 0, >= 103 rotas |
| G1-09 | Testes passando | `npm test` | >= 227/227 pass, 0 fail |

**Regra ABSOLUTA:** Fase 2 so inicia se G1-01 a G1-09 todos ✅.

**AC:**
- [ ] G1-01 a G1-09 todos aprovados
- [ ] Baseline intacto: 227/227 testes, tsc=0, build OK

---

## Fase 2: Kill-Switch Persistence & Notification [~3.5-4.5h + Gate]

> **PRE-REQUISITO ABSOLUTO:** S31-GATE-01 aprovado.
>
> **Sequencia:** KS-01 (depende de AUTO-01) → KS-02 (paralelo) → KS-03 (depende de AUTO-01) → KS-04 (depende de KS-03)
>
> KS-02 (Slack) e independente e pode ser desenvolvido em paralelo com KS-01.

---

### S31-KS-01: Kill-Switch Firestore Persist [M, ~1.5h]

**Objetivo:** Substituir os TODOs no `kill-switch/route.ts` por persistencia real no Firestore. Adicionar `requireBrandAccess`.

> **[ARCH DT-01 — P0, RESOLVIDO]:** Import path do PRD estava ERRADO. Usar `@/lib/auth/brand-guard`, NAO `@/lib/guards/auth`.

**Acao:**
1. Em `app/src/app/api/automation/kill-switch/route.ts`:
   - ADICIONAR imports:
     ```typescript
     import { createAutomationLog, createInAppNotification } from '@/lib/firebase/automation';
     import { sendSlackNotification, isValidSlackWebhookUrl } from '@/lib/notifications/slack';
     import { requireBrandAccess } from '@/lib/auth/brand-guard'; // ← DT-01 FIX: CORRETO
     import { Timestamp } from 'firebase/firestore';
     ```
   - ADICIONAR `requireBrandAccess` no inicio do handler:
     ```typescript
     await requireBrandAccess(req, body.brandId);
     ```
   - SUBSTITUIR TODO (L25-26) por persistencia real:
     ```typescript
     // Persistir logs para cada entidade afetada
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
             type: entity.type,
           },
         },
         timestamp: Timestamp.now(),
       });
       logIds.push(logId);
     }
     ```
   - ADICIONAR notificacao Slack (fire-and-forget):
     ```typescript
     const slackUrl = process.env.SLACK_WEBHOOK_URL;
     if (slackUrl && isValidSlackWebhookUrl(slackUrl)) {
       sendSlackNotification(slackUrl, {
         text: `🚨 *Kill-Switch Triggered*\nBrand: ${body.brandId}\nFunnel: ${body.funnelId}\nReason: ${body.reason}\nEntities: ${body.affectedAdEntities.length} ads affected`,
       }).catch(err => console.error('[Kill-Switch] Slack notification failed:', err));
     } else if (slackUrl) {
       console.warn('[Kill-Switch] Invalid Slack webhook URL — skipping notification');
     }
     ```
   - ADICIONAR notificacao in-app (fire-and-forget):
     ```typescript
     createInAppNotification(body.brandId, {
       type: 'kill_switch',
       title: 'Kill-Switch Acionado',
       message: `${body.reason} — ${body.affectedAdEntities.length} entidades afetadas`,
       isRead: false,
       createdAt: Timestamp.now(),
     }).catch(err => console.error('[Kill-Switch] In-App notification failed:', err));
     ```
   - ATUALIZAR response:
     ```typescript
     return createApiSuccess({
       message: 'Kill-Switch registered. Pending human approval.',
       status: 'pending_approval',
       logsCreated: logIds.length,
       notifications: { slack: !!slackUrl, inApp: true },
     });
     ```

**Arquivos:**
- `app/src/app/api/automation/kill-switch/route.ts` — **MODIFICAR** (substituir TODOs)

**Leitura:**
- `app/src/lib/firebase/automation.ts` — createAutomationLog, createInAppNotification
- `app/src/lib/notifications/slack.ts` — sendSlackNotification (criado em KS-02)

**DTs referenciados:** DT-01 (BLOCKING — RESOLVIDO), DT-07
**Dependencias:** S31-AUTO-01 concluido (usa createAutomationLog + createInAppNotification)
**Gate Check:** S31-GATE-02 (Sim)
**SC mapeados:** CS-31.07, CS-31.08, CS-31.09

**AC:**
- [ ] `requireBrandAccess` importado de `@/lib/auth/brand-guard` (DT-01 — NAO `@/lib/guards/auth`)
- [ ] `requireBrandAccess(req, body.brandId)` chamado ANTES de qualquer persist
- [ ] Cada `affectedAdEntity` gera um `AutomationLog` com status `pending_approval`
- [ ] `gapDetails` populado com `{ reason, severity, platform, type }` (tipado — DT-07)
- [ ] `Timestamp.now()` usado (nao `Date`)
- [ ] Slack notification e fire-and-forget (`.catch()`) — P-10
- [ ] In-app notification e fire-and-forget (`.catch()`) — P-10
- [ ] Response contem `logsCreated` e `notifications`
- [ ] Zero TODO restante no arquivo
- [ ] `npx tsc --noEmit` = 0

---

### S31-KS-02: Slack Notification Helper [S+, ~1.25h]

**Objetivo:** Criar helper `sendSlackNotification()` em novo arquivo `lib/notifications/slack.ts`. REST puro via fetch(). Incluir validacao anti-SSRF da URL.

> **[ARCH DT-08 — P1]:** Aceitar qualquer URL permite SSRF. Validar que hostname e `hooks.slack.com` ou `hooks.slack-gov.com`.

**Acao:**
1. CRIAR `app/src/lib/notifications/slack.ts`:

```typescript
/**
 * Slack Notification Helper — REST puro via fetch()
 * ZERO dependencias npm (P-01).
 * Fire-and-forget: caller DEVE usar .catch() para nao bloquear (P-10).
 *
 * @module lib/notifications/slack
 * @story S31-KS-02
 */

/**
 * Valida que a URL e um Slack Incoming Webhook legitimo.
 * Anti-SSRF: aceita APENAS https://hooks.slack.com/ e https://hooks.slack-gov.com/ (DT-08).
 */
export function isValidSlackWebhookUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === 'https:' &&
      (parsed.hostname === 'hooks.slack.com' || parsed.hostname === 'hooks.slack-gov.com')
    );
  } catch {
    return false;
  }
}

/**
 * Envia notificacao para Slack via Incoming Webhook.
 * REST puro via fetch() — ZERO dependencias npm.
 * Fire-and-forget: caller deve usar .catch() para nao bloquear.
 *
 * @throws Error se o webhook retornar status != 200
 */
export async function sendSlackNotification(
  webhookUrl: string,
  payload: { text: string }
): Promise<void> {
  if (!isValidSlackWebhookUrl(webhookUrl)) {
    throw new Error('Invalid Slack webhook URL — must be https://hooks.slack.com/...');
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(5000), // 5s timeout
  });

  if (!response.ok) {
    throw new Error(`Slack webhook failed: ${response.status} ${response.statusText}`);
  }
}
```

**Arquivos:**
- `app/src/lib/notifications/slack.ts` — **CRIAR**

**DTs referenciados:** DT-08 (Slack URL validation)
**Dependencias:** Nenhuma (pode ser feito em paralelo com KS-01)
**Gate Check:** S31-GATE-02 (Sim)
**SC mapeados:** CS-31.08

**AC:**
- [ ] `isValidSlackWebhookUrl()` aceita APENAS `hooks.slack.com` e `hooks.slack-gov.com` (DT-08)
- [ ] `isValidSlackWebhookUrl()` rejeita URLs de outros dominios
- [ ] `sendSlackNotification()` envia POST com `Content-Type: application/json`
- [ ] `AbortSignal.timeout(5000)` — 5s timeout
- [ ] Throw error se response nao e 200
- [ ] Throw error se URL invalida (anti-SSRF)
- [ ] Zero dependencia npm (P-01)
- [ ] `npx tsc --noEmit` = 0

---

### S31-KS-03: In-App Notification [S, ~1h]

**Objetivo:** Garantir que `createInAppNotification()` (ja criada em AUTO-01) funcione corretamente e que o kill-switch route a utilize. Esta story e mais um teste de integracao — o codigo principal ja foi criado.

**Acao:**
1. Verificar que `createInAppNotification` em `lib/firebase/automation.ts` esta correto (criado em AUTO-01)
2. Verificar que `kill-switch/route.ts` chama `createInAppNotification()` apos persist (feito em KS-01)
3. ADICIONAR teste em `__tests__/lib/firebase/automation.test.ts`:
   - Mock de `firebase/firestore` (addDoc, getDocs, etc.)
   - Testar `createInAppNotification()` com payload valido
   - Testar `getUnreadNotificationCount()` retorna count correto

**Arquivos:**
- `app/src/__tests__/lib/firebase/automation.test.ts` — **CRIAR** (testes para o modulo CRUD)

**DTs referenciados:** Nenhum
**Dependencias:** S31-AUTO-01 concluido
**Gate Check:** S31-GATE-02 (Sim)
**SC mapeados:** CS-31.09

**AC:**
- [ ] `createInAppNotification()` salva doc em `brands/{brandId}/notifications`
- [ ] Doc salvo contem `type`, `title`, `message`, `isRead: false`, `createdAt: Timestamp`
- [ ] `getUnreadNotificationCount()` retorna count correto
- [ ] Pelo menos 3 testes unitarios para o modulo `lib/firebase/automation.ts` (T-01, T-02, T-03 do PRD)
- [ ] `npx tsc --noEmit` = 0

---

### S31-KS-04: Notification Badge no Sidebar [S, ~45min]

**Objetivo:** Adicionar badge de notificacoes nao-lidas no Sidebar no item "Automation". Layout adaptado para 72px icon-only (desktop) e 280px (mobile).

> **[ARCH DT-09 — P2]:** Sidebar desktop tem apenas 72px (icon-only). Badge numerico nao cabe. Usar dot indicator no desktop e pill com numero no mobile.

**Acao:**
1. Em `app/src/components/layout/sidebar.tsx`:
   - ADICIONAR imports:
     ```typescript
     import { getUnreadNotificationCount } from '@/lib/firebase/automation';
     import { useBrandStore } from '@/lib/stores/brand-store';
     ```
   - ADICIONAR state e useEffect para count:
     ```typescript
     const [unreadCount, setUnreadCount] = useState(0);
     const { selectedBrand } = useBrandStore();
     
     useEffect(() => {
       if (!selectedBrand?.id) return;
       getUnreadNotificationCount(selectedBrand.id)
         .then(setUnreadCount)
         .catch(() => setUnreadCount(0));
     }, [selectedBrand?.id]);
     ```
   - ADICIONAR badge no item de navegacao "Automation":
     ```tsx
     {/* Desktop (72px): dot indicator */}
     {unreadCount > 0 && (
       <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-background md:block hidden" />
     )}
     
     {/* Mobile (280px): pill com numero */}
     {unreadCount > 0 && (
       <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center md:hidden">
         {unreadCount > 99 ? '99+' : unreadCount}
       </span>
     )}
     ```
   - ADICIONAR marcacao de "lido" quando clicar em Automation:
     ```typescript
     // Ao navegar para /automation, marcar notificacoes como lidas
     // via markNotificationsAsRead(brandId) — fire-and-forget
     ```

**Arquivos:**
- `app/src/components/layout/sidebar.tsx` — **MODIFICAR** (adicionar badge)

**Leitura:**
- `app/src/lib/firebase/automation.ts` — getUnreadNotificationCount, markNotificationsAsRead

**DTs referenciados:** DT-09 (badge layout)
**Dependencias:** S31-KS-03 concluido (notifications existem)
**Gate Check:** S31-GATE-02 (Sim)
**SC mapeados:** CS-31.10

**AC:**
- [ ] Dot indicator (bolinha vermelha) no desktop (72px icon-only) — DT-09
- [ ] Pill com numero no mobile (280px)
- [ ] Count reflete `getUnreadNotificationCount(brandId)` real
- [ ] Badge desaparece quando count = 0
- [ ] Ao navegar para /automation, notificacoes marcadas como lidas
- [ ] Zero breaking change no layout existente do sidebar
- [ ] `npx tsc --noEmit` = 0

---

### S31-GATE-02: Gate Check 2 — Kill-Switch Persistence [XS, ~15min] — GATE

**Checklist de Validacao:**

| # | Verificacao | Comando/Metodo | Resultado Esperado |
|:--|:-----------|:--------------|:------------------|
| G2-01 | Kill-Switch persiste | `rg "createAutomationLog" app/src/app/api/automation/kill-switch/route.ts` | 1+ match |
| G2-02 | Import correto | `rg "auth/brand-guard" app/src/app/api/automation/kill-switch/route.ts` | 1+ match |
| G2-03 | Slack helper criado | `rg "isValidSlackWebhookUrl" app/src/lib/notifications/slack.ts` | 1+ match |
| G2-04 | In-app notification | `rg "createInAppNotification" app/src/app/api/automation/kill-switch/route.ts` | 1+ match |
| G2-05 | Badge no sidebar | `rg "unreadCount\|getUnreadNotificationCount" app/src/components/layout/sidebar.tsx` | 1+ match |
| G2-06 | Zero TODO no kill-switch | `rg "TODO" app/src/app/api/automation/kill-switch/route.ts` | 0 matches |
| G2-07 | TypeScript limpo | `npx tsc --noEmit` | Exit code 0 |
| G2-08 | Build sucesso | `npm run build` | Exit code 0, >= 103 rotas |
| G2-09 | Testes passando | `npm test` | >= 227/227 pass, 0 fail |

**AC:**
- [ ] G2-01 a G2-09 todos aprovados

---

## Fase 3: Rules Runtime [~3.5-4.5h + Gate]

> **PRE-REQUISITO ABSOLUTO:** S31-GATE-02 aprovado.
>
> **Sequencia:** RT-02 (Matching Engine) → RT-01 (API) → RT-03 (Hook)
>
> **ATENCAO:** O Resolver NAO deve usar `getAudienceScans()` que tem `limit(10)`. Buscar scans diretamente por ID via `getDoc()` (DT-06, PA-05).

---

### S31-RT-02: Matching Engine — PersonalizationResolver [M+, ~1.75h]

**Objetivo:** Criar `PersonalizationResolver.resolve(brandId, leadId)` em novo arquivo `lib/intelligence/personalization/resolver.ts`. Core logic que conecta leads a contentVariations via segment matching.

> **[ARCH DT-06 — P1]:** NAO usar `getAudienceScans()` — tem `limit(10)` que causa false negatives. Buscar scans por `getDoc(targetPersonaId)` diretamente.
>
> **[ARCH DT-10 — P1]:** Documentar race condition de segment stale como limitacao conhecida. O `segment` reflete o ULTIMO estado persistido pelo PropensityEngine.

**Acao:**
1. CRIAR `app/src/lib/intelligence/personalization/resolver.ts`:

```typescript
/**
 * PersonalizationResolver — Matching Engine
 * Resolve quais contentVariations aplicar para um lead especifico.
 *
 * Logica:
 * 1. Buscar LeadState → obter segment
 * 2. Buscar DynamicContentRules ativas
 * 3. Buscar scans por ID direto (NAO getAudienceScans — DT-06)
 * 4. Match: rule.targetPersonaId aponta para scan do MESMO segment do lead
 * 5. Retornar contentVariations matched
 *
 * LIMITACAO CONHECIDA (DT-10): O segment reflete o ULTIMO estado persistido.
 * Se o lead acabou de interagir, pode haver delay sub-segundo ate o segment
 * ser atualizado pelo PropensityEngine (fire-and-forget persist).
 *
 * @module lib/intelligence/personalization/resolver
 * @story S31-RT-02
 */

import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { getPersonalizationRules } from '@/lib/firebase/personalization';
import type { DynamicContentRule } from '@/types/personalization';

// Nota: AudienceScan e LeadState types estao em types/personalization.ts

export interface ResolveResult {
  segment: string;
  variations: DynamicContentRule['contentVariations'][];
  fallback: boolean;
}

export class PersonalizationResolver {
  /**
   * Resolve quais contentVariations aplicar para um lead especifico.
   */
  static async resolve(brandId: string, leadId: string): Promise<ResolveResult> {
    // 1. Buscar estado do lead
    const leadRef = doc(db, 'brands', brandId, 'leads', leadId);
    const leadSnap = await getDoc(leadRef);

    if (!leadSnap.exists()) {
      return { segment: 'unknown', variations: [], fallback: true };
    }

    const lead = leadSnap.data();
    const leadSegment = (lead.segment as string) || 'cold';

    // 2. Buscar rules ativas
    const allRules = await getPersonalizationRules(brandId);
    const activeRules = allRules.filter(r => r.isActive);

    if (activeRules.length === 0) {
      return { segment: leadSegment, variations: [], fallback: true };
    }

    // 3. Buscar APENAS os scans referenciados pelas rules (DT-06)
    //    NAO usar getAudienceScans() — tem limit(10) que causa false negatives (PA-05)
    const targetScanIds = [...new Set(activeRules.map(r => r.targetPersonaId))];
    const scanSnaps = await Promise.all(
      targetScanIds.map(id =>
        getDoc(doc(db, 'brands', brandId, 'audience_scans', id))
      )
    );

    // 4. Build map: scanId → segment
    const scanSegmentMap = new Map<string, string>();
    for (const snap of scanSnaps) {
      if (snap.exists()) {
        const data = snap.data();
        const segment = data?.propensity?.segment as string;
        if (segment) {
          scanSegmentMap.set(snap.id, segment);
        }
      }
    }

    // 5. Match rules cujo targetPersonaId aponta para scan do MESMO segment do lead
    const matched = activeRules.filter(rule => {
      const scanSegment = scanSegmentMap.get(rule.targetPersonaId);
      return scanSegment === leadSegment;
    });

    return {
      segment: leadSegment,
      variations: matched.map(r => r.contentVariations),
      fallback: matched.length === 0,
    };
  }
}
```

**Arquivos:**
- `app/src/lib/intelligence/personalization/resolver.ts` — **CRIAR**

**Leitura (NAO MODIFICAR):**
- `app/src/lib/firebase/personalization.ts` — `getPersonalizationRules(brandId)` (funcional, intocado)
- `app/src/lib/firebase/config.ts` — `db`
- `app/src/types/personalization.ts` — `DynamicContentRule`, `LeadState`, `AudienceScan`

**DTs referenciados:** DT-06 (buscar por ID), DT-10 (race condition documentada)
**Dependencias:** Nenhuma (modulo novo)
**Gate Check:** S31-GATE-03 (Sim)
**SC mapeados:** CS-31.11, CS-31.12

**AC:**
- [ ] `PersonalizationResolver.resolve(brandId, leadId)` exportado
- [ ] Busca lead via `getDoc(brands/{brandId}/leads/{leadId})`
- [ ] Retorna `fallback: true` se lead nao existe
- [ ] Busca rules ativas via `getPersonalizationRules(brandId).filter(r => r.isActive)`
- [ ] Busca scans por `getDoc(targetPersonaId)` diretamente — NAO usa `getAudienceScans()` (DT-06, PA-05)
- [ ] Match: `scanSegment === leadSegment`
- [ ] Retorna `variations: matched.map(r => r.contentVariations)`
- [ ] Retorna `fallback: true` quando zero rules match
- [ ] Race condition de segment stale documentada em JSDoc (DT-10)
- [ ] `npx tsc --noEmit` = 0

---

### S31-RT-01: API /api/personalization/resolve [M, ~2h]

**Objetivo:** Criar nova rota `POST /api/personalization/resolve` que recebe `{ brandId, leadId }` e retorna contentVariations aplicaveis.

> **[ARCH DT-01 — P0, RESOLVIDO]:** Import de `requireBrandAccess` de `@/lib/auth/brand-guard`.

**Acao:**
1. CRIAR `app/src/app/api/personalization/resolve/route.ts`:

```typescript
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { requireBrandAccess } from '@/lib/auth/brand-guard'; // ← DT-01 FIX
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
      matchedRuleCount: result.variations.length,
    });
  } catch (error) {
    console.error('[Personalization Resolve Error]:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return createApiError(500, message);
  }
}
```

2. ADICIONAR testes em `__tests__/api/personalization-resolve.test.ts`:
   - Teste: retorna 400 sem brandId
   - Teste: retorna 400 sem leadId
   - Teste: retorna variations para lead hot (mock Firestore)
   - Teste: retorna fallback para lead sem match

**Arquivos:**
- `app/src/app/api/personalization/resolve/route.ts` — **CRIAR**
- `app/src/__tests__/api/personalization-resolve.test.ts` — **CRIAR** (testes)

**Leitura:**
- `app/src/lib/intelligence/personalization/resolver.ts` — PersonalizationResolver (criado em RT-02)
- `app/src/lib/auth/brand-guard.ts` — requireBrandAccess (existente)
- `app/src/lib/utils/api-response.ts` — createApiError, createApiSuccess (existente)

**DTs referenciados:** DT-01 (BLOCKING — RESOLVIDO)
**Dependencias:** S31-RT-02 concluido (PersonalizationResolver)
**Gate Check:** S31-GATE-03 (Sim)
**SC mapeados:** CS-31.11, CS-31.12

**AC:**
- [ ] `export const dynamic = 'force-dynamic'` presente
- [ ] `requireBrandAccess` importado de `@/lib/auth/brand-guard` (DT-01)
- [ ] Retorna 400 se `brandId` ou `leadId` ausentes
- [ ] Chama `PersonalizationResolver.resolve(brandId, leadId)`
- [ ] Response contem `leadId`, `segment`, `variations`, `fallback`, `matchedRuleCount`
- [ ] Usa `createApiSuccess` e `createApiError` (padrao Sigma)
- [ ] Pelo menos 2 testes (T-11 do PRD: 400 sem brandId)
- [ ] `npx tsc --noEmit` = 0

---

### S31-RT-03: Hook usePersonalizedContent [XS, ~30min]

**Objetivo:** Criar hook `usePersonalizedContent(brandId, leadId)` que consome a API de resolve e expoe resultado para componentes client-side.

**Acao:**
1. CRIAR `app/src/lib/hooks/use-personalized-content.ts`:

```typescript
'use client';

import { useState, useEffect, useRef } from 'react';

interface PersonalizedContentResult {
  variations: Record<string, unknown>[];
  segment: string;
  fallback: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook para consumir conteudo personalizado via /api/personalization/resolve.
 * Cache local: nao re-fetcha se brandId+leadId nao mudar.
 *
 * @param brandId - ID da marca (null = skip)
 * @param leadId - ID do lead (null = skip)
 * @returns variations, segment, fallback, isLoading, error
 *
 * @story S31-RT-03
 */
export function usePersonalizedContent(
  brandId: string | null,
  leadId: string | null
): PersonalizedContentResult {
  const [variations, setVariations] = useState<Record<string, unknown>[]>([]);
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
      body: JSON.stringify({ brandId, leadId }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setVariations(data.data.variations || []);
          setSegment(data.data.segment || 'unknown');
          setFallback(data.data.fallback ?? true);
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

**Arquivos:**
- `app/src/lib/hooks/use-personalized-content.ts` — **CRIAR**

**DTs referenciados:** Nenhum
**Dependencias:** S31-RT-01 concluido (API existe)
**Gate Check:** S31-GATE-03 (Sim)
**SC mapeados:** CS-31.13

**AC:**
- [ ] `'use client'` directive presente
- [ ] Hook aceita `brandId: string | null` e `leadId: string | null`
- [ ] Skip fetch quando brandId ou leadId e null
- [ ] Cache local via `useRef` — nao re-fetcha se mesmos params
- [ ] Retorna `{ variations, segment, fallback, isLoading, error }`
- [ ] `isLoading` corretamente setado durante fetch
- [ ] `error` captura falhas de rede e API
- [ ] `npx tsc --noEmit` = 0

---

### S31-GATE-03: Gate Check 3 — Rules Runtime [XS, ~15min] — GATE

**Checklist de Validacao:**

| # | Verificacao | Comando/Metodo | Resultado Esperado |
|:--|:-----------|:--------------|:------------------|
| G3-01 | Resolver criado | `rg "class PersonalizationResolver" app/src/lib/intelligence/personalization/resolver.ts` | 1 match |
| G3-02 | Resolver busca por getDoc (nao getAudienceScans) | `rg "getAudienceScans" app/src/lib/intelligence/personalization/resolver.ts` | 0 matches |
| G3-03 | API resolve criada | `rg "PersonalizationResolver" app/src/app/api/personalization/resolve/route.ts` | 1+ match |
| G3-04 | API import correto | `rg "auth/brand-guard" app/src/app/api/personalization/resolve/route.ts` | 1+ match |
| G3-05 | force-dynamic | `rg "force-dynamic" app/src/app/api/personalization/resolve/route.ts` | 1 match |
| G3-06 | Hook criado | `rg "usePersonalizedContent" app/src/lib/hooks/use-personalized-content.ts` | 1+ match |
| G3-07 | TypeScript limpo | `npx tsc --noEmit` | Exit code 0 |
| G3-08 | Build sucesso | `npm run build` | Exit code 0, >= 104 rotas (nova rota) |
| G3-09 | Testes passando | `npm test` | >= 227/227 pass, 0 fail |

**AC:**
- [ ] G3-01 a G3-09 todos aprovados

---

## Fase 4: Webhook DLQ [~3-4h + Gate]

> **PRE-REQUISITO ABSOLUTO:** S31-GATE-03 aprovado.
>
> **Sequencia:** DLQ-01 (persist + fix platform) → DLQ-02 (retry API) → DLQ-03 (UI)
>
> **PRE-REQUISITO DLQ-01:** Fix platform extraction no dispatcher (DT-03, incorporado na story).

---

### S31-DLQ-01: DLQ Persist no Dispatcher [M, ~1.5h]

**Objetivo:** No `webhooks/dispatcher/route.ts`, (1) fixar a extracao de `platform` que retornava `'dispatcher'` e (2) adicionar persistencia na DLQ no catch block.

> **[ARCH DT-03 — P0, RESOLVIDO]:** `pathname.split('/').pop()` retorna `'dispatcher'`, nao o nome da plataforma. Fixar para query param.
>
> **[ARCH DT-04 — P1, RESOLVIDO]:** Collection name deve ser `dead_letter_queue` (underscores, nao hifens). Consistente com `automation_rules`, `automation_logs`, etc.

**Acao:**
1. Em `app/src/app/api/webhooks/dispatcher/route.ts`:
   - SUBSTITUIR extracao de platform (DT-03):
     ```typescript
     // ANTES (ERRADO — retorna 'dispatcher'):
     // const platform = req.nextUrl.pathname.split('/').pop() as 'meta' | 'instagram' | 'google';
     
     // DEPOIS (CORRETO — query param):
     const platformParam = req.nextUrl.searchParams.get('platform');
     const validPlatforms = ['meta', 'instagram', 'google'] as const;
     
     if (!platformParam || !validPlatforms.includes(platformParam as any)) {
       return createApiError(400, 'Valid platform query param required (meta|instagram|google)');
     }
     
     const platform = platformParam as 'meta' | 'instagram' | 'google';
     ```
   - ADICIONAR imports para DLQ:
     ```typescript
     import { addDoc, collection, Timestamp } from 'firebase/firestore';
     import { db } from '@/lib/firebase/config';
     ```
   - ADICIONAR DLQ persist no catch block (fire-and-forget):
     ```typescript
     // Dentro do catch:
     const brandId = req.nextUrl.searchParams.get('brandId');
     if (brandId) {
       const dlqRef = collection(db, 'brands', brandId, 'dead_letter_queue'); // DT-04: underscores
       addDoc(dlqRef, {
         webhookType: platform,
         payload: rawBody.substring(0, 10240), // P-13: Truncar a 10KB
         error: error instanceof Error ? error.message : 'Unknown error',
         timestamp: Timestamp.now(),
         retryCount: 0,
         status: 'pending',
       }).catch(dlqErr => console.error('[DLQ] Failed to persist:', dlqErr));
     }
     ```
   - SUBSTITUIR TODO (L62-63) pelo codigo acima

**Arquivos:**
- `app/src/app/api/webhooks/dispatcher/route.ts` — **MODIFICAR** (fix platform + DLQ persist)

**DTs referenciados:** DT-03 (BLOCKING — RESOLVIDO), DT-04 (RESOLVIDO), DT-12
**Dependencias:** Nenhuma (modifica arquivo existente)
**Gate Check:** S31-GATE-04 (Sim)
**SC mapeados:** CS-31.14

**AC:**
- [ ] Platform extraido de query param `?platform=` (DT-03 — NAO de pathname)
- [ ] Validacao: rejeitar se platform nao e `meta|instagram|google`
- [ ] Collection name: `dead_letter_queue` (DT-04 — underscores, NAO hifens)
- [ ] Payload truncado a 10KB (P-13): `rawBody.substring(0, 10240)`
- [ ] DLQ persist e fire-and-forget (`.catch()`) — P-10
- [ ] `Timestamp.now()` usado (nao Date) — P-08
- [ ] `retryCount: 0` e `status: 'pending'` inicializados
- [ ] Zero TODO restante no arquivo
- [ ] `npx tsc --noEmit` = 0

---

### S31-DLQ-02: API /api/webhooks/retry [M+, ~1.75h]

**Objetivo:** Criar nova rota `POST /api/webhooks/retry` para re-processar webhooks falhados da DLQ. Inclui check de retry count, timestamp check e stub Google no normalizer.

> **[ARCH DT-01 — P0, RESOLVIDO]:** Import de `requireBrandAccess` de `@/lib/auth/brand-guard`.
> **[ARCH DT-05 — P1, RESOLVIDO]:** EventNormalizer precisa de stub Google para nao lancar erro generico.
> **[ARCH DT-11 — P1]:** Verificar timestamp do DLQ item vs `lead.lastInteraction` antes de re-processar.

**Acao:**
1. Em `app/src/lib/automation/normalizer.ts`, ADICIONAR stub Google no switch:
   ```typescript
   case 'google':
     throw new Error('Google webhook normalization not yet implemented. DLQ retry unavailable for Google.');
   ```

2. CRIAR `app/src/app/api/webhooks/retry/route.ts`:

```typescript
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { requireBrandAccess } from '@/lib/auth/brand-guard'; // ← DT-01 FIX
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { EventNormalizer } from '@/lib/automation/normalizer';

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

    // 3. DT-11: Verificar timestamp vs lead.lastInteraction
    const leadRef = doc(db, 'brands', brandId, 'leads', dlqItem.leadId || '');
    const leadSnap = await getDoc(leadRef);
    if (leadSnap.exists()) {
      const lead = leadSnap.data();
      const leadLastInteraction = lead?.lastInteraction?.timestamp;
      if (leadLastInteraction && leadLastInteraction.toMillis() > dlqItem.timestamp.toMillis()) {
        // Lead ja tem interacao mais recente — skip re-processamento
        await updateDoc(dlqRef, { status: 'resolved', resolvedAt: Timestamp.now() });
        return createApiSuccess({
          message: 'DLQ item resolved (lead already has newer interaction)',
          dlqItemId,
          skipped: true,
        });
      }
    }

    // 4. Re-processar
    try {
      const payload = JSON.parse(dlqItem.payload);
      const { leadId, interaction } = EventNormalizer.normalize({
        platform: dlqItem.webhookType,
        brandId,
        payload,
      });

      // Importar PersonalizationMaestro dinamicamente para evitar circular deps
      const { PersonalizationMaestro } = await import(
        '@/lib/intelligence/personalization/maestro'
      );
      await PersonalizationMaestro.processInteraction(brandId, leadId, interaction);

      // 5. Sucesso → marcar como resolved
      await updateDoc(dlqRef, {
        status: 'resolved',
        resolvedAt: Timestamp.now(),
      });

      return createApiSuccess({ message: 'Webhook re-processed successfully', dlqItemId });
    } catch (retryError) {
      // 6. Falha → incrementar retry count
      const errorMsg = retryError instanceof Error ? retryError.message : 'Unknown error';
      await updateDoc(dlqRef, {
        retryCount: dlqItem.retryCount + 1,
        error: errorMsg,
        timestamp: Timestamp.now(),
      });

      return createApiError(502, `Retry failed: ${errorMsg}`);
    }
  } catch (error) {
    console.error('[Webhook Retry Error]:', error);
    return createApiError(500, 'Internal server error');
  }
}
```

**Arquivos:**
- `app/src/app/api/webhooks/retry/route.ts` — **CRIAR**
- `app/src/lib/automation/normalizer.ts` — **MODIFICAR** (adicionar stub Google)

**Leitura (NAO MODIFICAR):**
- `app/src/lib/intelligence/personalization/maestro.ts` — PersonalizationMaestro.processInteraction
- `app/src/lib/automation/normalizer.ts` — EventNormalizer.normalize

**DTs referenciados:** DT-01 (import), DT-05 (stub Google), DT-11 (timestamp check)
**Dependencias:** S31-DLQ-01 concluido (items na DLQ existem)
**Gate Check:** S31-GATE-04 (Sim)
**SC mapeados:** CS-31.15, CS-31.16

**AC:**
- [ ] `requireBrandAccess` importado de `@/lib/auth/brand-guard` (DT-01)
- [ ] Retorna 400 sem `brandId` ou `dlqItemId`
- [ ] Retorna 404 se DLQ item nao existe
- [ ] Retorna 422 e marca `abandoned` se `retryCount >= 3` (CS-31.16)
- [ ] DT-11: Verifica timestamp vs lead.lastInteraction — skip se lead tem interacao mais recente
- [ ] Re-processa via `EventNormalizer.normalize()` + `PersonalizationMaestro.processInteraction()`
- [ ] Sucesso: `status: 'resolved'`, `resolvedAt: Timestamp.now()`
- [ ] Falha: incrementa `retryCount`, atualiza `error`
- [ ] Stub Google adicionado no `normalizer.ts` (DT-05)
- [ ] `npx tsc --noEmit` = 0

---

### S31-DLQ-03: DLQ UI na Automation Page [XS, ~30min]

**Objetivo:** Adicionar tab "Dead Letter" na Automation Page com lista de webhooks falhados e botao retry.

**Acao:**
1. Em `app/src/app/automation/page.tsx`:
   - ADICIONAR state para DLQ items:
     ```typescript
     const [dlqItems, setDlqItems] = useState<DeadLetterItem[]>([]);
     ```
   - ADICIONAR fetch de DLQ items no useEffect existente:
     ```typescript
     // Adicionar ao Promise.all:
     getDLQItems(brandId) // funcao a criar em lib/firebase/automation.ts
     ```
   - ADICIONAR funcao helper de DLQ em `lib/firebase/automation.ts`:
     ```typescript
     export async function getDLQItems(brandId: string, maxResults: number = 50): Promise<DeadLetterItem[]> {
       const dlqRef = collection(db, 'brands', brandId, 'dead_letter_queue');
       const q = query(dlqRef, where('status', '!=', 'resolved'), orderBy('status'), orderBy('timestamp', 'desc'), limit(maxResults));
       const snap = await getDocs(q);
       return snap.docs.map(d => ({ id: d.id, ...d.data() } as DeadLetterItem));
     }
     ```
   - ADICIONAR tab "Dead Letter" na UI:
     - Listar items: timestamp, webhookType (platform), error (truncado), retryCount, status
     - Badge com count de items pendentes no tab header
     - Botao "Retry" que chama `POST /api/webhooks/retry` com `{ brandId, dlqItemId }`
     - Desabilitar botao Retry se `retryCount >= 3` ou `status === 'abandoned'`
   - ADICIONAR handler de retry:
     ```typescript
     const handleRetry = async (dlqItemId: string) => {
       const res = await fetch('/api/webhooks/retry', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ brandId, dlqItemId }),
       });
       const data = await res.json();
       if (data.success) {
         // Remover item da lista ou atualizar status
         setDlqItems(prev => prev.filter(d => d.id !== dlqItemId));
       }
     };
     ```

**Arquivos:**
- `app/src/app/automation/page.tsx` — **MODIFICAR** (adicionar tab DLQ)
- `app/src/lib/firebase/automation.ts` — **MODIFICAR** (adicionar getDLQItems)

**DTs referenciados:** Nenhum
**Dependencias:** S31-DLQ-02 concluido (API retry funcional)
**Gate Check:** S31-GATE-04 (Sim)
**SC mapeados:** CS-31.17

**AC:**
- [ ] Tab "Dead Letter" visivel na Automation Page
- [ ] Lista items de `brands/{brandId}/dead_letter_queue` com `status != 'resolved'`
- [ ] Exibe: timestamp, webhookType, error, retryCount, status
- [ ] Badge de count no tab header
- [ ] Botao "Retry" chama `POST /api/webhooks/retry`
- [ ] Botao Retry desabilitado se `retryCount >= 3` ou `status === 'abandoned'`
- [ ] Apos retry sucesso, item removido da lista
- [ ] `npx tsc --noEmit` = 0

---

### S31-GATE-04: Gate Check 4 — Webhook DLQ [XS, ~15min] — GATE

**Checklist de Validacao:**

| # | Verificacao | Comando/Metodo | Resultado Esperado |
|:--|:-----------|:--------------|:------------------|
| G4-01 | Platform via query param | `rg "searchParams.get..platform" app/src/app/api/webhooks/dispatcher/route.ts` | 1+ match |
| G4-02 | Zero pathname.pop() | `rg "pathname.split.*pop" app/src/app/api/webhooks/dispatcher/route.ts` | 0 matches |
| G4-03 | DLQ persist | `rg "dead_letter_queue" app/src/app/api/webhooks/dispatcher/route.ts` | 1+ match |
| G4-04 | Retry API criada | `rg "requireBrandAccess" app/src/app/api/webhooks/retry/route.ts` | 1+ match |
| G4-05 | Stub Google | `rg "case 'google'" app/src/lib/automation/normalizer.ts` | 1+ match |
| G4-06 | Timestamp check | `rg "lastInteraction" app/src/app/api/webhooks/retry/route.ts` | 1+ match |
| G4-07 | DLQ UI | `rg "Dead Letter\|dlqItems\|getDLQItems" app/src/app/automation/page.tsx` | 1+ match |
| G4-08 | TypeScript limpo | `npx tsc --noEmit` | Exit code 0 |
| G4-09 | Build sucesso | `npm run build` | Exit code 0, >= 105 rotas |
| G4-10 | Testes passando | `npm test` | >= 227/227 pass, 0 fail |

**AC:**
- [ ] G4-01 a G4-10 todos aprovados

---

## Governanca: Contract-Map Update

### S31-GOV-01: Atualizar contract-map.yaml [XS, ~15min]

**Objetivo:** Registrar os novos paths e rotas da S31 no `contract-map.yaml` para manter rastreabilidade.

**Acao:**
1. Em `_netecmt/core/contract-map.yaml`, ADICIONAR paths nas lanes:

**Lane `automation` — Expandir:**
```yaml
automation:
  paths:
    - "app/src/lib/automation/engine.ts"
    - "app/src/lib/automation/budget-optimizer.ts"
    - "app/src/lib/automation/adapters/"
    - "app/src/lib/automation/normalizer.ts"
    # === S31 — Novos paths ===
    - "app/src/lib/firebase/automation.ts"        # S31-AUTO-01/02 (CRUD)
    - "app/src/app/automation/**"                  # S31-AUTO-03 (Page)
    - "app/src/app/api/automation/**"              # Kill-Switch (existente + S31-KS-01)
    - "app/src/lib/notifications/slack.ts"         # S31-KS-02 (Slack helper)
    - "app/src/types/automation.ts"                # DeadLetterItem, InAppNotification
```

**Lane `personalization_engine` — Expandir:**
```yaml
personalization_engine:
  paths:
    - "app/src/lib/intelligence/personalization/**"
    # === S31 — Rules Runtime ===
    - "app/src/app/api/personalization/**"          # S31-RT-01 (Nova API resolve)
  contract: "_netecmt/contracts/personalization-engine-spec.md"
```

**Lane `operations_infrastructure` — Verificar:**
```yaml
operations_infrastructure:
  paths:
    - "app/src/app/api/webhooks/**"                # Existente — inclui /retry (S31-DLQ-02)
    - "app/src/lib/security/monara/**"
  contract: "_netecmt/contracts/webhook-security-spec.md"
```

**Arquivos:**
- `_netecmt/core/contract-map.yaml` — **MODIFICAR**

**DTs referenciados:** Nenhum (governance)
**Dependencias:** S31-GATE-04 aprovado (todos os paths existem)
**Gate Check:** Nao
**SC mapeados:** CS-31.19

**AC:**
- [ ] Lane `automation` tem novos paths S31
- [ ] Lane `personalization_engine` tem `app/src/app/api/personalization/**`
- [ ] Lane `operations_infrastructure` cobre `/api/webhooks/**` (inclui retry)
- [ ] Zero conflito com lanes existentes

---

## STRETCH: Rate Limiting [~3-4h]

> **STRETCH:** S31-RL-01 so e executado se Gate 4 estiver aprovado com sobra de tempo (total acumulado < 14h). Pode ser movido para S32 sem impacto.

### S31-RL-01: Rate Limiting por brandId [M, ~3-4h] — STRETCH

**Objetivo:** Implementar guard `checkRateLimit(brandId, action)` com Firestore counters atomicos. Herdado de S29/S30.

**Acao:**
1. CRIAR `app/src/lib/guards/rate-limiter.ts`:
   - Guard function `checkRateLimit(brandId, action, cost?)`
   - Schema Firestore: `brands/{brandId}/quotas/daily_YYYY-MM-DD`
   - DEFAULT_LIMITS: 500 API calls/dia, 100 scans/dia, 1000 AI credits/dia
   - Increment atomico via `updateDoc` com `increment()`
   - Reset diario (novo documento por dia)
   - HTTP 429 quando excedido: `createApiError(429, 'Rate limit exceeded')`
   - Admin routes ISENTAS (P-13)

**Arquivos:**
- `app/src/lib/guards/rate-limiter.ts` — **CRIAR**
- 7+ rotas API de alto consumo — **MODIFICAR** (integrar guard)

**DTs referenciados:** Nenhum (STRETCH)
**Dependencias:** S31-GATE-04 aprovado
**Gate Check:** Nao (STRETCH)
**SC mapeados:** Nenhum SC dedicado

**AC:**
- [ ] `checkRateLimit(brandId, action, cost?)` funcional
- [ ] Counters atomicos no Firestore
- [ ] HTTP 429 quando limite excedido
- [ ] Rotas `/api/admin/*` ISENTAS (P-13)
- [ ] `npx tsc --noEmit` = 0

---

## Testes Recomendados (Novos — Dandara)

> **Todos os testes de Firestore devem usar mocks de `firebase/firestore` (via `jest.mock()`). NUNCA chamar Firestore real em testes automatizados.**

| # | Teste | Tipo | Arquivo Sugerido | Story |
|:--|:------|:-----|:----------------|:------|
| T-01 | `getAutomationRules` retorna rules da collection correta | Unit | `__tests__/lib/firebase/automation.test.ts` | AUTO-01 |
| T-02 | `getAutomationLogs` respeita limit e orderBy | Unit | `__tests__/lib/firebase/automation.test.ts` | AUTO-01 |
| T-03 | `updateAutomationLogStatus` persiste status + executedBy | Unit | `__tests__/lib/firebase/automation.test.ts` | AUTO-01 |
| T-04 | Kill-Switch POST com dados validos cria logs + notifications | Integration | `__tests__/api/kill-switch.test.ts` | KS-01 |
| T-05 | Kill-Switch POST sem brandId retorna 400 | Integration | `__tests__/api/kill-switch.test.ts` | KS-01 |
| T-06 | `sendSlackNotification` com URL valida envia POST | Unit (mock fetch) | `__tests__/lib/notifications/slack.test.ts` | KS-02 |
| T-07 | `sendSlackNotification` rejeita URL invalida (SSRF) | Unit | `__tests__/lib/notifications/slack.test.ts` | KS-02 |
| T-08 | `PersonalizationResolver.resolve` retorna variacoes para lead hot | Unit | `__tests__/lib/intelligence/resolver.test.ts` | RT-02 |
| T-09 | `PersonalizationResolver.resolve` retorna fallback para lead sem match | Unit | `__tests__/lib/intelligence/resolver.test.ts` | RT-02 |
| T-10 | `PersonalizationResolver.resolve` ignora rules inativas | Unit | `__tests__/lib/intelligence/resolver.test.ts` | RT-02 |
| T-11 | `POST /api/personalization/resolve` retorna 400 sem brandId | Integration | `__tests__/api/personalization-resolve.test.ts` | RT-01 |
| T-12 | DLQ persist no dispatcher trunca payload a 10KB | Unit | `__tests__/api/webhooks-dispatcher.test.ts` | DLQ-01 |
| T-13 | `POST /api/webhooks/retry` com item valido resolve | Integration | `__tests__/api/webhooks-retry.test.ts` | DLQ-02 |
| T-14 | `POST /api/webhooks/retry` respeita maxRetryCount=3 | Integration | `__tests__/api/webhooks-retry.test.ts` | DLQ-02 |
| T-15 | `usePersonalizedContent` hook retorna isLoading/error/variations | Unit (RTL) | `__tests__/hooks/use-personalized-content.test.ts` | RT-03 |

---

## Checklist de Pre-Execucao (Darllyson)

### Antes de comecar qualquer story:
- [ ] Ler este arquivo (`stories.md`) por completo
- [ ] Ler `allowed-context.md` para proibicoes e arquivos permitidos
- [ ] Confirmar 3 Blocking DTs RESOLVIDOS compreendidos:
  - [ ] **DT-01**: `requireBrandAccess` importa de `@/lib/auth/brand-guard` (NAO `@/lib/guards/auth`)
  - [ ] **DT-02**: `useBrandStore().selectedBrand?.id` (NAO `activeBrandId`)
  - [ ] **DT-03**: Platform no dispatcher via query param (NAO pathname.pop())
- [ ] Confirmar `npx tsc --noEmit` = 0 erros (baseline pos-S30)
- [ ] Confirmar `npm run build` compila (baseline 103+ rotas)
- [ ] Executar `npm test` e confirmar baseline de 227/227 pass

### Validacoes incrementais — Fase 1:
- [ ] Apos AUTO-01: CRUD automation.ts criado
- [ ] Apos AUTO-02: Types atualizados (DeadLetterItem, InAppNotification, gapDetails tipado)
- [ ] Apos AUTO-03: Page conectada ao Firestore, zero mocks
- [ ] **GATE CHECK 1**: G1-01 a G1-09

### Validacoes incrementais — Fase 2:
- [ ] Apos KS-01: Kill-Switch persiste no Firestore + notificacoes
- [ ] Apos KS-02: Slack helper criado com validacao anti-SSRF
- [ ] Apos KS-03: In-app notification funcional + testes
- [ ] Apos KS-04: Badge no sidebar
- [ ] **GATE CHECK 2**: G2-01 a G2-09

### Validacoes incrementais — Fase 3:
- [ ] Apos RT-02: Resolver criado (busca por getDoc, NAO getAudienceScans)
- [ ] Apos RT-01: API resolve funcional + testes
- [ ] Apos RT-03: Hook funcional
- [ ] **GATE CHECK 3**: G3-01 a G3-09

### Validacoes incrementais — Fase 4:
- [ ] Apos DLQ-01: Platform fix + DLQ persist funcional
- [ ] Apos DLQ-02: Retry API funcional + stub Google + timestamp check
- [ ] Apos DLQ-03: DLQ UI na Automation Page
- [ ] **GATE CHECK 4**: G4-01 a G4-10

### Validacao final (TODAS as fases):
- [ ] `npx tsc --noEmit` → `Found 0 errors`
- [ ] `npm run build` → Sucesso (>= 105 rotas com novas APIs)
- [ ] `npm test` → >= 227/227 pass, 0 fail
- [ ] CS-31.01 a CS-31.19 todos aprovados
- [ ] RC-01 a RC-10 todos aprovados (retrocompatibilidade)
- [ ] (STRETCH) Rate limiting funcional
- [ ] S31-GOV-01: contract-map.yaml atualizado

---
*Stories preparadas por Leticia (SM) — NETECMT v2.0*
*Incorpora 12 Decision Topics + 6 Proibicoes Arquiteturais do Architecture Review (Athos)*
*Sprint 31: Automation Engine & Rules Runtime | 07/02/2026*
*15 stories (13 feature core + 1 GOV + 1 STRETCH) | 4 Gates*
*Estimativa: 14-18h (sem STRETCH) / 17-22h (com STRETCH)*
*Legenda: XS = Extra Small (< 30min), S = Small (< 2h), S+ = Small Extended, M = Medium (2-4h), M+ = Medium Extended*
