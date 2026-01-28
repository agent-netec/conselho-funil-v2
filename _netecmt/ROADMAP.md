# 🗺️ Roadmap: Agency Engine (Sprints 13-19)

> **Objetivo Final:** Transformar o Conselho de Funil em uma Agência de Marketing Autônoma que erradica a necessidade de agências externas.

---

## 📊 Visão Geral do Roadmap

| Sprint | Nome | Foco | Status |
| :--- | :--- | :--- | :--- |
| **13** | Intelligence Wing Foundation | Storage isolado + Social Listening MVP | ✅ Concluída |
| **14** | Competitor Intelligence | Espionagem de concorrentes + Dossiê | 🚧 Em Andamento |
| **15** | Social Listening & Keywords | Escuta Social avançada + Mineração de Demanda | 📅 Planejada |
| **16** | Content Autopilot | Motor de Mídia Pessoal: Curadoria + Adaptação + Publicação | 📅 Planejada |
| **17** | Social Command Center | Gerenciamento de comentários + "Voz da Marca" | 📅 Planejada |
| **18** | Performance War Room | Dashboard unificado + Alertas de Anomalia | 📅 Planejada |
| **19** | Funnel Autopsy & Offer Lab | Diagnóstico de funis + Engenharia de ofertas | 📅 Planejada |

---

## 🏛️ Arquitetura: As 3 Alas do Agency Engine

### 🔍 ALA DE INTELIGÊNCIA (Research & Listening)
*Sprint 13, 14, 15*

| Funcionalidade | Descrição | Sprint |
| :--- | :--- | :--- |
| Social Listening | Monitorar menções, hashtags, sentimento | 13, 15 |
| Competitor Intelligence | Dossiê de concorrentes, ferramentas usadas | 14 |
| News & Trend Radar | Feed de oportunidades baseado em tendências | 13 |
| Keyword Mining | Demanda por plataforma e estágio de funil | 15 |

### 📚 ALA DE BIBLIOTECA (Swipe Files & Inspiration)
*Sprint 16 (parcial), Sprint 19*

| Funcionalidade | Descrição | Sprint |
| :--- | :--- | :--- |
| Creative Vault | Banco de anúncios, emails, LPs indexados | 16 |
| Funnel Blueprints | Plantas de funil comprovadas | 19 |
| Copy DNA | Headlines e hooks categorizados | 16 |

### ⚙️ ALA DE OPERAÇÕES (Social Management & Execution)
*Sprint 16, 17, 18*

| Funcionalidade | Descrição | Sprint |
| :--- | :--- | :--- |
| Content Autopilot | Curadoria + Adaptação + Publicação automática | 16 |
| Social Command Center | Gerenciar comentários/DMs + traduzir voz | 17 |
| Performance War Room | Dashboard unificado + alertas de anomalia | 18 |

---

## 🚀 Sprint 13: Intelligence Wing Foundation (CONCLUÍDA)

**Objetivo:** Estabelecer a fundação da Ala de Inteligência.

### Tarefas:
| ID | Task | Responsável | Status |
| :--- | :--- | :--- | :--- |
| ST-13.1 | Arch: Intelligence Storage Design | Athos | ✅ Done |
| ST-13.2 | Core: Scout Agent - Data Collection | Darllyson | ✅ Done |
| ST-13.3 | Core: Analyst Agent - Sentiment Processing | Darllyson | ✅ Done |
| ST-13.4 | UI: Intelligence Dashboard Skeleton | Victor/Beto | ✅ Done |
| ST-13.5 | Config: Keyword Management | Darllyson | ✅ Done |
| ST-13.6 | QA: Multi-Tenant Isolation Tests | Dandara | ✅ Done |

**PRD:** `_netecmt/prd-sprint-13-intelligence-wing.md`
**Release:** `_netecmt/docs/release-notes/v1.13.0.md`

---

## 🚧 Sprint 14: Competitor Intelligence (EM ANDAMENTO)

**Objetivo:** Criar o sistema de espionagem e análise de concorrentes.

### Funcionalidades Esperadas:
- Identificação automática de concorrentes.
- Rastreamento de Landing Pages, Funis, Criativos.
- Mapeamento de ferramentas usadas (BuiltWith, Wappalyzer).
- Geração de "Dossiê de Concorrente".
- **Agente:** `Agente de Inteligência Competitiva`

---

## 📅 Sprint 15: Social Listening & Keywords (PLANEJADA)

**Objetivo:** Implementar escuta social avançada e mineração de demanda.

### Funcionalidades Esperadas:
- Monitoramento de menções em Twitter/X, Instagram, TikTok.
- Relatório de "Voz do Cliente" com sentimento e dores.
- Extração de keywords do Google, YouTube, TikTok.
- Clusterização por intenção (Awareness, Consideration, Decision).
- **Agentes:** `Agente de Escuta Social`, `Agente de Demanda`

---

## 📅 Sprint 16: Content Autopilot (PLANEJADA)

**Objetivo:** Criar o motor de mídia pessoal que transforma o usuário em veículo de mídia.

### Funcionalidades Esperadas:
- Configuração de fontes de monitoramento (RSS, perfis, newsletters).
- Curadoria diária com filtragem por relevância.
- Adaptação automática para a voz da marca (BrandKit).
- Formatação multi-plataforma (Twitter, LinkedIn, Instagram).
- Fila de aprovação com preview.
- Publicação automática via APIs.
- **Agentes:** `Curador de Biblioteca`, `Adaptador de Voz`, `Publisher Agent`

---

## 📅 Sprint 17: Social Command Center (PLANEJADA)

**Objetivo:** Centralizar o gerenciamento de presença online.

### Funcionalidades Esperadas:
- Inbox unificado de comentários/DMs de todas as redes.
- Tradução automática da linguagem do cliente para voz da marca.
- Sugestões de resposta baseadas no BrandKit.
- Calendário de conteúdo de 30 dias.
- **Agente:** `Agente de Engajamento Social`

---

## 📅 Sprint 18: Performance War Room (PLANEJADA)

**Objetivo:** Monitoramento e otimização em tempo real.

### Funcionalidades Esperadas:
- Dashboard unificado de todas as campanhas (Meta, Google, TikTok).
- Alertas de anomalias (CTR caiu, CPC subiu).
- Sugestões de ajuste automático.
- Painel de Integrações (APIs do Cliente).
- **Agente:** `Agente de Performance`

---

## 📅 Sprint 19: Funnel Autopsy & Offer Lab (PLANEJADA)

**Objetivo:** Diagnóstico avançado e engenharia de ofertas.

### Funcionalidades Esperadas:
- **Funnel Autopsy:** Diagnóstico forense de funis que falharam.
- **Offer Engineering Lab:** Wizard para criar ofertas irresistíveis.
- Benchmark com funis de sucesso da biblioteca.
- Score de "Irresistibilidade" da oferta.

---

## 🔐 Decisões Arquiteturais Chave

### APIs do Sistema vs. APIs do Cliente
| Tipo | Quem Gerencia | Exemplos |
| :--- | :--- | :--- |
| Sistema | Nós | Gemini, Pinecone, Cohere, Firebase |
| Cliente | Usuário configura | Meta, Google Ads, TikTok, Twitter, LinkedIn |

### Isolamento de Dados (Multi-Tenant)
- **Universal:** `namespace: knowledge` (visível para todos)
- **Privado:** `namespace: brand-{id}` (apenas dono da marca)
- **Pesquisa:** `namespace: research-{id}` (dados temporários de mercado)

---

## 📈 Métricas de Sucesso do Agency Engine

| Métrica | Meta |
| :--- | :--- |
| Tempo para criar conteúdo | -80% vs. manual |
| Consistência de marca | 100% (BrandKit enforced) |
| Cobertura de monitoramento | 24/7 automático |
| Custo vs. agência tradicional | -90% |

---

**Última Atualização:** 24/01/2026  
**Responsável:** Luke (Release) / Alto Conselho
