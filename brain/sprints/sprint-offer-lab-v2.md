# Sprint OL — Offer Lab v2: Scoring Inteligente + Integração Pipeline

> **Versão:** 2.1 (TODOS os itens concluídos — pronto para commit)
> **Data:** 2026-02-20
> **Estimativa:** CONCLUÍDO
> **Dependência:** Sprint K concluído (K-1 fez UX polish do Offer Lab) — SATISFEITA
> **Milestone:** ⭐ Feature Complete (melhoria de qualidade de feature existente)
> **Princípio:** O score deve refletir o conteúdo real, e os dados devem fluir para todo o pipeline
> **Paralelo:** Pode rodar em paralelo com W e X (não depende de OAuth)

---

## Contexto

O Offer Lab já funciona com wizard de 4 steps, score Hormozi (0-100), e save no Firestore. Sprint K-1 adicionou UX polish (tooltips nos sliders, labels invertidos, feedback contextual, defaults motivadores, mini-guia da equação).

**Problemas identificados durante QA:**

1. **Score não reflete conteúdo real** — 80% do score vem dos 4 sliders na sidebar. Tudo que o usuário escreve nos Steps 1-4 contribui apenas 0-20 pts (binário)
2. **Zero feedback de AI** — `evaluateOfferQuality()` existia em `scoring.ts` com Brain Council (Dan Kennedy + Russell Brunson via Gemini) mas NUNCA era chamada pelo wizard
3. **Modelo errado** — `evaluateOfferQuality()` usava `DEFAULT_GEMINI_MODEL` (Flash) mas deveria usar `PRO_GEMINI_MODEL`, padrão do projeto para avaliações críticas
4. **Desconectado do pipeline** — Offer Lab não alimentava Copy, Social, Campaigns, Calendar

**Roadmap de referência:** `_netecmt/docs/roadmap-offer-lab-v2.md`

---

## Estado do Working Tree (pré-commit)

Mudanças significativas já foram implementadas e estão no working tree (não commitadas):

| Arquivo | Estado | O que mudou |
|---------|--------|-------------|
| `lib/intelligence/offer/calculator.ts` | Modified | Score v2: sliders 40pts + conteúdo 60pts |
| `lib/intelligence/offer-lab/scoring.ts` | **DELETADO** | Substituído por `evaluator.ts` |
| `lib/intelligence/offer/evaluator.ts` | **NOVO** | Brain Council (Kennedy + Brunson) com PRO model |
| `components/intelligence/offer-lab/offer-lab-wizard.tsx` | Modified | StepFeedback, AI eval flow, tela de resultado |
| `app/api/intelligence/offer/calculate-score/route.ts` | Modified | Chama evaluateOfferQuality() |
| `app/api/intelligence/offer/save/route.ts` | Modified | scoringVersion: 'v2' |
| `types/offer.ts` | Modified | OfferAIEvaluation interface, aiEvaluation? field |
| `components/intelligence/offer-lab/offer-list.tsx` | **NOVO** | Lista de ofertas com CRUD |
| `components/intelligence/offer-lab/offer-compare.tsx` | **NOVO** | Comparação A/B lado a lado |
| `app/api/intelligence/offer/list/route.ts` | **NOVO** | GET (lista) + PATCH (activate/archive/duplicate) |
| `app/intelligence/offer-lab/page.tsx` | Modified | Integra OfferList + OfferCompare |
| `app/api/copy/generate/route.ts` | Modified | Carrega offer ativa, injeta no prompt |
| `app/api/social/generate/route.ts` | Modified | Injeta offer context nos hooks |
| `app/api/content/calendar/generate-week/route.ts` | Modified | Injeta offer context na geração semanal |
| `types/campaign.ts` | Modified | Campo `offer` adicionado ao CampaignContext |
| `lib/ai/prompts/copy-generation.ts` | Modified | offerContext param + formatOfferForPrompt |

---

## Modelos Gemini por Tarefa

| Tarefa | Chamada AI | Modelo | Justificativa | Custo/chamada |
|--------|-----------|--------|---------------|---------------|
| **OL-1** Score rebalance | Nenhuma (pura fórmula) | — | Zero AI, só math | 0 créditos |
| **OL-2** Feedback por step | Nenhuma (regras locais) | — | Lógica estática no frontend | 0 créditos |
| **OL-3** AI Evaluation final | `evaluateOfferQuality()` | **PRO** (`gemini-3-pro-preview`) | Avaliação crítica com Brain Council, mesmo padrão de Debate/Scorecard/Autopsy | 2 créditos |
| **OL-4** Copy context | Nenhuma nova | — | Só injeta dados no prompt existente | 0 extra |
| **OL-5** Social/Campaign context | Nenhuma nova | — | Só injeta dados no prompt existente | 0 extra |
| **OL-6** Histórico UI | Nenhuma | — | CRUD + UI | 0 créditos |

---

## Tarefas

---

### OL-1. Score Rebalanceado — Conteúdo Vale 60%, Sliders 40%
**Origem:** `roadmap-offer-lab-v2.md` Fase 1-1
**Status:** ✅ CONCLUÍDO (working tree — não commitado)

Rebalanceou `OfferLabEngine.calculateScore()` para que o conteúdo dos Steps 1-4 tenha peso real:

- [x] OL-1.1 — **Reduzir peso dos sliders** de 80→40 pts máx. Normalização: `Math.min(40, Math.round((rawValueScore / 50) * 40))`
- [x] OL-1.2 — **Promessa (Step 1):** 0-15 pts — `promise.length > 20` (+5), contém número (+5), contém prazo (+5)
- [x] OL-1.3 — **Ancoragem de Preço (Step 1):** 0-10 pts — totalValue/price >= 10x (+10), >= 5x (+5)
- [x] OL-1.4 — **Value Stacking (Step 2):** 0-10 pts — `stacking.length >= 3` (+5), todos com nome E valor (+5)
- [x] OL-1.5 — **Bônus (Step 3):** 0-10 pts — `bonuses.length >= 2` (+5), todos com descrição de objeção (+5)
- [x] OL-1.6 — **Garantia (Step 4):** 0-10 pts — `riskReversal.length > 50` (+5), contém "dias"/"garantia" (+5)
- [x] OL-1.7 — **Escassez (Step 4):** 0-5 pts — `scarcity.length > 10` (+5)
- [x] OL-1.8 — **Total validado:** Sliders 40 + Promessa 15 + Ancoragem 10 + Stacking 10 + Bônus 10 + Garantia 10 + Escassez 5 = **100 pts**
- [x] OL-1.9 — **`generateAnalysis()` reescrito:** Insights dinâmicos baseados em cada fator (promessa curta, ancoragem insuficiente, stacking incompleto, etc.)

**Modelo Gemini:** Nenhum
**Custo:** 0 créditos
**Firebase:** Nenhuma mudança (campo `scoring.total` já existe)
**Arquivos:** `app/src/lib/intelligence/offer/calculator.ts`

---

### OL-2. Feedback Contextual por Step (Frontend)
**Origem:** `roadmap-offer-lab-v2.md` Fase 1-2
**Status:** ✅ CONCLUÍDO (working tree — não commitado)

Componente `StepFeedback` integrado ao wizard, mostra mini-feedback baseado no conteúdo preenchido:

- [x] OL-2.1 — **Step 1 (Promessa):** Promessa curta → alerta. Sem número → sugestão de resultado mensurável. Sem prazo → sugestão de urgência
- [x] OL-2.2 — **Step 1 (Ancoragem):** `perceivedValue / corePrice < 5` → alerta de ancoragem insuficiente
- [x] OL-2.3 — **Step 2 (Stacking):** `stacking.length < 3` → alerta com contagem. Itens sem nome/valor → alerta específico
- [x] OL-2.4 — **Step 3 (Bônus):** 0 bônus → alerta. 1 bônus → sugere adicionar mais. Bônus sem descrição → alerta de objeção
- [x] OL-2.5 — **Step 4 (Garantia):** Garantia curta → alerta. Sem palavras-chave (garantia/devolv/reembols) → alerta
- [x] OL-2.6 — **Step 4 (Escassez):** `scarcity.length === 0` → alerta de falta de urgência
- [x] OL-2.7 — **Componente `StepFeedback`:** Ícone AlertCircle amarelo, espaçamento compacto, bg amber-500/5

**Modelo Gemini:** Nenhum
**Custo:** 0 créditos
**Firebase:** Nenhuma mudança
**Arquivos:** `app/src/components/intelligence/offer-lab/offer-lab-wizard.tsx`

---

### OL-3. AI Evaluation com Brain Council (Kennedy + Brunson)
**Origem:** `roadmap-offer-lab-v2.md` Fase 1-3
**Status:** ✅ CONCLUÍDO (working tree — não commitado)

`scoring.ts` foi DELETADO e substituído por `evaluator.ts`. Nova implementação usa `PRO_GEMINI_MODEL` com Brain Council. Wizard integra fluxo de avaliação AI.

- [x] OL-3.1 — **Novo `evaluator.ts`:** Substitui `scoring.ts`. Usa `PRO_GEMINI_MODEL` (gemini-3-pro-preview). Importa `loadBrain()` e `buildScoringPromptFromBrain()` para Kennedy (offer_architecture) e Brunson (value_ladder_score)
- [x] OL-3.2 — **Prompt completo:** Inclui promessa, preço, valor percebido, value stack, bônus com objeções, garantia, escassez, urgência, 4 fatores Hormozi. Pede JSON com `overallQuality`, `insights[]`, `summary`
- [x] OL-3.3 — **API route atualizada:** `calculate-score/route.ts` importa de `evaluator.ts` e chama `evaluateOfferQuality(offerData)`. Retorna `{ aiEvaluation }` wrapped em `createApiSuccess()`
- [x] OL-3.4 — **Wizard: fluxo de avaliação AI:** Botão "Avaliar e Finalizar" (step 4) → `handleAiEvaluation()` → loading state → tela de resultado com score fórmula + score AI
- [x] OL-3.5 — **Tela de resultado AI:** Cards por conselheiro (nome, framework, score/100, opinião em itálico), red flags em vermelho, gold standards em verde, resumo executivo em purple box
- [x] OL-3.6 — **Botões pós-avaliação:** "Ajustar Oferta" (volta step 1) + "Salvar Oferta" (salva no Firestore)
- [x] OL-3.7 — **Types atualizados:** `OfferQualityInsight` + `OfferAIEvaluation` interfaces em `types/offer.ts`. Campo `aiEvaluation?: OfferAIEvaluation` no `OfferDocument`
- [x] **OL-3.8 — Persistir aiEvaluation no save** ✅ CORRIGIDO: Wizard agora envia `aiEvaluation` no body do save. API `save/route.ts` recebe e persiste no OfferDocument com `evaluatedAt: Timestamp.now()`. Validação: só persiste se `overallQuality > 0`

**Modelo Gemini:** PRO (`gemini-3-pro-preview`)
**Custo:** ~2 créditos por avaliação
**Firebase:** Campo `aiEvaluation` persistido no save com `evaluatedAt: Timestamp.now()`
**Arquivos:**
- `app/src/lib/intelligence/offer/evaluator.ts` — ✅ novo, substitui scoring.ts deletado
- `app/src/app/api/intelligence/offer/calculate-score/route.ts` — ✅ chama evaluateOfferQuality
- `app/src/components/intelligence/offer-lab/offer-lab-wizard.tsx` — ✅ tela AI result + envia aiEvaluation no save
- `app/src/types/offer.ts` — ✅ interfaces definidas
- `app/src/app/api/intelligence/offer/save/route.ts` — ✅ recebe + persiste aiEvaluation

---

### OL-4. Conectar Offer Lab ao Copy Engine
**Origem:** `roadmap-offer-lab-v2.md` Fase 2
**Status:** ✅ CONCLUÍDO (working tree — não commitado)

Copy generation agora carrega oferta ativa da brand e injeta como contexto rico no prompt.

- [x] OL-4.1 — **Carregar oferta ativa:** No `copy/generate/route.ts`, query `brands/{brandId}/offers` com `where('status', '==', 'active')`, fallback para draft mais recente
- [x] OL-4.2 — **`formatOfferForPrompt(offer)`:** Helper que formata OfferDocument: promessa, preço, valor percebido, stacking (itens + valores), bônus (com objeções), garantia, escassez, score
- [x] OL-4.3 — **Injeção no prompt:** Seção `## OFERTA ESTRUTURADA (Offer Lab)` adicionada ao template via `context.offerContext` em `buildCopyPrompt()`
- [x] OL-4.4 — **Score de copy com dados reais:** Scorecard de copy cruza `offer` dimension com Offer Lab score real: `offerLabScore / 10` → `Math.max(scorecard.offer, offerDimensionFromLab)`. Recalcula overall como média dos 5 dimensions
- [x] OL-4.5 — **Log de diagnóstico:** `[Copy] Offer Lab context injected` e `[Copy] Offer scorecard boosted`

**Modelo Gemini:** Nenhum novo (copy já usa Flash)
**Custo:** 0 créditos extras
**Firebase:** Nenhuma mudança (leitura de `brands/{id}/offers/` existente)
**Arquivos:**
- `app/src/app/api/copy/generate/route.ts` — carregar offer + boost scorecard
- `app/src/lib/ai/prompts/copy-generation.ts` — `offerContext` param em `buildCopyPrompt()`

---

### OL-5. Conectar ao Social + Calendar + Campaigns (Golden Thread)
**Origem:** `roadmap-offer-lab-v2.md` Fase 3
**Status:** ✅ CONCLUÍDO (working tree — não commitado)

- [x] OL-5.1 — **Social hooks:** `social/generate/route.ts` carrega offer ativa, injeta seção `## OFERTA ESTRUTURADA (Offer Lab)` com promessa, preço, valor, stacking, garantia, escassez, score. Log: `[Social/Generate] Offer Lab context injected`
- [x] OL-5.2 — **Calendar generate-week:** `content/calendar/generate-week/route.ts` enriquece brandContext com dados de oferta estruturada (promessa, preço, valor, stacking, garantia, escassez). Log: `[Calendar/GenerateWeek] Offer Lab context injected`
- [x] OL-5.3 — **Campaign type:** `types/campaign.ts` já tem campo `offer?: { offerId, name, score, promise }` no `CampaignContext`
- [x] **OL-5.4 — Social debate + offer context** ✅ CORRIGIDO: `social/debate/route.ts` agora carrega offer ativa de `brands/{id}/offers` (active ou fallback draft mais recente) e appenda dados estruturados ao brandContext (promessa, preço, valor, stack, bônus, garantia, escassez, score)
- [x] **OL-5.5 — Golden Thread Step "Oferta"** ✅ IMPLEMENTADO:
  - `CampaignStepper` atualizado com step "Oferta" (ícone Sparkles) entre Funil e Copy
  - StageCard "A Oferta" mostra promessa + score quando vinculada
  - `handleAction('offer')` carrega oferta ativa da brand e vincula ao campaign doc via `updateDoc`
  - Se nenhuma oferta encontrada, redireciona ao Offer Lab
  - Brief de campanha inclui seção Oferta
  - Completion card mostra card de Oferta quando presente

**Modelo Gemini:** Nenhum novo
**Custo:** 0 créditos extras
**Firebase:** Campo `offer` em Campaign populado via Golden Thread step
**Arquivos:**
- `app/src/app/api/social/debate/route.ts` — ✅ Offer Lab context injetado
- `app/src/app/campaigns/[id]/page.tsx` — ✅ step "Oferta" na Golden Thread
- `app/src/components/campaigns/campaign-stepper.tsx` — ✅ step adicionado ao CAMPAIGN_STAGES

---

### OL-6. Histórico de Ofertas + Comparação A/B
**Origem:** `roadmap-offer-lab-v2.md` Fase 4
**Status:** ✅ CONCLUÍDO (working tree — não commitado)

Componentes de lista, ações e comparação A/B implementados e integrados na página.

- [x] OL-6.1 — **API de listagem:** `api/intelligence/offer/list/route.ts` com GET (lista ordenada por createdAt desc) e PATCH (activate/archive/duplicate). Activate desativa ofertas anteriores automaticamente via writeBatch
- [x] OL-6.2 — **Componente `OfferList`:** Grid de cards com nome, score (fórmula + AI), data, status badge (Ativa verde / Rascunho cinza / Arquivada amber). Loading state com Loader2 e empty state
- [x] OL-6.3 — **Ações rápidas:** Botão ⭐ Ativar (define como principal, desativa anteriores), 📦 Arquivar, 📋 Duplicar (remove aiEvaluation da cópia, status draft)
- [x] OL-6.4 — **Seleção para comparação:** Checkboxes numerados (1, 2) com purple highlight. Botão "Comparar Selecionadas" aparece com 2 selecionadas
- [x] OL-6.5 — **Componente `OfferCompare`:** Comparação lado a lado — scores (fórmula + AI), promessa, preço, valor percebido, value stack (itens + valor total), bônus (itens + valor total), garantia, escassez, fatores Hormozi (com inversão de display para tempo/esforço), pareceres AI por conselheiro
- [x] OL-6.6 — **Integração na página:** `intelligence/offer-lab/page.tsx` importa OfferList e OfferCompare. Histórico abaixo do wizard. Compare mode substitui conteúdo inteiro com botão "Voltar"
- [x] OL-6.7 — **Scaffolding A/B Testing:** `offerId` já existe em `types/ab-testing.ts` (campo opcional) e `types/personalization.ts` (campo opcional)

**Modelo Gemini:** Nenhum
**Custo:** 0 créditos
**Firebase:** Nenhuma mudança (campos `status`, `scoring.total` já existem)
**Arquivos:**
- `app/src/components/intelligence/offer-lab/offer-list.tsx` — novo (untracked)
- `app/src/components/intelligence/offer-lab/offer-compare.tsx` — novo (untracked)
- `app/src/app/api/intelligence/offer/list/route.ts` — novo (untracked)
- `app/src/app/intelligence/offer-lab/page.tsx` — modificado

---

## Firebase / Firestore — Resumo de Mudanças

| Tarefa | Mudança Firebase | Detalhes | Status |
|--------|-----------------|----------|--------|
| **OL-1** Score rebalance | **Nenhuma** | Lógica pura em `calculator.ts` | ✅ |
| **OL-2** Feedback por step | **Nenhuma** | Frontend-only | ✅ |
| **OL-3** AI Evaluation | **Novo campo `aiEvaluation`** | Persistido no save com evaluatedAt | ✅ |
| **OL-4** Copy context | **Nenhuma** | Leitura de `brands/{id}/offers/` | ✅ |
| **OL-5** Golden Thread | **Novo campo `offer` em Campaign** | Populado via Golden Thread step | ✅ |
| **OL-6** Histórico | **Nenhuma** | Status field já suporta draft/active/archived | ✅ |

### Security Rules (Produção)

Atualmente `firestore.rules` NÃO tem match para `brands/{brandId}/offers/{offerId}`. Funciona em modo de teste, mas para produção precisa de:

```
match /brands/{brandId}/offers/{offerId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null
    && exists(/databases/$(database)/documents/brands/$(brandId))
    && get(/databases/$(database)/documents/brands/$(brandId)).data.ownerId == request.auth.uid;
}
```

**Nota:** Firestore é schemaless — campos novos não precisam de migration.

---

## Resumo

**TODAS as 6 tarefas e ~40 subtarefas estão CONCLUÍDAS** no working tree. Pronto para commit consolidado.

Últimos 3 itens implementados nesta sessão:
- **OL-3.8** — Save agora persiste aiEvaluation (wizard envia, API grava com Timestamp)
- **OL-5.4** — Social debate carrega Offer Lab context (mesmo padrão de social/generate)
- **OL-5.5** — Golden Thread tem step "Oferta" com auto-link e redirect ao Offer Lab

---

## Posição no Master Roadmap

O Sprint OL é **suplementar** à sequência J-X:

- **Não bloqueia** nenhum sprint existente
- **Não depende** de OAuth (U/V)
- **K-1 (UX Polish do Offer Lab)** está ✅ CONCLUÍDO — OL é a evolução natural
- **R (Production Hardening)** está ✅ CONCLUÍDO
- **S (Data Pipeline)** está ✅ CONCLUÍDO

### Status: PRONTO PARA COMMIT

Todos os itens concluídos. Build passa sem erros. Aguardando commit consolidado.

```
Sequência no roadmap:
... → S (Data Pipeline) ✅ → [OL: Offer Lab v2] → W (Automation) → X (Advanced) → P → Q
                              ↑ INSERIR AQUI
```

---

## Critério de Aprovação Sprint OL

| # | Critério | Verificação | Status |
|---|----------|-------------|--------|
| 1 | Score muda ao preencher Steps 1-4 | Oferta vazia (~20pts) → promessa detalhada (sobe) → 3+ stacking (sobe mais) | ✅ |
| 2 | Feedback aparece por step | Campos vazios → alertas amarelos | ✅ |
| 3 | AI Evaluation roda com Brain Council | "Avaliar e Finalizar" → parecer Kennedy + Brunson | ✅ |
| 4 | AI usa PRO model (não Flash) | Logs mostram `gemini-3-pro-preview` | ✅ |
| 5 | `aiEvaluation` persiste no Firestore | Doc em `brands/{id}/offers/{id}` contém campo | ✅ |
| 6 | Copy gerada usa dados do Offer Lab | Gerar copy com oferta ativa → promessa aparece no output | ✅ |
| 7 | Hooks sociais refletem promessa | Gerar hooks com oferta ativa → headlines usam promessa | ✅ |
| 8 | Social debate usa Offer Lab data | Debate recebe dados estruturados (não só brand.offer) | ✅ |
| 9 | Golden Thread tem step "Oferta" | Campaign wizard mostra oferta entre Funil e Copy | ✅ |
| 10 | Lista de ofertas funciona | Salvar 2+ → ver lista → duplicar → ativar | ✅ |
| 11 | Comparação A/B funciona | Selecionar 2 → ver lado a lado | ✅ |
| 12 | Calendar usa offer context | Gerar semana com oferta ativa → posts refletem promessa | ✅ |
