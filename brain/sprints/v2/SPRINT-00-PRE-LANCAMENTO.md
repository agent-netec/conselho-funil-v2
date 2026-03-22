# Sprint 00 — Pré-lançamento (Fundação Técnica)

> **Status:** 🟢 COMPLETO
> **Máxima:** Progressão Contínua — Zero Becos Sem Saída
> **Princípio:** UX First
> **Bloqueado por:** Nada (primeiro sprint)
> **Desbloqueia:** Sprint 01, 02, 04, 05, 06
> **Ref doc master:** Seções 1, 4, 5, 6.1, 6.6

---

## Contexto

O sistema atual tem desalinhamentos críticos entre o que a landing page promete, o que o código define, e o que os novos tiers decididos exigem. O trial é de 14 dias com bug que nunca rebaixa ninguém. Features mortas aparecem na sidebar. Preços estão errados em 3 lugares. Sem este sprint, não existe produto coerente para lançar.

---

## Tarefa 00.1 — Atualizar `tier-system.ts` com novos valores

**Arquivo:** `app/src/lib/tier-system.ts`
**Ref:** Seção 5 (Features por Tier)

### O que mudar:

**TIER_LIMITS:**
```typescript
// DE:
free:    { maxBrands: 1, maxFunnels: 999, ... }
starter: { maxBrands: 1, maxFunnels: 999, maxMonthlyQueries: 50, ... }
pro:     { maxBrands: 3, maxFunnels: 999, maxMonthlyQueries: 300, ... }
agency:  { maxBrands: 100, ... }

// PARA:
free:    { maxBrands: 1, maxFunnels: 1, maxMonthlyCredits: 0, dailyChatLimit: 1, dailyFunnelLimit: 1 }
trial:   { maxBrands: 5, maxFunnels: 10, maxMonthlyCredits: 500 } // = Pro
starter: { maxBrands: 3, maxFunnels: 3, maxMonthlyCredits: 100, maxCampaignsPerBrandPerDay: 1 }
pro:     { maxBrands: 5, maxFunnels: 10, maxMonthlyCredits: 500 }
agency:  { maxBrands: 25, maxFunnels: 999, maxMonthlyCredits: 2000 }
```

**TIER_FEATURES:**
```typescript
// DE:
free: []
starter: ['chat_funnel']

// PARA:
free: ['dashboard', 'chat_general', 'brands', 'funnels', 'settings', 'billing']
starter: ['dashboard', 'chat_general', 'chat_funnel', 'chat_copy', 'chat_social', 'brands', 'funnels', 'settings', 'billing', 'campaigns_basic', 'social_quick', 'calendar_basic']
pro: ['*'] // tudo exceto performance e personalization
agency: ['*'] // tudo incluindo performance e personalization
```

**TIER_ORDER** (manter como está):
```typescript
free: 0, starter: 1, trial: 2, pro: 2, agency: 3
```

**Adicionar TIER_PRICES:**
```typescript
export const TIER_PRICES = {
  starter: { monthly: 147, annual: 117 },
  pro:     { monthly: 497, annual: 397 },
  agency:  { monthly: 997, annual: 797 },
} as const;
```

### Critérios de aceitação:
- [x] `getTierLimits('free')` retorna limites corretos (1 marca, 1 funil/dia, 1 chat/dia)
- [x] `getTierLimits('starter')` retorna 3 marcas, 100 créditos
- [x] `getTierLimits('pro')` retorna 5 marcas, 500 créditos
- [x] `getTierLimits('agency')` retorna 25 marcas, 2000 créditos
- [x] `hasFeatureAccess('free', 'chat_general')` retorna true
- [x] `hasFeatureAccess('free', 'campaigns_basic')` retorna false
- [x] `hasFeatureAccess('starter', 'social_quick')` retorna true
- [x] `hasFeatureAccess('starter', 'design_generate')` retorna false
- [x] Build passa sem erros de tipo

---

## Tarefa 00.2 — Atualizar `constants.ts` com `minTier` corretos

**Arquivo:** `app/src/lib/constants.ts`
**Ref:** Seção 5 (tabela comparativa) + Risco 3 (sidebar híbrida)

### O que mudar:

Cada item em `NAV_GROUPS` precisa de `minTier` atualizado:

| Item sidebar | minTier atual | minTier novo | Nota |
|---|---|---|---|
| Dashboard | — | `'free'` | Todos veem |
| Chat | — | `'free'` | Free = 1/dia |
| Brands | — | `'free'` | Free = 1 marca |
| Funnels | — | `'free'` | Free = 1/dia |
| Campaigns | `'starter'` | `'starter'` | OK |
| Social | `'starter'` | `'starter'` | Coming Soon badge (Sprint 01) |
| Calendar | `'starter'` | `'starter'` | Coming Soon badge (Sprint 01) |
| Design Studio | `'pro'` | `'pro'` | |
| Intelligence | `'pro'` | `'pro'` | |
| Deep Research | `'pro'` | `'pro'` | |
| Discovery | `'pro'` | `'pro'` | |
| Offer Lab | `'pro'` | `'pro'` | |
| Predict | `'pro'` | `'pro'` | |
| Performance | `'agency'` | `'agency'` | |
| Vault | — | — | Coming Soon (todos os tiers) |
| Settings | — | `'free'` | |
| Billing | — | `'free'` | |

**Adicionar campos:**

```typescript
interface NavItem {
  // ... existentes
  minTier: Tier;
  status?: 'active' | 'coming_soon' | 'hidden';
  comingSoonLabel?: string;
}
```

Items a ESCONDER (status: 'hidden'):
- Intelligence Overview
- Page Forensics
- Cross-channel

Items COMING SOON (status: 'coming_soon'):
- Social (até Sprint 01)
- Calendar (até Sprint 01)
- Vault
- Trends Research
- Profile Analysis

### Critérios de aceitação:
- [x] Cada item da sidebar tem `minTier` correto
- [x] Items `hidden` não aparecem na sidebar
- [x] Items `coming_soon` mostram badge (ver tarefa 00.5)
- [x] Build passa

---

## Tarefa 00.3 — Atualizar `landing-pricing.tsx` com novos preços

**Arquivo:** `app/src/components/landing/landing-pricing.tsx`
**Ref:** Seção 5 (preços decididos) + Risco 4

### O que mudar:

| Campo | Valor atual | Valor novo |
|---|---|---|
| Starter preço | R$97 | R$147 |
| Starter marcas | 5 | 3 |
| Starter gerações | 50 | 100 créditos |
| Pro preço | R$297 | R$497 |
| Pro marcas | 15 | 5 |
| Pro gerações | 200 | 500 créditos |
| Agency preço | R$597 | R$997 |
| Agency marcas | Ilimitadas | 25 |

**Features listadas por tier (atualizar cards):**

Starter R$147:
- 3 marcas
- 100 créditos IA/mês
- Chat ilimitado (3 modos)
- Campanhas (1/marca/dia)
- Social modo rápido
- Calendário básico + export CSV

Pro R$497:
- 5 marcas
- 500 créditos IA/mês
- Tudo do Starter +
- Design Studio (geração de imagem)
- Deep Research + Discovery
- Social estratégico (debate + scorecard)
- Calendário completo
- Offer Lab + Predict
- Party Mode

Agency R$997:
- 25 marcas
- 2.000 créditos IA/mês
- Tudo do Pro +
- Performance (War Room)
- Personalização com leads reais
- Deep Research profundidade máxima
- Relatórios PDF

**Desconto anual (20%):**
- Starter: R$117/mês (economia R$360/ano)
- Pro: R$397/mês (economia R$1.200/ano)
- Agency: R$797/mês (economia R$2.400/ano)

### Critérios de aceitação:
- [x] Preços corretos nos 3 cards (147/497/997)
- [x] Features listadas correspondem à seção 5 do doc master
- [x] Toggle mensal/anual implementado (useState, botões Mensal/Anual -20%, economia por plano)
- [x] Argumento de venda atualizado
- [x] Nenhuma referência a "ilimitadas" ou "50 gerações"

---

## Tarefa 00.4 — Corrigir bug do cron (trial nunca expira)

**Arquivo:** `app/src/lib/firebase/firestore-server.ts` (linha ~135)
**Arquivo:** `app/src/app/api/cron/trial-check/route.ts`
**Ref:** Seção 1 (bug crítico) + Risco 1

### O problema:
O cron job busca campo `trialEndsAt` no Firestore, mas o signup salva como `trialExpiresAt`. Resultado: **nenhum trial é rebaixado**. Todos os usuários mantêm acesso Pro infinito.

### O que mudar:

1. **Em `firestore-server.ts`:** Buscar `trialExpiresAt` (não `trialEndsAt`)
2. **Em `trial-check/route.ts`:** Verificar query usa `trialExpiresAt`
3. **Ação no downgrade:** Mudar `tier: 'trial'` → `tier: 'free'`

### Verificar também:
- Campo no signup: confirmar que `trialExpiresAt` é o que é salvo
- Downgrade limpa features corretas (Free = limitado, não bloqueado total)
- Log do downgrade para auditoria

### Critérios de aceitação:
- [x] Cron encontra usuários com trial expirado (fix: trialEndsAt → trialExpiresAt)
- [x] Downgrade muda `tier` para `'free'`
- [x] Campos `dailyChatCount`, `lastChatDate`, `dailyFunnelCount`, `lastFunnelDate` inicializados no downgrade (downgradeUsersToFreeAdmin)
- [x] Testável via deploy — cron protegido por CRON_SECRET

---

## Tarefa 00.5 — Sidebar: cadeado, badge "Em breve", esconder mortas

**Arquivo:** `app/src/components/layout/sidebar.tsx`
**Arquivo:** `app/src/lib/constants.ts` (complemento da tarefa 00.2)
**Ref:** Risco 3 (sidebar híbrida decidida)

### Implementar 3 estados visuais:

**1. Feature acessível (tier do usuário >= minTier):**
- Comportamento normal, clicável, ícone colorido

**2. Feature bloqueada pelo tier:**
- 🔒 Ícone de cadeado discreto ao lado do nome
- Tooltip on hover: "Disponível no plano [Tier] →"
- Click → redireciona para `/settings/billing` (página de upgrade)
- Cor: cinza/muted (não totalmente invisível)

**3. Feature "Coming Soon":**
- 🟡 Badge "Em breve" ao lado do nome
- Independe do tier (ninguém tem acesso)
- Click → tooltip: "Estamos preparando essa feature. Em breve!"
- Não redireciona (não é bloqueio de tier, é feature em desenvolvimento)

**4. Feature escondida:**
- Não renderiza (não aparece na sidebar)

### Componente a criar (ou modificar):

```tsx
// Dentro do sidebar item renderer:
if (item.status === 'hidden') return null;

if (item.status === 'coming_soon') {
  return <SidebarItem icon={item.icon} label={item.label} badge="Em breve" disabled />;
}

if (!hasAccess(userTier, item.minTier)) {
  return <SidebarItem icon={item.icon} label={item.label} locked tierRequired={item.minTier} />;
}

return <SidebarItem icon={item.icon} label={item.label} href={item.href} />;
```

### Critérios de aceitação:
- [x] Usuário Free vê: Dashboard, Chat, Brands, Funnels, Settings, Billing (normais) + cadeado em features superiores
- [x] Usuário Starter vê: tudo do Free + Campaigns + Social/Calendar (coming soon) + cadeado em Pro+
- [x] Intelligence Overview, Forensics: hidden. Upscale HD: removido. Sparklines: removidas.
- [x] Click no cadeado → toast com "Ver planos"
- [x] Tooltip mostra nome do tier necessário

---

## Tarefa 00.6 — Mudar trial de 14→7 dias

**Arquivo:** `app/src/app/api/users/route.ts` (signup)
**Arquivo:** `app/src/lib/hooks/use-tier.ts` (default)
**Ref:** Seção 3 (proposta 7 dias) + Risco 1

### O que mudar:

1. **Signup (users/route.ts):** `trialExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)`
   - Era: `+ 14 * 24 * 60 * 60 * 1000`

2. **Hook (use-tier.ts):** Se há fallback/default de dias de trial, mudar de 14 para 7

3. **Script admin para reset de trials existentes:**
   - Criar endpoint temporário `POST /api/admin/reset-trials`
   - Query: todos os docs com `tier == 'trial'`
   - Update: `trialExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)`
   - Proteger com `verifyAdminRole`
   - Executar uma vez e remover

### Critérios de aceitação:
- [x] Novo signup → `trialExpiresAt` = agora + 7 dias (não 14)
- [x] `use-tier.ts` mostra "X dias restantes" correto (default 7)
- [x] Script de reset: POST /api/admin/reset-trials (protegido por verifyAdminRole, executar 1x)
- [x] Build passa

---

## Tarefa 00.7 — Esconder features mortas da UI

**Ref:** Seção 6.0 (🔴 ESCONDER DA UI)

### Features a esconder:

| Feature | Onde aparece | Ação |
|---|---|---|
| Intelligence Overview | Sidebar + Intelligence Hub | `status: 'hidden'` no NAV_GROUPS |
| Page Forensics | Sidebar + redirect no next.config | `status: 'hidden'` + remover redirect |
| Upscale HD (botão no Design) | `design-generation-card.tsx` | `display: none` ou condicional `false` |
| Benchmarks/Sparklines (Dashboard) | `home/page.tsx` StatsCards | Remover componente ou renderização condicional |
| Cross-channel | `/performance/cross-channel` | `status: 'hidden'` se aparecer na nav |

**Arquivo `next.config.ts`:**
- Remover redirect de `/strategy/autopsy` → `/funnels` (linha ~24)

**Arquivo `design-generation-card.tsx`:**
- Esconder botão "Upscale HD" (handler vazio/quebrado)

**Arquivo `home/page.tsx` ou equivalente:**
- Remover StatsCards com sparklines fake ("Benchmarks 2026")

### Critérios de aceitação:
- [x] Intelligence Overview não aparece na sidebar (status: hidden)
- [x] Page Forensics não aparece na sidebar (status: hidden)
- [x] `/strategy/autopsy` redirect removido do next.config.ts
- [x] Botão Upscale HD removido do design-generation-card.tsx
- [x] Sparklines fake (BenchmarkCard) removidas do stats-cards.tsx
- [x] Nenhuma feature morta acessível pela navegação normal

---

## Tarefa 00.8 — Stripe Price IDs para novos valores

**Arquivo:** `app/src/lib/stripe/client.ts` ou config de preços
**Ref:** Seção 6.6

### O que fazer:

1. Criar novos Price IDs no Stripe Dashboard para:
   - Starter mensal: R$147
   - Starter anual: R$1.404 (R$117/mês × 12)
   - Pro mensal: R$497
   - Pro anual: R$4.764 (R$397/mês × 12)
   - Agency mensal: R$997
   - Agency anual: R$9.564 (R$797/mês × 12)

2. Atualizar Price IDs no código (env vars ou constants)

3. Verificar webhook (`api/payments/webhook/route.ts`) mapeia price → tier corretamente

### Critérios de aceitação:
- [x] Stripe: 6 novos Price IDs criados via API (v2) com valores corretos. Antigos desativados.
- [x] Fallbacks no client.ts atualizados com novos Price IDs
- [x] TIER_PRICES adicionado ao tier-system.ts (147/497/997 mensal, 117/397/797 anual)
- [x] TIER_PRICES_BRL atualizado no stripe/client.ts (centavos corretos)
- [x] Webhook de payment já mapeia price→tier corretamente (getTierFromPriceId)

---

## Tarefa 00.9 — Badges "Em breve" nas features Coming Soon

**Ref:** Seção 6.0 (🟡 COMING SOON)

### Features com badge "Em breve":

| Feature | Tier futuro | Depende de |
|---|---|---|
| Social (modo rápido) | Starter | Sprint 01 |
| Calendário (básico) | Starter | Sprint 01 |
| Vault | — | Redesign completo |
| Aprovações | Pro | Sprint 02 |
| Trends Research | Pro | Sprint 02 |
| Profile Analysis | Pro | Sprint 02 |
| Launch Pad | Pro | Sprint 10 |
| Performance | Agency | Sprint 12 |
| Personalization | Agency | Sprint 12 |

### Implementação:

Já coberto pela tarefa 00.5 (sidebar). Aqui é garantir que os dados em `constants.ts` estão corretos para cada item.

### Critérios de aceitação:
- [x] Cada feature Coming Soon mostra badge "Em breve" na sidebar (via status: 'coming_soon')
- [x] Badge é independente do tier (isComingSoon bloqueia mesmo se tier bate)
- [x] Click mostra toast informativo

---

## Check de Progressão Contínua (Máxima do Projeto)

Após completar Sprint 00, o sistema deve:

| Cenário | O que acontece | Próximo passo claro? |
|---|---|---|
| Novo signup | Trial de 7 dias, acesso Pro | ✅ Onboarding guia |
| Trial expira | Downgrade para Free funcional | ✅ Free tem Dashboard + Chat 1/dia + Funnels 1/dia |
| Free quer mais | Sidebar mostra cadeado com tier necessário | ✅ Click → billing page |
| Feature Coming Soon | Badge "Em breve" | ✅ Não frustra (sabe que está em desenvolvimento) |
| Feature morta | Não aparece | ✅ Zero confusão |

**Nenhum beco sem saída introduzido por este sprint.** O Free tier funcional garante que mesmo pós-trial, o usuário tem ações possíveis (1 chat/dia, 1 funil/dia) que demonstram valor e incentivam upgrade.
