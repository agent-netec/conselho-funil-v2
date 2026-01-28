# PRD: Sprint 1.2 - RAG Optimization & Context Precision

**Status:** Draft 🟢  
**Responsável:** Iuran (PM)  
**Data:** 11/01/2026

## 1. Visão Geral
Após estabilizarmos a ingestão na Sprint 1.1, o desafio agora é a **precisão da recuperação**. O sistema atualmente recupera chunks por similaridade vetorial bruta, o que muitas vezes traz ruído ou falha em priorizar documentos estratégicos da marca (Brand Kit) sobre o conhecimento geral dos conselheiros.

## 2. Objetivos de Negócio
- **Redução de Alucinações**: Garantir que o LLM receba apenas os trechos mais relevantes, diminuindo respostas genéricas.
- **Autoridade da Marca**: Priorizar assets da marca (`brand_assets`) quando a pergunta for específica, sem perder a sabedoria dos especialistas.
- **Confiança do Usuário**: Mostrar claramente quais fontes fundamentaram a resposta (Active Context).

## 3. Requisitos Funcionais (User Stories de Produto)
### 3.1. Reranking de Elite (High-Fidelity Retrieval)
- O sistema deve implementar uma camada de "segundo pensamento" (Reranking) que reordena os top-50 resultados iniciais.
- **KPI**: Aumento no "Hit Rate" dos testes de QA.

### 3.2. Filtros Dinâmicos por Intenção
- O pipeline de recuperação deve identificar se a consulta exige dados de "Branding", "Tráfego" ou "Conversão" e aplicar filtros de metadados correspondentes.
- **Segurança**: Somente assets com `isApprovedForAI: true` podem ser usados.

### 3.3. UI de Contexto Ativo (Observabilidade)
- O chat deve exibir um indicador visual de "Fontes Utilizadas".
- Ao clicar, o usuário deve ver o nome dos documentos e um pequeno snippet do que foi extraído.

## 4. Requisitos Não-Funcionais
- **Latência**: O processo de reranking não deve adicionar mais de 800ms ao tempo total de resposta.
- **Custo**: Otimizar o número de chunks enviados para o reranker para evitar desperdício de tokens.

## 5. Critérios de Aceite Globais
- [ ] O Reranking está funcional e integrado ao `lib/ai/rag.ts`.
- [ ] Filtros de metadados funcionam em consultas ao Firestore/Knowledge base.
- [ ] O componente de UI reflete as fontes reais retornadas pelo pipeline.
