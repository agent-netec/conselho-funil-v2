# Sprint D — Tier 3 Engines + Chat/Party Enriquecidos

> Fase 5 do plano (Fase 6 Deep Brain adiada para Sprint E)
> Status: CONCLUIDO
> Dependencia: Sprint C concluido

---

## Resumo
Integrar brains nos 5 engines restantes (Offer Lab, Research, A/B Testing, Chat System, Party Mode). Deep Brain (Pinecone ingestao) e Pipeline de evolucao ficam para Sprint E.

---

## Tarefas

### 5.1 Offer Lab

#### [x] 5.1.1 — Enriquecer scoring com frameworks de oferta
- **Arquivo:** `app/src/lib/intelligence/offer-lab/scoring.ts`
- **Atual:** Formula pura (Value Equation) sem AI — calculateScore() + generateAnalysis()
- **Counselors:** dan_kennedy_copy (offer_architecture) + russell_brunson (value_ladder_score)
- **Mudanca:** OFFER_EXPERT_MAP + buildOfferBrainContext() + novo metodo async evaluateOfferQuality() que usa Gemini com frameworks reais para gerar insights qualitativos
- **PRESERVADO:** calculateScore() existente intocado (formula pura, sem AI)
- **Interfaces exportadas:** OfferQualityInsight, OfferQualityResult
- **Status:** CONCLUIDO

### 5.2 Research Engine

#### [x] 5.2.1 — Injetar perspectiva de conselheiros na sintese
- **Arquivo de sintese:** `app/src/lib/intelligence/research/dossier-generator.ts`
- **Atual:** Exa → Firecrawl → DossierGenerator.synthesize() — zero counselor
- **Counselors:** eugene_schwartz (awareness_alignment) + russell_brunson (value_ladder_score)
- **Mudanca:** RESEARCH_EXPERT_MAP + buildResearchBrainContext() injetado no synthesisPrompt (Fase 2). Prompt enriquecido pede que a IA identifique nivel de consciencia do mercado (Schwartz) e oportunidades na escada de valor (Brunson)
- **NOTA:** Injetado no prompt, NAO na logica de busca (Exa/Firecrawl)
- **Status:** CONCLUIDO

### 5.3 A/B Testing

#### [x] 5.3.1 — Avaliacao qualitativa de variantes
- **Arquivo server-only:** `app/src/lib/intelligence/ab-testing/variant-evaluator.ts` (NOVO)
- **engine.ts:** Mantido LIMPO (sem imports de loader.ts) — re-exportado para client components
- **Counselors:** gary_halbert (headline_score) + david_ogilvy (big_idea_test) + drayton_bird (simplicity_efficiency)
- **Mudanca:** VARIANT_EXPERT_MAP + buildVariantBrainContext() + evaluateVariants() como funcao standalone em arquivo server-only separado
- **PRESERVADO:** hashAssign(), startTest(), pauseTest(), completeTest(), assignVariant(), recordEvent() intocados
- **Interfaces exportadas:** VariantEvaluation, VariantEvaluationResult
- **Status:** CONCLUIDO

### 5.4 Chat System

#### [x] 5.4.1 — Enriquecer system prompts com identity cards
- **Arquivo server-only:** `app/src/lib/ai/prompts/chat-brain-context.ts` (NOVO)
- **Arquivo modificado:** `app/src/lib/ai/prompts/chat-system.ts` (+ enrichChatPromptWithBrain)
- **ALERTA FS resolvido:** chat-brain-context.ts importa loader.ts, chat-system.ts NAO
- **Counselors:** Todos os 23 (agrupados por council type)
- **COUNCIL_COUNSELORS map:** funnel (6), copy (9), social (4), ads (4)
- **Conteudo injetado por expert:** filosofia (~250 chars) + principios (~300 chars) + catchphrases (3)
- **Wiring:** `api/chat/route.ts` chama buildChatBrainContext() + enrichChatPromptWithBrain() por mode
- **Prompts/index.ts:** Atualizado com re-export de enrichChatPromptWithBrain
- **Status:** CONCLUIDO

### 5.5 Party Mode

#### [x] 5.5.1 — Injetar frameworks + principios no debate
- **Arquivo server-only:** `app/src/lib/ai/prompts/party-brain-context.ts` (NOVO)
- **Arquivo modificado:** `app/src/lib/ai/prompts/party-mode.ts` (brainContext em PartyModeOptions)
- **ALERTA FS resolvido:** party-brain-context.ts importa loader.ts, party-mode.ts NAO
- **Counselors:** Dinamico (baseado nos selectedAgentIds do usuario)
- **Conteudo injetado por agent:** filosofia (~300 chars) + principios (~350 chars) + voz (~200 chars) + catchphrases (4)
- **Wiring:** `api/chat/route.ts` chama buildPartyBrainContext(selectedAgents) e passa como options.brainContext
- **Status:** CONCLUIDO

---

## Mapeamento de Counselors e Framework IDs

| Tarefa | Counselor | Framework ID | Tipo |
|--------|-----------|-------------|------|
| 5.1 Offer Lab | dan_kennedy_copy | offer_architecture | scoring |
| 5.1 Offer Lab | russell_brunson | value_ladder_score | scoring |
| 5.2 Research | eugene_schwartz | awareness_alignment | context |
| 5.2 Research | russell_brunson | value_ladder_score | context |
| 5.3 A/B Testing | gary_halbert | headline_score | evaluation |
| 5.3 A/B Testing | david_ogilvy | big_idea_test | evaluation |
| 5.3 A/B Testing | drayton_bird | simplicity_efficiency | evaluation |
| 5.4 Chat (funnel) | 6 funnel counselors | ALL | narrative |
| 5.4 Chat (copy) | 9 copy counselors | ALL | narrative |
| 5.4 Chat (social) | 4 social counselors | ALL | narrative |
| 5.4 Chat (ads) | 4 ads counselors | ALL | narrative |
| 5.5 Party | DYNAMIC (user selected) | ALL | narrative |

---

## Verificacao Sprint D

- [x] Offer Lab evaluateOfferQuality() retorna insights referenciando Kennedy/Brunson
- [x] Research dossier inclui perspectiva de conselheiros na sintese
- [x] A/B evaluateVariants() retorna analise qualitativa por variante
- [x] Chat mode 4 prompts enriquecidos com filosofia + principios dos experts
- [x] Party mode debates usam voz autentica + catchphrases dos experts
- [x] Build sem erros (compilado em 16.5s, 40 paginas, zero errors)

---

## Changelog

| Data | Tarefa | Status | Observacoes |
|------|--------|--------|-------------|
| 2026-02-14 | 5.1.1 Offer Lab | CONCLUIDO | OFFER_EXPERT_MAP (Kennedy+Brunson) + evaluateOfferQuality() Gemini, calculateScore() preservado |
| 2026-02-14 | 5.2.1 Research | CONCLUIDO | RESEARCH_EXPERT_MAP (Schwartz+Brunson) + brainContext no synthesisPrompt, busca Exa/Firecrawl intocada |
| 2026-02-14 | 5.3.1 A/B Testing | CONCLUIDO | variant-evaluator.ts server-only (Halbert+Ogilvy+Bird), engine.ts limpo para client compat |
| 2026-02-14 | 5.4.1 Chat System | CONCLUIDO | chat-brain-context.ts (23 counselors, 4 councils) + enrichChatPromptWithBrain() + route.ts wiring |
| 2026-02-14 | 5.5.1 Party Mode | CONCLUIDO | party-brain-context.ts (dynamic by agentIds) + brainContext em PartyModeOptions + route.ts wiring |
| 2026-02-14 | Build verification | CONCLUIDO | 16.5s compilacao, zero errors, 40 paginas geradas |
