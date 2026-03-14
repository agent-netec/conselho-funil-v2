# GO-LIVE CHECKLIST — MKTHONEY

> **Data:** 2026-03-10
> **Atualizado:** 2026-03-12
> **Status:** EM ANDAMENTO — ~85% concluído
> **Objetivo:** Produto ao vivo com receita, domínio real, admin funcional
> **Regra:** Foco cirúrgico — só o que bloqueia ir ao ar

---

## Legenda

- [ ] Pendente
- [x] Concluído
- **BLOCKER** = Sem isso, não vai ao ar
- **HIGH** = Deveria ter no dia 1
- **MEDIUM** = Pode fazer na semana 1 pós-launch

---

## FASE 1 — BLOQUEADORES DE GO-LIVE

### GL-1: Google Sign-in UI [BLOCKER] ✅ COMPLETO

> Função `signInWithGoogle()` existe em `auth.ts`, mas NÃO há botão na UI.

- [x] **GL-1.1** Adicionar botão "Continuar com Google" em `app/src/app/(auth)/login/page.tsx`
- [x] **GL-1.2** Adicionar botão "Continuar com Google" em `app/src/app/(auth)/signup/page.tsx`
- [x] **GL-1.3** Importar `signInWithGoogle` de `@/lib/firebase/auth`
- [x] **GL-1.4** Testar fluxo: Google login → cria user no Firestore → redirect para dashboard
  > ✅ Testado em 2026-03-12. Funcionou após habilitar provider Google no Firebase Console e corrigir CRLF nas env vars Firebase.

**Arquivos:** `login/page.tsx`, `signup/page.tsx`

---

### GL-2: Stripe — Price IDs reais [BLOCKER] ✅ COMPLETO (verificar GL-2.5 e GL-2.6)

> Checkout funciona, mas price IDs são PLACEHOLDER. Sem isso, pagamento falha.

- [x] **GL-2.1** Criar produtos no Stripe Dashboard:
  - Starter Mensal: R$97/mês
  - Starter Anual: R$970/ano
  - Pro Mensal: R$297/mês
  - Pro Anual: R$2.970/ano
  - Agency Mensal: R$597/mês
  - Agency Anual: R$5.970/ano
- [x] **GL-2.2** Copiar price IDs para env vars na Vercel:
  - `STRIPE_PRICE_STARTER_MONTHLY` ✅
  - `STRIPE_PRICE_STARTER_YEARLY` ✅
  - `STRIPE_PRICE_PRO_MONTHLY` ✅
  - `STRIPE_PRICE_PRO_YEARLY` ✅
  - `STRIPE_PRICE_AGENCY_MONTHLY` ✅
  - `STRIPE_PRICE_AGENCY_YEARLY` ✅
  > Corrigidos em 2026-03-12: estavam com `\n` trailing que quebrava o Stripe SDK.
- [x] **GL-2.3** Setar `STRIPE_SECRET_KEY` na Vercel (live key, não test)
- [x] **GL-2.4** Setar `STRIPE_WEBHOOK_SECRET` na Vercel
- [ ] **GL-2.5** Confirmar webhook no Stripe Dashboard apontando para `https://mkthoney.com/api/payments/webhook`
  > ⚠️ Verificar se o endpoint foi atualizado da URL antiga (`app-rho-flax-25.vercel.app`) para `mkthoney.com`
- [ ] **GL-2.6** Testar fluxo completo: pricing → checkout → webhook → tier atualizado no Firestore
  > Smoke test confirmou redirect para `checkout.stripe.com`. Falta confirmar o callback do webhook atualizando o tier.

**Ação:** Stripe Dashboard → Webhooks

---

### GL-3: Stripe Customer Portal [BLOCKER] ⚠️ QUASE COMPLETO

> Usuário não consegue gerenciar pagamento (trocar cartão, ver faturas, cancelar).

- [ ] **GL-3.1** Ativar Customer Portal no Stripe Dashboard (Settings → Customer portal)
  > ⚠️ Pendente manual — habilitar em Stripe Dashboard
- [x] **GL-3.2** Criar API route `app/src/app/api/payments/portal/route.ts`
  - Recebe userId, busca stripeCustomerId (via Firebase Admin SDK)
  - Cria `stripe.billingPortal.sessions.create({ customer, return_url })`
  - Retorna URL do portal
- [x] **GL-3.3** Adicionar botão "Gerenciar assinatura" em `app/src/app/(app)/settings/billing/page.tsx`
- [ ] **GL-3.4** Testar: clicar botão → abre portal Stripe → voltar ao app

**Arquivos:** `api/payments/portal/route.ts`, `settings/billing/page.tsx`

---

### GL-4: Domínio + DNS [BLOCKER] ✅ COMPLETO

> Sair de `app-rho-flax-25.vercel.app` para domínio real.

- [x] **GL-4.1** Confirmar domínio `mkthoney.com`
- [x] **GL-4.2** Vercel Dashboard → Domains → `mkthoney.com` adicionado
- [x] **GL-4.3** DNS configurado no registrador
- [x] **GL-4.4** Propagação DNS concluída
- [x] **GL-4.5** SSL ativo (HTTPS funciona)
- [x] **GL-4.6** `NEXT_PUBLIC_APP_URL=https://mkthoney.com` setado na Vercel
- [x] **GL-4.7** URLs hardcoded atualizadas (ver GL-4-URLS)

---

### GL-4-URLS: Centralizar URLs hardcoded [HIGH] ✅ COMPLETO

- [x] **GL-4-URLS.1** `app/src/app/sitemap.ts`
- [x] **GL-4-URLS.2** `app/src/app/robots.ts`
- [x] **GL-4-URLS.3** `app/src/app/layout.tsx`
- [x] **GL-4-URLS.4** `app/src/app/landing/page.tsx`
- [x] **GL-4-URLS.5** `app/src/app/(public)/pricing/page.tsx`
- [x] **GL-4-URLS.6** `app/src/app/(public)/terms/page.tsx`
- [x] **GL-4-URLS.7** `app/src/app/(public)/privacy/page.tsx`
- [x] **GL-4-URLS.8** `app/src/components/modals/paywall-modal.tsx`
- [x] **GL-4-URLS.9** `app/src/components/funnels/export-dialog.tsx`
- [x] **GL-4-URLS.10** `app/src/app/api/funnels/export/route.ts`

---

### GL-5: Env Vars na Vercel [BLOCKER] ⚠️ QUASE COMPLETO

> Confirmar que TODAS as variáveis de ambiente estão configuradas.

- [x] **GL-5.1** Firebase (6 vars NEXT_PUBLIC_FIREBASE_*)
  > Corrigidas em 2026-03-12: todas tinham `\r\n` trailing que corrompiam o Firebase SDK.
- [x] **GL-5.2** Firebase Admin (`FIREBASE_SERVICE_ACCOUNT_KEY`)
- [x] **GL-5.3** Pinecone (`PINECONE_API_KEY`, `PINECONE_INDEX_NAME`, `PINECONE_HOST`)
- [x] **GL-5.4** Gemini (`GOOGLE_AI_API_KEY`, `NEXT_PUBLIC_GOOGLE_AI_API_KEY`)
- [x] **GL-5.5** Stripe (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, 6x price IDs)
- [x] **GL-5.6** Cron (`CRON_SECRET`)
- [x] **GL-5.7** App (`NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_ENCRYPTION_KEY`)
- [ ] **GL-5.8** Email (`RESEND_API_KEY`, `RESEND_FROM_EMAIL`)
  > ❌ AUSENTE — confirmar em `vercel env ls`. Sem isso, email de verificação e boas-vindas não funcionam.
- [ ] **GL-5.9** Jina (`JINA_API_KEY`)
  > ⚠️ Verificar se está configurado (não apareceu no `vercel env ls`)
- [x] **GL-5.10** Nenhuma var com valor placeholder/default
  > Verificado em 2026-03-12. Todos os valores são reais.

**Ação:** Vercel Dashboard → Settings → Environment Variables

---

## FASE 2 — ADMIN BACKOFFICE

### GL-6: Admin Master + User Management [HIGH] ⚠️ QUASE COMPLETO

#### API Routes (backend) ✅ COMPLETO

- [x] **GL-6.1** `GET /api/admin/users`
- [x] **GL-6.2** `GET /api/admin/users/[userId]`
- [x] **GL-6.3** `PATCH /api/admin/users/[userId]/tier`
- [x] **GL-6.4** `PATCH /api/admin/users/[userId]/role`
- [x] **GL-6.5** `PATCH /api/admin/users/[userId]/credits`
- [x] **GL-6.6** `PATCH /api/admin/users/[userId]/status`
- [x] **GL-6.7** `GET /api/admin/stats`

#### Frontend (dashboard admin) ✅ COMPLETO

- [x] **GL-6.8** `app/src/app/(app)/admin/page.tsx`
- [x] **GL-6.9** `app/src/app/(app)/admin/users/page.tsx`
- [x] **GL-6.10** `app/src/app/(app)/admin/users/[userId]/page.tsx`
- [x] **GL-6.11** Proteção de rota `/admin/*` (guard `role === 'admin'` no frontend)
  > ⚠️ Nota: middleware não protege `/admin/*` a nível de servidor — guard é client-side only.
- [x] **GL-6.12** Criar admin master inicial
  > ✅ Feito em 2026-03-12 via Firestore REST API. UID: `H1bP8JgMDJcWtbwa9sbP8oLyiPh2` (phsedicias@yahoo.com.br)

---

## FASE 3 — AJUSTES PRÉ-LAUNCH

### GL-7: Créditos — Reset Mensal [MEDIUM]

- [ ] **GL-7.1** Adicionar campo `creditsResetAt` no User type
- [ ] **GL-7.2** No cron `trial-check` (ou novo cron), resetar créditos para users pagos
- [ ] **GL-7.3** Atualizar `creditsResetAt` após reset

---

### GL-8: Firebase Permission Error [MEDIUM]

> Console error "Missing or insufficient permissions" no load.

- [ ] **GL-8.1** Investigar qual query dispara antes do auth
- [ ] **GL-8.2** Adicionar guard `isInitialized` nos hooks problemáticos
- [ ] **GL-8.3** Testar que o erro sumiu

---

### GL-9: Prompts Brain Pendentes [MEDIUM]

- [ ] **GL-9.1** Purple → Gold Cleanup
- [ ] **GL-9.2** Auth Verification — páginas `/auth/action`
- [ ] **GL-9.3** Native Monitoring — `instrumentation.ts`
- [ ] **GL-9.4** Visual Polish — refs "Conselho" residuais

---

## BUGS CORRIGIDOS (fora do checklist original)

> Registrado em 2026-03-12

- [x] **BUG-1** Firebase env vars com `\r\n` trailing no Vercel → Firebase SDK inicializava com authDomain corrompido → "Operação não permitida" em todos os logins. **Fix:** re-add via CLI sem trailing bytes.
- [x] **BUG-2** Stripe env vars com `\n` trailing no Vercel → `ERR_INVALID_CHAR` no HTTP header Authorization. **Fix:** re-add via CLI sem trailing byte.
- [x] **BUG-3** Payment API routes (`checkout`, `cancel`, `invoices`, `portal`) usavam Firebase Client SDK server-side → `Missing or insufficient permissions`. **Fix:** migrar para Firebase Admin SDK.
- [x] **BUG-4** `LoadingScreen` usava 3 `motion.div` com `repeat: Infinity` → React error #310 ao desmontar durante transição de auth. **Fix:** substituir por CSS `@keyframes`.
- [x] **BUG-5** Google Sign-In provider não habilitado no Firebase Console → "Operação não permitida". **Fix:** habilitado manualmente no Firebase Console.

---

## PENDÊNCIAS CRÍTICAS (3 ações manuais restantes)

| # | Ação | Onde | Impacto |
|---|------|------|---------|
| 1 | Setar `RESEND_API_KEY` + `RESEND_FROM_EMAIL` | Vercel Dashboard | Email de verificação quebrado |
| 2 | Confirmar/atualizar webhook Stripe para `mkthoney.com` | Stripe Dashboard → Webhooks | Tier não atualiza após pagamento |
| 3 | Setar `role: "admin"` no seu user no Firestore | Firebase Console → Firestore | Admin backoffice inacessível |

---

## DEPLOY CHECKLIST (dia do go-live)

- [x] DNS propagado e SSL ativo
- [x] Landing page acessível em `https://mkthoney.com`
- [x] Google Sign-in funciona
- [ ] Todas as env vars configuradas (falta RESEND)
- [ ] Stripe webhook configurado com URL de produção (`mkthoney.com`)
- [ ] Admin master criado (role='admin' no Firestore)
- [ ] Build passa: `cd app && npm run build`
- [ ] Smoke test completo: signup → onboarding → chat → upgrade → cancelar
- [ ] Email de verificação chega
