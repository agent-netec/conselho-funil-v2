# MKTHONEY — Roadmap de Launch v2

> Atualizado: 2026-03-10 | Baseado em auditoria real do código pós Go-Live (GL-1 a GL-6)
> Referência: PENDENCIAS-COMPLETAS.md (26/fev) → atualizado com trabalho feito em Mar/2026

---

## STATUS GERAL

O projeto passou por **Production Hardening completo** (P0/P1/P2) e **Go-Live Sprint** (GL-1 a GL-6).
O produto está **funcional e monetizável** — pronto para soft launch.

### O que foi feito desde a última documentação (26/fev → 10/mar)

| Commit | O que fez |
|--------|-----------|
| Purple → Gold cleanup | 190+ refs purple migradas para #E6B447 em 73 arquivos |
| Visual Polish | Refs "Conselho" residuais limpas, hero/offer lab atualizados |
| Auth Verification | `/auth/action`, banner verificação, auto-refresh emailVerified |
| Native Monitoring | instrumentation.ts, error boundaries, Speed Insights, logging |
| Production Hardening P0/P1/P2 | Security headers, CSP, health check, a11y, SEO, bundle analyzer |
| TypeScript Strict | Build passa com strict mode habilitado |
| GL-1 Google Sign-in | Login/signup com Google |
| GL-3 Stripe Portal | Checkout, portal, invoices, webhook, billing page |
| GL-4 Dynamic URLs | URLs dinâmicas com env vars |
| GL-6 Admin Backoffice | Dashboard admin, gestão de usuários, API routes |

---

## FASE 1 — DEPLOY IMEDIATO (1-2 dias)

**Objetivo:** Colocar no ar. O produto já funciona.

| # | Tarefa | Tipo | Esforço |
|---|--------|------|---------|
| 1.1 | Smoke test end-to-end (signup → brand → chat → funnel → pagamento → logout) | QA | 2h |
| 1.2 | Lighthouse audit nas páginas públicas (landing, pricing, login) — target >90 | QA | 1h |
| 1.3 | Testar webhook Stripe em produção (dashboard Stripe → test event) | QA | 30min |
| 1.4 | Testar fluxo trial 14 dias → upgrade → portal Stripe | QA | 30min |
| 1.5 | Testar password recovery + email verification end-to-end | QA | 30min |
| 1.6 | Fix purple residual em 3 arquivos admin (Agency badge) | Quick fix | 15min |
| 1.7 | Verificar env vars de produção no Vercel | Config | 15min |
| 1.8 | Deploy Vercel | Deploy | 15min |

**Total estimado: ~5h**

---

## FASE 2 — POLISH PÓS-LAUNCH (Semana 1-2)

**Objetivo:** Refinar a experiência visual e completar branding.

| # | Tarefa | Status Atual | Esforço |
|---|--------|-------------|---------|
| 2.1 | Instalar fonte Satoshi (Fontshare) + configurar layout.tsx | Geist Sans em uso | 2h |
| 2.2 | Criar classes tipográficas (.text-display, .text-heading, .text-overline) | Não existem | 2h |
| 2.3 | Redesign login/signup (remover ícones tech: HTML5, CSS3, Git) | Ícones incorretos | 4h |
| 2.4 | Rename "Conselho" → "MKTHONEY" em prompts/engines (~194 refs) | 194 refs restantes | 4h |
| 2.5 | Landing page skeleton (18 componentes do `_netecmt/docs/landpage/`) | Landing atual é genérica | 15-20h |
| 2.6 | Aquecer backgrounds #09090b → #0D0B09 (cold → warm) | Backgrounds frios | 2h |
| 2.7 | Aplicar texturas grain/grid do skeleton | Não aplicadas | 2h |

**Total estimado: ~30h**

---

## FASE 3 — FEATURE COMPLETENESS (Semanas 3-6)

**Objetivo:** Fechar gaps de UX e funcionalidade core.

### 3A — Onboarding & UX

| # | Tarefa | Status Atual | Esforço |
|---|--------|-------------|---------|
| 3.1 | Integrar Steps 4-7 no onboarding (logo, visual identity, RAG docs, AI config) | Existem em /brands/new mas não no modal | 8h |
| 3.2 | Fix Welcome → "Criar sua marca" (vai para /brands/new em vez do modal 3-step) | Navegação quebrada | 2h |
| 3.3 | Empty states guiados em todas as páginas | Telas genéricas "0 items" | 6h |
| 3.4 | Micro-celebrações (confetti pós-wizard, toasts de progresso) | Não existem | 3h |

### 3B — Brand Config GAPs

| # | Tarefa | Status Atual | Esforço |
|---|--------|-------------|---------|
| 3.5 | GAP-1: Injetar tipografia no prompt de Design Generation | Não conectado | 2h |
| 3.6 | GAP-2: Injetar AI Config/Personalidade no Chat context | Não conectado | 3h |
| 3.7 | GAP-3: Conectar temp/topP em Design Gen, Ad Gen, Copy Gen | Parcial (só chat) | 3h |
| 3.8 | Implementar personalidade como instrução no prompt (não só números) | São só temp/topP | 2h |
| 3.9 | Expandir opções de fonte no wizard (além de "Inter") | Só "Inter" disponível | 1h |
| 3.10 | Remover campos mortos presencePenalty/frequencyPenalty | Existem no tipo TS | 30min |

### 3C — Email & Growth

| # | Tarefa | Status Atual | Esforço |
|---|--------|-------------|---------|
| 3.11 | Email sequence completa (8 emails, 14 dias: dia 0,1,3,5,7,10,12,14) | Templates existem, sequência não automatizada | 6h |
| 3.12 | Decidir NFS-e (eNotas/NFe.io) ou não implementar | Não implementado | 0-8h |

### 3D — Settings & Brand Hub

| # | Tarefa | Status Atual | Esforço |
|---|--------|-------------|---------|
| 3.13 | Persistir branding em Firestore (hoje só React Context) | Não persiste | 4h |
| 3.14 | Eliminar duplicação brand-hub vs brands/[id] | Ambas páginas existem | 4h |
| 3.15 | Cascade delete de brand (remover funnels, conversations, etc.) | deleteBrand() não limpa dependências | 3h |
| 3.16 | Decidir tab "Negócio" em Settings (remover ou conectar) | Status incerto | 1h |

**Total estimado: ~45h**

---

## FASE 4 — FEATURES AVANÇADAS (Mês 2-6, pós-launch)

**Objetivo:** Expandir o produto com features de valor agregado.

### Roadmaps por Feature

| Feature | Progresso | Próxima fase | Dependência |
|---------|-----------|-------------|-------------|
| **Social v2** (6 fases) | 0% | J-1: Fix CSS, seletor campanha, output expandido | — |
| **Automation v2** (5 fases) | ~2% | F2: Rule engine v2, templates, scheduler | — |
| **Calendar v2** (5 fases) | 20% | F2: Visual redesign, drag-drop, week/day views | — |
| **Assets v2** (6 fases) | 17% | F2: Advanced metrics, tagging, search | — |
| **Vault v2** (5 fases) | 0-20% | F1: Content Autopilot, conectar botões stub | — |
| **Brand Hub v2** (15 itens) | 10% | F3: Inline editing, color generator, brand preview | — |
| **Settings v2** (12 itens) | 33% | F2: Dark/light toggle, integrations hub | — |

### Features que dependem de OAuth (Meta App Review)

| Feature | Bloqueio |
|---------|----------|
| Social Inbox unificado (J-4) | Meta Advanced Access |
| Community management (J-5) | Meta Advanced Access |
| Meta/Google Ads real data (Automation F3) | Meta Advanced Access |
| Multi-platform publishing (Calendar F4) | Meta Advanced Access |
| OAuth-dependent imports (Assets F3) | Meta Advanced Access |

**Workaround atual:** Token manual via UI (usuário gera no Graph API Explorer e cola em /integrations)

### Features independentes (podem começar a qualquer momento)

| Feature | Esforço | Valor |
|---------|---------|-------|
| Tour interativo (react-joyride/shepherd.js) | 8-12h | UX |
| Tema Dark/Light toggle | 8-12h | UX |
| 2FA/MFA | 8-10h | Segurança |
| API Keys Management | 6-8h | Developer |
| Busca global | 6-8h | UX |
| Notificações backend real | 8-12h | Engagement |

**Total estimado Fase 4: ~300-400h**

---

## RESUMO EXECUTIVO

| Fase | Foco | Esforço | Prazo sugerido |
|------|------|---------|---------------|
| **Fase 1** | Deploy | ~5h | Imediato |
| **Fase 2** | Visual polish + branding | ~30h | Semana 1-2 |
| **Fase 3** | Feature completeness | ~45h | Semanas 3-6 |
| **Fase 4** | Features avançadas | ~300-400h | Mês 2-6 |

### O que JÁ FUNCIONA (pode ir ao ar hoje)

- ✅ Signup/Login (email + Google)
- ✅ Trial 14 dias com auto-upgrade via Stripe
- ✅ Chat com conselheiros IA (Gemini streaming)
- ✅ Funnel builder com geração IA
- ✅ Offer Lab com scoring
- ✅ Brand creation (wizard 3 steps)
- ✅ Settings que salvam de verdade
- ✅ Admin backoffice
- ✅ Email verification (banner não-bloqueante)
- ✅ Password recovery
- ✅ Stripe checkout + portal + invoices
- ✅ Security headers + CSP + health check
- ✅ Error boundaries + monitoring nativo
- ✅ SEO (meta tags, sitemap, robots, schema.org)
- ✅ Páginas legais (termos, privacidade, cookies, reembolso)
- ✅ TypeScript strict mode passando

### O que NÃO funciona ainda

- ❌ Landing page definitiva (skeleton com 18 componentes)
- ❌ Fonte Satoshi (usa Geist Sans)
- ❌ Rename completo "Conselho" → "MKTHONEY"
- ❌ Login/signup com ícones corretos
- ❌ Onboarding steps 4-7
- ❌ Empty states guiados
- ❌ Email sequence automatizada
- ❌ Brand config totalmente conectado aos engines
- ❌ OAuth Meta (depende App Review)

---

## DECISÕES PENDENTES DO PRODUTO

| # | Decisão | Opções | Impacto |
|---|---------|--------|---------|
| D1 | Lançar com landing atual ou esperar skeleton? | Atual (funcional) vs Skeleton (18 componentes) | Primeira impressão |
| D2 | Implementar NFS-e para launch? | eNotas/NFe.io vs pós-launch | Legal/fiscal |
| D3 | Manter "Estrategista" como tratamento do usuário? | Manter vs mudar | Branding |
| D4 | Tab "Negócio" em Settings — remover ou conectar? | Remover vs implementar | UX |
| D5 | Dark mode only ou implementar light mode? | Dark only vs toggle | UX |
| D6 | Submeter Meta App Review agora ou pós-launch? | Agora vs depois | Features sociais |

---

## ARQUIVOS DE REFERÊNCIA

| Documento | Caminho | Status |
|-----------|---------|--------|
| Pendências completas (v1) | `brain/PENDENCIAS-COMPLETAS.md` | ⚠️ Desatualizado (26/fev) |
| Roadmap Product Launch | `brain/roadmap-product-launch.md` | ⚠️ Desatualizado (16/fev) |
| Roadmap Social v2 | `brain/roadmap-social-v2.md` | Válido |
| Roadmap Automation v2 | `brain/roadmap-automation-v2.md` | Válido |
| Roadmap Calendar v2 | `brain/roadmap-calendar-v2.md` | Válido |
| Roadmap Assets v2 | `brain/roadmap-assets-v2.md` | Válido |
| Roadmap Vault v2 | `brain/roadmap-vault-v2.md` | Válido |
| Roadmap Brand Hub v2 | `brain/roadmap-brand-hub-v2.md` | Válido |
| Roadmap Settings v2 | `brain/roadmap-settings-v2.md` | Válido |
| Brand Config Análise | `brain/ANALISE-BRAND-CONFIG-USAGE.md` | Válido |
| UX Journey | `brain/conselho-funil-v2-ux-journey.md` | Parcialmente implementado |
| Smoke Test | `brain/PROMPT-SMOKE-TEST.md` | Válido |

---

*Este documento substitui `PENDENCIAS-COMPLETAS.md` como referência principal de roadmap.*
