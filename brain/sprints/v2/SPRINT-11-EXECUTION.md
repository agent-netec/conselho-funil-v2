# Sprint 11 — Forensics → Capacidade Interna: Plano de Execução

> **Auditoria prévia:** 2026-03-21
> **Estado:** 5 etapas sequenciais
> **Objetivo:** Converter Page Forensics de feature morta em capacidade interna acessível via 3 pontos de entrada

---

## Etapa 1 — Limpeza: deletar página e rotas mortas

### 1.1 Deletar página morta
- **Arquivo:** `src/app/(app)/strategy/autopsy/page.tsx` — DELETADO
- **Diretório:** `strategy/autopsy/` — removido (vazio)

### 1.2 Remover entry na nav
- **Arquivo:** `src/lib/constants.ts`
- **Ação:** Removida entrada `page-forensics` do sidebar

### 1.3 Remover tab na Intelligence
- **Arquivo:** `src/app/(app)/intelligence/page.tsx`
- **Ação:** Removida tab `autopsy` do NAV array

### 1.4 Verificar redirect
- **Arquivo:** `next.config.ts`
- **Estado:** Redirect já não existia (removido anteriormente)

### Preservado:
- `src/lib/intelligence/autopsy/engine.ts` — motor interno
- `src/types/autopsy.ts` — tipos
- `src/app/api/intelligence/autopsy/run/route.ts` — endpoint API
- `src/components/funnel-autopsy/AutopsyReportView.tsx` — usado pelo funnel detail

---

## Etapa 2 — Ponto de entrada 1: Spy Agent

### 2.1 Extrair diagnóstico do autopsy report
- **Arquivo:** `src/components/intelligence/discovery/spy-agent.tsx`
- **Mudança:** Novo interface `ConversionDiagnostic` + extração do `autopsyData.report.heuristics`

### 2.2 Nova tab "Diagnóstico" no Spy Agent
- Score geral com código de cor (verde/amarelo/vermelho)
- Grid 5 heurísticas (Hook, Story, Offer, Friction, Trust) com expert attribution
- Findings por categoria com ícones de status
- Recomendações ordenadas por prioridade

### 2.3 Custo: 0 créditos extras (incluso na análise do spy)

---

## Etapa 3 — Ponto de entrada 2: Launch Pad

### 3.1 Health check no ChecklistTab
- **Arquivo:** `src/app/(app)/campaigns/[id]/launch/page.tsx`
- Input de URL com botão "Diagnosticar"
- Resultado: score, 5 heurísticas, top 3 recomendações

### 3.2 Persistir no manifesto
- **Arquivo:** `src/types/campaign.ts`
- Novo campo `launch.healthCheck` com url, score, heuristics, recommendations, checkedAt

### 3.3 Custo: 2 créditos (deep analysis)

---

## Etapa 4 — Ponto de entrada 3: Chat

### 4.1 Detecção de URL na mensagem
- **Arquivo:** `src/app/api/chat/route.ts`
- Regex `https?://[^\s<>"']+` para detectar URLs
- Quick autopsy executado automaticamente

### 4.2 Injeção no contexto
- Diagnóstico formatado com scores, findings e recomendações
- Instrução para conselheiros comentarem com expertise individual

### 4.3 Custo: 0 extras (incluso no crédito do chat — 1 crédito normal)

---

## Etapa 5 — Créditos nos pontos de entrada

### 5.1 Autopsy API com cobrança por depth
- **Arquivo:** `src/app/api/intelligence/autopsy/run/route.ts`
- `depth: 'quick'` → 0 créditos (chamador cobra)
- `depth: 'deep'` → 2 créditos via `consumeCredits(userId, 2, 'health_check')`

### Resumo de custos:
| Ponto de Entrada | Créditos | Motivo |
|---|---|---|
| Spy Agent | 0 extra | Quick, incluso nos 2 do spy |
| Launch Pad | 2 | Deep analysis dedicada |
| Chat | 0 extra | Quick, incluso no 1 do chat |

---

## Checklist de Execução

- [x] **Etapa 1** — Limpeza (2026-03-21) ✅
- [x] **Etapa 2** — Spy Agent (2026-03-21) ✅
- [x] **Etapa 3** — Launch Pad (2026-03-21) ✅
- [x] **Etapa 4** — Chat (2026-03-21) ✅
- [x] **Etapa 5** — Créditos (2026-03-21) ✅
- [x] **Build final** — Todos os 5 builds passaram limpos ✅

---

## Arquivos Envolvidos (referência rápida)

| Etapa | Arquivo | Ação |
|-------|---------|------|
| 1.1 | `strategy/autopsy/page.tsx` | DELETADO |
| 1.2 | `lib/constants.ts` | Edit (remover entry) |
| 1.3 | `intelligence/page.tsx` | Edit (remover tab) |
| 2.x | `spy-agent.tsx` | Edit (tab Diagnóstico) |
| 3.1 | `campaigns/[id]/launch/page.tsx` | Edit (health check) |
| 3.2 | `types/campaign.ts` | Edit (healthCheck type) |
| 4.x | `api/chat/route.ts` | Edit (URL detection + autopsy) |
| 5.1 | `api/intelligence/autopsy/run/route.ts` | Edit (credit charging) |
