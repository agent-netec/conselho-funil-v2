# PROMPT — SPRINT UI: Migração Visual Emerald → Honey Gold

> Cole este prompt inteiro no agente que vai executar a tarefa.
> Ele contém TODO o contexto necessário para trabalhar de forma autônoma.

---

## CONTEXTO DO PROJETO

**Produto:** MKTHONEY — plataforma SaaS de marketing autônomo com 23 conselheiros de IA.
**Stack:** Next.js 16.1.1, React 19, TypeScript, Tailwind CSS v4, Firebase, Pinecone, Gemini AI.
**Diretório do app:** `app/` (é o root do Next.js — todos os comandos de build rodam de lá: `cd app && npm run build`)
**Modo de tema:** Dark-only. Sem light mode. A classe `dark` está fixa no `<html>`.
**Fonte atual:** Geist Sans + Geist Mono (via next/font). MANTER — NÃO trocar para Satoshi.

O app inteiro usa uma paleta **emerald/verde (#10B981, hsl 160 84% 45%)** que precisa ser migrada para **Honey Gold (#E6B447, hsl 43 78% 59%)**. São **893 referências a "emerald"** espalhadas em **155 arquivos**.

---

## O QUE ESTE SPRINT FAZ

Migrar TODO o visual do app de emerald → honey gold em 3 blocos sequenciais:

```
BLOCO 1 — BASE (T1 + T2): Design tokens + globals.css
BLOCO 2 — SHELL (E1 + E6): Sidebar + Header + Layout público
BLOCO 3 — TELAS CORE (E2-E5 + E7): Login, Welcome, Dashboard, Landing, Empty States
```

**REGRA:** Cada bloco deve passar no build (`cd app && npm run build`) antes de avançar ao próximo.

---

## DESIGN SYSTEM APROVADO (D0)

### Paleta de Cores

#### Accent / CTA
| Token | Hex | HSL | Uso |
|-------|-----|-----|-----|
| `--gold-primary` | `#E6B447` | `43 78% 59%` | CTAs, links, ícones ativos, chart accent |
| `--gold-hover` | `#F0C35C` | `43 82% 66%` | Hover states |
| `--gold-muted` | `#AB8648` | `36 28% 47%` | Labels, captions |
| `--bronze` | `#895F29` | `30 54% 35%` | Borders decorativas |
| `--chocolate` | `#593519` | `24 55% 22%` | Backgrounds sutis |

#### Superfícies
| Token | Hex | HSL | Uso |
|-------|-----|-----|-----|
| `--bg` | `#0D0B09` | `30 18% 4%` | Fundo principal |
| `--surface-1` | `#1A1612` | `30 18% 8%` | Cards, sidebar |
| `--surface-2` | `#241F19` | `30 16% 12%` | Hover, inputs |
| `--surface-3` | `#2E2820` | `30 14% 15%` | Elementos destacados |

#### Texto
| Token | Hex | HSL | Uso |
|-------|-----|-----|-----|
| `--text-primary` | `#F5E8CE` | `36 50% 89%` | Títulos, corpo (cream) |
| `--text-secondary` | `#CAB792` | `38 26% 67%` | Subtextos (sand) |
| `--text-muted` | `#AB8648` | `36 28% 47%` | Placeholders (honey) |
| `--text-disabled` | `#6B5D4A` | `30 18% 35%` | Desabilitados |

#### Bordas
| Token | Hex | Uso |
|-------|-----|-----|
| `--border-subtle` | `rgba(137,95,41,0.08)` | Divisores sutis |
| `--border-default` | `rgba(137,95,41,0.12)` | Bordas de cards |
| `--border-strong` | `#895F29` | Bordas de destaque |

#### Status
| Token | Hex | Uso |
|-------|-----|-----|
| `--success` | `#7A9B5A` | Olive green (warm) |
| `--warning` | `#E6B447` | Gold (contexto diferencia) |
| `--error` | `#C45B3A` | Terracotta |
| `--info` | `#5B8EC4` | Steel blue |

#### Glow Effects
| Token | Value | Uso |
|-------|-------|-----|
| `--glow` | `rgba(230, 180, 71, 0.15)` | Glow sutil em charts, KPIs |
| `--glow-strong` | `rgba(230, 180, 71, 0.30)` | Glow em CTAs hover |

### Fonte
- **Body/UI:** Geist Sans (já instalado via `next/font`, variável `--font-geist-sans`)
- **Código/Números:** Geist Mono (já instalado, variável `--font-geist-mono`)
- **NÃO instalar Satoshi.** Manter Geist.
- **`--font-sans` deve apontar para `var(--font-geist-sans)` — já está correto, NÃO mudar.**

### Escala Tipográfica
- Display (H1): 42-48px / Bold / -0.02em
- H2: 30-36px / Bold / -0.01em
- H3: 24px / SemiBold
- Body: 16px / Regular / 1.6 line-height
- Small: 14px / Regular
- Caption: 12px / Medium
- KPI numbers: 36-48px / Geist Mono Bold / tabular-nums

---

## BLOCO 1 — BASE (Design Tokens + Globals)

### 1.1 — Reescrever `app/src/styles/design-tokens.css`

Substituir TODOS os valores emerald pelos valores honey gold acima. Tabela de substituição:

| Token | Valor ATUAL | Valor NOVO |
|-------|------------|-----------|
| `--accent` | `160 84% 45%` | `43 78% 59%` |
| `--accent-glow` | `160 84% 45% / 0.15` | `43 78% 59% / 0.15` |
| `--surface-0` | `240 10% 3.5%` | `30 18% 4%` |
| `--surface-1` | `240 6% 6%` | `30 18% 8%` |
| `--surface-2` | `240 5% 9%` | `30 16% 12%` |
| `--surface-3` | `240 5% 12%` | `30 14% 15%` |
| `--text-primary` | `0 0% 98%` | `36 50% 89%` |
| `--text-secondary` | `240 5% 64%` | `38 26% 67%` |
| `--text-tertiary` | `240 5% 45%` | `36 28% 47%` |
| `--text-muted` | `240 5% 35%` | `30 18% 35%` |
| `--border-subtle` | `240 4% 14%` | `30 20% 13%` |
| `--border-default` | `240 4% 18%` | `30 18% 17%` |
| `--border-strong` | `240 4% 24%` | `30 54% 35%` |
| `--success` | `160 84% 39%` | `100 26% 48%` |
| `--error` | `0 72% 51%` | `14 56% 50%` |
| `--info` | `200 98% 39%` | `210 42% 56%` |
| `--gradient-accent` | `hsl(160,84%,39%)→hsl(170,77%,31%)` | `hsl(43,78%,59%)→hsl(30,54%,35%)` |
| `--gradient-glow` | `hsla(160,84%,39%,0.15)` | `hsla(43,78%,59%,0.15)` |
| `--shadow-glow` | `hsla(160,84%,39%,0.3)` | `hsla(43,78%,59%,0.3)` |

Nas classes utilitárias (`.glow-accent`, `.glow-border::after`): trocar `hsla(160,84%,39%,...)` → `hsla(43,78%,59%,...)`.

Na classe `.glass`: trocar `hsla(240, 5%, 8%, 0.8)` → `hsla(30, 18%, 6%, 0.8)`.

Na `.bg-grid`: trocar `hsla(240, 5%, 20%, 0.03)` → `hsla(30, 18%, 20%, 0.03)`.

### 1.2 — Reescrever `app/src/app/globals.css`

**Seção `.dark { ... }`** — trocar todos os valores emerald:

| Propriedade | De | Para |
|------------|-----|------|
| `--primary` | `hsl(160, 84%, 45%)` | `hsl(43, 78%, 59%)` |
| `--primary-foreground` | `#022c22` | `#0D0B09` |
| `--ring` | `hsl(160, 84%, 45%)` | `hsl(43, 78%, 59%)` |
| `--chart-1` | `hsl(160, 84%, 45%)` | `hsl(43, 78%, 59%)` |
| `--sidebar-primary` | `hsl(160, 84%, 45%)` | `hsl(43, 78%, 59%)` |
| `--sidebar-ring` | `hsl(160, 84%, 45%)` | `hsl(43, 78%, 59%)` |
| `--destructive` | `#ef4444` | `#C45B3A` |

**Seção `@theme inline`** — trocar:
| De | Para |
|-----|------|
| `--color-emerald: 160 84% 45%` | `--color-gold: 43 78% 59%` |

**Seção `@layer base`** — trocar:
| De | Para |
|-----|------|
| `outline-emerald-500/50` | `outline-[#E6B447]/50` |
| `bg-emerald-500/20 text-emerald-50` | `bg-[#E6B447]/20 text-[#F5E8CE]` |

**Seção `@layer components`** — trocar TODAS as classes:

| Classe | De | Para |
|--------|-----|------|
| `.card-premium::before` | `rgba(16, 185, 129, 0.05)` | `rgba(230, 180, 71, 0.05)` |
| `.sidebar-icon-active` | `emerald-500/10`, `emerald-400`, `emerald-500/20`, `rgba(16,185,129,0.2)` | `[#E6B447]/10`, `[#E6B447]`, `[#E6B447]/20`, `rgba(230,180,71,0.2)` |
| `.card-hover:hover` | `rgba(16, 185, 129, 0.12)` | `rgba(230, 180, 71, 0.12)` |
| `.btn-accent` | `emerald-600`, `emerald-500`, `emerald-700` | `[#E6B447]`, `[#F0C35C]`, `[#AB8648]` |
| `.btn-accent:hover` | `rgba(16, 185, 129, 0.4)` | `rgba(230, 180, 71, 0.4)` |
| `.input-premium` | `emerald-500/50`, `emerald-500/20` | `[#E6B447]/50`, `[#E6B447]/20` |
| `.badge-success` | `emerald-500/10 text-emerald-400 border-emerald-500/20` | `[#7A9B5A]/10 text-[#7A9B5A] border-[#7A9B5A]/20` |
| `.glow-dot` | `bg-emerald-500` | `bg-[#E6B447]` |
| `.glow-dot::after` | `bg-emerald-500` | `bg-[#E6B447]` |
| `.card-hover:hover` | `bg-zinc-900/50` | `bg-[#1A1612]/50` |

**Adicionar ao final (novas classes tipográficas):**

```css
/* Typography scale — MKTHONEY Design System */
.text-display {
  font-weight: 700;
  font-size: clamp(2.5rem, 5vw + 1rem, 3rem);
  letter-spacing: -0.02em;
  line-height: 1.05;
}
.text-heading {
  font-weight: 700;
  font-size: clamp(1.75rem, 3vw + 0.5rem, 2.25rem);
  letter-spacing: -0.01em;
  line-height: 1.15;
}
.text-subheading {
  font-weight: 600;
  font-size: clamp(1.25rem, 2vw + 0.25rem, 1.5rem);
  line-height: 1.3;
}
.text-body-lg {
  font-weight: 400;
  font-size: clamp(1rem, 1vw + 0.25rem, 1.125rem);
  line-height: 1.7;
}
.text-overline {
  font-weight: 500;
  font-size: clamp(0.7rem, 0.5vw + 0.25rem, 0.8rem);
  letter-spacing: 0.15em;
  text-transform: uppercase;
}
```

### 1.3 — Layout (NÃO precisa mudar)

O arquivo `app/src/app/layout.tsx` já usa Geist Sans/Mono via `next/font`. **NÃO instalar Satoshi. NÃO mudar `--font-sans`.**

### 1.4 — Tailwind Config

Não existe `tailwind.config.ts`. O Tailwind v4 usa `@theme inline` no globals.css. As cores customizadas já estão lá — só precisam ser atualizadas conforme acima.

### Verificação Bloco 1

```bash
cd app && npm run build
# Depois verificar:
grep -rn "emerald" src/app/globals.css src/styles/design-tokens.css
# Deve retornar ZERO resultados
grep -rn "160, 84%" src/app/globals.css src/styles/design-tokens.css
# Deve retornar ZERO resultados
grep -rn "16, 185, 129" src/app/globals.css src/styles/design-tokens.css
# Deve retornar ZERO resultados
```

---

## BLOCO 2 — SHELL (Sidebar + Header + Layout Público)

### 2.1 — Sidebar: `app/src/components/layout/sidebar.tsx`

- Trocar TODAS as referências `emerald` → honey gold equivalente
- Padrão de substituição em componentes:
  - `emerald-500` → `[#E6B447]`
  - `emerald-400` → `[#E6B447]`
  - `emerald-600` → `[#AB8648]`
  - `emerald-500/10` → `[#E6B447]/10`
  - `emerald-500/20` → `[#E6B447]/20`
  - `text-emerald-400` → `text-[#E6B447]`
  - `bg-emerald-500` → `bg-[#E6B447]`
  - `border-emerald-500` → `border-[#E6B447]`
  - `hover:text-emerald-400` → `hover:text-[#F0C35C]`
  - `hover:bg-emerald-500` → `hover:bg-[#E6B447]`
  - `rgba(16, 185, 129, X)` → `rgba(230, 180, 71, X)`
  - `#10B981` ou `#10b981` → `#E6B447`
- Aplicar logo: copiar `_netecmt/docs/landpage/mkthoney-landing-page-skeleton/public/logo-mkthoney-icon.svg` para `app/public/logo-mkthoney-icon.svg` e usá-lo na sidebar.

### 2.2 — App Shell: `app/src/components/layout/app-shell.tsx`

- Mesma lógica de substituição emerald → gold
- LoadingScreen: trocar qualquer cor emerald

### 2.3 — Layout Público: `app/src/app/(public)/layout.tsx`

Substituições específicas:
| De | Para |
|-----|------|
| `bg-zinc-950` | `bg-[#0D0B09]` |
| `bg-zinc-900/80` | `bg-[#1A1612]/80` |
| `bg-emerald-500/10` | `bg-[#E6B447]/10` |
| `text-emerald-400` | `text-[#E6B447]` |
| `hover:text-emerald-400` | `hover:text-[#F0C35C]` |
| `bg-zinc-900/50` | `bg-[#1A1612]/50` |

### 2.4 — Páginas legais (terms, privacy, cookies, refund)

Mesma lógica — trocar todas as `emerald` refs nos 4 arquivos em `app/src/app/(public)/`.

### Verificação Bloco 2

```bash
cd app && npm run build
grep -rn "emerald" src/components/layout/ src/app/\(public\)/
# Deve retornar ZERO
```

---

## BLOCO 3 — TELAS CORE

### Padrão de substituição global para TODOS os 155 arquivos com emerald

Use busca e substituição nos arquivos `.tsx`, `.ts`, `.css`:

```
REGRAS DE SUBSTITUIÇÃO (aplicar nesta ordem):

# Tailwind classes
emerald-50   → [#F5E8CE]
emerald-100  → [#F0C35C]/20
emerald-200  → [#E6B447]/30
emerald-300  → [#E6B447]/60
emerald-400  → [#E6B447]
emerald-500  → [#E6B447]
emerald-600  → [#AB8648]
emerald-700  → [#895F29]
emerald-800  → [#593519]
emerald-900  → [#1A1612]

# RGB values
rgb(16, 185, 129)    → rgb(230, 180, 71)
rgba(16, 185, 129,   → rgba(230, 180, 71,
rgba(16,185,129,     → rgba(230,180,71,

# Hex values
#10B981 → #E6B447
#10b981 → #E6B447
#059669 → #AB8648
#047857 → #895F29
#022c22 → #0D0B09
#065f46 → #593519
#d1fae5 → #F5E8CE
#6ee7b7 → #F0C35C
#34d399 → #E6B447
#a7f3d0 → #F0C35C

# HSL values
hsl(160, 84%, 45%)   → hsl(43, 78%, 59%)
hsl(160, 84%, 39%)   → hsl(43, 78%, 50%)
hsla(160, 84%, 39%,  → hsla(43, 78%, 59%,
hsla(160, 84%, 45%,  → hsla(43, 78%, 59%,
160 84% 45%          → 43 78% 59%
160 84% 39%          → 43 78% 50%
```

### 3.1 — Login/Signup: `app/src/components/ui/modern-animated-sign-in.tsx`

Além da substituição emerald → gold:
- Os textos em inglês ("Login with Google", "or") devem ser traduzidos para PT-BR
- Os ícones de dev (HTML5, CSS3, Figma, Git) no `TechOrbitDisplay` devem ser trocados por ícones de marketing: Target, BarChart3, Megaphone, Users, TrendingUp, Zap (do Lucide)

### 3.2 — Welcome: `app/src/app/welcome/page.tsx`

Além da substituição emerald → gold:
- BUG: O botão "Criar sua marca" navega para `/brands/new` (form antigo). Trocar para abrir o onboarding modal ou navegar para `/` com query param que trigga o modal.

### 3.3 — Onboarding Modal: `app/src/components/onboarding/onboarding-modal.tsx` e steps

Substituição emerald → gold nos 6 arquivos:
- `onboarding-modal.tsx`
- `onboarding-progress.tsx`
- `onboarding-step-identity.tsx`
- `onboarding-step-audience.tsx`
- `onboarding-step-offer.tsx`
- `onboarding-transition.tsx`

### 3.4 — Dashboard: `app/src/app/page.tsx` e componentes em `app/src/components/dashboard/`

Substituição emerald → gold nos arquivos:
- `app/src/app/page.tsx`
- `app/src/components/dashboard/brand-progress.tsx`
- `app/src/components/dashboard/dashboard-hero.tsx`
- `app/src/components/dashboard/quick-actions.tsx`
- `app/src/components/dashboard/recent-activity.tsx`
- `app/src/components/dashboard/stats-cards.tsx`
- `app/src/components/dashboard/verdict-summary.tsx`

### 3.5 — TODOS os outros 155 arquivos

Aplique a tabela de substituição global em TODOS os arquivos restantes. A lista completa de arquivos com `emerald`:

```
src/app/(agency)/dashboard/page.tsx
src/app/(public)/cookies/page.tsx
src/app/(public)/privacy/page.tsx
src/app/(public)/refund/page.tsx
src/app/(public)/terms/page.tsx
src/app/assets/page.tsx
src/app/automation/page.tsx
src/app/brand-hub/page.tsx
src/app/brands/[id]/assets/page.tsx
src/app/brands/[id]/edit/page.tsx
src/app/brands/[id]/page.tsx
src/app/brands/new/page.tsx
src/app/brands/page.tsx
src/app/campaigns/[id]/page.tsx
src/app/campaigns/page.tsx
src/app/chat/page.tsx
src/app/content/calendar/page.tsx
src/app/funnels/[id]/copy/page.tsx
src/app/funnels/[id]/design/page.tsx
src/app/funnels/[id]/page.tsx
src/app/funnels/[id]/proposals/[proposalId]/page.tsx
src/app/funnels/new/page.tsx
src/app/funnels/page.tsx
src/app/integrations/page.tsx
src/app/intelligence/attribution/page.tsx
src/app/intelligence/creative/page.tsx
src/app/intelligence/journey/page.tsx
src/app/intelligence/ltv/page.tsx
src/app/intelligence/predictive/page.tsx
src/app/intelligence/research/page.tsx
src/app/library/page.tsx
src/app/page.tsx
src/app/performance/cross-channel/page.tsx
src/app/performance/page.tsx
src/app/settings/billing/page.tsx
src/app/settings/integrations/payments/page.tsx
src/app/settings/page.tsx
src/app/settings/tracking/page.tsx
src/app/shared/[token]/page.tsx
src/app/shared/reports/[token]/page.tsx
src/app/strategy/autopsy/page.tsx
src/app/vault/page.tsx
src/app/welcome/page.tsx
src/components/agency/ClientPerformanceCard.tsx
src/components/analytics/funnel-analytics.tsx
src/components/assets/asset-detail-modal.tsx
src/components/assets/metrics-summary.tsx
src/components/assets/metrics-table.tsx
src/components/automation/ControlCenter.tsx
src/components/automation/CopyRefactorWizard.tsx
src/components/brand-config/ai-config-modal.tsx
src/components/brand-config/logo-upload-modal.tsx
src/components/brand-config/rag-assets-modal.tsx
src/components/brand-config/visual-identity-modal.tsx
src/components/brands/asset-uploader.tsx
src/components/brands/brand-card.tsx
src/components/brands/brand-completeness.tsx
src/components/brands/brand-kit-form.tsx
src/components/brands/brand-selector.tsx
src/components/brands/new-project-modal.tsx
src/components/brands/project-list.tsx
src/components/brands/strategic-context.tsx
src/components/brands/voice-profile-editor.tsx
src/components/brands/wizard/step-ai-config.tsx
src/components/brands/wizard/step-audience.tsx
src/components/brands/wizard/step-confirm.tsx
src/components/brands/wizard/step-identity.tsx
src/components/brands/wizard/step-logo.tsx
src/components/brands/wizard/step-offer.tsx
src/components/brands/wizard/step-visual-identity.tsx
src/components/brands/wizard/wizard-progress.tsx
src/components/campaigns/campaign-stepper.tsx
src/components/campaigns/monitoring-dashboard.tsx
src/components/campaigns/stage-card.tsx
src/components/chat/active-context-indicator.tsx
src/components/chat/ads-strategy-card.tsx
src/components/chat/chat-empty-state.tsx
src/components/chat/chat-input-area.tsx
src/components/chat/chat-message-bubble.tsx
src/components/chat/chat-message-list.tsx
src/components/chat/chat-message.tsx
src/components/chat/chat-mode-selector.tsx
src/components/chat/chat-sidebar.tsx
src/components/chat/counselor-badges.tsx
src/components/chat/counselor-multi-selector.tsx
src/components/chat/design-generation-card.tsx
src/components/chat/party-mode/counselor-selector.tsx
src/components/chat/verdict-card.tsx
src/components/content/calendar-view.tsx
src/components/content/review-card.tsx
src/components/content/status-badge.tsx
src/components/context/context-indicator.tsx
src/components/context/scope-selector.tsx
src/components/copy/copy-scorecard.tsx
src/components/council/asset-preview.tsx
src/components/creative/copy-lab-modal.tsx
src/components/creative/creative-card.tsx
src/components/dashboard/brand-progress.tsx
src/components/dashboard/dashboard-hero.tsx
src/components/dashboard/quick-actions.tsx
src/components/dashboard/recent-activity.tsx
src/components/dashboard/stats-cards.tsx
src/components/dashboard/verdict-summary.tsx
src/components/decisions/decision-timeline.tsx
src/components/funnel-autopsy/AutopsyReportView.tsx
src/components/funnels/export-dialog.tsx
src/components/funnels/share-dialog.tsx
src/components/funnels/wizard/step-audience.tsx
src/components/funnels/wizard/step-channels.tsx
src/components/funnels/wizard/step-objective.tsx
src/components/funnels/wizard/wizard-progress.tsx
src/components/intelligence/ab-test-card.tsx
src/components/intelligence/ab-test-results.tsx
src/components/intelligence/ad-preview/brand-voice-badge.tsx
src/components/intelligence/ad-preview/google-search-card.tsx
src/components/intelligence/ad-preview/meta-feed-card.tsx
src/components/intelligence/ad-preview/meta-stories-card.tsx
src/components/intelligence/discovery/assets-panel.tsx
src/components/intelligence/discovery/spy-agent.tsx
src/components/intelligence/journey/LeadTimeline.tsx
src/components/intelligence/ltv/CohortDashboard.tsx
src/components/intelligence/predictor/benchmark-card.tsx
src/components/intelligence/predictor/cps-gauge.tsx
src/components/intelligence/predictor/dimension-bars.tsx
src/components/intelligence/predictor/grade-badge.tsx
src/components/intelligence/predictor/prediction-panel.tsx
src/components/intelligence/research/research-form.tsx
src/components/intelligence/sources-tab.tsx
src/components/layout/app-shell.tsx
src/components/layout/footer.tsx
src/components/layout/onboarding-checklist.tsx
src/components/layout/sidebar.tsx
src/components/layout/user-usage-widget.tsx
src/components/legal/cookie-banner.tsx
src/components/modals/paywall-modal.tsx
src/components/onboarding/onboarding-modal.tsx
src/components/onboarding/onboarding-progress.tsx
src/components/onboarding/onboarding-step-audience.tsx
src/components/onboarding/onboarding-step-identity.tsx
src/components/onboarding/onboarding-step-offer.tsx
src/components/onboarding/onboarding-transition.tsx
src/components/performance/alert-center.tsx
src/components/performance/automation-control-center.tsx
src/components/performance/budget-pacing-widget.tsx
src/components/performance/cross-channel/UnifiedDashboard.tsx
src/components/performance/war-room-dashboard.tsx
src/components/proposals/version-history.tsx
src/components/providers/branding-provider.tsx
src/components/social/debate-viewer.tsx
src/components/social/hook-generator.tsx
src/components/social/profile-analyzer.tsx
src/components/social/scorecard-viewer.tsx
src/components/social/social-wizard.tsx
src/components/ui/coming-soon-guard.tsx
src/components/ui/guided-empty-state.tsx
src/components/ui/modern-animated-sign-in.tsx
src/components/ui/progress.tsx
src/components/ui/toast-notifications.tsx
src/components/vault/approval-workspace.tsx
src/components/vault/dna-wizard.tsx
src/components/vault/vault-explorer.tsx
src/lib/constants.ts
```

### 3.6 — Empty State component

Criar `app/src/components/ui/empty-state.tsx` se não existir (verificar `guided-empty-state.tsx` primeiro — pode já ter uma versão). Garantir que usa cores gold:
- Ícone: `text-[#E6B447]/40`
- Título: `text-[#F5E8CE]`
- Descrição: `text-[#CAB792]`
- Botão CTA: `bg-[#E6B447] hover:bg-[#F0C35C] text-[#0D0B09]`

### Verificação Bloco 3

```bash
cd app && npm run build
grep -rn "emerald" src/ --include="*.tsx" --include="*.ts" --include="*.css" | grep -v node_modules | grep -v ".next" | wc -l
# DEVE retornar ZERO (0)
grep -rn "10B981\|10b981" src/ --include="*.tsx" --include="*.ts" --include="*.css" | grep -v node_modules | grep -v ".next" | wc -l
# DEVE retornar ZERO (0)
grep -rn "16, 185, 129\|16,185,129" src/ --include="*.tsx" --include="*.ts" --include="*.css" | grep -v node_modules | grep -v ".next" | wc -l
# DEVE retornar ZERO (0)
```

---

## REGRAS CRÍTICAS

1. **NÃO alterar lógica de negócio** — apenas cores, classes CSS e visual
2. **NÃO alterar lógica de RAG, credits ou persistência**
3. **NÃO instalar dependências** sem informar
4. **NÃO alterar .env ou arquivos de secrets**
5. **NÃO trocar a fonte** — manter Geist Sans + Geist Mono
6. **NÃO remover o `--font-sans: var(--font-geist-sans)`** do globals.css
7. **Build deve passar** após cada bloco: `cd app && npm run build`
8. **Código em inglês**, comunicação em português BR
9. **Cada bloco = 1 commit** com conventional commits em inglês:
   - Bloco 1: `feat: migrate design tokens and globals from emerald to honey gold`
   - Bloco 2: `feat: migrate app shell, sidebar, header and public layout to honey gold`
   - Bloco 3: `feat: migrate all 155 component files from emerald to honey gold palette`
10. **`ignoreBuildErrors: true`** está no next.config.ts — erros de TS não bloqueiam build, mas NÃO introduza erros novos

---

## REFERÊNCIAS VISUAIS

As telas de referência de design estão em:
```
_netecmt/docs/design/screens/
├── entry-flow/         → welcome.png, onboarding-modal.png
├── core-loop/          → dashboard-pre-briefing.png
├── second-loop/        → funnels-pipeline.png, funnel-detail.png, offer-lab-wizard.png, offer-lab-result.png
├── expansion/          → (pendente)
└── landing-page/       → full-page.png, hero.png, arsenal.png, pricing.png
```

A landing page tem um projeto Vite separado funcionando em `_netecmt/docs/design/mkthoney/` — pode ser usado como referência visual mas NÃO deve ser portado neste sprint (fica para E5 depois).

---

## RESULTADO ESPERADO

Ao final deste sprint:
- **ZERO** referências a `emerald` em todo o codebase `app/src/`
- **ZERO** referências a `#10B981`, `rgb(16,185,129)`, `hsl(160,84%,45%)`
- App inteiro em paleta Honey Gold dark-only
- Build passando: `cd app && npm run build`
- 3 commits limpos no git
