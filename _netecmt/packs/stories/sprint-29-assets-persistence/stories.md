# Stories Distilled: Sprint 29 — Assets & Persistence Hardening
**Preparado por:** Leticia (SM)
**Data:** 07/02/2026
**Lanes:** cleanup + intelligence + persistence + types
**Tipo:** Hybrid (Cleanup 25% + Feature 75%)

> **IMPORTANTE:** Este documento incorpora os **12 Decision Topics (DTs)** e **3 Correcoes de Premissa (CPs)** do Architecture Review (Athos). Cada DT incorporado esta marcado com `[ARCH DT-XX]`. Os 2 blocking DTs (DT-03, DT-05) estao destacados com `BLOCKING`.
>
> **Padroes Sigma OBRIGATORIOS** em todo codigo novo: `createApiError`/`createApiSuccess`, `requireBrandAccess`, `Timestamp` (nao Date), `force-dynamic`, isolamento multi-tenant por `brandId`.

---

## Fase 1: Cleanup (Gate) [~1.5h + Gate]

> **Sequencia:** CL-01 | CL-02 | CL-03 | CL-04 (PARALELOS) → **GATE CHECK 1**
>
> Todos os 4 items sao independentes e podem ser executados em paralelo. Gate obrigatorio antes de Fase 2 (P6).

---

### S29-CL-01: contract-map — registrar budget-optimizer [XS, ~15min]

**Objetivo:** Registrar `app/src/lib/automation/budget-optimizer.ts` na lane `automation` do `contract-map.yaml`. Item N1 do Arch Review S28.

> **[ARCH DT-01 — P2, Nao Blocking]:** Item trivial. budget-optimizer.ts pertence a lane `automation` (mesmo path pattern de `engine.ts`).

**Acao:**
1. Em `_netecmt/core/contract-map.yaml`, adicionar na lane `automation` existente:
   ```yaml
   automation:
     paths:
       - app/src/lib/automation/engine.ts
       - app/src/lib/automation/budget-optimizer.ts  # S29-CL-01 (N1 S28)
       - app/src/lib/automation/adapters/
       - app/src/lib/automation/normalizer.ts
   ```

**Arquivos:**
- `_netecmt/core/contract-map.yaml` — **MODIFICAR**

**DTs referenciados:** DT-01
**Dependencias:** Nenhuma (paralelo com CL-02, CL-03, CL-04)
**Gate Check:** S29-GATE-01 (Sim)
**SC mapeados:** SC-08

**AC:**
- [ ] `budget-optimizer.ts` registrado na lane `automation` do contract-map
- [ ] `rg "budget-optimizer" _netecmt/core/contract-map.yaml` retorna 1+ match

---

### S29-CL-02: Reporting types — ativar AIAnalysisResult e ReportMetrics [XS, ~20min]

**Objetivo:** Remover catch-all `[key: string]: unknown` de ambas interfaces e preencher com campos concretos derivados do consumer real (`briefing-bot.ts`). Usar shapes propostos pelo Athos.

> **[ARCH DT-02 — P1, Nao Blocking]:** Campos existentes (`summary`, `insights`, `recommendations`, `roi`, `adSpend`, `ltvMaturation`) sao OBRIGATORIOS — manter exatamente como estao. Novos campos sao OPCIONAIS. Zero breaking change para briefing-bot.

**Acao:**
1. Em `app/src/types/reporting.ts`, substituir `AIAnalysisResult` (L62-67):
   ```typescript
   export interface AIAnalysisResult {
     summary: string;                    // Narrativa executiva gerada pelo Gemini
     insights: string[];                 // Insights formatados (consumer: briefing-bot)
     recommendations: string[];          // Proximos passos acionaveis
     confidence?: number;                // 0-1 — confianca da analise
     dataContext?: string;               // Ex: "Baseado em 4.500 eventos"
     generatedAt?: Timestamp;            // Quando a analise foi gerada
   }
   ```
2. Em `app/src/types/reporting.ts`, substituir `ReportMetrics` (L74-79):
   ```typescript
   export interface ReportMetrics {
     roi: number;                        // Return on Investment
     adSpend: number;                    // Investimento em ads (R$)
     ltvMaturation: number;              // Maturacao LTV (%)
     revenue?: number;                   // Receita bruta (R$)
     cpa?: number;                       // Custo por aquisicao (R$)
     roas?: number;                      // Return on Ad Spend
     roiPredicted?: number;              // ROI projetado
     conversions?: number;               // Total de conversoes
     period?: {                          // Periodo de referencia
       start: Timestamp;
       end: Timestamp;
     };
   }
   ```
3. Remover marcacoes `@stub` e `@todo` de ambas
4. Verificar que `briefing-bot.ts` compila sem cast

**Arquivos:**
- `app/src/types/reporting.ts` — **MODIFICAR**

**Leitura (consumer):**
- `app/src/lib/reporting/briefing-bot.ts` — verificar compilacao

**DTs referenciados:** DT-02
**Dependencias:** Nenhuma (paralelo com CL-01, CL-03, CL-04)
**Gate Check:** S29-GATE-01 (Sim)
**SC mapeados:** SC-06

**AC:**
- [ ] `AIAnalysisResult` sem `[key: string]: unknown`
- [ ] `ReportMetrics` sem `[key: string]: unknown`
- [ ] Campos obrigatorios inalterados (`summary`, `insights`, `recommendations`, `roi`, `adSpend`, `ltvMaturation`)
- [ ] Novos campos sao opcionais (`?`)
- [ ] `briefing-bot.ts` compila sem cast
- [ ] Marcacoes `@stub` e `@todo` removidas
- [ ] `npx tsc --noEmit` = 0

---

### S29-CL-03: processAssetText() — DELETAR stub morto [XS, ~15min]

**Objetivo:** Remover o stub vazio de `processAssetText()` em `assets.ts`. A implementacao REAL ja existe em `assets-server.ts` e e usada pelas rotas de producao.

> **[ARCH DT-03 — P0, BLOCKING]:** O PRD assume necessidade de reimplementar. Na verdade, `assets-server.ts` (L20+) ja possui implementacao COMPLETA (chunking + embeddings + Pinecone upsert). O stub em `assets.ts` e CODIGO MORTO — 0 callers reais. A acao e DELETAR, nao reimplementar.
>
> **[ARCH PA-02]:** NUNCA reimplementar `processAssetText` em `assets.ts`.

**Acao:**
1. Verificar callers: `rg "processAssetText" app/src/` — confirmar que nenhum caller importa de `assets.ts`
2. Remover a funcao `processAssetText()` de `app/src/lib/firebase/assets.ts` (L190-197 aprox)
3. Se algum teste importa `processAssetText` de `assets.ts`, atualizar import para `assets-server.ts` ou remover
4. Manter `assets-server.ts` **INTOCADO** — implementacao funcional

**Arquivos:**
- `app/src/lib/firebase/assets.ts` — **MODIFICAR** (remover stub ~4-7 linhas)

**NAO TOCAR:**
- `app/src/lib/firebase/assets-server.ts` — implementacao real, intocada

**DTs referenciados:** DT-03 (BLOCKING)
**Dependencias:** Nenhuma (paralelo com CL-01, CL-02, CL-04)
**Gate Check:** S29-GATE-01 (Sim)
**SC mapeados:** SC-01

**AC:**
- [ ] `processAssetText()` REMOVIDO de `assets.ts`
- [ ] `rg "processAssetText" app/src/lib/firebase/assets.ts` retorna 0
- [ ] `assets-server.ts` INTOCADO (nenhuma modificacao)
- [ ] Nenhum caller quebrado (confirmar via `rg "from.*assets.*processAssetText"`)
- [ ] Testes que importavam de `assets.ts` atualizados ou removidos
- [ ] `npx tsc --noEmit` = 0

---

### S29-CL-04: Webhook routes — migrar para createApiError [S, ~40min]

**Objetivo:** Migrar os 13 pontos de erro/sucesso legado em `webhooks/dispatcher/route.ts` (6 pontos) e `webhooks/ads-metrics/route.ts` (7 pontos) para `createApiError()`/`createApiSuccess()`. Item P2 da OBS-01 do QA Sigma.

> **[ARCH DT-04 — P1, Nao Blocking]:** Total de 13 pontos (mais que o PRD estimava). Manter exatamente mesmos status codes e mensagens. `createApiError` ja inclui campo `error: string` (PA-04 Sigma) — retrocompativel para server-to-server.

**Acao:**

#### `webhooks/dispatcher/route.ts` (6 pontos):
| Linha | Formato Atual | Migracao |
|:------|:-------------|:---------|
| ~L22 | `NextResponse.json({ error: 'brandId is required' }, { status: 400 })` | `createApiError(400, 'brandId is required')` |
| ~L35 | `NextResponse.json({ error: 'Configuration missing' }, { status: 500 })` | `createApiError(500, 'Configuration missing')` |
| ~L41 | `NextResponse.json({ error: 'Invalid signature' }, { status: 401 })` | `createApiError(401, 'Invalid signature')` |
| ~L54 | `NextResponse.json({ success: true })` | `createApiSuccess({ processed: true })` |
| ~L61 | `NextResponse.json({ error: 'Internal...', details: ... }, { status: 500 })` | `createApiError(500, 'Internal processing error', { details: error.message })` |
| ~L82 | `NextResponse.json({ error: 'Forbidden' }, { status: 403 })` | `createApiError(403, 'Forbidden')` |

#### `webhooks/ads-metrics/route.ts` (7 pontos):
| Linha | Formato Atual | Migracao |
|:------|:-------------|:---------|
| ~L27-30 | `NextResponse.json({ error: 'Configuração...' }, { status: 500 })` | `createApiError(500, 'Configuração de segurança incompleta no servidor')` |
| ~L35 | `NextResponse.json({ error: 'Assinatura...' }, { status: 401 })` | `createApiError(401, 'Assinatura x-hub-signature-256 ausente')` |
| ~L47 | `NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 })` | `createApiError(401, 'Assinatura inválida')` |
| ~L55 | `NextResponse.json({ error: 'Payload JSON...' }, { status: 400 })` | `createApiError(400, 'Payload JSON inválido')` |
| ~L61 | `NextResponse.json({ error: 'campaign_id...' }, { status: 400 })` | `createApiError(400, 'campaign_id é obrigatório no payload')` |
| ~L84-88 | `NextResponse.json({ success: true, message: '...', timestamp: '...' })` | `createApiSuccess({ message: '...', timestamp: '...' })` |
| ~L92-94 | `NextResponse.json({ error: '...', details: ... }, { status: 500 })` | `createApiError(500, '...', { details: error.message })` |

**Regra:** Importar `createApiError`/`createApiSuccess` de `@/lib/utils/api-response`. Manter mesmos status codes e mensagens. Adicionar `import { createApiError, createApiSuccess } from '@/lib/utils/api-response'` no topo.

**Arquivos:**
- `app/src/app/api/webhooks/dispatcher/route.ts` — **MODIFICAR**
- `app/src/app/api/webhooks/ads-metrics/route.ts` — **MODIFICAR**

**DTs referenciados:** DT-04
**Dependencias:** Nenhuma (paralelo com CL-01, CL-02, CL-03)
**Gate Check:** S29-GATE-01 (Sim)
**SC mapeados:** SC-07

**AC:**
- [ ] 6/6 pontos migrados em `dispatcher/route.ts`
- [ ] 7/7 pontos migrados em `ads-metrics/route.ts`
- [ ] `rg "NextResponse.json" app/src/app/api/webhooks/dispatcher/route.ts` retorna 0
- [ ] `rg "NextResponse.json" app/src/app/api/webhooks/ads-metrics/route.ts` retorna 0
- [ ] Mesmos status codes e mensagens preservados
- [ ] Campo `error: string` presente em todas as respostas de erro (retrocompatibilidade server-to-server)
- [ ] `npx tsc --noEmit` = 0

---

### S29-GATE-01: Gate Check 1 — Cleanup [S, ~30min] — GATE

**Objetivo:** Validar que TODOS os 4 items de cleanup estao concluidos e que o baseline de regressao foi mantido. **Fase 2 NAO pode iniciar sem este gate aprovado** (P6, Ressalva R1).

**Checklist de Validacao:**

| # | Verificacao | Comando/Metodo | Resultado Esperado |
|:--|:-----------|:--------------|:------------------|
| G1-01 | contract-map atualizado | `rg "budget-optimizer" _netecmt/core/contract-map.yaml` | 1+ match |
| G1-02 | Reporting types sem catch-all | `rg "\[key: string\]: unknown" app/src/types/reporting.ts` | 0 ocorrencias |
| G1-03 | processAssetText resolvido | `rg "processAssetText" app/src/lib/firebase/assets.ts` | 0 ocorrencias (funcao removida) |
| G1-04 | Webhooks migrados | `rg "NextResponse.json" app/src/app/api/webhooks/dispatcher/route.ts` + `ads-metrics/route.ts` | 0 ocorrencias de formato legado |
| G1-05 | TypeScript limpo | `npx tsc --noEmit` | Exit code 0, zero erros |
| G1-06 | Build sucesso | `npm run build` | Exit code 0, >= 103 rotas |
| G1-07 | Testes passando | `npm test` | >= 224/224 pass, 0 fail |

**Regra ABSOLUTA:** Fase 2 so inicia se G1-01 a G1-07 estiverem todos ✅.

**DTs referenciados:** Todos os DTs de Fase 1 (DT-01 a DT-04)
**Dependencias:** S29-CL-01, CL-02, CL-03, CL-04 concluidos
**Gate Check:** SIM (este E o gate)

**AC:**
- [ ] G1-01 a G1-07 todos aprovados
- [ ] Documentacao do resultado do gate (print de tsc, build, tests)

---

## Fase 2: Feature (Core) [~8.5-10h]

> **PRE-REQUISITO ABSOLUTO:** S29-GATE-01 aprovado. Fase 2 NAO pode iniciar sem cleanup validado (P6, Ressalva R1).
>
> **Sequencia Athos:** Criar IntelligenceAsset type → FT-02 (Persistence) → FT-01 (Discovery Hub) + FT-03 (LeadState, paralelo com FT-01)
>
> **FT-02 ANTES de FT-01:** O hook do Discovery Hub precisa que as collections `autopsies` e `offers` existam com dados para funcionar.

---

### S29-FT-02: Persistencia Autopsy + Offer no Firestore [M, ~2h]

**Objetivo:** Implementar persistencia real no Firestore para resultados de Autopsy e Offer. Atualmente, ambos geram resultados mas NAO salvam — o usuario perde o trabalho ao navegar.

> **[ARCH DT-06 — P1]:** `AutopsyDocument` ja existe em `types/autopsy.ts` (L52-66) — usar este tipo, NAO criar novo. Fire-and-forget com `.catch()` obrigatorio.
>
> **[ARCH DT-07 — P1]:** `OfferDocument` ja existe em `types/offer.ts` (L12-43) — usar este tipo. `await setDoc` (NAO fire-and-forget) porque semantica e de "save".
>
> **[ARCH DT-11 — P2]:** Logging obrigatorio no catch: `console.error('[Autopsy] Persist failed:', err)`.
>
> **[ARCH DT-12 — P1]:** Offer e `await` porque rota e `/save` — usuario espera confirmacao.
>
> **[ARCH PA-03]:** NUNCA usar await na persistencia de autopsy.
> **[ARCH PA-04]:** NUNCA usar fire-and-forget na persistencia de offer.

**Acao — Parte A: Autopsy persist (fire-and-forget):**
1. Em `app/src/app/api/intelligence/autopsy/run/route.ts`, SUBSTITUIR o TODO da ~L81:
   ```typescript
   // Construir documento seguindo AutopsyDocument (types/autopsy.ts)
   const autopsyDoc: AutopsyDocument = {
     id: response.id,
     brandId: safeBrandId,
     url,
     status: 'completed',
     request: body,
     result: report,
     createdAt: Timestamp.now(),
     updatedAt: Timestamp.now(),
     expiresAt: Timestamp.fromMillis(Date.now() + 30 * 24 * 60 * 60 * 1000), // TTL 30d
   };

   // Fire-and-forget (padrao PropensityEngine — nao bloquear response)
   const autopsyRef = doc(db, 'brands', safeBrandId, 'autopsies', response.id);
   setDoc(autopsyRef, autopsyDoc).catch(err => {
     console.error('[Autopsy] Persist failed:', err);
   });

   return createApiSuccess(response);
   ```
2. Adicionar imports necessarios: `doc`, `setDoc` de `firebase/firestore`, `Timestamp`, `AutopsyDocument`

**Acao — Parte B: Offer persist (await):**
1. Em `app/src/app/api/intelligence/offer/save/route.ts`, SUBSTITUIR o TODO da ~L54-55:
   ```typescript
   // Persistir no Firestore — await porque semantica e de "save"
   const offerRef = doc(db, 'brands', safeBrandId, 'offers', offerDoc.id);
   await setDoc(offerRef, offerDoc);

   return createApiSuccess({ offer: offerDoc });
   ```
2. Adicionar imports necessarios: `doc`, `setDoc` de `firebase/firestore`

**Schemas Firestore (referencia Arch Review Secao 4):**
- Autopsies: `brands/{brandId}/autopsies/{id}` — schema `AutopsyDocument` de `types/autopsy.ts`
- Offers: `brands/{brandId}/offers/{id}` — schema `OfferDocument` de `types/offer.ts`

**Arquivos:**
- `app/src/app/api/intelligence/autopsy/run/route.ts` — **MODIFICAR** (substituir TODO)
- `app/src/app/api/intelligence/offer/save/route.ts` — **MODIFICAR** (substituir TODO)

**Leitura (schemas e padroes):**
- `app/src/types/autopsy.ts` — AutopsyDocument (schema)
- `app/src/types/offer.ts` — OfferDocument (schema)
- `app/src/lib/intelligence/personalization/propensity.ts` — padrao fire-and-forget

**DTs referenciados:** DT-06, DT-07, DT-11, DT-12
**Dependencias:** S29-GATE-01 aprovado
**Gate Check:** Nao
**SC mapeados:** SC-03, SC-04

**AC:**
- [ ] Autopsy: `setDoc` fire-and-forget com `.catch(err => console.error('[Autopsy] Persist failed:', err))`
- [ ] Autopsy: documento criado em `brands/{brandId}/autopsies/{response.id}` apos POST
- [ ] Autopsy: `expiresAt` com TTL de 30 dias
- [ ] Offer: `await setDoc` (NAO fire-and-forget)
- [ ] Offer: documento criado em `brands/{brandId}/offers/{offerDoc.id}` apos POST
- [ ] Ambos usam tipos existentes (`AutopsyDocument`, `OfferDocument`) — zero schema novo
- [ ] Ambos respeitam isolamento multi-tenant (`brands/{brandId}/...`)
- [ ] TODO comentarios removidos
- [ ] `npx tsc --noEmit` = 0

---

### S29-FT-01: Discovery Hub Assets — hook real + panel com cards [L, ~5-6h]

**Objetivo:** Substituir os 3 stubs (hook, panel, processAssetText) por implementacao funcional. O hook faz multi-query paralela em 3 collections Firestore e normaliza para tipo unificado `IntelligenceAsset`. O panel exibe cards com icones, metadata e status.

> **[ARCH DT-05 — P0, BLOCKING]:** NAO criar collection `intelligence_assets`. Usar multi-query paralela em `audience_scans`, `autopsies`, `offers` com tipo unificado `IntelligenceAsset`. Zero duplicacao, dados sempre atualizados.
>
> **[ARCH DT-10 — P1]:** Novo tipo `IntelligenceAsset` em `types/intelligence.ts` para normalizar assets de 3 collections.
>
> **[ARCH PA-01]:** NUNCA criar collection `intelligence_assets` no Firestore.

**Acao — Pre-step: Criar tipo IntelligenceAsset:**
1. Em `app/src/types/intelligence.ts`, adicionar:
   ```typescript
   export interface IntelligenceAsset {
     id: string;
     brandId: string;
     type: 'audience_scan' | 'autopsy' | 'offer' | 'spy_dossier';
     name: string;
     summary: string;
     status: 'ready' | 'processing' | 'error';
     score?: number;
     createdAt: Timestamp;
     sourceId: string;
     metadata?: Record<string, unknown>;
   }
   ```

**Acao — Parte A: Hook `useIntelligenceAssets(brandId)`:**
1. Em `app/src/lib/hooks/use-intelligence-assets.ts`, substituir stub por implementacao real:
   ```typescript
   export interface UseIntelligenceAssetsReturn {
     assets: IntelligenceAsset[];
     loading: boolean;
     error: string | null;
     refetch: () => void;
   }

   export function useIntelligenceAssets(brandId: string): UseIntelligenceAssetsReturn {
     // 1. State: assets, loading, error
     // 2. fetchAssets callback:
     //    - Query paralela em 3 collections (Promise.all):
     //      a) brands/{brandId}/audience_scans (orderBy createdAt desc, limit 20)
     //      b) brands/{brandId}/autopsies (orderBy createdAt desc, limit 20)
     //      c) brands/{brandId}/offers (orderBy createdAt desc, limit 20)
     //    - Normalizar cada resultado para IntelligenceAsset via mappers
     //    - Sort unificado por createdAt desc
     // 3. useEffect → fetchAssets on brandId change
     // 4. Return { assets, loading, error, refetch: fetchAssets }
   }
   ```
2. Criar funcoes de query em `lib/firebase/scoped-data.ts` ou diretamente no hook:
   - `getAudienceScans(brandId, maxResults=20)`
   - `getAutopsies(brandId, maxResults=20)`
   - `getOffers(brandId, maxResults=20)`
3. Criar mappers de normalizacao:
   - `mapScanToAsset(scan)` → `IntelligenceAsset` (tipo `audience_scan`)
   - `mapAutopsyToAsset(doc)` → `IntelligenceAsset` (tipo `autopsy`)
   - `mapOfferToAsset(doc)` → `IntelligenceAsset` (tipo `offer`)

**Acao — Parte B: Panel `AssetsPanel`:**
1. Em `app/src/components/intelligence/discovery/assets-panel.tsx`, substituir placeholder:
   - Grid responsivo: 1 col mobile, 2 cols tablet, 3 cols desktop
   - Card por asset: icone por tipo (Search para scan, Shield para autopsy, Gift para offer, Eye para spy), nome, resumo truncado, data formatada, Badge de status (ready=green, processing=yellow, error=red)
   - Score indicator quando disponivel
   - Skeleton loading (padrao shadcn/ui `Skeleton` component)
   - Empty state: "Nenhum asset de inteligencia encontrado. Execute scans, autopsias ou crie ofertas para preencher este painel."
   - Click em card: link para detalhe (ex: `/intelligence/autopsy/{sourceId}` para autopsies)
   - `limit(20)` por collection na query inicial (R1 do PRD: prevenir query pesada)
   - Usar componentes shadcn/ui existentes: `Card`, `Badge`, `Skeleton`, `Button`
   - Dark theme consistente com resto da Intelligence Wing

**Acao — Parte C: Atualizar consumer `discovery/page.tsx`:**
1. Verificar props do AssetsPanel e atualizar se necessario

**Arquivos:**
- `app/src/types/intelligence.ts` — **MODIFICAR** (adicionar IntelligenceAsset)
- `app/src/lib/hooks/use-intelligence-assets.ts` — **MODIFICAR** (implementar hook real)
- `app/src/components/intelligence/discovery/assets-panel.tsx` — **MODIFICAR** (implementar panel real)
- `app/src/app/intelligence/discovery/page.tsx` — **MODIFICAR** (atualizar consumer)
- `app/src/lib/firebase/scoped-data.ts` — **MODIFICAR** (adicionar queries se necessario)

**Leitura (schemas e padroes):**
- `app/src/types/autopsy.ts` — AutopsyDocument (para mapper)
- `app/src/types/offer.ts` — OfferDocument (para mapper)
- `app/src/types/personalization.ts` — AudienceScan (para mapper)
- `app/src/lib/firebase/scoped-data.ts` — padroes de query existentes
- `app/src/lib/firebase/assets.ts` — padroes de query com brandId

**DTs referenciados:** DT-05 (BLOCKING), DT-10
**Dependencias:** S29-FT-02 (collections autopsies + offers precisam existir)
**Gate Check:** Nao
**SC mapeados:** SC-01, SC-02

**AC:**
- [ ] Tipo `IntelligenceAsset` adicionado em `types/intelligence.ts`
- [ ] Hook `useIntelligenceAssets(brandId)` retorna dados reais via multi-query
- [ ] Multi-query paralela em 3 collections (`audience_scans`, `autopsies`, `offers`)
- [ ] NENHUMA collection `intelligence_assets` criada no Firestore (PA-01)
- [ ] Panel exibe grid de cards com icone, nome, resumo, data, status badge
- [ ] Skeleton loading funcional
- [ ] Empty state quando zero assets (NAO "Em desenvolvimento")
- [ ] `limit(20)` por collection na query
- [ ] Isolamento multi-tenant: queries filtram por `brandId`
- [ ] Dark theme consistente com Intelligence Wing
- [ ] `npx tsc --noEmit` = 0

---

### S29-FT-03: LeadState expansion com campos reais do Propensity + Maestro [S+, ~1.5-2h]

**Objetivo:** Expandir a interface `LeadState` removendo o catch-all `[key: string]: unknown` e adicionando campos concretos derivados dos DOIS motores que escrevem em `brands/{brandId}/leads/{leadId}`: PropensityEngine e PersonalizationMaestro.

> **[ARCH DT-08 — P1, Nao Blocking]:** LeadState e COMPARTILHADA por 2 motores. PropensityEngine grava `score`, `segment`, `reasoning`. Maestro grava `currentAwareness`, `lastInteraction`, `tags`, `score`, `metadata`. A interface deve ser a UNIAO de ambos. Renomear `score` → `propensityScore` para evitar conflito de merge.
>
> **[ARCH PA-05]:** NUNCA misturar campo `score` generico — usar `propensityScore` para PropensityEngine.

**Acao:**
1. Em `app/src/types/personalization.ts`, SUBSTITUIR a interface `LeadState` (L56-64):
   ```typescript
   export interface LeadState {
     // === Identificacao (obrigatorios) ===
     leadId: string;
     brandId: string;

     // === Awareness (PersonalizationMaestro) ===
     awarenessLevel: 'UNAWARE' | 'PROBLEM_AWARE' | 'SOLUTION_AWARE' | 'PRODUCT_AWARE' | 'MOST_AWARE';

     // === Propensity (PropensityEngine S28-PS-03) ===
     propensityScore: number;            // 0-1 (derivado de PropensityResult.score)
     segment: 'hot' | 'warm' | 'cold';  // Derivado de PropensityResult.segment
     reasoning: string[];                // Derivado de PropensityResult.reasoning

     // === Interaction tracking (Maestro) ===
     lastInteraction?: {
       type: 'ad_click' | 'dm_received' | 'comment_made' | 'page_view';
       platform: 'meta' | 'instagram' | 'web';
       timestamp: Timestamp;
       contentId?: string;
     };
     eventCount: number;                 // Total de eventos processados
     tags: string[];                     // Tags atribuidas pelo Maestro

     // === Timestamps ===
     firstSeenAt?: Timestamp;
     lastInteractionAt?: Timestamp;
     updatedAt: Timestamp;

     // === Metadata extensivel ===
     metadata?: Record<string, unknown>; // Dados adicionais do Maestro
   }
   ```
2. Remover marcacoes `@stub` e `@todo`
3. Em `app/src/lib/intelligence/personalization/propensity.ts`, atualizar `persistSegment()`:
   - Renomear campo `score` → `propensityScore` no `setDoc`:
     ```typescript
     // ANTES: score: result.score
     // DEPOIS: propensityScore: result.score
     ```
4. Verificar consumers de `LeadState` e adaptar se necessario:
   - `engine.ts` (PersonalizationEngine)
   - `middleware.ts` (PersonalizationMiddleware)
   - `maestro.ts` (se existir referencia a `score` generico)

**Arquivos:**
- `app/src/types/personalization.ts` — **MODIFICAR** (expandir LeadState)
- `app/src/lib/intelligence/personalization/propensity.ts` — **MODIFICAR** (renomear `score` → `propensityScore`)

**Leitura (consumers — verificar impacto):**
- `app/src/lib/intelligence/personalization/engine.ts` — consumer de LeadState
- `app/src/lib/intelligence/personalization/middleware.ts` — consumer de LeadState

**DTs referenciados:** DT-08
**Dependencias:** S29-GATE-01 aprovado (melhor executar apos FT-02 para alinhamento de campos)
**Gate Check:** Nao
**SC mapeados:** SC-05

**AC:**
- [ ] `LeadState` sem `[key: string]: unknown` catch-all
- [ ] `awarenessLevel` com tipo union concreto (nao `string` generico)
- [ ] Campos `propensityScore`, `segment`, `reasoning` presentes (PropensityEngine)
- [ ] Campos `lastInteraction`, `eventCount`, `tags` presentes (Maestro)
- [ ] `propensity.ts` grava `propensityScore` (nao `score`) no Firestore
- [ ] Novos campos opcionais — zero breaking change para consumers existentes
- [ ] `metadata?: Record<string, unknown>` mantido para extensibilidade do Maestro
- [ ] Marcacoes `@stub` e `@todo` removidas
- [ ] `npx tsc --noEmit` = 0

---

## Fase 2: Feature (STRETCH) [~3-4h]

> **STRETCH:** S29-FT-04 so e executado se FT-01 a FT-03 estiverem concluidos com sobra de tempo (Ressalva R2). Pode ser movido para S30 sem impacto no North Star.

---

### S29-FT-04: Rate Limiting por brandId [M, ~3-4h] — STRETCH

**Objetivo:** Implementar guardrails de quota por marca para prevenir abuso de API calls e scans de inteligencia. Guard function + Firestore counters atomicos.

> **[ARCH DT-09 — P1, Nao Blocking]:** Guard function per-route (consistente com `requireBrandAccess()`). Firestore counters com `increment()` atomico (serverless-safe). Reset diario. Admin routes ISENTAS.
>
> **[ARCH PA-06]:** NUNCA rate-limitar rotas `/api/admin/*`.

**Acao — Parte A: Guard function:**
1. Criar `app/src/lib/guards/rate-limiter.ts`:
   ```typescript
   type RateLimitAction = 'api_call' | 'ai_credit' | 'intelligence_scan';

   interface RateLimitResult {
     allowed: boolean;
     remaining: number;
     resetAt: Timestamp;
   }

   const DEFAULT_LIMITS = {
     maxApiCalls: 500,
     maxAiCredits: 1000,
     maxScans: 100,
   } as const;

   export async function checkRateLimit(
     brandId: string,
     action: RateLimitAction,
     cost?: number
   ): Promise<RateLimitResult>
   ```
2. Implementacao:
   - Document path: `brands/{brandId}/quotas/daily_YYYY-MM-DD`
   - Ler quota atual (ou criar com defaults se primeiro request do dia)
   - Verificar limite para a acao
   - Se permitido: incrementar counter (fire-and-forget) e retornar `{ allowed: true, remaining, resetAt }`
   - Se bloqueado: retornar `{ allowed: false, remaining: 0, resetAt }`
   - Logging: `console.warn` quando quota > 80%

**Acao — Parte B: Schema Firestore (`brands/{brandId}/quotas/{period}`):**
```typescript
interface QuotaDocument {
  brandId: string;
  period: string;                     // 'daily_YYYY-MM-DD'
  counters: {
    apiCalls: number;
    aiCredits: number;
    intelligenceScans: number;
  };
  limits: {
    maxApiCalls: number;              // Default: 500/dia
    maxAiCredits: number;             // Default: 1000/dia
    maxScans: number;                 // Default: 100/dia
  };
  resetAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Acao — Parte C: Integrar nas rotas de alto consumo:**

| Rota | Action | Cost |
|:-----|:-------|:-----|
| `intelligence/audience/scan` | `intelligence_scan` | 1 |
| `intelligence/autopsy/run` | `intelligence_scan` | 1 |
| `intelligence/spy` | `intelligence_scan` | 1 |
| `funnels/generate` | `ai_credit` | 5 |
| `social/generate` | `ai_credit` | 2 |
| `design/generate` | `ai_credit` | 5 |
| `copy/generate` | `ai_credit` | 1 |

Para cada rota, adicionar apos `requireBrandAccess`:
```typescript
const rateCheck = await checkRateLimit(safeBrandId, 'intelligence_scan');
if (!rateCheck.allowed) {
  return createApiError(429, 'Rate limit exceeded', {
    code: 'RATE_LIMIT_EXCEEDED',
    details: { remaining: 0, resetAt: rateCheck.resetAt.toDate().toISOString() },
  });
}
```

**Arquivos:**
- `app/src/lib/guards/rate-limiter.ts` — **CRIAR**
- `app/src/app/api/intelligence/audience/scan/route.ts` — **MODIFICAR** (integrar guard)
- `app/src/app/api/intelligence/autopsy/run/route.ts` — **MODIFICAR** (integrar guard)
- `app/src/app/api/intelligence/spy/route.ts` — **MODIFICAR** (integrar guard)
- `app/src/app/api/funnels/generate/route.ts` — **MODIFICAR** (integrar guard)
- `app/src/app/api/social/generate/route.ts` — **MODIFICAR** (integrar guard)
- `app/src/app/api/design/generate/route.ts` — **MODIFICAR** (integrar guard)
- `app/src/app/api/copy/generate/route.ts` — **MODIFICAR** (integrar guard)

**DTs referenciados:** DT-09
**Dependencias:** S29-FT-01 a FT-03 concluidos e validados
**Gate Check:** Nao
**SC mapeados:** SC-10

**AC:**
- [ ] `rate-limiter.ts` criado com `checkRateLimit()` funcional
- [ ] Schema `QuotaDocument` no Firestore (`brands/{brandId}/quotas/daily_YYYY-MM-DD`)
- [ ] 7 rotas de alto consumo integradas com rate limiting
- [ ] Rotas `/api/admin/*` ISENTAS (PA-06)
- [ ] Retorna `createApiError(429, 'Rate limit exceeded')` quando bloqueado
- [ ] `increment()` atomico do Firestore (sem race conditions)
- [ ] Reset diario (novo documento por dia)
- [ ] Limites default generosos (500 API calls, 1000 AI credits, 100 scans)
- [ ] `npx tsc --noEmit` = 0

---

## Checklist de Pre-Execucao (Darllyson)

### Antes de comecar qualquer story:
- [ ] Ler este arquivo (`stories.md`) por completo
- [ ] Ler `allowed-context.md` para proibicoes e arquivos permitidos
- [ ] Confirmar 2 Blocking DTs compreendidos:
  - [ ] **DT-03**: processAssetText — DELETAR stub (NAO reimplementar). Real esta em `assets-server.ts`
  - [ ] **DT-05**: Discovery Hub — multi-query em 3 collections (NAO criar `intelligence_assets`)
- [ ] Confirmar `npx tsc --noEmit` = 0 erros (baseline pos-Sigma)
- [ ] Confirmar `npm run build` compila (baseline 103+ rotas)
- [ ] Executar `npm test` e confirmar baseline de 224/224 pass

### Validacoes incrementais — Fase 1:
- [ ] Apos CL-01: budget-optimizer no contract-map
- [ ] Apos CL-02: Reporting types sem catch-all, briefing-bot compila
- [ ] Apos CL-03: processAssetText removido, assets-server.ts intocado
- [ ] Apos CL-04: 13/13 pontos migrados nos webhooks
- [ ] **GATE CHECK 1**: tsc + build + tests (G1-01 a G1-07)

### Validacoes incrementais — Fase 2:
- [ ] Apos FT-02: Autopsy + Offer persistem no Firestore
- [ ] Apos FT-01: Discovery Hub mostra dados reais via multi-query
- [ ] Apos FT-03: LeadState expandida, zero catch-all
- [ ] (STRETCH) Apos FT-04: Rate limiting funcional em 7 rotas

### Validacao final (TODAS as fases):
- [ ] `npx tsc --noEmit` → `Found 0 errors`
- [ ] `npm run build` → Sucesso (>= 103 rotas)
- [ ] `npm test` → >= 224/224 pass, 0 fail
- [ ] SC-01 a SC-09 todos aprovados
- [ ] (STRETCH) SC-10 aprovado

---
*Stories preparadas por Leticia (SM) — NETECMT v2.0*
*Incorpora 12 Decision Topics + 3 Correcoes de Premissa do Architecture Review (Athos)*
*Sprint 29: Assets & Persistence Hardening | 07/02/2026*
*9 stories (4 cleanup + 1 gate + 3 feature core + 1 STRETCH) | Estimativa: 11-13.5h (sem STRETCH) / 14-17.5h (com STRETCH)*
*Legenda: XS = Extra Small (< 30min), S = Small (< 2h), S+ = Small Extended, M = Medium (2-4h), L = Large (4-8h)*
