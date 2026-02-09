# Allowed Context: Sprint 26 — Technical Debt Cleanup
**Lane:** cross-cutting
**Preparado por:** Leticia (SM)
**Data:** 06/02/2026

---

## 📂 Contexto Global

### Leitura Obrigatória
- `_netecmt/packs/stories/sprint-26-tech-debt-cleanup/stories.md` — Stories e ACs
- `_netecmt/packs/stories/sprint-26-tech-debt-cleanup/error-inventory.md` — Inventário detalhado

### Referência de Tipos
- `app/src/types/intelligence.ts`
- `app/src/types/database.ts`
- `app/src/types/creative-ads.ts`
- `app/src/types/prediction.ts`
- `app/src/types/text-analysis.ts`
- `app/src/types/competitors.ts`
- `app/src/types/vault.ts`
- `app/src/types/social-inbox.ts`
- `app/src/types/personalization.ts`
- `app/src/types/offer.ts`
- `app/src/types/reporting.ts`

---

## Epic 1: Tier 1 — Runtime Blockers (S26-ST-01 a ST-03)

### Escrita (Modificar)
- `app/src/app/intelligence/creative/page.tsx`
- `app/src/lib/hooks/use-attribution-data.ts`
- `app/src/lib/hooks/use-intelligence.ts`
- `app/src/app/api/intelligence/journey/[leadId]/route.ts`
- Módulos com imports quebrados (ver stories.md ST-02)

### Leitura (Contexto)
- `app/src/lib/hooks/use-active-brand.ts` — Verificar return type
- `app/src/types/database.ts` — Interface Brand

---

## Epic 2: Tier 2 — Dead Code & Tests (S26-ST-04 a ST-07)

### Escrita (Modificar)
- Todos os `__tests__/**` listados nas stories
- `app/src/lib/agents/engagement/brand-voice-translator.ts`
- `app/src/lib/agents/publisher/curation-engine.ts`
- `app/src/lib/intelligence/attribution/**`
- `app/src/lib/intelligence/journey/bridge.ts`
- `app/src/lib/intelligence/predictive/engine.ts`
- `app/src/lib/reporting/engine.ts`
- Módulos legados listados em ST-07

### Leitura (Contexto)
- Tipos atuais para atualizar mocks
- Interfaces de módulos para verificar breaking changes

---

## Epic 3: Tier 3 — Cosmetic (S26-ST-08 a ST-11)

### Escrita (Modificar)
- `app/src/app/shared/reports/[token]/page.tsx`
- `app/src/components/chat/counselor-multi-selector.tsx`
- `app/src/components/chat/party-mode/counselor-selector.tsx`
- `app/src/components/layout/sidebar.tsx`
- `app/src/components/funnel-autopsy/AutopsyReportView.tsx`
- `app/src/components/intelligence/keyword-management.tsx`
- `app/src/components/vault/vault-explorer.tsx`
- Demais componentes listados em ST-08 a ST-11

---

## 🚫 Proibições Globais (Sprint 26)

### Proibições Originais (P1–P6)

1. **NUNCA** alterar lógica de negócio — apenas corrigir tipagem e imports
2. **NUNCA** remover funcionalidade — apenas stub ou corrigir tipos
3. **NUNCA** alterar `contract-map.yaml`
4. **NUNCA** alterar tipos da Sprint 25 (`prediction.ts`, `creative-ads.ts`, `text-analysis.ts`)
5. **NUNCA** introduzir novos erros — rodar `tsc --noEmit` após cada Epic
6. Se um módulo é código morto: marcar com `// TODO: Sprint XX — módulo não implementado` em vez de deletar

### Proibições Adicionais do Architecture Review (P7–P11)

> Adicionadas após o Architecture Review do Athos (06/02/2026).
> Ref: `_netecmt/solutioning/architecture/arch-sprint-26-tech-debt-cleanup.md` — Seção 7.2

7. **NUNCA** alterar exports existentes em type files — apenas **ADICIONAR** novos. Justificativa: `types/performance.ts` e `types/attribution.ts` têm interfaces contratuais. Adicionar aliases é seguro; alterar assinaturas existentes quebra contratos.
8. **NUNCA** criar stubs com `any` — usar `unknown` com index signature (`[key: string]: unknown`). Justificativa: manter strict mode efetivo mesmo em stubs temporários.
9. **NUNCA** converter paths relativos para `@/` aliases em módulos dead code que não serão tocados por outros fixes. Justificativa: reduz superfície de mudança desnecessária; se é dead code, stub mínimo resolve.
10. **NUNCA** alterar `types/social-inbox.ts`. Justificativa: usado ativamente por módulos do Social Command Center que funcionam corretamente.
11. **Para ST-07 especificamente:** commitar por sub-módulo e rodar `tsc --noEmit` após cada commit. Justificativa: maior story da sprint (61 erros em 25+ arquivos) — granularidade protege rollback.

---
*Allowed Context preparado por Leticia (SM) — NETECMT v2.0*
*Atualizado com proibições do Architecture Review (Athos) — 06/02/2026*
*Sprint 26: Technical Debt Cleanup | 06/02/2026*
