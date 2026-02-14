# HANDOFF — Sprint B: Tier 1 Engines

> Documento de handoff para nova sessao do Claude Code.
> Gerado: 2026-02-14
> Sprint anterior: Sprint A (CONCLUIDO — commit 49a98333c)

---

## Contexto Rapido

O projeto **Conselho de Funil** e um app Next.js 16 que usa IA (Gemini) para analisar e gerar copy, funis, ads e conteudo social. Possui 23 conselheiros virtuais (experts de marketing), cada um com um **Identity Card** (arquivo .md com frameworks de avaliacao em JSON).

O Sprint A criou toda a infraestrutura:
- **BrainLoader** (`app/src/lib/intelligence/brains/`) — carrega e parseia identity cards
- **24 identity cards** em `app/src/data/identity-cards/` (9 copy, 6 funnel, 4 social, 4 ads, 1 design)
- **Prompt Builder** — funcoes para injetar experts nos prompts do Gemini
- **Migracoes** — embedding model (gemini-embedding-001) e namespace fix (brand_)

---

## O que fazer no Sprint B

Integrar os brains REAIS nos 4 engines mais criticos. Hoje esses engines mencionam os experts no prompt mas NAO injetam frameworks reais. O Sprint B muda isso.

### Documentos de referencia (LER PRIMEIRO)
1. `brain/GUIA-INTEGRACAO-BRAINS.md` — Guia mestre (secoes 5, 9.1)
2. `brain/sprints/sprint-b.md` — Checklist detalhado
3. `brain/sprints/sprint-a.md` — O que ja foi feito (referencia)

---

## Tarefas em Ordem

### 3.1 Scoring Engine
- **Arquivo:** `app/src/lib/intelligence/predictor/scoring-engine.ts`
- **O que fazer:** Substituir prompt generico por `buildScoringPromptFromBrain()` e `buildDimensionScoringContext()` do prompt-builder
- **Mapeamento dimensao → experts:**
  - headline_strength → Halbert (headline_score) + Ogilvy (headline_excellence)
  - cta_effectiveness → Bird (action_clarity) + Kennedy (cta_clarity)
  - hook_quality → Carlton (hook_and_fascinations) + Sugarman (opening_pull)
  - offer_structure → Kennedy (offer_architecture) + Brunson (value_ladder_score)
  - funnel_coherence → Sugarman (slippery_slide) + Schwartz (awareness_alignment)
  - trust_signals → Hopkins (proof_layering) + Ogilvy (facts_over_adjectives)
- **Novo campo na resposta:** `counselorOpinions[]` com: counselorId, score, opinion (na voz do expert), redFlagsTriggered[], goldStandardsHit[]

### 3.2 Recommendations Engine
- **Arquivo:** `app/src/lib/intelligence/predictor/recommendations.ts`
- **O que fazer:** Substituir `COPYWRITING_FRAMEWORKS` hardcoded por red_flags e gold_standards reais dos identity cards
- **Usar:** `formatRedFlagsForPrompt()` e `formatGoldStandardsForPrompt()` do prompt-builder

### 3.3 Autopsy Engine
- **Arquivo:** `app/src/lib/intelligence/autopsy/engine.ts`
- **O que fazer:** Substituir "heuristicas Wilder" genericas por frameworks do funnel council
- **Mapeamento etapa → experts:**
  - Hook → Carlton + Halbert
  - Story → Sugarman + Schwartz
  - Offer → Kennedy + Brunson
  - Friction → Bird + Hopkins
  - Trust → Hopkins + Ogilvy
- **Usar:** `buildMultiCounselorContext()` com max 2-3 experts por etapa

### 3.4 Text Analyzer
- **Arquivo:** `app/src/lib/intelligence/text-analyzer/ad-copy-analyzer.ts`
- **O que fazer:** Injetar frameworks de copy council
- **Experts:** Halbert (specificity) + Schwartz (awareness_alignment) + Bird (benefit hierarchy)

### 3.5 UI — Opiniao do Conselho
- **Arquivo:** `app/src/components/intelligence/predictor/prediction-panel.tsx`
- **O que fazer:** Nova secao mostrando cards individuais por expert
- **Conteudo:** Icone, nome do expert, opiniao (texto), red flags em vermelho, gold standards em verde
- **Dados vem do:** `counselorOpinions[]` retornado pelo Scoring Engine (tarefa 3.1)

### 3.6 Testar gemini-2.5-flash (OPCIONAL — se sobrar tempo)
- **Acao:** Configurar GEMINI_MODEL=gemini-2.5-flash em ambiente local
- **Verificar:** Todas as features funcionam sem regressao

---

## Funcoes disponiveis do BrainLoader (ja criadas no Sprint A)

```typescript
// Carregar brain
import { loadBrain, loadBrainsByDomain, getAllBrains, getFramework } from '@/lib/intelligence/brains/loader';

// Montar prompts
import {
  buildCounselorContext,          // System instruction (persona)
  buildScoringPromptFromBrain,    // Prompt de scoring com JSON
  buildMultiCounselorContext,     // Multi-expert (max 4)
  buildDomainContext,             // Todos os experts de um dominio
  formatRedFlagsForPrompt,        // Red flags JSON
  formatGoldStandardsForPrompt,   // Gold standards JSON
  buildDimensionScoringContext,   // Contexto completo para uma dimensao
  getAvailableFrameworks,         // Lista framework IDs
} from '@/lib/intelligence/brains/prompt-builder';
```

---

## Regras Importantes

1. **Max 3-4 experts por prompt** — alem disso a qualidade degrada
2. **Temperature 0.1** para scoring, 0.3 para recomendacoes
3. **System instruction:** Persona + principios + voz (parte narrativa)
4. **User context:** Frameworks JSON + dados do usuario (NUNCA na system instruction)
5. **Anti-alucinacao:** Sempre incluir "Baseie sua analise EXCLUSIVAMENTE nos dados fornecidos"
6. **responseMimeType: 'application/json'** com responseSchema para scores (0-100)

---

## Verificacao Sprint B (ao final)

- [ ] Scoring Engine retorna counselorOpinions[] com score + opinion + redFlagsTriggered
- [ ] Cada dimensao usa 2-3 experts especificos (nao genericos)
- [ ] Recommendations incluem antes/depois dos red_flags reais
- [ ] Autopsy usa frameworks de funnel council por etapa
- [ ] UI do Predictive Engine mostra cards individuais por expert
- [ ] Build sem erros (ou pelo menos sem erros novos)
