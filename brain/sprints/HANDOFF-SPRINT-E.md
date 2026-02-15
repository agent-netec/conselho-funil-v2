# HANDOFF — Sprint E: Quick Fixes

> Documento de handoff para nova sessao do Claude Code.
> Gerado: 2026-02-15
> Sprint anterior: Sprint D (CONCLUIDO — commit 80b3d0bc2)

---

## Contexto Rapido

O projeto **Conselho de Funil** e um app Next.js 16 (root: `app/`) que usa IA (Gemini) para analisar e gerar copy, funis, ads e conteudo social. Possui 24 conselheiros virtuais (experts de marketing), cada um com um Identity Card (.md com frameworks JSON).

Os Sprints A-D integraram brains em 13 engines. Uma auditoria completa (2026-02-15) identificou bugs, features quebradas e gaps. O Sprint E corrige os 6 itens mais criticos e rapidos.

---

## Documentos de Referencia (LER sprint-e.md)
1. `brain/sprints/sprint-e.md` — Checklist detalhado com 6 tarefas
2. `brain/sprints/sprint-d.md` — O que ja foi feito (referencia)

---

## Tarefas em Ordem

### E1. Fix design_director no Chat (~15 min)
- **Arquivo 1:** `app/src/lib/ai/prompts/chat-brain-context.ts`
  - Linha ~16: tipo `CouncilType` — adicionar `| 'design'`
  - Linhas ~18-34: `COUNCIL_COUNSELORS` — adicionar `design: ['design_director']`
- **Arquivo 2:** `app/src/app/api/chat/route.ts`
  - Bloco `effectiveMode === 'design'` (~linhas 236-239): adicionar `buildChatBrainContext('design')` + `enrichChatPromptWithBrain()`
  - Referencia: ver como os blocos `'copy'`, `'social'`, `'ads'` fazem (linhas acima)

### E2. Fix social-inbox brandId (~30 min)
- **Arquivo:** `app/src/app/social-inbox/page.tsx`
- Substituir `'mock-brand-123'` por brandId real do hook de brand context

### E3. Fix silent error suppression x3 (~1h)
- Buscar hooks de attribution data e predictive data (provavel em `app/src/hooks/`)
- Arquivo: `app/src/app/social-inbox/page.tsx`
- Em cada catch block: adicionar `console.error()` + toast de erro

### E4. Remover mock content do Vault (~30 min)
- **Arquivo:** `app/src/app/vault/page.tsx`
- Remover `MOCK_REVIEW_CONTENT`, substituir por empty state

### E5. Fix copy pricing invertido (~15 min)
- `app/src/app/api/copy/generate/route.ts` — de 1 para 2 creditos
- `app/src/app/api/intelligence/creative/copy/route.ts` — de 2 para 1 credito

### E6. Rotular ScaleSimulator como demo (~30 min)
- Buscar `ScaleSimulator` em `app/src/components/intelligence/`
- Adicionar badge "Projecao Simulada"

---

## Regras Importantes

1. **PRESERVAR** toda logica existente — apenas corrigir/adicionar o minimo
2. **Build obrigatorio** ao final: `cd app && npm run build`
3. **NAO alterar** APIs, schemas de response, ou logica de Firebase
4. Cada tarefa tem um **Prompt de Handoff** no sprint-e.md — se a sessao acabar, usar o handoff para retomar
5. Marcar tarefas como `[x]` no sprint-e.md apos conclusao

---

## Verificacao Sprint E (ao final)

- [ ] Chat modo Design responde com personalidade do design_director
- [ ] Social Inbox carrega dados com brand real
- [ ] Erros de API mostram feedback ao usuario (3 locais)
- [ ] Vault inicia sem dados mock
- [ ] Copy pricing: generate=2cr, creative/copy=1cr
- [ ] ScaleSimulator tem label de demo
- [ ] Build sem erros
