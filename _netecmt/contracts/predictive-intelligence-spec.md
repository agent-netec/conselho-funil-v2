# Contract: Predictive Intelligence

## Lane
- `predictive_intelligence`

## Escopo
- Engines de predição (`churn`, `ltv`, `forecast`)
- APIs REST de predição
- Dashboard preditivo com tabs e alertas
- Hook unificado para carregamento paralelo

## Tipos
- `ChurnPrediction`, `ChurnBatchResult`
- `LTVEstimation`, `LTVBatchResult`, `LTVMultiplierConfig`, `PredictiveConfig`
- `AudienceForecast`
- `PredictiveAlert`

## APIs
- `POST /api/intelligence/predictive/churn`
- `POST /api/intelligence/predictive/ltv`
- `POST /api/intelligence/predictive/forecast`

## Regras
- Multi-tenant por `brandId`
- Rotas com `force-dynamic`
- `requireBrandAccess` obrigatório
- `createApiError`/`createApiSuccess` obrigatório
