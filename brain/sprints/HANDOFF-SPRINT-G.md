# HANDOFF — Sprint G: Infrastructure Fixes

> Documento de handoff para nova sessao do Claude Code.
> Gerado: 2026-02-15
> Sprint anterior: Sprint F (Brain Integration Wave)

---

## Contexto Rapido

O projeto **Conselho de Funil** e um app Next.js 16 (root: `app/`) com Firebase/Firestore como banco, Gemini como AI, e Pinecone como vector store.

Sprints E (quick fixes) e F (brain integration) ja concluidos. Sprint G conecta 3 features que tem UI pronta mas dados mock/incompletos.

---

## Documentos de Referencia (LER sprint-g.md)
1. `brain/sprints/sprint-g.md` — Checklist detalhado com 3 tarefas

---

## Tarefas em Ordem

### G1. Cross-Channel Analytics — Dados Reais (~3-4h)
- **Arquivo:** `app/src/app/performance/cross-channel/page.tsx`
- **Problema:** ~90 linhas de MOCK_METRICS/MOCK_INSIGHTS hardcoded
- **Criar:** hook `useCrossChannelMetrics(brandId)` ou equivalente
- **Fontes de dados:** verificar `/api/intelligence/attribution/stats` e `/api/performance/metrics`
- **Referencia:** como `/performance/page.tsx` busca dados reais

### G2. LTV Cohorts — Dados Reais (~2-4h)
- **Arquivo:** `app/src/app/api/intelligence/ltv/cohorts/route.ts`
- **Problema 1:** `adSpend = 2000` hardcoded
- **Problema 2:** Distribuicao LTV com percentuais fixos
- **Mudanca:** Buscar dados reais do Firebase. Se nao existirem, adicionar flag `isEstimated: true`

### G3. Journey Page — Conectar ao API (~2-4h)
- **Arquivo:** `app/src/app/intelligence/journey/page.tsx`
- **API existente:** `/api/intelligence/journey/[leadId]` (GET) — JA FUNCIONA
- **Componente existente:** `LeadTimeline` — JA FUNCIONA
- **Problema:** Pagina nunca faz fetch. Conectar busca → API → LeadTimeline

---

## Regras

1. **PRESERVAR** APIs e componentes existentes — apenas conectar dados
2. **NAO criar** APIs novas se ja existem (verificar primeiro)
3. **Build obrigatorio** ao final: `cd app && npm run build`
4. Cada tarefa tem **Prompt de Handoff** no sprint-g.md
