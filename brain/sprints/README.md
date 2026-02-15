# Sprints — Conselho de Funil v2

Tracking de progresso da plataforma.

## Sprint Ativo

> **Sprint E** — Quick Fixes (Achados P0 da Auditoria)
> Ver: [sprint-e.md](sprint-e.md)

## Estrutura

### Fase 1: Integracao dos Brains (CONCLUIDOS)
- `sprint-a.md` — Infraestrutura + Migracoes + Identity Cards
- `sprint-b.md` — Tier 1 Engines (Scoring, Autopsy, Recommendations, Text Analyzer)
- `sprint-c.md` — Tier 2 Engines (Content, Creative, Ads, Social)
- `sprint-d.md` — Tier 3 (Offer Lab, Research, A/B Testing, Chat, Party)

### Fase 2: Auditoria & Correcoes (PENDENTES)
- `sprint-e.md` — Quick Fixes (P0s: design chat, social inbox, errors, vault, pricing, simulator)
- `sprint-f.md` — Brain Integration Wave (design generate, copy generate, funnels generate)
- `sprint-g.md` — Infrastructure Fixes (cross-channel, LTV cohorts, journey page)
- `sprint-h.md` — Consolidation (ad unification, copy lab brain)
- `sprint-i.md` — Verificacao Final & Testes Manuais (QA pelo usuario)

### Handoffs (documentos de contexto para novo agente)
- `HANDOFF-SPRINT-A.md` — Contexto para iniciar Sprint A
- `HANDOFF-SPRINT-B.md` — Contexto para iniciar Sprint B

## Progresso

| Sprint | Status | Tarefas | Commit |
|--------|--------|---------|--------|
| A | CONCLUIDO | 24 identity cards + BrainLoader + migrations | 49a98333c |
| B | CONCLUIDO | Scoring + Autopsy + Recommendations + Text Analyzer + UI counselorOpinions | c0b0b3138 |
| C | CONCLUIDO | Content + Creative Scoring + Ads + Social generation | bef34873e |
| D | CONCLUIDO | Offer Lab + Research + A/B Testing + Chat (23) + Party Mode | 80b3d0bc2 |
| E | PENDENTE | 6 quick fixes (design chat, social inbox, errors, vault, pricing, simulator) | — |
| F | PENDENTE | 3 brain integrations (design, copy, funnels generate) | — |
| G | PENDENTE | 3 infrastructure fixes (cross-channel, LTV, journey) | — |
| H | PENDENTE | 2 consolidations (ad unification, copy lab brain) | — |
| I | PENDENTE | QA final + testes manuais pelo usuario | — |

## Como Usar os Prompts de Handoff

Cada tarefa dentro dos sprints E-H termina com um **Prompt de Handoff** delimitado por ``` (code block). Este prompt contem:

1. **Contexto minimo** — o que o projeto e e onde estamos
2. **Tarefas concluidas** — o que ja foi feito nesta sessao
3. **Proxima tarefa** — descricao precisa do que fazer
4. **Arquivos** — caminhos exatos dos arquivos a ler/modificar
5. **Regras** — o que preservar e o que nao alterar
6. **Verificacao** — como confirmar que deu certo

**Por que?** Cada tarefa pode ser executada por um novo agente sem perda de contexto. O prompt garante que o agente nao alucina sobre o estado do sistema.

**Fluxo:**
1. Abra o sprint ativo (ver README)
2. Encontre a proxima tarefa PENDENTE
3. Copie o **Prompt de Handoff** da tarefa ANTERIOR (ou use o prompt inicial se for a primeira)
4. Cole como prompt para o novo agente
5. Apos conclusao, marque a tarefa como CONCLUIDO no sprint doc
6. Repita ate finalizar o sprint

## Documentos de Referencia

- Guia mestre: [../GUIA-INTEGRACAO-BRAINS.md](../GUIA-INTEGRACAO-BRAINS.md)
- Plano tecnico: `.claude/plans/soft-coalescing-boot.md`
- Auditoria completa: realizada em 2026-02-15 (resultados nos sprints E-I)
