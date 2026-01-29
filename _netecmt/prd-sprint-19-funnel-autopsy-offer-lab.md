---
project_name: "Sprint 19: Funnel Autopsy & Offer Lab"
version: "1.0"
author: "Iuran (PM Agent)"
date: "2026-01-29"
status: "Draft"
stakeholders:
  - name: "Iuran"
    role: "PM"
  - name: "Athos"
    role: "Arch"
  - name: "Leticia"
    role: "SM"
  - name: "Darllyson"
    role: "Dev"
  - name: "Victor/Beto"
    role: "UX/UI"
tags:
  - "sprint-19"
  - "funnel-autopsy"
  - "offer-lab"
  - "intelligence"
---

# PRD: Sprint 19 - Funnel Autopsy & Offer Lab

*Este documento descreve os requisitos para a Sprint 19, focada em diagnóstico forense de funis e engenharia de ofertas irresistíveis.*

## 1. Visão Geral

### 1.1. Resumo Executivo
A Sprint 19 marca a transição da plataforma de uma ferramenta de *geração* para uma ferramenta de *otimização estratégica*. O objetivo é construir dois motores principais: o **Funnel Autopsy**, que realiza uma "necropsia" em funis de baixa performance para identificar gargalos, e o **Offer Lab**, um ambiente experimental para criar e validar a "irresistibilidade" de ofertas antes mesmo de irem ao ar.

### 1.2. O Problema
Muitos usuários criam funis que não convertem, mas não sabem *por que*. Eles olham para métricas isoladas (CTR, CPC) sem entender a falha na arquitetura do funil ou na estrutura da oferta. Atualmente, o Conselho de Funil gera ativos, mas não oferece um diagnóstico profundo de ativos externos ou falhas sistêmicas de conversão.

### 1.3. A Solução Proposta
Implementar uma Ala de Inteligência Forense que:
1.  Analisa URLs de funis externos e identifica quebras de promessa, fricção excessiva e falhas de copy.
2.  Oferece um Wizard de Engenharia de Ofertas baseado nos frameworks do Brain Council.
3.  Gera um "Score de Irresistibilidade" e recomendações de melhoria imediata.

### 1.4. Impacto Esperado
- Aumento na taxa de conversão dos funis otimizados pela plataforma.
- Redução do desperdício de tráfego em ofertas mal estruturadas.
- Posicionamento do Conselho de Funil como um consultor estratégico autônomo.

---

## 2. Contexto e Background

### 2.1. Por Que Agora?
Com a infraestrutura de performance (Sprint 18) concluída, temos os dados. Agora precisamos da inteligência para interpretar esses dados e agir sobre a estrutura do marketing (Funil e Oferta).

### 2.2. Personas de Usuário

| Persona | Descrição | Necessidades e Dores |
| :--- | :--- | :--- |
| **Brand Owner** | Dono de infoproduto ou SaaS | "Meu funil parou de converter e não sei o que mudar." |
| **Media Buyer** | Gestor de tráfego | "O tráfego está barato, mas a oferta não segura o lead." |

---

## 3. Objetivos e Métricas de Sucesso

### 3.1. Objetivos (OKRs)
- **Objetivo 1:** Lançar o motor de diagnóstico Autopsy.
  - **KR 1:** Capaz de analisar 5 pontos críticos de uma Landing Page via URL.
  - **KR 2:** Gerar relatório de melhorias em menos de 60 segundos.
- **Objetivo 2:** Implementar o Offer Lab.
  - **KR 1:** Wizard com 4 etapas (Promessa, Empilhamento, Bônus, Escassez).

### 3.2. Métricas de Sucesso (KPIs)
| Métrica | Descrição | Valor Alvo |
| :--- | :--- | :--- |
| Autopsy Accuracy | % de diagnósticos validados pelo usuário como "corretos" | > 80% |
| Offer Score | Média de score das ofertas criadas no Lab | > 7/10 |

---

## 4. Requisitos Funcionais

### 4.1. User Stories Principais
| ID | User Story |
| :--- | :--- |
| US-19.1 | Como usuário, quero colar a URL do meu funil para que o Agente Autopsy identifique por que não estou convertendo. |
| US-19.2 | Como usuário, quero usar o Offer Lab para estruturar minha oferta seguindo o framework de Russell Brunson. |
| US-19.3 | Como usuário, quero ver um Score de Irresistibilidade para saber se minha oferta é competitiva. |

### 4.2. Funcionalidades Detalhadas
- **Motor Autopsy:**
  - Scraping de página (via Monara/Browser MCP).
  - Análise de Headline vs. Promessa.
  - Identificação de Fricção (formulários longos, CTAs confusos).
  - Verificação de Prova Social.
- **Offer Lab:**
  - Wizard de "Stacking" (Empilhamento de Valor).
  - Calculadora de Valor Percebido vs. Preço Real.
  - Gerador de Garantias Incondicionais/Condicionais.

---

## 5. Requisitos Não-Funcionais
| Categoria | Requisito |
| :--- | :--- |
| **IA** | Uso do modelo Gemini 1.5 Pro para análise profunda de copy. |
| **UX** | Interface de "Laboratório" com elementos visuais de progresso e score em tempo real. |

---

## 6. Escopo

### 6.1. In Scope
- Rota `/funnels/[id]` (Visão Autopsy).
- Rota `/intelligence/offer-lab`.
- Endpoint `/api/intelligence/autopsy/run`.
- Integração com `funnel_review_playbook.md`.

### 6.2. Out of Scope
- Implementação automática das melhorias no código do cliente (apenas recomendações).
- Integração com ferramentas de Heatmap externas (Hotjar, etc).

---

## 7. Dependências e Integrações
| Tipo | Dependência | Responsável |
| :--- | :--- | :--- |
| **Conhecimento** | Playbooks do Brain Council | Wilder |
| **Arquitetura** | Contrato do Agente Autopsy | Athos |
| **Ferramenta** | Browser MCP para Scraping | Monara |

---

## 10. Anexos
- `_netecmt/brain/council/playbooks/funnel_review_playbook.md`
- `_netecmt/brain/council/mental-models/offer_formula.md`
