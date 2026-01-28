# ADR-001: Polling vs Streaming para Intelligence Wing

**Status:** Accepted  
**Decisor:** Athos (Architect)  
**Data:** 22/01/2026  
**Sprint:** 13 - Intelligence Wing Foundation

---

## 1. Contexto

A Ala de Inteligência do Agency Engine precisa coletar dados de fontes externas (RSS, APIs, scraping) de forma contínua para alimentar o módulo de Social Listening. Existem duas abordagens arquiteturais principais:

| Abordagem | Descrição |
|:----------|:----------|
| **Polling** | Requisições periódicas em intervalos fixos (ex: 15 min) |
| **Streaming** | Conexões persistentes com push de dados em tempo real |

Esta decisão impacta diretamente: custo de infraestrutura, latência de dados, complexidade de implementação e resiliência do sistema.

---

## 2. Decisão

**Adotar Polling como estratégia de coleta para o MVP da Sprint 13.**

O sistema utilizará requisições periódicas em intervalos configuráveis (default: 15 minutos) para buscar dados de fontes externas, com processamento em batch pelo Analyst Agent.

---

## 3. Justificativa Técnica

### 3.1 Análise de Trade-offs

| Critério | Polling | Streaming | Vencedor |
|:---------|:--------|:----------|:---------|
| **Latência** | 15 min (configurável) | Near real-time (< 1s) | Streaming |
| **Custo de Infra** | Baixo (serverless) | Alto (conexões persistentes) | **Polling** |
| **Complexidade** | Baixa (HTTP simples) | Alta (WebSocket, SSE, reconexão) | **Polling** |
| **Resiliência** | Alta (retry nativo) | Média (reconexão manual) | **Polling** |
| **Compatibilidade** | Universal (qualquer API) | Limitada (APIs específicas) | **Polling** |
| **Escalabilidade** | Linear (batch) | Complexa (fan-out) | **Polling** |
| **Debug/Monitoramento** | Fácil (logs discretos) | Difícil (fluxo contínuo) | **Polling** |

### 3.2 Análise de Custo

#### Cenário: 100 marcas ativas, 3 fontes por marca

**Polling (15 min interval):**
```
Requests/hora = 100 marcas × 3 fontes × 4 polls = 1,200 req/h
Requests/mês = 1,200 × 24 × 30 = 864,000 req/mês

Custo estimado (Vercel Serverless):
- Executions: ~$0 (dentro do free tier até 1M)
- Bandwidth: ~$5-10/mês (assumindo 1KB avg response)
```

**Streaming (WebSocket):**
```
Conexões simultâneas = 100 marcas × 3 fontes = 300 conexões
Uptime necessário = 24/7 (720h/mês)

Custo estimado (necessário serviço dedicado):
- AWS API Gateway WebSocket: $1/milhão de mensagens + $0.25/milhão de connection-minutes
- Ou serviço dedicado (Pusher, Ably): $50-200/mês
```

**Conclusão:** Polling é **~10x mais barato** para o volume estimado do MVP.

### 3.3 Compatibilidade com Fontes

| Fonte | Suporte a Streaming | Suporte a Polling |
|:------|:--------------------|:------------------|
| Google News | ❌ Não | ✅ RSS Feed |
| RSS Feeds | ❌ Não | ✅ HTTP GET |
| Twitter/X | ⚠️ API v2 paga ($100+/mês) | ✅ Scraping |
| Instagram | ❌ Não (Graph API limitada) | ✅ Scraping |
| LinkedIn | ❌ Não | ✅ API polling |

**Conclusão:** A maioria das fontes **não oferece streaming gratuito/viável**.

### 3.4 Latência vs. Necessidade de Negócio

Para Social Listening em contexto de agência:
- **Alertas críticos** (crise de PR): Latência de 15 min é aceitável
- **Análise de tendências**: Atualização diária é suficiente
- **Monitoramento de menções**: 15-30 min é padrão de mercado

Comparativo com ferramentas de mercado:
| Ferramenta | Latência típica |
|:-----------|:----------------|
| Hootsuite | 15-30 min |
| Sprout Social | 15 min |
| Mention | 5-15 min |
| Brand24 | 10-15 min |

**Conclusão:** 15 minutos está **dentro do padrão de mercado**.

---

## 4. Arquitetura de Polling Proposta

### 4.1 Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────────┐
│                     POLLING ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     │
│  │   Scheduler  │────▶│ Scout Agent  │────▶│   Sources    │     │
│  │  (cron/edge) │     │  (collector) │     │ (RSS, APIs)  │     │
│  └──────────────┘     └──────────────┘     └──────────────┘     │
│         │                    │                                   │
│         │                    ▼                                   │
│         │            ┌──────────────┐                           │
│         │            │    Queue     │                           │
│         │            │  (in-memory) │                           │
│         │            └──────────────┘                           │
│         │                    │                                   │
│         │                    ▼                                   │
│         │            ┌──────────────┐     ┌──────────────┐     │
│         │            │Analyst Agent │────▶│   Storage    │     │
│         │            │ (processor)  │     │(Firestore +  │     │
│         │            └──────────────┘     │  Pinecone)   │     │
│         │                    │            └──────────────┘     │
│         │                    ▼                                   │
│         │            ┌──────────────┐                           │
│         │            │  Dashboard   │                           │
│         └───────────▶│   (reads)    │                           │
│                      └──────────────┘                           │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Fluxo de Execução

```typescript
// Pseudo-código do ciclo de polling
async function pollCycle(brandId: string): Promise<void> {
  const config = await getKeywordsConfig(brandId);
  
  // 1. Scout: Coleta paralela de todas as fontes
  const collections = await Promise.allSettled(
    config.enabledSources.map(source => 
      scoutAgent.collect(brandId, source, config.keywords)
    )
  );
  
  // 2. Filtrar sucessos e agregar erros
  const { items, errors } = aggregateResults(collections);
  
  // 3. Deduplica por hash de conteúdo
  const uniqueItems = deduplicateByHash(items);
  
  // 4. Analyst: Processamento em batch
  await analystAgent.processBatch(brandId, uniqueItems);
  
  // 5. Log de health para monitoramento
  await logCollectionHealth(brandId, { items: uniqueItems.length, errors });
}
```

### 4.3 Configuração de Intervals

```typescript
interface PollingConfig {
  // Intervals por tipo de fonte
  intervals: {
    rss: number;          // 15 min (default)
    googleNews: number;   // 30 min (rate limit conservador)
    twitter: number;      // 60 min (scraping cauteloso)
    instagram: number;    // 120 min (scraping muito cauteloso)
  };
  
  // Backoff exponencial em caso de erro
  backoff: {
    initialDelayMs: 60000;   // 1 min
    maxDelayMs: 3600000;     // 1 hora
    multiplier: 2;
  };
  
  // Circuit breaker
  circuitBreaker: {
    failureThreshold: 5;     // Falhas consecutivas
    resetTimeoutMs: 300000;  // 5 min para tentar novamente
  };
}
```

---

## 5. Graceful Degradation

### 5.1 Estratégia de Resiliência

```typescript
// Cada fonte é independente - falha de uma não afeta outras
async function collectWithResilience(
  brandId: string,
  sources: SourceConfig[]
): Promise<CollectionResult> {
  const results: CollectionResult = {
    successful: [],
    failed: [],
    partial: [],
  };
  
  for (const source of sources) {
    try {
      const data = await withTimeout(
        scoutCollect(brandId, source),
        30000 // 30s timeout
      );
      results.successful.push({ source: source.name, count: data.length });
    } catch (error) {
      if (isRetryableError(error)) {
        // Adiciona à fila de retry
        await scheduleRetry(brandId, source, error);
        results.partial.push({ source: source.name, reason: 'scheduled_retry' });
      } else {
        // Registra falha e continua
        results.failed.push({ source: source.name, error: error.message });
        await notifySourceFailure(brandId, source, error);
      }
    }
  }
  
  return results;
}
```

### 5.2 Health Checks

```typescript
// API: GET /api/intelligence/health
interface IntelligenceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastPollAt: Timestamp;
  sources: {
    [sourceName: string]: {
      status: 'online' | 'degraded' | 'offline';
      lastSuccessAt?: Timestamp;
      consecutiveFailures: number;
      errorMessage?: string;
    };
  };
  metrics: {
    pollsLast24h: number;
    itemsCollectedLast24h: number;
    averageLatencyMs: number;
  };
}
```

---

## 6. Plano de Migração para Streaming (Futuro)

### 6.1 Gatilhos para Migração

A migração para streaming deve ser considerada quando:

| Gatilho | Threshold | Ação |
|:--------|:----------|:-----|
| Latência crítica para negócio | Clientes exigem < 5 min | Avaliar fontes prioritárias |
| Volume de marcas | > 500 marcas ativas | Custo de polling escala |
| APIs com streaming gratuito | Twitter v2 ficar acessível | Migração gradual |
| Requisito de alertas real-time | Caso de uso de crise PR | Híbrido polling + WebSocket |

### 6.2 Arquitetura Híbrida (Fase 2)

```
┌─────────────────────────────────────────────────────────────────┐
│                    HYBRID ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    POLLING LAYER                          │   │
│  │  (RSS, Google News, APIs sem streaming)                   │   │
│  │  Interval: 15-30 min                                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                            │                                     │
│                            ▼                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   UNIFIED QUEUE                           │   │
│  │  (normaliza dados de ambas as fontes)                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                            ▲                                     │
│                            │                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   STREAMING LAYER                         │   │
│  │  (Twitter Stream, WebSocket APIs)                         │   │
│  │  Latência: near real-time                                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 6.3 Critérios de Pronto para Migração

- [ ] Custo de polling > $100/mês
- [ ] Pelo menos 3 fontes com streaming API disponível
- [ ] Requisito de negócio documentado para latência < 5 min
- [ ] Infraestrutura de WebSocket provisionada
- [ ] Testes de carga validados

---

## 7. Consequências

### 7.1 Positivas

- ✅ **Custo mínimo** - Executa dentro do free tier de serverless
- ✅ **Simplicidade** - HTTP requests padrão, fácil de debugar
- ✅ **Resiliência** - Falhas isoladas, retry automático
- ✅ **Compatibilidade** - Funciona com qualquer fonte que tenha endpoint HTTP
- ✅ **Previsibilidade** - Carga conhecida e controlada

### 7.2 Negativas

- ⚠️ **Latência** - Mínimo 15 min entre atualizações
- ⚠️ **Dados perdidos** - Se fonte atualizar e remover antes do poll
- ⚠️ **Não é real-time** - Alertas críticos terão delay

### 7.3 Riscos Aceitos

| Risco | Probabilidade | Impacto | Mitigação |
|:------|:--------------|:--------|:----------|
| Cliente precisa de real-time | Baixa | Médio | Comunicar limitação + oferecer upgrade futuro |
| API muda e quebra polling | Média | Baixo | Graceful degradation + alertas |
| Volume escala e polling fica caro | Baixa (MVP) | Médio | Monitorar métricas + plano de migração |

---

## 8. Referências

- **PRD Sprint 13:** `_netecmt/prd-sprint-13-intelligence-wing.md`
- **Contract Map:** `_netecmt/contracts/intelligence-storage.md`
- **Comparativo de Ferramentas:** Hootsuite, Sprout Social, Brand24 (análise de mercado)

---

*ADR aprovado por Athos (Architect) - NETECMT v2.0*  
*Sprint 13 | Intelligence Wing Foundation*  
*Próxima revisão: Sprint 15 ou quando gatilhos de migração forem atingidos*
