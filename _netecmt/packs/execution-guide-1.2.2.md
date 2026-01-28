# 🛠️ Implementation Guide: US-1.2.2 - Filtros Dinâmicos (Phase 2)

**Story:** US-1.2.2  
**Dev:** Darllyson  
**Context:** `@_netecmt/contracts/retrieval-contracts.md`

---

## 🎯 Objetivo
Expandir o pipeline de recuperação para aceitar filtros arbitrários baseados em metadados (categoria, estágio do funil, canal) e garantir que a governança (`isApprovedForAI`) seja inquebrável.

## 📝 Tarefas Técnicas

### 1. Evolução da Interface `RetrievalConfig`
Em `app/src/lib/ai/rag.ts`, expanda o objeto `filters`:
```typescript
export interface RetrievalConfig {
  topK: number;
  minSimilarity: number;
  filters?: {
    counselor?: string;
    docType?: string;
    tenantId?: string | null;
    category?: string;       // NOVO
    funnelStage?: string;    // NOVO (opcional)
    channel?: string;        // NOVO (opcional)
  };
}
```

### 2. Refatoração da Query Firestore
Atualize as funções `retrieveChunks` e `retrieveBrandChunks` para construir a query dinamicamente baseada nos filtros presentes:

- **Regra de Ouro**: O filtro `isApprovedForAI: true` deve ser adicionado INDEPENDENTE dos filtros passados.
- **Dinamismo**: Itere sobre as chaves de `config.filters` e adicione `where()` cláusulas correspondentes.

### 3. Extração de Intenção (Opcional/Futuro)
Prepare a função `ragQuery` para aceitar um parâmetro opcional de `intent`. Se `intent` for detectada (ex: "copy", "anúncios"), aplique automaticamente o filtro de `category`.

## 🚨 Critérios de Aceite
- [ ] A query do Firestore falha se `isApprovedForAI` não for fornecido ou for `false`.
- [ ] Resultados são filtrados corretamente quando uma `category` (ex: 'heuristics') é passada.
- [ ] Logs mostram quais filtros ativos foram aplicados na busca.

---
**Leticia (SM):** Darllyson, o 1.2.1 ficou excelente. Agora, vamos blindar esses filtros para que a recuperação seja ainda mais precisa.
