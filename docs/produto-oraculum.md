# MKTHONEY — Conselho de Funil

## O que é

O MKTHONEY (Conselho de Funil) é uma plataforma SaaS de marketing autônomo movida por IA. A proposta central é permitir que **uma única pessoa opere com a capacidade de uma equipe de marketing de 10+ pessoas**, utilizando 23 conselheiros de IA baseados em frameworks de lendas do marketing (Gary Halbert, Russell Brunson, David Ogilvy, Eugene Schwartz, Dan Kennedy, entre outros).

**Tagline:** *"Não é uma luta justa — Uma pessoa. Uma plataforma. A operação de marketing inteira."*

---

## Problema que resolve

- Contratar uma equipe completa de marketing (copywriter, gestor de tráfego, social media, analista de dados, diretor criativo) é caro e complexo de gerenciar.
- Empreendedores solo e pequenas empresas não têm recursos para operar marketing em escala.
- A execução de marketing fica fragmentada entre dezenas de ferramentas desconectadas.
- Inteligência competitiva em tempo real exige pesquisa dedicada e constante.
- Escalar produção de conteúdo sem perder a consistência da voz da marca é extremamente difícil.

---

## Como funciona

### Arquitetura de Conselheiros (Brain System)

O coração do produto é o sistema de **23 conselheiros especializados**, cada um com uma "identity card" (brain) que define sua personalidade, frameworks e critérios de análise. Os conselheiros são organizados por especialidade:

| Categoria | Conselheiros | Especialidade |
|-----------|-------------|---------------|
| **Funnel Masters** (6) | Russell Brunson, Dan Kennedy, Frank Kern, Sam Ovens, Ryan Deiss, Perry Belcher | Arquitetura de funis, value ladder, offers |
| **Copy Specialists** (9) | Gary Halbert, Eugene Schwartz, Claude Hopkins, Joseph Sugarman, David Ogilvy, John Carlton, Drayton Bird, entre outros | Copy de resposta direta, headlines, VSLs, emails |
| **Social Directors** (4) | Lia Haberman, Rachel Karten, Nikita Beer, Justin Welsh | Estratégia social, hooks, conteúdo orgânico |
| **Traffic Directors** (4) | Justin Brooke, Nicholas Kusmich, Jon Loomer, Savannah Sanchez | Mídia paga, segmentação, otimização de ads |
| **Design Director** (1) | Design Director | Direção de arte, hierarquia visual, UX |

**Modos de chat disponíveis:**
- `general` — Conselho estratégico geral
- `funnel_creation` — Assistência na criação de funis
- `copy` — Copywriting com 9 especialistas
- `social` — Conteúdo social com 4 diretores
- `ads` — Tráfego e anúncios com 4 diretores
- `design` — Direção de arte
- `party` — Debate multi-agente onde conselheiros selecionados debatem e chegam a um consenso com score de confiança

### RAG (Retrieval-Augmented Generation)

O sistema usa Pinecone como banco vetorial para busca semântica sobre:

1. **Knowledge Base** — Frameworks curados dos conselheiros (ensaios, metodologias, scorecards). Chunks de 500-1000 tokens com metadata por conselheiro, tipo de documento e escopo.
2. **Brand Assets** — Documentos enviados pelo usuário (PDFs, análises de concorrentes, guidelines da marca). Extraídos via PDF parsing e web scraping.

Quando o usuário faz uma pergunta, o sistema busca em ambas as coleções em paralelo, aplica reranking (Cohere) e injeta os chunks mais relevantes no contexto do Gemini.

---

## Pilares do Produto

### 1. Inteligência

Módulo de espionagem competitiva e pesquisa de mercado.

- **Keywords Miner** — Mineração de keywords via Google Autocomplete com scoring de volume, dificuldade e estágio de funil (KOS — Keyword Opportunity Score).
- **Spy Agent (Funnel Autopsy)** — Análise forense de URLs de concorrentes em ~60 segundos. Retorna scores de hook, story, offer, friction e trust.
- **Social Listening** — Monitoramento de menções, hashtags e sentimento em tempo real.
- **Deep Research** — Pesquisa automatizada de mercado via RSS e Google News com detecção de tendências.
- **Audience Scan** — Construção de personas e scoring de propensão de compra.
- **Dashboard de Inteligência** — KPIs consolidados: total de menções, sentimento médio, top keywords, emoção pública (joy, anger, sadness, surprise, fear, neutral).

**Sub-módulos avançados:**
- Attribution — Modelagem de atribuição multi-touch
- LTV — Projeção de Lifetime Value do cliente
- Journey — Mapeamento de jornada do cliente
- Offer Lab — Wizard de criação de ofertas com score preditivo de conversão

### 2. Biblioteca (Vault)

Repositório de ativos criativos e templates.

- **Creative Vault** — Repositório versionado de criativos com score de performance.
- **Copy DNA** — Headlines e hooks calibrados por nível de consciência (Eugene Schwartz).
- **Funnel Blueprints** — Templates de funis validados por vertical.
- **Conversion Predictor** — Score preditivo antes de publicar (baseado em ML).
- **Content Autopilot** — Curadoria automatizada de conteúdo evergreen.

### 3. Operações

Execução e gestão de campanhas.

- **Criação de Funis** — Wizard guiado por IA: objetivo → audiência → oferta → 3-5 propostas de arquitetura → escolha → copy → design → social.
- **Campanhas (Linha de Ouro)** — Execução unificada cross-channel. Cada campanha passa por 5 estágios: Funil → Copy → Social → Design → Ads. O KPI principal é **Congruência (%)** — quanto mais estágios completos, mais alinhada a campanha.
- **Content Calendar** — Calendário editorial drag-and-drop com 6 estados de aprovação.
- **A/B Testing** — Testes com significância estatística e atribuição determinística.
- **War Room** — Dashboard multi-canal com detecção de anomalias.

**Estados de um funil:**
`draft` → `generating` → `review` → `approved` → `adjusting` → `executing` → `completed` | `killed`

---

## Gestão Multi-marca

Cada usuário pode operar **múltiplas marcas isoladas**, cada uma com:
- Identidade própria (nome, vertical, posicionamento, audiência, oferta)
- Assets e documentos separados no RAG
- Funis e campanhas independentes
- Configuração de IA personalizada (temperature e topP por marca)
- Logo e guidelines visuais

Ideal para freelancers e agências que gerenciam múltiplos clientes.

---

## Verdict System (Onboarding)

Após configurar uma marca, o sistema gera automaticamente um **Veredito Estratégico**:
- Análise da marca (posicionamento, audiência, oferta)
- Scores de 0-10 para posicionamento e oferta
- Pontos fortes e fracos identificados
- Itens de ação priorizados

---

## Casos de Uso

### Infoprodutores (Criadores de cursos digitais)
- Criar funis completos: webinar → VSL → checkout → upsell
- Gerar hooks sociais em lote para lançamentos
- Monitorar sentimento em torno do nicho
- A/B testar ofertas antes de escalar

### Fundadores SaaS
- Análise competitiva detalhada de 3-5 concorrentes
- Coordenação de campanhas de lançamento com funil + copy + ads + design alinhados
- Marketing de conteúdo em escala sem contratar equipe

### E-commerce
- Otimização de páginas de produto via funnel autopsy
- Planejamento de campanhas sazonais com a Linha de Ouro
- Inteligência de pricing e posicionamento de concorrentes

### Freelancers e Agências
- Gerenciar 10+ clientes simultaneamente com namespaces isolados
- Usar MKTHONEY como "subcontratado" de IA nos bastidores
- Entregar trabalho de maior qualidade em menos tempo

### Empreendedores Solo
- Substituir contratações por conselho especializado de IA 24/7
- Validar ideias antes de investir em mídia paga
- Competir com empresas maiores sem recursos de agência

---

## Stack Técnico

| Componente | Tecnologia | Função |
|-----------|-----------|--------|
| Frontend | Next.js 16, React 19, TypeScript | Interface do usuário |
| Database | Firebase Firestore | Usuários, marcas, funis, campanhas, conversas |
| Vector DB | Pinecone | Busca semântica sobre frameworks e assets |
| IA | Google Gemini API (Pro + Flash) | Motor de 23 conselheiros, geração de conteúdo, análise |
| Reranking | Cohere Rerank | Relevância dos chunks recuperados |
| Pagamentos | Stripe | Assinaturas e billing |
| Email | Resend | Notificações transacionais |
| Storage | Firebase Storage | Logos, assets, documentos |
| Analytics | PostHog | Tracking de uso |
| Deploy | Vercel | Hospedagem e CI/CD |

---

## Modelo de Negócio

### Planos

| Plano | Preço | Público |
|-------|-------|---------|
| **Free** | R$0 (trial 14 dias) | Teste completo sem limitação de features |
| **Starter** | R$97/mês | Empreendedores solo |
| **Pro** | R$297/mês | Negócios em crescimento |
| **Agency** | R$597/mês | Freelancers e agências |

### Limites por Tier
Cada plano define limites de:
- Número de marcas
- Funis ativos simultâneos
- Total de assets no vault
- Documentos no RAG
- Queries de IA por mês
- Análises forenses (page forensics) por mês

### Sistema de Créditos
- Cada mensagem no chat consome 1 crédito
- Créditos são resetados mensalmente
- Ao atingir 0 créditos, paywall direciona para upgrade
- *Atualmente desabilitado durante fase de crescimento*

---

## Diferenciais

1. **Multi-conselheiro, não chatbot genérico** — Cada resposta vem de um especialista com framework real, não de um LLM genérico.
2. **Congruência cross-channel** — A Linha de Ouro garante que funil, copy, social, design e ads falem a mesma língua.
3. **RAG contextual por marca** — O sistema conhece profundamente cada marca do usuário, não dá respostas genéricas.
4. **Party Mode** — Debate entre múltiplos conselheiros com score de confiança, simulando uma sala de estratégia real.
5. **Operação completa, não só geração** — Vai de inteligência competitiva até execução e monitoramento, cobrindo o ciclo completo de marketing.
