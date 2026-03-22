# Sprint 10 — Launch Pad: Plano de Execução

> **Auditoria prévia:** 2026-03-21
> **Estado:** 5 etapas sequenciais
> **Objetivo:** Kit de Campanha + Checklist + Diário + Iteração + Feedback Loop

---

## Etapa 1 — Fundação (Rota + Tipo + Stepper + Layout)

### 1.1 Tipo `launch` no CampaignContext
- **Arquivo:** `app/src/types/campaign.ts`
- **Campos:** checklist[], diary[], feedback, publishedAt

### 1.2 Stage "Launch" nos steppers
- **Arquivos:** `campaign-stepper.tsx` + `campaign-stage-stepper.tsx`
- **Ação:** Adicionado stage com ícone Rocket/Zap + rota `/campaigns/[id]/launch`

### 1.3 Rota `/campaigns/[id]/launch`
- **Arquivo:** Criado `app/src/app/(app)/campaigns/[id]/launch/page.tsx`
- **Layout:** 5 tabs (Kit, Checklist, Diário, Iteração, Feedback)
- **Tab Kit:** Grid 3x2 com 6 cards (PDF, Copy, Social, Design, Mídia, ZIP)

### 1.4 Dashboard atualizado
- **Arquivo:** `app/src/app/(app)/campaigns/[id]/page.tsx`
- **Mudanças:** Placeholder → botão dourado, banner → link real, stage logic → launch

---

## Etapa 2 — Kit de Campanha (10.1)

### 2.1 Instalar jszip
### 2.2 Export CSV de Copy (headlines, scripts, CTAs)
### 2.3 Export CSV de Social (hooks, calendário)
### 2.4 Download de Design assets
### 2.5 Plano de Mídia (PDF com dados de ads)
### 2.6 Kit Completo (ZIP com tudo)

---

## Etapa 3 — Checklist de Lançamento (10.2)

### 3.1 Gerar checklist com dados reais da campanha
### 3.2 Persistir checklist no Firestore (campaigns/{id})
### 3.3 Items marcáveis com links/ações úteis

---

## Etapa 4 — Diário + Iteração (10.3 + 10.4)

### 4.1 Input de métricas semanais (spend, clicks, impressions, conversions)
### 4.2 CPA, CTR, ROAS calculados automaticamente
### 4.3 AI Insight via Gemini (1 crédito)
### 4.4 3 caminhos pós-lançamento (variação, escala, v2)

---

## Etapa 5 — Feedback Loop (10.5)

### 5.1 Rating (sucesso/fracasso/mediocre)
### 5.2 Campo de texto opcional
### 5.3 Salvar Firestore + indexar RAG

---

## Checklist de Execução

- [x] **Etapa 1** — Fundação: rota, tipo, stepper, layout (2026-03-21) ✅
- [x] **Etapa 2** — Kit de Campanha (2026-03-21) ✅
- [x] **Etapa 3** — Checklist de Lançamento (2026-03-21) ✅
- [x] **Etapa 4** — Diário + Iteração (2026-03-21) ✅
- [x] **Etapa 5** — Feedback Loop (2026-03-21) ✅
- [x] **Build final** — Todos os 5 builds passaram limpos ✅

---

## Arquivos Envolvidos (referência rápida)

| Etapa | Arquivo | Ação |
|-------|---------|------|
| 1.1 | `types/campaign.ts` | Edit (add launch type) |
| 1.2 | `campaign-stepper.tsx` | Edit (add Launch stage) |
| 1.2 | `campaign-stage-stepper.tsx` | Edit (add Launch tab) |
| 1.3 | `campaigns/[id]/launch/page.tsx` | Criar |
| 1.4 | `campaigns/[id]/page.tsx` | Edit (placeholder → link, banner, stage) |
| 2.x | `campaigns/[id]/launch/page.tsx` | Edit (Kit tab implementation) |
| 3.x | `campaigns/[id]/launch/page.tsx` | Edit (Checklist tab) |
| 4.x | `campaigns/[id]/launch/page.tsx` | Edit (Diary + Iterate tabs) |
| 5.x | `campaigns/[id]/launch/page.tsx` | Edit (Feedback tab) |
