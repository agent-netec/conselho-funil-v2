# PROMPT — T6: Sequência de Emails Trial 14 Dias

> Cole este prompt inteiro no agente que vai executar a tarefa.

---

## CONTEXTO

**Produto:** MKTHONEY — SaaS de marketing autônomo com IA.
**Stack:** Next.js 16.1.1, React 19, TypeScript, Firebase, Resend (email).
**Diretório do app:** `app/` (root do Next.js — build: `cd app && npm run build`)

**Situação:** O sistema já tem 6 emails transacionais funcionando via Resend (`app/src/lib/email/resend.ts`): verification, welcome, receipt, trial-expiring, cancellation, payment-failed. O cron `trial-check` roda diário à 00:00 UTC e só faz downgrade de trials expirados. Falta a sequência completa de nurturing durante os 14 dias de trial.

---

## INFRAESTRUTURA EXISTENTE (NÃO ALTERAR)

### Resend Client (`app/src/lib/email/resend.ts`)

```typescript
// Lazy init pattern — MANTER
let _resend: Resend | null = null;
function getResendClient(): Resend | null { ... }

// Constants
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'MktHoney <noreply@mkthoney.com>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://mkthoney.com';

// Base template — REUSAR para todos os novos emails
function baseTemplate(content: string): string { ... }

// Interface de retorno — USAR em todas as novas funções
export interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
}
```

### Cron Job (`app/src/app/api/cron/trial-check/route.ts`)
- Roda diário à 00:00 UTC (vercel.json: `"schedule": "0 0 * * *"`)
- Auth: `Authorization: Bearer ${CRON_SECRET}`
- Hoje só busca trials expirados e faz downgrade
- **ESTE ARQUIVO SERÁ EXPANDIDO** para disparar emails de nurturing

### User Type (`app/src/types/database.ts`)
```typescript
export interface User {
  id: string;
  email: string;
  name: string;
  tier?: UserTier;                  // 'free'|'trial'|'starter'|'pro'|'agency'
  trialExpiresAt?: Timestamp;       // 14 dias a partir do signup
  onboardingCompleted?: boolean;
  createdAt: Timestamp;
  lastLogin: Timestamp;
  // ... outros campos ...
}
```

### Helpers existentes (`app/src/lib/tier-system.ts`)
```typescript
function getTrialDaysRemaining(trialExpiresAt: Date | null): number  // ceil((expires - now) / 24h)
function isTrialExpired(trialExpiresAt: Date | null): boolean
```

### Firestore helpers (`app/src/lib/firebase/firestore.ts`)
```typescript
getExpiredTrialUsers(): Promise<string[]>       // tier=='trial' AND trialExpiresAt <= now
downgradeUsersToFree(userIds: string[]): Promise<number>
getUser(userId: string): Promise<User | null>
```

---

## O QUE CRIAR

### 1. Adicionar campo `lastTrialEmailDay` no tipo User

**Arquivo:** `app/src/types/database.ts`

**Adicionar ao interface `User`** (após `onboardingCompleted`):
```typescript
  lastTrialEmailDay?: number;         // T6: Last trial nurturing email day sent (0,1,3,5,7,10,12,14)
```

### 2. Criar 6 novas funções de email em `app/src/lib/email/resend.ts`

**Não criar arquivos novos.** Adicionar as funções no mesmo `resend.ts` existente, após `sendPaymentFailedEmail`.

Cada função segue o MESMO padrão das existentes:
1. Recebe `(to: string, name: string, ...params)`
2. Chama `getResendClient()` → early return se null
3. Monta HTML com `baseTemplate()`
4. Envia via `client.emails.send()`
5. Retorna `SendEmailResult`

---

### EMAIL DIA 1: Onboarding Nudge

**Função:** `sendTrialDay1Email(to: string, name: string)`
**Subject:** `Complete seu briefing em 3 minutos — MktHoney`
**Condição de envio:** `onboardingCompleted === false`
**Se `onboardingCompleted === true`:** NÃO enviar (skip silencioso)

**Conteúdo:**
```
h1: Seu MKTHONEY está quase pronto

p: {name}, falta só um passo para ativar os 23 especialistas
de IA da sua conta: o briefing inicial.

p: Em 3 minutos, você configura:

ul:
- Nome e vertical da sua marca
- Tom de voz e posicionamento
- Público-alvo e oferta principal

p: Com essas informações, todos os especialistas passam a gerar
recomendações personalizadas para o seu negócio.

button: "Completar Meu Briefing" → ${APP_URL}/welcome

p (small, #AB8648): Se já completou o briefing, ignore este email.
Estamos verificando automaticamente.
```

---

### EMAIL DIA 3: Primeiro Valor

**Função:** `sendTrialDay3Email(to: string, name: string)`
**Subject:** `Peça seu primeiro diagnóstico ao MKTHONEY`

**Conteúdo:**
```
h1: Hora de testar os especialistas

p: {name}, seu trial PRO está ativo há 3 dias. Já consultou
algum especialista?

p: Experimente agora:

div (info-box):
  "Abra o chat e pergunte: 'Analise meu funil de vendas atual
  e me diga os 3 maiores gargalos.'"

p: Os 23 especialistas vão cruzar referências de frameworks como
Value Ladder, StoryBrand, e Copy Lógica para te dar um
diagnóstico que levaria semanas com uma consultoria tradicional.

button: "Iniciar Minha Primeira Consulta" → ${APP_URL}/chat

p (small): Cada consulta gasta 1 crédito. Você tem 300/mês no trial PRO.
```

---

### EMAIL DIA 5: Feature Spotlight — Offer Lab

**Função:** `sendTrialDay5Email(to: string, name: string)`
**Subject:** `Sua oferta resiste a um stress test? — MktHoney`

**Conteúdo:**
```
h1: Teste sua oferta antes do mercado testar

p: {name}, uma das ferramentas que nossos usuários mais usam
é o Offer Lab — um simulador que analisa sua oferta sob 8
perspectivas diferentes.

p: O que o Offer Lab avalia:

ul:
- Clareza da proposta de valor
- Força do headline e hook
- Risco percebido vs. recompensa
- Urgência e escassez
- Prova social e autoridade
- Comparação com concorrência

p: Muitos descobrem gaps na oferta que estavam custando
conversões sem saber.

button: "Testar Minha Oferta" → ${APP_URL}/intelligence/offer-lab

p (small): Disponível durante todo o trial PRO. Após o trial,
requer plano Starter ou superior.
```

---

### EMAIL DIA 7: Social Proof / Caso de Uso

**Função:** `sendTrialDay7Email(to: string, name: string)`
**Subject:** `Como extrair o máximo do MKTHONEY nos próximos 7 dias`

**Conteúdo:**
```
h1: Metade do trial — checklist de aproveitamento

p: {name}, você está na metade do seu trial PRO.
Aqui está o que os usuários mais ativos fazem:

div (info-box):
  ✅ Completar o briefing da marca
  ✅ Fazer pelo menos 5 consultas ao chat
  ✅ Testar o Offer Lab
  ✅ Gerar um funil completo
  ✅ Experimentar o Party Mode (debate entre especialistas)

p: Se fez tudo isso, já tem uma boa base para decidir.
Se não, ainda dá tempo — faltam 7 dias.

p: Dica: O Party Mode coloca vários especialistas
debatendo sobre uma questão sua. É o recurso mais
diferenciado do MKTHONEY.

button: "Abrir Meu Dashboard" → ${APP_URL}

p (small): Faltam 7 dias de trial PRO.
```

---

### EMAIL DIA 10: Soft Urgency

**Função:** `sendTrialDay10Email(to: string, name: string)`
**Subject:** `Faltam 4 dias do seu trial PRO — MktHoney`

**Conteúdo:**
```
h1: 4 dias para decidir

p: {name}, seu trial PRO expira em 4 dias.

p: Após a expiração, sua conta será convertida para o plano Free:

div (info-box com 2 colunas):
  | PRO (trial atual)       | Free (após expirar)    |
  | 3 marcas                | 1 marca                |
  | 300 consultas/mês       | 10 consultas/mês       |
  | Todos os modos de chat  | Apenas modo Geral      |
  | Offer Lab, Autopsy      | Indisponível           |
  | Party Mode              | Indisponível           |

p: Seus dados e histórico serão mantidos.
Se assinar depois, tudo volta.

button: "Ver Planos e Preços" → ${APP_URL}/settings/billing

p (small): A partir de R$97/mês. Cancele quando quiser.
```

---

### EMAIL DIA 12: Hard Urgency

**Função:** `sendTrialDay12Email(to: string, name: string)`
**Subject:** `2 dias para o fim do trial — MktHoney`

**Conteúdo:**
```
h1: Último aviso antes da conversão

p: {name}, em 2 dias seu trial PRO expira e sua conta
será automaticamente convertida para o plano Free.

p: O que você perde:

ul:
- Acesso aos 23 especialistas (fica só modo Geral)
- Offer Lab, Autopsy, Spy Agent
- Party Mode (debate entre especialistas)
- 290 consultas/mês (Free tem 10)
- 2 marcas adicionais

p: Se o MKTHONEY gerou algum insight valioso nos últimos 12 dias,
considere manter o acesso.

button: "Assinar Agora" → ${APP_URL}/settings/billing

p (small): Garantia de 7 dias (CDC Art. 49).
Não gostou? Reembolso integral, sem perguntas.
```

---

### Emails que JÁ EXISTEM (NÃO criar):

- **Dia 0 (Welcome):** `sendWelcomeEmail()` — já enviado no signup
- **Dia 14 (Expiração):** `sendTrialExpiringEmail(to, name, 0)` — já enviado pelo cron atual

---

## 3. Expandir o Cron Job

**Arquivo:** `app/src/app/api/cron/trial-check/route.ts`

### Lógica atual (MANTER):
1. Verificar CRON_SECRET
2. `getExpiredTrialUsers()` → downgrade + email dia 14

### Lógica NOVA (ADICIONAR ANTES do downgrade):

```typescript
import {
  sendTrialDay1Email,
  sendTrialDay3Email,
  sendTrialDay5Email,
  sendTrialDay7Email,
  sendTrialDay10Email,
  sendTrialDay12Email,
  sendTrialExpiringEmail,
} from '@/lib/email/resend';

// --- NEW: Trial nurturing emails ---

// 1. Get ALL trial users (not just expired)
const trialUsersSnapshot = await getDocs(
  query(collection(db, 'users'), where('tier', '==', 'trial'))
);

const NURTURE_SCHEDULE = [1, 3, 5, 7, 10, 12] as const;
let emailsSent = 0;

for (const userDoc of trialUsersSnapshot.docs) {
  const user = { id: userDoc.id, ...userDoc.data() } as User;
  if (!user.email || !user.createdAt) continue;

  // Calculate trial day (0-indexed from creation)
  const createdAt = user.createdAt.toDate();
  const now = new Date();
  const trialDay = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

  // Skip if not a nurture day
  if (!NURTURE_SCHEDULE.includes(trialDay as any)) continue;

  // Skip if already sent this day's email
  if (user.lastTrialEmailDay !== undefined && user.lastTrialEmailDay >= trialDay) continue;

  const name = user.name || 'Usuário';

  try {
    let sent = false;

    switch (trialDay) {
      case 1:
        // Only send if onboarding not completed
        if (!user.onboardingCompleted) {
          await sendTrialDay1Email(user.email, name);
          sent = true;
        }
        break;
      case 3:
        await sendTrialDay3Email(user.email, name);
        sent = true;
        break;
      case 5:
        await sendTrialDay5Email(user.email, name);
        sent = true;
        break;
      case 7:
        await sendTrialDay7Email(user.email, name);
        sent = true;
        break;
      case 10:
        await sendTrialDay10Email(user.email, name);
        sent = true;
        break;
      case 12:
        await sendTrialDay12Email(user.email, name);
        sent = true;
        break;
    }

    if (sent) {
      // Update lastTrialEmailDay to prevent re-send
      await updateDoc(doc(db, 'users', user.id), {
        lastTrialEmailDay: trialDay,
      });
      emailsSent++;
    }
  } catch (err) {
    console.error(`[Cron trial-check] Nurture email failed for ${user.id} (day ${trialDay}):`, err);
  }
}

console.log(`[Cron trial-check] Sent ${emailsSent} nurture emails`);

// --- EXISTING: Expired trial downgrade (keep as-is) ---
```

### Imports adicionais no cron:
```typescript
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { User } from '@/types/database';
```

**IMPORTANTE:** Verificar quais imports do Firebase já existem no arquivo. Se `db`, `collection`, `query`, `where`, `getDocs` já estão importados via `@/lib/firebase/firestore`, NÃO duplicar. Usar os exports existentes.

### Response atualizada:
```typescript
return createApiSuccess({
  checked: true,
  nurtureEmailsSent: emailsSent,
  expiredTrialsFound: expiredUserIds.length,
  downgradedUsers: downgradedCount,
});
```

---

## 4. Exportar novas funções

**Arquivo:** `app/src/lib/email/index.ts`

Verificar se este arquivo já re-exporta de `resend.ts`. Se sim, as novas funções serão exportadas automaticamente. Se não, adicionar os exports.

---

## O QUE NÃO FAZER

1. **NÃO criar arquivos separados** para cada template (tudo no `resend.ts`)
2. **NÃO usar React Email / TSX** — manter HTML inline com `baseTemplate()`
3. **NÃO alterar** os 6 emails existentes (verification, welcome, receipt, trial-expiring, cancellation, payment-failed)
4. **NÃO alterar** o `baseTemplate()` — ele já tem o design system correto
5. **NÃO alterar** a interface `User` além de adicionar `lastTrialEmailDay`
6. **NÃO alterar** lógica de credits, tier limits ou billing
7. **NÃO instalar** dependências
8. **NÃO criar** um cron separado — expandir o existente `trial-check`
9. **NÃO alterar** o schedule do cron (manter `0 0 * * *`)
10. **NÃO enviar** email dia 1 se `onboardingCompleted === true`

---

## PADRÃO DE CADA FUNÇÃO DE EMAIL

Para garantir consistência, TODAS as 6 funções devem seguir este template:

```typescript
/**
 * Trial Day X: [descrição curta].
 */
export async function sendTrialDayXEmail(
  to: string,
  name: string
): Promise<SendEmailResult> {
  const client = getResendClient();
  if (!client) return { success: false, error: 'RESEND_API_KEY not configured' };
  try {
    const html = baseTemplate(`
      <div class="card">
        <h1>[TÍTULO]</h1>
        <p>Olá, <span class="highlight">${name}</span>!</p>
        [CONTEÚDO ESPECÍFICO]
      </div>
    `);

    const { data, error } = await client.emails.send({
      from: FROM_EMAIL,
      to,
      subject: '[ASSUNTO]',
      html,
    });

    if (error) {
      console.error('[Email] Trial day X email failed:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Email] Trial day X email error:', message);
    return { success: false, error: message };
  }
}
```

---

## DESIGN DOS EMAILS

Usar as mesmas classes CSS do `baseTemplate()`:

| Classe | Uso |
|--------|-----|
| `.card` | Container principal (bg: #1A1715, border: #2A2520, radius: 16px) |
| `h1` | Título (24px, #F5E8CE) |
| `p` | Texto corpo (16px, #CAB792) |
| `.highlight` | Texto dourado (#E6B447, bold) |
| `.button` | CTA (bg: #E6B447, text: #0D0B09, radius: 8px) |
| `.divider` | Separador (1px, #2A2520) |
| `.info-box` | Box de informação (bg: #2A2520, radius: 8px, padding: 16px) |
| `ul` | Lista (color: #CAB792, padding-left: 20px) |
| Small text | `style="font-size: 14px; color: #AB8648;"` |

**Para a tabela comparativa do dia 10**, usar uma table HTML simples dentro de `.info-box`:
```html
<table style="width: 100%; font-size: 14px; color: #CAB792;">
  <thead>
    <tr style="border-bottom: 1px solid #3A3530;">
      <th style="text-align: left; padding: 8px; color: #E6B447;">PRO (trial atual)</th>
      <th style="text-align: left; padding: 8px; color: #AB8648;">Free (após expirar)</th>
    </tr>
  </thead>
  <tbody>
    <tr><td style="padding: 6px 8px;">3 marcas</td><td style="padding: 6px 8px;">1 marca</td></tr>
    <!-- ... -->
  </tbody>
</table>
```

---

## ORDEM DE EXECUÇÃO

1. **`app/src/types/database.ts`** — Adicionar `lastTrialEmailDay?: number` ao User
2. **`app/src/lib/email/resend.ts`** — Criar 6 funções de email (dia 1, 3, 5, 7, 10, 12)
3. **`app/src/app/api/cron/trial-check/route.ts`** — Expandir com lógica de nurturing
4. **`app/src/lib/email/index.ts`** — Verificar exports (se necessário)
5. **Build** — `cd app && npm run build`

---

## VERIFICAÇÃO

### Grep de funções criadas:
```bash
cd app && grep -n "sendTrialDay" src/lib/email/resend.ts
```
**Deve retornar 6 funções:** `sendTrialDay1Email`, `sendTrialDay3Email`, `sendTrialDay5Email`, `sendTrialDay7Email`, `sendTrialDay10Email`, `sendTrialDay12Email`

### Grep de lastTrialEmailDay:
```bash
cd app && grep -rn "lastTrialEmailDay" src/ --include="*.ts" --include="*.tsx"
```
**Deve aparecer em:** `database.ts` (type), `trial-check/route.ts` (read + write)

### Build:
```bash
cd app && npm run build
```

### Checklist de aceitação T6:

- [ ] `lastTrialEmailDay` adicionado ao tipo `User`
- [ ] 6 funções de email criadas em `resend.ts`
- [ ] Cron expandido: busca TODOS os trial users, calcula dia, dispara email correto
- [ ] Dia 1 NÃO envia se `onboardingCompleted === true`
- [ ] `lastTrialEmailDay` atualizado no Firestore após envio (previne re-envio)
- [ ] Emails seguem design system (gold #E6B447, dark surfaces, `baseTemplate()`)
- [ ] CTAs apontam para URLs corretas (welcome, chat, offer-lab, dashboard, billing)
- [ ] Copy em português BR, direto, sem palavras vazias
- [ ] Build passa: `cd app && npm run build`

---

## COMMIT

```
feat: add 14-day trial email nurturing sequence (T6)

- Add 6 nurture email templates (days 1, 3, 5, 7, 10, 12) to resend.ts
- Expand trial-check cron to calculate trial day and dispatch emails
- Add lastTrialEmailDay to User type for idempotent delivery
- Day 1 skipped if onboarding already completed
- All emails follow MKTHONEY design system (gold/dark palette)

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```
