---
project_name: "Sprint 20: Automation & Personalization"
version: "1.0"
author: "Wilder (Analyst Agent)"
date: "2026-01-29"
status: "Discovery"
sprint: 20
tags:
  - "discovery"
  - "automation"
  - "personalization"
  - "operations-wing"
  - "api-integrations"
---

# Discovery Report: Sprint 20 - Automation & Personalization

## 1. Introdução e Visão Geral
Este relatório de Discovery mapeia as fundações para a **Ala de Operações** de alta performance do Conselho de Funil. O foco é transformar a inteligência gerada nas sprints anteriores (especialmente a 19 - Funnel Autopsy & Offer Lab) em **execução autônoma e personalizada**.

## 2. Mapeamento de Automação (Operations Wing)

### 2.1. Content Autopilot
O objetivo é automatizar o ciclo de vida do conteúdo, desde a ideação baseada em tendências até a publicação.
- **Fluxo Crítico:** 
  1. `Scout Agent` detecta tendência -> `Analyst` valida relevância para a marca.
  2. `Writer` gera copy usando o `Copy DNA` e `Brand Voice`.
  3. `Designer` gera criativo no `Creative Vault`.
  4. `Publisher` agenda via APIs sociais.
- **Diferencial Estratégico:** O conteúdo não é apenas "gerado", ele é **validado** pelos frameworks dos Conselheiros (ex: Russell Brunson's Hook-Story-Offer).

### 2.2. Social Command Center
Central de engajamento proativo.
- **Fluxo Crítico:**
  1. Monitoramento de menções e DMs via Instagram Graph API.
  2. Classificação de sentimento e intenção de compra.
  3. Respostas automatizadas usando o `DM Selling Playbook`.
  4. Escala para humano em casos de alta complexidade/ticket alto.

## 3. Personalização Profunda (The Golden Thread)

### 3.1. Integração Autopsy + Offer Lab
A personalização em tempo real deve utilizar os dados forenses coletados:
- **Retargeting Dinâmico:** Se o `Funnel Autopsy` identificou que o lead saiu na etapa de "Prova Social", o anúncio de retargeting deve ser automaticamente focado em depoimentos e cases.
- **Ajuste de Oferta (Offer Lab):** Se o lead demonstrou sensibilidade a preço (identificado via comportamento no checkout), a automação pode disparar uma variação da oferta com um "Downsell" ou "Payment Plan" estruturado no Offer Lab.

### 3.2. Arquitetura de Personalização
- **Lead Context:** Armazenar o "Estágio de Consciência" do lead (Eugene Schwartz framework) no Firestore.
- **Dynamic Content Injection:** Utilizar o `Context Assembler` para injetar variáveis de personalização em landing pages e e-mails baseadas no `brandId` e `leadId`.

## 4. Mapeamento de APIs e Requisitos Técnicos

### 4.1. Meta Ads & Instagram Graph API
- **Requisitos:** Business Manager ID, App ID, System User Access Token.
- **Funcionalidades:** 
  - Criação de campanhas/ads (Ads Management).
  - Leitura de métricas em tempo real (Insights API).
  - Webhooks para comentários e DMs (Messenger Platform).

### 4.2. Google Ads API
- **Requisitos:** Developer Token, OAuth2 Credentials.
- **Funcionalidades:**
  - Sincronização de conversões offline.
  - Otimização de lances baseada no LTV calculado pela plataforma.

## 5. Brain Council Playbooks: Automação & Personalização

### 5.1. Frameworks de Referência
- **Dynamic Retargeting Framework:** Baseado no "Behavioral Dynamics" de Frank Kern. Sequenciamento de anúncios que mudam conforme o tempo de exposição e interação.
- **Message Sequencing:** Framework de "Intent-Based Branding" (Ryan Deiss). Automação de e-mail/DM que não apenas vende, mas educa conforme o nível de consciência.

### 5.2. Playbooks a serem Criados/Expandidos
- `dynamic_retargeting_playbook.md`: Regras para troca de criativos baseada em triggers de abandono.
- `social_engagement_sop.md`: Protocolos de resposta para o Social Command Center.

## 6. Próximos Passos (Check-in Insights)

1. **Arquitetura de Personalização:** Sugerimos a criação de um `Personalization Engine` que atue como um middleware entre o `Creative Vault` e as APIs de Ads.
2. **Validação de API:** Necessário iniciar o processo de aprovação de Apps na Meta e Google (long lead time).
3. **Draft de PRD:** Este documento será entregue ao Iuran para a formalização das User Stories da Sprint 20.

---
*Relatório gerado pelo Agente Wilder (Analyst) - 29/01/2026*
