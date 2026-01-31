# Mapa de falhas por endpoint (ST-22-00)

> Escopo: apenas rotas em `app/src/app/api/**` conforme pack.

## Diagnóstico geral (causas prováveis)
- **Env ausente**: Firebase (`NEXT_PUBLIC_FIREBASE_*`), Gemini/Google AI (`GOOGLE_AI_API_KEY`, `GEMINI_MODEL`), Pinecone, secrets de webhooks, workers MCP.
- **Dependências externas instáveis**: fetch de imagens/URLs, scraping, Gemini, Pinecone, webhooks e workers.
- **Permissão/Admin**: rotas com `verifyAdminRole` retornam 401/403/500 se token/role inválidos.
- **JSON inválido**: respostas de IA não parseáveis geram 500 em várias rotas.
- **Dados inexistentes**: 404 para funil/proposal/campanha/competidor/marca/lead.
- **Infra Firebase**: `db` não inicializado ou Firestore indisponível gera 500.

## Atualizacoes aplicadas (ST-22-00)
- 2026-01-31: Adicionado parse de JSON seguro em rotas P0 para evitar 500 por body invalido.
- 2026-01-31: Autopsy/Ingest retornam 422 em falha de scraping/sem conteudo.
- 2026-01-31: Spy resiliente a resposta nao-JSON do Gemini no dossie.
- 2026-01-31: Spy retorna erro tratado e nao quebra se persistencia falhar.

---

## Inteligência

- `POST /api/intelligence/keywords`
  - **400**: `brandId` ou `seedTerm` ausentes.
  - **500**: falha no `KeywordMiner` ou JSON inválido; persistência no Firestore falha (saveError).
  - **Conexão**: dependência de serviços externos de mineração/Firestore.

- `POST /api/intelligence/autopsy/run`
  - **400**: `brandId` ou `url` ausentes.
  - **422**: scraping falhou (`extractContentFromUrl`).
  - **500**: falha no `AutopsyEngine`/Gemini ou erro interno.
  - **Conexão**: scraping remoto e Gemini.

- `POST /api/intelligence/spy`
  - **400**: `brandId` ou `competitorId` ausentes.
  - **404**: competidor não encontrado.
  - **500**: falha em `SpyAgent`/`DossierGenerator` ou update Firestore.
  - **Conexão**: crawling/scan externo e Firestore.

- `POST /api/intelligence/offer/save`
  - **400**: `brandId` ou `state` ausentes.
  - **500**: falha no cálculo do score.
  - **Diagnóstico**: persistência no Firestore ainda não implementada (pode gerar inconsistência).

- `POST /api/intelligence/offer/calculate-score`
  - **400**: `brandId` ou `offerData` ausentes.
  - **500**: falha no `OfferScoringEngine`.

- `GET /api/intelligence/ltv/cohorts`
  - **500**: falha ao ler leads no Firestore.
  - **Conexão**: Firestore.

- `POST /api/intelligence/events/ingest`
  - **400**: `email`, `type` ou `source` ausentes.
  - **500**: falha no `ingestJourneyEvent`/segurança.
  - **Conexão**: Firestore + event bridge.

- `GET /api/intelligence/creative/ranking`
  - **400**: `brandId` ausente.
  - **500**: falha em `getCreativePerformanceRanking` (Firestore).

- `POST /api/intelligence/creative/copy`
  - **400**: `brandId`, `baseCopy` ou `angle` ausentes; `angle` inválido.
  - **404**: marca não encontrada.
  - **500**: falha no `CopyGenerationLab`.

- `POST /api/intelligence/audience/scan`
  - **400**: `brandId` ausente.
  - **500**: falha no `AudienceIntelligenceEngine`.

- `GET /api/intelligence/journey/[leadId]`
  - **400**: `leadId` ausente.
  - **404**: lead não encontrado.
  - **500**: falha ao buscar eventos ou descriptografia.

---

## Ingestão, Library e Assets

- `POST /api/ingest/url`
  - **400**: URL inválida; `brandId`/`userId` ausentes; conteúdo insuficiente.
  - **500**: falha no scraper, Firestore ou worker.
  - **Conexão**: scraping remoto, Gemini Vision (fallback) e Firestore.

- `POST /api/ingest/process-worker`
  - **400**: `assetId` ausente.
  - **500**: falha no `processAsset`.

- `GET|POST /api/library`
  - **400**: `funnelId`/`proposalId` ausentes no POST.
  - **404**: funil ou proposal não encontrados.
  - **500**: falha Firestore.

- `GET /api/assets/metrics`
  - **400**: `brandId` ausente.
  - **500**: falha no Pinecone ou erro interno crítico.
  - **Conexão**: Pinecone + Firestore.

- `POST /api/brands/[brandId]/assets/url`
  - **400**: URL inválida; `userId` ausente; scraping sem conteúdo.
  - **500**: erro interno ou processamento de chunks.
  - **Conexão**: scraping remoto e Firestore.

---

## Chat, Funis e Decisões

- `POST /api/chat`
  - **400**: `message` ou `conversationId` ausentes.
  - **403**: créditos insuficientes (quando habilitado).
  - **404**: conversa não encontrada.
  - **500**: falha em RAG, Gemini ou Firestore.
  - **Conexão**: Gemini, Pinecone, Firestore.

- `POST /api/decisions`
  - **400**: campos obrigatórios ausentes.
  - **404**: funil ou proposal inexistente.
  - **500**: falha Firestore ou chamada de regeneração.

- `GET /api/decisions`
  - **400**: `funnelId` ausente.
  - **500**: falha Firestore.

- `POST /api/funnels/generate`
  - **400**: `funnelId`/`context` ausentes.
  - **500**: Gemini não configurado; parse JSON falhou; Firestore.
  - **Conexão**: Gemini + Pinecone (RAG) + Firestore.

- `GET /api/funnels/export`
  - **400**: `funnelId` ausente.
  - **404**: funil ou proposal inexistente.
  - **500**: falha Firestore.

- `POST|DELETE /api/funnels/share`
  - **400**: `funnelId` ausente.
  - **404**: funil inexistente (POST).
  - **500**: falha Firestore.

---

## Copy e Ads

- `POST /api/copy/generate`
  - **400**: `funnelId`, `proposalId` ou `copyType` ausentes.
  - **404**: funil/proposta inexistente.
  - **500**: Gemini não configurado; parse JSON falhou; Firestore.
  - **Conexão**: Gemini + Pinecone (RAG).

- `GET /api/copy/generate`
  - **400**: `funnelId` ausente.
  - **500**: falha Firestore.

- `POST /api/copy/decisions`
  - **400**: campos obrigatórios ausentes; `type` inválido; ajustes vazios.
  - **404**: copy proposal inexistente.
  - **500**: falha Firestore ou handoff para campanha.

- `POST /api/campaigns/[id]/generate-ads`
  - **400**: `campaignId` ausente.
  - **404**: campanha inexistente.
  - **500**: parse JSON falhou; Firestore; Gemini não configurado.
  - **Conexão**: Gemini + Pinecone (RAG).

---

## Design

- `POST /api/design/plan`
  - **400**: `funnelId` ou `context.copy` ausentes.
  - **500**: Gemini não configurado; parse JSON falhou.

- `POST /api/design/generate`
  - **400**: `prompt` ou `userId` ausentes.
  - **500**: `GOOGLE_AI_API_KEY` ausente; falha na geração; fetch de refs falha.
  - **Conexão**: Google AI + fetch de referências.

- `POST /api/design/upscale`
  - **400**: `imageUrl` ausente.
  - **500**: falha na chamada Gemini Image; fetch do arquivo base falha.
  - **Conexão**: Google AI + fetch de imagem.

---

## Social

- `POST /api/social/generate`
  - **400**: `funnelId` ou `context.copy` ausentes.
  - **500**: Gemini não configurado; parse JSON falhou.

- `POST /api/social/structure`
  - **400**: `platform` ou `hook` ausentes.
  - **500**: Gemini não configurado; parse JSON falhou; RAG falhou.
  - **Conexão**: Gemini + Pinecone (RAG).

- `POST /api/social/scorecard`
  - **400**: `platform` ou `content` ausentes.
  - **500**: Gemini não configurado; parse JSON falhou; RAG falhou.
  - **Conexão**: Gemini + Pinecone (RAG).

- `POST /api/social/hooks`
  - **400**: `platform` ou `topic` ausentes.
  - **500**: Gemini não configurado; parse JSON falhou; RAG falhou.
  - **Conexão**: Gemini + Pinecone (RAG).

- `GET /api/social-inbox`
  - **400**: `brandId` ou `keyword` ausentes.
  - **404**: marca inexistente.
  - **500**: falha em agregadores/IA/Firestore.

---

## Performance e Reporting

- `GET /api/performance/anomalies`
  - **400**: `brandId` ausente.
  - **500**: falha no SentryEngine.

- `GET /api/performance/metrics`
  - **400**: `brandId` ausente.
  - **501**: busca real não implementada (sem `mock=true`).
  - **500**: falha interna.

- `POST /api/performance/integrations/validate`
  - **400**: `brandId`/`platform`/`apiKey`/`accountId` ausentes.
  - **401**: mock inválido.
  - **501**: validação real não implementada.
  - **500**: erro interno.

- `POST /api/reporting/generate`
  - **400**: `metrics`/`context` ausentes.
  - **401/403**: `verifyAdminRole` falhou.
  - **500**: falha no engine ou segurança.

- `POST /api/reporting/anomaly-check`
  - **400**: `clientId`/`realRoi` ausentes.
  - **404**: predição não encontrada.
  - **401/403**: `verifyAdminRole` falhou.
  - **500**: falha no detector/persistência.

---

## Webhooks e Automação

- `POST /api/webhooks/dispatcher`
  - **400**: `brandId` ausente.
  - **401**: assinatura inválida.
  - **500**: `clientSecret` ausente; falha no normalizer/maestro.
  - **Conexão**: MonaraTokenVault + PersonalizationMaestro.

- `GET /api/webhooks/dispatcher`
  - **403**: token inválido no hub challenge.

- `POST /api/webhooks/ads-metrics`
  - **401**: assinatura ausente/inválida.
  - **400**: payload JSON inválido ou `campaign_id` ausente.
  - **500**: secret ausente; falha Firestore.

- `POST /api/automation/kill-switch`
  - **400**: campos obrigatórios ausentes.
  - **500**: erro interno (baixa probabilidade).

- `POST /api/integrations/offline-conversion`
  - **400**: `leadId`, `value` ou `transactionId` ausentes.
  - **404**: lead inexistente.
  - **500**: falha no CAPI/Firestore.

---

## Admin

- `POST /api/admin/process-asset`
  - **400**: `assetId` ou `text` ausentes.
  - **401/403**: `verifyAdminRole` falhou.
  - **500**: falha no `processAssetText`.

- `POST|GET /api/admin/upload-knowledge`
  - **400**: `chunks` ausente ou inválido.
  - **401/403**: `verifyAdminRole` falhou.
  - **500**: falha Firestore.

- `POST /api/admin/ingest-knowledge`
  - **400**: `chunks` inválido.
  - **401/403**: `verifyAdminRole` falhou.
  - **500**: falha Firestore.

- `GET /api/admin/check-knowledge`
  - **401/403**: `verifyAdminRole` falhou.
  - **500**: falha Firestore.

- `GET /api/admin/list-funnels`
  - **401/403**: `verifyAdminRole` falhou.
  - **500**: falha Firestore.

- `GET|PATCH /api/admin/funnel-status`
  - **400**: `funnelId`/`status` ausentes ou inválidos.
  - **404**: funil não encontrado (GET).
  - **401/403**: `verifyAdminRole` falhou.
  - **500**: falha Firestore.

---

## MCP Relay e Pinecone

- `POST /api/mcp/execute`
  - **400**: `provider`/`tool`/`args` ausentes.
  - **402**: créditos insuficientes.
  - **500**: worker/`API_KEY` ausentes; worker retornou erro.
  - **Conexão**: workers MCP + providers externos.

- `GET /api/pinecone/health`
  - **500**: Pinecone indisponível ou envs ausentes.

- `POST /api/pinecone/migrate`
  - **500**: falha Firestore ou Pinecone.

