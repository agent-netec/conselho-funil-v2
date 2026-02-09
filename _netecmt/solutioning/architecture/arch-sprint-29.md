# Architecture Review: Sprint 29 — Assets & Persistence Hardening

**Versao:** 1.0  
**Responsavel:** Athos (Architect)  
**Status:** APROVADO COM RESSALVAS (12 DTs, 2 Blocking)  
**Data:** 07/02/2026  
**PRD Ref:** `_netecmt/solutioning/prd/prd-sprint-29-assets-persistence-hardening.md`  
**Arch Review Predecessora:** `_netecmt/solutioning/architecture/arch-sprint-sigma.md`  
**Sprint Predecessora:** Sprint Sigma (QA 99/100)  
**Baseline:** 224/224 testes, tsc=0, build=103+ rotas

---

## 1. Sumario Executivo

Apos leitura completa de 20+ arquivos-fonte (stubs de hooks/components, rotas de autopsy/offer, tipos de personalizacao/reporting/autopsy/offer, pipeline de assets/embeddings/RAG, propensity engine, briefing-bot, maestro, webhooks, assets-server, padroes Sigma), esta Architecture Review **APROVA** a Sprint 29 com **12 Decision Topics** (DT-01 a DT-12), sendo **2 blocking** que devem ser resolvidos antes ou durante a implementacao.

O PRD esta muito bem estruturado, herda corretamente os padroes Sigma, e o escopo e realista para pos-estabilizacao. A analise de codigo revela **3 premissas incorretas do PRD** e **2 oportunidades de simplificacao** que, se aproveitadas, reduzem o esforco total.

### Descobertas Criticas (Divergencias vs PRD)

> **DC-01: `processAssetText()` — existem DUAS versoes, nao uma**
>
> O PRD (S29-CL-03) trata `processAssetText()` em `assets.ts` (L194-196) como o unico ponto de decisao. Porem, existe uma implementacao **REAL e funcional** em `assets-server.ts` (L20+) que ja faz chunking + embeddings + upsert no Pinecone. A rota `brands/[brandId]/assets/url/route.ts` (L82) importa e usa a versao de `assets-server.ts`.
>
> - `assets.ts` (client): stub VAZIO — nunca chamada em producao
> - `assets-server.ts` (server): implementacao COMPLETA — usada pela rota de URL
>
> **Impacto:** O stub em `assets.ts` deve ser REMOVIDO (nao reimplementado). O pipeline real ja existe.

> **DC-02: Discovery Hub Assets — `intelligence_assets` e uma AGREGACAO, nao uma collection nova**
>
> O PRD propoe buscar de `brands/{brandId}/intelligence_assets`. Porem, os dados de inteligencia ja existem em collections separadas:
> - Audience Scans: `brands/{brandId}/audience_scans` (personalization.ts L128)
> - Autopsies: `brands/{brandId}/autopsies/{id}` (sera criada em S29-FT-02)
> - Offers: `brands/{brandId}/offers/{id}` (sera criada em S29-FT-02)
> - Spy Dossiers: gerados mas nao persistidos (backlog)
>
> Criar uma collection separada `intelligence_assets` gera duplicacao de dados e risco de dessincronizacao.

> **DC-03: LeadState e COMPARTILHADA por dois motores — PropensityEngine e PersonalizationMaestro**
>
> Ambos escrevem em `brands/{brandId}/leads/{leadId}` com `merge: true`. O PropensityEngine grava `score`, `segment`, `reasoning`, `updatedAt`. O PersonalizationMaestro grava `currentAwareness`, `lastInteraction`, `tags`, `score`, `metadata`, `updatedAt`. A interface `LeadState` precisa ser a UNIAO de ambos.

---

## 2. Analise por Item do PRD

### 2.1 FASE 1: Cleanup

#### DT-01 — contract-map: budget-optimizer (S29-CL-01) — P2, Nao Blocking

**Analise:** Item trivial e correto. `budget-optimizer.ts` pertence a lane `automation` (mesmo path pattern de `engine.ts`).

**Recomendacao:** Registrar como sub-entry na lane `automation` existente:

```yaml
automation:
  paths:
    - app/src/lib/automation/engine.ts
    - app/src/lib/automation/budget-optimizer.ts  # S29-CL-01 (N1 S28)
    - app/src/lib/automation/adapters/
    - app/src/lib/automation/normalizer.ts
```

**Severidade:** P2 | **Blocking:** Nao

---

#### DT-02 — Reporting Types: AIAnalysisResult e ReportMetrics (S29-CL-02) — P1, Nao Blocking

**Analise do consumer real (`briefing-bot.ts`):**

```typescript
// briefing-bot.ts L27-35 — consumo REAL dos tipos
analysis.summary           // string — usado em template
analysis.insights          // iterado como string[] (L27: `i: string`)
analysis.recommendations   // iterado como string[] (L30: `r: string`)
metrics.roi               // number — usado em comparacao e formatacao
metrics.adSpend           // number — formatado como moeda
metrics.ltvMaturation     // number — formatado como porcentagem
```

**Divergencia encontrada:** `ClientReport.aiAnalysis.insights` em `reporting.ts` (L26-29) define insights como `{type: 'lamp' | 'target' | 'alert', text: string}[]`, mas `briefing-bot.ts` trata como `string[]`. O stub `AIAnalysisResult` ja tem `insights: string[]`, alinhado com o consumer real.

**Schema proposto para AIAnalysisResult:**

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

**Schema proposto para ReportMetrics:**

```typescript
export interface ReportMetrics {
  roi: number;                        // Return on Investment (ex: 2.5 = 250%)
  adSpend: number;                    // Investimento em ads (R$)
  ltvMaturation: number;              // Maturacao LTV (%)
  revenue?: number;                   // Receita bruta (R$)
  cpa?: number;                       // Custo por aquisicao (R$)
  roas?: number;                      // Return on Ad Spend
  roiPredicted?: number;              // ROI projetado (S22)
  conversions?: number;               // Total de conversoes no periodo
  period?: {                          // Periodo de referencia
    start: Timestamp;
    end: Timestamp;
  };
}
```

**Regras:**
- Campos existentes (`summary`, `insights`, `recommendations`, `roi`, `adSpend`, `ltvMaturation`) sao OBRIGATORIOS — manter exatamente como estao
- Novos campos sao OPCIONAIS (`?`) — zero breaking change para briefing-bot
- Remover `[key: string]: unknown` de ambas
- Remover marcacoes `@stub` e `@todo`

**Severidade:** P1 | **Blocking:** Nao

---

#### DT-03 — processAssetText: REMOVER Stub Client, MANTER Server (S29-CL-03) — P0, BLOCKING

**Analise detalhada — as DUAS versoes:**

| Arquivo | Tipo | Implementacao | Callers Reais |
|:--------|:-----|:-------------|:-------------|
| `assets.ts` (L194-196) | **Client** | **Stub VAZIO** | 0 callers reais (apenas referenciado em testes legados e docs) |
| `assets-server.ts` (L20+) | **Server** | **COMPLETA** (chunking + embeddings + Pinecone upsert) | `brands/[brandId]/assets/url/route.ts` (L82) |

**Callers da versao client (stub vazio) em `assets.ts`:**
- Nenhuma rota de producao importa `processAssetText` de `assets.ts`
- `brands/[brandId]/assets/url/route.ts` (L12) importa de `assets-server.ts`
- Testes legados podem referenciar — verificar com `rg`

**Callers da versao server (real) em `assets-server.ts`:**
- `app/src/app/api/brands/[brandId]/assets/url/route.ts` — importa e usa (L82)
- `app/src/app/api/admin/process-asset/route.ts` — provavelmente importa de server
- `app/src/app/api/ingest/url/route.ts` — provavelmente importa de server

**Decisao: REMOVER o stub em `assets.ts`**

O stub em `assets.ts` e codigo morto — nenhum caller real depende dele. A implementacao real em `assets-server.ts` ja resolve o problema completo. A funcao em `assets-server.ts` possui:
1. Chunking via `createChunks()`
2. Embedding via `generateEmbeddingsBatch()`
3. Upsert no Pinecone via `upsertToPinecone()`
4. Update de status no Firestore
5. Browser guard (`typeof window !== 'undefined'`)

**Acao obrigatoria:**
1. Remover `processAssetText()` de `assets.ts` (stub vazio)
2. Remover import de `processAssetText` em qualquer teste que importe de `assets.ts`
3. Verificar se algum arquivo importa de `assets.ts` em vez de `assets-server.ts` e corrigir
4. Manter `assets-server.ts` intocado — ja funcional

**Impacto na estimativa:** De S (~45min) para XS (~15min). E so deletar um stub.

**Severidade:** P0 | **Blocking:** SIM (PRD assume que precisa reimplementar; na verdade, so precisa deletar)

---

#### DT-04 — Webhook Routes: Migrar para createApiError (S29-CL-04) — P1, Nao Blocking

**Analise dos pontos de erro legado:**

**`webhooks/dispatcher/route.ts`:**

| Linha | Formato Atual | Migracao |
|:------|:-------------|:---------|
| L22 | `NextResponse.json({ error: 'brandId is required' }, { status: 400 })` | `createApiError(400, 'brandId is required')` |
| L35 | `NextResponse.json({ error: 'Configuration missing' }, { status: 500 })` | `createApiError(500, 'Configuration missing')` |
| L41 | `NextResponse.json({ error: 'Invalid signature' }, { status: 401 })` | `createApiError(401, 'Invalid signature')` |
| L54 | `NextResponse.json({ success: true })` | `createApiSuccess({ processed: true })` |
| L61 | `NextResponse.json({ error: 'Internal...', details: error.message }, { status: 500 })` | `createApiError(500, 'Internal processing error', { details: error.message })` |
| L82 | `NextResponse.json({ error: 'Forbidden' }, { status: 403 })` | `createApiError(403, 'Forbidden')` |

**`webhooks/ads-metrics/route.ts`:**

| Linha | Formato Atual | Migracao |
|:------|:-------------|:---------|
| L27-30 | `NextResponse.json({ error: 'Configuração...' }, { status: 500 })` | `createApiError(500, 'Configuração de segurança incompleta no servidor')` |
| L35 | `NextResponse.json({ error: 'Assinatura...' }, { status: 401 })` | `createApiError(401, 'Assinatura x-hub-signature-256 ausente')` |
| L47 | `NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 })` | `createApiError(401, 'Assinatura inválida')` |
| L55 | `NextResponse.json({ error: 'Payload JSON inválido' }, { status: 400 })` | `createApiError(400, 'Payload JSON inválido')` |
| L61 | `NextResponse.json({ error: 'campaign_id...' }, { status: 400 })` | `createApiError(400, 'campaign_id é obrigatório no payload')` |
| L84-88 | `NextResponse.json({ success: true, message: '...', timestamp: '...' })` | `createApiSuccess({ message: '...', timestamp: '...' })` |
| L92-94 | `NextResponse.json({ error: '...', details: error.message }, { status: 500 })` | `createApiError(500, '...', { details: error.message })` |

**Total: 13 pontos (6 no dispatcher + 7 no ads-metrics).**

**Regras de migracao:**
- Manter exatamente os mesmos status codes e mensagens
- `createApiError` ja inclui campo `error: string` (PA-04 Sigma) — retrocompativel
- Para respostas de sucesso dos webhooks, usar `createApiSuccess(payload)` — o campo `success: true` ja existia no formato original
- Importar de `@/lib/utils/api-response`

**ATENCAO para server-to-server:**
- Webhooks sao consumidos por servicos EXTERNOS (Meta, Google, Instagram)
- O campo `error` na resposta e informativo, nao critico — servicos externos checam status code HTTP
- `createApiError` mantem campo `error: string` — zero breaking change

**Severidade:** P1 | **Blocking:** Nao

---

### 2.2 FASE 2: Features

#### DT-05 — Discovery Hub Assets: Schema e Estrategia de Query (S29-FT-01) — P0, BLOCKING

**Problema Central:** O PRD propoe `brands/{brandId}/intelligence_assets` como collection unica. Porem, os dados de inteligencia ja existem (ou serao criados em S29) em collections separadas:

| Tipo de Asset | Collection Path | Status |
|:-------------|:---------------|:-------|
| Audience Scans | `brands/{brandId}/audience_scans` | Existe (personalization engine) |
| Autopsies | `brands/{brandId}/autopsies/{id}` | Sera criada (S29-FT-02) |
| Offers | `brands/{brandId}/offers/{id}` | Sera criada (S29-FT-02) |
| Spy Dossiers | Nao persistido | Backlog |

**Opcoes:**

| Opcao | Descricao | Pros | Contras |
|:------|:----------|:-----|:--------|
| **A: Multi-query** | Hook query `audience_scans` + `autopsies` + `offers` separadamente | Dados sempre atualizados, zero duplicacao | 3 queries paralelas por render, mais complexo |
| **B: Denormalized summary** (PRD) | Nova collection `intelligence_assets` com summaries | Query unica, simples | Duplicacao de dados, risco de dessincronizacao, custo extra de write |
| **C (Recomendada): Multi-query com cache** | Query paralela das 3 collections com `useEffect` + state unificado | Dados atualizados, zero duplicacao, boa UX com loading parcial | Marginalmente mais complexo que B, mas muito mais robusto |

**Recomendacao: OPCAO C — Multi-query com cache local**

Justificativa:
1. **Zero duplicacao**: Nao cria collection extra
2. **Sempre atualizado**: Le direto da source of truth
3. **Isolamento multi-tenant natural**: Cada query usa `brands/{brandId}/...` — impossivel acesso cross-tenant
4. **Pattern existente**: O codebase ja usa `getDocs()` com queries filtrando por brandId em `assets.ts`
5. **S30+ friendly**: Quando Spy Dossiers forem persistidos, basta adicionar mais uma query

**Schema unificado do item no hook (IntelligenceAsset):**

```typescript
// types/intelligence.ts (novo tipo — ou adicionar ao intelligence.ts existente)
export interface IntelligenceAsset {
  id: string;
  brandId: string;
  type: 'audience_scan' | 'autopsy' | 'offer' | 'spy_dossier';
  name: string;                      // Nome amigavel para exibicao
  summary: string;                   // Resumo curto (1-2 linhas)
  status: 'ready' | 'processing' | 'error';
  score?: number;                    // Score agregado (0-10 para autopsy, 0-1 para propensity)
  createdAt: Timestamp;
  sourceId: string;                  // ID original na collection de origem
  metadata?: Record<string, unknown>; // Dados extras por tipo
}
```

**Interface do hook:**

```typescript
// lib/hooks/use-intelligence-assets.ts
export interface UseIntelligenceAssetsReturn {
  assets: IntelligenceAsset[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useIntelligenceAssets(brandId: string): UseIntelligenceAssetsReturn
```

**Implementacao do hook — arquitetura interna:**

```typescript
// Pseudocodigo — arquitetura interna do hook
export function useIntelligenceAssets(brandId: string) {
  const [assets, setAssets] = useState<IntelligenceAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssets = useCallback(async () => {
    if (!brandId) { setAssets([]); setLoading(false); return; }
    setLoading(true);
    try {
      // Queries paralelas — 3 collections
      const [scans, autopsies, offers] = await Promise.all([
        getAudienceScans(brandId),    // brands/{brandId}/audience_scans
        getAutopsies(brandId),        // brands/{brandId}/autopsies
        getOffers(brandId),           // brands/{brandId}/offers
      ]);

      // Normalizar para IntelligenceAsset
      const normalized = [
        ...scans.map(mapScanToAsset),
        ...autopsies.map(mapAutopsyToAsset),
        ...offers.map(mapOfferToAsset),
      ].sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());

      setAssets(normalized);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar assets');
    } finally {
      setLoading(false);
    }
  }, [brandId]);

  useEffect(() => { fetchAssets(); }, [fetchAssets]);

  return { assets, loading, error, refetch: fetchAssets };
}
```

**Funcoes de query necessarias (adicionar em `lib/firebase/`):**

```typescript
// Novas funcoes — podem ser adicionadas a scoped-data.ts ou assets.ts

// getAudienceScans(brandId: string, maxResults = 20): Promise<AudienceScan[]>
// → query: collection(db, 'brands', brandId, 'audience_scans'), orderBy('metadata.createdAt', 'desc'), limit(maxResults)

// getAutopsies(brandId: string, maxResults = 20): Promise<AutopsyDocument[]>
// → query: collection(db, 'brands', brandId, 'autopsies'), orderBy('createdAt', 'desc'), limit(maxResults)

// getOffers(brandId: string, maxResults = 20): Promise<OfferDocument[]>
// → query: collection(db, 'brands', brandId, 'offers'), orderBy('createdAt', 'desc'), limit(maxResults)
```

**Mappers (normalizar para IntelligenceAsset):**

```typescript
function mapScanToAsset(scan: AudienceScan): IntelligenceAsset {
  return {
    id: scan.id,
    brandId: scan.brandId,
    type: 'audience_scan',
    name: scan.name,
    summary: `${scan.propensity.segment.toUpperCase()} — ${scan.metadata.leadCount} leads`,
    status: 'ready',
    score: scan.propensity.score,
    createdAt: scan.metadata.createdAt,
    sourceId: scan.id,
  };
}

function mapAutopsyToAsset(doc: AutopsyDocument): IntelligenceAsset {
  return {
    id: doc.id,
    brandId: doc.brandId,
    type: 'autopsy',
    name: `Autopsia: ${new URL(doc.url).hostname}`,
    summary: doc.result?.summary || 'Analise em andamento',
    status: doc.status === 'completed' ? 'ready' : doc.status === 'error' ? 'error' : 'processing',
    score: doc.result?.score,
    createdAt: doc.createdAt,
    sourceId: doc.id,
  };
}

function mapOfferToAsset(doc: OfferDocument): IntelligenceAsset {
  return {
    id: doc.id,
    brandId: doc.brandId,
    type: 'offer',
    name: doc.name,
    summary: `Score: ${doc.scoring.total}/10`,
    status: 'ready',
    score: doc.scoring.total,
    createdAt: doc.createdAt,
    sourceId: doc.id,
  };
}
```

**Panel (AssetsPanel) — Requisitos de UI:**
- Grid responsivo: 1 col mobile, 2 cols tablet, 3 cols desktop
- Card por asset: icone por tipo (Search, Shield, Gift, Eye), nome, resumo, data, Badge de status
- Skeleton loading (padrao shadcn/ui)
- Empty state quando zero assets (nao "Em desenvolvimento")
- Click para expandir/navegar para o detalhe (link para `/intelligence/autopsy/{id}` etc)
- `limit(20)` por collection na query inicial (R1 do PRD: prevenir query pesada)

**Severidade:** P0 | **Blocking:** SIM (premissa de collection diverge — impacta schema e implementacao)

---

#### DT-06 — Persistencia Autopsy (S29-FT-02a) — P1, Nao Blocking

**Schema Firestore: `brands/{brandId}/autopsies/{response.id}`**

O tipo `AutopsyDocument` ja existe em `types/autopsy.ts` (L52-66) e e mais completo que o schema proposto no PRD:

```typescript
// types/autopsy.ts — AutopsyDocument (JA EXISTE — usar este)
export interface AutopsyDocument {
  id: string;                         // aut_{uuid}
  brandId: string;                    // Multi-tenant isolation
  url: string;                        // URL analisada
  status: 'pending' | 'processing' | 'completed' | 'error';
  request: AutopsyRunRequest;         // Request original (context, depth)
  result?: AutopsyReport;             // Report completo (score, heuristics, recommendations)
  error?: { code: string; message: string };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  expiresAt: Timestamp;               // TTL: 30 dias
}
```

**Implementacao no route handler:**

```typescript
// autopsy/run/route.ts — apos L79 (construcao da response)
// SUBSTITUIR o TODO da L81

const autopsyDoc: AutopsyDocument = {
  id: response.id,
  brandId: safeBrandId,
  url,
  status: 'completed',
  request: body,
  result: report,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  expiresAt: Timestamp.fromMillis(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
};

// Fire-and-forget (padrao PropensityEngine — nao bloquear response)
import { doc, setDoc } from 'firebase/firestore';
const autopsyRef = doc(db, 'brands', safeBrandId, 'autopsies', response.id);
setDoc(autopsyRef, autopsyDoc).catch(err => {
  console.error('[Autopsy] Persist failed:', err);
});

return createApiSuccess(response);
```

**Indexacao Firestore recomendada:**
- Composite index: `brands/{brandId}/autopsies` → `status` ASC + `createdAt` DESC
- Single field: `expiresAt` (para TTL cleanup futuro)

**Dados orfaos:** O campo `expiresAt` com TTL de 30 dias previne acumulo. Em futuro (S31+), um Cloud Function pode limpar documentos expirados. Por ora, o TTL e informativo.

**Severidade:** P1 | **Blocking:** Nao

---

#### DT-07 — Persistencia Offer (S29-FT-02b) — P1, Nao Blocking

**Schema Firestore: `brands/{brandId}/offers/{offerDoc.id}`**

O tipo `OfferDocument` ja existe em `types/offer.ts` (L12-43) e esta COMPLETO:

```typescript
// types/offer.ts — OfferDocument (JA EXISTE — usar este)
export interface OfferDocument {
  id: string;                         // off_{uuid}
  brandId: string;                    // Multi-tenant isolation
  name: string;
  status: 'draft' | 'active' | 'archived';
  components: { ... };                // Stacking, bonuses, risk reversal, scarcity
  scoring: { total, factors, analysis };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Implementacao no route handler:**

```typescript
// offer/save/route.ts — SUBSTITUIR L54-55 (TODO + codigo comentado)

import { doc, setDoc } from 'firebase/firestore';
const offerRef = doc(db, 'brands', safeBrandId, 'offers', offerDoc.id);
await setDoc(offerRef, offerDoc);

return createApiSuccess({ offer: offerDoc });
```

**NOTA sobre fire-and-forget vs await:** Para Offer, o PRD diz "salvar" — o usuario espera confirmacao de que salvou. Diferente de Autopsy (que ja retorna o report e persiste em background), o Offer DEVE ser `await` porque:
1. O nome da rota e `offer/save` — semantica de "salvar"
2. Se falhar, o usuario deve ser notificado
3. O latencia de um `setDoc` e ~50-100ms — aceitavel

**Indexacao Firestore recomendada:**
- Composite index: `brands/{brandId}/offers` → `status` ASC + `createdAt` DESC

**Severidade:** P1 | **Blocking:** Nao

---

#### DT-08 — LeadState Expansion (S29-FT-03) — P1, Nao Blocking

**Analise dos dois motores que escrevem em `brands/{brandId}/leads/{leadId}`:**

| Motor | Campos Gravados | Merge? |
|:------|:---------------|:-------|
| `PropensityEngine.persistSegment()` | `leadId`, `brandId`, `score`, `segment`, `reasoning`, `updatedAt` | Sim (`merge: true`) |
| `PersonalizationMaestro.processInteraction()` | `brandId`, `currentAwareness`, `lastInteraction`, `tags`, `score`, `metadata`, `updatedAt` | Sim (`setDoc` com merge implicito via `updateDoc`) |

**Ambos escrevem `score`** — potencial conflito! PropensityEngine escreve score 0-1 (propensity), Maestro escreve score numerico (interaction-based). Como ambos usam `merge: true`, o ultimo a escrever ganha.

**Interface LeadState proposta (UNIAO dos dois motores + campos derivados):**

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
  firstSeenAt?: Timestamp;            // Quando o lead foi criado
  lastInteractionAt?: Timestamp;      // Alias para lastInteraction.timestamp
  updatedAt: Timestamp;               // Ultimo update (qualquer motor)

  // === Metadata extensivel ===
  metadata?: Record<string, unknown>; // Dados adicionais do Maestro
}
```

**Mudancas-chave vs stub atual:**
1. Removido `[key: string]: unknown` catch-all
2. Removido `score: number` generico — substituido por `propensityScore` (previne conflito com Maestro)
3. `awarenessLevel` agora tem tipo union concreto (era `string`)
4. Adicionados `segment`, `reasoning`, `eventCount`, `tags`, `firstSeenAt`
5. `lastInteraction` tipado com objeto (nao apenas Timestamp)

**Impacto em consumers:**

| Consumer | Import | Usa `[key: string]: unknown`? | Impacto |
|:---------|:-------|:-----------------------------|:--------|
| `maestro.ts` | `@/types/personalization` | Sim (usa `score` generico) | AJUSTAR — renomear para `propensityScore` ou usar `metadata` |
| `propensity.ts` | Nao importa LeadState | N/A | Zero impacto direto — mas persistSegment deve alinhar campo `score` → `propensityScore` |

**ATENCAO — Breaking change no PropensityEngine:**

PropensityEngine.persistSegment() (L152-163) grava campo `score`. Se renomearmos para `propensityScore` na interface, devemos tambem atualizar o `setDoc`:

```typescript
// propensity.ts — ANTES
await setDoc(leadRef, {
  leadId, brandId, score: result.score, segment: result.segment, ...
}, { merge: true });

// propensity.ts — DEPOIS
await setDoc(leadRef, {
  leadId, brandId, propensityScore: result.score, segment: result.segment, ...
}, { merge: true });
```

**Risco R3 do PRD mitigado:** Novos campos sao opcionais. O Maestro que usa `score` generico precisa ser atualizado para `propensityScore` — mas como usa `merge: true`, documentos existentes continuam funcionando. A migracao de campo e gradual via merge.

**Severidade:** P1 | **Blocking:** Nao

---

#### DT-09 — Rate Limiting por brandId (S29-FT-04 — STRETCH) — P1, Nao Blocking

**Estrategia recomendada: Guard function + Firestore counter**

**Por que Firestore counter (nao in-memory)?**
- Vercel serverless: cada invocacao pode ser uma instancia diferente — in-memory nao persiste entre requests
- Firestore `increment()` e atomico — sem race conditions
- Custo de 1 read + 1 write por check e aceitavel para rate limiting

**Por que guard function (nao middleware)?**
- Next.js App Router middleware roda no Edge Runtime — limitado em APIs
- Guard function e mais flexivel (pode ser seletiva por rota)
- Pattern consistente com `requireBrandAccess()` — mesmo padrao

**Schema Firestore: `brands/{brandId}/quotas/{period}`**

```typescript
// Documento: brands/{brandId}/quotas/daily_2026-02-07
interface QuotaDocument {
  brandId: string;
  period: string;                     // 'daily_YYYY-MM-DD'
  counters: {
    apiCalls: number;                 // Total de chamadas API
    aiCredits: number;                // Creditos AI consumidos
    intelligenceScans: number;        // Scans de inteligencia (audience, autopsy, spy)
  };
  limits: {                           // Limites (configuravel por brand)
    maxApiCalls: number;              // Default: 500/dia
    maxAiCredits: number;             // Default: 1000/dia
    maxScans: number;                 // Default: 100/dia
  };
  resetAt: Timestamp;                 // Proximo reset (meia-noite UTC)
  updatedAt: Timestamp;
}
```

**Guard function proposta:**

```typescript
// lib/guards/rate-limiter.ts (NOVO)
import { doc, getDoc, setDoc, increment, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

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
  cost: number = 1
): Promise<RateLimitResult> {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const periodKey = `daily_${today}`;
  const quotaRef = doc(db, 'brands', brandId, 'quotas', periodKey);

  // 1. Ler quota atual (ou criar com defaults)
  const snap = await getDoc(quotaRef);
  let quotaData = snap.exists() ? snap.data() : null;

  if (!quotaData) {
    // Primeiro request do dia — criar documento
    const resetAt = new Date();
    resetAt.setUTCHours(24, 0, 0, 0); // Meia-noite UTC seguinte
    quotaData = {
      brandId,
      period: periodKey,
      counters: { apiCalls: 0, aiCredits: 0, intelligenceScans: 0 },
      limits: DEFAULT_LIMITS,
      resetAt: Timestamp.fromDate(resetAt),
      updatedAt: Timestamp.now(),
    };
    await setDoc(quotaRef, quotaData);
  }

  // 2. Verificar limite
  const counterField = action === 'api_call' ? 'apiCalls'
    : action === 'ai_credit' ? 'aiCredits'
    : 'intelligenceScans';
  const limitField = action === 'api_call' ? 'maxApiCalls'
    : action === 'ai_credit' ? 'maxAiCredits'
    : 'maxScans';

  const current = quotaData.counters[counterField] || 0;
  const limit = quotaData.limits[limitField] || DEFAULT_LIMITS[limitField];
  const remaining = Math.max(0, limit - current - cost);

  if (current + cost > limit) {
    return { allowed: false, remaining: 0, resetAt: quotaData.resetAt };
  }

  // 3. Incrementar (fire-and-forget)
  setDoc(quotaRef, {
    counters: { [counterField]: increment(cost) },
    updatedAt: Timestamp.now(),
  }, { merge: true }).catch(err => {
    console.error('[RateLimiter] Increment failed:', err);
  });

  return { allowed: true, remaining, resetAt: quotaData.resetAt };
}
```

**Integracao nas rotas:**

```typescript
// Exemplo em intelligence/autopsy/run/route.ts
const rateCheck = await checkRateLimit(safeBrandId, 'intelligence_scan');
if (!rateCheck.allowed) {
  return createApiError(429, 'Rate limit exceeded', {
    code: 'RATE_LIMIT_EXCEEDED',
    details: { remaining: 0, resetAt: rateCheck.resetAt.toDate().toISOString() },
  });
}
```

**Rotas a integrar (alto consumo):**

| Rota | Action | Cost |
|:-----|:-------|:-----|
| `intelligence/audience/scan` | `intelligence_scan` | 1 |
| `intelligence/autopsy/run` | `intelligence_scan` | 1 |
| `intelligence/spy` | `intelligence_scan` | 1 |
| `funnels/generate` | `ai_credit` | 5 |
| `social/generate` | `ai_credit` | 2 |
| `design/generate` | `ai_credit` | 5 |
| `copy/generate` | `ai_credit` | 1 |

**Admin routes ISENTAS** — rotas em `/api/admin/*` nao devem ter rate limit.

**Severidade:** P1 | **Blocking:** Nao (STRETCH)

---

### 2.3 Correcoes nas Premissas do PRD

| # | Premissa do PRD | Realidade | Impacto na Estimativa |
|:--|:----------------|:----------|:---------------------|
| **CP-01** | "`processAssetText()` tem corpo vazio — implementar ou remover" | Existem DUAS versoes: stub vazio em `assets.ts` + implementacao REAL em `assets-server.ts`. Nenhum caller real usa o stub | -30min (so deletar, nao reimplementar) |
| **CP-02** | "Hook busca de `brands/{brandId}/intelligence_assets`" | Nao existe tal collection. Dados estao em `audience_scans`, `autopsies`, `offers` | +30min (multi-query vs single query) |
| **CP-03** | "LeadState precisa de `segment`, `propensityScore`, `reasoning`" | Correto, mas TAMBEM precisa de campos do Maestro (`currentAwareness`, `lastInteraction`, `tags`). Dois motores escrevem no mesmo path | +15min (unificar interface) |

---

## 3. Tabela Consolidada de Decision Topics

| DT | Titulo | Severidade | Blocking? | Fase | Item PRD | Acao |
|:---|:-------|:-----------|:----------|:-----|:---------|:-----|
| **DT-01** | contract-map: budget-optimizer | P2 | Nao | F1 | S29-CL-01 | Registrar na lane `automation` |
| **DT-02** | Reporting types: schemas concretos | P1 | Nao | F1 | S29-CL-02 | AIAnalysisResult + ReportMetrics com campos concretos, manter obrigatorios existentes |
| **DT-03** | processAssetText: REMOVER stub client | **P0** | **SIM** | F1 | S29-CL-03 | Deletar stub em `assets.ts`. Manter `assets-server.ts` intocado |
| **DT-04** | Webhook routes: createApiError | P1 | Nao | F1 | S29-CL-04 | Migrar 13 pontos (6+7) para createApiError/createApiSuccess |
| **DT-05** | Discovery Hub: multi-query, nao collection nova | **P0** | **SIM** | F2 | S29-FT-01 | Opcao C: query paralela em `audience_scans` + `autopsies` + `offers`, tipo unificado IntelligenceAsset |
| **DT-06** | Autopsy persistence: AutopsyDocument | P1 | Nao | F2 | S29-FT-02 | Usar tipo existente, fire-and-forget, TTL 30d |
| **DT-07** | Offer persistence: OfferDocument | P1 | Nao | F2 | S29-FT-02 | Usar tipo existente, await (nao fire-and-forget), zero schema novo |
| **DT-08** | LeadState: uniao de 2 motores | P1 | Nao | F2 | S29-FT-03 | Interface com campos de PropensityEngine + Maestro. Renomear `score` → `propensityScore` |
| **DT-09** | Rate Limiting: guard + Firestore | P1 | Nao | F2 | S29-FT-04 | Guard function `checkRateLimit()`, Firestore counters, reset diario |
| **DT-10** | IntelligenceAsset: tipo unificado | P1 | Nao | F2 | S29-FT-01 | Novo tipo para normalizar assets de 3 collections |
| **DT-11** | Autopsy fire-and-forget: logging | P2 | Nao | F2 | S29-FT-02 | `.catch(err => console.error())` obrigatorio |
| **DT-12** | Offer `await` vs fire-and-forget | P1 | Nao | F2 | S29-FT-02 | `await` (semantica de "save" — usuario espera confirmacao) |

---

## 4. Schemas Firestore Propostos

### 4.1 Autopsies: `brands/{brandId}/autopsies/{id}`

```
{
  id: "aut_<uuid>",                   // string
  brandId: "<brandId>",               // string — multi-tenant
  url: "https://...",                 // string
  status: "completed",               // 'pending' | 'processing' | 'completed' | 'error'
  request: {                          // AutopsyRunRequest
    brandId: "...",
    url: "...",
    depth: "quick",
    context: { targetAudience?: "...", mainOffer?: "..." }
  },
  result: {                           // AutopsyReport (quando completed)
    score: 7.5,                       // 0-10
    summary: "...",
    heuristics: { hook, story, offer, friction, trust },
    recommendations: [...],
    metadata: { screenshotUrl?, loadTimeMs, techStack }
  },
  error: null,                        // { code, message } quando status=error
  createdAt: Timestamp,
  updatedAt: Timestamp,
  expiresAt: Timestamp                // createdAt + 30 dias
}
```

**Indexes:**
- `brands/{brandId}/autopsies` → `createdAt` DESC (default sort)
- `brands/{brandId}/autopsies` → `status` ASC + `createdAt` DESC (filtro por status)

### 4.2 Offers: `brands/{brandId}/offers/{id}`

```
{
  id: "off_<uuid>",                   // string
  brandId: "<brandId>",               // string — multi-tenant
  name: "Oferta Black Friday",        // string
  status: "draft",                    // 'draft' | 'active' | 'archived'
  components: {
    coreProduct: { name, promise, price, perceivedValue },
    stacking: [...],
    bonuses: [...],
    riskReversal: "...",
    scarcity: "...",
    urgency: "..."
  },
  scoring: {
    total: 8.2,                       // Score geral
    factors: { dreamOutcome, perceivedLikelihood, timeDelay, effortSacrifice },
    analysis: ["...", "..."]
  },
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Indexes:**
- `brands/{brandId}/offers` → `createdAt` DESC (default sort)
- `brands/{brandId}/offers` → `status` ASC + `createdAt` DESC (filtro por status)

### 4.3 Rate Limit Quotas: `brands/{brandId}/quotas/{period}`

```
{
  brandId: "<brandId>",               // string
  period: "daily_2026-02-07",         // string
  counters: {
    apiCalls: 42,                     // number (increment atomico)
    aiCredits: 150,                   // number
    intelligenceScans: 8              // number
  },
  limits: {
    maxApiCalls: 500,                 // number (configuravel por brand)
    maxAiCredits: 1000,               // number
    maxScans: 100                     // number
  },
  resetAt: Timestamp,                 // Proximo reset (meia-noite UTC)
  updatedAt: Timestamp
}
```

**Indexes:** Nenhum adicional — acesso direto por document ID.

### 4.4 Audience Scans: `brands/{brandId}/audience_scans` (JA EXISTE)

Nenhuma alteracao. Referenciado pelo hook de Discovery Hub.

### 4.5 Leads: `brands/{brandId}/leads/{leadId}` (JA EXISTE — expandir schema)

```
{
  leadId: "<leadId>",
  brandId: "<brandId>",
  awarenessLevel: "PROBLEM_AWARE",    // AwarenessLevel
  propensityScore: 0.72,              // 0-1 (PropensityEngine)
  segment: "hot",                     // 'hot' | 'warm' | 'cold'
  reasoning: ["..."],                 // PropensityEngine reasoning
  lastInteraction: { type, platform, timestamp, contentId? },
  eventCount: 15,
  tags: ["engaged", "high-value"],
  firstSeenAt: Timestamp,
  lastInteractionAt: Timestamp,
  updatedAt: Timestamp,
  metadata: { ... }
}
```

---

## 5. Interfaces Propostas

### 5.1 LeadState (expandida)

```typescript
// types/personalization.ts — SUBSTITUIR o stub L56-64
export interface LeadState {
  leadId: string;
  brandId: string;
  awarenessLevel: 'UNAWARE' | 'PROBLEM_AWARE' | 'SOLUTION_AWARE' | 'PRODUCT_AWARE' | 'MOST_AWARE';
  propensityScore: number;            // 0-1
  segment: 'hot' | 'warm' | 'cold';
  reasoning: string[];
  lastInteraction?: {
    type: 'ad_click' | 'dm_received' | 'comment_made' | 'page_view';
    platform: 'meta' | 'instagram' | 'web';
    timestamp: Timestamp;
    contentId?: string;
  };
  eventCount: number;
  tags: string[];
  firstSeenAt?: Timestamp;
  lastInteractionAt?: Timestamp;
  updatedAt: Timestamp;
  metadata?: Record<string, unknown>;
}
```

### 5.2 AIAnalysisResult (expandida)

```typescript
// types/reporting.ts — SUBSTITUIR o stub L62-67
export interface AIAnalysisResult {
  summary: string;
  insights: string[];
  recommendations: string[];
  confidence?: number;                // 0-1
  dataContext?: string;
  generatedAt?: Timestamp;
}
```

### 5.3 ReportMetrics (expandida)

```typescript
// types/reporting.ts — SUBSTITUIR o stub L74-79
export interface ReportMetrics {
  roi: number;
  adSpend: number;
  ltvMaturation: number;
  revenue?: number;
  cpa?: number;
  roas?: number;
  roiPredicted?: number;
  conversions?: number;
  period?: {
    start: Timestamp;
    end: Timestamp;
  };
}
```

### 5.4 IntelligenceAsset (novo)

```typescript
// types/intelligence.ts — ADICIONAR
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

---

## 6. Estrategia de Rate Limiting

| Aspecto | Decisao | Justificativa |
|:--------|:--------|:-------------|
| **Abordagem** | Guard function per-route | Consistente com `requireBrandAccess()`. Mais flexivel que middleware |
| **Storage** | Firestore counters (atomico) | Serverless-safe. `increment()` e atomico. In-memory nao funciona no Vercel |
| **Reset** | Diario (meia-noite UTC) | Simples, previsivel. Novo documento por dia |
| **Limites default** | 500 API calls, 1000 AI credits, 100 scans | Generosos para prevenir false positives |
| **Configuravel** | Sim (campo `limits` no documento) | Permite overrides por brand (enterprise vs free) |
| **HTTP status** | 429 Too Many Requests | Standard, com `Retry-After` header opcional |
| **Isencoes** | Rotas `/api/admin/*` | Admin nao deve ser limitado |
| **Logging** | `console.warn` quando quota > 80% | Early warning antes do bloqueio |

---

## 7. Decisao sobre processAssetText

| Aspecto | Decisao |
|:--------|:--------|
| **Stub em `assets.ts`** | **REMOVER** — corpo vazio, zero callers reais |
| **Implementacao em `assets-server.ts`** | **MANTER INTOCADO** — funcional, usada pela rota de URL |
| **Callers a verificar** | `admin/process-asset/route.ts`, `ingest/url/route.ts` — confirmar que importam de `assets-server.ts` |
| **Testes** | Verificar se algum teste importa de `assets.ts` — atualizar import se necessario |
| **Impacto** | XS (~15min) — e so deletar 4 linhas (L190-197 de assets.ts) |

---

## 8. Mapa de Impacto

### Arquivos Criados (Novos)

| Arquivo | Fase | DT | Descricao |
|:--------|:-----|:---|:----------|
| `lib/guards/rate-limiter.ts` | F2 | DT-09 | Guard function de rate limiting (STRETCH) |

### Arquivos Modificados (por DT)

| Arquivo | DTs | Modificacao |
|:--------|:----|:-----------|
| `_netecmt/core/contract-map.yaml` | DT-01 | Adicionar budget-optimizer na lane automation |
| `types/reporting.ts` | DT-02 | Expandir AIAnalysisResult + ReportMetrics, remover catch-all |
| `lib/firebase/assets.ts` | DT-03 | Remover stub `processAssetText()` (L190-197) |
| `app/api/webhooks/dispatcher/route.ts` | DT-04 | Migrar 6 pontos para createApiError/createApiSuccess |
| `app/api/webhooks/ads-metrics/route.ts` | DT-04 | Migrar 7 pontos para createApiError/createApiSuccess |
| `lib/hooks/use-intelligence-assets.ts` | DT-05, DT-10 | Implementar hook real com multi-query |
| `components/intelligence/discovery/assets-panel.tsx` | DT-05 | Implementar panel real com cards, skeleton, status badges |
| `app/api/intelligence/autopsy/run/route.ts` | DT-06 | Adicionar setDoc fire-and-forget (L81) |
| `app/api/intelligence/offer/save/route.ts` | DT-07 | Adicionar await setDoc (L54-55) |
| `types/personalization.ts` | DT-08 | Expandir LeadState — uniao de PropensityEngine + Maestro |
| `types/intelligence.ts` | DT-10 | Adicionar interface IntelligenceAsset |
| `lib/intelligence/personalization/propensity.ts` | DT-08 | Renomear campo `score` → `propensityScore` em persistSegment |
| `lib/intelligence/personalization/maestro.ts` | DT-08 | Verificar alinhamento de campo `score` |
| `app/intelligence/discovery/page.tsx` | DT-05 | Atualizar props/tipos do AssetsPanel |

### Arquivos NAO Tocados (Preservados)

| Arquivo | Justificativa |
|:--------|:-------------|
| `lib/firebase/assets-server.ts` | Implementacao real de processAssetText — intocado |
| `lib/ai/embeddings.ts` | Pipeline funcional — zero alteracao |
| `lib/ai/rag.ts` | Pipeline funcional — zero alteracao |
| `lib/ai/pinecone.ts` | Consolidado na Sigma — zero alteracao |
| `lib/utils/api-response.ts` | Padrao Sigma — zero alteracao |
| `lib/auth/conversation-guard.ts` | Padrao Sigma — zero alteracao |
| Todos os 224 testes existentes | P11 do PRD — zero alteracao |

---

## 9. Proibicoes Tecnicas Adicionais (Alem do PRD)

| # | Proibicao | Justificativa |
|:--|:----------|:-------------|
| **PA-01** | **NUNCA criar collection `intelligence_assets` no Firestore** | Assets de inteligencia vivem em suas collections canonicas (`audience_scans`, `autopsies`, `offers`). O hook faz multi-query |
| **PA-02** | **NUNCA reimplementar `processAssetText` em `assets.ts`** | A implementacao REAL esta em `assets-server.ts`. O stub deve ser deletado, nao reimplementado |
| **PA-03** | **NUNCA usar `await` na persistencia de autopsy** | Fire-and-forget (padrao PropensityEngine). Autopsy retorna report imediatamente |
| **PA-04** | **NUNCA usar fire-and-forget na persistencia de offer** | Rota e `/save` — semantica de confirmacao. Usar `await setDoc` |
| **PA-05** | **NUNCA misturar campo `score` generico em leads** | PropensityEngine usa `propensityScore`, Maestro usa `score` do LeadContext. Separar para evitar conflito de merge |
| **PA-06** | **NUNCA rate-limitar rotas `/api/admin/*`** | Admin sempre isento — previne self-lockout |

---

## 10. Checklist de Retrocompatibilidade

| # | Item | Verificacao | Responsavel |
|:--|:-----|:-----------|:-----------|
| RC-01 | Nenhuma URL de API muda | Todas as rotas mantem mesmo path | Dandara |
| RC-02 | Nenhum metodo HTTP muda | POST continua POST, GET continua GET | Dandara |
| RC-03 | Campo `error` presente em respostas de webhook migradas | `createApiError` sempre retorna `{ error: string }` (PA-04 Sigma) | Dandara |
| RC-04 | Webhooks funcionam sem Bearer token | Dispatcher e ads-metrics mantem auth por assinatura HMAC | Dandara |
| RC-05 | `AIAnalysisResult` campos obrigatorios inalterados | `summary`, `insights`, `recommendations` permanecem | Dandara |
| RC-06 | `ReportMetrics` campos obrigatorios inalterados | `roi`, `adSpend`, `ltvMaturation` permanecem | Dandara |
| RC-07 | `briefing-bot.ts` compila sem cast apos remover catch-all | Campos existentes estao no tipo — zero TypeScript error | Dandara |
| RC-08 | `LeadState` novos campos sao opcionais | Consumers existentes continuam funcionando com campos parciais | Dandara |
| RC-09 | Remocao de `processAssetText` de `assets.ts` nao quebra imports | Nenhum caller real importa de `assets.ts` — apenas de `assets-server.ts` | Dandara |
| RC-10 | Discovery Hub page funciona com hook atualizado | `assets-panel.tsx` props atualizadas para novo tipo | Dandara |
| RC-11 | `PropensityEngine.persistSegment` grava campos corretos | Campo renomeado de `score` para `propensityScore` | Dandara |
| RC-12 | 224+ testes passando em cada Gate | `npm test` em Gate Cleanup e QA Final | Dandara |
| RC-13 | Testes que importam `processAssetText` de `assets.ts` atualizados | `rg "from.*assets.*processAssetText"` — corrigir imports | Dandara |

---

## 11. Estimativa Revisada (Athos)

### Fase 1 — Cleanup (Gate)

| Story | PRD Estimativa | Athos Estimativa | Delta | Justificativa |
|:------|:--------------|:-----------------|:------|:-------------|
| S29-CL-01 (contract-map) | XS (~15min) | XS (~15min) | = | DT-01: trivial |
| S29-CL-02 (reporting types) | XS (~20min) | XS (~20min) | = | DT-02: campos definidos neste review |
| S29-CL-03 (processAssetText) | S (~45min) | XS (~15min) | **-30min** | DT-03: REMOVER stub (nao reimplementar) |
| S29-CL-04 (webhook routes) | XS (~30min) | S (~40min) | +10min | DT-04: 13 pontos (mais que estimado) |
| **Subtotal F1** | **~2h** | **~1.5h** | **-30min** | |

### Fase 2 — Feature (Core)

| Story | PRD Estimativa | Athos Estimativa | Delta | Justificativa |
|:------|:--------------|:-----------------|:------|:-------------|
| S29-FT-01 (Discovery Hub) | L (~5-6h) | L (~5-6h) | = | DT-05/DT-10: multi-query mais robusto, esforco similar |
| S29-FT-02 (Persistence) | M (~2-3h) | M- (~2h) | -30min | DT-06/DT-07: tipos ja existem, so persistir |
| S29-FT-03 (LeadState) | S (~1-1.5h) | S+ (~1.5-2h) | +30min | DT-08: 2 motores a unificar |
| **Subtotal F2 Core** | **~8-10.5h** | **~8.5-10h** | **~0** | |

### Fase 2 — Feature (STRETCH)

| Story | PRD Estimativa | Athos Estimativa | Delta | Justificativa |
|:------|:--------------|:-----------------|:------|:-------------|
| S29-FT-04 (Rate Limiting) | M (~3-4h) | M (~3-4h) | = | DT-09: schema definido neste review |

### Total Consolidado

| Fase | PRD | Athos | Delta |
|:-----|:----|:------|:------|
| Fase 1 (Cleanup) | ~2-3h | ~1.5h | -0.5h |
| Fase 2 (Core) | ~8-11h | ~8.5-10h | ~0 |
| Fase 2 (STRETCH) | ~3-4h | ~3-4h | = |
| QA Final | ~1-2h | ~1-2h | = |
| **TOTAL (sem STRETCH)** | **~11-16h** | **~11-13.5h** | **-0.5h** |
| **TOTAL (com STRETCH)** | **~14-20h** | **~14-17.5h** | **-0.5h** |

**Reducao de ~0.5h justificada por:**
- DT-03: -30min (processAssetText e so deletar, nao reimplementar)
- DT-06/DT-07: -30min (tipos ja existem)
- DT-08: +30min (2 motores a unificar)

---

## 12. Sequencia de Execucao Refinada (Athos)

```
[FASE 1 — Cleanup (GATE)]
  S29-CL-01 (contract-map, XS) — paralelo
  S29-CL-02 (reporting types, XS) — paralelo
  S29-CL-03 (processAssetText — DELETAR stub, XS) — paralelo
  S29-CL-04 (webhook routes, S) — paralelo

  ── GATE CHECK ── (tsc + build + tests) ──

[FASE 2 — Feature (Core)]
  ★ Primeiro: Criar tipo IntelligenceAsset em types/intelligence.ts (DT-10)
  ★ Primeiro: Implementar persistencia Autopsy + Offer (S29-FT-02) — necessario ANTES do hook
  S29-FT-02a (Autopsy persist, S) — fire-and-forget
    + S29-FT-02b (Offer persist, S) — await
  DEPOIS:
  S29-FT-01 (Discovery Hub Assets, L) — depende de FT-02 (autopsies/offers existem)
    + S29-FT-03 (LeadState expansion, S) — independente de FT-01

[FASE 2 — Feature (STRETCH)]
  S29-FT-04 (Rate Limiting, M) — somente apos FT-01 a FT-03 concluidos

[QA FINAL]
  Dandara valida SC-01 a SC-10 + RC-01 a RC-13
```

**Mudancas vs PRD:**
- F1: CL-01 a CL-04 sao TODOS independentes (podem paralelizar)
- F2: FT-02 (persistencia) ANTES de FT-01 (Discovery Hub) — o hook precisa que as collections existam com dados
- F2: Criar IntelligenceAsset type como primeiro step
- F1: CL-03 e XS (deletar), nao S (reimplementar)

---

## 13. Checklist de Blocking DTs (Gate para SM)

Leticia (SM) NAO deve iniciar Story Packing sem confirmar que Darllyson compreendeu:

- [ ] **DT-03**: processAssetText — REMOVER stub em `assets.ts` (NAO reimplementar). A versao real esta em `assets-server.ts`
- [ ] **DT-05**: Discovery Hub Assets — multi-query em 3 collections (audience_scans + autopsies + offers), NAO criar collection `intelligence_assets`

---

## 14. Veredito Final

### APROVADO COM RESSALVAS

O PRD da Sprint 29 esta **excelente** — bem estruturado, escopo realista, heranca correta dos padroes Sigma, e alinhado com o roadmap. A baseline pos-Sigma (224/224, tsc=0, QA 99/100) e a fundacao ideal para features.

**Ressalvas obrigatorias:**

1. **DT-03 e P0 BLOCKING**: `processAssetText()` em `assets.ts` e um stub MORTO — a implementacao REAL esta em `assets-server.ts`. DELETAR o stub, NAO reimplementar. O PRD desconhece a versao server.
2. **DT-05 e P0 BLOCKING**: Discovery Hub Assets NAO deve criar collection `intelligence_assets`. Usar multi-query em collections existentes (`audience_scans`, `autopsies`, `offers`) com tipo unificado `IntelligenceAsset`.
3. **DT-08**: LeadState e compartilhada por 2 motores (PropensityEngine + Maestro). Renomear `score` → `propensityScore` para evitar conflito de merge.
4. **DT-12**: Offer persist deve ser `await` (nao fire-and-forget) — semantica de "save".
5. **PA-01 a PA-06**: 6 proibicoes tecnicas adicionais (alem das 11 do PRD).
6. **Estimativa ajustada -0.5h**: processAssetText simplificado e tipos ja existentes compensam LeadState mais complexa.

**O PRD pode prosseguir para Story Packing (Leticia) apos confirmacao dos 2 blocking DTs.**

---

## Apendice A: Nota Sobre Firestore Security Rules

As novas collections (`autopsies`, `offers`, `quotas`) devem seguir o mesmo padrao de security rules das collections existentes (`audience_scans`, `leads`):

```
match /brands/{brandId}/autopsies/{autopsyId} {
  allow read, write: if request.auth != null && request.auth.uid != null;
}

match /brands/{brandId}/offers/{offerId} {
  allow read, write: if request.auth != null && request.auth.uid != null;
}

match /brands/{brandId}/quotas/{period} {
  allow read, write: if request.auth != null && request.auth.uid != null;
}
```

**Nota:** As rules atuais do Firestore devem ser verificadas e atualizadas antes do deploy. Isso NAO e escopo da Sprint 29 code (e infra/config), mas deve ser feito em paralelo.

---

*Architecture Review realizada por Athos (Architect) — NETECMT v2.0*  
*Sprint 29: Assets & Persistence Hardening | 07/02/2026*  
*12 Decision Topics | 2 Blocking | Estimativa revisada: ~11-13.5h (sem STRETCH) / ~14-17.5h (com STRETCH)*  
*Veredito: APROVADO COM RESSALVAS*
