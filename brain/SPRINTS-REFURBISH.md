# MKTHONEY — Sprints do Refurbish

> Plano operacional de sprints para transformar Conselho de Funil em produto vendavel.
> Gerado: 2026-02-25 | Referencia: `brain/PLANO-MESTRE-REFURBISH.md`
> Cross-ref: 8 roadmaps + UX Journey + Architecture Map

---

## LEGENDA

```
[I] = Independente (sem dependencia externa)
[D] = Depende de sprint anterior
[B] = Bloqueado (aguarda decisao ou recurso externo)
[R] = Roadmap de origem
```

---

## MAPA DE DEPENDENCIAS ENTRE SPRINTS

```
SPRINT R1 ─[I]──→ SPRINT R2 ─[D]──→ SPRINT R3 ─[D]──→ SPRINT R4
(Stop the    │     (UX Core)         (Legal &         (Depth &
 Bleeding)   │                        Financial)       Polish)
             │
             │    SPRINT R5 ─[D:R2]──→ SPRINT R6 ─[D:R5]──→ SPRINT R7
             │    (Landing &           (Payment &        (QA &
             │     Rename)              Trial)            Launch)
             │
             └──→ SPRINT R8+ ─[B: OAuth Sprint L]
                  (Scale — pos-launch)
```

**Nota:** Sprints R1-R4 sao sequenciais no core. R5-R7 podem rodar em paralelo com R3-R4 se houver capacity.

---

## SPRINT R1 — STOP THE BLEEDING
**Duracao:** 1.5 semanas (~40h)
**Dependencias:** Nenhuma
**Objetivo:** Eliminar tudo que mente, quebra, ou engana o usuario

### Checklist

#### R1.1 — Settings: Fix Fake Saves [I]
> Origem: `roadmap-settings-v2.md` Fase 1

- [ ] **General tab** — conectar save a `users/{uid}/preferences` no Firestore
  - Arquivo: `app/src/app/settings/general/page.tsx`
  - Impacto DB: criar subcollection `users/{uid}/preferences`
  - Impacto API: nenhuma nova rota
- [ ] **Branding tab** — sincronizar com BrandingProvider + Firestore
  - Arquivo: `app/src/app/settings/branding/page.tsx`
  - Impacto DB: usar `users/{uid}/preferences.branding` existente
- [ ] **Notifications tab** — criar persistence real
  - Arquivo: `app/src/app/settings/notifications/page.tsx`
  - Impacto DB: criar `users/{uid}/notification_preferences`
- [ ] **Tracking tab** — persistir config no brand
  - Arquivo: `app/src/app/settings/tracking/page.tsx`
  - Impacto DB: campo em `brands/{brandId}.trackingConfig`
- [ ] **Payments tab** — validar webhook URL + persistir
  - Arquivo: `app/src/app/settings/integrations/payments/page.tsx`
  - Impacto DB: campo em `brands/{brandId}.paymentWebhook`

#### R1.2 — Remover Dados Hardcoded [I]
> Origem: `roadmap-automation-v2.md` Fase 1

- [ ] **Automation dashboard** — trocar "142 acoes" e "R$12.450" por empty state
  - Arquivo: `app/src/app/automation/page.tsx`
  - Substituir por: query real `brands/{brandId}/automation_logs` count ou "Nenhuma acao executada"
- [ ] **Assets metrics** — remover "+2.4%" trend hardcoded
  - Arquivo: `app/src/components/assets/*.tsx`
  - Substituir por: calculo real ou remover indicador

#### R1.3 — Fix Calendar Error 500 [I]
> Origem: `roadmap-calendar-v2.md` Fase 1

- [ ] **POST /api/content/calendar** — fix auth check + error handling
  - Arquivo: `app/src/app/api/content/calendar/route.ts`
  - Impacto API: fix na rota existente
  - Impacto DB: nenhum

#### R1.4 — Fix Offer Lab [I]
> Origem: `_netecmt/docs/roadmap-offer-lab-v2.md`

- [ ] **Wizard submit** — conectar a geracao real via API
  - Arquivo: `app/src/app/offer-lab/page.tsx`
  - Verificar: `POST /api/offer/generate` existe? Se nao, criar
- [ ] **Modelo Gemini** — usar PRO_GEMINI_MODEL para scoring
  - Verificar em: `app/src/app/api/offer/generate/route.ts`
  - Impacto DB: popular `brands/{brandId}/offers`

#### R1.5 — Fix Temperatura/TopP [I]
> Origem: `roadmap-brand-hub-v2.md` Fase 2

- [ ] **Copy Engine** — ler brand.aiConfig.temperature e passar a Gemini
  - Arquivo: `app/src/lib/ai/copy-engine.ts`
- [ ] **Social Engine** — idem
  - Arquivo: `app/src/lib/ai/social-engine.ts`
- [ ] **Chat route** — idem
  - Arquivo: `app/src/app/api/chat/route.ts`

#### R1.6 — Fix Bug Critico Meta Data Deletion [I]
- [ ] **URL hardcoded** → usar `new URL(req.url).origin`
  - Arquivo: `app/src/app/api/auth/meta/data-deletion/route.ts` (linha 42)
  - Impacto: sem isso, Meta rejeita callbacks pos-launch

#### R1.7 — Verificacao Gemini Models [I]
- [ ] Confirmar env `GEMINI_MODEL` = `gemini-2.5-flash` (nao 2.0)
  - Onde: Vercel Dashboard → Environment Variables
  - Deadline: Gemini 2.0 depreca 31/03/2026
- [ ] Confirmar env `GEMINI_PRO_MODEL` = `gemini-3-pro-preview`

#### R1.8 — Embedding Comments Cleanup [I]
- [ ] `app/src/lib/ai/pinecone.ts` linha 3 — atualizar comentario
- [ ] `app/src/types/database.ts` linha 250 — atualizar comentario
- [ ] `app/src/lib/ai/pinecone-migration.ts` linha 13 — atualizar comentario

### Entregavel Sprint R1
> Sistema sem mentiras. Tudo que o usuario ve e real ou empty state honesto.

---

## SPRINT R2 — UX CORE (Onboarding + Aha Moment)
**Duracao:** 2 semanas (~50h)
**Dependencias:** R1 completo
**Objetivo:** Criar o fluxo que gera o "Aha Moment" em <8 minutos

### Checklist

#### R2.1 — Onboarding Wizard Fase 1A (3 steps obrigatorios) [D:R1]
> Origem: UX Journey Phase 1A + `roadmap-brand-hub-v2.md` Fase 1

- [ ] **Step 1: Identidade** — nome, descricao, vertical
  - Componente: `app/src/components/onboarding/step-identity.tsx` (novo)
  - Dados: salva em `brands/{brandId}` via `createBrand()`
- [ ] **Step 2: Audiencia** — persona ideal + frustracao principal
  - Componente: `app/src/components/onboarding/step-audience.tsx` (novo)
  - UX: perguntas redesenhadas conforme UX Journey
- [ ] **Step 3: Oferta** — produto, preco, diferencial + objecao de preco
  - Componente: `app/src/components/onboarding/step-offer.tsx` (novo)
- [ ] **Progress bar** — Step X de 3
  - Componente: `app/src/components/onboarding/wizard-progress.tsx` (novo)
- [ ] **Transicao** — "Seu Conselho esta analisando sua marca..."
  - Loader animado → redirect para /chat
- [ ] **Refatorar onboarding-store.ts** — separar mandatory vs optional steps
  - Arquivo: `app/src/lib/stores/onboarding-store.ts`
  - Impacto DB: campo `onboardingPhase1AComplete: boolean` em `users/{uid}`

#### R2.2 — Veredito Proativo (Aha Moment) [D:R2.1]
> Origem: UX Journey Phase 2

- [ ] **Chat empty state replacement** — Conselho posta mensagem proativa
  - Arquivo: `app/src/components/chat/chat-empty-state.tsx` (modificar)
  - Trigger: ao entrar em /chat apos wizard 1A completo
- [ ] **Conteudo do veredito:**
  - Score POSICIONAMENTO (x/10) com criterios
  - Score OFERTA (x/10) com framework
  - 2 acoes recomendadas baseadas nos dados
  - 1 follow-up question
- [ ] **API** — usar `POST /api/chat` com mode `funnel_creation` + context wizard
  - Impacto API: nenhuma nova (usa chat existente com context injection)
  - Impacto DB: mensagem salva em `conversations/{id}/messages`

#### R2.3 — Dashboard Contextual (3 estados) [D:R2.2]
> Origem: UX Journey Phase 3

- [ ] **Estado 1: Pre-briefing** — CTA unico "Comecar Briefing"
  - Condicao: `!brandExists || !onboardingPhase1AComplete`
- [ ] **Estado 2: Pos-Aha** — Hero card com veredito + checklist + proximo passo
  - Condicao: `verdictReceived && funnelsCount === 0`
  - Inclui: Brand completion % bar
- [ ] **Estado 3: Ativo** — Stats reais + activity feed + council alerts
  - Condicao: `funnelsCount > 0`
- [ ] **Arquivo principal:** `app/src/app/(app)/page.tsx` (refatorar)
- [ ] **Brand completion checklist** — % bar com 4-7 items
  - Componente: `app/src/components/dashboard/brand-progress.tsx` (novo)
  - Dados: derivado de `brands/{brandId}` fields preenchidos

#### R2.4 — Onboarding Wizard Fase 1B (4 steps opcionais) [D:R2.3]
> Aparece no dashboard como checklist

- [ ] **Step 4: Logo upload** — aparece no checklist pos-aha
- [ ] **Step 5: Identidade visual** — palette, tipografia, estilo
- [ ] **Step 6: Documentos RAG** — upload PDF/DOC para knowledge base
- [ ] **Step 7: Config IA** — temperatura, topP (agora funcional pos R1.5)
- [ ] **Auto-trigger** — Firestore listener atualiza checklist quando step completo
  - Ex: logo uploaded → checkmark animado no dashboard

### Entregavel Sprint R2
> Usuario faz signup → wizard 3 min → veredito streaming → dashboard contextual.
> Aha Moment em <8 minutos.

---

## SPRINT R3 — LEGAL & FINANCEIRO (Base)
**Duracao:** 2 semanas (~45h)
**Dependencias:** R1 completo + Decisoes 8 (CNPJ), 9 (gateway)
**Objetivo:** Compliance legal minimo para vender no Brasil

### Checklist

#### R3.1 — Paginas Legais [B: CNPJ]
- [ ] **Termos de Uso** (`/terms`) — contrato SaaS, licenca, limitacoes
  - Arquivo: `app/src/app/(public)/terms/page.tsx` (novo)
  - Conteudo: template juridico adaptado (pode usar gerador + revisao)
- [ ] **Politica de Privacidade** (`/privacy`) — LGPD completo
  - Arquivo: `app/src/app/(public)/privacy/page.tsx` (novo)
  - Deve listar: Google, Firebase, Pinecone, Vercel, PostHog, Meta como processadores
- [ ] **Politica de Cookies** (`/cookies`) — categorias + finalidades
  - Arquivo: `app/src/app/(public)/cookies/page.tsx` (novo)
- [ ] **Politica de Reembolso** (`/refund`) — 7 dias CDC + pro-rata
  - Arquivo: `app/src/app/(public)/refund/page.tsx` (novo)

#### R3.2 — Cookie Consent Banner [I]
- [ ] **Banner opt-in** — nao carregar PostHog antes do aceite
  - Componente: `app/src/components/legal/cookie-banner.tsx` (novo)
  - Integrar em: `app/src/app/layout.tsx`
- [ ] **Granularidade** — essenciais (sem opcao), analiticos, marketing
- [ ] **Registro consentimento** — salvar em `users/{uid}/consent`
  - Impacto DB: nova subcollection
- [ ] **Condicionar PostHog** — so inicializar apos aceite analiticos
  - Arquivo: `app/src/components/providers/posthog-provider.tsx` (modificar)

#### R3.3 — Footer Legal [B: CNPJ]
- [ ] **Informacoes da empresa** — razao social, CNPJ, endereco, email, canal LGPD
  - Componente: `app/src/components/layout/footer.tsx` (novo ou modificar)
  - Obrigatorio por: Decreto 7.962/2013

#### R3.4 — Endpoints LGPD [I]
- [ ] **Exportacao de dados** — `POST /api/user/export-data`
  - Retorna JSON/CSV com: perfil, brands, funnels, conversations, assets
  - Obrigatorio por: LGPD (portabilidade)
- [ ] **Exclusao de conta** — `POST /api/user/delete-account`
  - Deleta: user, brands, funnels, conversations, Pinecone namespaces, Storage files
  - Obrigatorio por: LGPD (direito a exclusao)
  - IMPORTANTE: cascade delete Pinecone + Storage (fix do risco tecnico #4)
- [ ] **Generalizar data-deletion** — expandir alem do Meta callback
  - Arquivo: reutilizar logica do `POST /api/user/delete-account`

### Entregavel Sprint R3
> 4 paginas legais publicadas, cookie banner ativo, endpoints LGPD funcionais.

---

## SPRINT R4 — DEPTH & POLISH
**Duracao:** 2 semanas (~50h)
**Dependencias:** R2 completo
**Objetivo:** Features que justificam o preco + esconder o que nao funciona

### Checklist

#### R4.1 — Sidebar Progressiva [D:R2]
> Origem: UX Journey Phase 3+5 + todos os roadmaps

- [ ] **Adicionar `minTier`** a cada item de NAV_GROUPS
  - Arquivo: `app/src/lib/constants.ts`
  - Starter: Dashboard, Chat (1 mode), Brands, Funnels (3), Forensics
  - Pro: + todos Intelligence, Automation, Calendar, Vault, Assets, Social
  - Agency: + Admin, Reports, API, Multi-workspace
- [ ] **Filtro de visibilidade** no sidebar
  - Arquivo: `app/src/components/layout/sidebar.tsx`
  - Logica: `tier < minTier` → lock icon + tooltip "Disponivel no PRO"
- [ ] **Badge "Novo"** — para features recém-desbloqueadas (7 dias)

#### R4.2 — Coming Soon Locks [I]
> Origem: Decisao #5

- [ ] **Intelligence stubs** — lock com "Coming Soon"
  - Paginas: `/intelligence/ab-testing`, `/creative`, `/personalization`, `/predict`, `/journey`, `/ltv`, `/research`
  - Componente: `app/src/components/ui/coming-soon-guard.tsx` (novo)
- [ ] **Content Autopilot** — trocar fila vazia por "Coming Soon"
  - Arquivo: vault page
- [ ] **Social Inbox** — lock
- [ ] **Social Trends** — lock

#### R4.3 — Content Autopilot Trigger [I]
> Origem: `roadmap-vault-v2.md` Fase 1

- [ ] **Conectar CurationEngine** ao cron trigger
  - Arquivo: `app/src/app/api/cron/content-autopilot/route.ts`
  - Verificar: cron schedule no Vercel (vercel.json)
- [ ] **Conectar botoes stub** no Vault page
  - Conectar handlers de approve/reject/adapt

#### R4.4 — Tier System Base [I]
> Origem: UX Journey + PLANO-MESTRE-REFURBISH.md Fase 3

- [ ] **Criar `app/src/lib/tier-system.ts`** — logica de limites
  - Limites por tier: brands, funnels/mes, chat/mes, assets, etc.
- [ ] **Criar `app/src/lib/hooks/use-tier.ts`** — hook para checar acesso
  - Retorna: `{ tier, canAccess(feature), limits, usage }`
- [ ] **Campo DB** — `tier: 'free'|'trial'|'pro'|'agency'` em `users/{uid}`
  - Impacto DB: campo novo
- [ ] **Middleware API** — checar tier antes de processar requests
  - Pattern: wrapper function para API routes

#### R4.5 — Namespace Pinecone Fix [I]
> Origem: Risco tecnico #3

- [ ] **Migration script** — mover vetores de `brand-{id}` para `brand_{id}`
  - Arquivo: `app/src/lib/ai/pinecone-migration.ts` (expandir)
  - Impacto DB: Pinecone only
- [ ] **Remover dual-read** apos migracao completa

### Entregavel Sprint R4
> Sidebar mostra features por tier, stubs trancados, tier system funcional.

---

## SPRINT R5 — LANDING PAGE & RENAME
**Duracao:** 1.5 semanas (~35h)
**Dependencias:** R2 completo + Decisoes 2 (copy), 4 (paleta), 7 (dominio)
**Pode rodar em paralelo com:** R3 ou R4

### Checklist

#### R5.1 — Rename UI → MKTHONEY [D:R2]
- [ ] **constants.ts** — 8 labels de chat mode
  - "Conselho" → "MKTHONEY" ou "Council" (decidir naming)
  - "Alto Conselho" → "High Council" ou "MKTHONEY Party"
- [ ] **layout.tsx** — meta title + description
- [ ] **5 botoes** "Consultar Conselho" → "Perguntar ao MKTHONEY"
  - Arquivos: funnels/[id]/page, welcome/page, quick-actions, asset-detail-modal, approval-workspace
- [ ] **3 export footers** — atualizar URL + nome produto
  - Arquivos: export-dialog.tsx, api/funnels/export/route.ts
- [ ] **Paywall modal** — atualizar URL pricing
  - Arquivo: paywall-modal.tsx
- [ ] **Integrations page** — atualizar placeholder nome

#### R5.2 — Roteamento Publico vs Autenticado [I]
- [ ] **Route groups** — separar `(public)` e `(app)`
  - `(public)`: landing, pricing, login, signup, terms, privacy, cookies, refund
  - `(app)`: dashboard, chat, funnels, brands, etc.
- [ ] **Middleware** — redirect nao-autenticado para landing (nao login)
  - Arquivo: `app/src/middleware.ts` (modificar)

#### R5.3 — Landing Page [B: copy + paleta]
- [ ] **Implementar landing** usando copy V2 fornecido
  - Arquivo: `app/src/app/(public)/page.tsx` (novo)
  - Sections: Hero, Pain, Solution, Features, Social Proof, Pricing, CTA
- [ ] **Pricing section** — baseado na decisao de tiers
  - Se 1 tier: card unico R$297 + trial 14d
  - Se 3 tiers: Starter/Pro/Agency comparativo
- [ ] **SEO** — meta tags, OG, structured data
- [ ] **Responsivo** — mobile-first

#### R5.4 — Documentacao Rename [I]
- [ ] Atualizar `brain/GUIA-USO-PLATAFORMA.md`
- [ ] Atualizar `brain/architecture-map.md`
- [ ] Atualizar `_netecmt/prd-master-funcionalidades.md`
- [ ] Atualizar `CLAUDE.md`
- [ ] Atualizar demais docs `brain/roadmap-*.md` (batch)

### Entregavel Sprint R5
> Produto se chama MKTHONEY. Landing page publica. Rotas separadas.

---

## SPRINT R6 — PAYMENT & TRIAL
**Duracao:** 2 semanas (~50h)
**Dependencias:** R3 + R4 + R5 completos + Decisao 9 (gateway)
**Objetivo:** Fluxo completo de monetizacao

### Checklist

#### R6.1 — Integracao Gateway [B: gateway escolhido]
- [ ] **Setup gateway** — Stripe BR ou Asaas ou Kiwify
  - Env vars: `STRIPE_SECRET_KEY` / `ASAAS_API_KEY`
  - Webhook secret configurado
- [ ] **POST /api/payments/checkout** — criar sessao de pagamento
  - Arquivo: `app/src/app/api/payments/checkout/route.ts` (novo)
- [ ] **POST /api/payments/webhook** — processar eventos
  - Arquivo: `app/src/app/api/payments/webhook/route.ts` (novo)
  - Eventos: payment_success, subscription_created, subscription_cancelled, payment_failed
- [ ] **POST /api/payments/cancel** — cancelar assinatura
  - Arquivo: `app/src/app/api/payments/cancel/route.ts` (novo)
- [ ] **GET /api/payments/invoices** — listar faturas
  - Arquivo: `app/src/app/api/payments/invoices/route.ts` (novo)

#### R6.2 — Paginas de Pagamento [D:R6.1]
- [ ] **Pricing page** (`/pricing`) — planos, comparativo, CTA
  - Arquivo: `app/src/app/(public)/pricing/page.tsx` (novo)
- [ ] **Checkout page** (`/checkout`) — formulario do gateway
  - Arquivo: `app/src/app/(public)/checkout/page.tsx` (novo)
- [ ] **Billing page** (`/settings/billing`) — gerenciar assinatura
  - Arquivo: `app/src/app/settings/billing/page.tsx` (novo)
  - Inclui: plano atual, proxima cobranca, historico faturas, botao cancelar

#### R6.3 — Trial Flow [D:R6.1]
- [ ] **Signup** — criar user com `tier: 'trial'`, `trialStartedAt: now()`
  - Impacto DB: campos novos em `users/{uid}`
- [ ] **Trial disclosure** — "Apos 14 dias, sera cobrado R$ X/mes"
  - Visivel em: signup, dashboard, settings
- [ ] **Trial expiration** — cron diario checa `trialStartedAt + 14d`
  - Arquivo: `app/src/app/api/cron/trial-check/route.ts` (novo)
  - Acao: `tier: 'trial'` → `tier: 'free'` (limitar funcionalidades)
- [ ] **Reembolso 7 dias** — botao em /settings/billing nos primeiros 7 dias
  - Automatico: chama gateway refund API
  - CDC Art. 49: obrigatorio

#### R6.4 — NFS-e (se gateway nao emite) [B: gateway]
- [ ] Se Asaas/Kiwify: ja incluso
- [ ] Se Stripe: integrar com eNotas ou NFe.io
  - API: emitir NFS-e a cada webhook `payment_success`

#### R6.5 — Email Transacional [I]
- [ ] **Provider setup** — SendGrid ou Resend
  - Env var: `SENDGRID_API_KEY` ou `RESEND_API_KEY`
- [ ] **Email verificacao** — pos-signup
  - Arquivo: `app/src/app/api/auth/verify-email/route.ts` (novo)
- [ ] **Email boas-vindas** — apos verificacao
- [ ] **Email cobranca** — recibo a cada pagamento
- [ ] **Email trial expirando** — dia 12 + dia 14

### Entregavel Sprint R6
> Fluxo completo: signup → trial 14d → checkout → pagamento → NFS-e → billing.

---

## SPRINT R7 — QA & LAUNCH PREP
**Duracao:** 1.5 semanas (~35h)
**Dependencias:** R1-R6 completos
**Objetivo:** Tudo testado e pronto para producao

### Checklist

#### R7.1 — Dominio & DNS [B: dominio]
- [ ] Registrar dominio (mkthoney.com ou similar)
- [ ] Configurar DNS → Vercel
- [ ] Adicionar custom domain no Vercel Dashboard
- [ ] SSL automatico (Vercel)
- [ ] Redirect 301: `conselho-de-funil.vercel.app` → dominio novo

#### R7.2 — OAuth Provider Updates
- [ ] **Meta/Facebook** — adicionar novo callback URL
- [ ] **Google** — adicionar novo callback URL
- [ ] **Instagram** — adicionar novo callback URL
- [ ] **LinkedIn** — adicionar novo callback URL
- [ ] **TikTok** — adicionar novo callback URL
- [ ] MANTER URLs antigas ativas durante transicao

#### R7.3 — Environment Variables Producao
- [ ] `NEXT_PUBLIC_APP_URL` = `https://mkthoney.com`
- [ ] Gateway keys (producao, nao sandbox)
- [ ] Email provider keys (producao)
- [ ] Verificar todas env vars existentes

#### R7.4 — Testes E2E
- [ ] Fluxo signup → wizard → veredito → dashboard
- [ ] Fluxo checkout → pagamento → tier upgrade
- [ ] Fluxo cancelamento → reembolso 7 dias
- [ ] OAuth Meta + Google (se disponivel)
- [ ] Export PDF/Markdown com branding MKTHONEY
- [ ] Cookie banner + consentimento
- [ ] Portabilidade dados (LGPD export)
- [ ] Exclusao conta (LGPD delete)
- [ ] Mobile responsive (landing + app)
- [ ] Performance (Lighthouse >80)

#### R7.5 — Monitoring & Logs
- [ ] Verificar PostHog tracking events
- [ ] Configurar alertas Vercel (errors, latency)
- [ ] Verificar log retention (Marco Civil: 6 meses)
- [ ] Error boundary global funcional

### Entregavel Sprint R7
> Produto MKTHONEY live em producao com dominio proprio.

---

## SPRINT R8+ — SCALE (Pos-Launch)
**Duracao:** Continuo
**Dependencias:** Sprint L (OAuth real) + App Review Meta
**Objetivo:** Features avancadas que dependem de integracao real

### R8.1 — Email Sequence 14 Dias [I]
> Origem: UX Journey + PLANO-MESTRE Fase 3

- [ ] Sequencia automatica: dia 0, 1, 3, 5, 7, 10, 12, 14
- [ ] Provider: SendGrid/Resend com templates
- [ ] Cron trigger diario

### R8.2 — Social v2 Phases 1-5 [D: Sprint L]
> Origem: `roadmap-social-v2.md`

- [ ] J-1: Content generation real
- [ ] J-2: Calendar integration
- [ ] J-3: Multi-platform sync
- [ ] J-4: Analytics cross-channel
- [ ] J-5: Engagement automation

### R8.3 — Automation v2 Phases 3-5 [D: Sprint L]
> Origem: `roadmap-automation-v2.md`

- [ ] Dados reais de ads (Meta + Google APIs)
- [ ] Budget optimization real
- [ ] Cross-platform rules

### R8.4 — Calendar v2 Phases 2-5 [D: Social v2 + Sprint L]
> Origem: `roadmap-calendar-v2.md`

- [ ] Publishing real
- [ ] Multi-platform scheduling
- [ ] Analytics integration

### R8.5 — Assets v2 Phases 2-5 [D: Sprint L para Phase 3+]
> Origem: `roadmap-assets-v2.md`

- [ ] Phase 2: Advanced metrics
- [ ] Phase 3: OAuth-dependent imports
- [ ] Phase 4-5: Enterprise features

### R8.6 — Brand Hub v2 Phases 3-5 [D: varias]
> Origem: `roadmap-brand-hub-v2.md`

- [ ] Phase 3: Advanced voice profiles
- [ ] Phase 4: Multi-brand analytics
- [ ] Phase 5: Agency features

### R8.7 — Vault v2 Phases 2-5 [D: Phase 1 em R4]
> Origem: `roadmap-vault-v2.md`

- [ ] Phase 2: Adaptation engine
- [ ] Phase 3: Distribution
- [ ] Phase 4: OAuth publishing
- [ ] Phase 5: Analytics

### R8.8 — Settings v2 Phases 2-4 [D: Phase 1 em R1]
> Origem: `roadmap-settings-v2.md`

- [ ] Phase 2: Advanced configs
- [ ] Phase 3: OAuth integrations page
- [ ] Phase 4: Admin settings

---

## TIMELINE VISUAL

```
SEMANA 1-2    ████████  Sprint R1 (Stop the Bleeding)
SEMANA 3-4    ████████████████  Sprint R2 (UX Core)
SEMANA 5-6    ████████████████  Sprint R3 (Legal) ← paralelo com R4 se possivel
SEMANA 5-6    ████████████████  Sprint R4 (Depth) ← paralelo com R3
SEMANA 6-7      ██████████  Sprint R5 (Landing + Rename) ← precisa decisoes pendentes
SEMANA 8-9    ████████████████  Sprint R6 (Payment + Trial)
SEMANA 10     ██████████  Sprint R7 (QA + Launch)
SEMANA 11+    ████████████████████  Sprint R8+ (Scale — pos-launch)
```

**Caminho critico (sequencial): R1 → R2 → R4 → R7 = ~7 semanas**
**Com paralelo (R3||R4, R5||R4): ~8-10 semanas total ate launch**

---

## DECISOES BLOQUEANTES POR SPRINT

| Sprint | Decisao Necessaria | Quem Decide |
|--------|-------------------|-------------|
| R1 | Nenhuma | — |
| R2 | Nenhuma | — |
| R3 | CNPJ/Razao Social | Owner |
| R4 | Nenhuma | — |
| R5 | Copy landing + Paleta de cores + Dominio | Owner |
| R6 | Gateway pagamento + Trial com/sem cartao | Owner |
| R7 | Dominio registrado + Gateway em producao | Owner |

**Sprints R1, R2, R4 podem comecar AGORA sem nenhuma decisao pendente.**

---

## CROSS-REFERENCE: ROADMAPS → SPRINTS

| Roadmap | Fases Cobertas | Sprint(s) |
|---------|---------------|-----------|
| Settings v2 | Fase 1 | R1 |
| Settings v2 | Fases 2-4 | R8+ |
| Calendar v2 | Fase 1 (bug 500) | R1 |
| Calendar v2 | Fases 2-5 | R8+ |
| Brand Hub v2 | Fase 1 (onboarding) | R2 |
| Brand Hub v2 | Fase 2 (temp/topP) | R1 |
| Brand Hub v2 | Fases 3-5 | R8+ |
| Automation v2 | Fase 1 (hardcoded) | R1 |
| Automation v2 | Fases 2-5 | R8+ |
| Assets v2 | Fase 1.6 | COMPLETO |
| Assets v2 | Fases 2-5 | R8+ |
| Vault v2 | Fase 1 (autopilot trigger) | R4 |
| Vault v2 | Fases 2-5 | R8+ |
| Social v2 | Fases 1-6 | R8+ |
| Product Launch | Sprint N (UX) | R2 + R5 |
| Product Launch | Sprint O (Landing) | R5 |
| Product Launch | Sprint P (Onboarding) | R2 |
| Product Launch | Sprint Q (Hardening) | R7 |
| Product Launch | Sprint R (Integrations) | R8+ |
| Offer Lab v2 | Fase 1 (fix) | R1 |
| Offer Lab v2 | Fases 2-4 | R8+ |
| UX Journey | Phase 0 (Landing) | R5 |
| UX Journey | Phase 1A (Wizard) | R2 |
| UX Journey | Phase 1B (Optional) | R2 |
| UX Journey | Phase 2 (Veredito) | R2 |
| UX Journey | Phase 3 (Dashboard) | R2 |
| UX Journey | Phase 4 (Execution) | JA EXISTE |
| UX Journey | Phase 5 (Expansion) | R4 |

---

## RESUMO FINAL

| Metrica | Valor |
|---------|-------|
| Total de sprints ate launch | 7 (R1-R7) |
| Total horas estimadas | ~305h |
| Semanas estimadas | 8-10 |
| Fases de roadmap cobertas | 12 de 39 (30%) |
| Fases pos-launch | 27 (R8+) |
| Decisoes pendentes | 6 |
| Decisoes bloqueantes agora | 0 (R1+R2 podem comecar) |
