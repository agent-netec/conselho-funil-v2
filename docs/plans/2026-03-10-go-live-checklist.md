# GO-LIVE CHECKLIST — MKTHONEY

> **Data:** 2026-03-10
> **Status:** EM ANDAMENTO
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

### GL-1: Google Sign-in UI [BLOCKER]

> Função `signInWithGoogle()` existe em `auth.ts`, mas NÃO há botão na UI.

- [x] **GL-1.1** Adicionar botão "Continuar com Google" em `app/src/app/(auth)/login/page.tsx`
- [x] **GL-1.2** Adicionar botão "Continuar com Google" em `app/src/app/(auth)/signup/page.tsx`
- [x] **GL-1.3** Importar `signInWithGoogle` de `@/lib/firebase/auth`
- [ ] **GL-1.4** Testar fluxo: Google login → cria user no Firestore → redirect para dashboard

**Arquivos:** `login/page.tsx`, `signup/page.tsx`
**Estimativa:** 30 min

---

### GL-2: Stripe — Price IDs reais [BLOCKER]

> Checkout funciona, mas price IDs são PLACEHOLDER. Sem isso, pagamento falha.

- [ ] **GL-2.1** Criar produtos no Stripe Dashboard:
  - Starter Mensal: R$97/mês
  - Starter Anual: R$970/ano
  - Pro Mensal: R$297/mês
  - Pro Anual: R$2.970/ano
  - Agency Mensal: R$597/mês
  - Agency Anual: R$5.970/ano
- [ ] **GL-2.2** Copiar price IDs para env vars na Vercel:
  - `STRIPE_PRICE_STARTER_MONTHLY`
  - `STRIPE_PRICE_STARTER_YEARLY`
  - `STRIPE_PRICE_PRO_MONTHLY`
  - `STRIPE_PRICE_PRO_YEARLY`
  - `STRIPE_PRICE_AGENCY_MONTHLY`
  - `STRIPE_PRICE_AGENCY_YEARLY`
- [ ] **GL-2.3** Setar `STRIPE_SECRET_KEY` na Vercel (live key, não test)
- [ ] **GL-2.4** Setar `STRIPE_WEBHOOK_SECRET` na Vercel
- [ ] **GL-2.5** Configurar webhook no Stripe Dashboard apontando para `https://mkthoney.com/api/payments/webhook`
- [ ] **GL-2.6** Testar fluxo: pricing → checkout → webhook → tier atualizado

**Ação:** Manual no Stripe Dashboard + Vercel Dashboard
**Estimativa:** 1h

---

### GL-3: Stripe Customer Portal [BLOCKER]

> Usuário não consegue gerenciar pagamento (trocar cartão, ver faturas, cancelar).

- [ ] **GL-3.1** Ativar Customer Portal no Stripe Dashboard (Settings → Customer portal)
- [x] **GL-3.2** Criar API route `app/src/app/api/payments/portal/route.ts`
  - Recebe userId, busca stripeCustomerId
  - Cria `stripe.billingPortal.sessions.create({ customer, return_url })`
  - Retorna URL do portal
- [x] **GL-3.3** Adicionar botão "Gerenciar assinatura" em `app/src/app/(app)/settings/billing/page.tsx`
- [ ] **GL-3.4** Testar: clicar botão → abre portal Stripe → voltar ao app

**Arquivos:** novo `api/payments/portal/route.ts`, `settings/billing/page.tsx`
**Estimativa:** 30 min

---

### GL-4: Domínio + DNS [BLOCKER]

> Sair de `app-rho-flax-25.vercel.app` para domínio real.

- [ ] **GL-4.1** Comprar/confirmar domínio `mkthoney.com` (ou alternativo)
- [ ] **GL-4.2** No Vercel Dashboard → Project → Settings → Domains → Add domain
- [ ] **GL-4.3** Configurar DNS no registrador:
  - `A` record → `76.76.21.21`
  - `CNAME` www → `cname.vercel-dns.com`
- [ ] **GL-4.4** Aguardar propagação DNS (até 48h, geralmente < 1h)
- [ ] **GL-4.5** Verificar SSL automático (Vercel gera certificado Let's Encrypt)
- [ ] **GL-4.6** Setar `NEXT_PUBLIC_APP_URL=https://mkthoney.com` na Vercel
- [ ] **GL-4.7** Atualizar URLs hardcoded no código (ver GL-4-URLS abaixo)

**Ação:** Manual no Vercel + Registrador de domínio
**Estimativa:** 30 min (+ tempo de propagação)

---

### GL-4-URLS: Centralizar URLs hardcoded [HIGH]

> 20+ instâncias de `mkthoney.com` hardcoded no código.

- [x] **GL-4-URLS.1** `app/src/app/sitemap.ts` — usar `NEXT_PUBLIC_APP_URL`
- [x] **GL-4-URLS.2** `app/src/app/robots.ts` — usar `NEXT_PUBLIC_APP_URL`
- [x] **GL-4-URLS.3** `app/src/app/layout.tsx` — metadataBase dinâmico
- [x] **GL-4-URLS.4** `app/src/app/landing/page.tsx` — metadataBase + Schema.org
- [x] **GL-4-URLS.5** `app/src/app/(public)/pricing/page.tsx` — Schema.org URLs
- [x] **GL-4-URLS.6** `app/src/app/(public)/terms/page.tsx` — BreadcrumbList
- [x] **GL-4-URLS.7** `app/src/app/(public)/privacy/page.tsx` — BreadcrumbList
- [x] **GL-4-URLS.8** `app/src/components/modals/paywall-modal.tsx` — link pricing
- [x] **GL-4-URLS.9** `app/src/components/funnels/export-dialog.tsx` — footer URL
- [x] **GL-4-URLS.10** `app/src/app/api/funnels/export/route.ts` — footer URL

**Padrão:** `const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://mkthoney.com';`
**Estimativa:** 30 min

---

### GL-5: Env Vars na Vercel [BLOCKER]

> Confirmar que TODAS as variáveis de ambiente estão configuradas.

- [ ] **GL-5.1** Firebase (6 vars NEXT_PUBLIC_FIREBASE_*)
- [ ] **GL-5.2** Firebase Admin (`FIREBASE_SERVICE_ACCOUNT_KEY`)
- [ ] **GL-5.3** Pinecone (`PINECONE_API_KEY`, `PINECONE_INDEX_NAME`, `PINECONE_HOST`)
- [ ] **GL-5.4** Gemini (`GOOGLE_AI_API_KEY`, `NEXT_PUBLIC_GOOGLE_AI_API_KEY`)
- [ ] **GL-5.5** Stripe (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, 6x price IDs)
- [ ] **GL-5.6** Cron (`CRON_SECRET` — mínimo 8 caracteres)
- [ ] **GL-5.7** App (`NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_ENCRYPTION_KEY` — NÃO usar default)
- [ ] **GL-5.8** Email (`RESEND_API_KEY`, `RESEND_FROM_EMAIL`)
- [ ] **GL-5.9** Jina (`JINA_API_KEY`)
- [ ] **GL-5.10** Verificar que nenhuma var está com valor placeholder/default

**Ação:** Manual no Vercel Dashboard
**Estimativa:** 30 min

---

## FASE 2 — ADMIN BACKOFFICE

### GL-6: Admin Master + User Management [HIGH]

> Não existe dashboard admin. Tudo é via Firebase Console. Precisa de:
> - Admin master que dá/tira acesso
> - Criar outros admins
> - Ativar/desativar users manualmente
> - Dar plano pago sem Stripe (cortesia, teste, parceiro)

#### API Routes (backend)

- [x] **GL-6.1** `GET /api/admin/users` — Listar users com filtros (tier, role, email, status)
  - Paginação (limit/offset)
  - Filtros: `?tier=pro&role=admin&search=email@`
  - Retorna: id, email, name, tier, role, credits, createdAt, lastLogin
- [x] **GL-6.2** `GET /api/admin/users/[userId]` — Detalhes de um user
  - Tier, credits, usage, brands, subscription status
- [x] **GL-6.3** `PATCH /api/admin/users/[userId]/tier` — Mudar tier manualmente
  - Body: `{ tier: 'pro', reason: 'cortesia parceiro', expiresAt?: '2026-06-10' }`
  - Salva quem mudou (adminId) e motivo (audit trail)
  - NÃO precisa de Stripe — atualiza direto no Firestore
- [x] **GL-6.4** `PATCH /api/admin/users/[userId]/role` — Mudar role
  - Body: `{ role: 'admin' }`
  - Só admin master pode criar outros admins
- [x] **GL-6.5** `PATCH /api/admin/users/[userId]/credits` — Adicionar/resetar créditos
  - Body: `{ credits: 100, reason: 'bonus mensal' }`
- [x] **GL-6.6** `PATCH /api/admin/users/[userId]/status` — Ativar/desativar conta
  - Body: `{ active: false, reason: 'bloqueado por abuso' }`
- [x] **GL-6.7** `GET /api/admin/stats` — Dashboard resumo
  - Total users, users por tier, receita estimada, signups últimos 7/30 dias

**Auth:** Todas as rotas verificam `role === 'admin'` via `verifyAdminRole()`
**Estimativa:** 3h

#### Frontend (dashboard admin)

- [x] **GL-6.8** Criar page `app/src/app/(app)/admin/page.tsx` — Dashboard admin
  - Cards: total users, users por tier, signups recentes
  - Link para lista de users
- [x] **GL-6.9** Criar page `app/src/app/(app)/admin/users/page.tsx` — Lista de users
  - Tabela com: nome, email, tier, role, créditos, última atividade
  - Filtros por tier e role
  - Busca por email/nome
  - Ações rápidas: mudar tier, dar créditos
- [x] **GL-6.10** Criar page `app/src/app/(app)/admin/users/[userId]/page.tsx` — Detalhe do user
  - Dados completos, histórico de tier changes, brands, usage
  - Botões: mudar tier, mudar role, dar créditos, desativar
- [x] **GL-6.11** Proteger rota `/admin/*` — só role === 'admin' pode acessar
  - Adicionar guard no layout ou middleware
  - Sidebar mostra link "Admin" só para admins
- [ ] **GL-6.12** Criar admin master inicial
  - Definir UID do admin master no env var `ADMIN_MASTER_UID`
  - Script ou API para setar role='admin' no primeiro user

**Estimativa:** 4h

---

## FASE 3 — AJUSTES PRÉ-LAUNCH

### GL-7: Créditos — Reset Mensal [MEDIUM]

- [ ] **GL-7.1** Adicionar campo `creditsResetAt` no User type
- [ ] **GL-7.2** No cron `trial-check` (ou novo cron), resetar créditos para users pagos:
  - Starter: 50/mês, Pro: 300/mês, Agency: 1000/mês
  - Só reseta se `creditsResetAt < início do mês atual`
- [ ] **GL-7.3** Atualizar `creditsResetAt` após reset

**Estimativa:** 1h

---

### GL-8: Firebase Permission Error [MEDIUM]

> Console error "Missing or insufficient permissions" no load. Não bloqueia uso, mas polui o console.

- [ ] **GL-8.1** Investigar qual query dispara antes do auth (provável: useTier, useBrandAssets, useConsent)
- [ ] **GL-8.2** Adicionar guard `isInitialized` nos hooks problemáticos
- [ ] **GL-8.3** Testar que o erro sumiu sem quebrar funcionalidade

**Estimativa:** 1h

---

### GL-9: Prompts Brain Pendentes [MEDIUM]

> 4 prompts brain que são melhorias, não blockers.

- [ ] **GL-9.1** Purple → Gold Cleanup — migrar ~195 refs `purple-*` restantes
- [ ] **GL-9.2** Auth Verification — páginas `/auth/action` (email verify, password reset)
- [ ] **GL-9.3** Native Monitoring — instrumentation.ts + wiring logger/slack
- [ ] **GL-9.4** Visual Polish — 3 refs "Conselho" residuais

**Estimativa:** 3h total

---

## ORDEM DE EXECUÇÃO

### Sprint GO-LIVE (prioridade absoluta)

| Ordem | Task | Tipo | Tempo |
|-------|------|------|-------|
| 1 | **GL-1** Google Sign-in UI | Code | 30 min |
| 2 | **GL-3** Stripe Customer Portal | Code | 30 min |
| 3 | **GL-6** Admin Backoffice (API + UI) | Code | 7h |
| 4 | **GL-4-URLS** Centralizar URLs | Code | 30 min |
| 5 | **GL-2** Stripe Price IDs | Manual | 1h |
| 6 | **GL-4** Domínio + DNS | Manual | 30 min |
| 7 | **GL-5** Env Vars na Vercel | Manual | 30 min |

### Post-launch (semana 1)

| Ordem | Task | Tipo | Tempo |
|-------|------|------|-------|
| 8 | **GL-7** Reset mensal de créditos | Code | 1h |
| 9 | **GL-8** Firebase permission error | Code | 1h |
| 10 | **GL-9** Prompts brain pendentes | Code | 3h |

---

## TOTAL ESTIMADO

| Fase | Tempo |
|------|-------|
| Fase 1 (blockers — code) | ~1.5h |
| Fase 1 (blockers — manual) | ~2h |
| Fase 2 (admin backoffice) | ~7h |
| Fase 3 (pós-launch) | ~5h |
| **TOTAL** | **~15.5h** |

---

## DEPLOY CHECKLIST (dia do go-live)

- [ ] Todas as env vars configuradas na Vercel
- [ ] Stripe webhook configurado com URL de produção
- [ ] DNS propagado e SSL ativo
- [ ] Build passa: `cd app && npm run build`
- [ ] Admin master criado (role='admin' no Firestore)
- [ ] Smoke test: signup → onboarding → chat → upgrade → cancelar
- [ ] Landing page acessível em `https://mkthoney.com`
- [ ] Google Sign-in funciona
- [ ] Email de verificação chega
