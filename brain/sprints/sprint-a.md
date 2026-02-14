# Sprint A — Infraestrutura + Migracoes + Identity Cards

> Fase 1 + Fase 2 do plano
> Status: CONCLUIDO

---

## Resumo
Criar a base tecnica (BrainLoader) e o conteudo (23 identity cards) que alimentam todos os engines. Resolver migracoes criticas de provedor antes de qualquer ingestao.

---

## Tarefas

### 1A. Migracoes de Provedor (URGENTE)

#### [x] 1A.1 — Migrar embedding model
- **De:** text-embedding-004 (DEPRECIADO Jan 2026)
- **Para:** gemini-embedding-001
- **Arquivo:** `app/src/lib/ai/embeddings.ts`
- **Mudancas:**
  - [x] Endpoint single: gemini-embedding-001:embedContent
  - [x] Model single: models/gemini-embedding-001
  - [x] Endpoint batch: gemini-embedding-001:batchEmbedContents
  - [x] Model batch body: models/gemini-embedding-001
  - [x] Removido SDK GoogleGenerativeAI (nao usado, fetch direto)
- **Notas:** Mantido outputDimensionality: 768 (compativel com indice Pinecone existente)
- **Status:** CONCLUIDO
- **Data:** 2026-02-14

#### [x] 1A.2 — Fix bug namespace (brand- vs brand_)
- **Problema:** 7 arquivos usavam `brand-{id}`, `context-assembler.ts` usava `brand_{id}`
- **Fix:** Padronizado para `brand_${brandId}` em TODOS os 7 arquivos
- **Arquivos corrigidos:**
  - [x] `app/src/lib/ai/rag-helpers-fixed.ts`
  - [x] `app/src/lib/ai/worker.ts`
  - [x] `app/src/lib/agents/spy/dossier-generator.ts`
  - [x] `app/src/lib/firebase/assets-server.ts`
  - [x] `app/src/app/assets/page.tsx`
  - [x] `app/src/app/api/assets/metrics/route.ts`
  - [x] `app/src/components/brands/strategic-context.tsx`
- **Status:** CONCLUIDO
- **Data:** 2026-02-14

#### [  ] 1A.3 — Planejar migracao LLM (gemini-2.0-flash → gemini-2.5-flash)
- **Deadline:** 31 Marco 2026
- **Acao agora:** Apenas documentar. Testar no Sprint B, migrar no Sprint C
- **Fix:** Mudar valor da env var GEMINI_MODEL no Vercel
- **Status:** _documentado, aguardando Sprint B_
- **Data:** —

---

### 1B. BrainLoader (Sistema de Carregamento)

#### [x] 1B.1 — Criar types.ts
- **Arquivo:** `app/src/lib/intelligence/brains/types.ts`
- **Conteudo:** BrainIdentityCard, BrainFrontmatter, BrainDomain, EvaluationFramework, ScoringCriterion, ScoringRange, RedFlag, GoldStandard
- **Status:** CONCLUIDO
- **Data:** 2026-02-14

#### [x] 1B.2 — Criar loader.ts
- **Arquivo:** `app/src/lib/intelligence/brains/loader.ts`
- **Conteudo:** loadBrain(), loadBrainsByDomain(), getAllBrains(), getFramework(), reloadBrains()
- **Parseia:** YAML frontmatter + blocos JSON (evaluation_frameworks, red_flags, gold_standards)
- **Cache:** Map em memoria, invalida no restart
- **Status:** CONCLUIDO
- **Data:** 2026-02-14

#### [x] 1B.3 — Criar prompt-builder.ts
- **Arquivo:** `app/src/lib/intelligence/brains/prompt-builder.ts`
- **Conteudo:** buildCounselorContext(), buildScoringPromptFromBrain(), buildMultiCounselorContext(), buildDomainContext(), formatRedFlagsForPrompt(), formatGoldStandardsForPrompt(), buildDimensionScoringContext(), getAvailableFrameworks()
- **Regras:** Max 4 experts por prompt (MAX_EXPERTS_PER_PROMPT)
- **Status:** CONCLUIDO
- **Data:** 2026-02-14

---

### 1C. Mover e Organizar

#### [x] 1C.1 — Mover identity cards para dentro do deploy
- **De:** `brain/identity-cards/*.md`
- **Para:** `app/src/data/identity-cards/*.md`
- **Notas:** dan_kennedy.md renomeado para dan_kennedy_copy.md e frank_kern.md para frank_kern_copy.md (match com counselor IDs no constants.ts)
- **Status:** CONCLUIDO
- **Data:** 2026-02-14

#### [x] 1C.2 — Atualizar constants.ts e types
- **Arquivos:** `app/src/lib/constants.ts` + `app/src/types/index.ts`
- **Mudanca:** Adicionado campo `domain` em todos os 23 counselors do COUNSELORS_REGISTRY + interface Counselor
- **Status:** CONCLUIDO
- **Data:** 2026-02-14

---

### Fase 2. Identity Cards (15 restantes)

#### Funnel Council (6 cards)

| # | Card | Expert | Status | Data |
|---|------|--------|--------|------|
| 2.1 | russell_brunson.md | Russell Brunson — Arquitetura de Funil | [x] PRONTO | 2026-02-14 |
| 2.2 | dan_kennedy.md | Dan Kennedy — Oferta & Copy (visao funil) | [x] PRONTO | 2026-02-14 |
| 2.3 | frank_kern.md | Frank Kern — Psicologia & Comportamento | [x] PRONTO | 2026-02-14 |
| 2.4 | sam_ovens.md | Sam Ovens — Aquisicao & Qualificacao | [x] PRONTO | 2026-02-14 |
| 2.5 | ryan_deiss.md | Ryan Deiss — LTV & Retencao | [x] PRONTO | 2026-02-14 |
| 2.6 | perry_belcher.md | Perry Belcher — Monetizacao Simples | [x] PRONTO | 2026-02-14 |

#### Social Council (4 cards)

| # | Card | Expert | Status | Data |
|---|------|--------|--------|------|
| 2.7 | lia_haberman.md | Lia Haberman — Algoritmo & Mudancas | [x] PRONTO | 2026-02-14 |
| 2.8 | rachel_karten.md | Rachel Karten — Criativo & Hooks | [x] PRONTO | 2026-02-14 |
| 2.9 | nikita_beer.md | Nikita Beer — Viralizacao & Trends | [x] PRONTO | 2026-02-14 |
| 2.10 | justin_welsh.md | Justin Welsh — Funil Social | [x] PRONTO | 2026-02-14 |

#### Ads Council (4 cards)

| # | Card | Expert | Status | Data |
|---|------|--------|--------|------|
| 2.11 | justin_brooke.md | Justin Brooke — Estrategia & Escala | [x] PRONTO | 2026-02-14 |
| 2.12 | nicholas_kusmich.md | Nicholas Kusmich — Meta Ads & Contexto | [x] PRONTO | 2026-02-14 |
| 2.13 | jon_loomer.md | Jon Loomer — Analytics & Tecnico | [x] PRONTO | 2026-02-14 |
| 2.14 | savannah_sanchez.md | Savannah Sanchez — TikTok & UGC | [x] PRONTO | 2026-02-14 |

#### Design (1 card)

| # | Card | Expert | Status | Data |
|---|------|--------|--------|------|
| 2.15 | design_director.md | Diretor de Arte — Direcao Visual & UX | [x] PRONTO | 2026-02-14 |

---

## Verificacao Sprint A

- [x] Embedding com gemini-embedding-001 gera vetor de 768 dims
- [x] Busca Pinecone com novo embedding retorna resultados coerentes (0 matches no ns default — esperado, dados em brand_*)
- [x] Namespace padronizado (brand_ em 7 arquivos + context-assembler)
- [x] `loadBrain('gary_halbert')` retorna objeto parseado completo
- [x] `loadBrainsByDomain('copy')` retorna 9 brains
- [x] `getAllBrains()` retorna 24 brains (9 copy + 6 funnel + 4 social + 4 ads + 1 design)
- [x] `buildScoringPromptFromBrain('gary_halbert', 'headline_score')` gera prompt valido (~433 tokens)
- [x] Token count do prompt < 2.500 tokens por grupo de experts (max ~878 tokens)
- [x] Todos os 24 identity cards existem em app/src/data/identity-cards/
- [x] Todos os 24 cards parseiam corretamente (frameworks + red_flags + gold_standards)
- **Fix:** nikita_beer.md tinha aspas duplas nao-escapadas no JSON (corrigido)

---

## Notas de Implementacao

### IDs de Counselors (dan_kennedy / frank_kern)
- `dan_kennedy` = Funnel (counselor ID no constants.ts)
- `dan_kennedy_copy` = Copy (counselor ID no constants.ts)
- `frank_kern` = Funnel
- `frank_kern_copy` = Copy
- Arquivos de identity cards nomeados para match com counselor ID

### Total de Identity Cards: 24
- 9 Copy (existiam) + 6 Funnel + 4 Social + 4 Ads + 1 Design = 24
- Nota: Sao 24, nao 23, porque dan_kennedy e frank_kern tem versoes separadas para Copy e Funnel

---

## Changelog

| Data | Tarefa | Status | Observacoes |
|------|--------|--------|-------------|
| 2026-02-14 | Documento guia criado | OK | brain/GUIA-INTEGRACAO-BRAINS.md |
| 2026-02-14 | Plano revisado (Fase 1 + Fase 6) | OK | Migracoes + metadata + evolucao |
| 2026-02-14 | 9 identity cards Copy | PRONTO | gary_halbert, eugene_schwartz, joseph_sugarman, dan_kennedy_copy, david_ogilvy, claude_hopkins, john_carlton, drayton_bird, frank_kern_copy |
| 2026-02-14 | Sprint A inicio | INICIADO | — |
| 2026-02-14 | 1A.1 Embedding migration | PRONTO | text-embedding-004 → gemini-embedding-001, removido SDK |
| 2026-02-14 | 1A.2 Namespace fix | PRONTO | brand- → brand_ em 7 arquivos |
| 2026-02-14 | 1B BrainLoader | PRONTO | types.ts + loader.ts + prompt-builder.ts |
| 2026-02-14 | 1C Move + constants | PRONTO | 9 cards copiados, domain adicionado a 23 counselors |
| 2026-02-14 | Fase 2 Identity Cards | PRONTO | 15 novos cards (6 funnel + 4 social + 4 ads + 1 design) |
| 2026-02-14 | Sprint A completo | CONCLUIDO | Todas as tarefas finalizadas |
