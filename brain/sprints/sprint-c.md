# Sprint C — Tier 2 Engines (Cobertura Ampla)

> Fase 4 do plano
> Status: CONCLUIDO
> Dependencia: Sprint B concluido

---

## Resumo
Integrar brains nos engines de geracao (Content, Ads, Social) e scoring criativo. Migrar gemini-2.5-flash em producao.

---

## Tarefas

### 4.1 Content Generation

#### [x] 4.1.1 — Injetar brains por tipo de conteudo
- **Arquivo:** `app/src/lib/content/generation-engine.ts`
- **Mapeamento implementado:**
  - Posts sociais (post/story/carousel/reel) → Rachel Karten (hook_effectiveness) + Justin Welsh (social_funnel_score)
  - Copy de email → Kennedy (offer_architecture) + Kern (sequence_logic) — preparado no MAP
  - Landing pages → Ogilvy (big_idea_test) + Sugarman (slippery_slide) — preparado no MAP
- **Mudanca:** FORMAT_CATEGORY_MAP + CONTENT_EXPERT_MAP + buildContentBrainContext() injeta frameworks + red_flags no prompt
- **Status:** CONCLUIDO

### 4.2 Creative Scoring

#### [x] 4.2.1 — Adicionar avaliacao qualitativa via brains
- **Arquivo:** `app/src/lib/intelligence/creative/scoring.ts`
- **Mapeamento implementado:**
  - Headline quality → Halbert (headline_score) + Ogilvy (headline_excellence)
  - Copy body quality → Carlton (hook_and_fascinations) + Sugarman (slippery_slide)
- **Mudanca:** CREATIVE_EXPERT_MAP + buildCreativeQualityContext() + calculateQualityScore() via Gemini + calculateFinalScore() combina ROI (60%) + Quality (40%)
- **Metodos existentes preservados:** calculateScore() e rankByProfit() intocados
- **Status:** CONCLUIDO

### 4.3 Ads Generation

#### [x] 4.3.1 — Substituir 1-line expertise por identity cards completos
- **Arquivo:** `app/src/lib/ai/prompts/ads-generation.ts`
- **Mapeamento implementado:**
  - Strategy/Scale → Brooke (ad_strategy_score) + Kusmich (meta_ads_score)
  - Technical/Creative → Loomer (technical_setup_score) + Sanchez (creative_native_score)
- **Mudanca:** ADS_EXPERT_MAP + buildAdsBrainContext() injeta filosofia + frameworks + red_flags + gold_standards. counselorInsights agora incluem frameworkUsed
- **Status:** CONCLUIDO

### 4.4 Social Generation

#### [x] 4.4.1 — Conectar templates + identity cards social
- **Arquivo:** `app/src/app/api/social/generate/route.ts`
- **Mapeamento implementado:**
  - Hooks/Viral → Rachel Karten (hook_effectiveness) + Nikita Beer (viral_potential)
  - Funnel/Algorithm → Justin Welsh (social_funnel_score) + Lia Haberman (algorithm_alignment)
- **Mudanca:** SOCIAL_EXPERT_MAP + buildSocialBrainContext() injeta principios + frameworks + red_flags. Prompt agora pede reasoning referenciando frameworks
- **Status:** CONCLUIDO

### 4.5 Migracao LLM

#### [x] 4.5.1 — Migrar gemini-2.5-flash em producao
- **Acao:** Ja realizada no Sprint B+ — GEMINI_MODEL atualizado no Vercel
- **Status:** CONCLUIDO (realizado anteriormente)

---

## Verificacao Sprint C

- [x] Ads gerados incluem counselorInsights referenciando framework especifico
- [x] Social posts seguem heuristicas de plataforma dos social counselors
- [x] Content generation usa brain relevante ao tipo
- [x] Creative scoring combina score ROI + score qualitativo
- [x] gemini-2.5-flash migrado em producao sem regressoes

---

## Changelog

| Data | Tarefa | Status | Observacoes |
|------|--------|--------|-------------|
| 2026-02-14 | 4.1.1 Content Generation | CONCLUIDO | FORMAT_CATEGORY_MAP + CONTENT_EXPERT_MAP (Karten+Welsh social, Kennedy+Kern email, Ogilvy+Sugarman LP) |
| 2026-02-14 | 4.2.1 Creative Scoring | CONCLUIDO | CREATIVE_EXPERT_MAP + calculateQualityScore() + calculateFinalScore() (ROI 60% + Quality 40%) |
| 2026-02-14 | 4.3.1 Ads Generation | CONCLUIDO | ADS_EXPERT_MAP (Brooke+Kusmich+Loomer+Sanchez) + buildAdsBrainContext() com filosofia+frameworks+red_flags |
| 2026-02-14 | 4.4.1 Social Generation | CONCLUIDO | SOCIAL_EXPERT_MAP (Karten+Beer+Welsh+Haberman) + buildSocialBrainContext() + reasoning field |
| 2026-02-14 | 4.5.1 Migracao LLM | CONCLUIDO | Ja realizado no Sprint B+ |
| 2026-02-14 | Build verification | CONCLUIDO | 17.9s compilacao, zero errors, 40 paginas geradas |
