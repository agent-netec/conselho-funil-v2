# Plano: Calendário Editorial v2

**Status:** PLANEJADO — aguardando conclusão do QA Sprint I.
**Data:** 2026-02-16

---

## Estado Atual (Diagnóstico)

### O que está funcionando
- **CRUD Firestore** — `brands/{brandId}/content_calendar`, criar/ler/atualizar/deletar
- **Calendário visual** — Semanal e mensal com `CalendarView` component
- **Drag-and-drop** — HTML5 nativo com reorder via writeBatch atômico (DT-05)
- **Range query** — Firestore sem composite index (campo único, DT-04)
- **Geração de conteúdo** — `/api/content/generate` via Gemini + brand voice, com opção de inserir no calendário
- **Auth/Guard** — `requireBrandAccess()` em todas as rotas
- **Modal de criação** — Título, formato (post/story/carousel/reel), plataforma, data

### O que está quebrado
- **Erro 500 ao criar post** — Error handling incorreto: `requireBrandAccess()` lança `ApiError` mas o catch espera `Response`. Qualquer erro de auth retorna 500 genérico em vez de 401/403
  - **Arquivo:** `app/src/app/api/content/calendar/route.ts` (POST handler, linha 49-75)
  - **Fix:** Extrair `requireBrandAccess` para try/catch separado com `handleSecurityError()`, como em `/api/social/hooks/route.ts`

### O que é mock vs real
| Dado | Tipo |
|------|------|
| Items do calendário | **REAL** — Firestore |
| Geração de conteúdo | **REAL** — Gemini AI |
| Publicação nas redes | **NÃO EXISTE** |
| Métricas de posts | **NÃO EXISTE** |

### Conexões atuais vs ideais
| Módulo | Status | Ideal |
|--------|--------|-------|
| Brand context | Conectado | Conectado |
| Auth/Guard | Conectado (com bug) | Conectado (fix error handling) |
| Gemini AI | Conectado (generate) | Conectado + templates |
| Social Hooks | **Desconectado** | Hooks aprovados → posts no calendário |
| Campaign Pipeline | **Desconectado** | Campanha gera calendário automaticamente |
| Approval Engine | Backend existe, UI não | Workflow visual de aprovação |
| Publicação real | **Não existe** | OAuth → postar via API (Sprint L) |
| Analytics | **Não existe** | Performance dos posts publicados |

---

## Fase 1 — Fix Bug + Quick Wins

### 1.1 Fix error handling 500
- **Arquivo:** `app/src/app/api/content/calendar/route.ts`
- **Todos os handlers** (POST, PUT, DELETE): Extrair `requireBrandAccess` para try/catch separado
- **Padrão correto** (copiar de social/hooks):
```typescript
try {
  await requireBrandAccess(req, brandId);
} catch (error) {
  return handleSecurityError(error);
}
```
- **Aplicar também em:** `reorder/route.ts`, `approve/route.ts`, `generate/route.ts`

### 1.2 Melhorar modal de criação
- Adicionar campo de conteúdo/descrição
- Adicionar campo de horário (não só data)
- Preview do post antes de salvar
- Status visual: draft → scheduled → published

### 1.3 Integrar Approval Engine na UI
- **Backend existe:** `app/src/lib/content/approval-engine.ts` + `app/src/app/api/content/calendar/approve/route.ts`
- **Adicionar na UI:** Botão "Aprovar" / "Rejeitar" em cada item do calendário
- Status visual: draft (cinza) → approved (verde) → published (azul)

### Créditos: 0

---

## Fase 2 — Integração com Social & Campaign

### 2.1 Social Hooks → Calendário
- Quando hooks são aprovados no Conselho Social, criar items no calendário automaticamente
- **Trigger:** Botão "Agendar no Calendário" no hook-generator após scorecard
- **Dados:** hook.content → title, hook.platform → platform, sugerir data baseada em frequência ideal

### 2.2 Campaign Pipeline → Calendário
- Quando etapa Social da Linha de Ouro é aprovada, criar batch de items no calendário
- **Arquivo:** `app/src/app/funnels/[id]/social/page.tsx` (handleApproveHooks)
- Cada hook aprovado → 1 item no calendário com `metadata.generatedBy: 'campaign'`

### 2.3 Geração em batch
- "Gerar semana inteira" — IA cria 5-7 posts para a semana baseado em pilares de conteúdo
- Usa brand context + RAG (heurísticas sociais) + conselheiros
- Reutilizar `/api/content/generate` com loop

### Créditos: 1 por geração individual, 3 por batch semanal

---

## Fase 3 — Templates & Recorrência

### 3.1 Templates de conteúdo
- Salvar posts aprovados como templates reutilizáveis
- **Collection:** `brands/{brandId}/content_templates`
- Campos: title, format, platform, contentTemplate (com placeholders), tags
- UI: Botão "Salvar como template" em posts aprovados

### 3.2 Posts recorrentes
- Definir frequência: diário, semanal (dia X), mensal
- Auto-criar items no calendário com base na recorrência
- Cron job: `/api/cron/content-recurrence` (semanal)

### 3.3 Pilares de conteúdo
- Definir 3-5 temas recorrentes por marca
- **Collection:** `brands/{brandId}/content_pillars`
- Distribuir automaticamente pelos dias da semana
- Informar geração de conteúdo (quais temas cobrir)

---

## Fase 4 — Publicação Real (Sprint L — depende OAuth)

### 4.1 Instagram Graph API
- Postar imagens, carrosséis, reels via Content Publishing API
- Agendar publicação (Instagram suporta agendamento nativo)
- Atualizar status: scheduled → published

### 4.2 LinkedIn API
- Postar artigos, imagens, vídeos via Share API
- Atualizar status no calendário

### 4.3 X API v2
- Postar tweets, threads
- Atualizar status

### 4.4 Status sync
- Webhook ou polling para confirmar publicação
- Atualizar item: `status: 'published'`, `publishedAt: Timestamp`
- Notificação se falhar

---

## Fase 5 — Analytics & Feedback

### 5.1 Métricas por post
- Após publicação, coletar: impressões, engajamento, cliques, saves, shares
- **Collection:** `brands/{brandId}/content_calendar/{itemId}/metrics`
- Cron: `/api/cron/content-metrics` (diário, por 7 dias após publicação)

### 5.2 Dashboard de performance
- Quais formatos performam melhor (reel vs carousel vs post)
- Melhores horários/dias
- Engajamento médio por plataforma
- ROI do conteúdo (se conectado a attribution)

### 5.3 Feedback loop
- Posts com alta performance → salvar como template automático
- Posts com baixa performance → flag para revisão
- Alimentar RAG com learnings (`docType: 'social_case_study'`)

---

## Arquivos Críticos

| Arquivo | Fase | Ação |
|---------|------|------|
| `app/src/app/api/content/calendar/route.ts` | 1 | Fix error handling (500 bug) |
| `app/src/app/api/content/calendar/approve/route.ts` | 1 | Fix error handling |
| `app/src/app/api/content/calendar/reorder/route.ts` | 1 | Fix error handling |
| `app/src/app/api/content/generate/route.ts` | 1,2 | Fix error handling + batch generation |
| `app/src/app/content/calendar/page.tsx` | 1,2 | Melhorar modal + approval UI + social integration |
| `app/src/components/content/calendar-view.tsx` | 1 | Status visual (draft/approved/published) |
| `app/src/components/social/hook-generator.tsx` | 2 | Botão "Agendar no Calendário" |
| `app/src/app/funnels/[id]/social/page.tsx` | 2 | Auto-criar items ao aprovar hooks |

## Arquivos Novos

| Arquivo | Fase |
|---------|------|
| `app/src/app/api/cron/content-recurrence/route.ts` | 3 |
| `app/src/app/api/cron/content-metrics/route.ts` | 5 |

## Dependências

```
Sprint I (QA) → Fix 500 bug (Fase 1, pode ser feito já)
             → Fase 2 (após Social v2 Sprint J)
             → Fase 3 (independente)
Sprint L (OAuth) → Fases 4-5 (publicação real + analytics)
```

**Fase 1 pode ser feita agora** — é fix de bug + melhorias de UI.
**Fase 2 depende do Social v2** (Sprint J) para ter hooks para integrar.
**Fases 4-5 dependem do Sprint L** (OAuth).
