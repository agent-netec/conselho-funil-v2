# PROMPT — E5: Landing Page — Port Skeleton + Copy V2

> Cole este prompt inteiro no agente que vai executar a tarefa.
> **ATENÇÃO:** Esta é a tarefa mais extensa. Leia TODAS as referências antes de começar.

---

## CONTEXTO

**Produto:** MKTHONEY — SaaS de marketing autônomo com IA.
**Stack:** Next.js 16.1.1, React 19, TypeScript, Firebase, Gemini AI.
**Diretório do app:** `app/` (root do Next.js — build: `cd app && npm run build`)

**Design System:** Honey Gold dark-only.
- Tokens: `app/src/styles/design-tokens.css`
- Primary: #E6B447, BG: #0D0B09, Surface-1: #1A1612, Text: #F5E8CE, Muted: #6B5D4A
- Font: Geist Sans + Geist Mono (next/font, ja configurado)
- Grain texture: classe `.bg-noise` em design-tokens.css

**Situação:**
- Landing page atual (`app/src/app/landing/page.tsx`) tem 10 componentes genericos
- Skeleton de referência (`_netecmt/docs/landpage/mkthoney-landing-page-skeleton/`) tem 18 componentes com design detalhado
- Copy V2 aprovado: tom "Exército de Um", militar-tatico, brutalista-premium
- Pricing: 3 tiers (Starter R$97, Pro R$297, Agency R$597)

---

## REFERÊNCIAS OBRIGATÓRIAS — LER ANTES DE COMEÇAR

### 1. Skeleton Components (Vite/React — referência visual e estrutural)
```
_netecmt/docs/landpage/mkthoney-landing-page-skeleton/src/components/
├── Navbar.tsx
├── Hero.tsx (310 linhas — mais detalhado)
├── LogoBar.tsx
├── Metrics.tsx
├── Problem.tsx
├── Solution.tsx
├── HowItWorks.tsx
├── Council.tsx
├── Features.tsx
├── Personas.tsx
├── Comparison.tsx
├── Testimonials.tsx
├── Pricing.tsx
├── FAQ.tsx
├── CTAFinal.tsx
├── Footer.tsx
├── ParticleCanvas.tsx (NAO PORTAR)
└── VideoCarousel.tsx (NAO PORTAR)
```

### 2. Copy V2 (textos exatos de cada seção)
```
_netecmt/docs/landpage/COPY-LANDING-PAGE-V2.md (595 linhas)
```

### 3. Landing Structure Guide (SEO/AEO guidelines)
```
_netecmt/landpage-mkthoney-structure.md (se existir)
```

### 4. Screenshots de referência
```
_netecmt/docs/design/screens/landing-page/hero.png
_netecmt/docs/design/screens/landing-page/arsenal.png
_netecmt/docs/design/screens/landing-page/pricing.png
_netecmt/docs/design/screens/landing-page/full-page-live.png
```

### 5. Design Tokens
```
app/src/styles/design-tokens.css
```

---

## FERRAMENTAS OBRIGATÓRIAS

### shadcn MCP
- `search_items_in_registries` queries: `accordion`, `card`, `badge`, `button`, `tabs`
- `get_add_command_for_items` — instalar `accordion` se nao instalado (necessario para FAQ)
- `get_item_examples_from_registries` query: `accordion-demo`
- `get_audit_checklist` — rodar apos mudancas

### Skills
- `/page-optimization` — CRO, Core Web Vitals, conversao
- `/seo` — Schema.org, meta tags, AEO
- `/ui-components` — padroes de componentes
- `/web-design-guidelines` — review de UI
- `/react-patterns` — RSC, client boundaries

---

## REGRAS GERAIS DE PORTABILIDADE

1. **Server Components por default.** Usar `'use client'` SOMENTE onde animacao/interacao e necessaria
2. **NÃO importar** `framer-motion` em Server Components — isolar em Client Components
3. **NÃO usar** `react-player` ou `swiper` — manter bundle leve
4. **NÃO usar** ParticleCanvas — usar `.bg-noise` CSS (ja em design-tokens.css)
5. **NÃO usar** VideoCarousel — hero estatico com CSS animation
6. **Font:** Geist Sans/Mono (NAO Satoshi que o skeleton usa — trocar TODAS as refs)
7. **Responsive:** Mobile-first, breakpoints: sm (640), md (768), lg (1024), xl (1280)
8. **Copy:** Usar textos EXATOS do Copy V2 (`COPY-LANDING-PAGE-V2.md`)
9. **Links de CTA:** Todos apontam para `/signup` ou `/login`
10. **Ancora IDs:** Navbar links usam smooth scroll para IDs de secao

---

## ARQUIVOS A MODIFICAR/CRIAR

### Reescrever (ja existem):
- `app/src/app/landing/page.tsx` — page principal + metadata + Schema.org
- `app/src/components/landing/landing-navbar.tsx`
- `app/src/components/landing/landing-hero.tsx`
- `app/src/components/landing/landing-pain.tsx` → renomear para `landing-problem.tsx`
- `app/src/components/landing/landing-solution.tsx`
- `app/src/components/landing/landing-how-it-works.tsx`
- `app/src/components/landing/landing-council.tsx` → renomear para `landing-arsenal.tsx`
- `app/src/components/landing/landing-pricing.tsx`
- `app/src/components/landing/landing-faq.tsx`
- `app/src/components/landing/landing-cta.tsx`
- `app/src/components/landing/landing-footer.tsx`

### Criar novos (do skeleton):
- `app/src/components/landing/landing-metrics.tsx`
- `app/src/components/landing/landing-features.tsx`
- `app/src/components/landing/landing-comparison.tsx`

### Atualizar barrel export:
- `app/src/components/landing/index.ts`

---

## ORDEM DAS SEÇÕES NA LANDING (12 seções)

```
1. Navbar (fixed top)
2. Hero (first fold — CTA principal)
3. Metrics (social proof numeros)
4. Problem (dor do usuario)
5. Solution (como MKTHONEY resolve)
6. Arsenal (3 colunas: Inteligencia, Biblioteca, Operacoes)
7. How It Works (3 fases/passos)
8. Features (funcionalidades detalhadas)
9. Comparison (vs Agencias vs DIY vs Freelancers)
10. Pricing (3 tiers)
11. FAQ (accordion com Schema.org)
12. CTA Final (ultima conversao)
13. Footer
```

---

## SEÇÃO 1: page.tsx — Metadata + Schema.org + Layout

### Arquivo: `app/src/app/landing/page.tsx`

### O que fazer:

**1. Metadata (Next.js generateMetadata ou export const metadata):**
```typescript
export const metadata: Metadata = {
  title: 'MKTHONEY — Marketing Autônomo com IA | 23 Especialistas 24/7',
  description: 'Plataforma SaaS que reúne 23 conselheiros de IA baseados em lendas do marketing. Estratégia, conteúdo, funis e automação — tudo numa tela, na sua mão.',
  keywords: [
    'marketing autonomo', 'marketing com IA', 'automacao de marketing',
    'funil de vendas', 'SaaS marketing', 'inteligencia artificial marketing',
    'conselheiros de marketing', 'MKTHONEY', 'agencia de marketing IA',
    'marketing digital automatizado',
  ],
  openGraph: {
    title: 'MKTHONEY — Marketing Autônomo com IA',
    description: 'Pare de contratar. Comece a operar. 23 especialistas de IA, 24/7.',
    type: 'website',
    locale: 'pt_BR',
    siteName: 'MKTHONEY',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MKTHONEY — Marketing Autônomo com IA',
    description: 'Pare de contratar. Comece a operar. 23 especialistas de IA, 24/7.',
  },
};
```

**2. JSON-LD Schema.org (3 schemas):**

```tsx
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      name: 'MKTHONEY',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      description: 'Plataforma SaaS de marketing autônomo com 23 conselheiros de IA baseados em lendas do marketing.',
      offers: [
        { '@type': 'Offer', name: 'Starter', price: '97', priceCurrency: 'BRL', billingIncrement: 'P1M' },
        { '@type': 'Offer', name: 'Pro', price: '297', priceCurrency: 'BRL', billingIncrement: 'P1M' },
        { '@type': 'Offer', name: 'Agency', price: '597', priceCurrency: 'BRL', billingIncrement: 'P1M' },
      ],
    },
    {
      '@type': 'Organization',
      name: 'MKTHONEY',
      url: 'https://mkthoney.com',
      description: 'Marketing autônomo com inteligência artificial.',
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        // Adicionar cada FAQ como Question/Answer (ver secao FAQ abaixo)
      ],
    },
  ],
};
```

Injetar no JSX:
```tsx
<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
```

**3. Layout da pagina:**
```tsx
export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-[#0D0B09] text-[#F5E8CE]">
      {/* Background texture */}
      <div className="pointer-events-none fixed inset-0 bg-noise opacity-[0.02]" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(230,180,71,0.08),transparent)]" />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <LandingNavbar />
      <main>
        <LandingHero />
        <LandingMetrics />
        <LandingProblem />
        <LandingSolution />
        <LandingArsenal />
        <LandingHowItWorks />
        <LandingFeatures />
        <LandingComparison />
        <LandingPricing />
        <LandingFaq />
        <LandingCta />
      </main>
      <LandingFooter />
    </div>
  );
}
```

---

## SEÇÃO 2: Navbar

### Arquivo: `landing-navbar.tsx`

### Referência: Skeleton `Navbar.tsx` + Copy V2 Secao 0 (Pilula Magnetica)

### Estrutura:
- Logo MKTHONEY (usar `<Image src="/logo-mkthoney.svg" />`)
- Links: Arsenal (#arsenal) · Filosofia (#solution) · Protocolo (#how-it-works) · O Preço (#pricing) · FAQ (#faq)
- CTA: "Iniciar Guerra →" → `/signup`
- Mobile: hamburger menu com Sheet (shadcn) ou disclosure

### Copy V2 Navbar:
```
Arsenal · Filosofia · Protocolo · O Preço · FAQ
CTA: "Iniciar Guerra →"
```

### Implementação:
- `'use client'` (mobile toggle state)
- Sticky top, backdrop-blur, z-50
- Background: `bg-[#0D0B09]/80 backdrop-blur-md border-b border-white/[0.04]`
- Links: `text-sm text-zinc-400 hover:text-[#E6B447] transition-colors`
- CTA button: `bg-[#E6B447] text-[#0D0B09] font-semibold rounded-lg px-4 py-2 hover:bg-[#F0C35C]`

---

## SEÇÃO 3: Hero

### Arquivo: `landing-hero.tsx`

### Referência: Skeleton `Hero.tsx` (simplificar de 310 → ~100 linhas) + Copy V2 Secao 1

### Copy V2 Hero:
```
Badge: "Plataforma de Marketing Autônomo"
H1: "Pare de Contratar. Comece a Operar."
Sub: "23 conselheiros de IA baseados nas maiores lendas do marketing. Estratégia, conteúdo, funis e automação — na sua mão, 24/7."
Micro-copy: "Sem cartão. Sem contrato. Sem depender de ninguém."
CTA primário: "Iniciar Operação" → /signup
CTA secundário: "Ver Arsenal" → #arsenal
```

### Metricas flutuantes (do skeleton Metrics.tsx, integrar no hero):
```
10x → "mais rápido que equipe tradicional"
500+ → "templates prontos"
24/7 → "operação contínua"
```

### Implementação:
- `'use client'` (animacoes Framer Motion)
- Full viewport height: `min-h-[90vh]`
- Gradiente radial gold sutil no fundo
- Badge com border gold: `border border-[#E6B447]/20 bg-[#E6B447]/5 text-[#E6B447] text-xs rounded-full px-3 py-1`
- H1: `text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight`
- Sub: `text-lg text-zinc-400 max-w-2xl`
- Metricas: 3 boxes inline com numero gold grande e label pequeno
- **SEM video, SEM particles** — usar gold glow CSS + noise texture

---

## SEÇÃO 4: Metrics (Social Proof)

### Arquivo: `landing-metrics.tsx` (NOVO)

### Referência: Skeleton `Metrics.tsx`

### Dados:
```
10x     → "Mais rápido que equipe tradicional"
500+    → "Templates e frameworks prontos"
24/7    → "Operação contínua, sem pausas"
23      → "Conselheiros de IA especializados"
```

### Implementação:
- Server Component (sem animacao complexa)
- Grid 4 colunas (2x2 mobile, 4 desktop)
- Numero: `text-3xl md:text-4xl font-bold text-[#E6B447]`
- Label: `text-sm text-zinc-400`
- Background sutil: `border border-white/[0.04] bg-white/[0.01] rounded-xl p-6`

---

## SEÇÃO 5: Problem (Pain)

### Arquivo: `landing-problem.tsx` (renomear de `landing-pain.tsx`)

### Referência: Copy V2 Secao 3 (Filosofia — "Dark Mode Return")

### Copy V2:
```
H2: "O Mercado Te Convenceu Que Você Precisa de Mais Gente. Mentira."
3 caminhos falsos:
1. "Contratar uma agência" → custo, demora, dependência
2. "Montar equipe interna" → salários, gestão, turnover
3. "Usar 10 ferramentas" → integração, curva, fragmentação
Conclusão: "Nenhum desses caminhos te dá autonomia."
```

### Implementação:
- Server Component
- Seccao escura: `bg-[#0D0B09]` com separador sutil
- H2: `text-2xl md:text-3xl font-bold text-white`
- 3 cards de problema: border red/terracotta sutil
- Cada card: icone, titulo do caminho falso, consequência

---

## SEÇÃO 6: Solution

### Arquivo: `landing-solution.tsx`

### Referência: Copy V2 continuacao da Filosofia

### Copy:
```
H2: "MKTHONEY É O Multiplicador."
"Uma plataforma. 23 mentes. Todo o arsenal. Suas regras."
"Você não contrata. Você opera."
"Você não depende. Você decide."
```

### Implementação:
- Server Component
- Texto largo, editorial, centrado
- Gold accent em palavras-chave
- Transicao visual do Problem (escuro) para Solution (gold glow sutil)

---

## SEÇÃO 7: Arsenal (Council → 3 Colunas)

### Arquivo: `landing-arsenal.tsx` (renomear de `landing-council.tsx`)

### Referência: Skeleton `Council.tsx` + Copy V2 Secao 2 (Arsenal)

### Copy V2:
```
H2: "Tudo Que Uma Agência de 10 Pessoas Faz. Numa Tela. Na Sua Mão."

3 Colunas:
1. INTELIGÊNCIA: Spy Agent, Social Listening, Keywords Miner, Research Engine
2. BIBLIOTECA: Vault, Copy DNA, Funnel Blueprints, Template Library
3. OPERAÇÕES: Content Calendar, Generation Engine, A/B Lab, Automation, War Room, Autopsy, Offer Lab
```

### 8 Conselheiros principais:
```
Gary Halbert — Direct Response
Eugene Schwartz — 5 Níveis de Consciência
Russell Brunson — Funis de Conversão
David Ogilvy — Branding & Research
Claude Hopkins — Publicidade Científica
Seth Godin — Marketing de Permissão
P.T. Barnum — Showmanship
Jay Abraham — Growth & Partnerships
+ 15 mais (Copy, Sales, Social, Ads, Design)
```

### Implementação:
- `'use client'` (hover effects)
- id="arsenal" (ancora da navbar)
- Grid 3 colunas (stack mobile)
- Cada coluna: titulo + icone + lista de features
- Secao de conselheiros: grid 2x4 com avatar placeholder + nome + especialidade
- Badge "+15 especialistas" em gold

---

## SEÇÃO 8: How It Works

### Arquivo: `landing-how-it-works.tsx`

### Referência: Copy V2 Secao 4 (Protocolo — Sticky Cards)

### Copy V2:
```
H2: "Uma Pessoa. Três Fases. Mais Resultado Que Sua Última Agência em 12 Meses."
Fase 1: Diagnóstico — "MKTHONEY analisa seu mercado, concorrência e posicionamento"
Fase 2: Estratégia — "23 conselheiros debatem e geram plano personalizado"
Fase 3: Execução — "Conteúdo, funis e campanhas gerados automaticamente"
```

### Implementação:
- Server Component (ou `'use client'` se usar scroll-triggered animation)
- id="how-it-works"
- 3 steps numerados (1, 2, 3) com gold circle number
- Linha vertical conectando os 3 steps (gold dashed)
- Cada step: numero gold, titulo bold, descricao zinc-400

---

## SEÇÃO 9: Features

### Arquivo: `landing-features.tsx` (NOVO)

### Referência: Skeleton `Features.tsx`

### Funcionalidades para destacar:
```
1. Conselho de Marketing (23 conselheiros AI)
2. Geração de Funis (multi-stage)
3. Content Calendar (automação de publicação)
4. Spy Agent (análise competitiva)
5. Copy Generation (headlines, ads, emails)
6. Brand Hub (identidade centralizada)
```

### Implementação:
- Server Component
- Grid 2x3 (1 coluna mobile)
- Cada feature: icone Lucide, titulo, descricao 2 linhas
- Cards com `border border-white/[0.04] bg-white/[0.01] rounded-xl p-6`
- Hover: `hover:border-[#E6B447]/20 hover:bg-[#E6B447]/[0.02]`

---

## SEÇÃO 10: Comparison

### Arquivo: `landing-comparison.tsx` (NOVO)

### Referência: Skeleton `Comparison.tsx`

### Tabela comparativa:
```
| Funcionalidade | MKTHONEY | Agência | DIY (10 tools) | Freelancer |
|----------------|----------|---------|-----------------|------------|
| Custo mensal   | R$297    | R$5-15k | R$500-2k        | R$3-8k     |
| Disponibilidade| 24/7     | Horário | Você opera      | Limitado   |
| Especialistas  | 23 IA    | 3-5     | 0               | 1          |
| Setup           | 5 min   | 2-4 sem | Semanas         | Dias       |
| Dependência    | Zero     | Total   | Parcial         | Alta       |
```

### Implementação:
- Server Component
- id="comparison" (opcional)
- Tabela responsive (scroll horizontal mobile)
- Coluna MKTHONEY destacada com gold background
- Checkmarks gold para MKTHONEY, X red para desvantagens dos outros

---

## SEÇÃO 11: Pricing

### Arquivo: `landing-pricing.tsx`

### 3 Tiers (ja definidos no produto):

```
STARTER — R$97/mês
- 5 marcas
- 50 gerações/mês
- Conselheiros básicos (8)
- Templates padrão
- Email support
CTA: "Começar com Starter"

PRO — R$297/mês (POPULAR)
- 15 marcas
- 200 gerações/mês
- Todos os 23 conselheiros
- Templates premium
- Spy Agent
- Priority support
CTA: "Escalar com Pro"

AGENCY — R$597/mês
- Marcas ilimitadas
- Gerações ilimitadas
- Todos os 23 conselheiros
- White-label reports
- API access
- Dedicated support
CTA: "Dominar com Agency"
```

### Implementação:
- `'use client'` (toggle mensal/anual se aplicavel, hover effects)
- id="pricing"
- Grid 3 colunas (stack mobile)
- Pro card destacado: `border-[#E6B447] ring-1 ring-[#E6B447]/20` com badge "Popular"
- Outros cards: `border-white/[0.06]`
- Preço: `text-4xl font-bold text-white` com `/mês` em `text-sm text-zinc-500`
- CTA Pro: `bg-[#E6B447] text-[#0D0B09]` (gold solid)
- CTA outros: `border border-white/[0.1] text-white` (outline)
- Features list com checkmarks gold

---

## SEÇÃO 12: FAQ

### Arquivo: `landing-faq.tsx`

### Usar shadcn Accordion component.

**Se Accordion não estiver instalado:**
```bash
npx shadcn@latest add accordion
```

### FAQs (extrair do Copy V2 + complementar):
```
Q: O que é o MKTHONEY?
A: Plataforma SaaS de marketing autônomo com 23 conselheiros de IA baseados em lendas do marketing...

Q: Preciso de experiência em marketing?
A: Não. Os conselheiros guiam cada decisão...

Q: Posso cancelar a qualquer momento?
A: Sim, sem multa. Garantia de 7 dias...

Q: Quantas marcas posso gerenciar?
A: Depende do plano: 5 (Starter), 15 (Pro), ilimitadas (Agency)

Q: Os conteúdos são gerados por IA?
A: Sim, usando modelos de IA avançados, com a voz e personalidade da sua marca...

Q: Como funciona o trial?
A: 14 dias com acesso Pro completo, sem cartão de crédito.
```

### Implementação:
- `'use client'` (accordion state)
- id="faq"
- Cada FAQ deve estar TAMBEM no Schema.org FAQPage (no page.tsx)
- Accordion items com `border-white/[0.04]`
- Trigger: `text-white hover:text-[#E6B447]`
- Content: `text-zinc-400 text-sm`

---

## SEÇÃO 13: CTA Final

### Arquivo: `landing-cta.tsx`

### Copy V2:
```
H2: "O Marketing Não Espera. Nem Você Deveria."
Sub: "14 dias grátis. Sem cartão. Sem compromisso."
CTA: "Iniciar Operação" → /signup
```

### Implementação:
- Server Component (ou client se tiver glow animation)
- Fundo com gold glow mais intenso: `bg-[radial-gradient(ellipse_at_center,rgba(230,180,71,0.12),transparent_70%)]`
- CTA grande: `text-lg bg-[#E6B447] text-[#0D0B09] px-8 py-4 rounded-xl font-bold`

---

## SEÇÃO 14: Footer

### Arquivo: `landing-footer.tsx`

### Estrutura:
```
Logo MKTHONEY + tagline
Links: Produto | Empresa | Legal | Suporte
Produto: Arsenal, Pricing, FAQ
Empresa: Sobre (futuro)
Legal: Termos (/terms), Privacidade (/privacy), Cookies (/cookies), Reembolso (/refund)
Suporte: support@mkthoney.com
Copyright: © 2026 MKTHONEY. Todos os direitos reservados.
CNPJ: 62.625.246/0001-06
```

### Implementação:
- Server Component
- 4 colunas (stack mobile)
- Texto: `text-xs text-zinc-500`
- Links: `text-zinc-400 hover:text-[#E6B447]`
- Separador: `border-t border-white/[0.04]`

---

## ASSETS NECESSÁRIOS

### Copiar para `app/public/` (se nao feito em E1):
```bash
cp "_netecmt/docs/landpage/mkthoney-landing-page-skeleton/public/logo-mkthoney.svg" "app/public/logo-mkthoney.svg"
cp "_netecmt/docs/landpage/mkthoney-landing-page-skeleton/public/logo-mkthoney-icon.svg" "app/public/logo-mkthoney-icon.svg"
```

### Textures (opcionais — ja temos .bg-noise em CSS):
Se quiser usar PNG em vez de SVG noise:
```bash
cp "_netecmt/docs/landpage/mkthoney-landing-page-skeleton/public/texture-grain.png" "app/public/texture-grain.png"
```

---

## O QUE NÃO FAZER

1. **NÃO importar** framer-motion em Server Components
2. **NÃO usar** `react-player` ou `swiper`
3. **NÃO usar** ParticleCanvas (40 particles = performance hit)
4. **NÃO usar** font Satoshi (skeleton usa Satoshi — trocar para Geist)
5. **NÃO usar** palavras "revolucionário", "incrível", "poderoso" (regra de copy)
6. **NÃO alterar** logica de auth ou Firebase
7. **NÃO alterar** middleware routing
8. **NÃO criar** paginas de marketing extras alem da landing
9. **NÃO** hardcodar URLs de producao — usar paths relativos (/signup, /login)
10. **NÃO deletar** componentes antigos ate confirmar que novos funcionam

---

## BARREL EXPORT

### Arquivo: `app/src/components/landing/index.ts`

Atualizar para exportar TODOS os componentes:
```typescript
export { LandingNavbar } from './landing-navbar';
export { LandingHero } from './landing-hero';
export { LandingMetrics } from './landing-metrics';
export { LandingProblem } from './landing-problem';
export { LandingSolution } from './landing-solution';
export { LandingArsenal } from './landing-arsenal';
export { LandingHowItWorks } from './landing-how-it-works';
export { LandingFeatures } from './landing-features';
export { LandingComparison } from './landing-comparison';
export { LandingPricing } from './landing-pricing';
export { LandingFaq } from './landing-faq';
export { LandingCta } from './landing-cta';
export { LandingFooter } from './landing-footer';
```

Se os componentes antigos (landing-pain.tsx, landing-council.tsx) nao forem mais usados, deletar.

---

## VERIFICAÇÃO

```bash
# 1. Zero refs a Satoshi
cd app && grep -rn "Satoshi\|satoshi" src/components/landing/ --include="*.tsx" --include="*.ts"
# Deve retornar ZERO

# 2. Zero refs a ParticleCanvas ou VideoCarousel
cd app && grep -rn "ParticleCanvas\|VideoCarousel" src/ --include="*.tsx"
# Deve retornar ZERO

# 3. Verificar Schema.org valido (JSON-LD no page)
cd app && grep -n "application/ld+json" src/app/landing/page.tsx
# Deve ter resultado

# 4. Todos os IDs de ancora existem
cd app && grep -n "id=\"arsenal\"\|id=\"pricing\"\|id=\"faq\"\|id=\"how-it-works\"" src/components/landing/ --include="*.tsx"

# 5. Build passa
cd app && npm run build

# 6. Lighthouse (rodar apos deploy ou dev server)
# Targets: Performance > 85, Accessibility > 90, SEO > 90
```

### Criterios de aceitacao E5:
- [ ] 13 secoes renderizadas na ordem correta
- [ ] Copy V2 "Exercito de Um" aplicado em todas as secoes
- [ ] Pricing 3 tiers (R$97, R$297, R$597) com Pro destacado
- [ ] Schema.org: SoftwareApplication + Organization + FAQPage
- [ ] Navbar sticky com smooth scroll para ancoras
- [ ] Hero com metricas (10x, 500+, 24/7, 23)
- [ ] Arsenal em 3 colunas com 8 conselheiros + badge "+15"
- [ ] Comparison table MKTHONEY vs alternatives
- [ ] FAQ com shadcn Accordion
- [ ] Footer com links legais (/terms, /privacy, /cookies, /refund)
- [ ] Zero refs a Satoshi, ParticleCanvas, VideoCarousel
- [ ] Server Components onde possivel, 'use client' so onde necessario
- [ ] Responsive: funciona em 375px e 1440px
- [ ] Build: `cd app && npm run build` passa

---

## COMMIT

```
feat(E5): port landing page skeleton with Copy V2 and 3-tier pricing

- Rewrite all 10 landing components + create 3 new (metrics, features, comparison)
- Apply Copy V2 "Exército de Um" tone (military-tactical, brutalista-premium)
- 13 sections: Navbar → Hero → Metrics → Problem → Solution → Arsenal → HowItWorks → Features → Comparison → Pricing → FAQ → CTA → Footer
- 3-tier pricing: Starter R$97, Pro R$297 (popular), Agency R$597
- Schema.org JSON-LD: SoftwareApplication + Organization + FAQPage
- Server Components by default, 'use client' only for interactive sections
- Geist font (not Satoshi), no particles, no video carousel

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```
