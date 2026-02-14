# Sprint B — Tier 1 Engines (Impacto Maximo)

> Fase 3 do plano
> Status: CONCLUIDO (tarefas 3.1-3.5)
> Dependencia: Sprint A concluido

---

## Resumo
Integrar brains reais nos 4 engines mais criticos + criar UI de opiniao do conselho no Predictive Engine. Testar gemini-2.5-flash em staging.

---

## Tarefas

### 3.1 Scoring Engine

#### [x] 3.1.1 — Substituir prompt generico por frameworks reais
- **Arquivo:** `app/src/lib/intelligence/predictor/scoring-engine.ts`
- **Mudanca:** Cada dimensao usa 2 experts com evaluation_frameworks JSON via DIMENSION_EXPERT_MAP
- **Mapeamento implementado:**
  - headline_strength → Halbert (headline_score) + Ogilvy (headline_excellence)
  - cta_effectiveness → Bird (simplicity_efficiency) + Kennedy (market_match)
  - hook_quality → Carlton (hook_and_fascinations) + Sugarman (slippery_slide)
  - offer_structure → Kennedy (offer_architecture) + Brunson (value_ladder_score)
  - funnel_coherence → Sugarman (slippery_slide) + Schwartz (awareness_alignment)
  - trust_signals → Hopkins (trial_and_proof) + Ogilvy (big_idea_test)
- **Nota:** Framework IDs usam o ID top-level do evaluation_frameworks (nao criterios internos)
- **Temperature:** 0.3 → 0.1 (consistencia maxima)
- **Anti-alucinacao:** confidence field + grounded prompting
- **Status:** CONCLUIDO

#### [x] 3.1.2 — Adicionar counselorOpinions na resposta
- **Novo campo:** `counselorOpinions[]` com counselorId, counselorName, dimension, score, opinion, redFlagsTriggered, goldStandardsHit
- **Interface:** CounselorOpinion em `app/src/types/prediction.ts`
- **ScoringResult:** atualizado com counselorOpinions[]
- **PredictScoreResponse:** atualizado com counselorOpinions?
- **Route:** `api/intelligence/predict/score/route.ts` passa counselorOpinions
- **Status:** CONCLUIDO

### 3.2 Recommendations Engine

#### [x] 3.2.1 — Substituir COPYWRITING_FRAMEWORKS hardcoded
- **Arquivo:** `app/src/lib/intelligence/predictor/recommendations.ts`
- **Mudanca:** DIMENSION_COUNSELORS map + buildRealFrameworksContext() carrega red_flags e gold_standards reais via formatRedFlagsForPrompt/formatGoldStandardsForPrompt
- **COPYWRITING_FRAMEWORKS:** mantido como fallback, enriquecido com dados reais no prompt principal
- **Temperature:** 0.4 → 0.3
- **Status:** CONCLUIDO

### 3.3 Autopsy Engine

#### [x] 3.3.1 — Substituir heuristicas Wilder por funnel council
- **Arquivo:** `app/src/lib/intelligence/autopsy/engine.ts`
- **Mapeamento implementado:** STAGE_EXPERT_MAP com:
  - Hook → Carlton (hook_and_fascinations) + Halbert (headline_score)
  - Story → Sugarman (slippery_slide) + Schwartz (awareness_alignment)
  - Offer → Kennedy (offer_architecture) + Brunson (value_ladder_score)
  - Friction → Bird (simplicity_efficiency) + Hopkins (scientific_rigor)
  - Trust → Hopkins (trial_and_proof) + Ogilvy (big_idea_test)
- **buildStageFrameworks():** carrega frameworks JSON + red flags por etapa
- **Prompt:** findings referenciam experts e frameworks especificos
- **Status:** CONCLUIDO

### 3.4 Text Analyzer

#### [x] 3.4.1 — Injetar frameworks de copy council
- **Arquivo:** `app/src/lib/intelligence/text-analyzer/ad-copy-analyzer.ts`
- **buildCopyCouncilContext():** carrega frameworks reais de:
  - Halbert (headline_score) — foco em especificidade
  - Schwartz (awareness_alignment) — foco em nivel de consciencia
  - Bird (simplicity_efficiency) — foco em hierarquia de beneficios
- **Inclui:** Red flags com before/after para cada expert
- **Status:** CONCLUIDO

### 3.5 UI — Opiniao do Conselho

#### [x] 3.5.1 — Nova secao no Predictive Engine
- **Arquivo:** `app/src/components/intelligence/predictor/prediction-panel.tsx`
- **Componentes:** CounselorOpinionCard + CounselorOpinionsSection
- **Conteudo:** Cards individuais por expert com icone (da COUNSELORS_REGISTRY), nome, opiniao em italico, score colorido, red flags em vermelho, gold standards em verde
- **Posicao:** Entre DimensionBars e BenchmarkCard
- **Layout:** Grid 1-2 colunas responsivo
- **Status:** CONCLUIDO

### 3.6 Testar gemini-2.5-flash

#### [  ] 3.6.1 — Testar em staging
- **Acao:** Configurar GEMINI_MODEL=gemini-2.5-flash em ambiente de teste
- **Verificar:** Todas as features funcionam sem regressao
- **Status:** _aguardando_ (opcional — se sobrar tempo)

---

## Verificacao Sprint B

- [x] Scoring Engine retorna counselorOpinions[] com score + opinion + redFlagsTriggered
- [x] Cada dimensao usa 2-3 experts especificos (nao genericos)
- [x] Recommendations incluem antes/depois dos red_flags reais
- [x] Autopsy usa frameworks de funnel council
- [x] UI do Predictive Engine mostra cards individuais por expert
- [ ] gemini-2.5-flash testado em staging sem regressoes (OPCIONAL)
- [x] Build sem erros (compilado em 25.8s)

---

## Changelog

| Data | Tarefa | Status | Observacoes |
|------|--------|--------|-------------|
| 2026-02-14 | 3.1.1 Scoring frameworks | CONCLUIDO | DIMENSION_EXPERT_MAP com 6 dimensoes × 2 experts, temp 0.1 |
| 2026-02-14 | 3.1.2 counselorOpinions | CONCLUIDO | CounselorOpinion type + ScoringResult + route passthrough |
| 2026-02-14 | 3.2.1 Recommendations | CONCLUIDO | DIMENSION_COUNSELORS + buildRealFrameworksContext, temp 0.3 |
| 2026-02-14 | 3.3.1 Autopsy | CONCLUIDO | STAGE_EXPERT_MAP + buildStageFrameworks, 5 etapas × 2 experts |
| 2026-02-14 | 3.4.1 Text Analyzer | CONCLUIDO | buildCopyCouncilContext com Halbert+Schwartz+Bird |
| 2026-02-14 | 3.5.1 UI Conselho | CONCLUIDO | CounselorOpinionCard + CounselorOpinionsSection |
| 2026-02-14 | Build verification | CONCLUIDO | 25.8s, zero errors |
