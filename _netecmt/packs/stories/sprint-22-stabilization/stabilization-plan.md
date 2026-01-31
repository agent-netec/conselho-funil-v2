# ST-22-00 — Plano de estabilização (prioridades + checklist)

> Base: rotas em `app/src/app/api/**` e `.env.example`.

## Prioridades (P0/P1)

### P0 — indisponibilidade direta do core
- `POST /api/intelligence/keywords` — mineração crítica + Firestore.
- `POST /api/intelligence/autopsy/run` — scraping + Gemini (alto risco 422/500).
- `POST /api/intelligence/spy` — Firestore + scanners externos.
- `POST /api/chat` — Gemini + Pinecone + Firestore (core de uso).
- `POST /api/ingest/url` — scraping + Gemini Vision + Firestore.
- `GET /api/assets/metrics` — Pinecone; impacta dashboards.

### P1 — suporte/expansão operacional
- Copy/Social/Design (`/api/copy/*`, `/api/social/*`, `/api/design/*`)
- Reporting/Performance (`/api/reporting/*`, `/api/performance/*`)
- Webhooks (`/api/webhooks/*`, `/api/integrations/offline-conversion`)
- Admin (`/api/admin/*`)

## Sequencia de execucao (ordem recomendada)
1) **Gate de envs globais**: validar checklist local + Vercel (P0 antes de tudo).
2) **Smoke tests P0**: executar endpoints de Inteligencia/Chat/Ingest/Assets.
3) **Correcoes P0**: tratar 500/422/JSON invalido e falhas de persistencia.
4) **Smoke tests P0 novamente**: confirmar 200/400/401/404/422 sem 500.
5) **P1 por blocos**: Copy/Social/Design -> Reporting/Performance -> Webhooks/Admin.
6) **QA + evidencia**: registrar resultados de smoke test e diffs de envs.

## Criterios de pronto (Definition of Done)
- Envs globais criticas validadas em local e Vercel (checklist preenchido).
- Smoke tests P0 executados e sem 500 nas rotas criticas.
- Erros 400/401/404/422 com mensagens tratadas (sem crash).
- Respostas nao-JSON tratadas sem quebra de parse.
- Registro de falhas com payload minimo + status + stack quando houver.
- QA confirma estabilidade basica apos deploy.

## Diagnóstico rápido por etapa (execução sugerida)

1) **Validação de envs** (local + Vercel)
- Conferir chaves mínimas por módulo (lista abaixo).
- Erro esperado quando ausente: 500 (Gemini/Pinecone/Firestore), 401 em webhooks.

2) **Smoke tests por endpoint**
- Testes com payload mínimo válido.
- Confirmar 400 em validações e 200 com payload completo.
- Registrar 422 (scraping) e 401 (webhooks) separadamente.

3) **Resiliência externa**
- Timeouts/retries e erros de fetch (Gemini/Pinecone/scraping).
- Falhas intermitentes devem devolver mensagem amigável + stack logado.

4) **Persistência**
- Verificar `db` inicializado (Firebase) e permissões de coleção.
- Conferir se o endpoint usa Firestore com `db` possivelmente nulo.

## Checklist de variáveis de ambiente (por módulo)

### Firebase (impacto amplo)
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
> Usado por praticamente todas as rotas que dependem de Firestore.

### Google AI / Gemini
- `GOOGLE_AI_API_KEY`
- `NEXT_PUBLIC_GOOGLE_AI_API_KEY`
- `GEMINI_MODEL` (default: `gemini-2.0-flash-exp`)
> Crítico para `chat`, `copy`, `social`, `design`, `autopsy`, `ingest/url` (Vision).

### Pinecone
- `PINECONE_API_KEY`
- `PINECONE_INDEX_NAME`
- `PINECONE_HOST`
> Crítico para `assets/metrics`, RAG e migração (`/api/pinecone/*`).

### Webhooks & Segurança
- `CAMPAIGN_WEBHOOK_SECRET`
- `CAMPAIGN_WEBHOOK_SECRET_SECONDARY`
- `NEXT_PUBLIC_ENCRYPTION_KEY`
> Crítico para `webhooks/ads-metrics` e criptografia.

### App & Operação
- `NEXT_PUBLIC_APP_URL`
- `SKIP_AUTH`
> Necessário para links e fluxos internos.

### Social Command Center
- `INSTAGRAM_API_KEY`
- `WHATSAPP_BUSINESS_ID`
- `WHATSAPP_ACCESS_TOKEN`
- `LINKEDIN_CLIENT_ID`
- `LINKEDIN_CLIENT_SECRET`
- `SOCIAL_INBOX_WEBHOOK_SECRET`
> Impacta `social-inbox` e integrações sociais.

### IA Voice & Sentiment
- `BRAND_VOICE_TRANSLATOR_MODEL`
- `SENTIMENT_ANALYSIS_THRESHOLD`
> Impacta motores de tradução/engajamento.

## Cruzamento com erros reais (pendente de acesso)

Não tenho acesso direto ao Sentry/logs por governança. Assim que o acesso for liberado ou exportado, cruzar:
- **Top 10 erros 5xx por endpoint** (últimos 7 dias).
- **Top 10 erros 4xx por endpoint** (400/401/404/422).
- **Mensagens-chave**: `Gemini API not configured`, `Falha ao buscar imagem`, `Firebase não inicializado`, `Invalid signature`, `Pinecone`.
- **Correlação por `brandId`/`userId`** para detectar falhas concentradas.

Checklist de evidências a coletar:
- rota + status + payload mínimo
- stack trace completo
- latência e taxa de erro
- env/feature flag ativo no momento do erro

