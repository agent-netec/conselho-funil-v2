# HANDOFF — Sprint F: Brain Integration Wave

> Documento de handoff para nova sessao do Claude Code.
> Gerado: 2026-02-15
> Sprint anterior: Sprint E (Quick Fixes)

---

## Contexto Rapido

O projeto **Conselho de Funil** e um app Next.js 16 (root: `app/`) com 24 conselheiros virtuais de marketing. Cada conselheiro tem um Identity Card (.md com frameworks JSON em `app/src/data/identity-cards/`).

O **BrainLoader** (`app/src/lib/intelligence/brains/loader.ts`) carrega identity cards e disponibiliza via `loadBrain(counselorId)`. O **Prompt Builder** (`app/src/lib/intelligence/brains/prompt-builder.ts`) formata para injecao em prompts Gemini.

Sprint E corrigiu 6 bugs criticos. Sprint F integra brains nos 3 engines de maior impacto que operam sem brain context.

---

## Documentos de Referencia (LER sprint-f.md)
1. `brain/sprints/sprint-f.md` — Checklist detalhado com 3 tarefas + contexto tecnico
2. `app/src/lib/ai/prompts/ads-brain-context.ts` — Padrao de referencia (como brain integration funciona)
3. `app/src/data/identity-cards/` — 24 identity cards

---

## Tarefas em Ordem

### F1. Design Generate — Brain Integration (~2-3h)
- **Criar:** `app/src/lib/ai/prompts/design-brain-context.ts`
- **Modificar:** `app/src/app/api/design/generate/route.ts`
- **Counselor:** design_director (unico)
- **Frameworks:** visual_impact_score, chapeu_compliance
- Substituir C.H.A.P.E.U hardcoded por brain context dinamico

### F2. Copy Generate — Brain Integration (~4-6h)
- **Criar:** `app/src/lib/ai/prompts/copy-brain-context.ts`
- **Modificar:** `app/src/lib/ai/prompts/copy-generation.ts` + `app/src/app/api/copy/generate/route.ts`
- **Counselors (9):** schwartz, halbert, sugarman, hopkins, ogilvy, carlton, kennedy_copy, bird, kern_copy
- Mapear por awareness stage: unaware, problem_aware, solution_aware, most_aware

### F3. Funnels Generate — Brain Integration (~6-8h)
- **Criar:** `app/src/lib/ai/prompts/funnel-brain-context.ts`
- **Modificar:** `app/src/app/api/funnels/generate/route.ts`
- **Counselors (6):** brunson, kennedy (funnel), kern (funnel), ovens, deiss, belcher
- **NOTA:** funnel counselors (dan_kennedy, frank_kern) sao DIFERENTES dos copy (dan_kennedy_copy, frank_kern_copy)
- Mapear por funnel stage: awareness, interest, decision, retention

---

## Funcoes do BrainLoader (ja existem)

```typescript
import { loadBrain, loadBrainsByDomain, getFramework } from '@/lib/intelligence/brains/loader';
import {
  buildScoringPromptFromBrain,
  buildMultiCounselorContext,
  formatRedFlagsForPrompt,
  formatGoldStandardsForPrompt,
} from '@/lib/intelligence/brains/prompt-builder';
```

---

## Regras

1. **Max 3-4 experts por area** do prompt — alem disso qualidade degrada
2. **Token budget:** ~400 tokens por expert, total < 4000 tokens por engine
3. **NAO alterar** logica existente de RAG, credits, persistencia
4. **PRESERVAR** formatos de output de todas as APIs
5. Cada tarefa tem **Prompt de Handoff** detalhado no sprint-f.md
6. **Build obrigatorio** ao final: `cd app && npm run build`
