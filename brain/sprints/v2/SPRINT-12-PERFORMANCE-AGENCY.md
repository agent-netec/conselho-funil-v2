# Sprint 12 — Performance / Agency Features

> **Status:** 🟡 QUASE COMPLETO (2026-03-21) — Código 100%. Pendente: 12.1 (setup manual Meta/Google). Ver SPRINT-12-EXECUTION.md
> **Máxima:** Progressão Contínua — Zero Becos Sem Saída
> **Bloqueado por:** Sprint 02 (tier enforcement), Sprint 08 (dashboard unificada)
> **Ref doc master:** Seção Performance (auditoria)

---

## Contexto

Performance (War Room) é o diferencial do tier Agency (R$997). Já funciona tecnicamente: busca métricas reais do Meta/Google, cache inteligente, segmentos, AI Advisor. Mas depende de setup externo (OAuth, apps Meta/Google) e tem revenue simulado. Este sprint foca em tornar viável para produção.

**IMPORTANTE:** A Etapa 1 (setup da plataforma) não é código — é configuração manual nos dashboards do Meta e Google. Deve ser feita pelo owner.

---

## Tarefa 12.1 — Etapa 1: Setup da Plataforma (Owner faz)

**Ref:** Seção Performance — Etapa 1

### Checklist completo em `brain/oauth-setup-checklist.md`:

**Meta:**
- [ ] Criar app Meta com produto "Marketing API"
- [ ] Configurar "Facebook Login for Business"
- [ ] Criar `config_id` com permissões: `ads_read`, `business_management`, `instagram_basic`, `pages_show_list`
- [ ] Colocar app em modo "Live" (requer App Review — pode levar dias/semanas)
- [ ] Registrar redirect URI: `https://app.mkthoney.com/api/auth/meta/callback`

**Google:**
- [ ] Criar conta MCC no Google Ads → obter Developer Token
- [ ] Publicar OAuth consent screen (sair de "Testing")
- [ ] Service Account email configurada

**Env vars no Vercel:**
- [ ] `META_APP_ID`, `META_APP_SECRET`, `META_CONFIG_ID`
- [ ] `GOOGLE_ADS_DEVELOPER_TOKEN`, `GOOGLE_ADS_CLIENT_ID`, `GOOGLE_ADS_CLIENT_SECRET`

### Critérios de aceitação:
- [ ] Apps Meta e Google configurados e em produção
- [ ] Env vars no Vercel
- [ ] OAuth flow funciona end-to-end (testar com conta de teste)

---

## Tarefa 12.2 — Revenue real via pixel (Opção A)

**Ref:** Seção Performance — Etapa 3, Opção A

### Hoje:
```typescript
// Revenue simulado:
revenue = conversions * 100; // FAKE
```

### Depois:
```typescript
// Meta: usar campo action_values
const metaRevenue = insights.action_values?.find(a => a.action_type === 'offsite_conversion.fb_pixel_purchase')?.value || 0;

// Google: usar campo conversion_value
const googleRevenue = campaignMetrics.metrics.conversions_value || 0;

// Fallback para quem não tem pixel com valor:
const revenue = (metaRevenue || 0) + (googleRevenue || 0);
if (revenue === 0 && conversions > 0) {
  // Mostrar "Revenue indisponível — configure o valor do pixel"
  // Oferecer input manual como fallback
}
```

### Mudança ~10 linhas nos adapters.

### Critérios de aceitação:
- [ ] ROAS calculado com revenue real do pixel
- [ ] Fallback quando pixel não tem valor
- [ ] Mensagem clara: "Configure o pixel com valor de compra para ROAS real"
- [ ] Input manual como fallback

---

## Tarefa 12.3 — AI Advisor: fix bugs

**Ref:** Seções 16.10, 16.11

### Fixes:
1. **Debounce + cache:** Gerar insight 1x, refresh manual
2. **Remover `verifyAdminRole`:** Todos os usuários Agency veem insights
3. **Data em pt-BR:** `toLocaleDateString('pt-BR')`

### Critérios de aceitação:
- [ ] 1 chamada ao Gemini por carregamento (não 3)
- [ ] Insights para todos os Agency (não só admin)
- [ ] Datas em português

---

## Tarefa 12.4 — Anomalias reais (desativar mock)

### Hoje:
SentryEngine retorna dados mock. Botão "Acknowledge" = `console.log`.

### Fix:
Se não há dados reais para anomalias, NÃO mostrar seção. Remover dados mock.
Implementar acknowledge real quando anomalias forem reais:

```typescript
// Acknowledge persiste no Firestore:
await updateDoc(anomalyRef, { acknowledged: true, acknowledgedAt: serverTimestamp() });
```

### Critérios de aceitação:
- [ ] Zero dados mock de anomalias
- [ ] Seção oculta quando não há anomalias
- [ ] Acknowledge persiste quando implementado

---

## Tarefa 12.5 — Performance integrada no Dashboard

**Ref:** Seção 16.4

### Com Sprint 08 (dashboard unificada) + Sprint 12:

Quando usuário Agency tem ads conectados:
```tsx
// No dashboard, estado "has_ads_connected":
<AdsMetricsInline
  roas={metrics.roas}
  spend={metrics.spend}
  cpa={metrics.cpa}
  revenue={metrics.revenue}
/>
<AnomalyAlert anomalies={anomalies} />
<AIInsightCard insight={latestInsight} />
<Link href="/performance">Ver War Room completa →</Link>
```

### `/performance` vira "modo detalhado" (drill-down), não página separada do dashboard.

### Critérios de aceitação:
- [ ] Métricas inline no dashboard para Agency
- [ ] Link para War Room completa
- [ ] Dashboard não mostra seção de ads para quem não tem

---

## Tarefa 12.6 — Cross-channel linkado

**Ref:** Seção 16.12

### Hoje: `/performance/cross-channel` existe mas não é linkada.

### Fix:
- Tab "Cross-channel" dentro da Performance
- Mostra Meta + Google consolidados
- Se só 1 provider → mostrar com nota "Conecte [outro] para visão consolidada"

### Critérios de aceitação:
- [ ] Cross-channel acessível via tab
- [ ] Dados consolidados quando ambos conectados
- [ ] Nota quando só 1 provider

---

## Check de Progressão Contínua

```
Agency conecta Meta Ads
  ↓ Dashboard mostra ROAS, spend, CPA inline
  ↓ CELEBRAÇÃO: "Seus dados estão conectados!"
  ↓ CONTEXTO: "Revenue real baseado no pixel"
  ↓ PRÓXIMO PASSO: "Ver War Room completa →"
  ↓ War Room: Métricas + Segmentos + AI Advisor
  ↓ PRÓXIMO PASSO: "Anomalia detectada: CPA subiu 40% →"
  ↓ Click → detalhes + sugestão de ação
  ↓ "Criar campanha de otimização →"

Revenue indisponível
  ↓ Mensagem: "Configure o pixel com valor de compra"
  ↓ Fallback: input manual de revenue
  ↓ NUNCA tela vazia — sempre guia para ação
```
