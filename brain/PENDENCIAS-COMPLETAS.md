# MKTHONEY — Pendências Completas (Pós-Sprints R1–R6.5)

> Gerado: 2026-02-26 | Auditoria completa de todos os roadmaps, docs de UX, e código real.
> Referência cruzada: 8 roadmaps + PLANO-MESTRE + UX Journey + ANALISE-BRAND-CONFIG + Sprint Refurbish

---

## ÍNDICE

1. [Landing Page — Problemas Estruturais](#1-landing-page)
2. [UI/UX — Nada da Identidade Visual Foi Aplicada](#2-ui-ux)
3. [Brand Config — GAPs Não Resolvidos](#3-brand-config)
4. [Roadmap Brand Hub v2 — Fases Pendentes](#4-brand-hub)
5. [Roadmap Settings v2 — Fases Pendentes](#5-settings)
6. [Roadmap Social v2 — Tudo Pendente](#6-social)
7. [Roadmap Automation v2 — Tudo Pendente](#7-automation)
8. [Roadmap Calendar v2 — Quase Tudo Pendente](#8-calendar)
9. [Roadmap Assets v2 — Fases Pendentes](#9-assets)
10. [Roadmap Vault v2 — Fases Pendentes](#10-vault)
11. [Product Launch — Itens Não Cobertos](#11-product-launch)
12. [UX Journey — Itens Não Implementados](#12-ux-journey)
13. [Rename Incompleto](#13-rename)
14. [Resumo por Prioridade](#14-resumo)

---

## 1. LANDING PAGE — Problemas Estruturais {#1-landing-page}

### 1.1 A landing page atual NÃO é a definitiva

A landing em `app/src/app/landing/page.tsx` (10 componentes em `components/landing/`) é uma implementação genérica. O usuário forneceu documentação completa para uma landing page diferente:

| Documento | Arquivo | Status |
|-----------|---------|--------|
| Estrutura completa (14 seções, SEO, Schema.org) | `_netecmt/landpage-mkthoney-structure.md` | Não implementado |
| Copy V1 ("Bloomberg Terminal meets War Room") | `_netecmt/docs/landpage/COPY-LANDING-PAGE-V1.md` | Não implementado |
| Copy V2 ("Exército de Um", brutalista-premium) | `_netecmt/docs/landpage/COPY-LANDING-PAGE-V2.md` | Não implementado |
| Skeleton React completo (18 componentes + assets) | `_netecmt/docs/landpage/mkthoney-landing-page-skeleton/` | Não portado para Next.js |

**O skeleton inclui:**
- 18 componentes React (Hero com VideoCarousel, ParticleCanvas, Personas, Comparison Table, Metrics, LogoBar — nenhum existe na landing atual)
- Assets visuais: logos SVG, texturas (grain, grid), glow, 4 vídeos hero
- Paleta honey/gold completa em CSS vars
- Fonte Satoshi configurada
- Schema.org JSON-LD embutido
- Classes custom: `.btn-gold`, `.btn-outline`, `.card-honey`, `.text-display`

### 1.2 A landing está na rota errada

| Problema | Estado atual | Correto |
|----------|-------------|---------|
| Rota da landing | `/landing` | `/` (raiz pública) |
| Rota do dashboard | `/` (raiz) | `/(app)/` (route group autenticado) |
| Route group `(public)` | Só tem páginas legais | Deveria conter a landing |
| Layout `(public)` | Usa paleta emerald | Deveria usar paleta honey/gold |

**Arquitetura necessária (do PLANO-MESTRE):**
```
app/src/app/
  (public)/
    page.tsx          ← Landing (MOVER de /landing)
    layout.tsx        ← Layout honey/gold sem sidebar
    pricing/page.tsx  ← Pricing standalone
  (app)/
    page.tsx          ← Dashboard (MOVER de /page.tsx)
    layout.tsx        ← Layout com sidebar + auth
```

### 1.3 Ações necessárias

- [ ] Portar os 18 componentes do skeleton para Next.js Server Components
- [ ] Aplicar Copy V2 (ou V1 — decisão do usuário) nos componentes
- [ ] Importar assets visuais (logos SVG, texturas, vídeos)
- [ ] Mover landing para `(public)/page.tsx`
- [ ] Mover dashboard para `(app)/page.tsx`
- [ ] Atualizar middleware para nova estrutura de rotas
- [ ] Implementar Schema.org JSON-LD conforme `landpage-mkthoney-structure.md`
- [ ] Landing page atual pode ser descartada ou usada como base de refatoração

---

## 2. UI/UX — Nada da Identidade Visual Foi Aplicada {#2-ui-ux}

### 2.1 Paleta de cores — Gold definida, Emerald implementada

| Token | Definido (docs) | Implementado (app) | Status |
|-------|------------------|--------------------|--------|
| Background | `#0D0B09` (off-black quente) | `hsl(240,10%,3.5%)` ≈ `#09090b` (frio) | **ERRADO** |
| Surface | `#1A1612` (quente) | `hsl(240,6%,6%)` (frio/azulado) | **ERRADO** |
| Accent/CTA | `#E6B447` (Gold) | `#10B981` (Emerald) | **ERRADO** |
| Texto principal | `#F5E8CE` (Cream) | `white` / `zinc-100` | **ERRADO** |
| Texto secundário | `#CAB792` (Sand) | `zinc-400` / `zinc-500` | **ERRADO** |
| Decoração | `#895F29` (Bronze) | `white/[0.06]` borders | **ERRADO** |
| Success | `#7A9B5A` (olive green) | `emerald-500` | **ERRADO** |
| Error | `#C45B3A` (terracotta) | `red-500` | **ERRADO** |

### 2.2 Tipografia — Satoshi definida, Geist implementada

| Aspecto | Definido | Implementado | Status |
|---------|----------|--------------|--------|
| Fonte principal | **Satoshi** (Fontshare, variável) | Geist Sans (Vercel default) | **NÃO APLICADA** |
| Font weights | 300-900 | Padrão Geist | **NÃO APLICADA** |
| `.text-display` | weight 900, clamp(2.5rem,5vw+1rem,5rem) | Não existe | **NÃO CRIADA** |
| `.text-heading` | weight 700, clamp(1.75rem,3vw+0.5rem,3rem) | Não existe | **NÃO CRIADA** |
| `.text-overline` | weight 500, 0.7-0.8rem, tracking 0.15em | Não existe | **NÃO CRIADA** |

### 2.3 Estética — "Brutalista-premium" definida, genérica implementada

| Aspecto | Definido (Copy V2) | Implementado | Status |
|---------|--------------------|--------------| --------|
| Estética | "Bloomberg Terminal meets War Room" | "Linear/Raycast" genérico | **NÃO APLICADA** |
| Posicionamento | "Grey, agressivo, militar-tático" | Clean SaaS genérico | **NÃO APLICADO** |
| Texturas | Grain overlay, grid overlay | `bg-dot-pattern` sutil | **NÃO APLICADAS** |
| Animações hero | VideoCarousel, ParticleCanvas, 3D perspective | Ripple circles + tech orbit | **NÃO APLICADAS** |
| Ícones login | Deveriam ser de marketing | HTML5, CSS3, Figma, Git (dev) | **INCORRETOS** |

### 2.4 Design tokens — Arquivo existe mas com valores errados

`app/src/styles/design-tokens.css` existe e está bem estruturado, mas com paleta emerald/zinc em vez de honey/gold. Precisa ser reescrito com os tokens do skeleton.

### 2.5 Template Cleverwise — Inspiração não aplicada

O template Cleverwise (Figma, XD, Sketch, PSD em `landpage-1/`) foi adquirido como inspiração de layout. Nenhum elemento de layout foi portado:
- Layout do Cleverwise: não replicado
- Fontes Cleverwise (Libre Franklin + Mulish): **descartadas por decisão** — correto, Satoshi é a escolhida
- Cores Cleverwise: **descartadas por decisão** — correto, honey/gold é a paleta

### 2.6 Ações necessárias — UI/UX

- [ ] Reescrever `design-tokens.css` com paleta honey/gold completa
- [ ] Instalar fonte Satoshi (Fontshare) e configurar em `layout.tsx`
- [ ] Criar classes tipográficas (`.text-display`, `.text-heading`, `.text-overline`, etc.)
- [ ] Migrar todos componentes de emerald → gold accent
- [ ] Aquecer backgrounds de `#09090b` → `#0D0B09`
- [ ] Aplicar texturas grain/grid do skeleton
- [ ] Reescrever tela de login/signup (remover ícones tech, aplicar nova identidade)
- [ ] Atualizar `globals.css` com novos tokens
- [ ] Atualizar Tailwind config com cores honey/gold

---

## 3. BRAND CONFIG — GAPs Não Resolvidos {#3-brand-config}

Fonte: `brain/ANALISE-BRAND-CONFIG-USAGE.md`

### 3.1 GAPs documentados mas não corrigidos

| GAP | Descrição | Engines afetados | Status |
|-----|-----------|-----------------|--------|
| GAP-1 | Tipografia NÃO usada em Design Generation | `api/design/generate/route.ts` | **NÃO CORRIGIDO** |
| GAP-2 | AI Config NÃO injetada no Chat context | `lib/ai/formatters.ts` | **NÃO CORRIGIDO** |
| GAP-3 | Temperature/TopP ignorados em 3 engines | Design, Ads, Brand Compliance | **PARCIAL** (chat corrigido em R1.5, outros não) |

### 3.2 Tabela de conectividade — O que falta

| Config | Chat | Design | Content | Copy | Ads |
|--------|------|--------|---------|------|-----|
| Cores | ✅ | ✅ | ❌ | ❌ | ❌ |
| Tipografia | ✅ | ❌ | ❌ | ❌ | ❌ |
| AI Config (temp) | ❌ | ❌ hardcoded | ✅ | ✅ (só temp) | ❌ hardcoded |
| AI Config (topP) | ❌ | ❌ | ❌ | ❌ | ❌ |
| Positioning | ✅ | ❌ | ✅ | ✅ | ✅ |
| Visual Style | ✅ | ✅ | ❌ | ❌ | ❌ |

### 3.3 Wizard de Tipografia limitado

O wizard de brand só oferece "Inter" como opção de fonte. O campo existe no banco e é injetado nos prompts, mas a UI não permite escolher outras fontes.

### 3.4 Personalidade é só números

Os 4 perfis de AI (Agressivo/Sóbrio/Criativo/Equilibrado) são apenas combinações de temperature + topP. NÃO injetam instruções de personalidade no prompt.

### 3.5 Campos mortos

`presencePenalty` e `frequencyPenalty` existem no tipo TypeScript mas Gemini não suporta (são da OpenAI). Devem ser removidos.

### 3.6 Ações necessárias

- [ ] GAP-1: Injetar tipografia no prompt de Design Generation
- [ ] GAP-2: Injetar AI Config/Personalidade no contexto do Chat (`formatters.ts`)
- [ ] GAP-3: Conectar temp/topP em Design Gen (`route.ts`), Ad Gen (`ad-generator.ts`), Copy Gen (`copy-gen.ts` topP)
- [ ] Expandir opções de fonte no wizard (além de "Inter")
- [ ] Implementar personalidade como instrução no prompt (não só números)
- [ ] Remover campos mortos `presencePenalty`/`frequencyPenalty` de `database.ts`

---

## 4. ROADMAP BRAND HUB v2 — Fases Pendentes {#4-brand-hub}

Fonte: `brain/roadmap-brand-hub-v2.md`

| Fase | Descrição | Status | Coberto por Sprint? |
|------|-----------|--------|---------------------|
| **1.1** | Expandir Wizard para 6-7 steps | **NÃO** | R2.1 fez 3 steps (modal), `/brands/new` tem 7 steps mas é o formulário ANTIGO |
| **1.2** | Brand Completeness Score | **SIM** | R2.3 (`brand-progress.tsx`) |
| **1.3** | Eliminar duplicação brand-hub vs brands/[id] | **NÃO** | Ambas páginas ainda existem |
| **2.1** | Conectar temp/topP em TODOS os engines | **PARCIAL** | R1.5 fez chat, faltam Design/Ads/Copy(topP) |
| **2.2** | Personalidade injetada no prompt | **NÃO** | Ainda são só números |
| **2.3** | Remover campos mortos | **NÃO** | `presencePenalty`/`frequencyPenalty` ainda existem |
| **3.1** | Inline editing na visão geral | **NÃO** | |
| **3.2** | Color Palette Generator | **NÃO** | |
| **3.3** | Brand Preview Card | **NÃO** | |
| **4.1** | Cascade Delete | **NÃO** | `deleteBrand()` não remove funnels, conversations, etc. |
| **4.2** | Brand Export | **NÃO** | |
| **4.3** | Brand Duplication | **NÃO** | |
| **5.1** | Voice Profile Editor | **NÃO** | |
| **5.2** | Brand Voice Sample Generation | **NÃO** | |
| **5.3** | Multi-Language Brand Voice | **NÃO** | |

**Resumo: 1.5 de 15 itens feitos (10%)**

---

## 5. ROADMAP SETTINGS v2 — Fases Pendentes {#5-settings}

Fonte: `brain/roadmap-settings-v2.md`

O relatório do roadmap dizia que 5/6 tabs eram fake save. O Sprint R1.1 corrigiu isso — saves agora são reais. Mas:

| Fase | Descrição | Status |
|------|-----------|--------|
| **1.1** | Fix Tab Perfil (avatar upload, displayName) | **SIM** (R1) |
| **1.2** | Decidir Tab Negócio (remover ou conectar) | **NÃO** — tab ainda existe, status incerto |
| **1.3** | Fix Tab Segurança (mudar senha) | **SIM** (R1) |
| **1.4** | Fix Tab Notificações | **SIM** (R1) |
| **2.1** | Persistir Branding em Firestore | **NÃO** — ainda só React Context |
| **2.2** | Tema Dark/Light | **NÃO** — hardcoded dark only |
| **2.3** | Eliminar duplicação Aparência vs Brand Hub | **NÃO** |
| **3.x** | Central de Integrações completa (15+ cards) | **NÃO** — depende OAuth (Sprint L) |
| **4.1** | Notificações Backend Real | **NÃO** |
| **4.2** | 2FA/MFA | **NÃO** |
| **4.3** | API Keys Management | **NÃO** |
| **4.4** | Export de Dados (LGPD) | **SIM** (R3) — endpoint existe |

**Resumo: 4 de 12 itens feitos (33%)**

---

## 6. ROADMAP SOCIAL v2 — Tudo Pendente {#6-social}

Fonte: `brain/roadmap-social-v2.md`

6 fases (J-1 a J-5 + Command Center). **NENHUMA fase foi executada.**

| Fase | Itens | Status |
|------|-------|--------|
| J-1 | Fix CSS, seletor de campanha, output expandido, pesquisa ativa, revisão de plataformas | **NÃO** |
| J-2 | Debate multi-conselheiro, compliance por plataforma, painel de resultados, export | **NÃO** |
| J-3 | Trends Hub (pesquisa profunda, trending real, social listening) | **NÃO** |
| J-4 | Social Inbox unificado, DM/comment management | **NÃO** — depende OAuth |
| J-5 | Community management, sentiment analysis, influencer tracking | **NÃO** — depende OAuth |
| CC | Social Command Center (dashboard unificado) | **NÃO** — depende J-1 a J-5 |

**Resumo: 0 de ~30 itens feitos (0%)**

---

## 7. ROADMAP AUTOMATION v2 — Tudo Pendente {#7-automation}

Fonte: `brain/roadmap-automation-v2.md`

5 fases. Sprint R1.2 removeu dados hardcoded, mas as fases do roadmap não foram executadas.

| Fase | Itens | Status |
|------|-------|--------|
| F1 | Fix dados falsos, criar empty states, conectar Firestore real | **PARCIAL** (R1.2 removeu hardcoded) |
| F2 | Rule engine v2, template library, scheduler | **NÃO** |
| F3 | Meta/Google Ads real data, budget optimization | **NÃO** — depende OAuth |
| F4 | Cross-platform rules, A/B testing de rules | **NÃO** — depende OAuth |
| F5 | ML-based optimization, anomaly detection | **NÃO** |

**Resumo: 0.5 de ~25 itens feitos (~2%)**

---

## 8. ROADMAP CALENDAR v2 — Quase Tudo Pendente {#8-calendar}

Fonte: `brain/roadmap-calendar-v2.md`

5 fases. Sprint R1.3 fixou o bug 500.

| Fase | Itens | Status |
|------|-------|--------|
| F1 | Fix bug 500, auth error handling, retry logic | **SIM** (R1.3) |
| F2 | Visual redesign, drag-and-drop, week/day views | **NÃO** |
| F3 | Content generation integration, AI suggestions | **NÃO** |
| F4 | Multi-platform publishing | **NÃO** — depende OAuth + Social v2 |
| F5 | Analytics per post, best time to post | **NÃO** — depende OAuth |

**Resumo: 1 de 5 fases feita (20%)**

---

## 9. ROADMAP ASSETS v2 — Fases Pendentes {#9-assets}

Fonte: `brain/roadmap-assets-v2.md`

5 fases. Fase 1.6 já completa antes do refurbish.

| Fase | Itens | Status |
|------|-------|--------|
| F1.6 | Funcionalidade base | **SIM** (pré-refurbish) |
| F1 bugs | Asset invisível, logoLock undefined, sem delete | **NÃO VERIFICADO** |
| F2 | Advanced metrics, tagging, search | **NÃO** |
| F3 | OAuth-dependent imports (Meta, Google) | **NÃO** — depende OAuth |
| F4 | Enterprise: versioning, approval workflows | **NÃO** |
| F5 | AI-powered organization, auto-tagging | **NÃO** |

**Resumo: 1 de 6 fases feita (~17%)**

---

## 10. ROADMAP VAULT v2 — Fases Pendentes {#10-vault}

Fonte: `brain/roadmap-vault-v2.md`

5 fases. Sprint R4.3 deveria ter conectado o Content Autopilot trigger.

| Fase | Itens | Status |
|------|-------|--------|
| F1 | Ativar Content Autopilot, conectar botões stub | **NÃO VERIFICADO** (R4.3 listado mas não testado) |
| F2 | Adaptation engine (multi-formato) | **NÃO** |
| F3 | Distribution (multi-canal) | **NÃO** |
| F4 | OAuth publishing | **NÃO** — depende OAuth |
| F5 | Analytics por conteúdo | **NÃO** — depende OAuth |

**Resumo: 0-1 de 5 fases feita (0-20%)**

---

## 11. PRODUCT LAUNCH — Itens Não Cobertos {#11-product-launch}

Fonte: `brain/roadmap-product-launch.md`

### Sprint N — UX/UI Foundation
| Item | Status |
|------|--------|
| Definir paleta → criar tokens | **NÃO** — paleta definida em docs, não aplicada |
| Tipografia | **NÃO** — Satoshi não instalada |
| Redesign sidebar | **PARCIAL** — locks por tier sim, visual não mudou |
| Redesign header | **NÃO** |
| Componentes base (botões, cards, inputs, modals) | **NÃO** — ainda usam emerald/zinc |

### Sprint O — Landing + Auth
| Item | Status |
|------|--------|
| Landing page conforme docs | **NÃO** — landing atual é genérica, não a do skeleton |
| Redesign login/signup | **NÃO** — ícones tech ainda presentes |
| Email verification | **SIM** — funciona (banner amarelo visível) |
| Password recovery | **SIM** — link "Esqueci minha senha" funciona |

### Sprint P — Onboarding Completo
| Item | Status |
|------|--------|
| Welcome wizard 5-7 steps | **PARCIAL** — modal de 3 steps existe, wizard de 7 steps em `/brands/new` é o formulário antigo |
| Checklist de completude persistente | **SIM** — `brand-progress.tsx` no dashboard |
| Empty states guiados | **NÃO** — páginas sem dados mostram telas genéricas |
| Tour interativo | **NÃO** |

### Sprint Q — Production Hardening
| Item | Status |
|------|--------|
| Security audit | **NÃO** |
| Performance audit (Lighthouse 90+) | **NÃO** |
| Sentry / Error tracking | **NÃO** |
| Monitoring + alertas | **NÃO** |

### NFS-e
| Item | Status |
|------|--------|
| Integração com eNotas ou NFe.io | **NÃO** — Sprint R6.4 não implementado |

---

## 12. UX JOURNEY — Itens Não Implementados {#12-ux-journey}

Fonte: `brain/conselho-funil-v2-ux-journey.md`

### Fase 0: Pre-Produto
| Item | Status |
|------|--------|
| Landing page definitiva | **NÃO** — a atual não é a do skeleton |

### Fase 1A: Brand Briefing (3 steps obrigatórios)
| Item | Status |
|------|--------|
| Modal de 3 steps (Identidade, Audiência, Oferta) | **SIM** |

### Fase 1B: Brand Briefing (4 steps opcionais)
| Item | Status |
|------|--------|
| Step 4: Logo upload no checklist | **NÃO** — existe em `/brands/new` mas não no modal |
| Step 5: Identidade visual (cores, tipografia) | **NÃO** — não integrado ao onboarding |
| Step 6: Documentos RAG upload | **NÃO** — não integrado ao onboarding |
| Step 7: Config IA (preset) | **NÃO** — não integrado ao onboarding |
| Auto-trigger (Firestore listener → checkmark animado) | **NÃO** |

### Fase 2: Aha Moment
| Item | Status |
|------|--------|
| Veredito Proativo no chat | **SIM** — endpoint existe |
| Score Posicionamento (x/10) | **SIM** — no endpoint |
| Score Oferta (x/10) | **SIM** — no endpoint |
| Trigger automático pós-wizard | **NÃO VERIFICADO** |

### Fase 3: Dashboard Contextual
| Item | Status |
|------|--------|
| 3 estados (pre-briefing, post-aha, active) | **SIM** |
| Micro-celebrações (confetti, toast, animações) | **NÃO** |

### Fase 4: Segundo Loop
| Item | Status |
|------|--------|
| Funnel Builder guiado | Existe mas sem guia |
| Page Forensics guiado | Existe mas sem guia |

### Fase 5: Expansão
| Item | Status |
|------|--------|
| Sidebar progressiva por tier | **SIM** |
| Sequência de emails 14 dias | **PARCIAL** — templates existem, cron de trial existe, mas sequência completa (dia 0,1,3,5,7,10,12,14) **NÃO** |

---

## 13. RENAME INCOMPLETO {#13-rename}

| Métrica | Valor |
|---------|-------|
| Referências "MKTHONEY" | 44 |
| Referências "Conselho" | **194** |

Locais com "Conselho" ainda presente:
- AI prompts (todos os conselheiros, modos de chat)
- Engine internos (copy, social, ads, funnel)
- Labels da sidebar (parcial)
- Welcome page ("Consultar o Conselho")
- Funnels export
- Campaign pages
- Botão "Começar Briefing" textos internos

---

## 14. RESUMO POR PRIORIDADE {#14-resumo}

### P0 — BLOQUEANTES PARA QUALQUER QA/LAUNCH

| # | Item | Esforço estimado |
|---|------|-----------------|
| 1 | **Aplicar identidade visual** (Gold + Satoshi + tokens) ao app inteiro | 20-30h |
| 2 | **Portar landing page do skeleton** para Next.js na rota correta | 15-20h |
| 3 | **Reestruturar rotas** `(public)` vs `(app)` corretamente | 4-6h |
| 4 | **Reescrever tela de login/signup** com nova identidade | 6-8h |
| 5 | **Completar rename** — reduzir 194 → 0 refs "Conselho" | 4-6h |

### P1 — NECESSÁRIOS PARA PRODUTO FUNCIONAL

| # | Item | Esforço estimado |
|---|------|-----------------|
| 6 | Brand Config GAPs — conectar temp/topP/tipografia/personalidade | 8-12h |
| 7 | Brand Hub — eliminar duplicação, cascade delete | 6-8h |
| 8 | Settings — persistir branding, decidir tab Negócio | 4-6h |
| 9 | Onboarding Fase 1B (4 steps opcionais no checklist) | 8-10h |
| 10 | Empty states guiados em todas as páginas | 6-8h |
| 11 | Welcome → Onboarding wizard desconectado (vai para /brands/new em vez do modal) | 2-3h |
| 12 | Sequência de emails completa (8 emails, 14 dias) | 6-8h |
| 13 | NFS-e ou decisão de não implementar | 4-8h ou 0h |

### P2 — NECESSÁRIOS PÓS-LAUNCH

| # | Item | Esforço estimado |
|---|------|-----------------|
| 14 | Social v2 (6 fases) | 60-80h |
| 15 | Automation v2 (4 fases restantes) | 40-50h |
| 16 | Calendar v2 (4 fases restantes) | 30-40h |
| 17 | Assets v2 (4 fases restantes) | 30-40h |
| 18 | Vault v2 (4-5 fases) | 30-40h |
| 19 | Brand Hub v2 fases 3-5 | 30-40h |
| 20 | Settings v2 fases 2-4 | 20-30h |
| 21 | Production hardening (security, Lighthouse, Sentry) | 15-20h |
| 22 | Tour interativo (react-joyride ou shepherd.js) | 8-12h |
| 23 | Tema Dark/Light toggle | 8-12h |
| 24 | 2FA/MFA | 8-10h |
| 25 | API Keys Management | 6-8h |

### TOTAIS

| Prioridade | Horas estimadas |
|------------|----------------|
| **P0** (bloqueantes) | **49-70h** |
| **P1** (produto funcional) | **44-63h** |
| **P2** (pós-launch) | **295-382h** |
| **TOTAL GERAL** | **~388-515h** |

---

## NOTAS IMPORTANTES

1. **Nada da identidade visual (honey/gold, Satoshi, brutalista-premium) foi aplicada ao app.** Toda a documentação existe, os tokens estão definidos, o skeleton está pronto — mas nenhuma linha de CSS/componente foi atualizada.

2. **A landing page atual é descartável.** O skeleton em `_netecmt/docs/landpage/mkthoney-landing-page-skeleton/` é significativamente mais completo e alinhado com a visão do produto.

3. **O UX Journey (6 fases) foi ~40% implementado.** Fases 1A, 2, e 3 estão funcionais. Fases 0 (landing real), 1B (steps opcionais), e 5 (email sequence completa) não.

4. **Os 8 roadmaps de features estão entre 0% e 33% executados.** A maioria depende de OAuth (Sprint L) que é um bloqueio externo (Meta App Review).

5. **O fluxo Welcome → Onboarding está quebrado.** "Criar sua marca" no Welcome navega para `/brands/new` (wizard completo antigo), não para o onboarding modal de 3 steps.
