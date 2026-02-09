# 🔧 PRD: Sprint 29 — Assets & Persistence Hardening

**Versao:** 1.0  
**Responsavel:** Iuran (PM)  
**Status:** 📋 Pronto para Arch Review (Athos)  
**Data:** 07/02/2026  
**Tipo:** Hybrid (Cleanup 25% + Feature 75%)  
**Predecessora:** Sprint Sigma (Sub-Sprint de Consistencia) — ✅ CONCLUIDA (QA 99/100)  
**Posicao:** Sequencia natural apos Sprint Sigma — primeira sprint feature pos-estabilizacao  
**Deliberacao:** Aprovada pelo Alto Conselho — escopo definido na deliberacao pre-Sigma, refinado apos conclusao

---

## 1. Contexto e Motivacao

### Baseline Pos-Sprint Sigma

A Sprint Sigma foi concluida com excelencia, elevando o QA score para **99/100** e consolidando a trajetoria ascendente de qualidade:

```
S25 (93) → S26 (97) → S27 (97) → S28 (98) → Sigma (99) → S29 (meta: 99 ou 100)
```

| Metrica | Valor Pos-Sigma |
|:--------|:----------------|
| Testes passando | **224/224** (42 suites, 0 fail) |
| TypeScript errors | **0** |
| Build | **103+ rotas** (Next.js 16.1.1 Turbopack) |
| Auth rotas API | **12/12 blindadas** (3 categorias) |
| Tipos duplicados | **0** (1 source of truth por entidade) |
| Formato de erro API | **1 unificado** (createApiError/createApiSuccess em 53+ rotas) |
| Pinecone client | **1 unico** (pinecone.ts) |
| Chat state | **1 source of truth** (useConversations) |
| chat-input-area.tsx | **143 linhas** (era 428 — 4 hooks extraidos) |

### O que a Sprint Sigma resolveu (e por que S29 agora e viavel)

A Sprint Sigma eliminou toda a divida tecnica P0 e P1 da auditoria, criando uma fundacao solida para features:

| Categoria | Antes (S28) | Apos Sigma | Impacto para S29 |
|:----------|:------------|:-----------|:-----------------|
| Auth rotas | 12 vulneraveis | 0 | Novas rotas seguem padrao `requireBrandAccess` |
| Tipos duplicados | 5 entidades x2-x3 | 0 | Novas interfaces sao construidas sobre types consolidados |
| Formato API | 5 formatos | 1 unificado | Novas rotas usam `createApiError`/`createApiSuccess` |
| Credit tracking | 0/10 rotas | 10/10 | Padrao estabelecido para novas rotas |
| Pinecone | 2 clients | 1 | Busca vetorial simplificada |
| Chat state | 2 fontes | 1 | Estado consolidado |

### O que a Sprint Sigma NAO resolveu (escopo S29)

A Sprint Sigma, por design (P11: "NUNCA remover stubs/TODOs de S29+"), preservou intactos **8 stubs/TODOs residuais** que representam funcionalidade faltante — nao divida tecnica. Estes itens sao o nucleo da Sprint 29:

| # | Stub/TODO | Arquivo | Tipo |
|:--|:----------|:--------|:-----|
| 1 | Hook stub `useIntelligenceAssets()` — retorna array vazio | `app/src/lib/hooks/use-intelligence-assets.ts` | Feature stub |
| 2 | Panel stub `AssetsPanel` — mostra "Em desenvolvimento" | `app/src/components/intelligence/discovery/assets-panel.tsx` | Feature stub |
| 3 | Funcao stub `processAssetText()` — corpo vazio | `app/src/lib/firebase/assets.ts` (L194-196) | Feature stub |
| 4 | TODO persistir autopsy no Firestore | `app/src/app/api/intelligence/autopsy/run/route.ts` (L81) | Persistence gap |
| 5 | TODO persistir offer no Firestore | `app/src/app/api/intelligence/offer/save/route.ts` (L54-55) | Persistence gap |
| 6 | `LeadState` interface stub com `[key: string]: unknown` | `app/src/types/personalization.ts` (L56-64) | Type stub |
| 7 | `AIAnalysisResult` interface stub com `[key: string]: unknown` | `app/src/types/reporting.ts` (L62-67) | Type stub |
| 8 | `ReportMetrics` interface stub com `[key: string]: unknown` | `app/src/types/reporting.ts` (L74-79) | Type stub |

Alem disso, o QA Sigma identificou 2 observacoes P2 pendentes:

| # | Item P2 | Arquivo | Nota |
|:--|:--------|:--------|:-----|
| 9 | Webhook dispatcher com formato de erro legado (8 pontos `{ error: 'string' }`) | `app/src/app/api/webhooks/dispatcher/route.ts` | OBS-01 QA Sigma |
| 10 | Webhook ads-metrics com formato de erro legado | `app/src/app/api/webhooks/ads-metrics/route.ts` | OBS-01 QA Sigma |

E a nota N1 do Arch Review S28:

| # | Item N1 | Arquivo | Nota |
|:--|:--------|:--------|:-----|
| 11 | `budget-optimizer.ts` nao registrado no contract-map | `app/src/lib/automation/budget-optimizer.ts` | N1 S28 |

### Por que S29 agora

1. **Fundacao blindada:** Sigma consolidou auth, tipos, formato de erro — agora podemos construir features com confianca
2. **Discovery Hub vazio:** O painel de assets esta em branco para o usuario (3 stubs) — gap de experiencia critico
3. **Persistencia faltante:** Autopsy e Offer geram resultados mas NAO salvam — o usuario perde o trabalho ao navegar
4. **Prerequisito para S30 (Ads):** A persistencia funcional e necessaria antes de integrar Meta/Google Ads (S30 depende de S29)
5. **Meta QA 100/100:** Com apenas 1 ponto de deducao (webhooks cosmético), S29 pode alcancar o score perfeito

---

## 2. Objetivo da Sprint

> **"Eliminar os 8 stubs/TODOs residuais do codebase, implementar persistencia funcional no Firestore para Autopsy e Offer, preencher o Discovery Hub Assets com dados reais, expandir LeadState com campos derivados do Propensity Engine, e fechar os 3 itens de cleanup pendentes — mantendo zero regressao no baseline de 224 testes, tsc=0 e build sucesso."**

### North Star Metrics

| Metrica | Antes (Sigma) | Meta (S29) |
|:--------|:-------------|:-----------|
| Stubs/TODOs funcionais residuais | **8** | **0** |
| Discovery Hub Assets | **Painel vazio** (3 stubs) | **Painel funcional** com cards, fetch real, processamento |
| Persistencia Autopsy + Offer | **0/2** (gera mas nao salva) | **2/2** (Firestore save funcional) |

### Metricas Secundarias

| Metrica | Antes (Sigma) | Meta (S29) |
|:--------|:-------------|:-----------|
| LeadState campos tipados | 2 + catch-all `unknown` | 8+ campos reais (derivados do Propensity) |
| Reporting types ativos | 0/2 (stubs com `[key: string]: unknown`) | 2/2 (campos concretos, `briefing-bot` consumindo) |
| Webhook routes com formato legado | 2 (dispatcher + ads-metrics) | 0 (migrados para `createApiError`) |
| `budget-optimizer.ts` no contract-map | Ausente | Registrado na lane correta |
| Testes passando | 224/224 | >= 224/224 (zero regressao) |
| TypeScript errors | 0 | 0 |
| Build | 103+ rotas | >= 103+ rotas |
| QA Score | 99/100 | **99/100 ou 100/100** |

---

## 3. Escopo

### 3.1 FASE 1: Cleanup (Gate) — ~2-3h

> **Gate obrigatorio.** Items de divida tecnica herdados de Sigma e S28. DEVEM ser concluidos e validados antes de iniciar features. Fase rapida (XS-S) que garante consistencia antes de construir.

| ID | Item | Descricao | Esforco | Arquivos |
|:---|:-----|:----------|:--------|:---------|
| **S29-CL-01** | **contract-map: registrar budget-optimizer** | Registrar `app/src/lib/automation/budget-optimizer.ts` na lane correta do `contract-map.yaml`. O arquivo pertence a lane `automation` (mesmo path pattern de `engine.ts`). Adicionar path `app/src/lib/automation/budget-optimizer.ts` na lane existente ou criar sub-lane `budget_optimization` se Athos preferir. Nota N1 do Arch Review S28 | **XS** (~15min) | `_netecmt/core/contract-map.yaml` |
| **S29-CL-02** | **Reporting types: ativar AIAnalysisResult e ReportMetrics** | Remover `[key: string]: unknown` catch-all de ambas interfaces. Preencher com campos concretos derivados do consumer real (`briefing-bot.ts`): `AIAnalysisResult` precisa de `summary: string`, `insights: string[]`, `recommendations: string[]`, `confidence?: number`, `dataContext?: string`. `ReportMetrics` precisa de `roi: number`, `adSpend: number`, `ltvMaturation: number`, `cpa?: number`, `roas?: number`. Remover marcacao `@stub` e `@todo` | **XS** (~20min) | `app/src/types/reporting.ts`, `app/src/lib/reporting/briefing-bot.ts` |
| **S29-CL-03** | **processAssetText() stub: implementar ou remover** | O stub em `assets.ts` (L194-196) tem corpo vazio. Duas opcoes: (A) Implementar processamento real se Discovery Hub Assets (S29-FT-01) precisar dele, ou (B) Se o processamento for feito de outra forma, remover o stub e atualizar qualquer caller. Decisao final no Arch Review | **S** (~45min) | `app/src/lib/firebase/assets.ts` |
| **S29-CL-04** | **Webhook routes: migrar para createApiError** | Migrar os 8 pontos de erro legado `{ error: 'string' }` em `webhooks/dispatcher/route.ts` e os ~6 pontos em `webhooks/ads-metrics/route.ts` para `createApiError()`. Manter semantica identica (mesmos status codes e mensagens). Item P2 da OBS-01 do QA Sigma. Usar `createApiError` de `@/lib/utils/api-response` (ja existe desde SIG-API-01) | **XS** (~30min) | `app/src/app/api/webhooks/dispatcher/route.ts`, `app/src/app/api/webhooks/ads-metrics/route.ts` |

**GATE CHECK (antes de iniciar Fase 2):**
- [ ] S29-CL-01: `budget-optimizer.ts` registrado no contract-map
- [ ] S29-CL-02: `AIAnalysisResult` e `ReportMetrics` sem catch-all `[key: string]: unknown`
- [ ] S29-CL-03: `processAssetText()` implementado ou removido (zero stubs vazios)
- [ ] S29-CL-04: Zero respostas de erro em formato legado nos webhooks (todas usam `createApiError`)
- [ ] `npx tsc --noEmit` = 0 erros
- [ ] `npm run build` sucesso
- [ ] `npm test` >= 224/224 pass, zero regressao

---

### 3.2 FASE 2: Feature — ~10-14h

> **Nucleo da Sprint.** Features novas que preenchem lacunas funcionais do produto. Cada item implementa funcionalidade real onde antes havia stubs ou TODOs.

| ID | Item | Descricao | Esforco | Arquivos Impactados |
|:---|:-----|:----------|:--------|:--------------------|
| **S29-FT-01** | **Discovery Hub Assets — hook real + panel com cards + Firestore fetch** | **(A) Hook `useIntelligenceAssets(brandId)`:** Substituir o stub atual por implementacao real. O hook deve buscar assets de inteligencia da collection `brands/{brandId}/intelligence_assets` no Firestore, retornando `{ assets: IntelligenceAsset[], loading: boolean, error: string | null, refetch: () => void }`. Tipos de asset: scans de audiencia, relatorios de autopsy, ofertas salvas, dossiers de competidores. **(B) Panel `AssetsPanel`:** Substituir placeholder por painel real com grid de cards. Cada card mostra: tipo do asset (icone), nome, data de criacao, status (ready/processing/error), preview resumido. Permitir click para expandir detalhes. Usar componentes shadcn/ui existentes (Card, Badge, Skeleton para loading). Dark theme consistente com o resto da Intelligence Wing. **(C) Firestore integration:** Usar `getBrandAssets(brandId)` de `lib/firebase/assets.ts` como base e/ou criar query especifica para `intelligence_assets`. Respeitar padrao `requireBrandAccess` para isolamento multi-tenant. **(D) Se `processAssetText()` (S29-CL-03) for mantido, integra-lo no fluxo de processamento de assets de inteligencia | **L** (~5-6h) | `app/src/lib/hooks/use-intelligence-assets.ts`, `app/src/components/intelligence/discovery/assets-panel.tsx`, `app/src/lib/firebase/assets.ts` (se processAssetText integrado), `app/src/app/intelligence/discovery/page.tsx` (consumer) |
| **S29-FT-02** | **Persistencia Autopsy + Offer (Firestore save real)** | **(A) Autopsy save:** Na rota `/api/intelligence/autopsy/run/route.ts` (L81), substituir `// TODO: Persistir no Firestore: brands/{brandId}/autopsies/{id}` por persistencia real. Salvar o `AutopsyRunResponse` em `brands/{brandId}/autopsies/{response.id}` usando `setDoc` com merge. Campos: `id`, `url`, `timestamp`, `report` (objeto completo), `brandId`, `depth`, `createdAt: Timestamp.now()`. Usar fire-and-forget (nao bloquear response) seguindo padrao do `PropensityEngine.fireAndForgetPersist()`. **(B) Offer save:** Na rota `/api/intelligence/offer/save/route.ts` (L54-55), descomentar e implementar o save real. Salvar `offerDoc` em `brands/{safeBrandId}/offers/{offerDoc.id}` usando `setDoc`. Campos ja estao montados no `offerDoc` (L28-52) — basta persistir. Remover o comentario TODO | **M** (~2-3h) | `app/src/app/api/intelligence/autopsy/run/route.ts`, `app/src/app/api/intelligence/offer/save/route.ts` |
| **S29-FT-03** | **LeadState expansion com campos reais do Propensity** | Expandir a interface `LeadState` em `personalization.ts` (L56-64) removendo o catch-all `[key: string]: unknown` e adicionando campos concretos derivados do `PropensityEngine` (S28-PS-03). Campos a adicionar: `segment: 'hot' | 'warm' | 'cold'` (derivado de `PropensityResult.segment`), `propensityScore: number` (0-1, derivado de `PropensityResult.score`), `reasoning: string[]` (derivado de `PropensityResult.reasoning`), `eventCount: number`, `lastEventType?: string`, `firstSeenAt: Timestamp`, `updatedAt: Timestamp`. Alinhar com os dados ja persistidos pelo `PropensityEngine.persistSegment()` em `brands/{brandId}/leads/{leadId}`. Verificar consumers de `LeadState` e atualizar se necessario. Remover marcacao `@stub` e `@todo` | **S** (~1-1.5h) | `app/src/types/personalization.ts`, `app/src/lib/intelligence/personalization/propensity.ts` (verificar alinhamento), `app/src/lib/intelligence/personalization/engine.ts` (consumer), `app/src/lib/intelligence/personalization/middleware.ts` (consumer) |
| **S29-FT-04** | **Rate Limiting por brandId (STRETCH)** | Implementar guardrails de quota por marca para prevenir abuso de API calls e scans de inteligencia. **(A) Schema Firestore:** Collection `brands/{brandId}/quotas/{period}` com campos: `apiCalls: number`, `aiCreditsUsed: number`, `scansToday: number`, `resetAt: Timestamp`. **(B) Guard function:** Criar `checkRateLimit(brandId: string, action: string): Promise<boolean>` em `lib/guards/rate-limiter.ts`. Incrementar contador no Firestore com `increment()`. Retornar false se limite excedido. Limites default: 100 scans/dia, 500 API calls/dia, 1000 AI credits/dia (configuravel por brand). **(C) Integrar nas rotas de alto consumo:** Intelligence scans (`audience/scan`, `autopsy/run`, `spy`), generation routes (`funnels/generate`, `social/generate`). Retornar `createApiError(429, 'Rate limit exceeded')` quando bloqueado. **(D) Dashboard:** Opcional — se houver tempo, adicionar indicador de quota no sidebar ou Intelligence Hub | **M** (~3-4h) | `app/src/lib/guards/rate-limiter.ts` (novo), `app/src/app/api/intelligence/*/route.ts` (integrar), `app/src/app/api/social/generate/route.ts` (integrar), `app/src/app/api/funnels/generate/route.ts` (integrar) |

**Nota:** S29-FT-04 (Rate Limiting) e classificado como **STRETCH**. Se o esforco das features core (FT-01 a FT-03) exceder o estimado, FT-04 pode ser movido para S30 sem impacto no North Star.

---

## 4. Fora de Escopo

> **EXPLICITAMENTE ADIADO.** Os itens abaixo NAO fazem parte da Sprint 29, mesmo que relacionados.

| Item | Sprint Sugerida | Justificativa |
|:-----|:---------------|:-------------|
| **Ads Integration (Meta/Google adapters reais)** | **S30** | Depende da persistencia funcional de S29. Escopo complexo (~18-24h) requer sprint dedicada |
| **Firebase gateway centralizado** (20+ imports diretos de `db`) | S31+ | Esforco de ~1 sprint dedicado — muito grande para S29 |
| **Worker process exit warning** (OBS-02 QA Sigma) | S30 | Investigar `--detectOpenHandles` — informativo, nao impacta resultados |
| **Inconsistencias de convencao** (`req` vs `request`, `loading` vs `isLoading`) | Backlog | Convencao, nao funcionalidade |
| P2 da auditoria (copy-paste cleanup, `AI_PRESETS` duplicado, styling misto) | Backlog | Items cosmeticos que NAO afetam funcionalidade |
| **Webhook DLQ (Dead Letter Queue)** | **S31** | Comentado no dispatcher (L59) — depende de automation engine funcional |
| **Automation Page Real** (substituir `MOCK_VARIATIONS`) | **S31** | Depende de Creative Engine real + rules runtime |
| **Social Integration real** (Instagram Graph API, LinkedIn) | **S32** | Depende de BYO Keys + inbox aggregator real |

---

## 5. Success Criteria

### Definition of Done (Sprint Level)

| # | Criterio | Validacao | Responsavel |
|:--|:---------|:----------|:-----------|
| **SC-01** | **Zero stubs/TODOs funcionais residuais** — todos os 8 stubs listados na secao 1 estao implementados ou removidos | Verificar cada arquivo: nenhum corpo vazio, nenhum `// TODO: Sprint XX`, nenhum `[key: string]: unknown` como catch-all | Dandara (QA) |
| **SC-02** | **Discovery Hub Assets funcional** — hook retorna dados reais do Firestore, panel exibe cards com tipo, nome, data e status | Navegar para `/intelligence/discovery`, verificar que o painel de Assets mostra dados (nao "Em desenvolvimento") | Dandara (QA) |
| **SC-03** | **Autopsy persiste no Firestore** — apos executar um scan, o resultado aparece em `brands/{brandId}/autopsies/{id}` | Executar POST `/api/intelligence/autopsy/run`, verificar documento criado no Firestore | Dandara (QA) |
| **SC-04** | **Offer persiste no Firestore** — apos salvar uma oferta, o documento aparece em `brands/{brandId}/offers/{id}` | Executar POST `/api/intelligence/offer/save`, verificar documento criado no Firestore | Dandara (QA) |
| **SC-05** | **LeadState com campos concretos** — interface sem catch-all `[key: string]: unknown`, com 8+ campos tipados alinhados com PropensityEngine | `rg "\[key: string\]: unknown" app/src/types/personalization.ts` retorna 0 para `LeadState` | Dandara (QA) |
| **SC-06** | **Reporting types ativos** — `AIAnalysisResult` e `ReportMetrics` sem catch-all, com campos concretos. `briefing-bot.ts` compila sem cast | `rg "\[key: string\]: unknown" app/src/types/reporting.ts` retorna 0 | Dandara (QA) |
| **SC-07** | **Zero formato de erro legado em webhooks** — `dispatcher` e `ads-metrics` usam exclusivamente `createApiError` | `rg "NextResponse.json.*error" app/src/app/api/webhooks/` retorna 0 (exceto re-exports) | Dandara (QA) |
| **SC-08** | **contract-map atualizado** — `budget-optimizer.ts` registrado em lane | `rg "budget-optimizer" _netecmt/core/contract-map.yaml` retorna 1+ match | Dandara (QA) |
| **SC-09** | **tsc=0, build sucesso, >= 224 testes pass, zero regressao** | `npx tsc --noEmit` = 0, `npm run build` sucesso, `npm test` >= 224 pass | Dandara (QA) |
| **SC-10** | **(STRETCH) Rate Limiting funcional** — rotas de alto consumo retornam 429 quando quota excedida | Enviar 101+ requests para rota limitada, verificar 429 | Dandara (QA) |

### Acceptance Criteria por Fase

**Fase 1 (Cleanup — GATE):**
- contract-map atualizado com budget-optimizer
- Reporting types sem catch-all
- processAssetText() implementado ou removido
- Webhooks com createApiError exclusivo
- Zero regressao (tsc + build + tests)

**Fase 2 (Feature):**
- Discovery Hub Assets com dados reais
- Autopsy + Offer persistem no Firestore
- LeadState com campos concretos do Propensity
- (STRETCH) Rate Limiting funcional
- Zero regressao (tsc + build + tests)

---

## 6. Padroes e Convencoes Obrigatorias (Heranca Sprint Sigma)

> **REGRA ABSOLUTA.** Toda nova implementacao da Sprint 29 DEVE seguir os padroes estabelecidos e consolidados durante a Sprint Sigma. Nenhuma excecao.

| Padrao | Referencia | Uso em S29 |
|:-------|:----------|:-----------|
| **`requireBrandAccess(req, brandId)`** | Implementado em 25+ rotas (DT-02 Sigma) | Toda nova rota ou rota modificada DEVE usar `requireBrandAccess`. Discovery Hub Assets fetch DEVE verificar brand ownership |
| **`createApiError(status, message, options?)`** | `lib/utils/api-response.ts` (SIG-API-01) | Todas as respostas de erro em novas rotas e nas webhooks migradas (S29-CL-04) |
| **`createApiSuccess<T>(data, options?)`** | `lib/utils/api-response.ts` (SIG-API-01) | Todas as respostas de sucesso em novas rotas |
| **`normalizePlatform()`** | `types/social-platform.ts` (DT-07 Sigma) | Se Discovery Hub Assets usar plataforma como filtro, usar o adapter |
| **`Timestamp` (nao `Date`)** | Consolidado em F2 Sigma (SIG-TYP-06) | Todos os novos campos de data DEVEM usar `Timestamp` do Firestore |
| **`force-dynamic`** | 52+ rotas (SIG-SEC-02) | Toda nova rota API DEVE incluir `export const dynamic = 'force-dynamic'` |
| **Fire-and-forget para persistencia nao-critica** | Padrao do `PropensityEngine.fireAndForgetPersist()` | Autopsy save e quota increment: nao bloquear response |
| **`skipHydration` em stores persistidos** | DT-03 Sigma | Se novos stores forem criados, incluir `skipHydration: true` |
| **Isolamento multi-tenant** | `brandId` em todas as queries | Toda query Firestore DEVE filtrar por `brandId` — zero acesso cross-tenant |

---

## 7. Proibicoes (Allowed Context Constraints)

| # | Proibicao | Justificativa |
|:--|:----------|:-------------|
| **P1** | **NUNCA alterar logica de negocio** dos modulos estabilizados (PropensityEngine, Attribution, Audience Scan, Creative Engine) | Codigo testado e produtivo desde S25-S28+Sigma |
| **P2** | **NUNCA remover exports existentes** de arquivos de tipos (`types/*.ts`) | Interfaces contratuais — podem ser estendidas, nunca reduzidas |
| **P3** | **NUNCA usar `firebase-admin`** ou `google-cloud/*` | Restricao de ambiente (Windows 11 24H2) — Client SDK only |
| **P4** | **NUNCA usar `any`** em novos tipos ou funcoes | `unknown` com type guards quando necessario |
| **P5** | **NUNCA hardcodar `brandId`** | Multi-tenant first — brandId vem do contexto de auth/request |
| **P6** | **NUNCA iniciar Fase 2 sem Gate Check aprovado** | Cleanup primeiro — nao construir features sobre debt ativo |
| **P7** | **NUNCA alterar a API publica** (URL, metodo HTTP) de rotas existentes | Retrocompatibilidade total — apenas adicionar persistencia e melhorar responses |
| **P8** | **NUNCA usar formato de erro legado** (`NextResponse.json({ error: '...' })`) em codigo novo | Usar exclusivamente `createApiError`/`createApiSuccess` |
| **P9** | **NUNCA criar types sem tipar campos concretos** — proibido `[key: string]: unknown` como catch-all em novas interfaces | S29 e sobre eliminar stubs — nao criar novos |
| **P10** | **NUNCA implementar Ads Integration** nesta sprint | Ads = S30. S29 prepara a persistencia que S30 vai usar |
| **P11** | **NUNCA modificar testes existentes** que estao passando, exceto para adaptar imports se necessario | 224 testes sao o baseline de regressao |

---

## 8. Riscos e Mitigacoes

| # | Risco | Prob. | Impacto | Mitigacao |
|:--|:------|:------|:--------|:----------|
| R1 | **Discovery Hub Assets: query Firestore pesada sem paginacao** | Media | Medio | Implementar `limit(50)` na query inicial. Adicionar paginacao lazy se necessario (cursor-based) |
| R2 | **Autopsy fire-and-forget: falha silenciosa de persistencia** | Media | Medio | Log de erro no catch (`console.error('[Autopsy] Persist failed:', err)`). Considerar retry com backoff. Nao bloquear response |
| R3 | **LeadState expansion quebra consumers existentes** | Baixa | Alto | Novos campos sao OPCIONAIS (Partial). Consumers existentes continuam funcionando. `PropensityEngine.persistSegment` ja salva `score`, `segment`, `reasoning` — alinhar interface |
| R4 | **Rate Limiting (STRETCH) causa false positives** | Media | Medio | Thresholds generosos (100 scans/dia). Reset diario automatico. Logging quando quota e atingida. Exempcao para admin routes |
| R5 | **processAssetText() tem callers ocultos que dependem do stub** | Baixa | Medio | Buscar callers com `rg "processAssetText"` antes de remover. Se houver callers, implementar ao inves de remover |
| R6 | **Reporting types expansion quebra briefing-bot** | Baixa | Baixo | `briefing-bot.ts` ja usa `analysis.summary`, `analysis.insights`, `analysis.recommendations`, `metrics.roi`, `metrics.adSpend`, `metrics.ltvMaturation` — manter esses campos inalterados, apenas remover catch-all e adicionar opcionais |
| R7 | **Webhook migration quebra integracao server-to-server** | Baixa | Alto | Manter mesmos status codes e mensagens de erro. `createApiError` preserva campo `error: string` (PA-04 Sigma). Testar com payload real |

---

## 9. Estimativas por Fase

| Fase | ID | Items | Esforco | Gate? |
|:-----|:---|:------|:--------|:------|
| **FASE 1: Cleanup** | S29-CL-01 a CL-04 | 4 items | **~2-3h** | **SIM — GATE** |
| **FASE 2: Feature (Core)** | S29-FT-01 a FT-03 | 3 items | **~8-11h** | Nao |
| **FASE 2: Feature (STRETCH)** | S29-FT-04 | 1 item | **~3-4h** | Nao |
| **QA Final** | — | — | **~1-2h** | — |
| **TOTAL (sem STRETCH)** | | **7 items** | **~11-16h** | 1 gate |
| **TOTAL (com STRETCH)** | | **8 items** | **~14-20h** | 1 gate |

### Ordem de Execucao

```
[FASE 1 — Cleanup (GATE)]
  S29-CL-01 (contract-map, XS)
    → S29-CL-02 (reporting types, XS)
      → S29-CL-03 (processAssetText, S)
        → S29-CL-04 (webhook routes, XS)

  ── GATE CHECK ── (tsc + build + tests + review CL-01 a CL-04) ──

[FASE 2 — Feature (Core)]
  S29-FT-01 (Discovery Hub Assets, L) — item principal, maior esforco
    → S29-FT-02 (Persistencia Autopsy + Offer, M) — pode paralelizar com FT-01
      → S29-FT-03 (LeadState expansion, S) — depende da revisao de FT-02 (alinhamento Propensity)

[FASE 2 — Feature (STRETCH)]
  S29-FT-04 (Rate Limiting, M) — somente apos FT-01 a FT-03 concluidos e validados

[QA FINAL]
  Dandara valida SC-01 a SC-10
```

**Notas sobre paralelismo:**
- S29-CL-01, CL-02 e CL-04 sao independentes entre si (podem paralelizar)
- S29-FT-01 e S29-FT-02 sao independentes (podem paralelizar)
- S29-FT-03 e melhor executar apos FT-02 (alinhamento de campos do Propensity)
- S29-FT-04 (STRETCH) depende de FT-01/FT-02 estarem estaveis

---

## 10. Gate Check

### Gate Check: Cleanup (apos Fase 1)

| # | Verificacao | Comando/Metodo | Resultado Esperado |
|:--|:-----------|:--------------|:------------------|
| G1-01 | contract-map atualizado | `rg "budget-optimizer" _netecmt/core/contract-map.yaml` | 1+ match |
| G1-02 | Reporting types sem catch-all | `rg "\[key: string\]: unknown" app/src/types/reporting.ts` | 0 ocorrencias |
| G1-03 | processAssetText resolvido | Inspecao de `app/src/lib/firebase/assets.ts` | Funcao implementada ou removida (corpo nao-vazio ou ausente) |
| G1-04 | Webhooks migrados | `rg "NextResponse.json" app/src/app/api/webhooks/` | 0 ocorrencias de formato legado (apenas `createApiError`/`createApiSuccess`) |
| G1-05 | TypeScript limpo | `npx tsc --noEmit` | Exit code 0, zero erros |
| G1-06 | Build sucesso | `npm run build` | Exit code 0, >= 103 rotas |
| G1-07 | Testes passando | `npm test` | >= 224/224 pass, 0 fail |

**Regra:** Fase 2 so inicia se G1-01 a G1-07 estiverem todos ✅.

---

## 11. Dependencias

| Dependencia | Status | Impacto |
|:-----------|:-------|:--------|
| Sprint Sigma concluida (QA 99/100) | ✅ Confirmada | Pre-requisito cumprido |
| Build limpo (`tsc --noEmit` = 0) | ✅ Confirmado pos-Sigma | Baseline mantida |
| 224/224 testes passando | ✅ Confirmado pos-Sigma | Baseline de regressao |
| `requireBrandAccess()` funcao existente | ✅ 25+ rotas usam (Sigma) | Padrao a seguir |
| `createApiError`/`createApiSuccess` existente | ✅ 53+ rotas usam (SIG-API-01) | Padrao a seguir |
| `PropensityEngine` funcional (S28-PS-03) | ✅ Implementado com persistencia | Base para LeadState expansion |
| `AutopsyEngine.analyzeContent()` funcional | ✅ Retorna report completo | Basta persistir o resultado |
| `OfferLabEngine.calculateScore()` funcional | ✅ Retorna score + analysis | Basta persistir o resultado |
| Firebase Client SDK configurado | ✅ `db` disponivel via config | Persistencia Firestore |
| **Arch Review (Athos)** | ⏳ PENDENTE | PRD nao vira stories sem aprovacao |
| Nenhum MCP/CLI novo | ✅ | Ferramentas existentes suficientes |

---

## 12. Impacto no Roadmap

### Posicao

```
... → S28 (98) → [Sprint Sigma (99)] → S29 → S30 → S31 → ...
```

Sprint 29 e a primeira sprint **feature** apos a estabilizacao. Ela prepara o terreno para S30 (Ads Integration) ao garantir persistencia funcional.

### Beneficios para Sprints Futuras

| Sprint | Beneficio Direto da S29 |
|:-------|:----------------------|
| **S30** (Ads Integration) | Persistencia Firestore funcional para autopsy/offer significa que metricas de ads podem seguir o mesmo padrao. Rate Limiting protege contra abuso de API calls de ads |
| **S31** (Automation & Rules Runtime) | LeadState expandido com campos reais alimenta regras de personalizacao. Discovery Hub Assets fornece dados para automation decisions |
| **S33** (Content Autopilot) | Assets de inteligencia organizados servem como input para geracao de conteudo automatizada |
| **S34** (A/B Testing) | Budget Optimizer registrado no contract-map permite evolucao limpa em S34 |

### Mapa de Dependencias

```
S29 (Assets & Persistence) ← ESTAMOS AQUI
  ↓
S30 (Ads Integration) ← depende de S29 (persistencia OK + rate limiting)
  ↓
S31 (Automation & Rules Runtime) ← depende de S30 (ads real) + S28 (rules CRUD)
```

### Trajetoria de Qualidade Projetada

```
S25 (93) → S26 (97) → S27 (97) → S28 (98) → Sigma (99) → S29 (meta: 99 ou 100)
```

**Projecao:** Com webhook format corrigido (unica deducao do Sigma) e funcionalidade expandida, S29 tem potencial para **100/100**.

---

## 13. Detalhamento Tecnico dos Stubs (Evidencias do Codebase)

### Stub 1: `useIntelligenceAssets` (use-intelligence-assets.ts)

```typescript
// ESTADO ATUAL — stub completo
export function useIntelligenceAssets(brandId: string) {
  const [assets] = useState<unknown[]>([]);
  const [loading] = useState(false);
  return { assets, loading };
}
```

**Problema:** Retorna array vazio e `loading=false` permanentemente. Discovery Hub nao mostra nenhum asset.

**Solucao S29-FT-01:** Implementar busca real em `brands/{brandId}/intelligence_assets` com `onSnapshot` ou `getDocs`.

---

### Stub 2: `AssetsPanel` (assets-panel.tsx)

```typescript
// ESTADO ATUAL — placeholder visual
export function AssetsPanel({ brandId, assets, isLoading }: AssetsPanelProps) {
  return (
    <Card className="bg-zinc-900/30 border-white/[0.05]">
      <CardContent className="p-6 text-center text-zinc-500">
        <p className="text-sm">Assets Panel — Em desenvolvimento</p>
      </CardContent>
    </Card>
  );
}
```

**Problema:** Mostra texto "Em desenvolvimento" para o usuario. Gap de UX critico no Discovery Hub.

**Solucao S29-FT-01:** Grid de cards com icones por tipo, metadata, badges de status, skeleton loading.

---

### Stub 3: `processAssetText()` (assets.ts L194-196)

```typescript
// ESTADO ATUAL — corpo vazio
export async function processAssetText(_assetId: string, _text?: string): Promise<void> {
  // TODO: Sprint XX — Implementar processamento de texto de assets
}
```

**Problema:** Funcao chamavel mas nao faz nada. Callers pensam que processamento ocorreu.

**Solucao S29-CL-03:** Implementar (se Discovery Hub precisar) ou remover (se processamento e feito de outra forma).

---

### Stub 4: Autopsy Persistence (autopsy/run/route.ts L81)

```typescript
// ESTADO ATUAL — TODO comentado
// TODO: Persistir no Firestore: brands/{brandId}/autopsies/{id}
return createApiSuccess(response);
```

**Problema:** Autopsy gera relatorio completo mas NAO salva. Usuario perde resultado ao navegar.

**Solucao S29-FT-02:** `setDoc` fire-and-forget antes do return.

---

### Stub 5: Offer Persistence (offer/save/route.ts L54-55)

```typescript
// ESTADO ATUAL — TODO comentado com codigo placeholder
// TODO: persistir no Firestore
// await db.collection('brands').doc(brandId).collection('offers').doc(offerDoc.id).set(offerDoc);
return createApiSuccess({ offer: offerDoc });
```

**Problema:** Rota chama "save" mas NAO salva. Offer score e calculado mas perdido.

**Solucao S29-FT-02:** Descomentar, adaptar para Client SDK (`setDoc(doc(db, ...))`), persistir.

---

### Stub 6: `LeadState` (personalization.ts L56-64)

```typescript
// ESTADO ATUAL — interface minima com catch-all
export interface LeadState {
  leadId: string;
  brandId: string;
  awarenessLevel: string;
  score: number;
  lastInteractionAt?: Timestamp;
  [key: string]: unknown; // ← catch-all: qualquer campo aceito
}
```

**Problema:** Interface aceita qualquer coisa via catch-all. Nao reflete os campos reais do PropensityEngine.

**Solucao S29-FT-03:** Expandir com `segment`, `propensityScore`, `reasoning`, `eventCount`, etc.

---

### Stubs 7-8: `AIAnalysisResult` e `ReportMetrics` (reporting.ts)

```typescript
// ESTADO ATUAL — stubs com catch-all
export interface AIAnalysisResult {
  summary: string;
  insights: string[];
  recommendations: string[];
  [key: string]: unknown; // ← catch-all
}

export interface ReportMetrics {
  roi: number;
  adSpend: number;
  ltvMaturation: number;
  [key: string]: unknown; // ← catch-all
}
```

**Problema:** Catch-all permite qualquer campo sem type safety. `briefing-bot.ts` e o consumer — funciona mas sem garantias.

**Solucao S29-CL-02:** Remover catch-all, adicionar campos opcionais concretos.

---

## 14. Artefatos de Referencia

| Artefato | Caminho |
|:---------|:--------|
| **Sprint Sigma (predecessora)** | `_netecmt/sprints/ACTIVE_SPRINT.md` |
| **QA Sigma (findings para S29)** | `_netecmt/packs/stories/sprint-sigma-consistency/qa-report.md` |
| **Auditoria de Consistencia** | `_netecmt/solutioning/audit-codebase-consistency-2026-02-07.md` |
| **Roadmap (secao S29)** | `_netecmt/ROADMAP.md` (L191-204) |
| **Sprint History** | `_netecmt/sprints/SPRINT_HISTORY.md` |
| **Contract Map** | `_netecmt/core/contract-map.yaml` |
| **Project Context** | `_netecmt/project-context.md` |
| **PRD Sprint Sigma (template)** | `_netecmt/solutioning/prd/prd-sprint-sigma-consistency.md` |
| **api-response.ts (padrao de formato)** | `app/src/lib/utils/api-response.ts` |
| **PropensityEngine (base para LeadState)** | `app/src/lib/intelligence/personalization/propensity.ts` |

### Arquivos-Chave para Implementacao

**Cleanup (Fase 1):**
```
_netecmt/core/contract-map.yaml                          → S29-CL-01
app/src/types/reporting.ts                                → S29-CL-02
app/src/lib/firebase/assets.ts                            → S29-CL-03
app/src/app/api/webhooks/dispatcher/route.ts              → S29-CL-04
app/src/app/api/webhooks/ads-metrics/route.ts             → S29-CL-04
```

**Feature (Fase 2):**
```
app/src/lib/hooks/use-intelligence-assets.ts              → S29-FT-01
app/src/components/intelligence/discovery/assets-panel.tsx → S29-FT-01
app/src/app/intelligence/discovery/page.tsx               → S29-FT-01 (consumer)
app/src/app/api/intelligence/autopsy/run/route.ts         → S29-FT-02
app/src/app/api/intelligence/offer/save/route.ts          → S29-FT-02
app/src/types/personalization.ts                          → S29-FT-03
app/src/lib/guards/rate-limiter.ts                        → S29-FT-04 (novo)
```

---

## 15. Glossario

| Termo | Definicao |
|:------|:----------|
| **Stub** | Funcao ou componente com corpo vazio ou placeholder — existe para compilar mas nao implementa funcionalidade |
| **TODO residual** | Comentario `// TODO:` no codigo que marca funcionalidade nao implementada |
| **Catch-all** | `[key: string]: unknown` em interface TypeScript — aceita qualquer campo sem type safety |
| **Fire-and-forget** | Padrao de persistencia assincrona que nao bloqueia o response (`.catch()` para log) |
| **Gate Check** | Ponto de validacao formal entre fases (tsc + build + tests + review) |
| **STRETCH** | Item desejavel mas nao obrigatorio — pode ser movido para proxima sprint se tempo nao permitir |
| **Discovery Hub** | Pagina `/intelligence/discovery` — centro de descoberta de insights e assets de inteligencia |
| **Propensity Engine** | Motor S28-PS-03 que calcula score 0-1 e segmento hot/warm/cold por lead |
| **Rate Limiting** | Guardrails de quota por marca para prevenir abuso — limita numero de requests por periodo |

---

## 16. Ressalvas do Alto Conselho

O Conselho definiu o escopo S29 com as seguintes ressalvas obrigatorias:

| # | Ressalva | Impacto | Validacao |
|:--|:---------|:--------|:----------|
| **R1** | **Gate Check (Cleanup) e BLOQUEANTE** — Fase 2 NAO pode iniciar sem os 4 items de cleanup validados | Sequenciamento obrigatorio | tsc + build + tests + review CL-01 a CL-04 |
| **R2** | **Rate Limiting e STRETCH** — S29-FT-04 so e executado se FT-01 a FT-03 estiverem concluidos com sobra de tempo | Flexibilidade de escopo | Decision Point apos FT-03 |
| **R3** | **Padroes Sigma sao lei** — `createApiError`, `requireBrandAccess`, `Timestamp`, `force-dynamic` sao obrigatorios em qualquer codigo novo | Consistencia | Review final confirma compliance |
| **R4** | **Ads Integration e S30, nao S29** — NENHUMA integracao real com Meta/Google nesta sprint | Escopo travado | Zero imports de Meta/Google SDKs |
| **R5** | **PRD precisa de Arch Review (Athos) antes de virar stories** — Governanca NETECMT v2.0 | Governanca | Status muda para "Aprovado" somente apos review |
| **R6** | **Meta QA 99 ou 100** — S29 NAO pode regredir abaixo de 99/100. Deducao do Sigma (webhooks) deve ser eliminada | Qualidade | QA final confirma score |

---

*PRD formalizado por Iuran (PM) — NETECMT v2.0*  
*Sprint 29: Assets & Persistence Hardening | 07/02/2026*  
*Tipo: Hybrid (Cleanup 25% + Feature 75%) | North Star: 0 stubs + persistencia funcional + Discovery Hub preenchido*  
*Baseline: 224/224 testes, tsc=0, build=103+ rotas, QA=99/100*  
*Aprovacao pendente: Arch Review (Athos) — Ressalva R5 do Conselho*
