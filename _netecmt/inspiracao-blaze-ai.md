# Inspiração: Blaze.ai → MktHoney

> Análise da landing page blaze.ai com recomendações de o que adotar, adaptar ou ignorar para o MktHoney.

---

## Resumo Rápido do Blaze.ai

**O que é:** Plataforma de marketing com IA para criação de conteúdo, agendamento, e analytics.
**Público:** Startups, agências, e times Fortune 500 (15k+ users).
**Posicionamento:** "Agency-level strategy, content, and insights for 1% of the price."
**Modelo:** Free trial → SaaS pago.

---

## 1. ESTRUTURA DA PAGE (ordem exata)

| # | Seção Blaze | Equivalente MktHoney | Adotar? |
|---|-------------|---------------------|---------|
| 1 | Banner de webinar (dismissível) | Banner de beta/lançamento | SIM — ótimo para urgência |
| 2 | Nav sticky (logo + 4 links + Sign In + 2 CTAs) | Igual | SIM |
| 3 | Hero (H1 + sub + 2 CTAs + badge Capterra) | Igual | SIM |
| 4 | Logo marquee (scroll infinito) | Igual | SIM |
| 5 | Métricas de impacto (3 números animados) | Igual | SIM — adaptar métricas |
| 6 | Testimonials carousel (vídeo embed) | Adaptar para texto inicialmente | PARCIAL |
| 7 | Timeline "30 dias" (3 colunas) | Adaptar para "Como Funciona" | SIM |
| 8 | Feature: Estratégia (imagem + texto) | Seção do Conselho | ADAPTAR |
| 9 | Feature: Controle (carousel 4 slides) | Features carousel | SIM |
| 10 | Feature: Auto-geração (laptop mockup) | Content Autopilot | SIM |
| 11 | Feature: Analytics (dashboard) | War Room | SIM |
| 12 | Calculadora de economia | Comparação vs. Agência | ADAPTAR |
| 13 | CTA final | Igual | SIM |
| 14 | Footer | Igual | SIM |
| — | FAQ | **Blaze NÃO tem FAQ!** | NÓS TEMOS (AEO) |

**Diferença crítica:** Blaze NÃO tem FAQ. Nós teremos — é nosso diferencial de AEO.

---

## 2. HERO — O que copiar

### Blaze faz:
```
Badge: "4.8 on Capterra — 658 reviews" (acima do H1)
H1: "Make your brand extraordinary."
Sub: "The AI marketing platform with taste, power, and speed..."
CTA 1: [Start Free Trial] (azul sólido)
CTA 2: [Book Demo] (outline)
Visual: Screenshot do produto (.avif)
```

### MktHoney deve fazer:
```
Badge: "⭐ 4.9/5 — [número] estrategistas já usam" (acima do H1)
H1: "Sua Agência de Marketing com IA — 24/7, Sem Contratos, Sem Equipe"
Sub: "23 lendas do marketing trabalhando juntas pela sua marca..."
CTA 1: [Começar Grátis →] (cor primária sólida)
CTA 2: [Ver Demo →] (outline)
Visual: Screenshot do dashboard com debate do Conselho
```

**Padrões a adotar:**
- Badge de review ACIMA do H1 (não abaixo)
- Dois CTAs lado a lado (primário + secundário)
- H1 curto e impactante (Blaze usa 5 palavras)
- Screenshot real do produto como hero visual
- Imagem em formato .avif com fallback .jpg

---

## 3. MÉTRICAS ANIMADAS — Padrão que funciona

### Blaze mostra:
```
2.3x  → "Follower growth — Top customers more than double their following in 30 days"
87%   → "Audience growth — 87% of customers see audience growth in first 30 days"
99%   → "Lower cost vs agencies — Agency-level for 1% of the price"
```

### MktHoney equivalente:
```
-80%  → "Tempo de criação — Reduza o tempo de produção de conteúdo em 80%"
23    → "Conselheiros IA — Especialistas baseados em lendas do marketing mundial"
24/7  → "Operação contínua — Sua agência nunca dorme, nunca tira férias"
-90%  → "Custo vs. agência — Inteligência enterprise por uma fração do preço"
```

**Técnica:** Animação de counter no scroll (Intersection Observer + easing quartic). Números animam de 0 ao valor final quando entram no viewport.

---

## 4. LOGO MARQUEE — Implementação

### Blaze faz:
- 7 logos em scroll infinito horizontal
- Repete 3x para loop seamless
- CSS mask gradient nas bordas (fade-in/fade-out)
- Pausa no hover

### MktHoney:
- Se tiver logos de clientes: usar igual
- Se não: "Construído com:" → logos Google Gemini, Firebase, Pinecone, Vercel, Next.js
- Mesma técnica: marquee CSS com 3x repeat + mask gradient

---

## 5. TIMELINE "30 DIAS" — Padrão excelente

### Blaze faz (3 colunas):
```
⏱ 5 minutos          ⏱ 10 minutos           ⏱ 4 semanas
"Get a world-class    "Plan your next 12      "Know exactly what's
marketing strategy    months of content       working and why and
customized for        down to the last        have AI scale it."
your business."       detail."
```

### MktHoney adaptação:
```
⏱ 5 minutos          ⏱ 10 minutos           ⏱ 30 dias
"Configure sua marca  "Ative o Conselho.      "Saiba exatamente o
no Brand Hub.         23 especialistas        que funciona. Escale
Paleta, voz, público  analisam, debatem       com IA no piloto
— tudo em um wizard." e recomendam."          automático."
```

**Por que funciona:** Mostra velocidade de resultado. O usuário vê que em 5 min já tem valor. Baixa barreira de entrada.

---

## 6. FEATURES — Padrão alternado

### Blaze usa 4 blocos, alternando layout:

```
Bloco 1: Texto esquerda + Imagem direita (Estratégia)
Bloco 2: Carousel de slides com bullets animados (Controle)
Bloco 3: Imagem centralizada — laptop mockup (Auto-geração)
Bloco 4: Texto esquerda + Imagem direita (Analytics)
```

### MktHoney deve fazer:
```
Bloco 1: O Conselho — texto + grid de conselheiros (DIFERENCIAL)
Bloco 2: Carousel de features — 3-4 slides com progress bar (Inteligência/Biblioteca/Operações)
Bloco 3: Content Autopilot — laptop mockup centralizado
Bloco 4: War Room / Funnel Autopsy — dashboard screenshot
```

**Carousel do Blaze (copiar a mecânica):**
- Swiper.js com autoplay 5s
- Bullets com progress bar animado (barra preenche durante autoplay)
- Reseta ao trocar slide
- No mobile: desativa carousel, empilha verticalmente

---

## 7. CALCULADORA DE ECONOMIA — Elemento mais forte

### Blaze faz:
```
Título: "Agency-level strategy, content, and insights for 1% of the price."
Sub: "See how much you save with everything under one roof."

Checkboxes: [x] Organic Social | [x] Short Form Video | [x] Paid Ads | [x] SEO | [x] Email
Team Size: [spinner ▲▼] (mín. 1)

Tabela dinâmica mostrando custo por categoria:
- Agency: $5.000-$10.000/mês por categoria
- Ferramenta A: $XXX/mês
- Ferramenta B: $XXX/mês
- Ferramenta C: $XXX/mês

Resultado dinâmico:
→ "Monthly Savings: $XX.XXX"
→ "Annual Savings: $XXX.XXX"
```

### MktHoney adaptação:
```
Título: "Quanto você gasta hoje com marketing?"
Sub: "Veja quanto economiza com tudo numa única plataforma."

Checkboxes: [x] Conteúdo Social | [x] Análise Competitiva | [x] Campanhas Ads | [x] SEO | [x] Automação
Nº de marcas: [spinner ▲▼]

Tabela:
- Agência tradicional: R$ 5.000-30.000/mês
- Freelancers: R$ 2.000-8.000/mês
- Tools separadas: R$ 500-2.000/mês
- MktHoney: R$ XX/mês

Resultado:
→ "Economia mensal: R$ XX.XXX"
→ "Economia anual: R$ XXX.XXX"
```

**Técnica:** Input spinner customizado (não nativo do browser). Background dark (#1a1a1a), setas SVG, cálculo em tempo real via JS.

---

## 8. TESTIMONIALS — Formato Blaze

### Blaze faz:
```
Carousel Swiper (4 slides, autoplay 5s):
┌──────────────────────────────────────────┐
│  [Foto avatar]                           │
│  [Badge/pill com contexto]               │
│  "Quote do cliente — 1-2 frases"         │
│  Nome, Cargo                             │
│  [▶ Vídeo YouTube embed]                │
└──────────────────────────────────────────┘
```

### MktHoney:
- **Se tiver depoimentos reais:** copiar exatamente este formato
- **Se não tiver ainda:** usar formato estático com:
  - Métricas internas ("302 testes, 100% pass")
  - Beta testers com resultados reais
  - Ou: substituir por seção "Resultados em Números" com counters animados

---

## 9. NAV — Detalhes técnicos

### Blaze faz:
```
[Logo] ............. [About] [Customers] [Pricing] [Webinar] ... [Sign In] [Book Demo] [Start Trial]
```
- Nav tem 2 estados CSS: `.navbar_blur` (transparente com blur) e `.navbar_solid` (sólido no scroll)
- Mobile: hamburger
- 2 CTAs na nav (demo + trial)

### MktHoney:
```
[Logo MktHoney] ..... [Funcionalidades] [Como Funciona] [O Conselho] [Preços] [FAQ] ... [Login] [Criar Conta Grátis]
```
- Mesmo padrão: blur → sólido no scroll
- Mobile: hamburger + CTA fixo no bottom da tela

---

## 10. CTA — Padrões e frequência

### Blaze tem CTAs em:
| Local | Texto | Tipo |
|-------|-------|------|
| Banner topo | "Upcoming Webinar" | Link |
| Nav (2x) | "Book Demo" + "Start Trial" | Botões |
| Hero | "Start Free Trial" + "Book Demo" | Botões |
| CTA final | "Start Free Trial" | Botão |

**Total: 6 CTAs visíveis** (sem contar o nav que é sticky)

### MktHoney deve ter:
| Local | Texto | Tipo |
|-------|-------|------|
| Banner topo | "Beta aberto — vagas limitadas" | Link dismissível |
| Nav | "Criar Conta Grátis" | Botão |
| Hero | "Começar Grátis →" + "Ver Demo →" | 2 Botões |
| Após "Como Funciona" | "Quero Começar Agora →" | Botão |
| Após Features | "Ver Todas as Funcionalidades →" | Link |
| Após Comparação | "Começar Grátis →" | Botão |
| CTA Final | "Criar Minha Conta Grátis →" | Botão grande |

**Regra:** Micro-copy abaixo de CADA CTA ("Sem cartão de crédito. Cancele quando quiser.")

---

## 11. TÉCNICAS VISUAIS para replicar

### Animações:
| Efeito | Onde | Lib |
|--------|------|-----|
| Counter animado (0 → número) | Métricas de impacto | Intersection Observer + easing |
| Progress bar em bullets | Carousel de features | Swiper.js pagination |
| Marquee infinito | Logo bar | CSS animation + 3x repeat |
| Fade-in no scroll | Seções gerais | GSAP ScrollTrigger |
| Blur → sólido nav | Navbar | CSS transition on scroll |

### Imagens:
- Formato: **.avif** com fallback **.jpg**
- Imagens mobile separadas (`-mobile-` no nome)
- Screenshots reais do produto (não ilustrações)

### Tipografia:
- Blaze usa **Open Sans** (300, 400, 600, 700, 800)
- Fluid typography com CSS custom properties + calc() + vw
- Anti-aliased em todos os elementos

### Cores:
- Blaze: accent azul `#4d65ff`, backgrounds claros
- Sistema de CSS variables para 10 color schemes
- MktHoney: definir paleta própria nas variáveis

---

## 12. O QUE BLAZE NÃO TEM (e nós teremos)

| Elemento | Blaze | MktHoney |
|----------|-------|----------|
| FAQ | NÃO TEM | 10 perguntas com FAQPage schema (AEO) |
| Seção de personas | NÃO TEM | 4 cards de persona |
| O Conselho (diferencial) | NÃO TEM | Grid de 23 conselheiros + debate |
| Answer Capsules | NÃO TEM | Em todas as seções (AEO) |
| Schema markup JSON-LD | SoftwareApplication + Organization básicos | + FAQPage + HowTo + BreadcrumbList |
| Comparação tabular | Calculadora interativa | Tabela + calculadora |
| Seção "Para Quem" | Implícito nos testimonials | Seção dedicada com 4 personas |

---

## 13. RESUMO — O que adotar do Blaze

### COPIAR (mecânica exata):
1. Badge de review acima do H1
2. Dois CTAs no hero (sólido + outline)
3. Logo marquee com CSS mask gradient
4. Counter animado no scroll (métricas)
5. Carousel com progress bar nos bullets
6. Timeline "em X minutos" (velocidade de resultado)
7. Nav blur → sólido no scroll
8. Imagens .avif com fallback .jpg
9. Micro-copy abaixo de todo CTA
10. Banner dismissível no topo

### ADAPTAR:
1. Calculadora de economia → versão BR com R$
2. Feature blocks alternados → incluir nosso grid de Conselheiros
3. Testimonials → começar com texto, evoluir para vídeo
4. Pricing → nossa tabela comparativa mais detalhada

### IGNORAR:
1. Webinar banner (irrelevante para lançamento)
2. Schema básico deles (o nosso é muito mais completo para AEO)
3. Ausência de FAQ (erro deles, nosso diferencial)

### ADICIONAR (nós temos, eles não):
1. FAQ com FAQPage schema (10 perguntas)
2. Answer Capsules em todas as seções
3. Seção "O Conselho" (23 especialistas — nosso killer feature)
4. Seção de Personas explícita
5. HowTo schema
6. Múltiplos JSON-LD stacks
