# Sprints v2 — Reverse Trial + Reestruturação Completa

> Gerado a partir de: `brain/PLANO-REVERSE-TRIAL-TIERS.md` (seções 0-16)
> Data: 2026-03-19
> Máxima: **Progressão Contínua — Zero Becos Sem Saída**
> Princípio: **UX First — Max 2 cliques, nunca virar painel dev do Meta**

---

## Mapa de Dependências

```
Sprint 00 (Pré-lançamento) ──────────────────────┐
  │                                                │
  ├──> Sprint 01 (Social + Calendário)             │
  │      └──> Sprint 02 (Tier + Créditos)          │
  │                                                │
  ├──> Sprint 03 (Brands P0) ─────────────────────>│
  │                                                │
  ├──> Sprint 04 (Campaigns Foundation) ──────────>│
  │      │                                         │
  │      ├──> Sprint 06 (Design Consolidation)     │
  │      └──> Sprint 10 (Launch Pad)               │
  │                                                │
  ├──> Sprint 05 (Chat Transformation)             │
  │                                                │
  ├──> Sprint 07 (Brand Intelligence Layer) ──────>│
  │      │                                         │
  │      ├──> Sprint 09 (Discovery Upgrades)       │
  │      └──> Sprint 11 (Forensics → Capacidade)   │
  │                                                │
  ├──> Sprint 08 (Dashboard + Onboarding)          │
  │                                                │
  └──> Sprint 12 (Performance / Agency)            │
```

## Status por Sprint

| Sprint | Nome | Status | Bloqueado por | Seções do doc | Notas |
|--------|------|--------|---------------|---------------|-------|
| **00** | Pré-lançamento (fundação técnica) | 🟢 COMPLETO | — | 1, 4, 5, 6.1, 6.6 | |
| **01** | Social completo + Calendário | 🟢 COMPLETO | Sprint 00 | 6.2, Social, Calendar | |
| **02** | Tier enforcement + Créditos | 🟢 COMPLETO | Sprint 00 | 4.5, 4.6, 6.3 | |
| **03** | Brands P0 (maior impacto UX) | 🟢 COMPLETO | — | Brands P0 | |
| **04** | Campaigns Foundation | 🟢 COMPLETO | Sprint 00 | 12.1-12.9 | |
| **05** | Chat Transformation | 🟢 COMPLETO | Sprint 04 | 14.1-14.12 | |
| **06** | Design Consolidation | 🟢 COMPLETO | Sprint 04 | 13.0-13.12 | 7 tasks, commit `feat(sprint-06)` |
| **07** | Brand Intelligence Layer | 🟢 COMPLETO | Sprint 03 | 10 | Auditado e corrigido |
| **08** | Dashboard + Onboarding | 🟢 COMPLETO | Sprint 03 | 16.1-16.14 | Auditado, 4 fixes aplicados (SPRINT-08-FIXES.md) |
| **09** | Discovery Upgrades | 🟢 COMPLETO | Sprint 07 | Discovery | 5 etapas (SPRINT-09-EXECUTION.md) |
| **10** | Launch Pad | 🟢 COMPLETO | Sprint 04 | 12.10 | Auditado + 5 fixes (SPRINT-10-EXECUTION.md) |
| **11** | Forensics → Capacidade | 🟢 COMPLETO | Sprint 07 | 15.1-15.13 | 5 etapas (SPRINT-11-EXECUTION.md) |
| **12** | Performance / Agency | 🟡 QUASE COMPLETO | Sprint 02 | Performance | Código 100%. Pendente: 12.1 (setup manual Meta/Google pelo owner) |
| **13** | Funnel Intelligence | 🟢 COMPLETO | Sprint 07 | Seção 11 (Funis) | 6 tarefas (SPRINT-13-FUNNEL-INTELLIGENCE.md) |

## Resumo Final

**13/14 sprints completos.** Único pendente: Sprint 12.1 (setup manual Meta/Google pelo owner).

### Execution Docs disponíveis:
- `SPRINT-08-FIXES.md` — 4 correções pós-auditoria
- `SPRINT-09-EXECUTION.md` — 5 etapas Discovery
- `SPRINT-10-EXECUTION.md` — 7 etapas Launch Pad + 5 fixes
- `SPRINT-11-EXECUTION.md` — 5 etapas Forensics
- `SPRINT-12-EXECUTION.md` — 6 etapas Performance/Agency
- `SPRINT-13-FUNNEL-INTELLIGENCE.md` — 6 tarefas

### Backlog (Seção 9 — Features auditadas com gaps pendentes):
- `BACKLOG-SECAO-9-GAPS.md` — 7 gaps priorizados (Social completo, Predict interconexão, Intelligence Overview, Calendário export, Offer Lab UX, Vault pipeline, Personalization flow)
- Sugestão de Sprints 14-18 para resolver progressivamente
- **Nenhum é blocker para lançamento**

## Legenda

- 🔴 A FAZER | 🟡 EM PROGRESSO / QUASE COMPLETO | 🟢 COMPLETO
- Cada tarefa referencia seção do documento master para rastreabilidade
