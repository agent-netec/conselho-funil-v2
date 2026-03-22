# Sprint 02 — Tier Enforcement + Sistema de Créditos

> **Status:** 🟢 COMPLETO
> **Máxima:** Progressão Contínua — Zero Becos Sem Saída
> **Princípio:** UX First
> **Bloqueado por:** Sprint 00 (tiers definidos) + Sprint 01 (Starter tem valor)
> **Desbloqueia:** Sprint 12 (Performance/Agency depende de enforcement)
> **Ref doc master:** Risco 5, Risco 6, Seção 6.3

---

## Contexto

Hoje o sistema não cobra créditos de verdade. O campo `credits: 10` é fixo, nunca reseta, raramente verificado. O `withTierCheck()` existe mas quase nenhuma API usa. Para monetizar, precisamos: (1) créditos mensais com reset, (2) tier check em todas as APIs, (3) enforcement real do Free tier (1 chat/dia, 1 funil/dia).

---

## Tarefa 02.1 — Estender `requireBrandAccess` com tier

**Arquivo:** `app/src/lib/auth/brand-guard.ts`
**Ref:** Risco 6 (decisão: estender requireBrandAccess)

### O que mudar:

Hoje retorna `{ userId, brandId }`. Passar a retornar `{ userId, brandId, tier, effectiveTier }`.

```typescript
// ANTES:
export async function requireBrandAccess(req: NextRequest, brandId: string) {
  const token = await verifyToken(req);
  const userId = token.uid;
  const brand = await getBrand(brandId);
  if (brand.userId !== userId) throw new ApiError(403, 'No access');
  return { userId, brandId };
}

// DEPOIS:
export async function requireBrandAccess(req: NextRequest, brandId: string) {
  const token = await verifyToken(req);
  const userId = token.uid;

  // Paralelo: brand + user doc em uma única ida ao Firestore
  const [brand, userDoc] = await Promise.all([
    getBrand(brandId),
    getUserDoc(userId),
  ]);

  if (brand.userId !== userId) throw new ApiError(403, 'No access');

  const tier = userDoc.tier || 'free';
  const effectiveTier = computeEffectiveTier(userDoc);

  return { userId, brandId, tier, effectiveTier };
}

// effectiveTier leva em conta trial:
function computeEffectiveTier(user: UserDoc): Tier {
  if (user.tier === 'trial') {
    const expired = user.trialExpiresAt && user.trialExpiresAt.toDate() < new Date();
    return expired ? 'free' : 'pro'; // Trial ativo = Pro
  }
  return user.tier;
}
```

**Performance:** `Promise.all` com 2 reads paralelos. O read do brand doc já existia. Adicionar read do user doc em paralelo = ~0-10ms extra (não 30-50ms de middleware separado).

### Critérios de aceitação:
- [x] `requireBrandAccess` retorna `{ userId, brandId, tier, effectiveTier }`
- [x] Trial ativo → `effectiveTier = 'pro'`
- [x] Trial expirado → `effectiveTier = 'free'`
- [x] Starter/Pro/Agency → `effectiveTier = tier`
- [x] Nenhuma API existente quebra (campo extra é aditivo)
- [x] Latência < 10ms a mais que antes

---

## Tarefa 02.2 — Tier check nas APIs críticas

**Ref:** Risco 6 + Seção 5 (tabela de features por tier)

### Mapa de rota → tier mínimo:

```typescript
// Constante de referência (NÃO middleware):
export const ROUTE_TIER_MAP: Record<string, Tier> = {
  // Free
  '/api/chat': 'free',              // Free = 1/dia (enforcement em 02.4)
  '/api/funnels': 'free',           // Free = 1/dia (enforcement em 02.4)
  '/api/brands': 'free',            // Free = 1 marca

  // Starter
  '/api/campaigns': 'starter',
  '/api/social/generate': 'starter',
  '/api/calendar': 'starter',

  // Pro
  '/api/design/generate': 'pro',
  '/api/design/plan': 'pro',
  '/api/design/analyze': 'pro',
  '/api/intelligence/research': 'pro',
  '/api/intelligence/spy': 'pro',
  '/api/intelligence/autopsy': 'pro',
  '/api/intelligence/keywords': 'pro',
  '/api/intelligence/offer-lab': 'pro',
  '/api/predict': 'pro',
  '/api/chat/party': 'pro',         // Party Mode = Pro

  // Agency
  '/api/performance': 'agency',
  '/api/personalization': 'agency',
};
```

### Implementação em cada route.ts:

```typescript
// Padrão para cada API:
export async function POST(req: NextRequest) {
  const { userId, brandId, effectiveTier } = await requireBrandAccess(req, body.brandId);

  // Check tier
  if (TIER_ORDER[effectiveTier] < TIER_ORDER['pro']) {
    return createApiError(403, 'Essa feature requer o plano Pro. Faça upgrade em /settings/billing');
  }

  // ... resto da lógica
}
```

### APIs a modificar (adicionar check):

| API | Tier mínimo | Arquivo |
|-----|-------------|---------|
| `/api/design/generate` | Pro | `app/src/app/api/design/generate/route.ts` |
| `/api/design/plan` | Pro | `app/src/app/api/design/plan/route.ts` |
| `/api/design/analyze` | Pro | `app/src/app/api/design/analyze/route.ts` |
| `/api/intelligence/research/search` | Pro | `app/src/app/api/intelligence/research/search/route.ts` |
| `/api/intelligence/research/audience` | Pro | `app/src/app/api/intelligence/research/audience/route.ts` |
| `/api/intelligence/spy/*` | Pro | `app/src/app/api/intelligence/spy/*/route.ts` |
| `/api/intelligence/keywords/*` | Pro | `app/src/app/api/intelligence/keywords/*/route.ts` |
| `/api/predict/*` | Pro | `app/src/app/api/predict/*/route.ts` |
| `/api/social/generate` | Starter | `app/src/app/api/social/generate/route.ts` |
| `/api/campaigns/*` | Starter | `app/src/app/api/campaigns/*/route.ts` |

### Helper para simplificar:

```typescript
// Em brand-guard.ts:
export function requireMinTier(effectiveTier: Tier, minTier: Tier): void {
  if (TIER_ORDER[effectiveTier] < TIER_ORDER[minTier]) {
    throw new ApiError(403, `Essa feature requer o plano ${minTier}. Faça upgrade em /settings/billing`);
  }
}

// Uso:
const { effectiveTier } = await requireBrandAccess(req, brandId);
requireMinTier(effectiveTier, 'pro');
```

### Critérios de aceitação:
- [x] Cada API da tabela verifica tier
- [x] Free tentando acessar Design → 403 com mensagem clara
- [x] Starter tentando acessar Design → 403 com mensagem clara
- [x] Pro acessando Design → funciona normal
- [x] Trial ativo → acessa tudo (effectiveTier = pro)
- [x] Mensagem de erro menciona qual plano é necessário

---

## Tarefa 02.3 — Sistema de créditos mensais com reset

**Ref:** Risco 5 (decisão: aniversário + use-it-or-lose-it)

### Modelo de dados no Firestore:

```typescript
// No user doc (users/{userId}):
{
  // Campos existentes...
  tier: 'pro',

  // Novos campos de créditos:
  monthlyCredits: 500,       // Baseado no tier
  creditsUsed: 127,          // Incrementado a cada uso
  creditResetDate: Timestamp, // Próxima data de reset (aniversário)

  // Deprecar:
  // credits: 10  ← campo legacy, manter para compatibilidade mas não usar
}
```

### Lógica de reset:

```typescript
// Em cada API que consome créditos:
async function consumeCredits(userId: string, amount: number): Promise<void> {
  const userRef = db.collection('users').doc(userId);

  await db.runTransaction(async (t) => {
    const doc = await t.get(userRef);
    const data = doc.data();

    // Check se precisa resetar (aniversário passou)
    if (data.creditResetDate && data.creditResetDate.toDate() < new Date()) {
      t.update(userRef, {
        creditsUsed: amount, // Reset + usa
        creditResetDate: getNextResetDate(data.creditResetDate.toDate()),
      });
      return;
    }

    // Check se tem créditos suficientes
    const remaining = (data.monthlyCredits || 0) - (data.creditsUsed || 0);
    if (remaining < amount) {
      throw new ApiError(402, `Créditos insuficientes. ${remaining} restantes, ${amount} necessários. Próximo reset: ${formatDate(data.creditResetDate)}`);
    }

    // Consumir
    t.update(userRef, {
      creditsUsed: FieldValue.increment(amount),
    });
  });
}

function getNextResetDate(current: Date): Date {
  const next = new Date(current);
  next.setMonth(next.getMonth() + 1);
  return next;
}
```

### Migração de créditos existentes:

```typescript
// Script de migração (rodar uma vez):
// Para cada user com tier pago:
// 1. Definir monthlyCredits baseado no tier
// 2. Definir creditsUsed = 0
// 3. Definir creditResetDate = data do próximo pagamento (Stripe subscription)
```

### Custo por operação:

| Operação | Créditos |
|----------|----------|
| Chat (mensagem normal) | 1 |
| Chat (Party Mode) | 2 |
| Social (modo rápido) | 1 |
| Social (modo estratégico) | 2 |
| Design (gerar imagem) | 5 |
| Design (plan/analyze) | 2 |
| Deep Research | 3-5 (por profundidade) |
| Keywords Miner | 1 |
| Spy Agent | 2 |
| Predict (análise) | 3 |
| Predict (gerar ads) | 5 |
| Offer Lab (avaliação IA) | 2 |

### Critérios de aceitação:
- [x] `consumeCredits()` funciona atomicamente (transaction)
- [x] Reset automático no aniversário
- [x] Créditos não acumulam (use-it-or-lose-it)
- [x] Erro 402 claro quando acabam créditos
- [x] Cada API que gasta créditos usa `consumeCredits()`
- [x] Migração funciona para users existentes (auto-init on first use)

---

## Tarefa 02.4 — Enforcement do Free tier (limites diários)

**Ref:** Risco 2 (Free tier funcional)

### Limites do Free:
- 1 consulta de chat por dia
- 1 criação de funil por dia
- 1 marca total
- Sem Design, Campaigns, Intelligence, etc.

### Implementação:

```typescript
// Campos no user doc:
{
  dailyChatCount: 0,
  lastChatDate: '2026-03-19',  // String YYYY-MM-DD
  dailyFunnelCount: 0,
  lastFunnelDate: '2026-03-19',
}

// No chat route:
if (effectiveTier === 'free') {
  const today = new Date().toISOString().split('T')[0];
  const userDoc = await getUserDoc(userId);

  if (userDoc.lastChatDate === today && userDoc.dailyChatCount >= 1) {
    return createApiError(429, 'Limite diário atingido. No plano Free você tem 1 consulta por dia. Volte amanhã ou faça upgrade!');
  }

  // Incrementar ou resetar
  if (userDoc.lastChatDate !== today) {
    await updateDoc(userRef, { dailyChatCount: 1, lastChatDate: today });
  } else {
    await updateDoc(userRef, { dailyChatCount: FieldValue.increment(1) });
  }
}

// Mesmo padrão para funnels
```

### UX do bloqueio:

Quando o limite é atingido, NÃO mostrar tela vazia. Mostrar:
```
┌──────────────────────────────────────────────┐
│  ⏰ Você usou sua consulta de hoje           │
│                                               │
│  No plano Free, você tem 1 consulta por dia. │
│  Volte amanhã para mais uma!                  │
│                                               │
│  Ou desbloqueie consultas ilimitadas:         │
│  [Ver planos →]                               │
│                                               │
│  Próxima consulta disponível em: 14h23min     │
└──────────────────────────────────────────────┘
```

### Critérios de aceitação:
- [x] Free: 2ª mensagem de chat no mesmo dia → erro 429 com mensagem amigável
- [x] Free: 2º funil no mesmo dia → erro 429 com mensagem amigável
- [x] Free: tentando criar 2ª marca → erro com mensagem (enforcement na API de brands)
- [x] Limites resetam à meia-noite (ou no dia seguinte)
- [x] UI mostra mensagem de upgrade (não tela vazia)
- [x] Starter+ não tem limites diários

---

## Tarefa 02.5 — UI: Indicador de créditos restantes

**Ref:** Seção 16.5 (Dashboard: créditos restantes)

### Onde mostrar:

1. **Sidebar (footer):** Barra de progresso compacta
   ```
   ⚡ 373/500 créditos
   [████████░░░] Reset em 12 dias
   ```

2. **Antes de gastar:** Tooltip/badge no botão de ação
   ```
   [Gerar Design] (5 créditos)
   ```

3. **Dashboard:** Card de créditos com barra visual

### Componente:

```tsx
function CreditIndicator({ used, total, resetDate }: CreditIndicatorProps) {
  const remaining = total - used;
  const percentage = (used / total) * 100;
  const daysUntilReset = differenceInDays(resetDate, new Date());

  return (
    <div>
      <div className="flex justify-between text-xs">
        <span>⚡ {remaining}/{total} créditos</span>
        <span>Reset em {daysUntilReset}d</span>
      </div>
      <Progress value={percentage} />
    </div>
  );
}
```

### Critérios de aceitação:
- [x] Indicador visível na sidebar
- [x] Atualiza em tempo real após consumir créditos (via useTier)
- [x] Mostra dias até reset
- [x] Cor muda quando < 20% (amarelo) e < 5% (vermelho)
- [x] Badge de custo nos botões de ação (Design page + Social wizard mode selector)

---

## Tarefa 02.6 — Webhook Stripe: `monthlyCredits` no upgrade

**Arquivo:** `app/src/app/api/payments/webhook/route.ts`

### O que mudar:

Quando Stripe webhook confirma pagamento:

```typescript
// Além de atualizar tier (já existe):
const tierCredits = {
  starter: 100,
  pro: 500,
  agency: 2000,
};

await updateDoc(userRef, {
  tier: newTier,
  monthlyCredits: tierCredits[newTier],
  creditsUsed: 0,  // Reset ao fazer upgrade
  creditResetDate: getNextMonthDate(),
});
```

Quando Stripe webhook indica renovação mensal:
```typescript
// Reset de créditos no pagamento mensal
await updateDoc(userRef, {
  creditsUsed: 0,
  creditResetDate: getNextMonthDate(),
});
```

### Critérios de aceitação:
- [x] Upgrade → créditos resetados para o novo tier
- [x] Renovação mensal → créditos resetados
- [x] Downgrade → créditos ajustados ao novo tier
- [x] Cancelamento → tier = free, créditos = 0

---

## Check de Progressão Contínua (Máxima do Projeto)

Após Sprint 02:

| Cenário | O que acontece | Beco sem saída? |
|---|---|---|
| Free usa 1 chat/dia | "Volte amanhã ou faça upgrade" + timer | ❌ Sabe quando pode voltar |
| Créditos acabam | "X créditos restantes, reset em Y dias" | ❌ Sabe quando reseta |
| Tenta feature do Pro | "Requer plano Pro. Ver planos →" | ❌ CTA para upgrade |
| Faz upgrade | Créditos imediatos, acesso imediato | ❌ Valor instantâneo |
| Renova mensalmente | Créditos resetam automaticamente | ❌ Ciclo contínuo |

**Transparência total:** O usuário sempre sabe quantos créditos tem, quando resetam, e o que precisa para desbloquear mais.
