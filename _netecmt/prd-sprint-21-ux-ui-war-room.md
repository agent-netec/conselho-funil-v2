---
project_name: "Conselho de Funil"
version: "1.0"
author: "Iuran (PM)"
date: "2026-01-29"
status: "Draft"
sprint: 21
tags:
  - "prd"
  - "ux-ui"
  - "refactoring"
  - "intelligence-wing"
---

# PRD Sprint 21: UX/UI War Room & Navigation Restructuring

## 1. Visão Geral

### 1.1. Resumo Executivo
A Sprint 21 foi redefinida para focar na consolidação da experiência do usuário (UX) e interface (UI). O objetivo é garantir que todas as funcionalidades de backend (APIs) estejam acessíveis através de uma navegação lógica e intuitiva, seguindo o fluxo: **Inteligência -> Estratégia -> Execução.**

### 1.2. O Problema
Atualmente, o backend possui 12 APIs órfãs e 6 páginas de inteligência sem acesso direto via menu. A navegação é confusa, com ícones duplicados e falta de hierarquia clara, o que impede o usuário de extrair o valor total da plataforma.

### 1.3. A Solução Proposta
Reestruturar o menu lateral (Sidebar), criar páginas âncoras para funcionalidades órfãs e implementar um dashboard de "Mission Control" que reflita a autonomia dos agentes.

---

## 2. Objetivos e Métricas de Sucesso

### 2.1. Objetivos (OKRs)
- **Objetivo:** Tornar 100% das funcionalidades de Inteligência acessíveis via UI.
- **KR1:** Implementar novo menu lateral agrupado por categorias lógicas.
- **KR2:** Criar páginas dedicadas para Keywords e Spy Agent.
- **KR3:** Corrigir todas as inconsistências de ícones e links.

---

## 3. Requisitos Funcionais (Mapa de Navegação)

### 3.1. Ala de Inteligência (Discovery & Intelligence)
- **[NOVO] Discovery Hub (`/intelligence/discovery`):** Centralização de Keywords e Spy Agent.
- **[AJUSTE] Dashboard de Inteligência (`/intelligence`):** Foco em sentimento de mercado e tendências.
- **[NOVO] Attribution & LTV:** Links diretos no menu para estas análises.

### 3.2. Estratégia & Laboratório
- **[NOVO] Funnel Autopsy:** Integração do diagnóstico dentro da página de detalhes do funil.
- **[AJUSTE] Offer Lab:** Destaque no menu como ferramenta estratégica.

### 3.3. Execução (The Agency)
- **[AJUSTE] Campaign Center:** Unificação da gestão de Ads.
- **[AJUSTE] Social Command:** Integração clara com o Social Inbox.

---

## 4. Requisitos Não-Funcionais
- **Consistência Visual:** Uso rigoroso do design system existente.
- **Performance:** Carregamento rápido das novas rotas.
- **Feedback Visual:** Estados de loading e toasts para todas as ações de IA.

---

## 5. Escopo
- **In Scope:** Reestruturação do menu, criação de 3 novas páginas âncoras, correção de ícones.
- **Out of Scope:** Refatoração completa da lógica de backend das APIs.
