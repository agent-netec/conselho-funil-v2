# 📦 Story Pack: Sprint 13 - Intelligence Wing Foundation

**Versão:** 1.0  
**Status:** 🟢 Ready for Dev  
**Responsável:** Leticia (SM)  
**Sprint:** 13  
**Data:** 22/01/2026

---

## 📝 Resumo do Pack

Este pack contém o detalhamento técnico e critérios de aceite para as 6 histórias da Sprint 13, focadas na fundação da Ala de Inteligência.

| ID | Story | Pontos | Prioridade | Status |
|:---|:------|:-------|:-----------|:-------|
| **ST-13.1** | Arch: Intelligence Storage Design | 5 | P0 | 🟢 Ready |
| **ST-13.2** | Core: Scout Agent - Data Collection | 13 | P0 | 🟢 Ready |
| **ST-13.3** | Core: Analyst Agent - Sentiment Processing | 8 | P0 | 🟢 Ready |
| **ST-13.4** | UI: Intelligence Dashboard Skeleton | 8 | P1 | 🟢 Ready |
| **ST-13.5** | Config: Keyword Management | 5 | P0 | 🟢 Ready |
| **ST-13.6** | QA: Multi-Tenant Isolation Tests | 5 | P0 | 🟢 Ready |

---

## 🛠️ Detalhamento das Stories

### ST-13.1: Arch - Intelligence Storage Design
**Descrição:** Implementar a estrutura de namespaces no Pinecone e collections no Firestore conforme definido no contrato `intelligence-storage.md`.

**Critérios de Aceite:**
- [ ] Namespace `intelligence_{brandId}` criado logicamente no Pinecone.
- [ ] Collection `brands/{brandId}/intelligence` estruturada no Firestore.
- [ ] Interfaces TypeScript (`IntelligenceDocument`, `IntelligenceVector`) implementadas em `app/src/types/intelligence.ts`.
- [ ] Security Rules do Firestore atualizadas para isolamento por `brandId`.

---

### ST-13.2: Core - Scout Agent (Data Collection)
**Descrição:** Desenvolver o agente Scout para coleta de dados via RSS e Google News.

**Critérios de Aceite:**
- [ ] Implementação do `rss-parser` para leitura de feeds.
- [ ] Polling configurável (default 15 min) respeitando rate limits (100 req/h).
- [ ] Metadata obrigatória (`source`, `collectedAt`, `dataType`) salva em cada item.
- [ ] Graceful degradation: falha em uma fonte não interrompe as outras.
- [ ] Deduplicação básica via `textHash` (SHA-256 do conteúdo).

---

### ST-13.3: Core - Analyst Agent (Sentiment Processing)
**Descrição:** Implementar o processamento de sentimento e extração de keywords usando Gemini Flash.

**Critérios de Aceite:**
- [ ] Integração com Gemini Flash para análise de sentimento (positive/negative/neutral).
- [ ] Extração de até 10 keywords por documento.
- [ ] Cálculo de `sentimentScore` (-1.0 a 1.0).
- [ ] Status do documento atualizado de `raw` para `processed` após análise.
- [ ] Cache de resultados para evitar re-processamento do mesmo `textHash`.

---

### ST-13.4: UI - Intelligence Dashboard Skeleton
**Descrição:** Criar o esqueleto visual do dashboard de inteligência com componentes de loading e empty states.

**Critérios de Aceite:**
- [ ] Layout de 4 seções: Menções, Tendências, Sentimento e Feed.
- [ ] Componentes `MentionCard`, `TrendList` e `SentimentGauge` renderizando em estado Skeleton.
- [ ] Empty states informativos para "Sem Keywords" e "Sem Dados".
- [ ] Rota `/intelligence` protegida por autenticação e vinculada à marca ativa.

---

### ST-13.5: Config - Keyword Management
**Descrição:** Interface e lógica para gerenciar as keywords de monitoramento da marca.

**Critérios de Aceite:**
- [ ] CRUD de keywords (max 20) na collection `_config/keywords`.
- [ ] Tipagem de keywords: `brand`, `competitor`, `industry`, `product`.
- [ ] Integração com o BrandKit para herdar keywords pré-existentes.
- [ ] Validação de input (max 50 chars por termo).

---

### ST-13.6: QA - Multi-Tenant Isolation Tests
**Descrição:** Validar o isolamento de dados entre diferentes marcas (tenants).

**Critérios de Aceite:**
- [ ] Teste automatizado: Query de Brand A NUNCA retorna dados de Brand B.
- [ ] Teste de escrita: Rejeitar tentativas de salvar dados sem `brandId` ou com `brandId` divergente do token.
- [ ] Validação do TTL: Verificar se o campo `expiresAt` é populado corretamente conforme a política de retenção.

---

## 🛡️ Guardrails de Execução (Leticia's Notes)
1. **No Global Context:** Darllyson deve focar apenas nos arquivos listados na seção 6 do contrato.
2. **Contract First:** Qualquer desvio do schema exige aprovação do Athos.
3. **Definition of Done (DoD):** Código limpo, lints ok, testes de isolamento passando e documentação atualizada.

---
*Pack gerado por Leticia (SM) - NETECMT v2.0*
