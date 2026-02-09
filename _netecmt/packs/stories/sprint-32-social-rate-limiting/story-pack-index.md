# Story Pack Index — Sprint 32: Social Integration 2.0 + Rate Limiting

**Sprint:** 32
**Tipo:** Feature Sprint (Social & Rate Limiting)
**SM:** Leticia
**Data:** 08/02/2026
**Deliberacao:** Veredito do Conselho (Party Mode) — unanimidade
**PRD:** `_netecmt/solutioning/prd/prd-sprint-32-social-rate-limiting.md`
**Arch Review:** `_netecmt/solutioning/architecture/arch-sprint-32.md` — APROVADO COM RESSALVAS (8 DTs, 2 Blocking)

---

## Organizacao do Pack

| Arquivo | Conteudo |
|:--------|:---------|
| `story-pack-index.md` | Este arquivo (indice e visao geral) |
| `stories.md` | Stories detalhadas com acceptance criteria |
| `allowed-context.md` | Arquivos que Darllyson pode ler/modificar |

---

## Fases e Sequencia

### Fase 1: Rate Limiting (P0 — OBRIGATORIO)
| ID | Story | DTs | Esforco | Dependencia |
|:---|:------|:----|:--------|:------------|
| S32-RL-01 | Rate Limiter Core (wrapper + Firestore transaction) | DT-01 (BLOCKING) | M (~1.5h) | — |
| S32-RL-02 | Aplicar Rate Limiter nas 4 rotas + testes | DT-02 (BLOCKING) | M (~1.5h) | S32-RL-01 |
| S32-GATE-01 | **Gate Check 1** | — | XS (~15min) | S32-RL-02 |

### Fase 2: Instagram Graph API (P1)
| ID | Story | DTs | Esforco | Dependencia |
|:---|:------|:----|:--------|:------------|
| S32-IG-01 | Instagram Adapter (REST + vault + token refresh) | DT-03, DT-04 | L (~2.5h) | S32-GATE-01 |
| S32-IG-02 | Integracao InboxAggregator + testes | — | S+ (~1h) | S32-IG-01 |
| S32-GATE-02 | **Gate Check 2** | — | XS (~15min) | S32-IG-02 |

### Fase 3: LinkedIn Scaffold + Response Engine (P1)
| ID | Story | DTs | Esforco | Dependencia |
|:---|:------|:----|:--------|:------------|
| S32-LI-01 | LinkedIn Adapter scaffold + aggregator wiring | DT-05 | S (~1h) | S32-GATE-02 |
| S32-RE-01 | Social Response Engine + prompt redesenhado | DT-06, DT-07 | M+ (~2h) | S32-GATE-02 |
| S32-RE-02 | Wiring API social-inbox + testes | — | S (~1h) | S32-RE-01 |
| S32-GATE-03 | **Gate Check 3** | — | XS (~15min) | S32-LI-01 + S32-RE-02 |

### Fase 4: Governanca + STRETCH
| ID | Story | DTs | Esforco | Dependencia |
|:---|:------|:----|:--------|:------------|
| S32-GOV-01 | Contract-map update | DT-08 | XS (~15min) | S32-GATE-03 |
| S32-BV-01 | (STRETCH) BrandVoice Translator 2.0 | — | S (~1.5h) | S32-GOV-01 |

---

## Resumo de Esforco

| Fase | Stories | Esforco Total |
|:-----|:--------|:-------------|
| Fase 1 (Rate Limiting) | 2 + gate | ~3h + 15min |
| Fase 2 (Instagram) | 2 + gate | ~3.5h + 15min |
| Fase 3 (LinkedIn + Response) | 3 + gate | ~4h + 15min |
| Fase 4 (Governanca) | 1 | ~15min |
| STRETCH | 1 | ~1.5h |
| **Total Core** | **8 stories + 3 gates** | **~10.75h** |
| **Total com STRETCH** | **9 stories + 3 gates** | **~12.25h** |

---

## Blocking DTs (Pre-flight)
- [ ] **DT-01**: Rate limiter DEVE usar `runTransaction()` — BLOCKING
- [ ] **DT-02**: Import path `@/lib/auth/brand-guard` — BLOCKING

---

*Story Pack preparado por Leticia (SM) | Sprint 32 | 08/02/2026*
