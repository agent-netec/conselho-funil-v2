# Architecture Review: Sprint 32 — Social Integration 2.0 + Rate Limiting

**Versao:** 1.0
**Responsavel:** Athos (Architect)
**Status:** APROVADO COM RESSALVAS (8 Decision Topics, 2 Blocking)
**Data:** 08/02/2026
**PRD Referencia:** `prd-sprint-32-social-rate-limiting.md` (Iuran)

---

## 1. Escopo do Review

Validacao arquitetural de 4 items core + 1 STRETCH da Sprint 32:
- **S32-RL:** Rate Limiting por brandId (wrapper + Firestore counters)
- **S32-IG:** Instagram Graph API Real (adapter + vault + token refresh)
- **S32-LI:** LinkedIn API Scaffold (adapter minimo + vault check)
- **S32-RE:** Social Response Engine (prompt real + RAG + toneMatch)
- **S32-BV:** (STRETCH) BrandVoice Translator 2.0

---

## 2. Decision Topics (DT-01 a DT-08)

### DT-01: Rate Limiter — Firestore Document Structure (BLOCKING)

**Problema:** O PRD especifica `brands/{brandId}/rate_limits/{scope}` com campos `count` e `windowStart`. Porem, Firestore `increment()` atomico nao suporta operacao condicional (reset + increment no mesmo write). Se dois requests chegam no mesmo momento em que a window expira, ambos podem resetar o contador.

**Opcoes:**
- A) Transaction: `runTransaction()` para ler windowStart, verificar expiração, resetar ou incrementar
- B) Dual-field: `count` + `windowStart` com logica no wrapper (read-then-write com retry)
- C) Single-doc TTL: documento com Firestore TTL policy (auto-delete apos windowMs)

**Decisao: Opcao A (Transaction)**
Justificativa: `runTransaction()` e atomico e garante consistencia. Overhead de ~20-30ms e aceitavel para rate limiting. O pattern e:
```
runTransaction: 
  1. getDoc(rate_limits/{scope})
  2. if (now - windowStart > windowMs) → setDoc(count=1, windowStart=now)
  3. else if (count >= maxRequests) → REJECT
  4. else → updateDoc(count: increment(1))
```

**Impacto:** S32-RL-01 deve usar `runTransaction()` ao inves de `increment()` direto.

---

### DT-02: Rate Limiter — Import Path do `requireBrandAccess` (BLOCKING)

**Problema:** Na S31, o import path correto e `@/lib/auth/brand-guard` (NAO `@/lib/guards/auth`). Darllyson deve usar o path correto.

**Decisao:** Import path e `@/lib/auth/brand-guard`. Validar no pre-flight.

**Impacto:** S32-RL-02 (aplicacao nas rotas).

---

### DT-03: Instagram Adapter — Token Storage Key

**Problema:** O MonaraTokenVault em `brands/{brandId}/secrets` usa chaves como `meta_ads`, `google_ads`. Para Instagram, qual chave usar?

**Opcoes:**
- A) `instagram` — chave dedicada
- B) `meta_social` — distinguir de `meta_ads`
- C) `instagram_graph` — explicito sobre qual API

**Decisao: Opcao A (`instagram`)**
Justificativa: Simples, claro, consistente com o `SocialPlatform` type que ja tem `'instagram'`. A chave armazena `{ accessToken, pageId, instagramBusinessAccountId, refreshToken, expiresAt }`.

---

### DT-04: Instagram Adapter — Graph API Version

**Problema:** O PRD especifica `v21.0` (mesma versao do Meta Ads na S30). Confirmar que Instagram Messaging API esta disponivel nesta versao.

**Decisao:** Usar `v21.0` para consistencia com Meta Ads adapter. Se necessario, parametrizar versao como constante `GRAPH_API_VERSION = 'v21.0'`.

---

### DT-05: LinkedIn Adapter — API Endpoint Selection

**Problema:** LinkedIn tem multiplas APIs com diferentes niveis de acesso:
- `socialActions` — requires Marketing API access
- `organizationAcls` — requires Organization Admin
- `ugcPosts` — deprecated
- `posts` — requires Community Management API

**Decisao:** Para o scaffold minimo, usar endpoint `GET /v2/me` (perfil basico) como health check de credentials. NAO implementar inbox real — apenas validacao de que as credentials funcionam. O `collectFromLinkedIn()` fica:
1. Check credentials no vault
2. Se credentials: valida com `GET /v2/me`, retorna `[]` (scaffold — implementacao real em S33+)
3. Se nao: retorna `[]` com log

Isso elimina o TODO sem prometer funcionalidade que nao temos aprovacao de API para entregar.

---

### DT-06: Response Engine — Gemini Output Format

**Problema:** O Response Engine precisa retornar `BrandVoiceSuggestion` com `options[].text`, `options[].tone`, `options[].confidence`. Gemini deve retornar JSON estruturado.

**Decisao:** Usar `responseMimeType: 'application/json'` (S28 pattern) + Zod schema `SocialResponseSchema` para validacao. Fallback: se parse falhar, gerar sugestao generica com `confidence: 0.5`.

---

### DT-07: Response Engine — RAG Context Source

**Problema:** O PRD pede "interacoes anteriores do mesmo autor" como contexto RAG. Onde estao essas interacoes?

**Analise:** Atualmente, interacoes sociais NAO sao persistidas no Firestore. O InboxAggregator coleta em tempo real e retorna. Nao ha collection `social_interactions`.

**Decisao:** Para S32, o RAG context sera:
1. Brand voice guidelines do BrandKit (`brands/{brandId}` → `brandKit.tone`, `brandKit.voice`)
2. Conteudo da interacao atual (texto, plataforma, sentimento)
3. NAO buscar historico do autor (nao existe storage)

Persistencia de interacoes e escopo de S33 (Content Autopilot). O Response Engine funciona sem historico — usa apenas brand context + interacao atual.

---

### DT-08: Contract-Map — Novos Paths

**Problema:** Novos modulos precisam ser registrados no contract-map:
- `lib/integrations/social/instagram-adapter.ts`
- `lib/integrations/social/linkedin-adapter.ts`
- `lib/agents/engagement/response-engine.ts`
- `lib/middleware/rate-limiter.ts`

**Decisao:** 
- Rate limiter → nova lane `rate_limiting` (cross-cutting concern)
- Instagram/LinkedIn adapters → lane `social_intelligence` (ja existe)
- Response Engine → lane `social_intelligence` (extensao do engagement)

---

## 3. Proibicoes Arquiteturais (PA-01 a PA-06)

| ID | Proibicao |
|:---|:----------|
| PA-01 | NAO usar Edge Runtime para rate limiting (Firestore nao disponivel no Edge) |
| PA-02 | NAO usar `increment()` sem transaction para rate limiting (race condition) |
| PA-03 | NAO persistir tokens em plaintext — sempre `encryptSensitiveFields()` |
| PA-04 | NAO fazer fetch para Instagram/LinkedIn sem verificar credentials primeiro |
| PA-05 | NAO usar `any` para responses de APIs externas — tipar com interfaces |
| PA-06 | NAO criar collections Firestore novas sem registrar no contract-map |

---

## 4. Estimativa Revisada (Athos)

| Fase | PRD Estimativa | Athos Revisada | Delta |
|:-----|:--------------|:---------------|:------|
| Fase 1: Rate Limiting | 3h | 3.5h | +0.5h (transaction pattern DT-01) |
| Fase 2: Instagram | 3.5h | 3.5h | 0 |
| Fase 3: LinkedIn + Response | 4h | 3.5h | -0.5h (LinkedIn scaffold simplificado DT-05) |
| Fase 4: Governanca | 0.25h | 0.25h | 0 |
| STRETCH | 1.5h | 1.5h | 0 |
| **Total core** | **10.75h** | **10.75h** | **0** |
| **Total com STRETCH** | **12.25h** | **12.25h** | **0** |

---

## 5. Pre-flight Checklist

- [ ] DT-01: Rate limiter usa `runTransaction()` (BLOCKING)
- [ ] DT-02: Import path `@/lib/auth/brand-guard` (BLOCKING)
- [ ] DT-03: Instagram credentials key = `instagram`
- [ ] DT-04: Graph API version = `v21.0`
- [ ] DT-05: LinkedIn scaffold = `GET /v2/me` health check only
- [ ] DT-06: Gemini output com `responseMimeType: 'application/json'` + Zod
- [ ] DT-07: RAG context = brand voice only (sem historico de autor)
- [ ] DT-08: Contract-map atualizado com novos paths

---

## 6. Veredito

**APROVADO COM RESSALVAS**

2 Blocking DTs (DT-01 transaction pattern, DT-02 import path) devem ser resolvidos antecipadamente no pre-flight. Os 6 DTs restantes sao nao-blocking mas devem ser seguidos.

Estimativa total mantida em ~10.75h core. Escopo coerente com capacidade da sprint.

---

*Architecture Review por Athos (Architect) | Sprint 32 | 08/02/2026*
