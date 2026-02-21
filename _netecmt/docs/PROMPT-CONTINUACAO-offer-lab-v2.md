# PROMPT DE CONTINUAÇÃO — Offer Lab v2: Planejamento de Sprints

## Contexto

O Offer Lab é a ferramenta de engenharia de ofertas do Conselho de Funil, baseada no framework "$100M Offers" de Alex Hormozi. Ele já funciona com um wizard de 4 steps (Promessa → Stacking → Bônus → Escassez), score de irresistibilidade (0-100), e save no Firestore.

Porém, foi identificado durante QA que o Offer Lab tem problemas sérios:

1. **Score não reflete conteúdo real** — 80% do score vem de 4 sliders na sidebar. Tudo que o usuário escreve nos Steps 1-4 contribui apenas 0-20 pts (binário). O score praticamente não muda enquanto o usuário preenche o wizard.

2. **Zero feedback de AI** — Existe uma função `evaluateOfferQuality()` em `app/src/lib/intelligence/offer-lab/scoring.ts` que faz avaliação com Brain Council (Dan Kennedy + Russell Brunson via Gemini), mas ela NUNCA é chamada pelo wizard. Ao finalizar, o usuário não recebe dicas, sugestões de melhoria, nem parecer dos conselheiros.

3. **Modelo errado** — A função de AI evaluation usa `DEFAULT_GEMINI_MODEL` (Flash) mas deveria usar `PRO_GEMINI_MODEL` (gemini-3-pro-preview), que é o padrão do projeto para todas as avaliações críticas (Debate, Scorecard, Autopsy, Audience Analysis, etc.)

4. **Desconectado do pipeline** — Os dados salvos pelo Offer Lab não alimentam Copy Generation, Social Hooks, Campaigns (Golden Thread), nem Calendar. A copy usa `brand.offer` (versão simplificada do Brand Wizard), não o `OfferDocument` detalhado do Offer Lab.

## Documentos de Referência

Leia estes arquivos antes de começar:

1. **Roadmap detalhado do Offer Lab v2:**
   `_netecmt/docs/roadmap-offer-lab-v2.md`
   — Contém: 4 fases, tabela de modelos Gemini, mudanças Firebase necessárias, schemas, mapa de conexões

2. **Master Roadmap do projeto:**
   `brain/sprints/master-roadmap.md`
   — Contém: estrutura de sprints (J a X), formato de tarefas, critérios de aprovação, dependências

3. **Código atual do calculator:**
   `app/src/lib/intelligence/offer/calculator.ts`
   — A fórmula atual que precisa ser rebalanceada

4. **Código atual do AI scoring (não utilizado):**
   `app/src/lib/intelligence/offer-lab/scoring.ts`
   — `evaluateOfferQuality()` com Brain Council — precisa ser ativada

5. **Wizard atual:**
   `app/src/components/intelligence/offer-lab/offer-lab-wizard.tsx`
   — Componente principal do wizard (recém-corrigido com tela de sucesso e guarda de brandId)

6. **API de save:**
   `app/src/app/api/intelligence/offer/save/route.ts`

7. **API de score (existente):**
   `app/src/app/api/intelligence/offer/calculate-score/route.ts`

8. **Types:**
   `app/src/types/offer.ts`

## Tarefa

Com base no `roadmap-offer-lab-v2.md` e na estrutura do `master-roadmap.md`:

1. **Leia ambos os documentos** completamente

2. **Organize as 4 fases do Offer Lab v2 em sprints**, seguindo EXATAMENTE o formato do master-roadmap:
   - Cabeçalho com estimativa, dependência, milestone, princípio
   - Tarefas numeradas (ex: OL-1, OL-2...) com subtarefas checkbox
   - Origem (referência ao roadmap-offer-lab-v2.md)
   - Arquivos afetados
   - Critério de aprovação

3. **Determine onde os sprints do Offer Lab se encaixam** na sequência J-X:
   - Sprint K (K-1) já fez UX polish do Offer Lab (sliders, tooltips, feedback visual). Está CONCLUÍDO.
   - Sprints N e O (Intelligence) estão CONCLUÍDOS
   - O Offer Lab v2 é trabalho NOVO que não estava no master-roadmap original
   - Considere dependências: F1 (scoring) é independente, F2 (copy) é independente, F3 depende de F2, F4 depende de F1
   - Considere se deve ser um sprint dedicado ou distribuído em sprints existentes

4. **Para cada tarefa, especifique:**
   - Modelo Gemini a usar (se aplicável): PRO para avaliação, Flash para geração
   - Mudanças Firebase necessárias (se aplicável)
   - Custo em créditos (se aplicável)

5. **Gere o documento final** no formato do master-roadmap e salve em:
   `brain/sprints/sprint-offer-lab-v2.md`

6. **NÃO implemente código.** Este é apenas um planejamento. O objetivo é ter o documento de sprint organizado para execução futura.

## Referência de formato (copie do master-roadmap)

```markdown
### Sprint XX — Título do Sprint

> **Estimativa:** ~N sessões
> **Dependência:** Sprint Y concluído
> **Milestone:** 🎯/⭐/🚀/📊/🏗️ Nome
> **Princípio:** Frase curta sobre o objetivo

#### XX-1. Nome da Tarefa
**Origem:** `roadmap-offer-lab-v2.md` Fase N
**Status:** PENDENTE

- [ ] XX-1.1 — Descrição da subtarefa
- [ ] XX-1.2 — Descrição da subtarefa

**Modelo Gemini:** PRO / Flash / Nenhum
**Custo:** N créditos por execução
**Firebase:** Nenhuma mudança / Novo campo X em Y
**Arquivos:** `path/to/file.ts`, `path/to/file2.tsx`

#### Critério de aprovação Sprint XX

| # | Critério | Verificação |
|---|----------|-------------|
| 1 | Descrição | Como testar |
```
