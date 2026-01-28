---
title: Sentry Observability - Guia de Liberação
status: draft
owner: Kai (Integrator)
permitted_agents:
  - Kai (Integrator)
  - Athos (Arch)
  - Darllyson (Dev)
last_review: 2026-01-11
---

# O que faz
- Rastreamento de erros, logs estruturados e traces (APM) das rotas de ingestão.
- Captura de breadcrumbs de request (status, tempo, payload resumido) com redaction.
- Alertas e correlação por `brandId`/`userId`.

# Pré-requisitos
- Variáveis de ambiente:
  - `SENTRY_DSN` (não commitar).
  - `SENTRY_ENVIRONMENT` (ex.: `dev`, `staging`, `prod`).
  - `SENTRY_RELEASE` (hash/versão do build) — opcional.
  - `SENTRY_TRACES_SAMPLE_RATE` e `SENTRY_PROFILES_SAMPLE_RATE` (ex.: `0.1`).
- SDK do Sentry para o runtime usado (JS/TS recomendado).

# Comandos permitidos
- **SDK (JS/TS)**: inicializar Sentry no app/worker de ingestão com redaction em `beforeSend`.
- **Sentry CLI**: **não autorizado ainda**. Se necessário para releases/source maps, pedir aprovação do Iuran e registrar em `cli-reference.yaml`.

# Fluxo recomendado
1) Configurar as variáveis em `.env.local`/secrets do ambiente (nunca hardcoded).
2) Inicializar o SDK no bootstrap do serviço de ingestão com:
   - `tracesSampleRate` e `profilesSampleRate` coerentes com tráfego.
   - `beforeSend` removendo ou mascarando PII (email, telefone, CPF/CNPJ, tokens, payloads grandes).
3) Logging/tracing do request:
   - Capturar `brandId`, `userId`, método, rota, status, latência, tamanho do payload.
   - Em 400, retornar mensagem sanitizada para `vero.academy` e enviar stack completo só ao Sentry.
4) Timeouts/retries:
   - Timeout máximo 10–15s em chamadas externas.
   - Retries limitados com backoff/jitter; registrar tentativa no Sentry como breadcrumb.
5) Alertas:
   - Alertar picos de 5xx/timeouts e taxas anormais de 400 por `brandId`.

# Regras de segurança
- Nunca enviar payload completo com dados sensíveis; use redaction/masking.
- Não logar tokens/segredos; não incluir DSN em código-fonte.
- Manter amostragem baixa em produção para evitar custo ruído.
- Não usar Sentry CLI até constar como aprovado no registry e em `cli-reference.yaml`.

# Exemplos rápidos
- Env (exemplo):\
  `SENTRY_DSN=***`\
  `SENTRY_ENVIRONMENT=staging`\
  `SENTRY_TRACES_SAMPLE_RATE=0.1`\
  `SENTRY_PROFILES_SAMPLE_RATE=0.05`
- SDK (pseudo): inicializar com `beforeSend(event) { redigirPII(event); return event; }` e adicionar `setContext` com `brandId/userId`.
