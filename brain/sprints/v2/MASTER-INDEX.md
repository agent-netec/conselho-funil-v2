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

| Sprint | Nome | Status | Bloqueado por | Seções do doc |
|--------|------|--------|---------------|---------------|
| **00** | Pré-lançamento (fundação técnica) | 🟢 COMPLETO | — | 1, 4, 5, 6.1, 6.6 |
| **01** | Social completo + Calendário | 🟢 COMPLETO | Sprint 00 | 6.2, Social, Calendar |
| **02** | Tier enforcement + Créditos | 🟢 COMPLETO | Sprint 00 | 4.5, 4.6, 6.3 |
| **03** | Brands P0 (maior impacto UX) | 🟢 COMPLETO | — | Brands P0 |
| **04** | Campaigns Foundation | 🟢 COMPLETO | Sprint 00 | 12.1-12.9 |
| **05** | Chat Transformation | 🟢 COMPLETO | Sprint 04 | 14.1-14.12 |
| **06** | Design Consolidation | 🔴 A FAZER | Sprint 04 | 13.0-13.12 |
| **07** | Brand Intelligence Layer | 🟢 COMPLETO | Sprint 03 | 10 |
| **08** | Dashboard + Onboarding | 🔴 A FAZER | Sprint 03 | 16.1-16.14 |
| **09** | Discovery Upgrades | 🔴 A FAZER | Sprint 07 | Discovery |
| **10** | Launch Pad | 🔴 A FAZER | Sprint 04 | 12.10 |
| **11** | Forensics → Capacidade | 🔴 A FAZER | Sprint 07 | 15.1-15.13 |
| **12** | Performance / Agency | 🔴 A FAZER | Sprint 02 | Performance |

## Parallelismo Possível

Sprints que podem rodar em paralelo (sem dependência entre si):
- **Sprint 00** + **Sprint 03** (fundação técnica + Brands P0)
- **Sprint 01** + **Sprint 04** (Social + Campaigns Foundation)
- **Sprint 05** + **Sprint 06** + **Sprint 08** (Chat + Design + Dashboard)
- **Sprint 07** + **Sprint 10** (Brand Intel + Launch Pad)
- **Sprint 09** + **Sprint 11** + **Sprint 12** (Discovery + Forensics + Performance)

## Legenda

- Cada sprint tem: Contexto, Tarefas detalhadas com arquivos, Critérios de aceitação, Check de Progressão Contínua
- 🔴 A FAZER | 🟡 EM PROGRESSO | 🟢 COMPLETO
- Cada tarefa referencia seção do documento master para rastreabilidade
