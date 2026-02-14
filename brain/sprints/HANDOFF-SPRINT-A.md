# Handoff — Sprint A (Cole isso na nova sessao)

## Contexto Rapido
Estamos implementando a integracao real dos "brains" dos 23 conselheiros do app Conselho de Funil. Ate agora cada conselheiro era apenas um nome + 1 frase. Criamos identity cards profundos (com evaluation_frameworks JSON, red_flags, gold_standards) para os 9 copywriters. Falta: infraestrutura de carregamento, migracoes de provedor, e 14 identity cards restantes.

## Documentos de Referencia (LEIA ANTES DE COMECAR)
1. **Guia mestre:** `brain/GUIA-INTEGRACAO-BRAINS.md` — arquitetura, formato, regras de prompt, metadata, evolucao
2. **Sprint A detalhado:** `brain/sprints/sprint-a.md` — checklist completo de tarefas
3. **Plano completo:** `.claude/plans/soft-coalescing-boot.md` — todas as 6 fases
4. **Exemplo de identity card:** `brain/identity-cards/gary_halbert.md` — formato aprovado

## O que fazer no Sprint A (em ordem)

### 1A. Migracoes (PRIMEIRO)
1. **Migrar embedding model** em `app/src/lib/ai/embeddings.ts`:
   - Trocar `text-embedding-004` para `gemini-embedding-001` (endpoint + model, linhas ~100, 107, 194, 209, 216)
   - Manter `outputDimensionality: 768`
2. **Fix namespace bug**: Encontrar `brand-` em `rag-helpers-fixed.ts` e padronizar para `brand_` (igual ao context-assembler.ts)

### 1B. BrainLoader (3 arquivos novos)
Criar em `app/src/lib/intelligence/brains/`:
- `types.ts` — interfaces (BrainIdentityCard, EvaluationFramework, ScoringCriterion, RedFlag, GoldStandard)
- `loader.ts` — le MDs de `app/src/data/identity-cards/`, parseia YAML frontmatter + JSON blocks, cache em Map
- `prompt-builder.ts` — funcoes para injetar brains em prompts (max 3-4 experts, ~2500 tokens)

### 1C. Mover cards
- Copiar `brain/identity-cards/*.md` → `app/src/data/identity-cards/`
- Atualizar `app/src/lib/constants.ts` com campo domain nos COUNSELORS_REGISTRY

### Fase 2. Criar 14 identity cards restantes
No mesmo formato de gary_halbert.md (YAML frontmatter + filosofia + principios + voz + catchphrases + evaluation_frameworks JSON + red_flags JSON + gold_standards JSON):
- 6 Funnel (russell_brunson, dan_kennedy_funnel, frank_kern_funnel, sam_ovens, ryan_deiss, perry_belcher) — fonte: `_netecmt/brain/council/identity/`
- 4 Social (lia_haberman, rachel_karten, nikita_beer, justin_welsh) — fonte: `_netecmt/brain/social/identity/`
- 4 Ads (justin_brooke, nicholas_kusmich, jon_loomer, savannah_sanchez) — criar do zero
- 1 Design (design_director) — fonte: framework C.H.A.P.E.U em `app/src/lib/ai/prompts/design.ts`

## Regras Importantes
- Max ~900 tokens por identity card
- evaluation_frameworks: pesos devem somar 1.0, 4 faixas de scoring (90_100, 60_89, 30_59, 0_29)
- red_flags: penalty -10 a -25, before/after obrigatorio
- gold_standards: bonus +10 a +20
- Funnel cards avaliam FUNIL (nao copy): arquitetura, value ladder, fluxo de conversao
- Social cards avaliam CONTEUDO SOCIAL: hooks, algoritmo, engagement, viralizacao
- Ads cards avaliam ANUNCIOS: escala, targeting, criativo, metricas

## Apos Concluir
Atualizar `brain/sprints/sprint-a.md` marcando tarefas como [x] e preenchendo o Changelog.
