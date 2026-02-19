# Guia de Uso — Conselho de Funil

> **Data de criação:** 2026-02-19
> **Status:** Documento vivo — atualizado durante testes manuais
> **Objetivo:** Ensinar uso da plataforma desde o início

---

## 📋 Índice

1. [O que é o Conselho de Funil](#o-que-é-o-conselho-de-funil)
2. [Primeiro Acesso](#primeiro-acesso)
3. [Criando sua Primeira Marca](#criando-sua-primeira-marca)
4. [Configurando o Brand Hub](#configurando-o-brand-hub)
5. [Funcionalidades Principais](#funcionalidades-principais)
6. [Fluxo Recomendado de Uso](#fluxo-recomendado-de-uso)
7. [Dicas e Atalhos](#dicas-e-atalhos)
8. [Problemas Conhecidos](#problemas-conhecidos)

---

## O que é o Conselho de Funil

O **Conselho de Funil** é uma plataforma de marketing com IA que coloca **23 especialistas de marketing** (copywriters, estrategistas e experts em tráfego) trabalhando para você simultaneamente.

### Conceitos-Chave

- **Conselho**: Os 23 especialistas de marketing (Gary Halbert, Eugene Schwartz, Dan Kennedy, David Ogilvy, etc.)
- **Estrategista**: Como o sistema chama você (o usuário)
- **Linha de Ouro**: Conceito estratégico que conecta sua oferta ao desejo do cliente
- **Brand (Marca)**: Cada projeto/cliente que você gerencia na plataforma
- **RAG Context**: Base de conhecimento de 2.4k ativos que alimenta as respostas da IA

### O que a plataforma faz

1. **Cria estratégias de funil** — Analisa sua oferta e gera funis completos
2. **Escreve copy** — Headlines, emails, VSLs, scripts de vídeo
3. **Gera conteúdo social** — Posts para Instagram, Facebook, LinkedIn, Twitter, TikTok
4. **Analisa concorrentes** — Spy Agent para mapear estratégias de mercado
5. **Gerencia campanhas** — Integração com Meta Ads e Google Ads
6. **Pesquisa de mercado** — Keywords, tendências, análise de audiência
7. **Calendar de conteúdo** — Planejamento e agendamento
8. **Chat estratégico** — Consultoria ao vivo com os 23 conselheiros

---

## Primeiro Acesso

### 1. Login/Signup

**URL:** http://localhost:3001 (ou URL de produção)

**Opções:**
- **Signup**: Email + Senha (mínimo 6 caracteres)
- ⚠️ **Google Login**: Botão visível mas NÃO FUNCIONA (em desenvolvimento)

**Após signup:**
- Redirecionado para página de Welcome (`/welcome`)
- 3 opções de início: Criar marca, Consultar Conselho, ou Explorar plataforma

### 2. Welcome Page

Você verá 3 cards de ação:

| Card | Descrição | Recomendação |
|------|-----------|--------------|
| **Criar sua marca** | Configura contexto da marca | ✅ **COMECE POR AQUI** |
| **Consultar o Conselho** | Chat com 23 especialistas | Usar após ter marca criada |
| **Explorar a plataforma** | Ver dashboard vazio | Pode pular |

**Decisão:** Clique em **"Criar sua marca"** para começar.

---

## Criando sua Primeira Marca

### Wizard de Criação (4 Steps)

#### Step 1: Identity (Identidade)

**Campos:**
- **Nome da marca**: Ex: "mkthoney" ou "Minha Empresa"
- **Vertical**: Segmento de mercado (ex: Marketing Digital, E-commerce, SaaS)
- **Positioning**: Como você se posiciona no mercado
  - Ex: "A plataforma mais completa de automação de marketing para PMEs"
- **Voice Tone**: Tom de voz da marca
  - Opções: Profissional, Casual, Autoritário, Inspirador, Educativo

**Dica:** Seja específico no positioning — isso afeta todos os prompts de IA.

#### Step 2: Audience (Audiência)

**Campos:**
- **Público-alvo**: Descrição detalhada do seu cliente ideal
  - Ex: "Donos de agência de marketing com 5-20 funcionários, faturamento R$50-200k/mês, frustrados com ferramentas fragmentadas"
- **Pain Points** (opcional): Dores específicas
- **Desires** (opcional): Desejos/aspirações

**Dica:** Quanto mais detalhado, melhor a IA personaliza conteúdo.

#### Step 3: Offer (Oferta)

**Campos:**
- **Oferta principal**: O que você vende
  - Ex: "Software de automação de marketing com IA"
- **Proposta de valor**: Benefício único
  - Ex: "Economize 15h/semana em criação de conteúdo"
- **Preço** (opcional): Valor ou faixa
- **Garantia** (opcional): Garantia de satisfação

#### Step 4: Confirm (Confirmação)

- Review de todos os dados
- Botão "Criar Marca" → Salva no Firebase
- **Redirecionamento**: Dashboard (cards ainda vazios)

### ⚠️ Problema Conhecido: Marca Incompleta

Após criar a marca pelo wizard, **a marca está apenas 30% configurada**:

❌ **Faltam:**
- Cores da marca (paleta)
- Logo
- AI Configuration (temperatura, preset de personalidade)
- Assets (docs, PDFs, URLs para RAG)

✅ **Solução:** Ir para Brand Hub (próxima seção)

---

## Configurando o Brand Hub

### Como acessar

**Opção 1:** Sidebar → Brand Hub
**Opção 2:** Header → Dropdown de marca → Ver detalhes → Tab "Brand Hub"

### Abas do Brand Hub

#### Tab 1: Visão Geral

- **Cards informativos** (read-only):
  - Identidade da marca
  - Público-alvo
  - Oferta
  - Estatísticas
- **Ação:** Botão "Editar" → Redireciona para wizard novamente

#### Tab 2: Assets

**Upload de documentos para RAG:**
- PDFs (brand books, whitepapers)
- Docs (estratégias, estudos de caso)
- URLs (site institucional, blog posts, concorrentes)

**Como usar:**
1. Clique "Upload Asset" ou "Add URL"
2. Arquivo/URL é processado com OCR + embedding
3. Status: Processing → Completed
4. Aparece na listagem com preview

**Benefício:** Esses assets viram contexto para as respostas da IA.

#### Tab 3: Brand Hub (Visual Identity + AI Config)

**Seção 1: Cores**
- **Primary Color**: Cor principal da marca
- **Secondary Color**: Cor secundária
- **Accent Color**: Cor de destaque
- **Visual Style**: Minimalista, Vibrante, Corporativo, Artístico

**Seção 2: Tipografia**
- Font principal
- Font secundária

**Seção 3: Logo**
- Upload de logo principal
- **Logo Lock**: Toggle que BLOQUEIA mudanças no logo
  - Quando ativado, a IA NUNCA altera o logo em designs gerados
  - Injeta instrução crítica: "KEEP THE LOGO IDENTICAL"

**Seção 4: AI Configuration**
- **Preset de personalidade**:
  - Agressivo (temperature 0.9, topP 0.95)
  - Sobrio (temperature 0.3, topP 0.7)
  - Criativo (temperature 0.8, topP 0.9)
  - Equilibrado (temperature 0.6, topP 0.85) ← Padrão
- **Temperature** (slider 0-1): Criatividade da IA
- **Top-P** (slider 0-1): Diversidade de vocabulário

**⚠️ Problema Conhecido:** 3 dos 5 engines IGNORAM temperature/topP (ver seção Problemas Conhecidos)

---

## Funcionalidades Principais

### 1. Chat com o Conselho

**Rota:** `/chat`

**O que faz:**
- Conversa com os 23 especialistas simultaneamente
- Seleciona automaticamente os melhores conselheiros para cada pergunta
- Usa contexto da marca + RAG assets

**Como usar:**
1. Digite sua pergunta (ex: "Como melhorar minha taxa de conversão?")
2. Selecione contexto (opcional): Brand, Funnel, Campaign
3. IA escolhe 3-5 conselheiros relevantes
4. Resposta consolidada com opiniões individuais

**Dica:** Perguntas específicas = respostas melhores
- ❌ "Como fazer marketing?"
- ✅ "Qual headline usar para VSL vendendo curso de copywriting para iniciantes?"

### 2. Funnels (Funis)

**Rota:** `/funnels`

**O que faz:**
- Cria funis de vendas completos (awareness → conversão)
- Gera copy para cada etapa
- Propõe estrutura de páginas

**Como usar:**
1. **Criar Novo Funil**: `/funnels/new`
2. Preenche wizard:
   - Nome do funil
   - Objetivo (vendas, leads, agendamentos)
   - Produto/oferta
   - Budget estimado
3. IA gera proposta completa com:
   - Etapas do funil
   - Copy sugerida
   - Decisões estratégicas (parecer dos conselheiros)

**Visualização:**
- Kanban de etapas (Awareness → Consideration → Decision → Action)
- Click em etapa → Ver copy + design

### 3. Social Media

**Rota:** `/social`

**O que faz:**
- Gera posts para 5 plataformas (Instagram, Facebook, LinkedIn, Twitter, TikTok)
- Adaptados para cada formato (Reels, Stories, Feed, Carousel)
- Agenda posts no calendar

**Como usar:**
1. Click "Novo Post"
2. Preenche:
   - Tema/assunto
   - Plataforma
   - Formato (Feed, Reels, Stories, etc.)
   - Objetivo (engajamento, tráfego, conversão)
3. IA gera:
   - Copy (caption + hashtags)
   - Sugestão de visual
   - Melhor horário para postar

### 4. Calendar (Calendário de Conteúdo)

**Rota:** `/content/calendar`

**⚠️ ATENÇÃO:** Rota com erro 500 conhecido (ver Problemas Conhecidos)

**O que deveria fazer:**
- Visualizar posts agendados
- Arrastar e soltar para reorganizar
- Status tracking (Rascunho, Agendado, Publicado)

### 5. Keywords Miner

**Rota:** `/intelligence/discovery` → Tab "Keywords Miner"

**O que faz:**
- Pesquisa keywords usando Google Autocomplete (termos reais)
- Gemini estima: volume, dificuldade, intenção, sugestões
- Salva keywords para uso em conteúdo

**Como usar:**
1. Digite keyword seed (ex: "marketing digital")
2. Click "Mine Keywords"
3. Resultados mostram:
   - Termo completo (ex: "marketing digital para iniciantes")
   - Volume estimado (ex: 12.5k)
   - Difficulty (Baixa/Média/Alta)
   - Intent (Informacional/Comercial/Transacional)

### 6. Spy Agent (Análise de Concorrentes)

**Rota:** `/intelligence/discovery` → Tab "Spy Agent"

**O que faz:**
- Analisa sites de concorrentes
- Extrai funil, copy, ofertas, CTAs
- Mapeia estratégia

**Como usar:**
1. Insere URL do concorrente
2. IA faz scraping + análise
3. Gera relatório:
   - Estrutura do funil
   - Headlines principais
   - Ofertas identificadas
   - Gaps de oportunidade

### 7. Campaign Command Center

**Rota:** `/campaigns/[id]`

**O que faz:**
- Gerencia campanhas de tráfego pago
- Integração com Meta Ads e Google Ads
- Tracking de métricas (CTR, CPC, ROAS)

**Como usar:**
1. Conecta conta de ads em Settings
2. Sincroniza campanhas
3. Dashboard mostra performance
4. IA sugere otimizações

### 8. Automation

**Rota:** `/automation`

**O que faz:**
- Regras de automação baseadas em triggers
- "Conselho de Ads" debate mudanças antes de executar
- Tracking de impacto antes/depois

**Exemplo de regra:**
- **Trigger:** CTR < 1% por 3 dias
- **Debate:** 4 conselheiros analisam (Russell Brunson, Dan Kennedy, etc.)
- **Ação:** Pausar ad e sugerir novo criativo

---

## Fluxo Recomendado de Uso

### Para novo usuário

```
1. Signup → 2. Criar Marca (wizard) → 3. Configurar Brand Hub (cores, logo, AI)
→ 4. Upload de assets → 5. Consultar o Conselho (fazer 1ª pergunta)
→ 6. Criar primeiro funil → 7. Gerar posts sociais → 8. Explorar outras funções
```

### Para usuário recorrente

```
Dashboard → Ver stats → Consultar Conselho → Criar conteúdo social
→ Revisar campanhas → Ajustar automações
```

---

## Dicas e Atalhos

### Quick Actions (Dashboard)

Ícones no dashboard para acesso rápido:
- 📝 Novo Funil
- 💬 Chat
- 📊 Performance
- ⚙️ Settings
- 📚 Biblioteca (⚠️ rota `/library` **não existe** — link quebrado)

### Seletor de Marca (Header)

- Dropdown no topo: troca de marca instantânea
- Útil para agências com múltiplos clientes

### Sidebar

**5 grupos principais:**
1. **Strategy**: Dashboard, Funnels, Campaigns
2. **Intelligence**: Discovery, Research, Attribution, Journey
3. **Content**: Social, Calendar, Vault
4. **Performance**: Dashboard, Cross-Channel
5. **Config**: Settings, Integrations, Brand Hub

**Dica:** Sidebar pode parecer overwhelming (23+ items) — foque nos essenciais primeiro.

---

## Problemas Conhecidos

> **Fonte:** [audit-pendencias.md](audit-pendencias.md) — auditoria completa de 2026-02-18

### P0 — Críticos (bloqueiam uso)

1. **Content Calendar erro 500** — Rota `/content/calendar` quebrada
2. **Link /library quebrado** — Quick Action aponta para rota inexistente
3. **activeBrand bug** — 3 páginas quebradas (journey, tracking, payments)

### P1 — Mock Data Visível

- **Intelligence page**: Keywords fake (12.5k, 8.4k volume inventado)
- **Campaign Command Center**: Métricas hardcoded (CTR 0.65%, ROAS 2.1x)
- **Sources Tab**: 3 fontes fake (Reddit, ClickFunnels Blog, Twitter)

### P2 — Segurança

- 12 rotas de API sem auth guard (`requireBrandAccess`)
- Tokens expirados aceitos em API Keys

### P3 — Botões Mortos

| Botão | Localização | Ação atual |
|-------|-------------|-----------|
| "Novo Ativo" | Vault | Toast "em breve" |
| "Histórico" | Vault | Toast "em breve" |
| "Add Competitor" | Intelligence | `console.log` |
| "Trigger Dossier" | Intelligence | `console.log` |
| "Google Login" | Signup/Login | `console.log` |

### P4 — AI Config Desconectado

**Engines que IGNORAM temperature/topP:**
- Content Generation (hardcoded 0.7)
- Ad Generation (hardcoded 0.7)
- Copy Generation (ignora topP)

**Solução:** Aguardar Sprint de fix (roadmap Brand Hub v2 Fase 2)

---

## Próximos Passos

- [ ] Testar cada funcionalidade manualmente
- [ ] Documentar bugs encontrados em `brain/testes-manuais-bugs.md`
- [ ] Criar issues para cada problema (ou adicionar a sprints pendentes)
- [ ] Validar fluxos end-to-end
- [ ] Preparar para Sprint Y (Integrity & Security)

---

> **Última atualização:** 2026-02-19
> **Próxima revisão:** Após testes manuais completos
