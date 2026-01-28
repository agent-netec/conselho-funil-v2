---
project_name: "Conselho de Funil"
version: "1.0"
author: "NETECMT (gerado a partir do código existente)"
date: "2026-01-28"
status: "Draft"
stakeholders:
  - name: "Iuran"
    role: "PM"
  - name: "Darllyson"
    role: "Dev"
  - name: "Victor/Beto"
    role: "UX/UI"
  - name: "Luke"
    role: "Release/DevOps"
tags:
  - "master-prd"
  - "funcionalidades"
  - "rotas"
  - "apis"
---

# PRD Master: Mapa de Funcionalidades (Sprints 10–29)

Este documento é um **índice consolidado** para você verificar **todas as funcionalidades do produto** no estado atual do repositório. Ele organiza as capacidades por **módulo**, aponta as **rotas UI**, **APIs** e as **fontes de documentação** (PRDs, contratos e story packs).

> Observação: nem todas as Sprints 15–28 possuem PRD versionado neste repo. Quando o PRD não existe, este Master aponta para as rotas e APIs como “fonte da verdade” operacional.

## 1. Visão Geral

### 1.1. Resumo Executivo

O Conselho de Funil é uma plataforma de:
- **Geração e gestão de Funis** (copy/design/social) e seus artefatos;
- **Intelligence Wing** (social listening, competitor intelligence, LTV/journey, predictive, attribution, creative, personalization);
- **Automação** e integrações com Ads e eventos;
- **Assets / ingestão** e análise visual.

### 1.2. O Problema

Com várias Sprints e frentes, a verificação de funcionalidades vira um processo disperso. Este documento centraliza o “mapa do produto” para auditoria, onboarding e alinhamento.

### 1.3. A Solução Proposta

- Tabela de **Rotas Críticas** (UI) por módulo;
- Lista de **APIs** por domínio;
- Pointers para PRDs/contratos/story packs onde existirem.

### 1.4. Impacto Esperado

- Redução do tempo de auditoria (o que existe / onde está / como testar).
- Melhor rastreabilidade entre produto (PRD), execução (packs) e código (rotas/APIs).

---

## 2. Contexto e Background

### 2.1. Por Que Agora?

O repo já possui guardrails de “rotas críticas 10–29” (CI e checklist de release). Consolidar este PRD Master permite validar rapidamente o “shape” do produto e planejar documentação faltante.

### 2.2. Personas de Usuário

| Persona | Descrição | Necessidades e Dores |
| :--- | :--- | :--- |
| **Brand Owner / Growth** | Dono(a) da marca | Visibilidade do funil, assets e inteligência acionável |
| **Performance / Media Buyer** | Opera campanhas | Attribution, creative, audiences, automações |
| **Ops/CS** | Implementação e governança | Checklist, rotas, consistência e segurança (multi-tenant) |
| **Dev/QA** | Sustentação e evolução | Mapa de APIs, contratos e testes |

---

## 3. Objetivos e Métricas de Sucesso

### 3.1. Objetivos (OKRs)

- **Objetivo:** permitir auditoria do produto por rotas/APIs.
  - **KR1:** Toda rota crítica listada tem um arquivo `page.tsx` correspondente.
  - **KR2:** Todo endpoint crítico tem `route.ts` e padrão de erro consistente.
  - **KR3:** Existe documentação mínima para cada módulo (PRD ou pointers).

### 3.2. Métricas de Sucesso (KPIs)

| Métrica | Descrição | Valor Atual | Valor Alvo |
| :--- | :--- | :--- | :--- |
| Cobertura de documentação | % de módulos com PRD/contrato/pack referenciados | n/d | 100% |
| Tempo de auditoria | tempo para mapear onde fica uma feature | n/d | < 10 min |

---

## 4. Requisitos Funcionais (Mapa do Produto)

### 4.1. Rotas UI (módulos principais)

Rotas identificadas no código (arquivos `page.tsx`) e usadas como “rotas críticas” (ver `_netecmt/release-checklist.md` e `.github/workflows/ci.yml`).

| Módulo | Rota | Arquivo | Descrição |
| :--- | :--- | :--- | :--- |
| Assets | `/assets` | `app/src/app/assets/page.tsx` | Dashboard/gestão de assets e ingestão |
| Campaign | `/campaign/[id]` | `app/src/app/campaign/[id]/page.tsx` | Command Center por campanha |
| Campaigns | `/campaigns` | `app/src/app/campaigns/page.tsx` | Lista/gestão de campanhas |
| Funnels | `/funnels` | `app/src/app/funnels/page.tsx` | Lista/gestão de funis |
| Funnels | `/funnels/new` | `app/src/app/funnels/new/page.tsx` | Criar funil |
| Funnel Autopsy | `/funnels/[id]` | `app/src/app/funnels/[id]/page.tsx` | Visão detalhada do funil |
| Funnel Copy | `/funnels/[id]/copy` | `app/src/app/funnels/[id]/copy/page.tsx` | Copys e geração/edição |
| Funnel Design | `/funnels/[id]/design` | `app/src/app/funnels/[id]/design/page.tsx` | Design e geração/planos |
| Funnel Social | `/funnels/[id]/social` | `app/src/app/funnels/[id]/social/page.tsx` | Artefatos sociais ligados ao funil |
| Intelligence | `/intelligence` | `app/src/app/intelligence/page.tsx` | Base da Ala de Inteligência |
| Intelligence (LTV) | `/intelligence/ltv` | `app/src/app/intelligence/ltv/page.tsx` | Inteligência de LTV/coortes |
| Journey | `/intelligence/journey/[leadId]` | `app/src/app/intelligence/journey/[leadId]/page.tsx` | Linha do tempo por lead |
| Predictive | `/intelligence/predictive` | `app/src/app/intelligence/predictive/page.tsx` | Predição/ROI forecast |
| Attribution | `/intelligence/attribution` | `app/src/app/intelligence/attribution/page.tsx` | Attribution |
| Creative | `/intelligence/creative` | `app/src/app/intelligence/creative/page.tsx` | Creative Lab / ranking/copy |
| Personalization | `/intelligence/personalization` | `app/src/app/intelligence/personalization/page.tsx` | Audience Scan + regras dinâmicas (Sprint 29) |
| Social | `/social` | `app/src/app/social/page.tsx` | Social Command Center |
| Social Inbox | `/social-inbox` | `app/src/app/social-inbox/page.tsx` | Inbox/geração/estrutura |
| Performance | `/performance/cross-channel` | `app/src/app/performance/cross-channel/page.tsx` | Cross-channel performance |

### 4.2. APIs (endpoints principais)

Lista de endpoints `route.ts` (Next.js App Router) agrupados por domínio.

#### AI / Chat

- `POST /api/chat` → `app/src/app/api/chat/route.ts`
- `POST /api/ai/analyze-visual` → `app/src/app/api/ai/analyze-visual/route.ts`

#### Funnels / Copy / Design

- `POST /api/funnels/generate` → `app/src/app/api/funnels/generate/route.ts`
- `POST /api/funnels/export` → `app/src/app/api/funnels/export/route.ts`
- `POST /api/funnels/share` → `app/src/app/api/funnels/share/route.ts`
- `POST /api/copy/generate` → `app/src/app/api/copy/generate/route.ts`
- `POST /api/copy/decisions` → `app/src/app/api/copy/decisions/route.ts`
- `POST /api/design/plan` → `app/src/app/api/design/plan/route.ts`
- `POST /api/design/generate` → `app/src/app/api/design/generate/route.ts`
- `POST /api/design/upscale` → `app/src/app/api/design/upscale/route.ts`

#### Assets / Ingestão

- `POST /api/ingest/url` → `app/src/app/api/ingest/url/route.ts`
- `POST /api/ingest/process-worker` → `app/src/app/api/ingest/process-worker/route.ts`
- `GET/POST /api/assets/metrics` → `app/src/app/api/assets/metrics/route.ts`

#### Intelligence (núcleo)

- `POST /api/intelligence/events/ingest` → `app/src/app/api/intelligence/events/ingest/route.ts`
- `GET /api/intelligence/journey/[leadId]` → `app/src/app/api/intelligence/journey/[leadId]/route.ts`
- `GET/POST /api/intelligence/keywords` → `app/src/app/api/intelligence/keywords/route.ts`
- `POST /api/intelligence/spy` → `app/src/app/api/intelligence/spy/route.ts`
- `POST /api/intelligence/autopsy/run` → `app/src/app/api/intelligence/autopsy/run/route.ts`

#### Intelligence (LTV / Offer / Predictive / Creative / Personalization)

- `GET /api/intelligence/ltv/cohorts` → `app/src/app/api/intelligence/ltv/cohorts/route.ts`
- `POST /api/intelligence/offer/calculate-score` → `app/src/app/api/intelligence/offer/calculate-score/route.ts`
- `POST /api/intelligence/creative/ranking` → `app/src/app/api/intelligence/creative/ranking/route.ts`
- `POST /api/intelligence/creative/copy` → `app/src/app/api/intelligence/creative/copy/route.ts`
- `POST /api/intelligence/audience/scan` → `app/src/app/api/intelligence/audience/scan/route.ts` (**Sprint 29**)

#### Social

- `POST /api/social/generate` → `app/src/app/api/social/generate/route.ts`
- `POST /api/social/structure` → `app/src/app/api/social/structure/route.ts`
- `POST /api/social/scorecard` → `app/src/app/api/social/scorecard/route.ts`
- `POST /api/social/hooks` → `app/src/app/api/social/hooks/route.ts`
- `GET/POST /api/social-inbox` → `app/src/app/api/social-inbox/route.ts`

#### Reporting / Integrations / Webhooks

- `POST /api/reporting/generate` → `app/src/app/api/reporting/generate/route.ts`
- `POST /api/reporting/anomaly-check` → `app/src/app/api/reporting/anomaly-check/route.ts`
- `POST /api/integrations/offline-conversion` → `app/src/app/api/integrations/offline-conversion/route.ts`
- `POST /api/webhooks/ads-metrics` → `app/src/app/api/webhooks/ads-metrics/route.ts`

#### Admin / Infra

- `POST /api/admin/ingest-knowledge` → `app/src/app/api/admin/ingest-knowledge/route.ts`
- `POST /api/admin/upload-knowledge` → `app/src/app/api/admin/upload-knowledge/route.ts`
- `GET /api/pinecone/health` → `app/src/app/api/pinecone/health/route.ts`
- `POST /api/pinecone/migrate` → `app/src/app/api/pinecone/migrate/route.ts`
- `POST /api/automation/kill-switch` → `app/src/app/api/automation/kill-switch/route.ts`

---

## 5. Requisitos Não-Funcionais (Guardrails globais)

| Categoria | Requisito |
| :--- | :--- |
| **Multi-tenant** | `brandId` deve isolar leitura e escrita por marca |
| **Privacidade (PII)** | Prompts e logs devem evitar PII e dados sensíveis |
| **Observabilidade** | Erros de API devem ser logados com tag do domínio e retornar JSON consistente |
| **Qualidade** | CI valida rotas críticas; build e testes devem passar antes de deploy |

---

## 6. Escopo (do Master PRD)

### 6.1. In Scope

- Mapa de rotas e APIs existentes no repositório.
- Referências para documentação disponível por Sprint/módulo.

### 6.2. Out of Scope

- Reescrever PRDs completos para Sprints 15–28 (fica como ação posterior).

### 6.3. Future Scope

- Criar PRDs faltantes (S15–S28) com base em rotas + APIs + story packs.
- Adicionar checklist de teste manual por módulo (QA playbook).

---

## 7. Dependências e Integrações

| Tipo | Dependência | Onde aparece |
| :--- | :--- | :--- |
| **DB/Auth** | Firebase/Firestore | `app/src/lib/firebase/*` |
| **IA** | Gemini (prompts/geração) | `app/src/lib/ai/*` |
| **Vector DB** | Pinecone | `app/src/app/api/pinecone/*` + libs |
| **Ads** | Integrações Meta/Ads | `app/src/lib/automation/adapters/*` + webhooks |

---

## 8. Referências (Documentação)

### 8.1. PRDs por Sprint (disponíveis no repo)

- Sprint 11: `_netecmt/prd-sprint-11-brain-expansion.md`
- Sprint 12: `_netecmt/prd-sprint-12-deep-intelligence.md`
- Sprint 13: `_netecmt/prd-sprint-13-intelligence-wing.md`
- Sprint 14: `_netecmt/prd-sprint-14-intelligence-expansion.md`
- Sprint 29: `_netecmt/prd-sprint-29-personalization.md` (criado a partir do código)

### 8.2. Story Packs / Post-mortems

- Post-mortems e story packs históricos: `_netecmt/archive/sprints/*`
- Packs executáveis e histórias: `_netecmt/packs/*` e `_netecmt/packs/stories/*`

### 8.3. Checklist operacional (release/CI)

- Checklist: `_netecmt/release-checklist.md`
- CI: `.github/workflows/ci.yml`

