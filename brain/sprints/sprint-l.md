# Sprint L — Data Pipeline Foundation

> Fase: 3 — Evolucao Pos-QA
> Status: PENDENTE
> Dependencia: Sprint J concluido (minimo). Sprint K recomendado mas nao obrigatorio.
> Prioridade: **MEDIA** — Desbloqueia todos os dashboards de analytics (Sprint M)
> Estimativa: ~4-5 sessoes (maior sprint da Fase 3)
> Issues relacionados: #5, #11, #12, #13 (dependencia compartilhada)

---

## Contexto

**Este e o sprint mais importante arquiteturalmente.** Sprint I revelou que 4 modulos (Attribution, LTV, Lead Journey, Real-Time Performance) estao com backend completo mas dashboards vazios. Todos compartilham a mesma causa raiz: **faltam 3 camadas de ingestao de dados**.

```
[Tracking Pixel] → eventos (page_view, lead_capture, checkout)
        ↓
[Webhook Pagamento] → transacoes (amount, status, customer)
        ↓
[Ads API Sync] → metricas de spend (impressions, clicks, cost)
        ↓
[Firebase Collections] → leads, transactions, performance_metrics
        ↓
[Engines] → Attribution, LTV, Cohort, Journey, Performance
```

**O que ja existe (nao precisa construir):**
- `POST /api/intelligence/events/ingest` — recebe eventos com UTM tracking
- `POST /api/integrations/offline-conversion` — registra vendas offline
- `POST /api/intelligence/attribution/sync` — consolida attribution bridges
- `bridge.ts` — ingestao com SHA256 lead ID, UTM first/last touch
- `journey.ts` — CRUD leads/events/transactions com PII criptografado
- `cohort-engine.ts`, `calculator.ts`, `churn-predictor.ts`, `ltv-estimator.ts`, `audience-forecaster.ts`
- `AttributionEngine` com 4 modelos (last_touch, linear, u_shape, time_decay)
- Integracao Meta Ads na pagina `/integrations` (Ad Account ID + token)

**O que precisa construir:**
1. Tracking pixel/script para funnels (captura automatica de eventos)
2. Webhook de pagamento (Stripe/Hotmart/Kiwify/etc.)
3. Cron jobs para sync periodico

---

## Tarefas

### L-1. Tracking Script para Funnels (Camada 1 — Eventos)

**Objetivo:** Capturar automaticamente page_view, lead_capture, button_click, checkout_start nos funnels publicados pelo usuario. Alimenta: Lead Journey (#13), Attribution (#11), LTV (#12).

**Arquivos envolvidos:**
- NOVO: `app/src/lib/tracking/pixel.ts` (script geravel por brand)
- EXISTENTE: `app/src/app/api/intelligence/events/ingest/route.ts` (ja recebe eventos)
- EXISTENTE: `app/src/lib/intelligence/journey/bridge.ts` (ja processa com SHA256)

**Tarefas:**
- [ ] L-1.1 — Criar endpoint `GET /api/tracking/script.js?brandId=XXX` que retorna JavaScript injetavel em qualquer pagina
- [ ] L-1.2 — Script deve capturar automaticamente: page_view (URL, referrer, UTM params), tempo na pagina, scroll depth
- [ ] L-1.3 — Script deve capturar eventos de formulario: lead_capture (email/nome submetidos — hasheados client-side com SHA256)
- [ ] L-1.4 — Script deve capturar checkout events: checkout_start, purchase_complete (via data attributes ou seletor configuravel)
- [ ] L-1.5 — Eventos enviados para `POST /api/intelligence/events/ingest` com brandId, sessionId, leadId (SHA256), UTM data
- [ ] L-1.6 — Criar pagina de instrucoes `/settings/tracking` com snippet para copiar/colar (como Google Analytics)
- [ ] L-1.7 — Adicionar rate limiting e validacao de origem (CORS) no endpoint de ingestao

**Pontos de atencao:**
- **LGPD/Privacidade:** Hashear PII client-side (SHA256). Nao capturar campos de senha/cartao. Consentimento via cookie banner (pode ser Sprint futuro).
- **Performance:** Script deve ser <5KB minificado. Nao bloquear rendering.
- Bridge.ts JA faz SHA256 server-side — garantir que IDs batem (mesmo algoritmo).
- Nao precisa construir funnels hostados — script funciona em qualquer site/LP do usuario.
- Rate limit: max 100 eventos/min por brandId para prevenir abuse.

---

### L-2. Webhook de Pagamento (Camada 2 — Transacoes)

**Objetivo:** Receber notificacoes automaticas de vendas/pagamentos e registrar como transacoes. Alimenta: LTV (#12), Attribution (#11), Cohort Engine.

**Arquivos envolvidos:**
- NOVO: `app/src/app/api/webhooks/payments/route.ts` (receiver generico)
- NOVO: `app/src/lib/integrations/payment-adapters/` (Hotmart, Stripe, Kiwify)
- EXISTENTE: `app/src/app/api/integrations/offline-conversion/route.ts` (ja registra vendas)
- EXISTENTE: `app/src/lib/firebase/journey.ts` (ja persiste transactions)

**Tarefas:**
- [ ] L-2.1 — Criar endpoint generico `POST /api/webhooks/payments` que detecta provider pelo header/body
- [ ] L-2.2 — Adapter Hotmart: parsear postback (produto, valor, email, status: approved/refunded/chargeback)
- [ ] L-2.3 — Adapter Stripe: parsear webhook event (checkout.session.completed, charge.refunded)
- [ ] L-2.4 — Adapter Kiwify: parsear webhook (similar ao Hotmart)
- [ ] L-2.5 — Normalizar para formato interno: `{ brandId, leadId (SHA256 do email), amount, currency, status, productId, provider, webhookTimestamp }`
- [ ] L-2.6 — Salvar em `brands/{brandId}/transactions` (collection ja usada pelo LTV engine)
- [ ] L-2.7 — Atualizar lead em `brands/{brandId}/leads` com `lastPurchaseAt`, `totalSpent`, `purchaseCount`
- [ ] L-2.8 — Criar pagina `/settings/integrations/payments` com instrucoes para configurar webhook URL em cada plataforma
- [ ] L-2.9 — Validacao de assinatura (Stripe signature, Hotmart token) para seguranca

**Pontos de atencao:**
- **Idempotencia:** Usar `webhookEventId` como dedup key — mesmo webhook recebido 2x nao duplica transacao.
- **Seguranca:** Validar assinatura do webhook (Stripe-Signature header, Hotmart hottok). Rejeitar requests nao assinados em producao.
- Hotmart e Kiwify sao os mais comuns no mercado BR de infoprodutos — priorizar.
- Stripe e mais universal — importante para SaaS.
- **Prioridade de implementacao:** Hotmart → Kiwify → Stripe (pelo publico-alvo do produto).

---

### L-3. Jornada do Lead — Backend dos Placeholders (Issue #13)

**Objetivo:** Implementar backend para "Leads Recentes" e "Heatmap de Conversao" que atualmente sao placeholders.

**Arquivos envolvidos:**
- `app/src/app/intelligence/journey/page.tsx` (frontend com placeholders)
- `app/src/lib/firebase/journey.ts` (CRUD ja existe)
- NOVO: `app/src/app/api/intelligence/journey/recent/route.ts`
- NOVO: `app/src/app/api/intelligence/journey/heatmap/route.ts`

**Tarefas:**
- [ ] L-3.1 — Criar `GET /api/intelligence/journey/recent?brandId=XXX&limit=20` que retorna leads recentes com ultimo evento e status (lead/customer/churned)
- [ ] L-3.2 — Implementar componente "Leads Recentes" real (substituir placeholder): lista de leads com avatar generico, nome/email mascarado, ultimo evento, data, badge de status
- [ ] L-3.3 — Criar `GET /api/intelligence/journey/heatmap?brandId=XXX` que calcula funil de conversao: page_view → lead_capture → checkout_start → purchase com contagem e % de drop-off
- [ ] L-3.4 — Implementar componente "Heatmap de Conversao" real (substituir placeholder): funil visual horizontal com barras de % e taxa de abandono entre cada step
- [ ] L-3.5 — Adicionar empty state educativo: "Nenhum lead capturado ainda. Instale o tracking script em suas paginas para comecar a rastrear a jornada dos seus leads." com link para `/settings/tracking` (L-1.6)

**Pontos de atencao:**
- DEPENDE de L-1 (tracking script) para ter dados reais. Sem dados, mostra empty state educativo.
- Journey e o **ponto de convergencia** — se dados existirem aqui, automaticamente populam LTV (#12) e Attribution (#11).
- Mascarar PII na UI: mostrar "jo***@email.com" e "Jo*** Si***".
- Leads Recentes deve ter paginacao (scroll infinito ou "Ver mais").

---

### L-4. Ads API Sync Cron (Camada 3 — Metricas de Spend)

**Objetivo:** Sincronizar metricas de ad spend (Meta Ads, Google Ads) periodicamente para popular dashboards de performance.

**Arquivos envolvidos:**
- EXISTENTE: `/integrations` page (ja permite conectar Meta Ads com Ad Account ID + token)
- EXISTENTE: `app/src/app/api/intelligence/attribution/sync/route.ts` (consolida bridges)
- NOVO: `app/src/app/api/cron/ads-sync/route.ts` (cron job)
- NOVO: `app/src/lib/integrations/meta-ads/client.ts` (API client)

**Tarefas:**
- [ ] L-4.1 — Criar client Meta Ads Marketing API: buscar campaigns, adsets, insights (spend, impressions, clicks, conversions) dos ultimos 7 dias
- [ ] L-4.2 — Criar endpoint cron `POST /api/cron/ads-sync` protegido por CRON_SECRET
- [ ] L-4.3 — Cron busca todas as brands com Meta Ads conectado, para cada uma: fetch insights → salva em `brands/{id}/performance_metrics`
- [ ] L-4.4 — Adicionar cron job no Vercel (vercel.json) para rodar a cada 6 horas
- [ ] L-4.5 — Tratar token expirado: marcar integracao como `expired`, notificar usuario na UI para reconectar
- [ ] L-4.6 — Google Ads client (se viavel — API mais complexa, pode ser Sprint futuro)

**Pontos de atencao:**
- **Meta API Rate Limits:** Respeitar throttling (200 calls/hour por ad account). Nao buscar mais que necessario.
- **Token de longa duracao:** Meta tokens curtos expiram em 60 dias. Documentar para o usuario renovar.
- **CRON_SECRET whitespace bug** (Issue de MEMORY.md): usar `printf` para setar env var, verificar com `vercel env pull`.
- Google Ads e significativamente mais complexo (OAuth, developer token, API approval) — pode ser adiado.
- **Prioridade:** Meta Ads primeiro (90% do publico-alvo usa Meta).

---

## Dependencias entre Tarefas

```
L-1 (tracking script) ←── L-3 (journey depende de eventos)
L-2 (webhook payment) ←── L-3 (journey depende de transacoes)
L-1 + L-2 + L-4 → Sprint M (todos os dashboards dependem dos 3)
```

**Recomendacao de ordem:** L-1 → L-2 → L-3 → L-4

L-1 e L-2 podem ser feitos em paralelo se houver 2 agentes. L-3 depende de pelo menos L-1 para ter dados de teste. L-4 e independente mas menos urgente (ads sync pode ser manual inicialmente).

---

## Criterio de Aprovacao

| # | Criterio | Verificacao |
|---|----------|-------------|
| 1 | Tracking script captura page_view em LP de teste | Instalar em pagina de teste, ver evento no Firebase |
| 2 | Webhook Hotmart registra venda de teste | Usar sandbox Hotmart ou postback manual |
| 3 | Leads Recentes mostra leads reais | Apos captura via tracking script |
| 4 | Heatmap mostra funil com dados | Apos 10+ eventos de teste |
| 5 | Meta Ads sync popula performance_metrics | Conectar conta real e verificar |

---

## Changelog

| Data | Acao | Status |
|------|------|--------|
| 2026-02-15 | Sprint planejado a partir de Issues #5, #11, #12, #13 (dependencia compartilhada) | CRIADO |
