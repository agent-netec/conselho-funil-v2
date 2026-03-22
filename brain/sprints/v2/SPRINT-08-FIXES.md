# Sprint 08 — Correções Pós-Auditoria

> **Auditoria realizada em:** 2026-03-21
> **Média geral:** 84% — bom mas não perfeito
> **Objetivo:** Elevar cada task para 95%+

---

## Etapa 1 — Bug Crítico + Código Morto (Risco zero, impacto imediato)

### 1.1 Fix null pointer no `resolveDashboardState`
- **Arquivo:** `app/src/app/(app)/home/page.tsx`
- **Problema:** `topCampaign.ads` acessado sem null check quando `activeCampaigns[0]` pode ser `undefined`
- **Fix:** Adicionar guard `if (!topCampaign)` antes de acessar propriedades
- **Severidade:** CRÍTICO — crash em runtime

### 1.2 Deletar `OnboardingTransition` (código morto)
- **Arquivo:** `app/src/components/onboarding/onboarding-transition.tsx` — DELETAR
- **Arquivo:** `app/src/components/onboarding/index.ts` — remover export
- **Problema:** Componente de transição fake não é usado em nenhum lugar
- **Severidade:** BAIXA — limpeza

### 1.3 Adicionar `verdict_refresh` ao `CREDIT_COSTS`
- **Arquivo:** `app/src/lib/firebase/firestore-server.ts`
- **Problema:** `consumeCredits(userId, 1, 'verdict_refresh')` é chamado mas a key não existe no objeto `CREDIT_COSTS`
- **Fix:** Adicionar `verdict_refresh: 1` ao Record
- **Severidade:** MÉDIA — pode causar erro silencioso na cobrança

---

## Etapa 2 — Dashboard `has-campaign` (Task 08.4)

### 2.1 CTAs específicos no estado `has-campaign`
- **Arquivo:** `app/src/app/(app)/home/page.tsx` — componente `HasCampaignBody`
- **Problema:** Usa `<QuickActions />` genérico em vez de CTAs da campanha ativa
- **Fix:** Substituir por `NextActionHeader` + `NextActionCard` com ações como:
  - "Continuar campanha" → próximo estágio incompleto da Golden Thread
  - "Ver progresso" → `/campaigns/{id}`
- **Referência:** Ver como `HasFunnelsBody` e `HasAdsBody` implementam os CTAs

### 2.2 Performance inline (opcional — avaliar com usuário)
- **Contexto:** A spec pede "performance inline, não página separada"
- **Realidade:** A War Room (`/performance`) é um produto completo (22KB)
- **Opções:**
  - A) Manter War Room + adicionar KPI strip resumido no dashboard `has-ads`
  - B) Mover War Room inteira para dentro do dashboard (complexo, pode piorar UX)
- **Recomendação:** Opção A — já temos KPI strip, só precisa de link "Ver análise completa →"
- **Status:** DECISÃO PENDENTE — perguntar ao usuário

---

## Etapa 3 — Banners de Progressão Faltantes (Task 08.7)

### 3.1 Deep Research → Campanha
- **Arquivo:** `app/src/app/(app)/intelligence/research/page.tsx`
- **Problema:** Após gerar dossiê, tela termina em silêncio
- **Fix:** Adicionar `CompletionBanner` após resultado:
  - Title: "Dossiê completo!"
  - CTA: "Criar campanha com esses insights →" → `/campaigns`

### 3.2 Offer Lab → Campanha
- **Arquivo:** `app/src/components/intelligence/offer-lab/offer-lab-wizard.tsx`
- **Problema:** Sem CTA para criar/voltar à campanha quando standalone
- **Fix:** Adicionar `CompletionBanner` no final do wizard:
  - Title: "Oferta avaliada!"
  - CTA: "Criar campanha com essa oferta →" → `/campaigns`
  - Condição: Só mostrar quando NÃO veio de uma campanha (sem `campaignId`)

### 3.3 Design → Launch Pad
- **Arquivo:** Verificar onde design é aprovado (dentro de `campaigns/[id]/page.tsx` ou wizard separado)
- **Problema:** Após design aprovado, sem CTA para Launch Pad
- **Fix:** Adicionar `CompletionBanner`:
  - Title: "Design aprovado!"
  - CTA: "Revisar no Launch Pad →" → seção de launch na campanha

---

## Etapa 4 — Polimento (Nice-to-have)

### 4.1 Remover `verifyAdminRole` do anomaly-check
- **Arquivo:** `app/src/app/api/reporting/anomaly-check/route.ts`
- **Problema:** Ainda exige admin role, mas deveria usar `requireBrandAccess`
- **Fix:** Substituir `verifyAdminRole(request)` por `requireBrandAccess(req, brandId)`
- **Nota:** Verificar se esta rota é chamada de algum lugar antes de alterar

### 4.2 Foto/nome do conselheiro no Verdict Fullscreen
- **Arquivo:** `app/src/components/onboarding/verdict-fullscreen.tsx`
- **Problema:** Mostra logo MKTHONEY em vez de conselheiro com avatar
- **Fix:** Adicionar conselheiro "Estratégico" com avatar estático no header do verdict
- **Nota:** Depende de ter assets de conselheiros — verificar se já existem

---

## Checklist de Execução

- [x] **Etapa 1** — Bug + limpeza (2026-03-21) ✅
- [x] **Etapa 2** — Dashboard has-campaign CTAs (2026-03-21) ✅
- [x] **Etapa 3** — Banners faltantes: Research, Offer Lab, Design+Ads (2026-03-21) ✅
- [x] **Etapa 4** — Polimento: verifyAuthenticated, David Ogilvy no verdict (2026-03-21) ✅
- [x] **Build final** — Todos os 4 builds passaram limpos ✅
- [ ] **Smoke test** — verificar cada estado do dashboard

---

## Arquivos Envolvidos (referência rápida)

| Etapa | Arquivo | Ação |
|-------|---------|------|
| 1.1 | `home/page.tsx` | Edit (null guard) |
| 1.2 | `onboarding-transition.tsx` | Delete |
| 1.2 | `onboarding/index.ts` | Edit (remove export) |
| 1.3 | `firestore-server.ts` | Edit (add credit key) |
| 2.1 | `home/page.tsx` | Edit (HasCampaignBody CTAs) |
| 3.1 | `intelligence/research/page.tsx` | Edit (add banner) |
| 3.2 | `offer-lab-wizard.tsx` | Edit (add banner) |
| 3.3 | `campaigns/[id]/page.tsx` ou design wizard | Edit (add banner) |
| 4.1 | `reporting/anomaly-check/route.ts` | Edit (auth guard) |
| 4.2 | `verdict-fullscreen.tsx` | Edit (add counselor) |
