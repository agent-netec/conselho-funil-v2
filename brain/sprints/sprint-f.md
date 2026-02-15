# Sprint F — Brain Integration Wave (Gaps Criticos)

> Fase: Pos-Auditoria — Integracao de Brains em Engines Orfaos
> Status: CONCLUIDO (2026-02-15)
> Dependencia: Sprint E concluido
> Estimativa: ~16h total

---

## Resumo

Integrar identity cards nos 3 engines de maior impacto que atualmente operam sem brain context: Design Generate (quick win), Copy Generate (gap critico), e Funnels Generate (core product). Ativa 6 counselors atualmente inutilizados.

---

## Contexto Tecnico (para o agente)

### BrainLoader — Funcoes disponiveis
```typescript
import { loadBrain, loadBrainsByDomain, getFramework } from '@/lib/intelligence/brains/loader';
import {
  buildScoringPromptFromBrain,
  buildMultiCounselorContext,
  formatRedFlagsForPrompt,
  formatGoldStandardsForPrompt,
  buildDimensionScoringContext,
} from '@/lib/intelligence/brains/prompt-builder';
```

### Padrao Existente (referencia: ads-brain-context.ts)
```
1. Definir EXPERT_MAP: Record<string, { counselorId, frameworkId }[]>
2. Criar build[X]BrainContext() que itera o map
3. Para cada expert: loadBrain() → getFramework() → formatar context string
4. Injetar red_flags (top 3) e gold_standards
5. Retornar string formatada para injecao no prompt
```

### Regras de Token Budget
- Max 3-4 experts por area do prompt
- ~400 tokens por expert (filosofia + framework JSON)
- ~300 tokens para red_flags + gold_standards
- Total max por engine: ~2000-4000 tokens

---

## Tarefas

### F1. Design Generate — Brain Integration (P1-3)

- **Arquivo principal:** `app/src/app/api/design/generate/route.ts`
- **Novo arquivo:** `app/src/lib/ai/prompts/design-brain-context.ts`
- **Identity card:** `app/src/data/identity-cards/design_director.md`
- **Counselor:** design_director (unico — integracao simples)
- **Frameworks a usar:** `visual_impact_score`, `chapeu_compliance`
- **Mudanca:**
  1. Criar `design-brain-context.ts` seguindo padrao de `ads-brain-context.ts`
  2. `buildDesignBrainContext()` carrega design_director, extrai:
     - Filosofia + principios + voz
     - Framework `chapeu_compliance` (substituir C.H.A.P.E.U hardcoded)
     - Top 3 red_flags: no_visual_hierarchy, color_chaos, emotional_dissonance
     - Gold_standards: perfect_hierarchy, chapeu_full_compliance
  3. No route.ts: importar e injetar brainContext no prompt (substituir `CHAPEU_ELEMENTS` hardcoded)
- **PRESERVAR:** Logica de geracao Gemini 3 Pro Image, upload Firebase Storage, fallback base64
- **Estimativa:** 2-3h
- **Verificacao:** Prompt de design inclui filosofia do director + red_flags + gold_standards (verificar via log ou debug)
- **Status:** CONCLUIDO (2026-02-15)

#### Prompt de Handoff — F1 → F2

```
CONTEXTO: Projeto Conselho de Funil v2, Next.js 16, app/ como root.
Sprint E ja concluido (quick fixes). Sprint F e sobre brain integration em engines que nao tem.

TAREFA CONCLUIDA (F1): Design Generate agora usa brain context.
Criamos:
- app/src/lib/ai/prompts/design-brain-context.ts — buildDesignBrainContext() que carrega design_director.md, extrai chapeu_compliance framework, red_flags e gold_standards
- Modificamos app/src/app/api/design/generate/route.ts — substituimos CHAPEU_ELEMENTS hardcoded pelo brain context dinamico

PROXIMA TAREFA (F2): Copy Generate — Brain Integration.

ARQUIVOS PRINCIPAIS:
- CRIAR: app/src/lib/ai/prompts/copy-brain-context.ts
- MODIFICAR: app/src/lib/ai/prompts/copy-generation.ts (funcao buildCopyPrompt)
- MODIFICAR: app/src/app/api/copy/generate/route.ts (chamar buildCopyBrainContext)

IDENTITY CARDS (9 copy counselors em app/src/data/identity-cards/):
eugene_schwartz.md, gary_halbert.md, joseph_sugarman.md, claude_hopkins.md, david_ogilvy.md, john_carlton.md, dan_kennedy_copy.md, drayton_bird.md, frank_kern_copy.md

PADRAO A SEGUIR: Ler app/src/lib/ai/prompts/ads-brain-context.ts como referencia.

MAPEAMENTO PROPOSTO (awareness stage → experts):
- unaware: eugene_schwartz (awareness_alignment) + gary_halbert (psychological_triggers)
- problem_aware: joseph_sugarman (slippery_slide) + john_carlton (hook_and_fascinations)
- solution_aware: dan_kennedy_copy (offer_architecture) + david_ogilvy (big_idea_test)
- most_aware: claude_hopkins (scientific_testing) + drayton_bird (conversion_mechanics)
- frank_kern_copy: incluir como expert transversal (todos os stages)

FUNCOES DISPONIVEIS DO BRAINLOADER:
import { loadBrain, getFramework } from '@/lib/intelligence/brains/loader';
import { buildScoringPromptFromBrain, formatRedFlagsForPrompt, formatGoldStandardsForPrompt } from '@/lib/intelligence/brains/prompt-builder';

MUDANCAS:
1. Criar copy-brain-context.ts com COPY_EXPERT_MAP (stage → counselors) e buildCopyBrainContext(awarenessStage)
2. Em copy-generation.ts: injetar brainContext retornado na buildCopyPrompt() — adicionar secao apos council intro
3. Em copy/generate/route.ts: chamar buildCopyBrainContext(awareness) e passar para buildCopyPrompt()

REGRAS:
- Max 2-3 experts por awareness stage no prompt
- ~400 tokens por expert
- Incluir red_flags (top 2 por expert) e gold_standards (top 1 por expert)
- NAO alterar o mapeamento de counselors do COUNSELORS_REGISTRY
- NAO alterar a logica de RAG, brand context ou chat attachments — apenas ADICIONAR brain context
- copywriterInsights[] no response deve continuar funcionando (ja existe)

VERIFICACAO: Prompt de copy inclui frameworks reais dos experts + red_flags + gold_standards. copywriterInsights refletem wisdom real.
```

---

### F2. Copy Generate — Brain Integration (P1-1)

- **Novo arquivo:** `app/src/lib/ai/prompts/copy-brain-context.ts`
- **Arquivos modificados:**
  - `app/src/lib/ai/prompts/copy-generation.ts` (injetar brainContext em buildCopyPrompt)
  - `app/src/app/api/copy/generate/route.ts` (chamar buildCopyBrainContext)
- **Counselors (9):** schwartz, halbert, sugarman, hopkins, ogilvy, carlton, kennedy_copy, bird, kern_copy
- **Mapeamento awareness → experts:**
  - unaware → schwartz (awareness_alignment) + halbert (psychological_triggers)
  - problem_aware → sugarman (slippery_slide) + carlton (hook_and_fascinations)
  - solution_aware → kennedy_copy (offer_architecture) + ogilvy (big_idea_test)
  - most_aware → hopkins (scientific_testing) + bird (conversion_mechanics)
  - kern_copy → transversal (todos os stages)
- **Mudanca:**
  1. Criar `copy-brain-context.ts` com `COPY_EXPERT_MAP` e `buildCopyBrainContext(stage)`
  2. Em `copy-generation.ts`: injetar brain context na funcao `buildCopyPrompt()` apos council intro
  3. Em route.ts: chamar `buildCopyBrainContext()` antes da geracao
- **PRESERVAR:** RAG context, brand context, keywords, chat attachments, copywriterInsights, scorecards — tudo existente intocado
- **Estimativa:** 4-6h
- **Verificacao:** Prompt de copy inclui frameworks + red_flags + gold_standards. Output menciona principios reais dos experts
- **Status:** CONCLUIDO (2026-02-15)
- **Nota:** Framework IDs corrigidos para IDs reais: halbert=headline_score, hopkins=scientific_rigor, bird=simplicity_efficiency

#### Prompt de Handoff — F2 → F3

```
CONTEXTO: Projeto Conselho de Funil v2, Next.js 16, app/ como root.
Sprint F — brain integration wave.

TAREFAS CONCLUIDAS:
- F1: Design Generate usa brain context (design-brain-context.ts + route.ts)
- F2: Copy Generate usa brain context (copy-brain-context.ts + copy-generation.ts + route.ts). 9 copy counselors mapeados por awareness stage.

PROXIMA TAREFA (F3): Funnels Generate — Brain Integration.

ARQUIVOS PRINCIPAIS:
- CRIAR: app/src/lib/ai/prompts/funnel-brain-context.ts
- MODIFICAR: app/src/app/api/funnels/generate/route.ts

IDENTITY CARDS (6 funnel counselors em app/src/data/identity-cards/):
russell_brunson.md, dan_kennedy.md, frank_kern.md, sam_ovens.md, ryan_deiss.md, perry_belcher.md

NOTA IMPORTANTE: Os funnel counselors (dan_kennedy, frank_kern, sam_ovens, ryan_deiss, perry_belcher) sao DIFERENTES dos copy counselors (dan_kennedy_copy, frank_kern_copy). Os funnel counselors tem domain: 'funnel' e frameworks diferentes.

PADRAO A SEGUIR: Ler copy-brain-context.ts recem-criado como referencia mais proxima (mesmo padrao de EXPERT_MAP + buildContext).

MAPEAMENTO PROPOSTO (funnel stage → experts):
- awareness/topo: russell_brunson (value_ladder_score) + frank_kern (psychological hooks)
- interest/meio: sam_ovens (audience_qualification) + dan_kennedy (offer_architecture)
- decision/fundo: dan_kennedy (urgency_mechanics) + perry_belcher (simple_monetization)
- retention/pos: ryan_deiss (lifetime_value) + russell_brunson (value_ladder_score)

FUNCOES DISPONIVEIS: Mesmas do BrainLoader (loadBrain, getFramework, buildScoringPromptFromBrain, formatRedFlagsForPrompt, formatGoldStandardsForPrompt)

MUDANCAS:
1. Criar funnel-brain-context.ts com FUNNEL_EXPERT_MAP (stage → counselors) e buildFunnelBrainContext()
2. Em funnels/generate/route.ts: importar buildFunnelBrainContext(), chamar antes da geracao, injetar no prompt do Gemini

ATENCAO AO TOKEN BUDGET:
- 6 counselors × ~400 tokens = ~2400 tokens de frameworks
- Se 2 experts por stage × 4 stages = 8 contextos
- Pode ser necessario sumarizar frameworks (bullets em vez de JSON completo) para stages menos criticos
- Total alvo: < 4000 tokens de brain context

REGRAS:
- NAO alterar logica de RAG, credits, ou persistencia de proposals
- NAO alterar formato de output (funnels continuam gerando stages com mesma estrutura)
- Apenas ENRIQUECER o prompt com brain context dos funnel counselors

VERIFICACAO: Prompt de funil inclui frameworks de Russell Brunson, Kennedy, etc. Funis gerados refletem value ladder thinking e offer architecture.

APOS ESTA TAREFA: Sprint F completo. Rodar build (npm run build no diretorio app/) e verificar zero erros. Registrar tempo de compilacao no changelog.
```

---

### F3. Funnels Generate — Brain Integration (P1-2)

- **Novo arquivo:** `app/src/lib/ai/prompts/funnel-brain-context.ts`
- **Arquivo modificado:** `app/src/app/api/funnels/generate/route.ts`
- **Counselors (6):** brunson, kennedy (funnel), kern (funnel), ovens, deiss, belcher
- **NOTA:** Counselors funnel (dan_kennedy, frank_kern) sao DIFERENTES dos copy (dan_kennedy_copy, frank_kern_copy)
- **Mapeamento funnel stage → experts:**
  - awareness/topo → brunson (value_ladder_score) + kern (psychological hooks)
  - interest/meio → ovens (audience_qualification) + kennedy (offer_architecture)
  - decision/fundo → kennedy (urgency_mechanics) + belcher (simple_monetization)
  - retention/pos → deiss (lifetime_value) + brunson (value_ladder_score)
- **Mudanca:**
  1. Criar `funnel-brain-context.ts` com `FUNNEL_EXPERT_MAP` e `buildFunnelBrainContext()`
  2. Em route.ts: injetar brain context no prompt antes da geracao
- **PRESERVAR:** RAG, credits (3), persistencia de proposals, formato de output
- **Token budget:** < 4000 tokens (sumarizar frameworks se necessario)
- **Estimativa:** 6-8h
- **Verificacao:** Funis gerados refletem value ladder + offer architecture dos experts
- **Status:** CONCLUIDO (2026-02-15)
- **Nota:** Framework IDs corrigidos para IDs reais: kern=behavioral_funnel_score, kennedy=funnel_offer_score+message_market_fit, belcher=monetization_score, deiss=ltv_optimization

---

## Mapeamento Completo de Counselors Ativados pelo Sprint F

| Counselor | Card | Antes (Sprint D) | Apos Sprint F | Engine |
|-----------|------|-------------------|---------------|--------|
| design_director | ✅ | INUTILIZADO | ✅ Ativo | Design Generate |
| eugene_schwartz | ✅ | 3 engines | 4 engines | + Copy Generate |
| gary_halbert | ✅ | 4 engines | 5 engines | + Copy Generate |
| joseph_sugarman | ✅ | 4 engines | 5 engines | + Copy Generate |
| claude_hopkins | ✅ | 2 engines | 3 engines | + Copy Generate |
| david_ogilvy | ✅ | 4 engines | 5 engines | + Copy Generate |
| john_carlton | ✅ | 4 engines | 5 engines | + Copy Generate |
| dan_kennedy_copy | ✅ | 2 engines | 3 engines | + Copy Generate |
| drayton_bird | ✅ | 2 engines | 3 engines | + Copy Generate |
| frank_kern_copy | ✅ | 1 engine | 2 engines | + Copy Generate |
| **russell_brunson** | ✅ | 3 engines | **4 engines** | + Funnels Generate |
| **dan_kennedy** | ✅ | **INUTILIZADO** | **1 engine** | Funnels Generate |
| **frank_kern** | ✅ | **INUTILIZADO** | **1 engine** | Funnels Generate |
| **sam_ovens** | ✅ | **INUTILIZADO** | **1 engine** | Funnels Generate |
| **ryan_deiss** | ✅ | **INUTILIZADO** | **1 engine** | Funnels Generate |
| **perry_belcher** | ✅ | **INUTILIZADO** | **1 engine** | Funnels Generate |

**Resultado:** 6 counselors que eram inutilizados passam a ter pelo menos 1 engine ativo.

---

## Verificacao Sprint F

- [x] design-brain-context.ts criado e funcional
- [x] Design Generate usa brain context em vez de C.H.A.P.E.U hardcoded
- [x] copy-brain-context.ts criado com mapeamento de 9 counselors
- [x] Copy Generate injeta brain context por awareness stage
- [x] funnel-brain-context.ts criado com mapeamento de 6 counselors
- [x] Funnels Generate injeta brain context por funnel stage
- [x] Todos os 24 counselors tem pelo menos 1 engine ativo
- [x] Build sem erros (`npm run build` no diretorio `app/`) — 15.2s

---

## Changelog

| Data | Tarefa | Status | Observacoes |
|------|--------|--------|-------------|
| 2026-02-15 | F1 Design Generate brain | CONCLUIDO | design-brain-context.ts + route.ts modificado |
| 2026-02-15 | F2 Copy Generate brain | CONCLUIDO | copy-brain-context.ts + copy-generation.ts + route.ts |
| 2026-02-15 | F3 Funnels Generate brain | CONCLUIDO | funnel-brain-context.ts + route.ts modificado |
| 2026-02-15 | Build verification | CONCLUIDO | 15.2s, zero erros |
