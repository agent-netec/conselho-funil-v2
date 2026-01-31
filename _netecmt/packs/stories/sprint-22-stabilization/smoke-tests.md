# ST-22-00 — Roteiro de smoke tests por endpoint

> Objetivo: validar rapidamente 200/400/401/404/422 e detectar 500.
> Formato: chamada mínima + esperado.

## Inteligência (P0)

- `POST /api/intelligence/keywords`
  - **Body mínimo**: `{ "brandId": "test", "seedTerm": "exemplo" }`
  - **Esperado**: 200 com `success` e `keywords[]`; 500 se miner falhar; 400 se faltar campo.

- `POST /api/intelligence/autopsy/run`
  - **Body mínimo**: `{ "brandId": "test", "url": "https://example.com" }`
  - **Esperado**: 200 com `report`; 422 se scraping falhar; 400 se faltar campo.

- `POST /api/intelligence/spy`
  - **Body mínimo**: `{ "brandId": "test", "competitorId": "comp_1" }`
  - **Esperado**: 200 com `techStack`; 404 se competitor não existe; 400 se faltar campo.

## Chat (P0)

- `POST /api/chat`
  - **Body mínimo**: `{ "message": "teste", "conversationId": "conv_1" }`
  - **Esperado**: 200 com `response`; 404 se conversa não existe; 403 se créditos.

## Ingestão/Assets (P0)

- `POST /api/ingest/url`
  - **Body mínimo**: `{ "url": "https://example.com", "brandId": "test", "userId": "user_1" }`
  - **Esperado**: 200 com `assetId`; 400 se URL inválida; 422/400 se scraping sem conteúdo.

- `GET /api/assets/metrics?brandId=test`
  - **Esperado**: 200 com `assets[]`; 400 se `brandId` ausente; 500 se Pinecone indisponível.

## Performance/Reporting (P1)

- `GET /api/performance/anomalies?brandId=test&mock=true`
  - **Esperado**: 200 com `data[]`; 400 se `brandId` ausente.

- `GET /api/performance/metrics?brandId=test&mock=true`
  - **Esperado**: 200 com `data[]`; 400 se `brandId` ausente; 501 sem `mock`.

- `POST /api/performance/integrations/validate`
  - **Body mínimo**: `{ "brandId": "test", "platform": "meta", "apiKey": "mock_key", "accountId": "acc_1", "mock": true }`
  - **Esperado**: 200 com `success`; 401 se mock inválido; 400 se faltam campos.

## Copy/Social/Design (P1)

- `POST /api/copy/generate`
  - **Body mínimo**: `{ "funnelId": "f1", "proposalId": "p1", "copyType": "ads" }`
  - **Esperado**: 404 se funil/proposal não existe; 500 se Gemini não config.

- `POST /api/social/hooks`
  - **Body mínimo**: `{ "platform": "instagram", "topic": "teste" }`
  - **Esperado**: 200; 500 se Gemini não config.

- `POST /api/design/plan`
  - **Body mínimo**: `{ "funnelId": "f1", "context": { "copy": "texto" } }`
  - **Esperado**: 200; 400 se faltar `context.copy`.

## Webhooks & Admin (P1)

- `POST /api/webhooks/ads-metrics`
  - **Body mínimo**: `{ "campaign_id": "c1", "clicks": 1 }`
  - **Esperado**: 401 se assinatura ausente; 500 se secrets ausentes.

- `POST /api/admin/list-funnels`
  - **Esperado**: 401/403 se não-admin; 200 com lista para admin.

