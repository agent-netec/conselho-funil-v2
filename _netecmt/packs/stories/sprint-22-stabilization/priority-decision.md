# ST-22-00 — Decisao de Priorizacao (Dependencias Primeiro)
Data: 2026-01-31
Responsavel: Iuran (PM)

## Contexto
- Sprint de estabilizacao com erros recorrentes 400/404/500.
- Endpoint critico: `POST /api/intelligence/keywords`.
- Restricao: estabilidade antes de novas features.

## Decisao
Priorizar a resolucao de dependencias estruturais e acesso operacional antes de qualquer correcao pontual
ou evolucao funcional. Nenhuma iniciativa P1 ou feature nova entra no fluxo ate o gate de dependencias
estar concluido.

## Criterios de prioridade (ordem)
1) **Dependencias criticas** (bloqueadores sistemicos)
   - Envs globais validadas em Vercel (Firebase, Google AI/Gemini, Pinecone, App URL, Webhooks).
   - Acesso a logs/Sentry e janela de erros 4xx/5xx por endpoint.
   - Credenciais e dados de teste (brandId/userId/competitorId) para smoke tests P0.
   - Workers externos habilitados (Firecrawl/Exa/Bright Data/Browser).
2) **P0 de Inteligencia** (impacto direto no core)
   - `POST /api/intelligence/keywords` (prioridade maxima).
   - `POST /api/intelligence/autopsy/run`
   - `POST /api/intelligence/spy`
   - `POST /api/chat`
   - `POST /api/ingest/url`
   - `GET /api/assets/metrics`
3) **P1 operacional**
   - Copy/Social/Design, Reporting/Performance, Webhooks/Admin.

## Ordem de execucao aplicada
1) Gate de dependencias concluido e evidenciado.
2) Smoke tests P0 com payload minimo valido.
3) Correcoes P0 focadas em 500/422/JSON invalido/persistencia.
4) Re-test P0 sem 500 (400/401/404/422 com erro tratado).
5) P1 somente apos estabilizacao P0 comprovada.

## Impacto imediato no endpoint critico
`POST /api/intelligence/keywords` so entra em correcoes de negocio apos:
- Envs Firebase e Google AI confirmadas na Vercel.
- brandId/userId validados e acessiveis.
- Logs disponiveis para validar regressao e taxa de erro.
