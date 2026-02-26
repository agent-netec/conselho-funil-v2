# BACKLOG — Sprint R6: Payment & Trial

**Status:** Em espera (aguardando testes antes de integração Stripe)
**Criado em:** 2026-02-26
**Dependências:** R3, R4, R5 completos ✓

---

## O QUE JÁ FOI IMPLEMENTADO

### Arquivos Criados

| Arquivo | Descrição |
|---------|-----------|
| `app/src/lib/stripe/client.ts` | Stripe client com lazy init + price mappings |
| `app/src/lib/stripe/index.ts` | Barrel export |
| `app/src/app/api/payments/checkout/route.ts` | POST — criar sessão checkout Stripe |
| `app/src/app/api/payments/webhook/route.ts` | POST — webhook para subscription events |
| `app/src/app/api/payments/cancel/route.ts` | POST — cancelar subscription |
| `app/src/app/api/payments/invoices/route.ts` | GET — listar faturas |
| `app/src/app/api/cron/trial-check/route.ts` | GET — cron diário para expirar trials |
| `app/src/app/settings/billing/page.tsx` | UI de billing/subscription |
| `app/src/lib/email/resend.ts` | Templates de email transacional |
| `app/src/lib/email/index.ts` | Barrel export |

### Modificações em Arquivos Existentes

| Arquivo | Mudança |
|---------|---------|
| `app/src/lib/firebase/firestore.ts` | Adicionadas funções: `updateUserTier`, `getExpiredTrialUsers`, `downgradeUsersToFree`, `getUserStripeCustomerId`. Modificado `createUser` para inicializar tier='trial' e trialExpiresAt |
| `app/src/types/database.ts` | Adicionados campos User: `stripeCustomerId`, `stripeSubscriptionId`, `subscriptionStatus`, `subscriptionCurrentPeriodEnd` |
| `app/src/app/(auth)/signup/page.tsx` | Atualizado subHeader para disclosure de trial |
| `app/vercel.json` | Adicionado cron `/api/cron/trial-check` às 00:00 UTC |

---

## O QUE FALTA CONFIGURAR (quando retomar)

### 1. Stripe Dashboard

Criar no Stripe Dashboard:

```
Products:
- MKTHONEY Starter (R$97/mês, R$970/ano)
- MKTHONEY Pro (R$297/mês, R$2970/ano)
- MKTHONEY Agency (R$597/mês, R$5970/ano)
```

Após criar, pegar os price IDs e configurar nas env vars.

### 2. Environment Variables

```bash
# Stripe
STRIPE_SECRET_KEY=sk_live_xxx           # Chave secreta Stripe
STRIPE_WEBHOOK_SECRET=whsec_xxx          # Secret do webhook endpoint
STRIPE_PRICE_STARTER_MONTHLY=price_xxx   # Price ID do Starter mensal
STRIPE_PRICE_STARTER_YEARLY=price_xxx    # Price ID do Starter anual
STRIPE_PRICE_PRO_MONTHLY=price_xxx       # Price ID do Pro mensal
STRIPE_PRICE_PRO_YEARLY=price_xxx        # Price ID do Pro anual
STRIPE_PRICE_AGENCY_MONTHLY=price_xxx    # Price ID do Agency mensal
STRIPE_PRICE_AGENCY_YEARLY=price_xxx     # Price ID do Agency anual

# Resend (Email)
RESEND_API_KEY=re_xxx                    # API Key do Resend
RESEND_FROM_EMAIL=MktHoney <noreply@mkthoney.com>
```

### 3. Stripe Webhook Endpoint

Registrar no Stripe Dashboard:
- URL: `https://mkthoney.com/api/payments/webhook`
- Eventos:
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_failed`

### 4. Domínio de Email (Resend)

- Verificar domínio `mkthoney.com` no Resend
- Configurar DNS records (SPF, DKIM, DMARC)

---

## FLUXO IMPLEMENTADO

```
┌─────────────────────────────────────────────────────────────────┐
│                        SIGNUP FLOW                               │
├─────────────────────────────────────────────────────────────────┤
│  1. User cria conta                                              │
│  2. Firestore: tier='trial', trialExpiresAt=+14 dias            │
│  3. (Futuro) Email de boas-vindas via Resend                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                       CHECKOUT FLOW                              │
├─────────────────────────────────────────────────────────────────┤
│  1. User clica "Assinar Pro" em /settings/billing               │
│  2. Frontend chama POST /api/payments/checkout                  │
│  3. Backend cria Stripe Checkout Session                        │
│  4. User é redirecionado para Stripe Hosted Checkout            │
│  5. Após pagamento, Stripe chama webhook                        │
│  6. Webhook atualiza tier no Firestore                          │
│  7. User redirecionado para /settings/billing?success=true      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     TRIAL EXPIRATION                             │
├─────────────────────────────────────────────────────────────────┤
│  Cron diário (00:00 UTC):                                       │
│  1. Query: users WHERE tier='trial' AND trialExpiresAt < now()  │
│  2. Update: tier='free', trialExpiresAt=null                    │
│  3. (Futuro) Enviar email de trial expirado                     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      CANCELLATION                                │
├─────────────────────────────────────────────────────────────────┤
│  1. User clica "Cancelar" em /settings/billing                  │
│  2. Modal de confirmação com opção de reembolso (7 dias)        │
│  3. POST /api/payments/cancel                                   │
│  4. Se reembolso: Stripe refund + downgrade imediato            │
│  5. Se não: cancel_at_period_end=true (acesso até fim período)  │
└─────────────────────────────────────────────────────────────────┘
```

---

## EMAILS CONFIGURADOS (templates prontos)

| Template | Quando enviar |
|----------|---------------|
| `sendVerificationEmail` | Após signup (verificação de email) |
| `sendWelcomeEmail` | Após verificação de email |
| `sendReceiptEmail` | Após `checkout.session.completed` |
| `sendTrialExpiringEmail` | Dia 12 e dia 14 do trial |
| `sendCancellationEmail` | Após cancelamento de subscription |
| `sendPaymentFailedEmail` | Após `invoice.payment_failed` |

**Nota:** Os TODOs no código marcam onde integrar os emails.

---

## TESTES RECOMENDADOS ANTES DE ATIVAR

1. **Trial Flow**
   - [ ] Criar nova conta e verificar tier='trial' no Firestore
   - [ ] Verificar trialExpiresAt = +14 dias
   - [ ] Testar hook `useTier()` retorna `isTrial=true`

2. **Billing Page**
   - [ ] Acessar /settings/billing logado
   - [ ] Verificar exibição correta do tier
   - [ ] Verificar contagem de dias restantes no trial

3. **Cron Trial Check**
   - [ ] Criar user de teste com trialExpiresAt no passado
   - [ ] Executar manualmente GET /api/cron/trial-check (com CRON_SECRET)
   - [ ] Verificar downgrade para tier='free'

4. **Stripe (quando configurar)**
   - [ ] Testar checkout em modo test
   - [ ] Verificar webhook recebe eventos
   - [ ] Testar cancelamento
   - [ ] Testar reembolso (dentro de 7 dias)

---

## REFERÊNCIAS

- Stripe Dashboard: https://dashboard.stripe.com
- Resend Dashboard: https://resend.com
- Documentação original: `brain/SPRINTS-REFURBISH.md` (linhas 361-418)

---

**Última atualização:** 2026-02-26
