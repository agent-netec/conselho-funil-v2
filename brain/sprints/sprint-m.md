# Sprint M — Analytics Activation & Dashboard Wiring

> Fase: 3 — Evolucao Pos-QA
> Status: PENDENTE
> Dependencia: Sprint L concluido (pipeline de dados ativo)
> Prioridade: **MEDIA-BAIXA** — So faz sentido com dados reais fluindo
> Estimativa: ~2-3 sessoes
> Issues relacionados: #5, #11, #12

---

## Contexto

Com o pipeline de dados do Sprint L ativo (tracking pixel → webhooks → ads sync), os dashboards de analytics finalmente terao dados reais para exibir. Este sprint faz o "wiring" — conecta os dados que agora fluem com os engines/UIs que ja existem mas estavam vazios.

**O que ja esta construido (Sprints B-D, G):**
- AttributionEngine com 4 modelos (last_touch, linear, u_shape, time_decay)
- CohortDashboard com 4 KPIs + graficos + heatmap
- 3 predictive engines (churn, LTV, audience forecast)
- Alert generator para anomalias
- useAttributionData hook que busca do Firebase
- Real-Time Performance UI no Campaign Command Center

**O que este sprint faz:**
- Ativa UIs que estavam mostrando zeros/mock
- Conecta engines com dados reais
- Adiciona labels "estimado"/"real" onde necessario
- Conecta insights de analytics com conselheiros

---

## Tarefas

### M-1. Attribution Dashboard — Ativacao (Issue #11)

**Problema:** Dashboard vazio porque nao havia eventos/transacoes no Firebase. Com Sprint L, havera.

**Arquivos principais:**
- `app/src/app/intelligence/attribution/page.tsx`
- `app/src/lib/intelligence/attribution/engine.ts`
- `app/src/hooks/useAttributionData.ts`

**Tarefas:**
- [ ] M-1.1 — Verificar que `useAttributionData` busca corretamente de `brands/{id}/transactions`, `events`, `performance_metrics` populados pelo Sprint L
- [ ] M-1.2 — Testar os 4 modelos de atribuicao com dados reais: last_touch, linear, u_shape, time_decay
- [ ] M-1.3 — Adicionar badge "Dados Reais" vs "Dados Insuficientes" baseado em threshold (minimo 10 eventos + 1 transacao)
- [ ] M-1.4 — Acionar `POST /api/intelligence/attribution/sync` automaticamente quando usuario abre a pagina e dados estao >6h desatualizados
- [ ] M-1.5 — Adicionar empty state educativo se dados insuficientes: "Para ver atribuicao, voce precisa de: (1) Tracking script instalado, (2) Pelo menos 1 venda registrada, (3) Meta Ads conectado (opcional)"

**Pontos de atencao:**
- Attribution depende das 3 camadas: eventos (L-1), transacoes (L-2), ads spend (L-4)
- Se so tem eventos + transacoes (sem ads), still funciona — last_touch e linear nao precisam de spend
- Modelo u_shape e time_decay sao mais uteis com spend data
- NAO alterar os algoritmos do AttributionEngine — ja estao corretos

---

### M-2. LTV & Cohort Intelligence — Ativacao (Issue #12)

**Problema:** Dashboard mostra tudo zerado (ROI 0.00x, LTV R$0, Leads 0). Backend completo, so faltam dados.

**Arquivos principais:**
- `app/src/app/intelligence/ltv/page.tsx`
- `app/src/components/intelligence/ltv/CohortDashboard.tsx`
- `app/src/lib/intelligence/ltv/cohort-engine.ts`
- `app/src/lib/intelligence/ltv/calculator.ts`
- `app/src/lib/intelligence/predictive/churn-predictor.ts`
- `app/src/lib/intelligence/predictive/ltv-estimator.ts`

**Tarefas:**
- [ ] M-2.1 — Verificar que KPIs (ROI, LTV, Leads, Payback) calculam corretamente com dados reais das collections populadas por Sprint L
- [ ] M-2.2 — Ativar aba "Retencao & Churn" (hoje mostra "disponivel Sprint 22") — backend de churn JA EXISTE, so precisa conectar UI
- [ ] M-2.3 — Testar cohort engine com dados reais: agrupamento por mes, retencao ao longo do tempo
- [ ] M-2.4 — Testar LTV estimator: verificar que multipliers fazem sentido com volumes reais
- [ ] M-2.5 — Testar audience forecaster: narrativa Gemini coerente com dados reais
- [ ] M-2.6 — Adicionar badges "Real" vs "Estimado" nos KPIs baseado em volume de dados (threshold: 50+ leads, 10+ transacoes)
- [ ] M-2.7 — Ativar alert-generator: configurar thresholds para alertas de churn spike, LTV drop, ROI negativo

**Pontos de atencao:**
- Payback "72 dias" e hardcoded no componente — substituir por calculo real (total_spend / monthly_revenue)
- Churn predictor usa regressao logistica simples — funciona bem com 100+ leads, pode dar resultados estranhos com <20
- LTV estimator tem multipliers (frequency, recency, tenure) — documentar para o usuario o que significam
- NAO conectar com conselheiros neste sprint (fica para sprint futuro de "Intelligence Layer")
- Cohort engine gera IDs como "2026-01", "2026-02" — verificar que alinha com dados reais

---

### M-3. Real-Time Performance — Dados Reais (Issue #5)

**Problema:** Campaign Command Center mostra dados 100% hardcoded/mock (CTR 0.65%, CPC R$2.45, spend "R$15.420,50"). Botao "Atualizar Dados" so mostra toast.

**Arquivos principais:**
- `app/src/app/campaigns/[id]/page.tsx` (metricas mock inline)

**Tarefas:**
- [ ] M-3.1 — Substituir dados mock por fetch real de `brands/{id}/performance_metrics` (populado pelo cron L-4)
- [ ] M-3.2 — Filtrar metricas por campaign (usando campaign.adSetId ou campaign.adAccountId se existir)
- [ ] M-3.3 — Botao "Atualizar Dados" deve realmente chamar `POST /api/cron/ads-sync` para a brand especifica (sync manual)
- [ ] M-3.4 — Exibir KPIs reais: Spend, Impressions, Clicks, CTR, CPC, Conversions, CPA, ROAS
- [ ] M-3.5 — Substituir anomalias hardcoded por alertas reais do alert-generator (se anomalias detectadas)
- [ ] M-3.6 — Se brand nao tem Meta Ads conectado, mostrar empty state: "Conecte sua conta Meta Ads em /integrations para ver metricas em tempo real"
- [ ] M-3.7 — Se Meta Ads conectado mas sem dados para esta campaign, mostrar: "Nenhuma campanha Meta encontrada para este funil. Verifique se o Ad Set ID esta configurado."

**Pontos de atencao:**
- Issue #5 comentava `// Mock metrics for ST-11.17` — remover comentario e todo o bloco mock
- Real-time nao sera "real-time" de verdade — sera "near-time" (atualizado a cada 6h pelo cron, ou manual)
- Se usuario nao conectou Meta Ads, toda essa secao e irrelevante — empty state claro
- Anomalias reais dependem de historico (7+ dias de dados) — nao mostrar alertas com <7 dias

---

### M-4. Cross-Channel Analytics — Validacao (Issues #5, #11)

**Problema:** Pagina `/performance/cross-channel` pode estar mostrando dados mock semelhantes ao Campaign Command Center.

**Arquivos principais:**
- `app/src/app/performance/cross-channel/page.tsx`

**Tarefas:**
- [ ] M-4.1 — Auditar se cross-channel usa dados reais ou mock
- [ ] M-4.2 — Se mock: substituir por fetch de `performance_metrics` aggregado (todas as campanhas da brand)
- [ ] M-4.3 — Se real: verificar que funciona com dados do Sprint L
- [ ] M-4.4 — Empty state educativo para brands sem dados

**Pontos de atencao:**
- Sprint I teste I-10 ja verificava isso — retomar de onde parou
- Cross-channel pode depender de MULTIPLAS plataformas (Meta + Google) — funcionar com 1 so ja e valido

---

## Dependencias

```
Sprint L (OBRIGATORIO) → Sprint M
  L-1 (tracking) → M-1 (attribution events), M-2 (LTV leads)
  L-2 (webhooks) → M-1 (attribution transactions), M-2 (LTV transactions)
  L-4 (ads sync) → M-1 (attribution spend), M-3 (real-time performance), M-4 (cross-channel)
```

**SEM Sprint L, Sprint M nao tem dados para trabalhar.** Nao executar M sem pelo menos L-1 e L-2 concluidos.

**Recomendacao de ordem:** M-3 (quick win, substitui mock obvio) → M-1 → M-2 → M-4

---

## Criterio de Aprovacao

| # | Criterio | Verificacao |
|---|----------|-------------|
| 1 | Attribution mostra modelos com dados reais | Gerar eventos de teste + 1 venda, ver atribuicao |
| 2 | LTV mostra KPIs nao-zero | 5+ leads + 2+ vendas, verificar ROI/LTV/Payback |
| 3 | Campaign metrics sao reais (nao mock) | Conectar Meta Ads, ver spend real |
| 4 | Zero instancias de dados hardcoded restantes | Grep por valores suspeitos (15420, 0.65, 2.45) |
| 5 | Empty states educativos em todos os cenarios sem dados | Testar com brand vazia |

---

## Changelog

| Data | Acao | Status |
|------|------|--------|
| 2026-02-15 | Sprint planejado a partir de Issues #5, #11, #12 | CRIADO |
