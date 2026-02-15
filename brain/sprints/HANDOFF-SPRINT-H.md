# HANDOFF — Sprint H: Consolidation

> Documento de handoff para nova sessao do Claude Code.
> Gerado: 2026-02-15
> Sprint anterior: Sprint G (Infrastructure Fixes)

---

## Contexto Rapido

O projeto **Conselho de Funil** e um app Next.js 16 (root: `app/`) com 24 conselheiros virtuais. BrainLoader em `app/src/lib/intelligence/brains/loader.ts`.

Sprints E (quick fixes), F (brain integration para design/copy/funnel), e G (dados reais) ja concluidos. Sprint H consolida: unifica ad generation duplicada e adiciona brain ao Copy Lab.

---

## Documentos de Referencia (LER sprint-h.md)
1. `brain/sprints/sprint-h.md` — Checklist detalhado com 2 tarefas

---

## Tarefas em Ordem

### H1. Unificar Ad Generation (~8-12h)
- **Rota 1 (canonico):** `app/src/app/api/intelligence/creative/generate-ads/route.ts` — SEM brain, SEM RAG
- **Rota 2 (com brain):** `app/src/app/api/campaigns/[id]/generate-ads/route.ts` — COM brain, COM RAG
- **Brain context existente:** `app/src/lib/ai/prompts/ads-brain-context.ts` — buildAdsBrainContext()
- **Objetivo:** Rota 1 vira canonico com brain+RAG. Rota 2 vira proxy leve. Custo unificado: 5 creditos.

### H2. Copy Generation Lab — Brain Integration (~3-4h)
- **Arquivo:** `app/src/lib/intelligence/creative/copy-gen.ts` (buscar CopyGenerationLab)
- **Brain context de referencia:** `app/src/lib/ai/prompts/copy-brain-context.ts` (criado no Sprint F)
- **Mapeamento:** fear→halbert+carlton, greed→sugarman+kennedy, authority→hopkins+ogilvy, curiosity→schwartz+halbert

---

## Regras

1. **Rota 2 vira PROXY** — nao duplicar logica, reutilizar a Rota 1
2. **Max 2 counselors por angulo** no Copy Lab
3. **Build obrigatorio** ao final: `cd app && npm run build`
4. Cada tarefa tem **Prompt de Handoff** no sprint-h.md
