# 🔭 PRD: Sprint 13 - Intelligence Wing Foundation (Agency Engine)

**Versão:** 1.0  
**Status:** Ready for Architecture  
**Responsável:** Iuran (PM)  
**Data:** 22/01/2026  
**Deliberação:** Aprovado pelo Alto Conselho em 22/01/2026

---

## 1. Visão Geral

A Sprint 13 marca o início da **expansão Agency Engine** com a fundação da **Ala de Inteligência** — o primeiro dos três pilares que transformarão o Conselho de Funil em uma plataforma de automação de agência completa.

Esta sprint estabelece a infraestrutura de coleta e armazenamento de dados externos, criando os alicerces para os agentes **Scout** (coletor) e **Analyst** (processador).

### 🏛️ Contexto Arquitetural: O Templo

| Ala | Sprint | Status |
|:----|:-------|:-------|
| **Inteligência** | 13 (Esta) | ✅ Concluída |
| Biblioteca | 14 | 🚧 Em Planejamento |
| Operações | 15+ | ⏳ Backlog |

---

## 2. Objetivos Estratégicos

| ID | Objetivo | Impacto de Negócio |
|:---|:---------|:-------------------|
| **OBJ-13.1** | Estabelecer storage isolado para dados de inteligência | Habilita coleta sem poluir o namespace de ativos existente |
| **OBJ-13.2** | Implementar MVP de Social Listening | Primeira fonte de insights externos automatizados |
| **OBJ-13.3** | Criar estrutura visual do Intelligence Dashboard | Fundação para visualização de tendências e alertas |

---

## 3. Escopo da Sprint

### ✅ Incluído (P0/P1)

| # | Feature | Prioridade | Épico |
|:--|:--------|:-----------|:------|
| 1 | Intelligence Storage Foundation | P0 | E29 |
| 2 | Social Listening MVP | P0 | E29 |
| 3 | Intelligence Dashboard Skeleton | P1 | E30 |

### ⏸️ Excluído (P2 - Backlog Sprint 14+)

| Feature | Motivo da Exclusão |
|:--------|:-------------------|
| Twitter/X API Integration | API v2 paga e restritiva. Priorizar scraping/RSS primeiro. |
| Competitor Intelligence | Depende de fundação de storage completa |
| Alertas Automatizados | Requer dashboard funcional primeiro |
| News Radar | Escopo adicional para Sprint 14 |

---

## 4. Requisitos Funcionais

### 📦 E29: Intelligence Data Foundation

#### RF-01: Intelligence Namespace (Pinecone)

O sistema deve criar um namespace isolado para dados de inteligência:

```yaml
pinecone:
  index: conselho-de-funil
  namespaces:
    - universal              # Conhecimento dos Conselheiros (existente)
    - brand_{brandId}        # Ativos da marca (existente)
    - templates              # Blueprints (existente)
    - intelligence_{brandId} # NOVO: Dados de inteligência por marca
```

**Regras de Governança:**
- Isolamento total por `brandId` (zero vazamento entre tenants)
- TTL de 30 dias para dados de inteligência (auto-limpeza)
- Metadata obrigatória: `source`, `collectedAt`, `dataType`

#### RF-02: Intelligence Schema (Firestore)

Nova collection `intelligence` com estrutura:

```typescript
interface IntelligenceDocument {
  id: string;
  brandId: string;
  type: 'mention' | 'trend' | 'competitor' | 'news';
  source: {
    platform: string;      // 'twitter' | 'instagram' | 'rss' | 'google_news'
    url?: string;
    author?: string;
  };
  content: {
    text: string;
    sentiment?: 'positive' | 'negative' | 'neutral';
    keywords: string[];
  };
  metrics?: {
    engagement?: number;
    reach?: number;
  };
  collectedAt: Timestamp;
  processedAt?: Timestamp;
  status: 'raw' | 'processed' | 'archived';
}
```

#### RF-03: Data Retention Policy

| Tipo de Dado | Retenção | Ação após Expiração |
|:-------------|:---------|:--------------------|
| Menções Raw | 30 dias | Arquivar resumo, deletar original |
| Tendências | 90 dias | Manter agregados, deletar detalhes |
| Alertas | 7 dias | Deletar após visualização |

---

### 🔭 E29: Social Listening MVP

#### RF-04: Scout Agent - Data Collection

O agente **Scout** deve coletar dados de fontes públicas:

| Fonte | Método | Prioridade |
|:------|:-------|:-----------|
| Google News | RSS Feed | P0 |
| RSS Feeds (configuráveis) | HTTP Polling | P0 |
| Twitter/X | Scraping Controlado (Puppeteer) | P1 |
| Instagram | Scraping Público | P2 (Backlog) |

**Regras de Coleta:**
- Polling interval: 15 minutos (configurável por marca)
- Rate limiting: Max 100 requests/hora por fonte
- Graceful degradation: Se fonte falhar, continuar com outras

#### RF-05: Keyword Configuration

Cada marca pode configurar até 20 keywords para monitoramento:

```typescript
interface BrandKeywords {
  brandId: string;
  keywords: {
    term: string;
    type: 'brand' | 'competitor' | 'industry' | 'product';
    priority: 'high' | 'medium' | 'low';
  }[];
  excludeTerms: string[]; // Termos a ignorar
}
```

#### RF-06: Analyst Agent - Basic Processing

O agente **Analyst** processa dados coletados:

| Processamento | Método | Output |
|:--------------|:-------|:-------|
| Extração de Keywords | NLP básico (regex + heurísticas) | `keywords[]` |
| Análise de Sentimento | Gemini Flash (prompt simples) | `sentiment` |
| Deduplicação | Hash de conteúdo | Remove duplicatas |

---

### 📊 E30: Intelligence Dashboard Skeleton

#### RF-07: Dashboard Layout

Estrutura visual básica com 4 seções:

```
┌─────────────────────────────────────────────────┐
│ 📊 Intelligence Dashboard                        │
├─────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│ │ Menções     │ │ Tendências  │ │ Sentimento  │ │
│ │ (contador)  │ │ (lista)     │ │ (gauge)     │ │
│ └─────────────┘ └─────────────┘ └─────────────┘ │
├─────────────────────────────────────────────────┤
│ 📋 Feed de Menções Recentes                     │
│ ┌─────────────────────────────────────────────┐ │
│ │ [Skeleton cards - sem dados reais]          │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

#### RF-08: UI Components (Skeleton)

| Componente | Descrição | Estado Inicial |
|:-----------|:----------|:---------------|
| `MentionCard` | Card de menção individual | Skeleton loading |
| `TrendList` | Lista de keywords em alta | Placeholder |
| `SentimentGauge` | Indicador visual de sentimento geral | 50% neutro |
| `IntelligenceFeed` | Feed scrollável de menções | Empty state com CTA |

#### RF-09: Empty States

Cada seção deve ter um empty state informativo:

- **Sem Keywords:** "Configure palavras-chave para começar a monitorar"
- **Sem Dados:** "Coletando dados... primeira atualização em até 15 minutos"
- **Fonte Offline:** "⚠️ [Fonte] temporariamente indisponível"

---

## 5. Requisitos Não-Funcionais

### 🛡️ Guardrails (Aprovados pelo Alto Conselho)

| Guardrail | Regra | Validação |
|:----------|:------|:----------|
| **Multi-Tenant First** | Todo schema inclui `brandId` | Code review obrigatório |
| **Graceful Degradation** | Sistema funciona se fontes falharem | Testes de resiliência |
| **No Admin SDK** | Client SDK only (Windows 11 24H2) | Lint rule |
| **Polling over Streaming** | Arquitetura de polling para MVP | ADR documentado |

### ⚡ Performance

| Métrica | Target | Crítico |
|:--------|:-------|:--------|
| Latência de coleta | < 30s por fonte | > 60s |
| Processamento de menção | < 5s | > 15s |
| Dashboard load | < 2s | > 5s |

### 🔒 Segurança

- Dados de inteligência são **privados por marca** (zero compartilhamento)
- Scraping respeita `robots.txt` e rate limits
- Nenhuma credencial de usuário final é coletada

---

## 6. Dependências Técnicas

### Existentes (Reutilizar)
- Pinecone Client (já configurado)
- Firestore Client SDK
- Puppeteer (headless scraping)
- Gemini API (análise de sentimento)

### Novas (Adicionar)
- `rss-parser` - Parse de feeds RSS
- `cheerio` - Scraping de HTML (já na stack, confirmar versão)

---

## 7. User Stories de Alto Nível

| ID | Story | Persona | Critério de Aceite |
|:---|:------|:--------|:-------------------|
| US-13.1 | Como usuário, quero configurar keywords de monitoramento | Brand Owner | Keywords salvas e visíveis no BrandKit |
| US-13.2 | Como usuário, quero ver menções da minha marca | Brand Owner | Feed exibe menções com sentimento |
| US-13.3 | Como sistema, quero coletar dados de múltiplas fontes | Scout Agent | Dados no Firestore com metadata |
| US-13.4 | Como sistema, quero processar sentimento automaticamente | Analyst Agent | 80% das menções com sentimento |

---

## 8. Métricas de Sucesso

| Métrica | Target Sprint 13 | Método de Medição |
|:--------|:-----------------|:------------------|
| Keywords configuráveis | ≥ 20 por marca | Feature flag |
| Fontes de dados ativas | ≥ 2 (RSS + Google News) | Health check |
| Latência média de coleta | < 30s | Logs |
| Cobertura de sentimento | ≥ 80% das menções | Analytics |
| Dashboard funcional | Skeleton renderizando | E2E test |

---

## 9. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|:------|:--------------|:--------|:----------|
| APIs externas instáveis | Alta | Médio | Graceful degradation + retry com backoff |
| Rate limiting de scraping | Média | Alto | Respeitar robots.txt + intervalos conservadores |
| Custo de Gemini para sentimento | Baixa | Médio | Batch processing + cache de resultados |
| Complexidade de UI | Média | Baixo | Skeleton first, métricas em Sprint 14 |

---

## 10. Cronograma Sugerido

| Fase | Responsável | Entregável |
|:-----|:------------|:-----------|
| Arquitetura | Athos | Contract Map atualizado, ADR de polling |
| Story Packing | Leticia | Story Pack com acceptance criteria |
| Implementação | Darllyson | Código seguindo contracts |
| QA | Dandara | Testes de resiliência e multi-tenant |
| Review | Alto Conselho | Validação de guardrails |

---

## 11. Referências

- **Contexto do Projeto:** `_netecmt/project-context.md`
- **Deliberação:** Alto Conselho - 22/01/2026
- **PRD Anterior:** `prd-sprint-12-deep-intelligence.md`

---

*Documento gerado por Iuran (PM) - NETECMT v2.0*  
*Agency Engine Expansion | Sprint 13 | Intelligence Wing Foundation*
