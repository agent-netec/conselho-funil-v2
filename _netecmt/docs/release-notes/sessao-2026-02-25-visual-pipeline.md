# Sessao 2026-02-25: Pipeline Visual + Firestore Indexes + Hotfixes

**Data:** 25/02/2026
**Commits:** `f88b3adcf` → `e01fe3b6c` → `ffc9d6a3a`
**Status:** DEPLOYED

---

## Resumo

Sessao de implementacao e estabilizacao com 3 entregas principais:
1. Ativacao completa do pipeline visual "Olho do Conselho" (Fase 1.6)
2. Deploy de 10 Firestore composite indexes em falta
3. Hotfixes criticos para crash em producao

---

## 1. Firestore Composite Indexes (10 novos)

**Problema:** Queries compostas (where + orderBy em campos diferentes) falhavam com "query requires an index".

**Solucao:** Auditoria completa das queries do sistema identificou 10 indexes em falta. Deployados via `firebase deploy --only firestore:indexes`.

**Collections afetadas:**
- `vault_library` (status + createdAt)
- `predictions` (brandId + createdAt)
- `research` (brandId + createdAt)
- `automation_logs` (brandId + executedAt)
- `alerts` (brandId + createdAt)
- `journey_events` (brandId + timestamp)
- `icp_insights` (brandId + score, brandId + createdAt)
- `voice_profiles` (brandId + score, brandId + createdAt)

**Total de indexes no sistema:** 22

---

## 2. Pipeline Visual — Fase 1.6 Completa

### 2.1 Auth Guard no endpoint (1.6.1)
- **Arquivo:** `app/src/app/api/ai/analyze-visual/route.ts`
- **Antes:** Endpoint aceitava `userId` no body sem validacao — qualquer request podia gastar creditos alheios
- **Depois:** `requireBrandAccess(request, brandId)` valida Bearer token e extrai userId automaticamente
- **Impacto:** Seguranca corrigida, creditos protegidos

### 2.2 Botao "Analisar Visual" na UI (1.6.2)
- **Arquivo:** `app/src/components/assets/asset-detail-modal.tsx`
- **Novo:** Botao com icone `ScanEye` aparece apenas para assets de imagem (nao URLs/PDFs)
- **Flow:** Click → loading spinner → POST `/api/ai/analyze-visual` → refresh metrics → toast
- **Callback chain:** `page.tsx` → `metrics-table.tsx` → `asset-detail-modal.tsx`
- **Custo:** 2 creditos por analise

### 2.3 Heuristicas Reais (1.6.3)
- **Arquivo:** `app/src/components/assets/asset-detail-modal.tsx`
- **Antes:** Valores fixos hardcoded (85%, 92%, 78%, "High")
- **Depois:** Funcao `parseHeuristics()` parseia `metadata.heuristics_summary` do Pinecone
- **Campos:** Psicologia de Cores, Legibilidade, Hook Visual, Score Geral
- **Fallback:** "Sem dados" quando campo nao existe

### 2.4 Display Condicional Visual vs Knowledge (1.6.4)
- **Logica:** `asset.namespace === 'visual'` → grid de heuristicas; knowledge → cards Tipo/Status
- **Badges:** Purple para visual, blue para knowledge

---

## 3. Hotfixes

### 3.1 Botao "Analisar Visual" em assets nao-imagem (e01fe3b6c)
- **Bug:** Botao aparecia em assets tipo URL/texto porque condicao usava `asset.url` (existe em todos)
- **Fix:** Condicao mudada para `!!asset.imageUri || asset.assetType?.toLowerCase().includes('image')`
- **Bonus:** Adicionado `<DialogTitle className="sr-only">` para fix de warning Radix

### 3.2 React Error #31 na pagina de Copy (ffc9d6a3a)
- **Bug:** Crash "Objects are not valid as a React child" em `/funnels/[id]/copy`
- **Causa raiz:** Gemini retorna objetos aninhados onde strings sao esperadas. Firestore armazena como-e. JSX tenta renderizar o objeto diretamente.
- **Fix:** Funcao `safeStr()` converte qualquer valor para string segura antes de renderizar
- **Pontos protegidos (13):**
  - `content.primary` (MarkdownRenderer)
  - `email.subject`, `email.body`, `email.delay`
  - `section.name`, `section.content`, `section.duration`
  - `variations[]` items
  - `reasoning`
  - `insight.copywriterName`, `insight.expertise`, `insight.insight`
- **Scorecard:** Funcao `safeScore()` protege `.toFixed(1)` de valores nao-numericos
- **Impacto:** Resolvia crash em producao durante apresentacao ao cliente

---

## Arquivos Modificados

| Arquivo | Tipo |
|---------|------|
| `app/firestore.indexes.json` | +10 indexes |
| `app/src/app/api/ai/analyze-visual/route.ts` | Auth guard |
| `app/src/components/assets/asset-detail-modal.tsx` | UI + heuristicas reais |
| `app/src/components/assets/metrics-table.tsx` | Prop drilling onAnalyzeVisual |
| `app/src/app/assets/page.tsx` | Handler analyzeVisual |
| `app/src/app/funnels/[id]/copy/page.tsx` | safeStr/safeScore fix |
| `brain/roadmap-assets-v2.md` | Documentacao atualizada |

---

## Vulnerabilidades Identificadas (nao corrigidas)

Paginas com risco similar de React Error #31 (`.toFixed()` em dados Firestore sem validacao):
- `app/src/app/intelligence/attribution/page.tsx` — linhas 241, 314-317, 321
- `app/src/app/intelligence/ltv/page.tsx` — linhas 89, 100, 111, 297, 338

**Recomendacao:** Aplicar mesmo padrao `safeStr()`/`safeScore()` nessas paginas em sprint futuro.
