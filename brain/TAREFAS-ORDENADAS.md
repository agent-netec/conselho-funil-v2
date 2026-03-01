# MKTHONEY — Tarefas Ordenadas por Dependência

> Gerado: 2026-02-27 | Atualizado: 2026-02-28
> Regra: Nenhuma tarefa pode ser marcada como "feita" sem que TODOS os itens do checklist estejam OK.
> **NOTA:** A identidade visual (paleta, fonte, estética) NÃO está decidida — foi apenas explorada como teste.
> Antes de qualquer implementação visual, a D0 (Design System Discovery) precisa ser aprovada.

---

## FASES

```
═══════════════════════════════════════════════════════════════
 FASE 0 — DISCOVERY: DESIGN SYSTEM (decidir primeiro)
 A identidade visual não está fechada. Decidir ANTES de tudo.
═══════════════════════════════════════════════════════════════

 D0 (Discovery: Design System — paleta, fonte, estética)
      ↓ bloqueia T1/T2 e toda Fase 3

═══════════════════════════════════════════════════════════════
 FASE 1 — FOUNDATION (executar após D0)
 Tudo que NÃO depende de telas serem refeitas
═══════════════════════════════════════════════════════════════

 T1 (Design Tokens + Fonte) ← depende de D0
  └──→ T2 (Globals.css + Tailwind Config)

 T3 (Reestruturar rotas public/app) ← independente de D0
 T4 (Rename "Conselho" → "MKTHONEY") ← independente de D0
 T5 (Brand Config GAPs) ← independente de D0
 T6 (Email sequence 14 dias) ← independente de D0

═══════════════════════════════════════════════════════════════
 FASE 2 — FRONTEND DISCOVERY (definir antes de executar)
 As telas serão refeitas. Primeiro: decidir o quê e como.
═══════════════════════════════════════════════════════════════

 D1 (Discovery: Login/Signup — como deve ficar?)
 D2 (Discovery: Welcome + Onboarding — fluxo correto?)
 D3 (Discovery: Dashboard — layout dos 3 estados)
 D4 (Discovery: Sidebar + Header — visual final)
 D5 (Discovery: Landing Page — portar skeleton ou refazer?)

═══════════════════════════════════════════════════════════════
 FASE 3 — FRONTEND EXECUÇÃO (após aprovação de D0 + Fase 2)
 Depende de T1, T2, T3 + aprovação das discoveries
═══════════════════════════════════════════════════════════════

 E1 (Executar: App Shell + Sidebar + Header)
 E2 (Executar: Login/Signup)
 E3 (Executar: Welcome + Onboarding)
 E4 (Executar: Dashboard)
 E5 (Executar: Landing Page)
 E6 (Executar: Public layout legal pages)
 E7 (Executar: Empty states)
```

**Ordem de execução:**
1. **Fase 0: D0** (Design System Discovery — decidir paleta, fonte, estética)
2. Fase 1: T1 → T2 (depende de D0) + T3/T4/T5/T6 (paralelo, independente de D0)
3. Fase 2: D1-D5 (discovery de cada tela — pode rodar em paralelo com Fase 1)
4. Fase 3: E1-E7 (execução — só após D0 + T1/T2 + discoveries aprovadas)

---

# ═══════════════════════════════════════════════════════════════
# FASE 0 — DESIGN SYSTEM DISCOVERY ✅ CONCLUÍDO (2026-02-28)
# ═══════════════════════════════════════════════════════════════

## D0 — DISCOVERY: DESIGN SYSTEM ✅

**Status:** APROVADO em 2026-02-28
**Referências visuais usadas:** 3 screenshots de dashboards (gold data dashboard, blue command center, dark mode chat app)

### Entregável — TODAS AS DECISÕES APROVADAS

- [x] Paleta de cores (Honey Gold, dark-only)
- [x] Fonte (Geist Sans + Geist Mono — manter atual)
- [x] Direção estética (War Room data-dense + Clean dark utility)
- [x] Texturas/efeitos (Gold glow + noise sutil, sem heavy effects)
- [x] Logo (logo-mkthoney.svg do skeleton, subtítulo "AUTONOMOUS MARKETING")

---

### 1. PALETA DE CORES — HONEY GOLD (Dark-Only)

**Modo:** Dark-only. Sem light mode. Sem toggle de tema.

#### Accent / CTA
| Token | Hex | Uso |
|-------|-----|-----|
| `--gold-primary` | `#E6B447` | CTAs, links, ícones ativos, chart accent |
| `--gold-hover` | `#F0C35C` | Hover states em CTAs e links |
| `--gold-muted` | `#AB8648` | Labels, captions, texto muted |
| `--bronze` | `#895F29` | Borders decorativas, dividers |
| `--chocolate` | `#593519` | Backgrounds sutis (NUNCA texto) |

#### Superfícies
| Token | Hex | Uso |
|-------|-----|-----|
| `--bg` | `#0D0B09` | Fundo principal (off-black quente) |
| `--surface-1` | `#1A1612` | Cards, sidebar, popover |
| `--surface-2` | `#241F19` | Hover em cards, inputs, dropdowns |
| `--surface-3` | `#2E2820` | Elementos destacados, selected |

#### Texto
| Token | Hex | Uso |
|-------|-----|-----|
| `--text-primary` | `#F5E8CE` | Títulos, corpo principal (cream) |
| `--text-secondary` | `#CAB792` | Subtextos, labels (sand) |
| `--text-muted` | `#AB8648` | Placeholders, captions (honey) |
| `--text-disabled` | `#6B5D4A` | Elementos desabilitados |

#### Bordas
| Token | Hex | Uso |
|-------|-----|-----|
| `--border-subtle` | `#2A2318` | Divisores sutis entre seções |
| `--border-default` | `#3D3428` | Bordas de cards, inputs |
| `--border-strong` | `#895F29` | Bordas de destaque (bronze) |

#### Status
| Token | Hex | Uso |
|-------|-----|-----|
| `--success` | `#7A9B5A` | Olive green (warm success) |
| `--warning` | `#E6B447` | Gold (contexto diferencia de accent) |
| `--error` | `#C45B3A` | Terracotta |
| `--info` | `#5B8EC4` | Steel blue |

#### Glow Effects
| Token | Value | Uso |
|-------|-------|-----|
| `--glow` | `rgba(230, 180, 71, 0.15)` | Glow sutil em charts, KPIs |
| `--glow-strong` | `rgba(230, 180, 71, 0.30)` | Glow em CTAs hover, ícones ativos |

---

### 2. FONTE — GEIST (Manter Atual)

- **Body/UI:** Geist Sans (variable, next/font built-in)
- **Código/Números:** Geist Mono (tabular-nums para KPIs e dados)
- **Escala tipográfica:**
  - Display (H1): 42-48px / Bold / -0.02em
  - H2: 30-36px / Bold / -0.01em
  - H3: 24px / SemiBold
  - Body: 16px / Regular / 1.6 line-height
  - Small: 14px / Regular
  - Caption: 12px / Medium
  - KPI numbers: 36-48px / Geist Mono Bold / tabular-nums

---

### 3. DIREÇÃO ESTÉTICA

**Dashboard/Dados:** War Room — denso, data-driven, gold glow nos KPIs e charts.
Inspiração: dashboard gold com bento grid, barras em gold gradient, donut charts, mapa com dots.

**Telas Utilitárias (chat, listas, settings):** Clean dark — minimal, funcional, gold só nos pontos de atenção.
Inspiração: dark mode chat app — cards elevados, espaçamento generoso, ícones de contorno fino.

**Landing Page:** Segue Copy V2 — "Brutalista-premium, militar-tático". Alternar entre seções escuras (off-black) e claras (off-white) conforme a estrutura V2.

---

### 4. TEXTURAS E EFEITOS

**INCLUSOS:**
- Gold glow em charts, KPIs e ícones ativos — `box-shadow: 0 0 30px rgba(230,180,71,0.15)`
- Glow border em cards ativos/hover — gradient gold → transparent
- Noise texture no background — `opacity: 0.02-0.03`
- Fade-in em cards (scroll-triggered) — `animation: 0.4s ease-out`
- CountUp em KPIs (números contando) — ex: 0 → 1,812,020 em 1.5s
- Hover glow em botões/CTAs

**EXCLUÍDOS (performance):**
- Particle canvas (heavy, CPU contínuo)
- 3D globe (three.js = +150KB bundle)
- Grid overlay no background
- Animações contínuas/loop infinito
- Glassmorphism pesado (blur > 8px)

---

### 5. LOGO

- **Arquivo:** `_netecmt/docs/landpage/mkthoney-landing-page-skeleton/public/logo-mkthoney.svg`
- **Ícone:** `_netecmt/docs/landpage/mkthoney-landing-page-skeleton/public/logo-mkthoney-icon.svg`
- **Descrição:** Funil com gota de mel na ponta, gradiente gold (#F5D060 → #E6B447 → #C99A30)
- **Subtítulo:** Trocar de "MARKETING AGENCY" para **"AUTONOMOUS MARKETING"**
- **Status:** Provisório para MVP. Pode evoluir quando identidade estiver madura.

---

### O que D0 desbloqueia
- **T1 + T2:** Design tokens + Tailwind config — DESBLOQUEADOS
- **D1-D5:** Discoveries de tela — DESBLOQUEADOS
- **E1-E7:** Execução visual — DESBLOQUEADOS (após D1-D5)

---

# ═══════════════════════════════════════════════════════════════
# FASE 1 — FOUNDATION
# T1/T2 dependem de D0. T3/T4/T5/T6 são independentes.
# ═══════════════════════════════════════════════════════════════

## T1 — DESIGN TOKENS + FONTE (depende de D0)

### Objetivo
Trocar a base visual inteira do app: paleta emerald/zinc → paleta aprovada em D0, fonte Geist → fonte aprovada em D0.

### Pré-requisitos
**D0 aprovado** — os valores abaixo são da proposta original (honey/gold + Satoshi) e devem ser substituídos pelos valores finais aprovados em D0.

### Arquivos a modificar

#### 1.1 — Instalar fonte Satoshi

**Arquivo:** `app/src/app/layout.tsx`

**Ação:** Adicionar import da fonte Satoshi via `next/font/local`. A fonte está disponível no Fontshare CDN ou pode ser baixada como arquivo local.

**Especificação exata:**
```tsx
import localFont from 'next/font/local';

const satoshi = localFont({
  src: [
    { path: '../fonts/Satoshi-Variable.woff2', style: 'normal' },
    { path: '../fonts/Satoshi-VariableItalic.woff2', style: 'italic' },
  ],
  variable: '--font-satoshi',
  display: 'swap',
  weight: '300 900',
});
```

**Ação adicional:** Baixar os arquivos .woff2 do Fontshare e colocar em `app/src/fonts/`.

**No `<html>`:** Adicionar `className={satoshi.variable}` junto com `"dark"`.

**No `<body>`:** Manter `font-sans` (que será remapeado na T2).

#### 1.2 — Reescrever design-tokens.css

**Arquivo:** `app/src/styles/design-tokens.css`

**Trocar TODOS os valores. Tabela completa de substituição:**

| Token | Valor ATUAL (errado) | Valor NOVO (correto) |
|-------|---------------------|---------------------|
| `--accent` | `160 84% 45%` | `43 78% 59%` (Gold #E6B447 em HSL) |
| `--accent-glow` | `160 84% 45% / 0.15` | `43 78% 59% / 0.15` |
| `--surface-0` | `240 10% 3.5%` | `30 18% 4%` (#0D0B09 em HSL) |
| `--surface-1` | `240 6% 6%` | `30 18% 8%` (#1A1612 em HSL) |
| `--surface-2` | `240 5% 9%` | `30 16% 11%` (#241F19 em HSL) |
| `--surface-3` | `240 5% 12%` | `30 14% 14%` |
| `--text-primary` | `0 0% 100%` | `36 50% 89%` (#F5E8CE Cream) |
| `--text-secondary` | `240 5% 65%` | `38 26% 67%` (#CAB792 Sand) |
| `--text-muted` | `240 4% 46%` | `36 28% 47%` (#AB8648 Honey) |
| `--border-subtle` | `0 0% 100% / 0.04` | `36 50% 59% / 0.08` (Bronze-tinted) |
| `--border-default` | `0 0% 100% / 0.08` | `36 50% 59% / 0.12` |
| `--success` | `160 84% 39%` | `100 26% 48%` (#7A9B5A olive green) |
| `--warning` | `38 92% 50%` | `38 92% 50%` (manter — já é amber) |
| `--error` | `0 84% 60%` | `14 56% 50%` (#C45B3A terracotta) |
| `--gradient-accent` | `hsl(160,84%,39%)→hsl(170,77%,31%)` | `hsl(43,78%,59%)→hsl(36,50%,34%)` (gold→bronze) |
| `--gradient-glow` | `hsla(160,84%,39%,0.15)` | `hsla(43,78%,59%,0.15)` |
| `--shadow-glow` | `hsla(160,84%,39%,0.3)` | `hsla(43,78%,59%,0.3)` |

**Classes utilitárias no mesmo arquivo (`.glow-accent`, `.glow-border::after`):** Substituir todos os `hsla(160,84%,39%,...)` por `hsla(43,78%,59%,...)`.

### Checklist de aceitação T1
- [ ] Fonte Satoshi carrega no browser (verificar via DevTools → Elements → Computed → font-family)
- [ ] Todos os 17 tokens acima têm os novos valores
- [ ] Nenhuma referência a `160 84%` (emerald HSL) resta em design-tokens.css
- [ ] Build passa: `cd app && npm run build`

---

## T2 — GLOBALS.CSS + TAILWIND CONFIG (depende de D0)

### Objetivo
Migrar todas as referências emerald em globals.css e configurar Tailwind com as cores aprovadas em D0.

### Pré-requisitos
T1 concluída + D0 aprovado. Os valores abaixo são da proposta original e devem ser substituídos pelos finais de D0.

### Arquivos a modificar

#### 2.1 — globals.css

**Arquivo:** `app/src/app/globals.css`

**Substituições exatas (todas):**

| Linha (aprox.) | De | Para |
|------|-----|------|
| 11 | `--font-sans: var(--font-geist-sans)` | `--font-sans: var(--font-satoshi)` |
| 15 | `--color-emerald: 160 84% 45%` | `--color-gold: 43 78% 59%` |
| 150 | `--primary: hsl(160, 84%, 45%)` | `--primary: hsl(43, 78%, 59%)` |
| 151 | `--primary-foreground: #022c22` | `--primary-foreground: #0D0B09` |
| 161 | `--ring: hsl(160, 84%, 45%)` | `--ring: hsl(43, 78%, 59%)` |
| 162 | `--chart-1: hsl(160, 84%, 45%)` | `--chart-1: hsl(43, 78%, 59%)` |
| 169 | `--sidebar-primary: hsl(160, 84%, 45%)` | `--sidebar-primary: hsl(43, 78%, 59%)` |
| 174 | `--sidebar-ring: hsl(160, 84%, 45%)` | `--sidebar-ring: hsl(43, 78%, 59%)` |

**Classes utilitárias — buscar e substituir em globals.css:**

| Classe | Propriedade | De | Para |
|--------|-----------|-----|------|
| input focus | outline | `emerald-500/50` | `amber-500/50` (ou `[#E6B447]/50`) |
| input selection | bg | `emerald-500/20 text-emerald-50` | `[#E6B447]/20 text-[#F5E8CE]` |
| `.card-premium::before` | gradient | `rgba(16, 185, 129, 0.05)` | `rgba(230, 180, 71, 0.05)` |
| `.sidebar-icon-active` | bg/border/shadow | `emerald-500/10`, `emerald-500/20`, `rgba(16,185,129,0.2)` | `[#E6B447]/10`, `[#E6B447]/20`, `rgba(230,180,71,0.2)` |
| `.card-hover:hover` | box-shadow | `rgba(16, 185, 129, 0.12)` | `rgba(230, 180, 71, 0.12)` |
| `.btn-accent` | bg/hover/active | `emerald-600`, `emerald-500`, `emerald-700` | `[#E6B447]`, `[#F0C35C]`, `[#AB8648]` |
| `.btn-accent:hover` | shadow | `rgba(16, 185, 129, 0.4)` | `rgba(230, 180, 71, 0.4)` |
| `.input-premium` | focus border/ring | `emerald-500/50`, `emerald-500/20` | `[#E6B447]/50`, `[#E6B447]/20` |
| `.badge-success` | all | `emerald-500/10 text-emerald-400 border-emerald-500/20` | `[#7A9B5A]/10 text-[#7A9B5A] border-[#7A9B5A]/20` |
| `.glow-dot` | bg | `emerald-500` | `[#E6B447]` |
| `.glow-dot::after` | bg | `emerald-500` | `[#E6B447]` |

**Criar classes tipográficas (adicionar ao final de globals.css):**

```css
/* Tipografia — escala conforme landpage-mkthoney-structure.md */
.text-display {
  font-weight: 900;
  font-size: clamp(2.5rem, 5vw + 1rem, 5rem);
  letter-spacing: -0.03em;
  line-height: 1.05;
}
.text-heading {
  font-weight: 700;
  font-size: clamp(1.75rem, 3vw + 0.5rem, 3rem);
  letter-spacing: -0.02em;
  line-height: 1.15;
}
.text-subheading {
  font-weight: 500;
  font-size: clamp(1.25rem, 2vw + 0.25rem, 1.75rem);
  line-height: 1.3;
}
.text-body {
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
.text-caption {
  font-size: 0.875rem;
  line-height: 1.4;
}
```

#### 2.2 — Tailwind config

**Arquivo:** `app/tailwind.config.ts`

Verificar se existe um `extend.colors` com emerald. Se sim, trocar para gold. Se usa o default do Tailwind, adicionar:

```ts
colors: {
  gold: {
    50: '#FDF8EC',
    100: '#FAF0D4',
    200: '#F5E1A9',
    300: '#F0C35C',
    400: '#E6B447',
    500: '#E6B447',  // primary
    600: '#AB8648',
    700: '#895F29',
    800: '#593519',
    900: '#1A1612',
  },
}
```

### Checklist de aceitação T2
- [ ] Zero referências a `emerald` em globals.css (usar busca exata)
- [ ] Zero referências a `rgba(16, 185, 129` em globals.css
- [ ] Zero referências a `hsl(160` em globals.css
- [ ] `--font-sans` aponta para `--font-satoshi`
- [ ] Classes `.text-display` a `.text-caption` existem
- [ ] Tailwind config tem cores gold
- [ ] Build passa: `cd app && npm run build`

---

## T3 — REESTRUTURAR ROTAS (PUBLIC) vs (APP)

### Objetivo
Colocar a landing na raiz pública e o dashboard dentro de um route group autenticado. Isso é infraestrutura — não depende de visual.

### Pré-requisitos
Nenhum.

### Arquivos a criar/mover

```
ANTES:
  app/src/app/page.tsx          ← dashboard (raiz)
  app/src/app/landing/page.tsx  ← landing

DEPOIS:
  app/src/app/(app)/page.tsx    ← dashboard (movido)
  app/src/app/(app)/layout.tsx  ← layout com auth guard + sidebar
  app/src/app/page.tsx          ← landing (movida de /landing)
```

**Ações:**
1. Criar pasta `app/src/app/(app)/`
2. Mover `app/src/app/page.tsx` → `app/src/app/(app)/page.tsx`
3. Criar `app/src/app/(app)/layout.tsx` que importa e renderiza o AppShell com sidebar
4. Mover landing de `app/src/app/landing/page.tsx` → `app/src/app/page.tsx` (raiz)
5. Mover TODAS as rotas autenticadas para dentro de `(app)/`: chat, funnels, brands, settings, etc.

**ALTERNATIVA MAIS SIMPLES (menos risco):**
- Manter a estrutura atual
- No middleware, trocar o redirect de `/` para `/landing` por: servir landing na `/` para não-autenticados e dashboard para autenticados
- Isso requer menos movimentação de arquivos

**Arquivo:** `app/src/middleware.ts`

Atualizar a lógica de routing:
- `/` sem auth → mostrar landing (não redirect para `/landing`)
- `/` com auth → mostrar dashboard
- Remover rota `/landing` como rota separada

### Checklist de aceitação T3
- [ ] Visitante não-autenticado em `/` vê a landing page
- [ ] Visitante autenticado em `/` vê o dashboard
- [ ] `/landing` redireciona para `/` (ou deixa de existir)
- [ ] Todas as rotas autenticadas continuam funcionando
- [ ] Links da landing (CTA "Criar Conta", "Entrar") funcionam
- [ ] Build passa

---

## T4 — RENAME "CONSELHO" → "MKTHONEY"

### Objetivo
Eliminar todas as 194 referências restantes a "Conselho" no código visível ao usuário.

### Pré-requisitos
Nenhum (independente).

### Regra de substituição

| De | Para | Contexto |
|-----|------|---------|
| "Conselho de Funil" | "MKTHONEY" | Nome do produto |
| "o Conselho" | "o MKTHONEY" ou "os Conselheiros" | Referência ao sistema de IA |
| "Consultar o Conselho" | "Consultar os Conselheiros" | Botão/link |
| "Alto Conselho" | "MKTHONEY Party" ou "Mesa Completa" | Modo de chat |
| "conselho" (em prompts AI) | Avaliar caso a caso | Os prompts usam "Conselho" como persona interna |

**ATENÇÃO:** Os prompts de IA em `lib/ai/prompts/` usam "Conselho" como parte da identidade dos conselheiros. Avaliar individualmente — pode fazer sentido manter "Conselho" nos prompts internos como conceito, mas trocar em TODAS as superfícies visíveis ao usuário (UI, labels, tooltips, toasts, metadata).

### Como encontrar
```bash
cd app && grep -rn "Conselho\|conselho" src/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v ".next"
```

### Checklist de aceitação T4
- [ ] Zero referências a "Conselho" em superfícies visíveis ao usuário
- [ ] Prompts de IA revisados — "Conselho" mantido apenas onde faz sentido como conceito interno
- [ ] `package.json` name/description atualizado para "mkthoney"
- [ ] `<title>` e metadata atualizados onde aplicável
- [ ] Build passa

---

## T5 — BRAND CONFIG GAPs

### Objetivo
Corrigir os 3 GAPs documentados em `brain/ANALISE-BRAND-CONFIG-USAGE.md`.

### Pré-requisitos
Nenhum (independente).

### Arquivos a modificar

#### 5.1 — GAP-1: Tipografia no Design Generation

**Arquivo:** `app/src/app/api/design/generate/route.ts`

**O que fazer:** Ao montar o prompt para Gemini Vision, injetar `brand.brandKit.typography` (fonte + tamanhos) nas instruções de design. Atualmente o prompt recebe cores e visual style mas ignora tipografia.

#### 5.2 — GAP-2: AI Config no Chat context

**Arquivo:** `app/src/lib/ai/formatters.ts`

**O que fazer:** Na função que formata o contexto de brand para o chat, incluir `brand.aiConfiguration` (personalidade, temperatura, topP) como instrução textual. Exemplo: se personalidade = "Agressivo", adicionar ao system prompt: "Responda de forma direta, assertiva e provocativa."

#### 5.3 — GAP-3: temp/topP em engines faltantes

| Engine | Arquivo | O que fazer |
|--------|---------|------------|
| Design Gen | `app/src/app/api/design/generate/route.ts` | Ler `brand.aiConfiguration.temperature` e `topP`, passar ao `generateContent()` |
| Ad Gen | `app/src/lib/ai/ad-generator.ts` | Idem |
| Copy Gen (topP) | `app/src/lib/ai/copy-gen.ts` | Já lê temperature, adicionar topP |

#### 5.4 — Remover campos mortos

**Arquivo:** `app/src/types/database.ts`

Remover `presencePenalty` e `frequencyPenalty` do tipo `AIConfiguration` — Gemini não suporta.

### Checklist de aceitação T5
- [ ] Design Gen recebe tipografia do brand no prompt
- [ ] Chat recebe personalidade textual (não só números)
- [ ] temp/topP lidos do brand em Design Gen, Ad Gen, e Copy Gen
- [ ] `presencePenalty`/`frequencyPenalty` removidos do tipo
- [ ] Build passa
- [ ] **IMPORTANTE:** NÃO alterar lógica de RAG, credits ou persistência

---

## T6 — SEQUÊNCIA DE EMAILS 14 DIAS

### Objetivo
Implementar a sequência completa de 8 emails durante o trial de 14 dias conforme UX Journey.

### Pré-requisitos
Nenhum (independente, templates Resend já existem).

### Emails a implementar

| Dia | Tipo | Assunto sugerido | Trigger |
|-----|------|-----------------|---------|
| 0 | Boas-vindas | "Bem-vindo ao MKTHONEY — seus 23 conselheiros estão prontos" | Signup |
| 1 | Onboarding | "Complete seu briefing em 3 minutos" | Cron (se !onboardingComplete) |
| 3 | Valor | "Seu primeiro veredito está pronto" | Cron (se verdictReceived) ou nudge |
| 5 | Feature | "Conheça o Offer Lab — teste sua oferta" | Cron |
| 7 | Prova social | "Como marcas como a sua usam o MKTHONEY" | Cron |
| 10 | Urgência suave | "Faltam 4 dias do seu trial PRO" | Cron |
| 12 | Urgência | "Seu trial expira em 2 dias" | Cron |
| 14 | Expiração | "Seu trial PRO expirou — mas você pode voltar" | Cron |

### Arquivos a criar/modificar

1. **Templates:** `app/src/lib/email/templates/trial-day-{0,1,3,5,7,10,12,14}.tsx` (8 arquivos)
2. **Cron job:** Modificar `app/src/app/api/cron/trial-check/route.ts` para calcular dia do trial e disparar email correto
3. **Tracking:** Adicionar campo `lastTrialEmailDay` em `users/{uid}` para não reenviar

### Checklist de aceitação T6
- [ ] 8 templates de email criados
- [ ] Cron calcula dia correto do trial
- [ ] Emails disparam no dia certo (testar com data fake)
- [ ] Não reenvia email do mesmo dia
- [ ] Build passa

---

# ═══════════════════════════════════════════════════════════════
# FASE 2 — FRONTEND DISCOVERY
# As telas serão refeitas do zero. Antes de executar, precisamos
# definir o quê e como com aprovação do usuário.
# ═══════════════════════════════════════════════════════════════

## D1 — DISCOVERY: LOGIN / SIGNUP

### Contexto atual
- Componente: `app/src/components/ui/modern-animated-sign-in.tsx`
- Mostra TechOrbitDisplay com ícones de dev (HTML5, CSS3, Figma, Git) — ERRADO para produto de marketing
- Cores emerald em ~6 locais (input hover, BoxReveal, success, links, BottomGradient)
- Textos misturados EN/PT: "Login with Google", "or"

### Perguntas para decidir

1. **Layout:** Manter split screen (form esquerda + visual direita) ou tela inteira centralizada?
2. **Visual do lado direito (se split):**
   - Opção A: Ícones de marketing em orbit (Target, BarChart, Megaphone, Users, TrendingUp)
   - Opção B: ParticleCanvas do skeleton landing (grain texture + gold glow)
   - Opção C: Vídeo/animação do Hero do skeleton
   - Opção D: Design totalmente novo — se sim, qual referência?
3. **Elementos visuais:** Usar grain texture? Glow effects? Padrão grid do skeleton?
4. **Social login:** Manter só Google ou adicionar Apple/Meta?
5. **Fluxo pós-login:** Direto para dashboard ou welcome page?

### Referências existentes
- Skeleton landing visual: `_netecmt/docs/landpage/mkthoney-landing-page-skeleton/src/components/`
- Copy V2: `_netecmt/docs/landpage/COPY-LANDING-PAGE-V2.md`
- Design identity: Satoshi font, honey/gold palette, "Bloomberg Terminal meets War Room"

### Entregável
Wireframe ou descrição textual aprovada pelo usuário antes de executar E2.

---

## D2 — DISCOVERY: WELCOME + ONBOARDING

### Contexto atual
- Welcome page: `app/src/app/welcome/page.tsx` — 4 cards com ações (Criar marca, Chat, Offer Lab, Explorar)
- **BUG:** "Criar sua marca" navega para `/brands/new` (form antigo de 7 steps) em vez de abrir onboarding modal
- Onboarding: `app/src/components/onboarding/onboarding-modal.tsx` — 3 steps (identity, audience, offer)
- Cores emerald em ~8 locais na welcome + ~4 no onboarding

### Perguntas para decidir

1. **Welcome page:** Manter como page separada ou integrar ao dashboard (estado "novo usuário")?
2. **Fluxo:** Signup → Welcome → Onboarding → Dashboard **ou** Signup → Onboarding direto → Dashboard?
3. **Onboarding modal:** Manter 3 steps ou expandir/simplificar?
4. **Ação "Criar sua marca":** Fix simples (redirecionar para modal) ou redesenhar o fluxo inteiro?
5. **Cards da welcome:** Quais ações mostrar? Manter as 4 atuais ou alterar?
6. **Visual:** Seguir o mesmo padrão visual definido em D1 ou ter identidade própria?

### Referências existentes
- Onboarding steps: `app/src/components/onboarding/step-identity.tsx`, `step-audience.tsx`, `step-offer.tsx`
- UX Journey em `brain/PENDENCIAS-COMPLETAS.md` seção "UX Journey / Aha Moment"

### Entregável
Fluxo aprovado (Signup → ? → ? → Dashboard) + wireframe da welcome/onboarding.

---

## D3 — DISCOVERY: DASHBOARD (3 ESTADOS)

### Contexto atual
- Arquivo: `app/src/app/page.tsx`
- 3 estados: Pre-briefing (sem marca), Post-aha (com veredito), Active (uso regular)
- ~12 referências emerald
- Layout funcional mas sem identity visual (design genérico)

### Perguntas para decidir

1. **Layout base:** Manter layout de cards/grid atual ou redesenhar completamente?
2. **Pre-briefing:** O que mostrar quando o usuário não tem marca? CTA único ou guided steps?
3. **Post-aha:** Como apresentar o veredito? Card expandido, modal, seção dedicada?
4. **Active:** Quais métricas/widgets mostrar? KPIs, atividade recente, next actions?
5. **Sidebar interaction:** Dashboard full-width com sidebar colapsável ou layout fixo?
6. **Widgets prioritários:**
   - Score da marca (Proactive Verdict)
   - Atividade recente
   - Credits restantes
   - Trial status
   - Quick actions
7. **Responsividade:** Como colapsar em mobile?

### Referências existentes
- Design identity: "Bloomberg Terminal meets War Room" — sugere layout denso, data-driven
- Skeleton aesthetic: grain texture, gold accents, dark surfaces

### Entregável
Layout aprovado para cada um dos 3 estados + lista de widgets/seções com prioridade.

---

## D4 — DISCOVERY: SIDEBAR + HEADER + APP SHELL

### Contexto atual
- App Shell: `app/src/components/layout/app-shell.tsx` — ~10 refs emerald (LoadingScreen, auth wrapper)
- Sidebar: `app/src/components/layout/sidebar.tsx` — ~8 refs emerald (active states, logo, branding)
- Header: integrado no app-shell ou sidebar

### Perguntas para decidir

1. **Sidebar estilo:** Manter sidebar lateral fixa ou converter para collapsible/mobile drawer?
2. **Navegação:** Items atuais estão corretos? Reordenar? (Chat, Funnels, Social, Campaigns, Calendar, Assets, Vault, Automation, Settings, Offer Lab)
3. **Logo:** Usar `logo-mkthoney.svg` do skeleton ou criar novo?
4. **User area:** Avatar + dropdown no topo ou no fundo da sidebar?
5. **Trial/Plan badge:** Onde mostrar o status do plano? Sidebar bottom? Header?
6. **Coming Soon items:** Manter com lock icon ou esconder completamente?
7. **Tema:** Dark-only ou suportar light mode no futuro?

### Referências existentes
- Logo SVGs: `_netecmt/docs/landpage/mkthoney-landing-page-skeleton/public/logo-mkthoney*.svg`
- Sidebar items atuais: Chat, Funnels, Social, Campaigns, Calendar, Assets, Vault, Automation, Settings, Offer Lab

### Entregável
Wireframe da sidebar + header aprovado. Definição de quais items ficam visíveis vs locked.

---

## D5 — DISCOVERY: LANDING PAGE

### Contexto atual
- Landing atual: `app/src/app/landing/page.tsx` — genérica, 10 componentes, já usa honey/gold mas NÃO é o skeleton
- Skeleton pronto: `_netecmt/docs/landpage/mkthoney-landing-page-skeleton/` — 18 componentes, Vite/React, Satoshi, honey/gold, VideoCarousel, ParticleCanvas, Schema.org
- Copy V1: `_netecmt/docs/landpage/COPY-LANDING-PAGE-V1.md`
- Copy V2: `_netecmt/docs/landpage/COPY-LANDING-PAGE-V2.md` — "Exército de Um"
- Estrutura: `_netecmt/landpage-mkthoney-structure.md` — 14 seções, SEO/AEO checklist

### Perguntas para decidir

1. **Base:** Portar o skeleton direto para Next.js ou usar como referência para refazer do zero?
2. **Copy:** Usar V1, V2, ou nova versão?
3. **Vídeos hero:** Usar os 4 vídeos do skeleton ou trocar? CDN ou self-hosted?
4. **Seções:** Manter todas as 14 do structure.md ou cortar/adicionar?
5. **Pricing:** Manter 3 tiers (Starter R$97, Pro R$297, Agency R$597) ou ajustar valores/nomes?
6. **Testimonials:** Usar depoimentos fictícios ou aguardar reais?
7. **Performance:** ParticleCanvas + VideoCarousel + vídeos — budget de performance aceitável?
8. **Schema.org:** Implementar FAQPage + SoftwareApplication + Organization + HowTo?

### Assets disponíveis no skeleton
- `logo-mkthoney.svg`, `logo-mkthoney-icon.svg`
- `glow-abstract.png`, `texture-grain.png`, `texture-grain-alt.png`
- `texture-grid.png`, `texture-grid-alt.png`
- `hero-video-1.mp4` a `hero-video-4.mp4`

### Entregável
Decisão: portar skeleton vs refazer. Lista final de seções. Copy final escolhida. Tudo aprovado antes de E5.

---

# ═══════════════════════════════════════════════════════════════
# FASE 3 — FRONTEND EXECUÇÃO
# Só iniciar APÓS aprovação das discoveries (D1-D5)
# e conclusão de T1 + T2 (tokens e globals atualizados)
# ═══════════════════════════════════════════════════════════════

## E1 — EXECUTAR: APP SHELL + SIDEBAR + HEADER

### Dependências
T1 + T2 concluídas + D4 aprovado

### Escopo
Aplicar as decisões do D4:
- Migrar ~10 refs emerald no app-shell.tsx
- Migrar ~8 refs emerald na sidebar.tsx
- Aplicar logo MKTHONEY
- Implementar layout sidebar/header conforme wireframe aprovado
- LoadingScreen com identidade gold

### Arquivos
- `app/src/components/layout/app-shell.tsx`
- `app/src/components/layout/sidebar.tsx`
- Outros conforme decisões D4

### Checklist de aceitação E1
- [ ] Zero refs emerald em app-shell.tsx e sidebar.tsx
- [ ] Logo MKTHONEY aplicado
- [ ] Layout conforme wireframe D4
- [ ] Loading screen com identidade gold
- [ ] Build passa

---

## E2 — EXECUTAR: LOGIN / SIGNUP

### Dependências
T1 + T2 concluídas + D1 aprovado

### Escopo
Reescrever `modern-animated-sign-in.tsx` conforme decisões do D1:
- Remover TechOrbitDisplay (ou substituir conforme opção escolhida)
- Migrar todas as ~6 refs emerald
- Traduzir todos os textos para PT-BR
- Aplicar identity visual MKTHONEY

### Arquivos
- `app/src/components/ui/modern-animated-sign-in.tsx`
- Novos componentes conforme decisões D1

### Checklist de aceitação E2
- [ ] Zero ícones de dev (HTML, CSS, Figma, Git)
- [ ] Todos os accents gold, zero emerald
- [ ] Textos 100% PT-BR
- [ ] Visual conforme decisão D1
- [ ] Build passa

---

## E3 — EXECUTAR: WELCOME + ONBOARDING

### Dependências
T1 + T2 concluídas + D2 aprovado

### Escopo
Reescrever welcome page e onboarding conforme decisões do D2:
- Corrigir BUG "Criar sua marca" → onboarding modal (ou novo fluxo conforme D2)
- Migrar ~8 refs emerald na welcome
- Migrar ~4 refs emerald no onboarding
- Implementar fluxo aprovado em D2

### Arquivos
- `app/src/app/welcome/page.tsx`
- `app/src/components/onboarding/onboarding-modal.tsx`
- `app/src/components/onboarding/step-identity.tsx`
- `app/src/components/onboarding/step-audience.tsx`
- `app/src/components/onboarding/step-offer.tsx`

### Checklist de aceitação E3
- [ ] Fluxo Welcome → Onboarding funciona conforme D2
- [ ] BUG "Criar sua marca" corrigido
- [ ] Zero refs emerald em todos os arquivos
- [ ] Rename "Consultar o Conselho" feito
- [ ] Build passa

---

## E4 — EXECUTAR: DASHBOARD

### Dependências
T1 + T2 + T3 concluídas + D3 aprovado

### Escopo
Reescrever dashboard conforme decisões do D3:
- Migrar ~12 refs emerald
- Implementar layout dos 3 estados conforme aprovado
- Widgets/seções conforme lista aprovada em D3

### Arquivos
- `app/src/app/(app)/page.tsx` (se route group) ou `app/src/app/page.tsx` (se middleware approach)
- Componentes auxiliares conforme D3

### Checklist de aceitação E4
- [ ] 3 estados funcionais com layout aprovado
- [ ] Zero refs emerald
- [ ] Widgets conforme lista D3
- [ ] Build passa

---

## E5 — EXECUTAR: LANDING PAGE

### Dependências
T1 + T2 + T3 concluídas + D5 aprovado

### Escopo
Construir landing conforme decisões do D5:
- Portar/reescrever componentes conforme decisão (skeleton vs refazer)
- Aplicar copy final (V1, V2, ou nova)
- SEO metadata + Schema.org
- Performance otimizada

### Componentes (se portar skeleton — 18 total)

| Skeleton | Destino Next.js |
|----------|----------------|
| Hero.tsx | `app/src/components/landing/hero.tsx` |
| Navbar.tsx | `app/src/components/landing/navbar.tsx` |
| LogoBar.tsx | `app/src/components/landing/logo-bar.tsx` |
| Metrics.tsx | `app/src/components/landing/metrics.tsx` |
| Problem.tsx | `app/src/components/landing/problem.tsx` |
| Solution.tsx | `app/src/components/landing/solution.tsx` |
| HowItWorks.tsx | `app/src/components/landing/how-it-works.tsx` |
| Council.tsx | `app/src/components/landing/council.tsx` |
| Features.tsx | `app/src/components/landing/features.tsx` |
| Personas.tsx | `app/src/components/landing/personas.tsx` |
| Comparison.tsx | `app/src/components/landing/comparison.tsx` |
| Testimonials.tsx | `app/src/components/landing/testimonials.tsx` |
| Pricing.tsx | `app/src/components/landing/pricing.tsx` |
| FAQ.tsx | `app/src/components/landing/faq.tsx` |
| CTAFinal.tsx | `app/src/components/landing/cta-final.tsx` |
| Footer.tsx | `app/src/components/landing/footer.tsx` |
| VideoCarousel.tsx | `app/src/components/landing/video-carousel.tsx` |
| ParticleCanvas.tsx | `app/src/components/landing/particle-canvas.tsx` |

### Assets a copiar (se portar skeleton)
De `_netecmt/docs/landpage/mkthoney-landing-page-skeleton/public/` para `app/public/`:
- `logo-mkthoney.svg`, `logo-mkthoney-icon.svg`
- `glow-abstract.png`, `texture-grain.png`, `texture-grain-alt.png`
- `texture-grid.png`, `texture-grid-alt.png`
- `hero-video-1.mp4` a `hero-video-4.mp4` (avaliar tamanho — CDN se >5MB cada)

### Adaptações necessárias ao portar
1. Adicionar `'use client'` apenas onde necessário (VideoCarousel, ParticleCanvas, FAQ accordion, Navbar scroll)
2. Substituir `<a href>` por `<Link href>` do Next.js
3. Substituir `<img>` por `<Image>` do Next.js onde possível
4. Aplicar copy final conforme decisão D5
5. Implementar `generateMetadata()` conforme `_netecmt/landpage-mkthoney-structure.md`
6. Implementar Schema.org JSON-LD (FAQPage, SoftwareApplication, Organization, HowTo)

### Checklist de aceitação E5
- [ ] Todas as seções da landing renderizando
- [ ] Copy final aplicada (não placeholder)
- [ ] VideoCarousel funciona (ou fallback se vídeos pesados)
- [ ] ParticleCanvas funciona
- [ ] Schema.org JSON-LD no `<head>`
- [ ] SEO metadata completo (title, description, OG tags)
- [ ] Responsivo mobile (375px)
- [ ] Lighthouse performance > 80
- [ ] Paleta 100% honey/gold
- [ ] Fonte Satoshi carregando
- [ ] Build passa

---

## E6 — EXECUTAR: PUBLIC LAYOUT (LEGAL PAGES)

### Dependências
T1 + T2 concluídas

### Escopo
Migrar visual das páginas legais (terms, privacy, cookies, refund) para honey/gold.

### Arquivo
`app/src/app/(public)/layout.tsx`

| Local | De | Para |
|-------|-----|------|
| Background | `bg-zinc-950` | `bg-[#0D0B09]` |
| Header bg | `bg-zinc-900/80` | `bg-[#1A1612]/80` |
| Logo container | `bg-emerald-500/10` | `bg-[#E6B447]/10` |
| Logo letter | `text-emerald-400` | `text-[#E6B447]` |
| Back link hover | `hover:text-emerald-400` | `hover:text-[#E6B447]` |
| Footer bg | `bg-zinc-900/50` | `bg-[#1A1612]/50` |
| Legal links hover (4x) | `hover:text-emerald-400` | `hover:text-[#E6B447]` |

### Checklist de aceitação E6
- [ ] /terms, /privacy, /cookies, /refund com visual gold
- [ ] Zero emerald no layout público
- [ ] Build passa

---

## E7 — EXECUTAR: EMPTY STATES

### Dependências
T1 + T2 + E1 concluídas (shell precisa estar gold)

### Escopo
Toda página que pode estar vazia deve ter um empty state que guia o usuário para a próxima ação.

### Páginas

| Página | Empty state |
|--------|------------|
| `/funnels` | CTA "Criar seu primeiro funil" |
| `/campaigns` | CTA "Criar primeira campanha" |
| `/social` | CTA "Configurar redes sociais" |
| `/assets` | CTA "Upload seu primeiro asset" |
| `/vault` | CTA "Ativar Content Autopilot" |
| `/automation` | CTA "Criar primeira regra" |
| `/content/calendar` | CTA "Gerar primeiro conteúdo" |

### Componente padrão
Criar `app/src/components/ui/empty-state.tsx`:
```tsx
interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel: string;
  actionHref?: string;
  onAction?: () => void;
}
```

Visual: ícone 48px em `text-[#E6B447]/40`, título em `text-[#F5E8CE]`, descrição em `text-[#CAB792]`, botão gold.

### Checklist de aceitação E7
- [ ] 7 páginas com empty state guiado
- [ ] Visual gold
- [ ] CTAs funcionam e levam para a ação correta
- [ ] Build passa

---

## RESUMO VISUAL

```
═══════════════════════════════════════════════════════════════
 FASE 0 — DESIGN SYSTEM DISCOVERY (decidir primeiro)
═══════════════════════════════════════════════════════════════

 D0 (paleta, fonte, estética)    ██ 2-4h (sessão com usuário)

 Bloqueia: T1, T2, e toda Fase 3

═══════════════════════════════════════════════════════════════
 FASE 1 — FOUNDATION (~30h)
═══════════════════════════════════════════════════════════════

 T1 (tokens + fonte)             ████ 4h        ┐ depende D0
 T2 (globals + tailwind)         ████ 4h        ┘
 T3 (reestruturar rotas)         ██████ 6h      ← independente (já pode)
 T4 (rename Conselho→MKTHONEY)  ██████ 6h      ← independente (já pode)
 T5 (brand config GAPs)          ████████ 8h    ← independente (já pode)
 T6 (email sequence 14 dias)     ████████ 8h    ← independente (já pode)

 T3/T4/T5/T6 podem iniciar ANTES de D0

═══════════════════════════════════════════════════════════════
 FASE 2 — FRONTEND DISCOVERY (~10h, aprovação do usuário)
═══════════════════════════════════════════════════════════════

 D1 (Login/Signup)        ██ 2h  — layout, visual, social login
 D2 (Welcome+Onboarding)  ██ 2h  — fluxo, cards, ações
 D3 (Dashboard)           ██ 2h  — layout 3 estados, widgets
 D4 (Sidebar+Header)      ██ 2h  — estilo, logo, items
 D5 (Landing Page)        ██ 2h  — portar vs refazer, copy, seções

 Pode rodar em paralelo com Fase 1

═══════════════════════════════════════════════════════════════
 FASE 3 — EXECUÇÃO (~52h, após aprovação de D0 + Fase 2)
═══════════════════════════════════════════════════════════════

 E1 (Shell+Sidebar+Header)  ██████ 6h
 E2 (Login/Signup)           ██████ 6h           ← paralelo
 E3 (Welcome+Onboarding)    ██████ 6h           ← paralelo
 E4 (Dashboard)              ██████ 6h           ← paralelo
 E5 (Landing Page)           ████████████████ 16h
 E6 (Public layout)          ██ 2h               ← paralelo com E5
 E7 (Empty states)           ██████ 6h
 QA final                    ████ 4h

═══════════════════════════════════════════════════════════════
 TOTAL ESTIMADO: ~94h / ~6-8 semanas
═══════════════════════════════════════════════════════════════
```

---

## REGRA DE OURO

> **Nenhuma tarefa (T/E) é considerada "feita" até que:**
> 1. TODOS os itens do checklist estejam OK
> 2. `cd app && npm run build` passe sem erros
> 3. Verificação visual no browser confirme a mudança
> 4. Zero referências ao padrão antigo no arquivo modificado

> **Para Discovery (D0-D5):**
> 1. Perguntas apresentadas ao usuário
> 2. Respostas documentadas no próprio D
> 3. Aprovação explícita ANTES de iniciar qualquer execução dependente
