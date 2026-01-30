# 🗺️ Roadmap: Agency Engine (Sprints 13-21)

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
| **18** | Performance War Room | Dashboard unificado + Alertas de Anomalia | ✅ Concluída |
| **19** | Funnel Autopsy & Offer Lab | Diagnóstico de funis + Engenharia de ofertas | ✅ Concluída |
| **20** | Automation & Personalization | Maestro + Meta/Insta Adapters | ✅ Concluída |
| **21** | Scale & Optimization | Performance Scaling + AI Cost Optimization | ✅ Concluída |
| **22** | Intelligence Expansion | Img2Img Reference Pipeline + Deep Research | 🚧 Em Andamento |

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
*Sprint 16, 17, 18, 20*

| Funcionalidade | Descrição | Sprint |
| :--- | :--- | :--- |
| Content Autopilot | Curadoria + Adaptação + Publicação automática | 16 |
| Social Command Center | Gerenciar comentários/DMs + traduzir voz | 17 |
| Performance War Room | Dashboard unificado + alertas de anomalia | 18 |
| Automation & Personalization | Maestro + Meta/Insta Adapters | 20 |

---

## 🚀 Sprint 20: Automation & Personalization (CONCLUÍDA)

**Objetivo:** Implementar o Personalization Engine (Maestro) e os adaptadores de operação (Meta/Instagram).

### Funcionalidades Entregues:
- **Personalization Engine:** Maestro operacional com lógica de Schwartz.
- **Meta/Instagram Adapters:** Conexão direta para anúncios dinâmicos.
- **Webhook Infrastructure:** Sistema seguro de eventos externos.
- **MonaraTokenVault:** Centralização segura de credenciais (AES-256).

---

## 🚀 Sprint 21: Scale & Optimization (CONCLUÍDA)

**Objetivo:** Otimizar a performance do sistema e reduzir custos operacionais de IA para escala massiva.

### Funcionalidades Entregues:
- **AI Cost Guard:** Sistema de monitoramento e otimização de tokens integrado ao dashboard.
- **Performance Scaling:** Melhorias de latência no Maestro e reestruturação de navegação "War Room".
- **Discovery Hub:** Interface de mineração competitiva e tendências ativa.
- **Funnel Autopsy Integration:** Motor forense integrado diretamente no fluxo de estratégia.

---

## 📅 Sprint 22: Intelligence Expansion (PLANEJADA)

**Objetivo:** Expandir as capacidades de geração visual e pesquisa profunda de mercado.

### Funcionalidades Esperadas:
- **Img2Img Reference Pipeline:** Criação de criativos baseados em referências visuais de alta performance.
- **Deep Research Engine:** Integração com motores de busca para dossiês de mercado automáticos.
- **Multi-Channel Adapters:** Expansão para TikTok e LinkedIn Ads.

---

## 🚀 Sprint 20: Automation & Personalization (CONCLUÍDA)

**Objetivo:** Diagnóstico avançado e engenharia de ofertas.

### Funcionalidades Entregues:
- **Funnel Autopsy:** Diagnóstico forense de funis via URL.
- **Offer Engineering Lab:** Wizard Hormozi para ofertas irresistíveis.
- **UI Forense:** Dashboard integrado em `/funnels/[id]`.
- **Score de Irresistibilidade:** Cálculo automático de valor de oferta.

---

## 🚀 Sprint 18: Performance War Room (CONCLUÍDA)

**Objetivo:** Monitoramento e otimização em tempo real.

### Funcionalidades Entregues:
- **Command Center:** Dashboard unificado para monitoramento de performance.
- **The Sentry Engine:** Motor de detecção de anomalias e alertas.
- **BYO Keys (Secure):** Sistema de gerenciamento de chaves de API com AES-256.
- **Unified Performance API:** Endpoint agregador de métricas.

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

**Última Atualização:** 30/01/2026  
**Responsável:** Luke (Release Agent)
