# Contrato de Recuperação de Dados (RAG V2)

**Lane:** AI / Retrieval  
**Status:** 🟠 Draft for Review  
**Versão:** 2.0.0

## 1. Definição do Objeto de Resposta
Todo chunk recuperado pelo pipeline de RAG deve seguir esta estrutura para garantir compatibilidade com o componente de UI de Contexto Ativo.

```typescript
export interface RetrievedChunk {
  // Identificação
  id: string;               // ID do chunk no Firestore
  assetId: string;          // ID do asset pai
  assetName: string;        // Nome amigável do documento/URL

  // Conteúdo
  content: string;          // Texto bruto do chunk

  // Metadados de Relevância
  similarity: number;       // 0.0 a 1.0 (Cosine Similarity)
  rerankScore?: number;     // 0.0 a 1.0 (Cohere Score)
  rank: number;             // Posição final após reranking

  // Metadados de Origem
  metadata: {
    docType: 'pdf' | 'url' | 'image' | 'text' | 'performance'; // 'performance' added for ST-12.1
    sourceUrl?: string;
    pageNumber?: number;
    category?: string;      // ex: 'tráfego', 'copy', 'estratégia'
    counselor?: string;     // Se o chunk for específico de um especialista
    performance_snapshot?: { // Added for ST-12.1
      ctr: number;
      cvr: number;
      cpc: number;
      roas: number;
      period: string;
      status: 'underperforming' | 'stable' | 'winner';
    };
  }
}
```

## 2. Regras de Filtragem (The Gates)
1.  **Gate de Governança**: O campo `isApprovedForAI` DEVE ser `true`. Se for `false`, o chunk é descartado antes do cálculo de similaridade.
2.  **Gate de Status**: Apenas chunks com `status: 'ready'` ou `status: 'approved'` são processados.
3.  **Filtro de Marca**: Consultas de Brand Kit DEVEM incluir o `brandId` no filtro do Firestore para evitar vazamento de dados entre marcas.

## 3. Fluxo de Reranking & Performance Loop (ST-12.1)
1.  O `RetrievalEngine` solicita o Top 50.
2.  **Performance Injection**: Se a query envolver "otimização" ou "performance", o engine busca chunks de `docType: 'performance'` para a marca ativa.
3.  O `RerankService` envia para a Cohere:
    - `query`: A pergunta original.
    - `documents`: Lista de `content` dos chunks (incluindo snapshots de performance formatados).
4.  O `RerankService` atualiza os `rerankScore` e reordena o array.

## 4. Handoff para UI
O payload da API `/api/chat` deve retornar um campo `sources` contendo a lista de `RetrievedChunk` (simplificada para o frontend, removendo o campo `content` se for muito grande para economizar banda, mantendo apenas metadados e snippet).

## 5. Heurísticas de Priorização (Boosts)
Para garantir que o conselho entregue o conhecimento mais atualizado e prático, aplicamos multiplicadores no score de similaridade:

1.  **Recency Boost (x1.2)**: Aplicado a chunks onde `metadata.version` contém "2026". Dados de benchmarks e custos atuais têm precedência.
2.  **Playbook Boost (x1.1)**: Aplicado a chunks onde `metadata.docType` é "playbook". Scripts práticos e playbooks de execução têm precedência sobre documentos teóricos/identidade.
3.  **Intent Mapping**: O pipeline deve mapear intenções do usuário para categorias de metadados (ex: 'social' -> 'social') para ativação de filtros dinâmicos.
