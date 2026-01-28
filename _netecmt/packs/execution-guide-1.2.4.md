# 🧪 QA Test Plan: US-1.2.4 - Validação de Recuperação (Hit Rate)

**Story:** US-1.2.4  
**QA Resident:** Dandara  
**Context:** `app/src/lib/ai/rag.ts`

---

## 🎯 Objetivo
Garantir que as otimizações de Reranking (1.2.1) e Filtros (1.2.2) resultaram em uma melhoria real na precisão da busca, e que a UI (1.2.3) está exibindo os dados corretos.

## 📝 Roteiro de Testes

### 1. Teste de Hit Rate (Semântico)
- **Cenário**: Pergunta específica sobre uma heurística conhecida (ex: "Como Eugene Schwartz define os 5 níveis de consciência?").
- **Expectativa**: O chunk correto deve estar no Top 3 após o Reranking.
- **Métrica**: Comparar a posição do chunk ANTES e DEPOIS do Reranking.

### 2. Teste de Gate de Segurança (isApprovedForAI)
- **Cenário**: Tentar recuperar um asset que existe no Firestore mas possui `isApprovedForAI: false`.
- **Expectativa**: O asset NUNCA deve aparecer nos `sources` retornados pela API.

### 3. Teste de Filtro Dinâmico (Categoria)
- **Cenário**: Realizar uma query com filtro `category: 'ads'`.
- **Expectativa**: 100% dos resultados retornados devem possuir `metadata.category == 'ads'`.

### 4. Teste de Integridade da UI
- **Cenário**: Abrir o popover de uma fonte no chat.
- **Expectativa**: O snippet exibido deve corresponder ao conteúdo do chunk e o score deve bater com o valor retornado pela API.

## 💻 Automação
Implementar os testes em `app/src/__tests__/lib/retrieval.test.ts` utilizando mocks do Firestore e da API da Cohere se necessário, ou rodar testes de integração reais no ambiente de dev.

---
**Leticia (SM):** Dandara, precisamos de **DADOS**. Sem a confirmação de que o Reranker está funcionando melhor que a busca pura, não podemos fechar a sprint.
