# PRD — Sprint 22 (ST-22-00) Estabilização

## Objetivo
Estabilizar o ambiente online reduzindo erros 5xx/4xx nas rotas críticas de Inteligência e dependências externas, garantindo operação confiável com validação de envs e smoke tests mínimos.

## Escopo
### Inclui
- Validar variáveis de ambiente globais (local + Vercel) conforme checklist.
- Priorizar endpoints P0 de Inteligência/Chat/Ingestão/Assets e garantir respostas tratadas (sem crash).
- Executar smoke tests mínimos por endpoint crítico e registrar falhas.
- Melhorar resiliência em integrações externas (Gemini, Pinecone, scraping, Firestore) com erros claros.

### Não inclui
- Implementação de novas features ou expansão de produto.
- Alterações em integrações por cliente (tenant) que não sejam necessárias para estabilização.
- Mapeamento completo de logs/observabilidade fora do escopo desta sprint.

## Métricas de Sucesso
- Redução visível de 5xx nas rotas P0 (ex.: /api/intelligence/*, /api/chat, /api/ingest/url, /api/assets/metrics).
- 100% das envs globais críticas validadas em local e Vercel.
- Smoke tests P0 executados com respostas esperadas (200/400/401/404/422) e sem 500.
- Incidentes críticos ligados a envs ausentes identificados e documentados.

## Riscos e Dependências
- Dependência de chaves externas (Firebase, Google AI/Gemini, Pinecone, Workers) para evitar 500.
- Webhooks exigem secrets válidos; ausência gera 401/500.
- Scraping pode gerar 422 intermitente, exigindo tratamento de erro robusto.
- Ausência de acesso a logs (Sentry/observabilidade) limita diagnóstico de causa raiz.

## Referências
- `env-endpoint-matrix.md`
- `env-validation-checklist.md`
- `smoke-tests.md`
