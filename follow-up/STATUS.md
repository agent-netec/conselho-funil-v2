# MKTHONEY (Conselho de Funil) — Follow-Up

> Atualizado: 2026-03-22
> Stack: Next.js 16, React 19, TypeScript, Firebase, Pinecone, Gemini AI, Stripe, Vercel

## Status Geral

Produto com 13 sprints completos (00–13) + 7 gaps da Seção 9 resolvidos + UI premium redesenhada. 15 de 17 módulos funcionais em produção. Duas issues críticas pendentes: bug na expiração de trial (campo errado no cron) e desalinhamento de limites entre landing page e sistema. Launch readiness: ~95%.

---

## Sprints (v2)

- [x] Sprint 00 — Pré-lançamento + fundação técnica
- [x] Sprint 01 — Social completo + Calendário
- [x] Sprint 02 — Tier enforcement + Sistema de Créditos
- [x] Sprint 03 — Brands P0 (maior impacto UX)
- [x] Sprint 04 — Campaigns Foundation (Linha de Ouro)
- [x] Sprint 05 — Chat Transformation (conselheiros AI)
- [x] Sprint 06 — Design Studio Consolidation (7 tasks)
- [x] Sprint 07 — Brand Intelligence Layer (persona, keywords, spy)
- [x] Sprint 08 — Dashboard + Onboarding + 4 fixes
- [x] Sprint 09 — Discovery Upgrades (5 etapas)
- [x] Sprint 10 — Launch Pad (7 etapas + 5 fixes)
- [x] Sprint 11 — Forensics Capability (5 etapas)
- [x] Sprint 12 — Performance/Agency (código 100%, setup Meta/Google manual pendente)
- [x] Sprint 13 — Funnel Intelligence (6 tarefas)

---

## Backlog Seção 9 — Gaps Órfãos

- [x] Gap 1 — Social: Post completo + dois modos (Quick/Estratégico)
- [x] Gap 2 — Predict: 5 ações pós-geração (Social, Campanha, Imagem, Agendar, Exportar)
- [x] Gap 3 — Intelligence Overview: dados reais via ScoutAgent cron
- [x] Gap 4 — Calendário: Export CSV + PDF
- [x] Gap 5 — Offer Lab: UX com sugestões clicáveis + reavaliar + campaign shortcut
- [x] Gap 6 — Vault: auto-save on approval + DNA injection nos prompts
- [x] Gap 7 — Personalization: dados fluem via Brand Intelligence Layer (8 endpoints)

---

## Módulos — Status de Implementação

### Core

- [x] Home/Dashboard — KPIs, atividade recente, quick actions
- [x] Chat — Conselheiros AI com contexto de marca
- [x] Brands — CRUD completo, multi-brand
- [x] Admin — Gestão de usuários e brands

### Marketing Intelligence

- [x] Intelligence Overview — ScoutAgent + sentimento + emoção (cron diário)
- [x] Predict — Análise de texto + geração de ads + 5 ações pós-geração
- [x] Discovery — Keywords, spy, audience research
- [x] Offer Lab — Wizard Hormozi com score + avaliação AI dos conselheiros
- [x] Deep Research — Pesquisa profunda com relatórios Gemini

### Content & Social

- [x] Social — Quick mode (3 posts) + Strategic mode (5 hooks com debate)
- [x] Calendário — CRUD + drag & drop + export CSV/PDF
- [x] Social Inbox — Respostas AI a comentários
- [x] Approval Engine — State machine (draft → published) + history log

### Campaigns & Funnels

- [x] Campaigns — Linha de Ouro (manifesto → copy → ads → design)
- [x] Funnels — Builder + intelligence + compartilhamento público
- [x] Design Studio — Geração de imagens Gemini + creative controls

### Performance & Analytics

- [x] Performance — War Room + alertas + diagnósticos
- [x] Automation — Avaliação + execução automática de regras

### Vault & Library

- [x] Vault — DNA Wizard, Council Review, Explorer, auto-save de aprovados
- [x] Library — Templates com filtros por categoria

### Infrastructure

- [x] Payments (Stripe) — Checkout, webhook, cancel, portal, invoices
- [x] Auth — Firebase Auth + Google OAuth
- [x] Landing Page — Hero, pricing, FAQ, SEO completo
- [x] Firestore Rules — Multi-tenant com agency/client isolation
- [ ] URGENTE: Content route (/content) — rota não existe (consolidada em /social?)
- [ ] Strategy route (/strategy) — rota não existe (feature futura?)

---

## Cron Jobs (Vercel)

- [x] `social-sync` — cada 15min — sincronizar plataformas sociais
- [x] `automation-evaluate` — cada 1h — avaliar regras de automação
- [x] `ads-sync` — cada 6h — sincronizar dados Meta/Google Ads
- [x] `content-autopilot` — cada 6h — auto-publicar conteúdo agendado
- [x] `content-metrics` — diário 06:00 UTC — calcular métricas de conteúdo
- [x] `scout-collect` — diário 07:00 UTC — coletar intel de concorrentes
- [x] `trial-check` — diário 00:00 UTC — verificar expiração de trials

---

## UI Premium (Design System)

- [x] Dark theme com honey gold (#E6B447) como accent
- [x] Superfícies em camadas (surface-0 a surface-3)
- [x] Glassmorphism cards com gradient borders
- [x] Tipografia Geist Sans/Mono com hierarquia cromática
- [x] Sidebar collapsible com gold accent indicators
- [x] Offer Lab — redesign premium (circular gauge, sliders custom, glassmorphism)
- [ ] MEDIA: Padronizar visual de módulos restantes ao nível do Offer Lab

---

## Bloqueios

### URGENTE

- [ ] **Bug Trial Expiration** — Cron `trial-check` busca campo `trialEndsAt` mas Firestore armazena `trialExpiresAt`. Resultado: trials nunca expiram automaticamente.
  - Arquivo: `app/src/app/api/cron/trial-check/route.ts`
  - Fix: alinhar nome do campo (1 linha)

- [ ] **Tier Limits Mismatch** — Landing page mostra Starter=1 brand, Pro=3 brands. Sistema real (`TIER_LIMITS`) permite Starter=5, Pro=15. Usuário compra achando que tem 1 e recebe 5.
  - Arquivos: `app/src/components/landing/` (pricing), `app/src/lib/tiers/`
  - Fix: harmonizar valores

### ALTA

- [ ] **Sprint 12 — Setup manual** — Performance/Agency tem código 100% pronto, mas integração real com Meta Ads API e Google Ads API requer configuração manual (tokens OAuth, app review)

### BAIXA

- [ ] LinkedIn adapter incompleto — TODO Sprint 34: GET /v2/socialActions para inbox real
- [ ] Rate limiter — TODO: alertas Slack quando rate limit é atingido
- [ ] Agency engine — TODO: migrar para collectionGroup query

---

## Próximos Passos

1. **URGENTE** — Corrigir bug `trialEndsAt` vs `trialExpiresAt` (5 min)
2. **URGENTE** — Harmonizar tier limits entre landing page e sistema
3. **ALTA** — Setup real Meta Ads API + Google Ads API (Sprint 12)
4. **ALTA** — Teste end-to-end do fluxo de pagamento Stripe em produção
5. **MEDIA** — Decidir se /content e /strategy viram rotas ou são consolidados
6. **MEDIA** — Nivelar UI dos demais módulos ao padrão premium do Offer Lab
7. **BAIXA** — Completar LinkedIn adapter (Sprint 34)
8. **BAIXA** — Integrar alertas Slack no rate limiter

---

## Referências

- Plano master: `brain/PLANO-REVERSE-TRIAL-TIERS.md`
- Sprint index: `brain/sprints/v2/MASTER-INDEX.md`
- Backlog gaps: `brain/sprints/v2/BACKLOG-SECAO-9-GAPS.md`
- Design tokens: `app/src/styles/design-tokens.css`
- Tier system: `app/src/lib/tiers/`
- Stripe config: `app/src/lib/stripe/client.ts`
