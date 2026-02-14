# Sprint B — Tier 1 Engines (Impacto Maximo)

> Fase 3 do plano
> Status: NAO INICIADO
> Dependencia: Sprint A concluido

---

## Resumo
Integrar brains reais nos 4 engines mais criticos + criar UI de opiniao do conselho no Predictive Engine. Testar gemini-2.5-flash em staging.

---

## Tarefas

### 3.1 Scoring Engine

#### [  ] 3.1.1 — Substituir prompt generico por frameworks reais
- **Arquivo:** `app/src/lib/intelligence/predictor/scoring-engine.ts`
- **Mudanca:** Cada dimensao usa 2-3 experts com evaluation_frameworks JSON
- **Mapeamento:**
  - headline_strength → Halbert (headline_score) + Ogilvy (headline_excellence)
  - cta_effectiveness → Bird (action_clarity) + Kennedy (cta_clarity)
  - hook_quality → Carlton (hook_and_fascinations) + Sugarman (opening_pull)
  - offer_structure → Kennedy (offer_architecture) + Brunson (value_ladder)
  - funnel_coherence → Sugarman (slippery_slide) + Schwartz (awareness_alignment)
  - trust_signals → Hopkins (proof_layering) + Ogilvy (facts_over_adjectives)
- **Status:** _aguardando_

#### [  ] 3.1.2 — Adicionar counselorOpinions na resposta
- **Novo campo:** `counselorOpinions[]` com score, opinion, redFlagsTriggered, goldStandardsHit
- **Status:** _aguardando_

### 3.2 Recommendations Engine

#### [  ] 3.2.1 — Substituir COPYWRITING_FRAMEWORKS hardcoded
- **Arquivo:** `app/src/lib/intelligence/predictor/recommendations.ts`
- **Mudanca:** Usar red_flags e gold_standards reais dos identity cards
- **Status:** _aguardando_

### 3.3 Autopsy Engine

#### [  ] 3.3.1 — Substituir heuristicas Wilder por funnel council
- **Arquivo:** `app/src/lib/intelligence/autopsy/engine.ts`
- **Mapeamento:** Hook→Carlton+Halbert, Story→Sugarman+Schwartz, Offer→Kennedy+Brunson, Friction→Bird+Hopkins, Trust→Hopkins+Ogilvy
- **Status:** _aguardando_

### 3.4 Text Analyzer

#### [  ] 3.4.1 — Injetar frameworks de copy council
- **Arquivo:** `app/src/lib/intelligence/text-analyzer/ad-copy-analyzer.ts`
- **Mudanca:** Halbert (specificity) + Schwartz (awareness) + Bird (benefit hierarchy)
- **Status:** _aguardando_

### 3.5 UI — Opiniao do Conselho

#### [  ] 3.5.1 — Nova secao no Predictive Engine
- **Arquivo:** `app/src/components/intelligence/predictor/prediction-panel.tsx`
- **Conteudo:** Cards individuais por expert com icone, nome, opiniao, red flags em vermelho, gold standards em verde
- **Status:** _aguardando_

### 3.6 Testar gemini-2.5-flash

#### [  ] 3.6.1 — Testar em staging
- **Acao:** Configurar GEMINI_MODEL=gemini-2.5-flash em ambiente de teste
- **Verificar:** Todas as features funcionam sem regressao
- **Status:** _aguardando_

---

## Verificacao Sprint B

- [ ] Scoring Engine retorna counselorOpinions[] com score + opinion + redFlagsTriggered
- [ ] Cada dimensao usa 2-3 experts especificos (nao genericos)
- [ ] Recommendations incluem antes/depois dos red_flags reais
- [ ] Autopsy usa frameworks de funnel council
- [ ] UI do Predictive Engine mostra cards individuais por expert
- [ ] gemini-2.5-flash testado em staging sem regressoes

---

## Changelog

| Data | Tarefa | Status | Observacoes |
|------|--------|--------|-------------|
| — | Sprint B inicio | AGUARDANDO | Depende da Sprint A |
