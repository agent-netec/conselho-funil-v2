# Allowed Context — Sprint 32: Social Integration 2.0 + Rate Limiting
**Preparado por:** Leticia (SM)
**Data:** 08/02/2026
**Sprint:** 32
**Destinatario:** Darllyson (Dev)

> **REGRA ABSOLUTA:** Darllyson so pode ler e modificar os arquivos listados abaixo. Qualquer arquivo fora desta lista requer aprovacao explicita da SM (Leticia) ou do Arch (Athos).

---

## LEITURA OBRIGATORIA (Ler ANTES de iniciar qualquer story)

| # | Arquivo | Conteudo |
|:--|:--------|:---------|
| R-01 | `_netecmt/solutioning/prd/prd-sprint-32-social-rate-limiting.md` | PRD completo com requisitos e Success Criteria |
| R-02 | `_netecmt/solutioning/architecture/arch-sprint-32.md` | Architecture Review com 8 DTs e 2 Blocking |
| R-03 | `_netecmt/packs/stories/sprint-32-social-rate-limiting/stories.md` | Este documento de stories com ACs detalhados |
| R-04 | `_netecmt/packs/stories/sprint-32-social-rate-limiting/story-pack-index.md` | Indice do pack com fases e dependencias |

---

## PODE MODIFICAR (Arquivos alvo da sprint)

### Novos Arquivos (CRIAR)

| # | Arquivo | Story | Descricao |
|:--|:--------|:------|:----------|
| M-01 | `app/src/lib/middleware/rate-limiter.ts` | S32-RL-01 | Rate Limiter core (withRateLimit HOF) |
| M-02 | `app/src/lib/integrations/social/instagram-adapter.ts` | S32-IG-01 | Instagram Graph API adapter (REST puro) |
| M-03 | `app/src/lib/integrations/social/linkedin-adapter.ts` | S32-LI-01 | LinkedIn adapter scaffold |
| M-04 | `app/src/lib/agents/engagement/response-engine.ts` | S32-RE-01 | Social Response Engine (Gemini + Zod) |

### Arquivos Existentes (MODIFICAR)

| # | Arquivo | Story | Modificacao |
|:--|:--------|:------|:-----------|
| M-05 | `app/src/lib/agents/engagement/inbox-aggregator.ts` | S32-IG-02, S32-LI-01 | Substituir TODOs L47 e L57 por adapters reais |
| M-06 | `app/src/lib/ai/prompts/social-generation.ts` | S32-RE-01 | Redesenhar SOCIAL_RESPONSE_PROMPT (remover @stub/@todo) |
| M-07 | `app/src/app/api/social-inbox/route.ts` | S32-RE-02 | Chamar Response Engine para sugestoes reais |
| M-08 | `app/src/app/api/chat/route.ts` | S32-RL-02 | Adicionar withRateLimit (30 req/min) |
| M-09 | `app/src/app/api/intelligence/audience/scan/route.ts` | S32-RL-02 | Adicionar withRateLimit (10 req/min) |
| M-10 | `app/src/app/api/performance/metrics/route.ts` | S32-RL-02 | Adicionar withRateLimit (60 req/min) |
| M-11 | `app/src/app/api/intelligence/spy/route.ts` | S32-RL-02 | Adicionar withRateLimit (5 req/min) |

### Governanca (MODIFICAR)

| # | Arquivo | Story | Modificacao |
|:--|:--------|:------|:-----------|
| M-12 | `_netecmt/core/contract-map.yaml` | S32-GOV-01 | Registrar novas lanes e paths |

### Testes (CRIAR)

| # | Arquivo | Story | Descricao |
|:--|:--------|:------|:----------|
| T-01 | `app/src/__tests__/lib/middleware/rate-limiter.test.ts` | S32-RL-02 | Testes rate limiter (4+) |
| T-02 | `app/src/__tests__/lib/integrations/instagram-adapter.test.ts` | S32-IG-02 | Testes Instagram adapter |
| T-03 | `app/src/__tests__/lib/agents/response-engine.test.ts` | S32-RE-02 | Testes Response Engine |

---

## PODE LER (Referencia — NAO MODIFICAR)

### Utilitarios e Patterns

| # | Arquivo | Conteudo Relevante |
|:--|:--------|:-------------------|
| L-01 | `app/src/lib/utils/api-response.ts` | `createApiError(status, message, details?)` / `createApiSuccess(data)` — pattern obrigatorio para todas as rotas |
| L-02 | `app/src/lib/utils/encryption.ts` | `encrypt(text)` / `decrypt(text)` — pattern para vault credentials |
| L-03 | `app/src/lib/auth/brand-guard.ts` | `requireBrandAccess(req, brandId)` — guard obrigatorio em rotas brand-scoped. **IMPORT PATH CORRETO: `@/lib/auth/brand-guard`** (DT-02 BLOCKING) |

### Types

| # | Arquivo | Types Relevantes |
|:--|:--------|:-----------------|
| L-04 | `app/src/types/social-inbox.ts` | `SocialInteraction`, `BrandVoiceSuggestion` |
| L-05 | `app/src/types/social.ts` | `SocialResponse`, `VoiceGuidelines` |
| L-06 | `app/src/types/social-platform.ts` | `SocialPlatform` enum |

### Adapters de Referencia

| # | Arquivo | Pattern Reutilizado |
|:--|:--------|:-------------------|
| L-07 | `app/src/lib/automation/adapters/meta.ts` | Pattern REST puro + token refresh para Instagram adapter (DT-04) |

### AI & Firebase

| # | Arquivo | Conteudo Relevante |
|:--|:--------|:-------------------|
| L-08 | `app/src/lib/ai/gemini.ts` | `generateWithGemini(prompt, options?)` — usado no Response Engine (DT-06) |
| L-09 | `app/src/lib/firebase/config.ts` | `db` — instancia Firestore. `Timestamp` importado de `firebase/firestore` |
| L-10 | `app/src/lib/firebase/scoped-data.ts` | `getBrandKit(brandId)` — para voice guidelines no Response Engine (DT-07) |

### UI Consumer (Referencia de contrato)

| # | Arquivo | Conteudo Relevante |
|:--|:--------|:-------------------|
| L-11 | `app/src/components/social-inbox/response-editor.tsx` | UI que consome `BrandVoiceSuggestion` — validar que o shape de output do Response Engine e compativel |

---

## PROIBICOES ABSOLUTAS

| # | Proibicao | Motivo |
|:--|:----------|:-------|
| P-01 | ZERO deps npm novas | Padrao Sigma — REST puro via fetch() |
| P-02 | NUNCA usar `Date` — sempre `Timestamp` | Consistencia Firestore |
| P-03 | NUNCA importar `firebase-admin` | Client SDK apenas |
| P-04 | NUNCA ler/modificar arquivos fora desta lista | Isolamento de contexto |
| P-05 | NUNCA omitir `force-dynamic` em novas rotas | Next.js dynamic routes |
| P-06 | NUNCA omitir `requireBrandAccess` em rotas brand-scoped | Multi-tenant isolation |
| P-07 | NUNCA usar `@/lib/guards/auth` | Path ERRADO — usar `@/lib/auth/brand-guard` (DT-02) |
| P-08 | NUNCA fazer rate limit sem `runTransaction()` | Atomicidade obrigatoria (DT-01) |

---

## DECISION TOPICS (DTs) — Resumo Rapido

| DT | Prioridade | Status | Resumo |
|:---|:-----------|:-------|:-------|
| DT-01 | P0 BLOCKING | RESOLVIDO | Rate limiter DEVE usar `runTransaction()` |
| DT-02 | P0 BLOCKING | RESOLVIDO | Import path: `@/lib/auth/brand-guard` |
| DT-03 | P1 | RESOLVIDO | Instagram credentials em `brands/{brandId}/secrets/instagram` |
| DT-04 | P1 | RESOLVIDO | Token refresh reutiliza pattern Meta Ads |
| DT-05 | P1 | RESOLVIDO | LinkedIn scaffold minimo — inbox real Sprint 34 |
| DT-06 | P1 | RESOLVIDO | Gemini com `responseMimeType: 'application/json'` |
| DT-07 | P1 | RESOLVIDO | RAG = brand voice (sem historico de autor) |
| DT-08 | P2 | RESOLVIDO | Contract-map atualizado com novas lanes |

---
*Allowed Context preparado por Leticia (SM) — NETECMT v2.0*
*Sprint 32: Social Integration 2.0 + Rate Limiting | 08/02/2026*
