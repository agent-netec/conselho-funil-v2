# PRD: Social Integration 2.0 + Rate Limiting — Sprint 32

**Versao:** 1.0
**Responsavel:** Iuran (PM)
**Status:** Draft — Ready for Architecture Review
**Data:** 08/02/2026
**Predecessora:** Sprint 31 (Automation Engine & Rules Runtime) — CONCLUIDA (QA 99/100)
**Tipo:** Feature Sprint (Social & Rate Limiting)
**Estimativa Total:** ~9-11h core + ~1.5h STRETCH
**Deliberacao:** Veredito do Conselho (Party Mode) — 6 questoes, unanimidade

---

## 1. Contexto Estrategico

### 1.1 Baseline pos-Sprint 31

| Metrica | Valor |
|:--------|:------|
| Testes passando | 243/243 (44 suites, 0 fail) |
| TypeScript errors | 0 |
| Build | 105 rotas (Next.js App Router) |
| Trajetoria QA | S25(93) → S26(97) → S27(97) → S28(98) → Sigma(99) → S29(100) → S30(98) → **S31(99)** |
| Auth cobertura | 100% — `requireBrandAccess` em 25+ rotas brand-scoped |
| API formato | `createApiError`/`createApiSuccess` em 54+ rotas |
| Ads Integration | Meta + Google reais (S30) — REST puro, cache 15min, token refresh |
| Automation | Page real, Kill-Switch persist + Slack, Rules Runtime, DLQ (S31) |
| BYO Keys | MonaraTokenVault com AES-256 — `brands/{brandId}/secrets` |
| Novas deps npm | 0 (mantido desde S26) |

### 1.2 Por que Sprint 32: Social Integration 2.0 + Rate Limiting

O Conselho de Funil tem uma **Ala de Operacoes** com Social Command Center (S17) que opera com dados simulados. O InboxAggregator coleta do X via ScoutAgent/RSS, mas Instagram e LinkedIn retornam arrays vazios. O Social Response Engine e um stub. E o Rate Limiting foi adiado **4 vezes consecutivas** (S29→S30→S31→S32).

**Sprint 32 conecta o Agency Engine as redes sociais reais e implementa a governanca de uso.**

Tres problemas criticos:

1. **Instagram e LinkedIn sao arrays vazios** — `collectFromInstagram()` e `collectFromLinkedIn()` fazem `console.log(Not Implemented)` e retornam `[]`. O Unified Inbox nao tem dados de 2 das 4 plataformas prometidas.

2. **Social Response Engine e um placeholder** — O `SOCIAL_RESPONSE_PROMPT` e generico, nunca invocado efetivamente. O ResponseEditor exibe "Gerando sugestoes baseadas no BrandVoice..." mas nada e gerado.

3. **Rate Limiting NUNCA existiu** — Qualquer marca pode fazer requests ilimitados. Sem governanca de quota, um unico brandId pode saturar o Firestore e esgotar tokens do Gemini. 4a vez no roadmap — **NAO pode ser adiado novamente.**

### 1.3 Inventario de Stubs/TODOs a Eliminar (3 total)

| # | Arquivo | Linha(s) | TODO/Stub | Estado Atual |
|:--|:--------|:---------|:----------|:-------------|
| 1 | `lib/agents/engagement/inbox-aggregator.ts` | L47 | `TODO: Implementar integracao com LinkedIn API ou Scraping etico` | `collectFromLinkedIn()` retorna `[]` |
| 2 | `lib/agents/engagement/inbox-aggregator.ts` | L57 | `TODO: Implementar integracao com Instagram Graph API` | `collectFromInstagram()` retorna `[]` |
| 3 | `lib/ai/prompts/social-generation.ts` | L151-152 | `@stub Prompt de resposta social — placeholder para brand-voice-translator` | `SOCIAL_RESPONSE_PROMPT` generico, nunca invocado |

### 1.4 Funcionalidade NOVA sem stub (1 total)

| # | Item | Justificativa |
|:--|:-----|:-------------|
| 0 | Rate Limiting por brandId | Heranca S29→S30→S31. P0 obrigatorio. 4a vez no roadmap. |

---

## 2. Objetivo da Sprint

> **"Implementar Rate Limiting por brandId como guardrail de producao, conectar Instagram Graph API e LinkedIn API ao InboxAggregator com degradacao graciosa, e tornar o Social Response Engine funcional com prompt real + RAG context + toneMatch scoring — completando o Social Command Center como motor operacional."**

### 2.1 North Star Metrics

| Metrica | Antes (S31) | Meta (S32) |
|:--------|:-----------|:-----------|
| Rate Limiting | **Inexistente** | **Funcional** (4 rotas, Firestore counters) |
| Instagram inbox | **`[]`** (hardcoded vazio) | **Dados reais** (quando credentials configuradas) |
| LinkedIn inbox | **`[]`** (hardcoded vazio) | **Adapter scaffold** (vault check + fetch basico) |
| Social Response Engine | **Stub** (prompt generico) | **Funcional** (RAG + toneMatch) |
| Stubs/TODOs eliminados | **3** | **0** |

### 2.2 Metricas Secundarias

| Metrica | Meta |
|:--------|:-----|
| Testes passando | >= 243/243 (zero regressao) + novos testes para rate limiter e adapters |
| TypeScript errors | 0 |
| Build (rotas) | >= 105 (zero perda) |
| QA Score | >= 98/100 |
| Novas dependencias npm | 0 |

---

## 3. Requisitos Funcionais

### RF-32.0: Rate Limiting por brandId (P0 — OBRIGATORIO)

| ID | Requisito | Detalhe |
|:---|:----------|:--------|
| RF-32.0.1 | Wrapper `withRateLimit()` | Funcao HOF que aceita `handler` + config `{ maxRequests, windowMs, scope }`. Aplica rate limiting antes de executar o handler. |
| RF-32.0.2 | Firestore counters | Collection `brands/{brandId}/rate_limits/{scope}` com campos `count` (number), `windowStart` (Timestamp). Usa `increment()` atomico. |
| RF-32.0.3 | Fixed window | Janela de tempo fixa por minuto. Quando `now - windowStart > windowMs`, reseta contador. |
| RF-32.0.4 | Resposta 429 | `createApiError(429, 'Rate limit exceeded', { code: 'RATE_LIMIT_EXCEEDED' })` com header `Retry-After` (segundos restantes na window). |
| RF-32.0.5 | 4 rotas iniciais | `/api/chat` (30/min), `/api/intelligence/audience/scan` (10/min), `/api/performance/metrics` (60/min), `/api/intelligence/spy` (5/min) |
| RF-32.0.6 | Isolamento brandId | Marca A nao afeta quota de marca B. Contadores completamente independentes. |
| RF-32.0.7 | Bypass admin | Rotas sem brandId (admin routes) NAO sao limitadas. |

### RF-32.1: Instagram Graph API Real (P1)

| ID | Requisito | Detalhe |
|:---|:----------|:--------|
| RF-32.1.1 | Adapter `instagram-adapter.ts` | Modulo em `lib/integrations/social/instagram-adapter.ts`. REST puro via `fetch()`. |
| RF-32.1.2 | Credentials vault | Busca tokens em `brands/{brandId}/secrets` (chave `instagram`). Se nao existir, retorna `[]` com log. |
| RF-32.1.3 | Fetch conversations | `GET https://graph.facebook.com/v21.0/me/conversations?fields=participants,messages{message,from,created_time}&platform=instagram` |
| RF-32.1.4 | Fetch messages | `GET https://graph.facebook.com/v21.0/{conversation-id}/messages?fields=message,from,created_time` |
| RF-32.1.5 | Token refresh | Reutiliza pattern de `refreshMetaToken()` do S30. Long-lived tokens via exchange endpoint. |
| RF-32.1.6 | Unificacao | Output mapeado para `SocialInteraction[]` via `InboxAggregator.unify()` existente. |
| RF-32.1.7 | Degradacao graciosa | Sem credentials: retorna `[]`. Token expired: tenta refresh 1x. Falha: retorna `[]` com erro logado. |

### RF-32.2: LinkedIn API Scaffold (P1)

| ID | Requisito | Detalhe |
|:---|:----------|:--------|
| RF-32.2.1 | Adapter `linkedin-adapter.ts` | Modulo em `lib/integrations/social/linkedin-adapter.ts`. REST puro. |
| RF-32.2.2 | Credentials vault | Busca tokens em `brands/{brandId}/secrets` (chave `linkedin`). |
| RF-32.2.3 | Fetch basico | `GET https://api.linkedin.com/v2/socialActions` (read-only). |
| RF-32.2.4 | Degradacao graciosa | Mesmo pattern do Instagram: sem credentials = `[]` + log. |
| RF-32.2.5 | Integracao aggregator | `collectFromLinkedIn()` atualizado para usar o adapter. TODO eliminado. |

### RF-32.3: Social Response Engine (P1)

| ID | Requisito | Detalhe |
|:---|:----------|:--------|
| RF-32.3.1 | Response Engine | Novo modulo `lib/agents/engagement/response-engine.ts` com funcao `generateSocialResponse(interaction, brandId)`. |
| RF-32.3.2 | Prompt redesenhado | `SOCIAL_RESPONSE_PROMPT` substituido por prompt estruturado com secoes: Interaction Context, Brand Voice Guidelines, RAG Context (historico do autor), Scoring Instructions. |
| RF-32.3.3 | RAG context | Busca interacoes anteriores do mesmo `author.id` no Firestore (max 5 ultimas). Injeta como contexto. |
| RF-32.3.4 | toneMatch scoring | Gemini retorna JSON com `options[]` contendo `text`, `tone`, `confidence` (como toneMatch 0.0-1.0). |
| RF-32.3.5 | Output como BrandVoiceSuggestion | Retorno mapeado para interface `BrandVoiceSuggestion` existente em `types/social-inbox.ts`. |
| RF-32.3.6 | Wiring na API | `/api/social-inbox` atualizado para chamar o response engine e retornar sugestoes reais. |
| RF-32.3.7 | Fallback | Se RAG retorna vazio ou Gemini falha: gera sugestao generica com `confidence: 0.5`. |

### RF-32.4: BrandVoice Translator 2.0 (STRETCH)

| ID | Requisito | Detalhe |
|:---|:----------|:--------|
| RF-32.4.1 | Engagement feedback | Coletar metricas de engagement das respostas enviadas (field `engagementScore` no Firestore). |
| RF-32.4.2 | Voice profile update | Respostas com alto engagement reforçam parametros do voice profile da marca. |

---

## 4. Requisitos Nao-Funcionais

| ID | Requisito | Criterio |
|:---|:----------|:---------|
| RNF-32.01 | Zero novas deps npm | `package.json` inalterado |
| RNF-32.02 | REST puro | Todas as chamadas externas via `fetch()`. Zero SDK novo. |
| RNF-32.03 | Rate Limiter latencia | Overhead < 50ms por request (Firestore read + increment) |
| RNF-32.04 | Instagram adapter latencia | < 3s para fetch de conversations (Graph API) |
| RNF-32.05 | Response Engine latencia | < 5s para gerar sugestoes (Gemini + RAG) |
| RNF-32.06 | Isolamento multi-tenant | Zero acesso cross-tenant em TODAS as funcionalidades |
| RNF-32.07 | Padroes Sigma | `createApiError`/`createApiSuccess`, `requireBrandAccess`, `Timestamp`, `force-dynamic` |

---

## 5. Fases de Implementacao

### Fase 1: Rate Limiting (P0) — Gate Check obrigatorio
| ID | Item | Estimativa |
|:---|:-----|:-----------|
| S32-RL-01 | `withRateLimit()` wrapper + Firestore counters | M (~1.5h) |
| S32-RL-02 | Aplicar nas 4 rotas + testes unitarios | M (~1.5h) |
| S32-GATE-01 | **Gate Check 1: tsc=0, testes passam, rate limiter funcional** | XS (~15min) |

### Fase 2: Instagram Graph API (P1)
| ID | Item | Estimativa |
|:---|:-----|:-----------|
| S32-IG-01 | Instagram Adapter (REST + vault + token refresh) | L (~2.5h) |
| S32-IG-02 | Integracao no InboxAggregator + testes | S+ (~1h) |
| S32-GATE-02 | **Gate Check 2: Instagram adapter funcional** | XS (~15min) |

### Fase 3: LinkedIn Scaffold + Response Engine (P1)
| ID | Item | Estimativa |
|:---|:-----|:-----------|
| S32-LI-01 | LinkedIn Adapter scaffold + aggregator wiring | S (~1h) |
| S32-RE-01 | Social Response Engine + prompt redesenhado | M+ (~2h) |
| S32-RE-02 | Wiring na API social-inbox + testes | S (~1h) |
| S32-GATE-03 | **Gate Check 3: LinkedIn scaffold + Response Engine funcional** | XS (~15min) |

### Fase 4: Governanca + STRETCH
| ID | Item | Estimativa |
|:---|:-----|:-----------|
| S32-GOV-01 | Contract-map update (novos paths) | XS (~15min) |
| S32-BV-01 | (STRETCH) BrandVoice Translator 2.0 | S (~1.5h) |

---

## 6. Proibicoes (P-01 a P-12)

| ID | Proibicao |
|:---|:----------|
| P-01 | NAO adicionar dependencias npm novas |
| P-02 | NAO usar `Date` no Firestore (usar `Timestamp`) |
| P-03 | NAO criar rotas sem `force-dynamic` quando dinamicas |
| P-04 | NAO fazer requests cross-tenant (brandId misturado) |
| P-05 | NAO usar `firebase-admin` (ambiente Windows 11) |
| P-06 | NAO usar SDKs nativos (REST puro via fetch) |
| P-07 | NAO modificar modulos protegidos de sprints anteriores sem justificativa |
| P-08 | NAO usar `any` sem justificativa documentada |
| P-09 | NAO remover testes existentes |
| P-10 | NAO alterar formatos de resposta API (manter `createApiError`/`createApiSuccess`) |
| P-11 | NAO criar middleware Edge Runtime (nao tem acesso a Firestore) |
| P-12 | NAO adiar Rate Limiting novamente |

---

## 7. Criterios de Sucesso (CS-32.01 a CS-32.15)

| ID | Criterio | Verificacao |
|:---|:---------|:-----------|
| CS-32.01 | `withRateLimit()` aplicado em 4 rotas | Grep confirma wrapper nas 4 rotas |
| CS-32.02 | Firestore counters com `increment()` atomico | Code review do rate-limiter.ts |
| CS-32.03 | Resposta 429 com `Retry-After` header | Teste unitario |
| CS-32.04 | Isolamento brandId no rate limiter | Teste unitario (marca A vs marca B) |
| CS-32.05 | Instagram adapter busca credentials do vault | Code review |
| CS-32.06 | Instagram adapter retorna `[]` sem credentials | Teste unitario |
| CS-32.07 | Instagram adapter faz fetch real com credentials | Code review do fetch path |
| CS-32.08 | LinkedIn adapter com vault check | Code review |
| CS-32.09 | `collectFromLinkedIn()` TODO eliminado | Grep confirma ausencia do TODO |
| CS-32.10 | `collectFromInstagram()` TODO eliminado | Grep confirma ausencia do TODO |
| CS-32.11 | `SOCIAL_RESPONSE_PROMPT` @stub eliminado | Grep confirma ausencia do @stub |
| CS-32.12 | Response Engine gera `BrandVoiceSuggestion` | Teste unitario |
| CS-32.13 | tsc --noEmit = 0 erros | Build check |
| CS-32.14 | npm test = todos passam + novos | Test runner |
| CS-32.15 | npm run build = sucesso | Build check |

---

## 8. Dependencias

| Dependencia | Status |
|:-----------|:-------|
| Sprint 31 concluida (QA 99/100) | ✅ Confirmada |
| BYO Keys / MonaraTokenVault (S18) | ✅ Confirmada |
| `encryptSensitiveFields` / `decryptSensitiveFields` (S30) | ✅ Confirmada |
| `createApiError`/`createApiSuccess` (Sigma) | ✅ 54+ rotas |
| `requireBrandAccess` (Sigma) | ✅ 25+ rotas |
| InboxAggregator com `unify()` funcional (S17) | ✅ Confirmada |
| BrandVoiceTranslator com `generateSuggestions()` (S17) | ✅ Confirmada |
| ResponseEditor UI com `BrandVoiceSuggestion` (S17) | ✅ Confirmada |
| SocialInteraction types (S17) | ✅ Confirmada |
| Firebase Firestore (Client SDK) | ✅ Configurado |
| Nenhum MCP/CLI novo | ✅ N/A |
| Nenhuma dependencia npm nova | ✅ N/A |

---

*PRD formalizado por Iuran (PM) sob aprovacao do Alto Conselho.*
*Sprint 32: Social Integration 2.0 + Rate Limiting | 08/02/2026*
