# MKTHONEY.COM — Estrutura Completa da Landing Page

> Documento de referência para implementação. Contém estrutura, textos sugeridos, hierarquia SEO, AEO (Answer Engine Optimization) e schema markup.

---

## Paleta de Cores

### Cores da Marca
| Nome | Hex | RGB | Uso |
|------|-----|-----|-----|
| Chocolate | #593519 | 89, 53, 25 | Backgrounds sutis, divisores (NÃO texto) |
| Bronze | #895F29 | 137, 95, 41 | Bordas, decoração, hover sutil |
| Honey | #AB8648 | 171, 134, 72 | Labels, captions, texto muted |
| Gold | #E6B447 | 230, 180, 71 | CTAs, links, destaques, accent principal |
| Sand | #CAB792 | 202, 183, 146 | Texto secundário |
| Cream | #F5E8CE | 245, 232, 206 | Texto principal |

### Cores de Interface
| Nome | Hex | Uso |
|------|-----|-----|
| Background | #0D0B09 | Fundo principal (off-black quente) |
| Surface | #1A1612 | Cards, nav, footer, elevações |
| Surface Hover | #241F19 | Hover em cards |
| Accent Hover | #F0C35C | Hover nos CTAs gold |
| CTA Text | #0D0B09 | Texto escuro dentro de botões gold |
| Error/Urgency | #C45B3A | Erros, alertas, badges urgentes (terracota) |
| Success | #7A9B5A | Sucesso, confirmações (verde oliva) |

### CSS Variables
```css
:root {
  --color-background:     #0D0B09;
  --color-surface:        #1A1612;
  --color-surface-hover:  #241F19;
  --color-border:         #895F29;
  --color-text-primary:   #F5E8CE;
  --color-text-secondary: #CAB792;
  --color-text-muted:     #AB8648;
  --color-accent:         #E6B447;
  --color-accent-hover:   #F0C35C;
  --color-accent-text:    #0D0B09;
  --color-error:          #C45B3A;
  --color-success:        #7A9B5A;
  --color-chocolate:      #593519;
  --color-bronze:         #895F29;
  --color-honey:          #AB8648;
  --color-gold:           #E6B447;
  --color-sand:           #CAB792;
  --color-cream:          #F5E8CE;
  --font-family:          'Satoshi', system-ui, -apple-system, sans-serif;
  --spacing-section:      120px;
}
```

---

## Princípios de Design Aplicados

| Princípio | Aplicação |
|-----------|-----------|
| **Answer Capsule** | Cada seção começa com 40-60 palavras autocontidas que uma AI pode extrair e citar |
| **Inverted Pyramid** | Resposta primeiro, detalhe depois, elaboração por último |
| **FAQPage Schema** | FAQ com perguntas conversacionais para maximizar citações por AI |
| **Entity-First SEO** | Brand como entidade reconhecível (Organization + SoftwareApplication schema) |
| **Mobile-First** | Cada viewport = 1 micro-argumento completo (problema → prova → CTA) |
| **E-E-A-T** | Experiência, Expertise, Autoridade, Confiança — sinais em todas as seções |

---

## Hierarquia de Headings (SEO)

```
H1: Sua Agência de Marketing com IA — 24/7, Sem Contratos, Sem Equipe
  H2: O Problema
  H2: O Que é o MktHoney
  H2: Como Funciona
    H3: Passo 1 — Configure Sua Marca
    H3: Passo 2 — Ative o Conselho
    H3: Passo 3 — Execute e Escale
  H2: O Conselho — 23 Especialistas de Marketing a Seu Serviço
    H3: Inteligência de Agência
    H3: Debate Multi-Agente
  H2: Funcionalidades
    H3: Ala de Inteligência
    H3: Ala de Biblioteca
    H3: Ala de Operações
  H2: Para Quem é o MktHoney
  H2: Por Que Escolher o MktHoney
  H2: Depoimentos
  H2: Planos e Preços (quando definido)
  H2: Perguntas Frequentes
  H2: Comece Agora — Sua Marca Merece uma Agência de Verdade
```

---

## Estrutura Seção por Seção

---

### 0. BARRA DE NAVEGAÇÃO (Sticky)

```
Logo MktHoney | Funcionalidades | Como Funciona | O Conselho | Preços | FAQ | [Criar Conta Grátis] (botão CTA)
```

- Sticky no scroll (aparece após hero)
- CTA no canto direito, cor de alto contraste
- Mobile: hamburger menu + CTA fixo no bottom

---

### 1. HERO (Above the Fold)

**H1:**
```
Sua Agência de Marketing com IA — 24/7, Sem Contratos, Sem Equipe
```

**Subheadline (1-2 frases):**
```
23 lendas do marketing, como Gary Halbert, Eugene Schwartz e Russell Brunson,
trabalhando juntas pela sua marca. Estratégia, conteúdo, análise e execução
— tudo automatizado, tudo com a voz da sua marca.
```

**CTA Primário:**
```
[Começar Grátis →]
```

**Micro-copy abaixo do CTA:**
```
Sem cartão de crédito. Setup em 5 minutos.
```

**Social Proof Inline (abaixo do CTA):**
```
⭐ 4.9/5 — Usado por +500 marcas e profissionais de marketing
```

**Visual:** Screenshot do dashboard ou hero illustration mostrando o "Conselho" (debate entre conselheiros AI). Deve ser o LCP element — usar `priority` no next/image.

**Answer Capsule (invisível para UI, visível para crawlers via `<p>` semântico):**
```
MktHoney é uma plataforma SaaS de marketing com inteligência artificial que substitui
agências externas. Reúne 23 conselheiros AI baseados em lendas do marketing, oferecendo
estratégia, criação de conteúdo, análise competitiva e automação de campanhas — tudo
operando 24/7 com a identidade de voz da sua marca.
```

---

### 2. BARRA DE LOGOS (Social Proof Visual)

```
Confiado por marcas como: [Logo1] [Logo2] [Logo3] [Logo4] [Logo5] [Logo6]
```

- Se ainda não tiver logos de clientes, usar: "Construído com tecnologia de:" + logos do Google Gemini, Firebase, Pinecone, Vercel
- Ou: "Visto em:" + logos de publicações/premiações

---

### 3. O PROBLEMA (Pain Section)

**H2:**
```
O Marketing da Sua Marca Está Preso em 2020
```

**Texto:**
```
Você contrata uma agência que cobra R$ 5.000/mês e entrega
relatórios genéricos. Ou monta uma equipe interna que custa
3x mais e ainda depende de freelancers.

Enquanto isso, seus concorrentes:
```

**3 Pain Points (cards visuais):**

```
❌ Publicam conteúdo 5x mais rápido que você
❌ Analisam seu funil e roubam suas ideias com IA
❌ Operam 24/7 enquanto sua equipe trabalha 8h
```

**Transição:**
```
E se você tivesse uma agência completa — com 23 especialistas —
trabalhando exclusivamente para sua marca, por uma fração do custo?
```

---

### 4. O QUE É O MKTHONEY (Solution Reveal)

**H2:**
```
O Que é o MktHoney — Sua Agência de Marketing Autônoma
```

**Answer Capsule:**
```
MktHoney é uma plataforma de marketing autônomo que transforma qualquer marca
em uma operação de alta performance. Utilizando 23 conselheiros de IA baseados
em frameworks reais de lendas como Gary Halbert, David Ogilvy e Eugene Schwartz,
a plataforma cobre desde inteligência competitiva até criação de conteúdo e
automação de campanhas — tudo personalizado com a voz e identidade da sua marca.
```

**3 Pilares (cards visuais com ícone):**

```
🧠 INTELIGÊNCIA          📚 BIBLIOTECA           ⚡ OPERAÇÕES
Espionagem competitiva,   Cofre criativo,          Calendário editorial,
social listening,         blueprints de funil,      automação de campanhas,
keyword mining,           templates de conteúdo,    publicação multi-canal,
pesquisa de mercado       DNA de copy              testes A/B em tempo real
```

**Métrica de Impacto:**
```
-80% no tempo de criação | 100% consistência de marca | -90% vs. custo de agência | 24/7 operação
```

---

### 5. COMO FUNCIONA (3-Step Process)

**H2:**
```
Como Funciona — Da Configuração à Execução em 3 Passos
```

**H3: Passo 1 — Configure Sua Marca**
```
Cadastre-se e passe pelo Brand Hub — nosso wizard de identidade.
Em 5 minutos, defina sua paleta de cores, tom de voz, público-alvo,
concorrentes e posicionamento. O MktHoney absorve tudo e cria
um perfil de marca que guia cada decisão de IA.
```

**H3: Passo 2 — Ative o Conselho**
```
Escolha uma missão: criar uma campanha, diagnosticar seu funil,
espionar um concorrente, ou gerar conteúdo para a semana inteira.
23 conselheiros de IA analisam sua marca, debatem entre si e
entregam recomendações unânimes com score de confiança.
```

**H3: Passo 3 — Execute e Escale**
```
Aprove as sugestões, ajuste se quiser, e publique direto da plataforma.
O MktHoney cuida do calendário editorial, testes A/B, monitoramento
de performance e alerta você quando algo precisa de atenção.
Sua marca opera no piloto automático — com inteligência de agência.
```

**CTA Secundário:**
```
[Quero Começar Agora →]
Sem cartão de crédito. Cancele quando quiser.
```

---

### 6. O CONSELHO — 23 ESPECIALISTAS (Differentiator Section)

**H2:**
```
O Conselho — 23 Especialistas de Marketing, Trabalhando Juntos Pela Sua Marca
```

**Answer Capsule:**
```
O diferencial do MktHoney é o Conselho: 23 conselheiros de IA, cada um modelado
com os frameworks, métodos e critérios reais de uma lenda do marketing mundial.
Não são personas genéricas — são sistemas de avaliação estruturados que debatem
entre si e chegam a um veredito unificado para cada decisão da sua marca.
```

**Grid de Conselheiros (mostrar 6-8 com foto/avatar + especialidade):**

```
🎯 Gary Halbert           📝 Eugene Schwartz         🔥 Russell Brunson
   Direct Response            5 Níveis de Consciência     Funis de Conversão

📊 David Ogilvy           🧲 Claude Hopkins          💡 Seth Godin
   Branding & Research        Publicidade Científica      Marketing de Permissão

🎪 P.T. Barnum            📈 Jay Abraham             ...e mais 15 especialistas
   Showmanship                Growth & Partnerships
```

**H3: Como o Debate Multi-Agente Funciona**
```
Quando você pede uma análise, não é uma IA genérica respondendo.
Múltiplos conselheiros avaliam sua marca usando seus próprios frameworks:

1. Cada conselheiro analisa pelo seu prisma especializado
2. Eles debatem pontos de concordância e divergência
3. O sistema consolida um veredito com score de confiança
4. Você recebe recomendações fundamentadas em múltiplas perspectivas

É como ter uma mesa redonda com as maiores mentes do marketing —
disponível 24/7, exclusivamente para a sua marca.
```

---

### 7. FUNCIONALIDADES (Feature Deep-Dive)

**H2:**
```
Tudo Que Sua Marca Precisa — Em Uma Única Plataforma
```

**H3: Ala de Inteligência — Saiba Tudo Sobre Seu Mercado**

| Funcionalidade | O Que Faz |
|----------------|-----------|
| **Social Listening** | Monitora menções, hashtags e sentimento da sua marca em tempo real |
| **Spy Agent** | Dossier completo de concorrentes: tech stack, funis, SWOT, estratégias |
| **Keywords Miner** | Demanda por plataforma e estágio do funil, com volume e dificuldade |
| **Deep Research** | Pesquisa automatizada de mercado com dossier consolidado |
| **Audience Deep-Scan** | Personas e scoring de propensão por segmento |
| **Trend Radar** | RSS + Google News com oportunidades de mercado filtradas |

**H3: Ala de Biblioteca — Seu Arsenal Criativo**

| Funcionalidade | O Que Faz |
|----------------|-----------|
| **Creative Vault** | Repositório versionado de criativos aprovados com workflow de aprovação |
| **Copy DNA** | Headlines, hooks e estruturas por estágio de consciência |
| **Funnel Blueprints** | Templates de funil validados e prontos para usar |
| **Conversion Predictor** | Score preditivo de conversão em 6 dimensões |
| **Content Autopilot** | Curadoria e adaptação automática de conteúdo |

**H3: Ala de Operações — Execução No Piloto Automático**

| Funcionalidade | O Que Faz |
|----------------|-----------|
| **Content Calendar** | Calendário editorial visual com drag-and-drop e 6 estados de aprovação |
| **Content Generation** | Posts, stories, carrosséis e reels com Brand Voice injetada |
| **A/B Testing** | Testes automatizados com atribuição determinística e significância estatística |
| **Campaign Automation** | Personalização por persona usando o modelo de 5 níveis de Schwartz |
| **Performance War Room** | Dashboard multi-canal com detecção de anomalias em tempo real |
| **Funnel Autopsy** | Cole uma URL e receba diagnóstico forense de falhas de conversão |
| **Offer Lab** | Wizard de criação de oferta inspirado em Alex Hormozi + Score de Irresistibilidade |

**CTA:**
```
[Ver Todas as Funcionalidades →]
```

---

### 8. PARA QUEM É O MKTHONEY (Use Cases / Personas)

**H2:**
```
Para Quem é o MktHoney — Do Empreendedor Solo à Agência
```

**4 Cards de Persona:**

```
👤 EMPREENDEDOR / INFOPRODUTOR
"Meu funil parou de converter e não sei por quê"
→ Funnel Autopsy diagnostica em 60 segundos
→ 23 conselheiros sugerem correções específicas
→ Content Autopilot mantém presença constante

👤 MEDIA BUYER / PERFORMANCE
"Tráfego barato, mas a oferta não segura os leads"
→ Offer Lab cria ofertas irresistíveis
→ Spy Agent revela o que os concorrentes estão fazendo
→ A/B Testing otimiza criativos automaticamente

👤 GERENTE DE MARKETING
"Preciso de visibilidade sobre o funil e ações rápidas"
→ War Room centraliza métricas de todos os canais
→ Audience Deep-Scan mapeia segmentos quentes
→ Calendar organiza toda a operação editorial

👤 AGÊNCIA / MULTI-MARCA
"Gerencio 10 marcas e cada uma precisa de consistência"
→ Multi-Brand com isolamento total de dados
→ Brand Voice garante consistência por marca
→ Dashboard unificado para todas as operações
```

---

### 9. POR QUE ESCOLHER O MKTHONEY (Comparison / Trust)

**H2:**
```
Por Que Escolher o MktHoney em Vez de uma Agência Tradicional
```

**Tabela Comparativa:**

| Critério | Agência Tradicional | Freelancers | MktHoney |
|----------|-------------------|-------------|----------|
| **Custo mensal** | R$ 5.000 - R$ 30.000 | R$ 2.000 - R$ 8.000 | A partir de R$ XX/mês |
| **Disponibilidade** | Horário comercial | Variável | 24/7, sempre |
| **Tempo de entrega** | 5-15 dias úteis | 3-7 dias úteis | Minutos |
| **Consistência de marca** | Depende do profissional | Baixa | 100% garantida |
| **Inteligência competitiva** | Relatórios mensais | Não incluso | Tempo real |
| **Quantidade de especialistas** | 3-5 por conta | 1 | 23 conselheiros IA |
| **Escalabilidade** | Linear (mais custo) | Limitada | Ilimitada |

---

### 10. SOCIAL PROOF / DEPOIMENTOS

**H2:**
```
O Que Nossos Usuários Dizem
```

**3-4 Testimonials com:**
- Nome completo + foto
- Cargo + empresa
- Resultado específico com métrica
- 2-3 frases no máximo

**Formato:**
```
"Em 30 dias, o MktHoney reduziu nosso tempo de produção de conteúdo
de 2 semanas para 2 horas. O Conselho identificou um gap no nosso
funil que nossa agência anterior nunca viu."

— [Nome], [Cargo] na [Empresa]
   Resultado: +43% em conversão em 30 dias
```

**Se ainda não tiver depoimentos reais:**
- Usar métricas internas (ex: "302 testes automatizados, 100% de aprovação")
- Usar métricas de performance do produto
- Placeholder com "Beta fechado — vagas limitadas"

---

### 11. PLANOS E PREÇOS (quando definido)

**H2:**
```
Planos e Preços — Escolha o Nível Certo Para Sua Marca
```

**Estrutura sugerida (3 tiers):**

```
┌─────────────────┬──────────────────┬──────────────────┐
│    STARTER       │    PRO            │    AGENCY        │
│    R$ XX/mês     │    R$ XX/mês      │    R$ XX/mês     │
│                  │    ⭐ Mais Popular │                  │
│ • 1 marca        │ • 3 marcas        │ • 10+ marcas     │
│ • XX créditos    │ • XX créditos     │ • Créditos ilim. │
│ • Conselho básico│ • Conselho Pro    │ • Conselho Full  │
│ • Social Listen. │ • + Spy Agent     │ • + White Label  │
│ • Calendar       │ • + Automation    │ • + API Access   │
│ • Brand Hub      │ • + A/B Testing   │ • + Suporte Prio │
│                  │ • + War Room      │ • + Onboarding   │
│ [Começar Grátis] │ [Começar Pro →]   │ [Falar com Sales]│
└─────────────────┴──────────────────┴──────────────────┘
```

**Micro-copy abaixo dos preços:**
```
Todos os planos incluem 14 dias grátis. Sem cartão de crédito.
Cancele a qualquer momento. Preço em reais (BRL).
```

---

### 12. FAQ (AEO-Critical Section)

**H2:**
```
Perguntas Frequentes Sobre o MktHoney
```

> **IMPORTANTE para AEO:** Cada resposta deve ter 40-60 palavras, ser autocontida (answer capsule), começar com a resposta direta, e usar linguagem conversacional. Esta seção inteira deve ter FAQPage schema em JSON-LD.

**Q1: O que é o MktHoney?**
```
MktHoney é uma plataforma SaaS de marketing autônomo com inteligência artificial.
Ela reúne 23 conselheiros de IA modelados em lendas do marketing como Gary Halbert,
David Ogilvy e Russell Brunson. A plataforma cobre estratégia, criação de conteúdo,
análise competitiva, automação de campanhas e gestão de funil — tudo personalizado
com a identidade e voz da sua marca, operando 24/7.
```

**Q2: Como os 23 conselheiros de IA funcionam?**
```
Cada conselheiro é modelado com os frameworks reais de uma lenda do marketing.
Quando você faz uma consulta, múltiplos conselheiros analisam usando seus critérios
específicos, debatem entre si e entregam um veredito unificado com score de confiança.
Não são chatbots genéricos — são sistemas de avaliação estruturados com red flags,
gold standards e critérios ponderados.
```

**Q3: Preciso ter conhecimento técnico para usar o MktHoney?**
```
Não. O MktHoney foi projetado para ser usado por qualquer pessoa, do empreendedor
solo ao gerente de marketing. O setup inicial leva 5 minutos pelo Brand Hub wizard.
A plataforma traduz estratégias complexas em ações práticas que você pode aprovar
e publicar com um clique.
```

**Q4: O MktHoney substitui minha agência de marketing?**
```
Sim, esse é o objetivo. O MktHoney entrega inteligência estratégica, criação de
conteúdo, análise competitiva, automação de campanhas e monitoramento de performance
— funções que normalmente exigem uma equipe de 5-10 pessoas. A diferença: opera 24/7,
mantém 100% de consistência de marca e custa uma fração do preço de uma agência.
```

**Q5: Meus dados estão seguros?**
```
Sim. O MktHoney usa isolamento total de dados por marca (multi-tenant), encriptação
AES-256-GCM para tokens de API, e autenticação Firebase Auth. Cada marca tem seu
próprio namespace no banco vetorial. Nenhum dado de uma marca é acessível por outra.
Suas credenciais de redes sociais são armazenadas com criptografia de nível bancário.
```

**Q6: Quais redes sociais o MktHoney suporta?**
```
Atualmente o MktHoney integra com Instagram (Graph API), Meta Ads, Google Ads e
LinkedIn. Integrações com TikTok estão no roadmap. A plataforma gera conteúdo
otimizado para posts, stories, carrosséis e reels, adaptando formato e linguagem
para cada plataforma automaticamente.
```

**Q7: Posso gerenciar múltiplas marcas?**
```
Sim. O MktHoney suporta gerenciamento multi-marca com isolamento total de dados.
Cada marca tem seu próprio Brand Hub, voz de marca, conselheiros configurados e
métricas independentes. Você pode alternar entre marcas instantaneamente. O plano
Agency é ideal para agências e profissionais que gerenciam múltiplos clientes.
```

**Q8: O que é o Funnel Autopsy?**
```
Funnel Autopsy é o diagnóstico forense de funil do MktHoney. Você cola a URL do
seu funil e em menos de 60 segundos recebe uma análise completa de falhas de
conversão, usando 5 heurísticas diferentes. Os 23 conselheiros avaliam cada etapa
e entregam recomendações específicas para melhorar sua taxa de conversão.
```

**Q9: O que é o Offer Lab?**
```
Offer Lab é um wizard de criação de ofertas inspirado na metodologia de Alex
Hormozi. Você insere os dados da sua oferta e recebe um Score de Irresistibilidade
calculado por múltiplos conselheiros. O sistema identifica pontos fracos e sugere
melhorias para transformar sua oferta em algo que seu público não pode recusar.
```

**Q10: MktHoney usa qual tecnologia de IA?**
```
MktHoney é construído sobre Google Gemini (modelos Flash e Pro), com RAG
(Retrieval-Augmented Generation) usando Pinecone como banco vetorial. Cada resposta
da IA é fundamentada no conhecimento específico da sua marca, não em respostas
genéricas. A plataforma roda em Next.js 16, React 19 e Firebase, com deploy na
Vercel (região São Paulo).
```

---

### 13. CTA FINAL (Closing Section)

**H2:**
```
Comece Agora — Sua Marca Merece uma Agência de Verdade
```

**Texto:**
```
Chega de pagar caro por resultados medíocres. Chega de esperar
semanas por um relatório que não muda nada. O MktHoney coloca
23 dos maiores estrategistas de marketing do mundo trabalhando
pela sua marca — agora, 24/7, no piloto automático.
```

**CTA Grande (centralizado):**
```
[Criar Minha Conta Grátis →]
```

**Micro-copy:**
```
14 dias grátis. Sem cartão de crédito. Setup em 5 minutos.
Cancele quando quiser.
```

**Trust Signals Finais:**
```
🔒 Dados encriptados AES-256 | 🇧🇷 Servidores no Brasil | ⚡ 302 testes automatizados, 100% aprovação
```

---

### 14. FOOTER

```
MktHoney

Produto                     Recursos                    Empresa
─────────                   ─────────                   ─────────
Funcionalidades             Blog                        Sobre Nós
Preços                      Central de Ajuda            Contato
Changelog                   API Docs                    Carreiras
Status                      Comunidade                  Imprensa

Legal
─────────
Termos de Uso | Política de Privacidade | LGPD

Redes Sociais: [Instagram] [LinkedIn] [Twitter/X] [YouTube]

© 2026 MktHoney. Todos os direitos reservados.
```

---

## Schema Markup (JSON-LD) — Implementar no `<head>`

### 1. SoftwareApplication

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "MktHoney",
  "description": "Plataforma SaaS de marketing autônomo com 23 conselheiros de IA baseados em lendas do marketing. Substitui agências externas com estratégia, conteúdo, análise competitiva e automação — 24/7.",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web Browser",
  "url": "https://mkthoney.com",
  "screenshot": "https://mkthoney.com/images/dashboard-preview.png",
  "offers": {
    "@type": "AggregateOffer",
    "lowPrice": "0",
    "highPrice": "XXX",
    "priceCurrency": "BRL",
    "offerCount": "3"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "reviewCount": "XXX",
    "bestRating": "5"
  },
  "featureList": [
    "23 AI Marketing Counselors",
    "Multi-Agent Debate System",
    "Funnel Autopsy Diagnostic",
    "Competitive Intelligence (Spy Agent)",
    "Content Calendar with Auto-Publishing",
    "A/B Testing with Statistical Significance",
    "Brand Voice Compliance Gate",
    "Multi-Brand Management",
    "Offer Engineering Lab",
    "Social Listening & Trend Radar"
  ]
}
```

### 2. Organization

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "MktHoney",
  "url": "https://mkthoney.com",
  "logo": "https://mkthoney.com/images/logo.png",
  "description": "Plataforma de marketing autônomo com inteligência artificial.",
  "foundingDate": "2026",
  "sameAs": [
    "https://www.linkedin.com/company/mkthoney",
    "https://www.instagram.com/mkthoney",
    "https://twitter.com/mkthoney",
    "https://www.youtube.com/@mkthoney"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer support",
    "availableLanguage": ["Portuguese", "English"],
    "url": "https://mkthoney.com/contato"
  }
}
```

### 3. FAQPage (toda a seção FAQ)

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "O que é o MktHoney?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "MktHoney é uma plataforma SaaS de marketing autônomo com inteligência artificial. Ela reúne 23 conselheiros de IA modelados em lendas do marketing como Gary Halbert, David Ogilvy e Russell Brunson. A plataforma cobre estratégia, criação de conteúdo, análise competitiva, automação de campanhas e gestão de funil — tudo personalizado com a identidade e voz da sua marca, operando 24/7."
      }
    },
    {
      "@type": "Question",
      "name": "Como os 23 conselheiros de IA funcionam?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Cada conselheiro é modelado com os frameworks reais de uma lenda do marketing. Quando você faz uma consulta, múltiplos conselheiros analisam usando seus critérios específicos, debatem entre si e entregam um veredito unificado com score de confiança. Não são chatbots genéricos — são sistemas de avaliação estruturados com red flags, gold standards e critérios ponderados."
      }
    },
    {
      "@type": "Question",
      "name": "Preciso ter conhecimento técnico para usar o MktHoney?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Não. O MktHoney foi projetado para ser usado por qualquer pessoa, do empreendedor solo ao gerente de marketing. O setup inicial leva 5 minutos pelo Brand Hub wizard. A plataforma traduz estratégias complexas em ações práticas que você pode aprovar e publicar com um clique."
      }
    },
    {
      "@type": "Question",
      "name": "O MktHoney substitui minha agência de marketing?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Sim, esse é o objetivo. O MktHoney entrega inteligência estratégica, criação de conteúdo, análise competitiva, automação de campanhas e monitoramento de performance — funções que normalmente exigem uma equipe de 5-10 pessoas. A diferença: opera 24/7, mantém 100% de consistência de marca e custa uma fração do preço de uma agência."
      }
    },
    {
      "@type": "Question",
      "name": "Meus dados estão seguros no MktHoney?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Sim. O MktHoney usa isolamento total de dados por marca (multi-tenant), encriptação AES-256-GCM para tokens de API, e autenticação Firebase Auth. Cada marca tem seu próprio namespace no banco vetorial. Nenhum dado de uma marca é acessível por outra."
      }
    },
    {
      "@type": "Question",
      "name": "Quais redes sociais o MktHoney suporta?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Atualmente o MktHoney integra com Instagram (Graph API), Meta Ads, Google Ads e LinkedIn. Integrações com TikTok estão no roadmap. A plataforma gera conteúdo otimizado para posts, stories, carrosséis e reels, adaptando formato e linguagem para cada plataforma automaticamente."
      }
    },
    {
      "@type": "Question",
      "name": "Posso gerenciar múltiplas marcas no MktHoney?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Sim. O MktHoney suporta gerenciamento multi-marca com isolamento total de dados. Cada marca tem seu próprio Brand Hub, voz de marca, conselheiros configurados e métricas independentes. Você pode alternar entre marcas instantaneamente."
      }
    },
    {
      "@type": "Question",
      "name": "O que é o Funnel Autopsy do MktHoney?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Funnel Autopsy é o diagnóstico forense de funil do MktHoney. Você cola a URL do seu funil e em menos de 60 segundos recebe uma análise completa de falhas de conversão, usando 5 heurísticas diferentes. Os 23 conselheiros avaliam cada etapa e entregam recomendações específicas."
      }
    },
    {
      "@type": "Question",
      "name": "O que é o Offer Lab do MktHoney?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Offer Lab é um wizard de criação de ofertas inspirado na metodologia de Alex Hormozi. Você insere os dados da sua oferta e recebe um Score de Irresistibilidade calculado por múltiplos conselheiros. O sistema identifica pontos fracos e sugere melhorias para transformar sua oferta em algo irrecusável."
      }
    },
    {
      "@type": "Question",
      "name": "Qual tecnologia de IA o MktHoney usa?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "MktHoney é construído sobre Google Gemini (modelos Flash e Pro), com RAG (Retrieval-Augmented Generation) usando Pinecone como banco vetorial. Cada resposta da IA é fundamentada no conhecimento específico da sua marca, não em respostas genéricas."
      }
    }
  ]
}
```

### 4. HowTo (seção "Como Funciona")

```json
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "Como usar o MktHoney para automatizar seu marketing",
  "description": "Configure sua marca, ative os 23 conselheiros de IA e comece a executar campanhas de marketing automatizadas em 3 passos simples.",
  "totalTime": "PT5M",
  "step": [
    {
      "@type": "HowToStep",
      "name": "Configure Sua Marca",
      "text": "Cadastre-se e passe pelo Brand Hub wizard. Em 5 minutos, defina sua paleta de cores, tom de voz, público-alvo, concorrentes e posicionamento.",
      "url": "https://mkthoney.com/#como-funciona"
    },
    {
      "@type": "HowToStep",
      "name": "Ative o Conselho",
      "text": "Escolha uma missão: criar uma campanha, diagnosticar seu funil, espionar um concorrente, ou gerar conteúdo. 23 conselheiros de IA analisam, debatem e entregam recomendações.",
      "url": "https://mkthoney.com/#como-funciona"
    },
    {
      "@type": "HowToStep",
      "name": "Execute e Escale",
      "text": "Aprove as sugestões, ajuste se quiser, e publique direto da plataforma. O MktHoney cuida do calendário editorial, testes A/B e monitoramento de performance.",
      "url": "https://mkthoney.com/#como-funciona"
    }
  ]
}
```

### 5. BreadcrumbList

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://mkthoney.com"
    }
  ]
}
```

---

## Metadata (Next.js generateMetadata)

```typescript
export const metadata: Metadata = {
  metadataBase: new URL('https://mkthoney.com'),
  title: {
    default: 'MktHoney — Sua Agência de Marketing com IA | 23 Conselheiros, 24/7',
    template: '%s | MktHoney',
  },
  description: 'MktHoney é a plataforma de marketing autônomo com 23 conselheiros de IA baseados em lendas do marketing. Estratégia, conteúdo, análise competitiva e automação — tudo com a voz da sua marca, 24/7.',
  keywords: [
    'marketing com inteligência artificial',
    'agência de marketing IA',
    'automação de marketing',
    'marketing autônomo',
    'conselheiros de marketing IA',
    'funil de vendas IA',
    'plataforma de marketing SaaS',
    'criação de conteúdo IA',
    'análise competitiva IA',
    'MktHoney',
  ],
  authors: [{ name: 'MktHoney' }],
  creator: 'MktHoney',
  publisher: 'MktHoney',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large' as const,
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://mkthoney.com',
    siteName: 'MktHoney',
    title: 'MktHoney — Sua Agência de Marketing com IA | 23 Conselheiros, 24/7',
    description: 'MktHoney é a plataforma de marketing autônomo com 23 conselheiros de IA baseados em lendas do marketing. Estratégia, conteúdo, análise competitiva e automação — tudo com a voz da sua marca.',
    images: [{
      url: '/og-image.png',
      width: 1200,
      height: 630,
      alt: 'MktHoney — Plataforma de Marketing Autônomo com IA',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MktHoney — Sua Agência de Marketing com IA',
    description: '23 conselheiros de IA baseados em lendas do marketing. Estratégia, conteúdo, análise e automação — 24/7, com a voz da sua marca.',
    creator: '@mkthoney',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: 'https://mkthoney.com',
  },
}
```

---

## Checklist Técnico SEO/AEO

### SEO Fundamental
- [ ] Title tag ≤ 60 caracteres com keyword primária no início
- [ ] Meta description 120-155 caracteres com CTA suave
- [ ] Canonical tag auto-referenciando
- [ ] 1x H1 por página, H2 para seções, H3 para sub-seções
- [ ] Semantic HTML: `<main>`, `<section>`, `<article>`, `<nav>`, `<footer>`
- [ ] `<figure>` + `<figcaption>` para screenshots
- [ ] `<time datetime="...">` para datas
- [ ] Sitemap.xml gerado via Next.js `sitemap.ts`
- [ ] robots.txt via Next.js `robots.ts` (bloquear /api/, /dashboard/, /_next/)
- [ ] OG Image 1200x630px, < 1MB, com logo + texto legível em 600x315
- [ ] Alternate hreflang se tiver versão em inglês

### Core Web Vitals
- [ ] LCP ≤ 2.5s — hero image com `priority` + preload de font
- [ ] INP ≤ 200ms — scripts terceiros com `strategy="lazyOnload"`
- [ ] CLS ≤ 0.1 — width/height explícitos em todas as imagens
- [ ] SSG para todas as páginas públicas (não CSR)
- [ ] React Server Components para data-fetching
- [ ] `"use client"` apenas para componentes interativos

### AEO / GEO (Answer Engine Optimization)
- [ ] Answer Capsule (40-60 palavras) no início de cada seção principal
- [ ] FAQPage schema com 10 perguntas conversacionais
- [ ] HowTo schema na seção "Como Funciona"
- [ ] SoftwareApplication schema com featureList
- [ ] Organization schema com `sameAs` (LinkedIn, Instagram, Twitter, YouTube)
- [ ] Headings H2 em formato de pergunta conversacional onde possível
- [ ] Seções com 120-180 palavras entre headings (sweet spot para citação)
- [ ] Dados específicos e métricas (não linguagem vaga)
- [ ] Sem conteúdo atrás de login/paywall nas páginas públicas
- [ ] robots.txt NÃO bloqueia GPTBot, ClaudeBot, PerplexityBot

### Preparação para Entidade (Knowledge Graph)
- [ ] Nome "MktHoney" consistente em TODAS as menções externas
- [ ] Perfis criados: LinkedIn Company, Instagram, Twitter/X, YouTube
- [ ] Cadastro em G2, Capterra, Product Hunt (quando lançar)
- [ ] Google Business Profile (mesmo para SaaS)
- [ ] Wikidata entry (quando elegível)
- [ ] About page com história, equipe, missão (Person schema nos founders)
- [ ] Menções em Reddit, Quora, LinkedIn Pulse sobre tópicos relevantes

---

## Keywords Primárias (SEO Target)

| Keyword | Volume Est. | Dificuldade | Intent |
|---------|------------|-------------|--------|
| agência de marketing com IA | Alto | Média | Comercial |
| marketing autônomo | Médio | Baixa | Informacional/Comercial |
| automação de marketing IA | Alto | Alta | Comercial |
| conselheiros de marketing IA | Baixo | Baixa | Informacional |
| plataforma de marketing SaaS | Médio | Média | Comercial |
| funil de vendas inteligente | Médio | Média | Comercial |
| diagnóstico de funil | Baixo | Baixa | Informacional |
| criação de conteúdo com IA | Alto | Alta | Comercial |
| análise competitiva automática | Médio | Média | Comercial |
| marketing com inteligência artificial Brasil | Médio | Baixa | Comercial/Local |

---

## Ordem de Implementação Recomendada

1. **Fase 1 — Landing Page SSG** (esta estrutura)
2. **Fase 2 — Blog com Topic Clusters** (pillar: "Marketing Autônomo com IA")
3. **Fase 3 — Glossário** (/glossario/[termo] — alto valor para AEO)
4. **Fase 4 — Comparações** (/compare/[agencia-tradicional], /compare/[ferramenta-x])
5. **Fase 5 — Case Studies** por vertical (infoproduto, SaaS, e-commerce, agência)
