# Plano: Inteligencia de Ativos v2

**Status:** PLANEJADO — documentado durante QA Sprint I.
**Data:** 2026-02-16

---

## Estado Atual (Diagnostico)

### O que esta funcionando
- **Upload de assets** — Arquivos (PDF, imagens) e URLs salvos no Firebase Storage + Firestore (`brand_assets`)
- **Pipeline de ingestao** — Extracao de texto → chunking (1500 chars, 200 overlap) → embedding (text-embedding-004, 768 dims) → Pinecone (`brand_{brandId}`)
- **Analise visual ("Olho do Conselho")** — Gemini Vision analisa imagens com heuristicas (legibilidade, psicologia das cores, gatilhos visuais) → score 0-100 → Pinecone namespace `visual`
- **Governanca** — Flag `isApprovedForAI` com audit log + batch update de chunks
- **Export CSV** — Funciona (mas exporta metricas mock)
- **Sincronizar** — Refetch do Pinecone funcional
- **Sistema de creditos** — Visual analysis = 2 creditos, upscale = 3 creditos
- **Image Upscale** — Gemini 3 Pro Image (2x/4x)
- **Filtros** — Tabs VISUAL/CONHECIMENTO filtram por namespace Pinecone
- **Busca** — Search por nome, tipo ou conselho estrategico

### O que esta quebrado

#### Bug 1: Asset nao aparece apos upload (CRITICO)
- **Problema:** Lista de assets vem EXCLUSIVAMENTE do Pinecone, nao do Firestore
- **Consequencia:** Asset uploadado com sucesso no Firestore mas que falha no processamento (PDF malformado, timeout Gemini, embedding error) fica INVISIVEL para o usuario
- **Toast enganoso:** UI mostra "sucesso" antes do processamento completar
- **Arquivo:** `app/src/app/api/assets/metrics/route.ts` — zero queries ao Firestore, so Pinecone
- **Fix:** Adicionar fallback ao Firestore (`brand_assets` filtered by brandId) + mostrar status de processamento na UI

#### Bug 2: Logo Lock salva `undefined` no Firestore
- **Erro:** `FirebaseError: Function updateDoc() called with invalid data. Unsupported field value: undefined (found in field brandKit.logoLock.variants.horizontal)`
- **Causa:** `brand-kit-form.tsx` inicializa `horizontal` e `icon` como `undefined` quando nao existem, depois faz spread no update
- **Arquivos afetados:**
  - `app/src/components/brands/brand-kit-form.tsx:48-49` — inicializacao sem fallback
  - `app/src/components/brands/brand-kit-form.tsx:95-110` — spread inclui undefined
  - `app/src/lib/ai/brand-governance.ts:68-75` — mesmo problema no `updateLogoLock()`
- **Fix:** Filtrar campos undefined antes de salvar, ou inicializar com `{ url: '', storagePath: '', format: 'png' }`

#### Bug 3: Sem botao de deletar asset
- **Problema:** `deleteAsset()` existe em `lib/firebase/assets.ts` mas NAO e chamada em nenhum lugar da UI
- **Arquivo:** `app/src/app/assets/page.tsx` e `app/src/components/assets/metrics-table.tsx` — so tem "ver detalhes" e "link externo"
- **Fix:** Adicionar botao de delete no `AssetMetricsTable` e/ou `AssetDetailModal` com confirmacao

#### Bug 4 (Warning): aria-describedby missing
- **Warning:** `Missing 'Description' or 'aria-describedby={undefined}' for {DialogContent}`
- **Causa:** Dialog de upload (provavelmente Radix/Shadcn) sem `DialogDescription`
- **Severidade:** Baixa (acessibilidade)

### Outros problemas
- **CTR/Conversao/ROI mock** — API gera valores aleatorios (0.5-5%) porque nao ha conexao com plataformas de ads
- **"+2.4% trend" hardcoded** — Indicador de tendencia fixo no componente `metrics-summary.tsx`
- **Dummy vector hack** — API usa vetor aleatorio para queries metadata-only no Pinecone
- **Sem versionamento** — Novo upload de brand book substitui, nao mantem historico
- **Sem re-analise automatica** — Mudanca no BrandKit nao re-analisa assets visuais
- **Sem link asset ↔ campanha** — Assets existem isolados, sem associacao a campanhas

---

## Fase 1 — Fix Bugs Criticos (Quick Win)

### 1.1 Fix Asset Invisivel (Firestore fallback)
- **Arquivo:** `app/src/app/api/assets/metrics/route.ts`
- **Adicionar:** Query ao Firestore `brand_assets` where `brandId == brandId`
- **Merge:** Assets do Firestore + Pinecone, dedup por assetId
- **Mostrar status:** Assets em `processing` aparecem com badge "Processando..."
- **Mostrar erro:** Assets em `error` aparecem com badge "Erro" + botao "Reprocessar"

### 1.2 Fix Logo Lock undefined
- **Arquivo:** `app/src/components/brands/brand-kit-form.tsx:48-49`
- **De:**
  ```typescript
  horizontal: brand.brandKit?.logoLock.variants.horizontal,
  icon: brand.brandKit?.logoLock.variants.icon,
  ```
- **Para:**
  ```typescript
  horizontal: brand.brandKit?.logoLock.variants.horizontal || null,
  icon: brand.brandKit?.logoLock.variants.icon || null,
  ```
- **Tambem:** No save handler (linhas 95-110), filtrar campos null/undefined antes do updateDoc:
  ```typescript
  const cleanVariants = Object.fromEntries(
    Object.entries(variants).filter(([_, v]) => v !== undefined && v !== null)
  );
  ```
- **Arquivo:** `app/src/lib/ai/brand-governance.ts:68-75` — mesmo fix

### 1.3 Adicionar Botao Delete
- **Arquivo:** `app/src/components/assets/metrics-table.tsx`
- **Adicionar:** Botao de delete (trash icon) em cada row/card
- **Confirmacao:** Modal "Tem certeza? Isso remove o asset e todos os chunks vetorizados."
- **Handler:** Chamar `deleteAsset(assetId, storageUrl)` + remover chunks do Pinecone
- **Arquivo:** `app/src/app/assets/page.tsx` — passar callback de delete para o componente

### 1.4 Fix aria-describedby
- **Arquivo:** Dialog component que usa Radix `DialogContent`
- **Adicionar:** `<DialogDescription>` ou `aria-describedby={undefined}` explicito

### Creditos: 0

---

## Fase 2 — Visibilidade e Status Real

### 2.1 Asset Status Dashboard
- **Novo:** Secao "Recentemente Adicionados" acima dos filtros
- **Mostra:** Assets dos ultimos 7 dias com status (uploaded → processing → ready/error)
- **Progress:** Barra de progresso durante processamento
- **Retry:** Botao "Reprocessar" para assets com status `error`

### 2.2 Substituir Metricas Mock por Empty State
- **Arquivo:** `app/src/app/api/assets/metrics/route.ts:157-160`
- **De:** CTR/Conversao/ROI randomizados
- **Para:** `null` quando nao ha dados reais
- **UI:** Mostrar "Sem dados" ou "Conecte uma plataforma" em vez de numeros falsos

### 2.3 Remover "+2.4%" Hardcoded
- **Arquivo:** `app/src/components/assets/metrics-summary.tsx`
- **De:** Badge "+2.4%" fixo
- **Para:** Calcular trend real (media ultimos 7 dias vs 7 dias anteriores) ou esconder

### 2.4 Notificacoes de Processamento
- **Novo:** Quando processamento completa (ready ou error), mostrar notificacao
- **Polling:** Verificar status a cada 10s enquanto ha assets em `processing`

### Creditos: 0

---

## Fase 3 — Conexao com Plataformas de Ads (Depende Sprint L — OAuth)

### 3.1 Importar Criativos do Meta Ads
- **Prerequisito:** OAuth Meta (Sprint L)
- **Flow:** Listar campanhas ativas → selecionar criativos → importar para Biblioteca
- **Metricas reais:** CTR, impressoes, conversoes, custo por resultado
- **Arquivo novo:** `app/src/lib/integrations/ads/meta-creative-import.ts`

### 3.2 Importar Criativos do Google Ads
- **Prerequisito:** OAuth Google (Sprint L)
- **Flow:** Listar campanhas → selecionar criativos → importar
- **Metricas reais:** CTR, impressoes, conversoes, CPC
- **Arquivo novo:** `app/src/lib/integrations/ads/google-creative-import.ts`

### 3.3 Importar do TikTok Ads
- **Prerequisito:** OAuth TikTok (Sprint L+)
- **Flow:** Listar criativos → importar com metricas
- **API:** TikTok Marketing API
- **Arquivo novo:** `app/src/lib/integrations/ads/tiktok-creative-import.ts`

### 3.4 Associar Asset a Campanha
- **Novo campo:** `campaignRefs: { platform, campaignId, adsetId, adId }[]` no BrandAsset
- **Metricas ao vivo:** Atualizar CTR/Conversao/ROI via polling da API de ads
- **Historico:** Salvar snapshot de metricas diarias para trend real

### Creditos: 0 (leitura de APIs)

---

## Fase 4 — Biblioteca de Campanhas Favoritas

### 4.1 Salvar Campanha de Referencia
- **Novo:** Botao "Salvar para Referencia" ao navegar criativos de outras marcas/concorrentes
- **Input:** URL da campanha/anuncio + plataforma + notas do usuario
- **Scrape:** Firecrawl extrai imagem/copy/CTA do anuncio
- **Analise:** Gemini Vision analisa + heuristicas + score
- **Tag:** `assetType: 'reference_campaign'` para diferenciar dos proprios criativos

### 4.2 Inspiracao por Categoria
- **Novo:** Filtro por tags (ex: "carrossel", "video", "UGC", "depoimento")
- **Auto-tag:** Gemini classifica tipo de criativo automaticamente na analise visual
- **Busca:** "Mostre-me criativos de referencia com score > 80 para carrossel"

### 4.3 Competitor Library
- **Integrar com:** Profile Analyzer do Social v2 (roadmap-social-v2.md Fase 3)
- **Flow:** Analisar perfil concorrente → salvar criativos como referencia na biblioteca
- **Cross-reference:** "Este criativo e similar ao criativo X do concorrente Y"

### Creditos: 1-2 por analise de referencia

---

## Fase 5 — Aprimoramentos Avancados

### 5.1 Versionamento de Assets
- **Novo:** Historico de versoes para brand books e guidelines
- **Campos:** `version: number`, `previousVersionId: string`
- **UI:** Timeline de versoes com diff de conteudo

### 5.2 Re-analise Automatica
- **Trigger:** Quando BrandKit muda (cores, visual style, logo), re-analisar assets visuais
- **Queue:** Processar em background (nao bloquear UI)
- **Notificacao:** "Scores atualizados com base na nova identidade visual"

### 5.3 Integracao com Content Calendar
- **Novo:** Ao criar item no calendario, sugerir assets da biblioteca
- **Match:** Por tema/keyword do conteudo vs tags dos assets
- **Attach:** Associar asset ao item do calendario

### 5.4 Asset Performance Report
- **Novo:** Dashboard com:
  - Top 10 criativos por score
  - Criativos que melhoraram/pioraram
  - Recomendacoes de otimizacao baseadas em heuristicas
  - Comparativo: meus criativos vs referencias salvas

### Creditos: 1 por re-analise batch

---

## Arquivos Criticos

| Arquivo | Fase | Acao |
|---------|------|------|
| `app/src/app/api/assets/metrics/route.ts` | 1,2 | Firestore fallback + remover mock metrics |
| `app/src/components/brands/brand-kit-form.tsx` | 1 | Fix undefined logo variants |
| `app/src/lib/ai/brand-governance.ts` | 1 | Fix undefined no updateLogoLock |
| `app/src/components/assets/metrics-table.tsx` | 1 | Adicionar botao delete |
| `app/src/app/assets/page.tsx` | 1,2 | Delete handler + status dashboard |
| `app/src/components/assets/metrics-summary.tsx` | 2 | Remover +2.4% hardcoded |
| `app/src/components/assets/asset-detail-modal.tsx` | 1 | Adicionar delete no modal |

## Arquivos Novos

| Arquivo | Fase |
|---------|------|
| `app/src/lib/integrations/ads/meta-creative-import.ts` | 3 |
| `app/src/lib/integrations/ads/google-creative-import.ts` | 3 |
| `app/src/lib/integrations/ads/tiktok-creative-import.ts` | 3 |
| `app/src/components/assets/reference-campaign-saver.tsx` | 4 |

## Dependencias

```
Fase 1 (Fix Bugs) → Independente, pode ser feita em qualquer sprint
Fase 2 (Status Real) → Depende parcialmente da Fase 1
Fase 3 (Plataformas Ads) → Depende do Sprint L (OAuth Meta/Google/TikTok)
Fase 4 (Favoritas) → Depende parcialmente da Fase 3 + Social v2 Fase 3
Fase 5 (Avancados) → Depende das Fases 1-2
```

**Fase 1 e a mais urgente** — 3 bugs que afetam UX diretamente (asset invisivel, logo lock crash, sem delete).
