# Relatório de Validação QA - ST-1.4.4 (Gatekeeper: Validação de Fontes)

**Responsável:** Dandara (QA Specialist) 🐞  
**Data:** 12/01/2026  
**Status Final:** 🔴 **REPROVADO**

---

## 🎯 Objetivo da Validação
Garantir que o sistema RAG priorize os novos dados de 2026 (benchmarks e scripts de Social-to-Sale) em relação aos dados genéricos anteriores da base de conhecimento.

## 🔍 Evidências de Teste (Code Review)

### 1. Análise do Motor de RAG (`app/src/lib/ai/rag.ts`)
O pipeline de recuperação atual segue a ordem:
1.  **Busca Vetorial/Keyword**: `similarity = (embeddingSimilarity * 0.4) + (keywordScore * 0.6)`
2.  **Reranking (Cohere)**: Envia os top 50 para o modelo `rerank-multilingual-v3.0`.

**Falha Detectada:** O score de similaridade e o reranker são puramente semânticos. Se um livro antigo de 500 páginas e um script novo de 20 linhas falarem sobre "DMs", o livro pode vencer pelo volume de palavras-chave, sem que haja um peso extra para a **recência** ou para o **docType** prático.

### 2. Mapeamento de Intenção Incompleto
Na função `ragQuery`, o mapeamento automático de intenção não contempla o novo Conselho Social:
```typescript
const intentMap: Record<string, string> = {
  'copy': 'copywriting',
  'anúncios': 'ads',
  'ads': 'ads',
  'estratégia': 'strategy',
  'funil': 'funnel'
};
```
**Impacto:** Consultas sobre redes sociais não ativam os filtros dinâmicos de categoria, dificultando a localização dos playbooks de 2026.

### 3. Ausência de "Playbook Boost"
Não há tratamento diferenciado para `metadata.docType == 'playbook'`. Em cenários de consultoria, scripts práticos deveriam ter precedência sobre definições de identidade.

---

## 🚨 Defeitos Encontrados (Bugs)

| ID | Descrição | Severidade | Prioridade |
| :--- | :--- | :--- | :--- |
| **BUG-001** | Ausência de multiplicador de recência (Recency Boost) para dados de 2026. | Alta | P0 |
| **BUG-002** | Playbooks competem em igualdade de score com documentos teóricos (Identity). | Média | P1 |
| **BUG-003** | Falta de mapeamento da intenção 'social' no pipeline de RAG. | Alta | P0 |

---

## 💡 Recomendações de Correção (Handoff para Darllyson)

1.  **Ajuste no Score**: No `retrieveChunks`, adicionar um boost (ex: `similarity * 1.2`) se `data.metadata.version` contiver "2026".
2.  **Priorização de Tipo**: Adicionar um boost se `data.metadata.docType === 'playbook'`.
3.  **Expansão do IntentMap**: Adicionar `'social': 'social'` e `'redes sociais': 'social'`.

---
**Dandara (QA)** — *"A qualidade não é um ato, é um hábito."*
