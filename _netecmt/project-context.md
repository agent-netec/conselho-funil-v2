# Project Context: Conselho de Funil 🎯
## A Agency Engine

---

## 📝 Visão Geral

O **Conselho de Funil** evoluiu de um SaaS de consultoria estratégica para uma **Agency Engine** — uma plataforma de automação de agência completa que opera de forma autônoma. O sistema utiliza uma arquitetura de **RAG (Retrieval-Augmented Generation)** combinada com um exército de **Agentes Executores** especializados, supervisionados por **Conselheiros Estratégicos** (mentores de marketing renomados).

### 🎯 Proposta de Valor
> "Transformar qualquer marca em uma operação de marketing de alta performance, 24/7, com inteligência de agência enterprise e execução automatizada."

### 🏛️ Metáfora Arquitetural: O Templo
O sistema é organizado como um **Templo** com três **Alas** distintas, cada uma com responsabilidades específicas:

| Ala | Função | Analogia |
|-----|--------|----------|
| **Inteligência** | Coleta e análise de dados externos | Os Olhos e Ouvidos |
| **Biblioteca** | Armazenamento e curadoria de ativos | O Cérebro e Memória |
| **Operações** | Execução e automação de tarefas | As Mãos e Voz |

---

## 🏗️ As Três Alas do Agency Engine

### 🔭 Ala de Inteligência (Intelligence Wing)
**Missão:** Capturar, processar e entregar insights acionáveis do mundo exterior.

| Módulo | Descrição | Fontes de Dados |
|--------|-----------|-----------------|
| **Social Listening** | Monitoramento de menções, sentimentos e tendências em redes sociais | Twitter/X, Instagram, LinkedIn, TikTok |
| **Competitor Intelligence** | Análise de estratégias, criativos e posicionamento de concorrentes | Websites, Ads Library (Meta/Google), Social Profiles |
| **News Radar** | Detecção de notícias e eventos relevantes para o nicho da marca | Google News, RSS Feeds, Industry Blogs |
| **Keyword Mining** | Descoberta de oportunidades de SEO e tendências de busca | Google Trends, Search Console, Semrush API |

**Saídas Principais:**
- Relatórios de Tendências
- Alertas de Oportunidade
- Benchmarks Competitivos
- Mapa de Keywords

---

### 📚 Ala de Biblioteca (Library Wing)
**Missão:** Organizar, versionar e servir ativos criativos e estratégicos.

| Módulo | Descrição | Tipos de Ativos |
|--------|-----------|-----------------|
| **Creative Vault** | Repositório versionado de criativos aprovados | Imagens, Vídeos, Carrosséis, Stories |
| **Funnel Blueprints** | Biblioteca de templates de funis validados | Landing Pages, Quiz Funnels, Webinar Funnels, VSL Pages |
| **Copy DNA** | Banco de copies organizadas por estágio de consciência e tom | Headlines, Leads, Bullet Points, CTAs, Emails |

**Saídas Principais:**
- Templates Reutilizáveis
- Swipe Files Categorizados
- Histórico de Performance de Ativos
- Sugestões de Remix

---

### ⚙️ Ala de Operações (Operations Wing)
**Missão:** Executar tarefas de marketing de forma autônoma ou semi-autônoma.

| Módulo | Descrição | Capacidades |
|--------|-----------|-------------|
| **Content Autopilot** | Geração e agendamento automatizado de conteúdo | Posts, Stories, Reels Scripts, Carrosséis |
| **Social Command Center** | Central de gerenciamento de presença social | Publicação, Respostas, DMs, Engajamento |
| **Performance War Room** | Dashboard de métricas e otimização de campanhas | ROAS, CAC, LTV, Funnel Analytics |

**Saídas Principais:**
- Calendário Editorial Automatizado
- Relatórios de Performance
- Alertas de Anomalia
- Recomendações de Otimização

---

## 👥 Governança de Agentes: Conselheiros vs. Executores

### 🎓 Conselheiros (Counselors) — Mentores Estratégicos
Os Conselheiros são **entidades de consultoria** que fornecem direção estratégica, frameworks e validação. Eles **não executam tarefas**, mas orientam os Agentes Executores.

| Categoria | Conselheiros | Especialidade |
|-----------|--------------|---------------|
| **Funil** | Russell Brunson, Dan Kennedy, Frank Kern, Ryan Deiss | Arquitetura de Ofertas, Value Ladders |
| **Copy** | Eugene Schwartz, Gary Halbert, David Ogilvy, Claude Hopkins | Persuasão, Estágios de Consciência |
| **Ads** | Justin Brooke, Nicholas Kusmich, Jon Loomer, Savannah Sanchez | Tráfego Pago, Creative Strategy |
| **Social** | Lia Haberman, Rachel Karten, Nikita Beer, Justin Welsh | Orgânico, Community, Personal Branding |
| **Design** | Diretor de Design (NanoBanana) | Visual Strategy, Brand Consistency |

**Interação:**
- Consultados via `[VEREDITO_DO_CONSELHO]` para decisões estratégicas
- Fornecem frameworks e templates (Funnel Blueprints, Copy DNA)
- Validam outputs dos Agentes Executores antes da publicação

---

### 🤖 Agentes Executores (Executor Agents) — Operadores Autônomos
Os Agentes Executores são **workers especializados** que realizam tarefas concretas de forma autônoma ou semi-autônoma.

| Agente | Função | Ala |
|--------|--------|-----|
| **Scout** | Coleta de dados externos (scraping, APIs) | Inteligência |
| **Analyst** | Processamento e interpretação de dados | Inteligência |
| **Curator** | Organização e tagueamento de ativos | Biblioteca |
| **Archivist** | Versionamento e histórico de ativos | Biblioteca |
| **Writer** | Geração de copies e conteúdos textuais | Operações |
| **Designer** | Geração de visuais e criativos | Operações |
| **Publisher** | Agendamento e publicação em plataformas | Operações |
| **Optimizer** | Análise de métricas e sugestões de melhoria | Operações |

**Interação:**
- Recebem tarefas via filas de trabalho (Task Queues)
- Operam dentro de guardrails definidos pelos Conselheiros
- Reportam status e resultados para o Performance War Room

---

## 🏢 Arquitetura Multi-Tenant

### 🔐 Separação de APIs

| Tipo | Escopo | Exemplos | Acesso |
|------|--------|----------|--------|
| **APIs do Sistema** | Infraestrutura compartilhada, conhecimento universal | Gemini, Cohere Rerank, Pinecone (namespace `universal`) | Gerenciado pela plataforma |
| **APIs do Cliente** | Integrações específicas da marca | Meta Ads, Google Ads, Instagram, Mailchimp | Configurado por marca (BYO Keys) |

### 🗄️ Isolamento de Dados no Pinecone

```yaml
# Estrutura de Namespaces
pinecone:
  index: conselho-de-funil
  namespaces:
    - universal          # Conhecimento dos Conselheiros (Brain)
    - brand_{brandId}    # Ativos específicos de cada marca
    - templates          # Funnel Blueprints e Copy DNA
```

**Regras de Governança:**
- **Universal**: Somente leitura para clientes. Escrita restrita a admins.
- **Brand_{brandId}**: Leitura/Escrita isolada por tenant. Zero vazamento entre marcas.
- **Templates**: Leitura para todos. Escrita por curadoria do sistema.

### 📊 Governança de Dados: Universal vs. Privado

| Camada | Tipo | Visibilidade | Exemplos |
|--------|------|--------------|----------|
| **Universal** | Conhecimento público curado | Todas as marcas | Frameworks, Best Practices, Brain dos Conselheiros |
| **Privado (Brand)** | Ativos da marca | Somente a marca | Logos, Brand Voice, Histórico de Campanhas |
| **Derivado** | Outputs gerados | Somente a marca | Copies geradas, Criativos, Relatórios |

---

## 🛠️ Stack Tecnológica

### Core
- **Framework**: Next.js 16 (Turbopack)
- **Frontend**: React 19, Tailwind CSS 4, Radix UI, Framer Motion
- **Backend/Database**: Firebase (Firestore, Storage, Auth) - **Client SDK Only**
- **AI**: Google Gemini (gemini-2.0-flash-exp, gemini-1.5-pro)
- **Embedding**: Text-Embedding-004 / Local Fallback (768d)
- **Vector Store**: Pinecone (Namespaced Multi-Tenant)
- **Reranking**: Cohere Rerank

### Processamento
- **OCR**: Tesseract.js
- **PDF**: PDF.js
- **Scraping**: Cheerio, Puppeteer (headless)
- **Gestão de Estado**: Zustand

### Integrações Planejadas (Ala de Operações)
- Meta Ads API (Business SDK)
- Google Ads API
- Instagram Graph API
- LinkedIn Marketing API
- Mailchimp / ActiveCampaign
- Google Analytics 4

---

## 📊 Status do Projeto (NETECMT Foundation)

### Sprints Concluídas
| Sprint | Entrega | Status |
|--------|---------|--------|
| 1.1 | Hardening de Ingestão, OCR Multimodal, Governança de Assets | ✅ |
| 1.2 | Otimização de RAG (Reranking), Filtros Dinâmicos | ✅ |
| 7 | Brand Hub, Logo Governance, BrandKit | ✅ |
| 8 | Performance Analytics, Design Intelligence | ✅ |
| 11 | Brain Expansion, Visual Intelligence, Golden Thread | ✅ |
| 12 | Deep Intelligence, Feedback Loops, Brand Voice Personalização | ✅ |
| 13 | Intelligence Wing Foundation, Social Listening MVP | ✅ |
| 16 | Social Brain, Trends Agent, Production MCP Infrastructure | ✅ |

## ⚠️ Post-Mortem: Sprint 16 Deploy Incident
**Data:** 29/01/2026  
**Causa Raiz:** Conflito de estrutura monorepo vs Vercel Root Directory e bloqueio de proxy local (Porta 9).  
**Impacto:** Falha total no build remoto e impossibilidade de login via Vercel CLI.
**Soluções Aplicadas:**
1. **Firebase Build-Safe:** Refatorado `config.ts` para não inicializar serviços se o `app` for nulo (ambiente de build).
2. **Vercel Config:** Movido `vercel.json` para dentro de `app/` e ajustado caminhos de `functions`.
3. **Proxy Clear:** Identificado que variáveis de ambiente `HTTP_PROXY` locais (apontando para 127.0.0.1:9) travavam o Vercel CLI.
4. **Dependency Sync:** Sincronizado `package.json` da raiz com `app/` para evitar "Module not found" no build remoto.

### 🛡️ Novas Regras de Segurança (Anti-Incident)
- **Trava de Proxy:** Nenhum comando `vercel` deve ser executado sem o prefixo de limpeza de proxy: `$env:HTTP_PROXY=""; $env:HTTPS_PROXY=""; $env:ALL_PROXY="";`.
- **Build Isolation:** Todo código que utiliza `firebase-admin` ou `google-cloud` deve estar estritamente isolado da árvore de build do Next.js.

### Próximos Passos (Roadmap Agency Engine)
1. **Sprint 14**: Estruturação da Ala de Biblioteca (Creative Vault + Funnel Blueprints)
2. **Sprint 15**: MVP da Ala de Operações (Content Autopilot básico)
3. **Sprint 16+**: Integrações com APIs de Tráfego Pago e Social Command Center

---

## 🚀 Metas de Governança (NETECMT)

- **Contexto de Precisão**: Uso obrigatório de Story Packs para novas implementações.
- **Rigor de Nomenclatura**: `kebab-case` para arquivos. Case-Sensitivity total nos imports (Ref: INC-003).
- **Lane Contracts**: Separação clara entre Inteligência, Biblioteca e Operações.
- **Isolamento de Dependências**: Sufixo `.server.ts` para código backend-only.
- **Multi-Tenant First**: Toda feature nova deve considerar isolamento por `brandId` desde o design.
- **Segurança**: Restrição de NÃO usar `firebase-admin` ou `google-cloud/*` (ambiente Windows 11 24H2).

---

## 🔗 Referências Internas
- **Brains (Conselheiros)**: `brain/second brain/brain/` (Universal) e `templates/` (Especializados)
- **Ferramentas**: `cli-reference.yaml` e `_netecmt/docs/tools/`
- **Histórico de Decisões**: `_netecmt/solutioning/adr/`

---

*Documento atualizado pelo Agente Wilder (Analyst) sob deliberação do Alto Conselho.*
*Versão: 2.0 | Data: 2026-01-22 | Escopo: Agency Engine Expansion*
