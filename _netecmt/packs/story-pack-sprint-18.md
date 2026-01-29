# 📦 Story Pack: Sprint 18 - Performance War Room

**Versão:** 1.0  
**Status:** READY  
**Responsável:** Leticia (SM)  
**Sprint:** 18  
**Data:** 29/01/2026

---

## 🎯 Objetivo do Pack
Implementar a infraestrutura de dados para o **Performance War Room**, com foco na gestão segura de chaves de API (BYO Keys) e na estrutura de métricas multicanal, garantindo o isolamento total por `brandId`.

## 🛡️ Contract Gate
- **Contrato Principal:** `_netecmt/contracts/performance-spec.md`
- **Lane:** `performance_war_room`
- **Paths Autorizados:**
  - `app/src/lib/performance/**`
  - `app/src/app/api/performance/**`
  - `app/src/types/performance.ts`

---

## 📝 Stories Detalhadas

### ST-18.1: Performance Data Schema & Types
**Descrição:** Definir as interfaces de dados no TypeScript conforme o contrato técnico do Athos.
- **Tarefas:**
  1. Criar `app/src/types/performance.ts`.
  2. Implementar interfaces `PerformanceConfig`, `PerformanceMetric` e `PerformanceAnomaly`.
  3. Exportar tipos para uso global na lane.
- **Critério de Aceite:** Tipos compilando sem erros e refletindo exatamente o contrato.

### ST-18.2: Integration Manager & BYO Keys (Security First)
**Descrição:** Implementar a lógica de armazenamento seguro e validação de chaves de API.
- **Tarefas:**
  1. Criar `app/src/lib/performance/encryption.ts` para cifragem AES-256-GCM (usar `PERFORMANCE_ENCRYPTION_KEY`).
  2. Implementar `app/src/app/api/performance/integrations/validate/route.ts` com suporte a `mock=true`.
  3. Criar service em `app/src/lib/performance/config-service.ts` para salvar `PerformanceConfig` no Firestore.
- **Critério de Aceite:** 
  - Chaves salvas no Firestore devem estar criptografadas.
  - Endpoint de validação deve retornar sucesso para o mock.
  - Bloqueio de acesso cross-tenant via UID do dono da brand.

### ST-18.3: Performance Metrics Aggregator (Mock-Ready)
**Descrição:** Criar o endpoint central de métricas que consolida dados de múltiplas fontes.
- **Tarefas:**
  1. Criar `app/src/app/api/performance/metrics/route.ts`.
  2. Implementar lógica de agregação (Meta + Google + Organic).
  3. Adicionar suporte a query param `mock=true` para retornar dados randômicos de teste.
- **Critério de Aceite:** 
  - Endpoint retorna array de `PerformanceMetric`.
  - Dados agregados somam corretamente os valores das fontes.

### ST-18.4: The Sentry - Anomaly Detection Engine (Alpha)
**Descrição:** Implementar o motor básico de detecção de anomalias baseado em thresholds.
- **Tarefas:**
  1. Criar `app/src/lib/performance/sentry-engine.ts`.
  2. Implementar lógica de comparação entre `valueAtDetection` e `expectedValue` (baseado na sensibilidade: 15%, 30%, 50%).
  3. Criar endpoint `GET /api/performance/anomalies` para listar alertas.
- **Critério de Aceite:** 
  - O sistema gera um documento em `performance_anomalies` quando o desvio ultrapassa o threshold.

---

## 🛠️ Instruções para Darllyson (Dev)
1. **Read Before Run:** Leia `_netecmt/contracts/performance-spec.md` antes de codar.
2. **Mock First:** Comece pelos mocks para garantir que a UI possa ser desenvolvida em paralelo.
3. **Security:** Nunca logue chaves de API em texto puro, mesmo em ambiente de dev.
4. **Lane Isolation:** Não modifique arquivos fora da lane `performance_war_room`.

---
*Pack gerado por Leticia (SM) sob a metodologia NETECMT v2.0*
