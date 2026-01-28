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
  - name: "Luke"
    role: "Release/DevOps"
tags:
  - "sprint-29"
  - "personalization"
  - "intelligence"
  - "audience-scan"
---

# PRD: Sprint 29 — Personalização (Audience Intelligence + Dynamic Content)

Este documento descreve os requisitos de produto da **Sprint 29** para a frente de **Personalização**, com base no que já está implementado no repositório (rotas, engines e modelos). Ele serve como “fonte da verdade” para validar comportamento, consolidar escopo e orientar evolução.

## 1. Visão Geral

### 1.1. Resumo Executivo

A Sprint 29 introduz a camada de **personalização dinâmica** baseada em **inteligência psicográfica**. O sistema executa um **Deep-Scan** (IA) sobre leads + eventos recentes para deduzir uma persona consolidada (dores, desejos, objeções, sofisticação) e calcular **propensão comportamental** (hot/warm/cold).

Com o resultado do scan, o usuário cria **regras de conteúdo dinâmico** (ex.: variação de headline / VSL / oferta) e, opcionalmente, sincroniza sinais de leads “quentes” com plataformas de Ads para otimização de públicos (lookalikes).

### 1.2. O Problema

Sem uma camada de personalização, o produto opera com mensagens e ofertas “one-size-fits-all”. Isso limita conversão, dificulta otimização e impede automações baseadas em intenção real (comportamento) e não só em heurísticas.

### 1.3. A Solução Proposta

- **Audience Deep-Scan (IA)**: deduz persona consolidada via Gemini (JSON estruturado) usando dados anonimizados e rastro de eventos.
- **Propensity Engine**: calcula score 0–1 e segmenta hot/warm/cold com base em eventos e recência.
- **Dynamic Content Rules**: configura variações de conteúdo por persona/scan.
- **Ads Signals (Lookalike Sync)**: exporta sinais de leads “quentes” (ou compradores) para Ads (ex.: Meta) para otimização.

### 1.4. Impacto Esperado

- Aumento de conversão por melhor alinhamento de mensagem/oferta ao estágio e intenção da audiência.
- Base para automações (ads sync / segmentação / conteúdo) sustentadas por dados reais de comportamento.
- Evolução do “Intelligence” para um motor acionável (não apenas analítico).

---

## 2. Contexto e Background

### 2.1. Por Que Agora?

O repositório já referencia “Sprint 29 - Personalization” como rota crítica e inclui o motor inicial de scan e propensão. Consolidar o PRD permite:
- auditar o escopo real entregue;
- definir próximos passos (hardening multi-tenant, PII, integrações reais de Ads);
- reduzir retrabalho e inconsistências.

### 2.2. Personas de Usuário

| Persona | Descrição | Necessidades e Dores |
| :--- | :--- | :--- |
| **Brand Owner / Growth** | Dono(a) da marca ou responsável por crescimento | Entender audiência e adaptar mensagem/oferta rapidamente |
| **Performance / Media Buyer** | Opera campanhas e públicos | Gerar sinais e públicos com maior propensão |
| **Ops/CS** | Implementa regras e variações de conteúdo | Precisa de regra simples, rastreável e segura (PII/multi-tenant) |

### 2.3. Contexto de Negócio

Personalização conecta diretamente a camada de inteligência com monetização: segmenta, prioriza e adapta conteúdo, reduzindo CAC e melhorando LTV ao longo do funil.

---

## 3. Objetivos e Métricas de Sucesso

### 3.1. Objetivos (OKRs)

- **Objetivo:** habilitar personalização dinâmica com base em audiência real.
  - **KR1:** Usuário consegue executar um Deep-Scan e visualizar persona + propensão em UI.
  - **KR2:** Usuário consegue criar e salvar regra de conteúdo para uma persona (scan).
  - **KR3:** Motor de propensão segmenta corretamente (hot/warm/cold) com score 0–1.

### 3.2. Métricas de Sucesso (KPIs)

| Métrica | Descrição | Valor Atual | Valor Alvo |
| :--- | :--- | :--- | :--- |
| Execução de scan | Scans por marca/semana | n/d | >= 1 |
| Latência do scan | Tempo do POST até retorno | n/d | < 30s (MVP) |
| Qualidade de segmentação | Consistência hot/warm/cold | n/d | >= 80% “faz sentido” em amostras |

### 3.3. Critérios de Aceitação de Alto Nível

- [ ] Rota UI existe e carrega: `/intelligence/personalization` (`app/src/app/intelligence/personalization/page.tsx`).
- [ ] API executa scan: `POST /api/intelligence/audience/scan`.
- [ ] Scan salva em Firestore por `brandId` e aparece na lista.
- [ ] Regras de personalização podem ser criadas/salvas e recarregadas.

---

## 4. Requisitos Funcionais

### 4.1. User Stories Principais

| ID | User Story |
| :--- | :--- |
| US-29.1 | Como Brand Owner, quero executar um Deep-Scan de audiência para deduzir persona e propensão, para que eu personalize mensagem e oferta. |
| US-29.2 | Como Ops, quero criar regras de conteúdo dinâmico por persona/scan, para que eu adapte headline/VSL/oferta. |
| US-29.3 | Como Performance, quero exportar sinais de leads de alta qualidade para Ads, para otimizar públicos/lookalikes. |

### 4.2. Requisitos por Capability (mapeado ao código)

#### RF-29.1 — Audience Deep-Scan (IA)

- **Entrada**: `brandId` (obrigatório) e `leadLimit` (opcional) via `POST /api/intelligence/audience/scan`.
- **Coleta**:
  - buscar leads por `brandId` (coleção `leads`) com limite configurável;
  - amostrar eventos por lead (via `getLeadEvents(leadId, 10)`).
- **IA**:
  - construir prompt com dados simplificados/anônimos;
  - chamar Gemini com `responseMimeType: application/json`.
- **Saída**:
  - `persona`: demographics, painPoints, desires, objections, sophisticationLevel (1–5);
  - `propensity`: reasoning (string), score/segment calculados com base em dados reais;
  - `confidence` (0–1).

**Referências de implementação**:
- Engine: `app/src/lib/intelligence/personalization/engine.ts`
- Prompt: `app/src/lib/ai/prompts/audience-scan.ts`
- API: `app/src/app/api/intelligence/audience/scan/route.ts`

#### RF-29.2 — Gestão de Scans na UI

- Listar scans recentes (até 10) para a marca.
- Selecionar um scan para ver detalhes de persona e raciocínio.
- Estados: loading, empty state, erro com feedback.

**Referências**:
- UI: `app/src/app/intelligence/personalization/page.tsx`
- Componentes: `AudienceScanCard`, `PersonalizationRuleEditor` (referenciados pela UI).

#### RF-29.3 — Propensity Engine (comportamental)

- Calcular score normalizado \(0..1\) usando pesos por tipo de evento.
- Aplicar bônus de recência (eventos nas últimas 24h) e penalidade por inatividade (>7 dias).
- Segmentação:
  - `hot`: score >= 0.7
  - `warm`: score >= 0.3
  - `cold`: score < 0.3

**Referência**:
- `app/src/lib/intelligence/personalization/propensity.ts`

#### RF-29.4 — Ads Lookalike Sync (sinais para Ads)

- Buscar leads qualificados para exportação por `brandId`.
- Preparar integração com Ads (Meta) via adapter (stub).
- Retornar resultado com contagem e timestamp.

**Referência**:
- `app/src/lib/automation/adapters/ads-sync.ts`

#### RF-29.5 — Regras de Conteúdo Dinâmico

- Criar e salvar regra por persona (scan) contendo variações:
  - headline (obrigatório)
  - `vslId` (opcional)
  - `offerId` (opcional)
- Ativar/desativar regra.

**Persistência**:
- `brands/{brandId}/personalization_rules`

---

## 5. Requisitos Não-Funcionais

| Categoria | Requisito |
| :--- | :--- |
| **Segurança/Privacidade** | O scan deve **ignorar PII** e nunca incluir e-mail/nome/IP em prompts; dados devem ser isolados por `brandId`. |
| **Multi-tenant** | Nenhum dado de uma marca pode vazar para outra (coleções por brand). |
| **Confiabilidade** | Erros de IA devem retornar status 500 com mensagem segura; UI deve mostrar toast/feedback. |
| **Auditabilidade** | Cada scan deve ter `metadata.createdAt`, `leadCount`, `confidence`. |

---

## 6. Escopo

### 6.1. In Scope (O que ESTÁ no escopo)

- UI `/intelligence/personalization` para ver scans e editar regras.
- API `POST /api/intelligence/audience/scan` para disparar Deep-Scan.
- Propensity Engine hot/warm/cold.
- Persistência:
  - `brands/{brandId}/audience_scans`
  - `brands/{brandId}/personalization_rules`
- Base de sync para Ads (stub) para lookalike.

### 6.2. Out of Scope (O que NÃO ESTÁ no escopo)

- Aplicar regras de conteúdo em runtime no site público (renderização condicional final).
- Integração completa com upload de audiência no Meta (método TODO no adapter).
- Painel de performance por segmento (hot/warm/cold) com métricas.

### 6.3. Future Scope (Escopo Futuro)

- Aplicação de regras em páginas de funil/LP (targeting por segmento).
- Segmentação persistida em leads (campo `segment` derivado do PropensityEngine).
- Integrações completas (Meta/Google/TikTok) para públicos e eventos.
- Guardrails adicionais: rate limiting, quotas por marca, cache de scans.

---

## 7. Dependências e Integrações

| Tipo | Dependência | Contato Responsável |
| :--- | :--- | :--- |
| **IA** | Gemini (geração JSON estruturada) | Dev |
| **Dados** | Firestore (leads, journeys, collections por brand) | Dev |
| **Ads** | Meta Ads Adapter (upload custom audience — TODO) | Dev |

---

## 8. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Plano de Mitigação |
| :--- | :--- | :--- | :--- |
| IA devolver JSON inválido | Média | Alto | Parser robusto + retries + validação de schema |
| Vazamento de PII para prompt | Baixa/Média | Alto | Sanitização forte + testes + contrato de prompt |
| Multi-tenant inconsistência (brandId hardcoded) | Média | Alto | Integrar brandId do contexto de auth/tenant e remover fallback |
| Custo/latência do scan | Média | Médio | Cache + limitar amostra + quotas por marca |

---

## 9. Timeline e Milestones (Opcional)

| Milestone | Data Estimada |
| :--- | :--- |
| Hardening multi-tenant (brandId real) | a definir |
| Validação de schema do JSON (zod) | a definir |
| Integração real de Ads Lookalike | a definir |

---

## 10. Anexos

- UI: `app/src/app/intelligence/personalization/page.tsx`
- API: `app/src/app/api/intelligence/audience/scan/route.ts`
- Engine: `app/src/lib/intelligence/personalization/engine.ts`
- Prompt: `app/src/lib/ai/prompts/audience-scan.ts`
- Propensity: `app/src/lib/intelligence/personalization/propensity.ts`
- Persistência: `app/src/lib/firebase/personalization.ts`
- Checklist de rotas: `_netecmt/release-checklist.md` (“Sprint 29 - Personalization”)

