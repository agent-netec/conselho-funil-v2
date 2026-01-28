# 🔭 PRD: Sprint 14 - Intelligence Expansion (Competitor Intelligence)

**Versão:** 1.0  
**Status:** Draft / Ready for Architecture  
**Responsável:** Iuran (PM)  
**Data:** 24/01/2026  
**Deliberação:** Em definição pelo Alto Conselho

---

## 1. Visão Geral

A Sprint 14 foca na **Expansão da Ala de Inteligência**, evoluindo da fundação de Social Listening (Sprint 13) para a **Inteligência Competitiva**. O objetivo é transformar dados brutos de mercado em dossiês acionáveis sobre concorrentes, permitindo que a marca entenda o ecossistema onde está inserida.

Esta sprint introduz o **Spy Agent** (Agente de Inteligência Competitiva), especializado em mapear a infraestrutura e estratégias de terceiros.

---

## 2. Objetivos Estratégicos

| ID | Objetivo | Impacto de Negócio |
|:---|:---------|:-------------------|
| **OBJ-14.1** | Mapear infraestrutura técnica de concorrentes | Identificar ferramentas e tecnologias (BuiltWith/Wappalyzer logic) |
| **OBJ-14.2** | Rastrear funis e Landing Pages | Entender a jornada de conversão dos concorrentes |
| **OBJ-14.3** | Gerar Dossiê de Concorrente automatizado | Centralizar insights para tomada de decisão estratégica |

---

## 3. Escopo da Sprint

### ✅ Incluído (P0/P1)

| # | Feature | Prioridade | Épico |
|:--|:--------|:-----------|:------|
| 1 | Competitor Infrastructure Mapping | P0 | E31 |
| 2 | Funnel & LP Tracker | P0 | E31 |
| 3 | Competitor Dossier Generator (PDF/UI) | P1 | E32 |
| 4 | Tech Stack Detection (BuiltWith Integration) | P1 | E31 |

### ⏸️ Excluído (P2 - Backlog Sprint 15+)

| Feature | Motivo da Exclusão |
|:--------|:-------------------|
| Ad Creative Monitoring | Requer integração profunda com Ad Libraries (complexidade alta) |
| Price Tracking | Foco inicial em infraestrutura e funil, não em SKU |
| Real-time Alerts for Competitors | Requer motor de alertas da Sprint 18 |

---

## 4. Requisitos Funcionais

### 🕵️ E31: Competitor Intelligence Engine

#### RF-01: Competitor Management CRUD
O sistema deve permitir que o usuário cadastre e gerencie concorrentes:
- URL do site principal.
- Redes Sociais.
- Tags de categoria.

#### RF-02: Tech Stack Detection
O **Spy Agent** deve identificar as tecnologias usadas pelo concorrente:
- CMS (WordPress, Webflow, etc).
- Analytics & Tracking (GTM, Meta Pixel, Hotjar).
- E-mail Marketing / CRM.
- Gateways de Pagamento.

#### RF-03: Funnel & LP Discovery
Mapeamento automático de páginas relacionadas:
- Identificação de `/checkout`, `/obrigado`, `/vsl`.
- Captura de screenshots das LPs (via Puppeteer).

---

### 📄 E32: Intelligence Reporting

#### RF-04: Competitor Dossier (The "War File")
Geração de um relatório consolidado contendo:
1. **Resumo Executivo:** Quem é o concorrente e seu posicionamento.
2. **Tech Stack:** O que eles usam para vender.
3. **Funnel Map:** Visualização da jornada descoberta.
4. **SWOT Automática:** Gerada por IA baseada nos dados coletados.

#### RF-05: Intelligence Dashboard Expansion
Adição de uma aba "Competidores" no Dashboard de Inteligência:
- Lista de concorrentes monitorados.
- Comparativo rápido de "Tech Health".

---

## 5. Requisitos Não-Funcionais

### 🛡️ Guardrails

| Guardrail | Regra |
|:----------|:------|
| **Ethical Scraping** | Respeitar `robots.txt` e não realizar ataques de negação de serviço |
| **Data Privacy** | Não coletar dados sensíveis ou protegidos por login |
| **Multi-Tenant** | Dossiês de concorrentes são privados da marca que os solicitou |

---

## 6. User Stories de Alto Nível

| ID | Story | Persona | Critério de Aceite |
|:---|:------|:--------|:-------------------|
| US-14.1 | Como usuário, quero cadastrar um concorrente pela URL | Brand Owner | Sistema valida URL e inicia descoberta inicial |
| US-14.2 | Como usuário, quero ver quais ferramentas meu concorrente usa | Brand Owner | Lista de tecnologias exibida no perfil do concorrente |
| US-14.3 | Como sistema, quero gerar um PDF com o dossiê do concorrente | Spy Agent | PDF gerado com dados de infra, LPs e análise de IA |

---

## 7. Métricas de Sucesso

| Métrica | Target Sprint 14 |
|:--------|:-----------------|
| Precisão de Tech Detection | > 85% para tecnologias comuns |
| Tempo de geração de Dossiê | < 2 minutos |
| Descoberta de LPs | Mínimo 3 páginas por concorrente (se existirem) |

---

## 8. Referências

- **Roadmap Global:** `_netecmt/ROADMAP.md`
- **PRD Anterior:** `_netecmt/prd-sprint-13-intelligence-wing.md`
- **Contexto:** `_netecmt/project-context.md`

---
*Documento gerado por Iuran (PM) - NETECMT v2.0*  
*Agency Engine Expansion | Sprint 14 | Competitor Intelligence*
