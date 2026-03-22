# Sprint 09 — Discovery Upgrades: Plano de Execução

> **Auditoria prévia:** 2026-03-21
> **Estado:** 6 tasks, todas 100% novas (exceto 09.5 que é limpeza)
> **Objetivo:** Keywords Clustering + Export + Spy Discovery + Links de Saída + Integração

---

## Etapa 1 — Limpeza: Remover Botões Placeholder (09.5)

### 1.1 Remover "MKTHONEY Copy" do Keywords Miner
- **Arquivo:** `app/src/components/intelligence/discovery/keywords-miner.tsx` (linha ~371)
- **Problema:** Botão mostra toast "Em breve: Enviar para MKTHONEY Copy"
- **Fix:** Deletar o botão. Brand Intelligence Layer já resolve o fluxo de dados.

### 1.2 Remover "Aplicar Insights" do Spy Agent
- **Arquivo:** `app/src/components/intelligence/discovery/spy-agent.tsx` (linha ~429)
- **Problema:** Botão mostra toast "Em breve: Aplicar insights ao brain context do funil."
- **Fix:** Deletar o botão. Brand Intelligence Layer já injeta insights automaticamente.

---

## Etapa 2 — Export CSV (09.2)

### 2.1 Botão "Exportar CSV" na toolbar do Keywords Miner
- **Arquivo:** `app/src/components/intelligence/discovery/keywords-miner.tsx`
- **Colunas:** Termo, Volume, Dificuldade, Intenção, KOS, Cluster (vazio até 09.1)
- **Encoding:** UTF-8 com BOM
- **Filtro:** Exportar todos os resultados visíveis
- **Custo:** 0 créditos (client-side)

---

## Etapa 3 — Keywords Clustering por Schwartz (09.1)

### 3.1 API: POST /api/intelligence/keywords/cluster
- **Arquivo:** Criar `app/src/app/api/intelligence/keywords/cluster/route.ts`
- **Input:** `{ brandId, keywords: string[] }`
- **Processo:** Gemini classifica cada keyword em 4 estágios (unaware, problem_aware, solution_aware, product_aware)
- **Output:** `{ clusters: [{ stage, terms: [{ term, intent, volume, difficulty, kos }] }] }`
- **Custo:** 1 crédito

### 3.2 Firestore: Persistir clusters
- **Collection:** `brands/{brandId}/keyword_clusters`
- **Schema:** `{ stage, terms[], createdAt, seedTerm }`

### 3.3 UI: Tabs/sections por estágio
- **Arquivo:** `app/src/components/intelligence/discovery/keywords-miner.tsx`
- **Nova tab:** "Clusters" com seções por estágio + badge de quantidade
- **Labels amigáveis:** Inconsciente, Consciente do Problema, Consciente da Solução, Consciente do Produto

### 3.4 CREDIT_COSTS: Adicionar keywords_cluster
- **Arquivo:** `app/src/lib/firebase/firestore-server.ts`
- **Valor:** `keywords_cluster: 1`

---

## Etapa 4 — Spy Upgrades (09.3 + 09.4)

### 4.1 API: POST /api/intelligence/spy/discover
- **Arquivo:** Criar `app/src/app/api/intelligence/spy/discover/route.ts`
- **Input:** `{ brandId }`
- **Processo:**
  1. Carrega brand context (vertical, oferta, público)
  2. Gemini gera termos de busca do nicho
  3. Firecrawl/Google busca top resultados
  4. Gemini classifica: direto, indireto, referência, irrelevante
- **Output:** `{ competitors: [{ url, name, type, relevance, reason }] }`
- **Custo:** 2 créditos

### 4.2 UI: Botão "Descobrir Concorrentes" + lista
- **Arquivo:** `app/src/components/intelligence/discovery/spy-agent.tsx`
- **Posição:** Acima do input de URL (como alternativa automática)
- **Click no concorrente:** Preenche URL e roda Spy Agent

### 4.3 Links de saída no resultado do Spy
- **Arquivo:** `app/src/lib/agents/spy/` — novo módulo `outbound-links.ts`
- **Processo:** Extrair links do HTML, classificar (checkout, obrigado, upsell, WhatsApp, formulário, blog, redes sociais)
- **UI:** Nova tab "Funil" no resultado do Spy com mapa de links
- **Click em link:** Roda scan individual

### 4.4 CREDIT_COSTS: Adicionar spy_discover
- **Arquivo:** `app/src/lib/firebase/firestore-server.ts`
- **Valor:** `spy_discover: 2`

---

## Etapa 5 — Cruzamento Miner × Spy (09.6)

### 5.1 Botão "Descobrir quem ranqueia" no cluster
- **Arquivo:** `app/src/components/intelligence/discovery/keywords-miner.tsx`
- **Posição:** Dentro de cada cluster Schwartz
- **Ação:** Chama API spy/discover com keywords do cluster como contexto
- **Custo:** Usa os 2 créditos do spy_discover (1 chamada, não 1 por keyword)

### 5.2 Resultado mostra concorrentes relevantes ao cluster
- **UI:** Modal ou seção expandida com concorrentes encontrados
- **Click:** Roda Spy Agent completo no concorrente

---

## Checklist de Execução

- [x] **Etapa 1** — Remover 2 botões placeholder (2026-03-21) ✅
- [x] **Etapa 2** — Export CSV (2026-03-21) ✅
- [x] **Etapa 3** — Clustering Schwartz — no mesmo request Gemini, sem API nova (2026-03-21) ✅
- [x] **Etapa 4** — Spy discover + links de saída (2026-03-21) ✅
- [x] **Etapa 5** — Cruzamento Miner × Spy (2026-03-21) ✅
- [x] **Build final** — Todos os 5 builds passaram limpos ✅

---

## Arquivos Envolvidos (referência rápida)

| Etapa | Arquivo | Ação |
|-------|---------|------|
| 1.1 | `keywords-miner.tsx` | Edit (remover botão placeholder) |
| 1.2 | `spy-agent.tsx` | Edit (remover botão placeholder) |
| 2.1 | `keywords-miner.tsx` | Edit (adicionar export CSV) |
| 3.1 | `api/intelligence/keywords/cluster/route.ts` | Criar |
| 3.2 | Firestore schema | Nova collection |
| 3.3 | `keywords-miner.tsx` | Edit (nova tab Clusters) |
| 3.4 | `firestore-server.ts` | Edit (add credit key) |
| 4.1 | `api/intelligence/spy/discover/route.ts` | Criar |
| 4.2 | `spy-agent.tsx` | Edit (UI descoberta) |
| 4.3 | `lib/agents/spy/outbound-links.ts` | Criar |
| 4.4 | `firestore-server.ts` | Edit (add credit key) |
| 5.1 | `keywords-miner.tsx` | Edit (botão cruzamento) |
| 5.2 | `keywords-miner.tsx` | Edit (UI resultado) |
