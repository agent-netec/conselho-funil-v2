# 📦 Story Pack: Sprint 1.2 - RAG Optimization & Precision

**Status:** Ready for Dev 🟢  
**Sprint:** 1.2  
**Épicos:** E15 (Retrieval Optimization), E17 (UX de Contexto)  
**Responsável:** Leticia (SM)

---

## 🎯 Objetivo
Transformar a recuperação de dados em um processo de alta fidelidade, garantindo que o "Conselho" utilize os ativos da marca com prioridade e precisão cirúrgica através de Reranking e Filtros Dinâmicos.

---

## 📝 User Stories

### US-1.2.1: Implementação do Pipeline de Reranking (Cohere)
**Como** sistema de IA, **quero** reordenar os resultados iniciais da busca vetorial usando um modelo de cross-encoding (Cohere), **para** que apenas os chunks mais semanticamente relevantes cheguem ao LLM final.
- **Critérios de Aceite:**
    - Criar helper `app/src/lib/ai/rerank.ts` para interface com Cohere API.
    - Implementar fallback para o ranking original em caso de falha na API.
    - Integrar o reranking no pipeline principal em `app/src/lib/ai/rag.ts` (reordenar top 50 -> top 5).
- **Contrato:** `@_netecmt/contracts/retrieval-contracts.md`

### US-1.2.2: Filtros Dinâmicos e Governança de Metadados
**Como** arquiteto, **quero** aplicar filtros rigorosos de segurança e contexto no momento da busca, **para** garantir que apenas dados aprovados e relevantes ao domínio sejam recuperados.
- **Critérios de Aceite:**
    - Refatorar `retrieveChunks` e `retrieveBrandChunks` para aceitar filtros dinâmicos.
    - Garantir obrigatoriedade do filtro `isApprovedForAI: true`.
    - Adicionar suporte a filtro por `category` (extraído da intenção do usuário).
- **Contrato:** `@_netecmt/contracts/retrieval-contracts.md`

### US-1.2.3: UI de Fontes e Contexto Ativo (Active Context)
**Como** usuário, **quero** ver quais documentos a IA utilizou para gerar a resposta, **para** que eu possa confiar e validar a origem das recomendações.
- **Critérios de Aceite:**
    - Atualizar a rota `/api/chat` para retornar a lista de `sources` (metadados dos chunks).
    - Criar componente `SourceBadge` ou `ContextIndicator` no chat.
    - Exibir popover com o nome do documento e snippet do conteúdo ao clicar.
- **Responsável:** Beto/Victor (UX/UI)

### US-1.2.4: Suíte de Testes de Recuperação (RAG Evaluation)
**Como** QA, **quero** validar a eficácia do novo pipeline usando métricas de "Hit Rate", **para** garantir que o Reranking realmente melhorou a precisão.
- **Critérios de Aceite:**
    - Criar script de teste em `app/src/tests/retrieval.test.ts`.
    - Comparar resultados Com vs Sem Reranking.
    - Validar que assets não aprovados nunca aparecem nos resultados.
- **Responsável:** Dandara (QA)

---

## 🛠️ Contratos Técnicos (Athos/Monara)
- **Lanes Envolvidas:** AI, Backend, UX.
- **Docs de Referência:** 
    - `@_netecmt/solutioning/tech-spec-reranking-filters.md`
    - `@_netecmt/contracts/retrieval-contracts.md`
- **Configuração:** Monara deve garantir que a API Key da Cohere esteja no `.env.local` (sob o nome `COHERE_API_KEY`).

---

## 🏁 Readiness Checklist (Leticia)
- [x] PRD Aprovado pelo Iuran.
- [x] Tech Spec validado pelo Athos.
- [x] Contratos de dados definidos.
- [x] Stories quebradas e estimadas.

**Ação:** Darllyson (Dev), você está liberado para iniciar a **US-1.2.1**.
