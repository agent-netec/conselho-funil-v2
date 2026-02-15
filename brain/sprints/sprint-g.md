# Sprint G — Infrastructure Fixes (Features Quebradas)

> Fase: Pos-Auditoria — Conectar Features ao Dado Real
> Status: CONCLUIDO
> Dependencia: Sprint F concluido
> Estimativa: ~12h total

---

## Resumo

Conectar 3 features que existem na UI mas operam com dados mock ou incompletos: Cross-Channel Analytics (100% mock), LTV Cohorts (ad spend hardcoded), e Journey Page (esqueleto sem fetch). Apos este sprint, todas as paginas de intelligence operam com dados reais.

---

## Tarefas

### G1. Cross-Channel Analytics — Dados Reais (P0-2)

- **Arquivo da pagina:** `app/src/app/performance/cross-channel/page.tsx`
- **Problema:** ~90 linhas de `MOCK_METRICS` e `MOCK_INSIGHTS` hardcoded. Comentario: "Em produção viria de um hook useCrossChannelMetrics"
- **Mudanca:**
  1. Criar hook `useCrossChannelMetrics(brandId)` — ou utilizar hooks existentes se ja houver um padrao
  2. O hook deve agregar dados de multiplos canais. Verificar se `/api/intelligence/attribution/stats` ou `/api/performance/metrics` ja retorna dados cross-channel
  3. Se nao houver API que retorne cross-channel consolidado, criar uma que agregue:
     - Meta Ads: spend, revenue, impressions, clicks, conversions
     - Google Ads: mesmo schema
     - TikTok: mesmo schema (se disponivel)
  4. Substituir `MOCK_METRICS` pelo retorno do hook
  5. Substituir `MOCK_INSIGHTS` por insights reais (pode ser via Gemini ou regras simples)
- **PRESERVAR:** Layout e componentes visuais (`UnifiedCrossChannelDashboard`). So trocar a fonte de dados
- **Referencia:** Ver como `/performance/page.tsx` busca dados — provavelmente usa `useSegmentPerformance()` ou similar
- **Estimativa:** 3-4h
- **Verificacao:** Pagina cross-channel mostra dados reais do brand selecionado (ou empty state se nao houver dados)
- **Status:** CONCLUIDO

#### Prompt de Handoff — G1 → G2

```
CONTEXTO: Projeto Conselho de Funil v2, Next.js 16, app/ como root.
Sprints E (quick fixes) e F (brain integration) ja concluidos.
Sprint G e sobre conectar features ao dado real.

TAREFA CONCLUIDA (G1): Cross-Channel Analytics agora busca dados reais.
Criamos/modificamos: [descrever o que foi feito — hook criado, API utilizada, etc.]

PROXIMA TAREFA (G2): Fix LTV Cohorts com dados reais.

ARQUIVO: app/src/app/api/intelligence/ltv/cohorts/route.ts

PROBLEMAS IDENTIFICADOS (2):
1. Ad spend hardcoded: const adSpend = 2000 (buscar por "adSpend" ou "2000" no arquivo)
2. Distribuicao LTV mensal simulada: array de percentuais fixos [0.40, 0.20, 0.15, 0.10, 0.10, 0.05] (buscar por "monthlyDistribution" ou "distribution")

MUDANCA 1 — Ad Spend Real:
- Verificar se existe uma colecao Firebase com metricas de ads (buscar por "admetrics", "ad_spend", "performance_metrics" no codebase)
- Se existir: fazer query para obter ad spend real por periodo
- Se NAO existir: verificar se /api/performance/metrics retorna spend que pode ser reutilizado
- Se nenhuma fonte de dados existir: manter o valor hardcoded MAS adicionar comentario TODO com referencia ao ticket, e adicionar um campo "isEstimated: true" no response para o frontend poder rotular

MUDANCA 2 — Distribuicao LTV Real:
- Verificar se existe colecao Firebase de transacoes (buscar por "transactions", "purchases", "orders" no codebase)
- Se existir: calcular distribuicao real a partir de dados de compra por cohort
- Se NAO existir: manter distribuicao simulada MAS adicionar campo "isSimulated: true" no response

REGRAS:
- NAO quebrar o schema de response existente (adicionar campos, nao remover)
- Manter fallback para dados simulados se fontes reais nao estiverem disponiveis
- O frontend (pagina LTV) deve funcionar com ambos os cenarios

VERIFICACAO: LTV Cohorts retorna dados reais se disponiveis, ou rotula claramente como estimado/simulado.
```

---

### G2. LTV Cohorts — Dados Reais (P0-4)

- **Arquivo:** `app/src/app/api/intelligence/ltv/cohorts/route.ts`
- **Problema 1:** `adSpend = 2000` hardcoded
- **Problema 2:** Distribuicao LTV mensal simulada com percentuais fixos
- **Mudanca:**
  1. Buscar fonte real de ad spend (colecao Firebase `admetrics`, `performance_metrics`, ou `/api/performance/metrics`)
  2. Buscar fonte real de transacoes para distribuicao LTV
  3. Se fontes nao existirem: manter valores mas adicionar `isEstimated: true` no response
- **PRESERVAR:** Schema de response existente (adicionar campos, nao remover)
- **Estimativa:** 2-4h
- **Verificacao:** LTV Cohorts retorna dados reais ou rotula como estimado
- **Status:** CONCLUIDO

#### Prompt de Handoff — G2 → G3

```
CONTEXTO: Projeto Conselho de Funil v2, Next.js 16, app/ como root.
Sprint G — infrastructure fixes.

TAREFAS CONCLUIDAS:
- G1: Cross-Channel Analytics com dados reais
- G2: LTV Cohorts com dados reais (ou rotulado como estimado)

PROXIMA TAREFA (G3): Completar pagina Journey com fetch real.

ARQUIVO PRINCIPAL: app/src/app/intelligence/journey/page.tsx

PROBLEMA: A pagina e apenas um formulario de busca (skeleton). O componente LeadTimeline existe (buscar em app/src/components/intelligence/Journey/) e aceita um array de events como prop, mas a pagina NUNCA faz fetch de dados.

API EXISTENTE: /api/intelligence/journey/[leadId] (GET) — ja existe e funciona! Retorna perfil do lead + timeline de eventos (max 100). Inclui seguranca cross-brand via requireBrandAccess().

MUDANCA:
1. Na pagina journey: apos o usuario buscar um lead (via formulario de search), fazer fetch para /api/intelligence/journey/{leadId}
2. Passar os eventos retornados para o componente LeadTimeline
3. Mostrar dados do perfil do lead (nome, email descriptografado, segmento, etc.)
4. Adicionar estados de loading, error e empty state
5. Opcionalmente: implementar busca de "leads recentes" para popular a lista lateral (verificar se existe hook useRecentLeads ou similar)

REFERENCIA: Ver como /intelligence/predict/page.tsx faz o fluxo de "usuario seleciona input → chama API → mostra resultado" para seguir mesmo padrao de UX.

REGRAS:
- NAO alterar a API /api/intelligence/journey/[leadId] — ja esta funcional
- Usar o componente LeadTimeline existente sem modifica-lo
- Seguir padrao de autenticacao e brand context do app

VERIFICACAO: Usuario busca lead → ve timeline de eventos reais + perfil do lead. Empty state quando nao ha resultados.

APOS ESTA TAREFA: Sprint G completo. Rodar build (npm run build no diretorio app/) e verificar zero erros.
```

---

### G3. Journey Page — Conectar ao API Existente (P1-5)

- **Arquivo:** `app/src/app/intelligence/journey/page.tsx`
- **Componente existente:** `LeadTimeline` em `app/src/components/intelligence/Journey/`
- **API existente:** `/api/intelligence/journey/[leadId]` (GET) — ja funciona, retorna perfil + eventos
- **Problema:** Pagina e skeleton, nunca faz fetch
- **Mudanca:**
  1. Apos busca do lead: fetch para `/api/intelligence/journey/{leadId}`
  2. Passar eventos para LeadTimeline
  3. Mostrar perfil do lead
  4. Adicionar loading, error, empty states
- **PRESERVAR:** API e componente LeadTimeline intocados
- **Estimativa:** 2-4h
- **Verificacao:** Usuario busca lead, ve timeline real + perfil
- **Status:** CONCLUIDO

---

## Verificacao Sprint G

- [x] Cross-Channel Analytics mostra dados reais (ou empty state)
- [x] Nenhum `MOCK_METRICS` ou `MOCK_INSIGHTS` no codigo
- [x] LTV Cohorts usa ad spend real ou rotula como estimado
- [x] Journey page funcional: busca lead → mostra timeline + perfil
- [x] LeadTimeline componente renderiza eventos reais
- [x] Build sem erros (`npm run build` no diretorio `app/`)

---

## Changelog

| Data | Tarefa | Status | Observacoes |
|------|--------|--------|-------------|
| 2026-02-15 | G1 Cross-Channel dados reais | CONCLUIDO | Hook useCrossChannelMetrics criado, mock removido, insights rule-based |
| 2026-02-15 | G2 LTV Cohorts dados reais | CONCLUIDO | Ad spend de performance_metrics, LTV de transactions, flags isEstimated/isSimulated |
| 2026-02-15 | G3 Journey page funcional | CONCLUIDO | Bug brandId corrigido, wrapper createApiSuccess tratado |
| 2026-02-15 | Build verification | CONCLUIDO | npm run build zero erros |
