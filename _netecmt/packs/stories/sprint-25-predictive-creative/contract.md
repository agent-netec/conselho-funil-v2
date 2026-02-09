# Contrato: Sprint 25 — Predictive & Creative Engine
**Lane:** `intelligence_wing`
**Status:** ✅ Aprovado (Athos)
**Versão:** 1.0.0
**Data:** 06/02/2026

---

## 1. Endpoints Contratualizados

### Endpoint 1: `POST /api/intelligence/predict/score`
**Stories:** S25-ST-01 (Scoring), S25-ST-02 (Benchmark), S25-ST-03 (Recommendations)

| Campo | Valor |
|:------|:------|
| Request Type | `PredictScoreRequest` (de `prediction.ts`) |
| Response Type | `PredictScoreResponse` (de `prediction.ts`) |
| Token Budget | 4.000 tokens (tag: `predict_score`) |
| Rate Limit | 20 req/min por brandId |
| Firestore | `brands/{brandId}/predictions` |
| TTL | 90 dias |

**Erros:**
- `400 VALIDATION_ERROR` — brandId ausente, funnelUrl e funnelData vazios
- `400 INVALID_WEIGHTS` — Soma de nicheWeights ≠ 1.0
- `404 BRAND_NOT_FOUND` — brandId inexistente
- `429 RATE_LIMITED` — Excedeu rate limit
- `500 SCORING_ERROR` — Falha no Gemini

---

### Endpoint 2: `POST /api/intelligence/creative/generate-ads`
**Stories:** S25-ST-04 (Pipeline), S25-ST-05 (Remixing), S25-ST-06 (Brand Compliance)

| Campo | Valor |
|:------|:------|
| Request Type | `GenerateAdsRequest` (de `creative-ads.ts`) |
| Response Type | `GenerateAdsResponse` (de `creative-ads.ts`) |
| Token Budget | 8.000 tokens (tag: `generate_ads`) |
| Rate Limit | 10 req/min por brandId |
| Max Variações | 5 (hardcoded) |
| Brand Voice Gate | toneMatch >= 0.75, max 2 retries |
| Firestore | `brands/{brandId}/generated_ads` |
| TTL | 30 dias |

**Erros:**
- `400 VALIDATION_ERROR` — Campos obrigatórios ausentes
- `400 INVALID_FORMAT` — Formato de ad não reconhecido
- `400 EMPTY_ASSETS` — eliteAssets sem headlines, CTAs nem hooks
- `404 BRAND_NOT_FOUND` — brandId inexistente
- `429 RATE_LIMITED` — Excedeu rate limit
- `500 GENERATION_ERROR` — Falha no Gemini ou Brand Voice

---

### Endpoint 3: `POST /api/intelligence/analyze/text`
**Stories:** S25-ST-07 (Text Parser), S25-ST-08 (VSL Parser), S25-ST-09 (Ad Copy Analyzer)

| Campo | Valor |
|:------|:------|
| Request Type | `AnalyzeTextRequest` (de `text-analysis.ts`) |
| Response Type | `AnalyzeTextResponse` (de `text-analysis.ts`) |
| Token Budget | 6.000 tokens (tag: `analyze_text`) |
| Rate Limit | 15 req/min por brandId |
| Max Input | 50.000 caracteres |
| Min Input | 50 caracteres |
| Sanitização | Obrigatória (RT-03) |
| Firestore | `brands/{brandId}/intelligence` (com `fetchedVia: 'text_input'`) |

**Erros:**
- `400 VALIDATION_ERROR` — Campos obrigatórios ausentes
- `400 TEXT_TOO_LONG` — > 50.000 caracteres
- `400 TEXT_TOO_SHORT` — < 50 caracteres
- `400 INVALID_TEXT_TYPE` — textType não reconhecido
- `400 SUSPICIOUS_INPUT` — Texto parece código ou dados sensíveis
- `404 BRAND_NOT_FOUND` — brandId inexistente
- `429 RATE_LIMITED` — Excedeu rate limit
- `500 ANALYSIS_ERROR` — Falha no parsing ou Gemini

---

## 2. Invariantes de Build (Architect's Shield)

Todas as rotas DEVEM:
1. Ter `export const dynamic = 'force-dynamic';` no topo
2. Ter `requireBrandAccess(req, brandId)` antes de qualquer operação
3. Zero imports de `firebase-admin`
4. Integrar `cost-guard.ts` em todas as chamadas Gemini
5. Validar `brandId` obrigatório em todos os requests

---

## 3. Limites de Caracteres por Formato de Ad

```typescript
const AD_CHAR_LIMITS = {
  meta_feed: { headline: 40, body: 125, description: 30 },
  meta_stories: { hook: 50, body: 80, ctaOverlay: 25 },
  google_search: { headline: 30, description: 90 },
};
```

---

## 4. Referências Completas

| Documento | Path |
|:----------|:-----|
| Architecture Review (contratos completos) | `_netecmt/solutioning/architecture/arch-sprint-25-predictive-creative-engine.md` |
| PRD Sprint 25 | `_netecmt/solutioning/prd/prd-sprint-25-predictive-creative-engine.md` |
| Contrato Intelligence Storage v2.0 | `_netecmt/contracts/intelligence-storage.md` |
| Lane Map | `_netecmt/core/contract-map.yaml` |

**Para contratos de API detalhados (Request/Response TypeScript completos), consultar a Architecture Review § 3, 4 e 5.**

---
*Contrato preparado por Leticia (SM) com base na Architecture Review de Athos — NETECMT v2.0*
*Sprint 25: Predictive & Creative Engine | 06/02/2026*
