# Execution Order: Sprint 25 — Predictive & Creative Engine
**Preparado por:** Leticia (SM)
**Data:** 06/02/2026

---

## 🔀 Grafo de Dependências

```
                    ┌──────────┐
            ┌──────▶│ ST-02 (B)│ Benchmark
            │       └──────────┘
┌──────────┐│       ┌──────────┐
│ ST-01 (S)├┼──────▶│ ST-03 (R)│ Recommendations
│ Scoring  ││       └──────────┘
│ Engine   ││       ┌──────────┐       ┌──────────┐
└──────┬───┘└──────▶│ ST-04 (A)├──────▶│ ST-05 (E)│ Elite Remixing
       │            │ Ad Gen   │       └──────────┘
       │            │ Pipeline ├──────▶┌──────────┐
       │            └─────┬────┘       │ ST-06 (V)│ Brand Voice Gate
       │                  │            └──────────┘
       │                  │
       ▼                  ▼
┌──────────────────────────────┐
│       ST-10 (UI)             │ Painel de Predição + Ad Preview
│  ⚠️  Bloqueado por mockups   │
└──────────────────────────────┘

┌──────────┐       ┌──────────┐
│ ST-07 (T)├──────▶│ ST-08 (V)│ VSL Parser
│ Text     │       └──────────┘
│ Analyzer ├──────▶┌──────────┐
└──────────┘       │ ST-09 (C)│ Ad Copy Analyzer
                   └──────────┘
```

---

## 📋 Ordem de Execução Recomendada

### Wave 1 — Fundação (Paralelo)
Duas tracks independentes que podem ser executadas simultaneamente.

| Ordem | Story | Epic | Estimativa | Justificativa |
|:------|:------|:-----|:-----------|:--------------|
| 1A | **S25-ST-01** | Epic 1 | M (2-4h) | Fundação do scoring — bloqueia ST-02, ST-03, ST-04 e ST-10 |
| 1B | **S25-ST-07** | Epic 3 | M (2-4h) | Independente — pode ser feito em paralelo com ST-01 |

**Exit Criteria Wave 1:**
- ST-01: `predict/score` retornando CPS válido com 6 dimensões
- ST-07: `analyze/text` retornando UXIntelligence de texto colado

---

### Wave 2 — Extensão Predictor + Text (Paralelo)
Desbloqueado após Wave 1.

| Ordem | Story | Epic | Estimativa | Justificativa |
|:------|:------|:-----|:-----------|:--------------|
| 2A | **S25-ST-02** | Epic 1 | S (< 2h) | Benchmark — depende de ST-01, relativamente simples |
| 2B | **S25-ST-03** | Epic 1 | M (2-4h) | Recommendations — depende de ST-01, cross-lane com RAG |
| 2C | **S25-ST-08** | Epic 3 | M (2-4h) | VSL Parser — depende de ST-07 |
| 2D | **S25-ST-09** | Epic 3 | S (< 2h) | Ad Copy Analyzer — depende de ST-07 |

**Exit Criteria Wave 2:**
- Epic 1 (Predictor) 100% completo
- Epic 3 (Text) 100% completo

---

### Wave 3 — Creative Engine (Sequencial)
Desbloqueado após ST-01 (Wave 1).

| Ordem | Story | Epic | Estimativa | Justificativa |
|:------|:------|:-----|:-----------|:--------------|
| 3A | **S25-ST-04** | Epic 2 | L (4-8h) | Ad Generation Pipeline — maior story, depende de scoring |
| 3B | **S25-ST-05** | Epic 2 | M (2-4h) | Elite Remixing — depende de ST-04, cross-lane RAG |
| 3C | **S25-ST-06** | Epic 2 | S (< 2h) | Brand Voice Gate — depende de ST-04, cross-lane brand_voice |

**Nota:** ST-04 pode iniciar assim que ST-01 estiver completo, em paralelo com Wave 2.

**Exit Criteria Wave 3:**
- `creative/generate-ads` retornando ads com CPS, Brand Voice compliance e rastreabilidade

---

### Wave 4 — UI (Final)
Desbloqueado após Wave 1 (ST-01) + Wave 3 (ST-04) + Mockups de Beto/Victor.

| Ordem | Story | Epic | Estimativa | Justificativa |
|:------|:------|:-----|:-----------|:--------------|
| 4A | **S25-ST-10** | Transversal | L (4-8h) | UI completa — depende de backends + mockups |

**Exit Criteria Wave 4:**
- Painel de Predição renderizando CPS + breakdown + benchmark
- Preview de Ads funcional para os 3 formatos
- Text Input integrado no Discovery Hub

---

## ⚡ Critical Path

O critical path da sprint é:

```
ST-01 (M) → ST-04 (L) → ST-05 (M) → ST-10 (L)
  ~3h         ~6h          ~3h         ~6h      = ~18h no critical path
```

**Gargalo identificado:** ST-04 (Ad Generation Pipeline) é a story mais larga e está no critical path. Priorizar esta story assim que ST-01 estiver completa.

---

## 🔄 Paralelismo Máximo

Com um único desenvolvedor, a sequência ideal é:

```
Dia 1 (manhã):  ST-01 (Scoring Engine)     — FUNDAÇÃO
Dia 1 (tarde):  ST-07 (Text Analyzer)      — PARALELO (independente)
Dia 2 (manhã):  ST-04 (Ad Gen Pipeline)    — CRITICAL PATH
Dia 2 (tarde):  ST-02 (Benchmark) + ST-03 (Recommendations)
Dia 3 (manhã):  ST-05 (Elite Remixing) + ST-06 (Brand Voice)
Dia 3 (tarde):  ST-08 (VSL Parser) + ST-09 (Ad Copy Analyzer)
Dia 4:          ST-10 (UI) — depende de mockups
```

**Estimativa total:** ~4 dias de desenvolvimento (32h)

---

## ⚠️ Bloqueios e Riscos

| Bloqueio | Impacto | Status | Ação |
|:---------|:--------|:-------|:-----|
| Mockups de Beto/Victor (ST-10) | Bloqueia UI completa | Pendente | Darllyson pode iniciar layout genérico |
| RAG/Pinecone indisponível (ST-03, ST-05) | Degrada recommendations/remix | Baixo risco | Graceful degradation implementada |
| Brand Voice service (ST-06) | Degrada compliance check | Baixo risco | Graceful degradation implementada |
| Gemini rate limits globais | Atrasa todas as stories | Médio risco | Queue + rate limiting per-brandId |

---

## ✅ Definition of Done (Sprint-Level)

- [ ] Todos os 3 endpoints retornando 200 OK com responses válidas
- [ ] Conversion Predictor retornando CPS para qualquer UXIntelligence input
- [ ] Pelo menos 3 variações de anúncio geradas por funil analisado
- [ ] Brand Voice Compliance validado (toneMatch >= 0.75)
- [ ] Text Input funcional no Discovery Hub (URL + Texto colado)
- [ ] Multi-tenant testado (zero vazamento entre brands)
- [ ] Build limpo na Vercel (sem erros de importação)
- [ ] Smoke test dos novos endpoints passando (200 OK)
- [ ] Todas as rotas com `force-dynamic` e `requireBrandAccess`
- [ ] Token budgets respeitados (via cost-guard.ts)

---
*Execution Order preparado por Leticia (SM) — NETECMT v2.0*
*Sprint 25: Predictive & Creative Engine | 06/02/2026*
