# Prompt de Continuação — Sessão de Testes & Bug Fixes (Produção)

> Copie o bloco abaixo e cole como primeira mensagem em um novo chat.

---

```
## Contexto do Projeto

Conselho de Funil — SaaS de marketing digital. Next.js 16.1.1, React 19, Firebase, Pinecone, Gemini AI. Deploy: Vercel (root dir: `app/`). Build: `cd app && npm run build`.

- **AI model (bulk):** gemini-2.5-flash (DEFAULT_GEMINI_MODEL)
- **AI model (critical):** gemini-3-pro-preview (PRO_GEMINI_MODEL) — scoring, chat, autopsy, debate
- **AI model (image):** gemini-3-pro-image-preview → fallback gemini-2.5-flash-image

## Sessão anterior — Resumo completo dos trabalhos (2026-02-19)

Estávamos fazendo QA manual em produção, testando features e corrigindo bugs à medida que apareciam. Abaixo está tudo que foi feito e o estado atual de cada item.

---

### BUG 1 — Brand Wizard Crash (CORRIGIDO)
- **Commit:** `2745bf81e`
- **Problema:** Wizard de criação de marca crashava
- **Fix:** Corrigido crash + melhorado error reporting no design generate

### BUG 2 — Gemini Image Generation 503/404 (CORRIGIDO)
- **Commits:** `31db6c86e`, `eed12fd4a`, `2493d6a6c`
- **Problema:** Geração de imagens falhava com modelos deprecated
- **Root cause:** `gemini-2.0-flash-exp-image-generation` foi descontinuado em Nov/2025, `gemini-2.5-flash-image-preview` em Jan/2026
- **Fix:** Fallback chain atualizada para:
  1. `gemini-3-pro-image-preview` (Nano Banana Pro, ~30s)
  2. `gemini-2.5-flash-image` (Nano Banana Flash, ~8s)
- **Arquivos:** `app/src/app/api/design/generate/route.ts`, `app/src/app/api/test-image/route.ts`
- **Doc de referência:** `_netecmt/docs/troubleshooting/gemini-image-models.md`
- **Status:** FUNCIONANDO EM PRODUÇÃO ✅

### BUG 3 — GOOGLE_AI_API_KEY no Client Bundle (CORRIGIDO)
- **Commits:** `f0a75b275`, `b27a89651`
- **Problema:** Ao anexar imagem no chat, erro: "NEXT_PUBLIC_GOOGLE_AI_API_KEY não encontrada no bundle do navegador" / "GOOGLE_AI_API_KEY not configured"
- **Root cause 1:** `use-file-upload.ts` e `use-multimodal-analysis.ts` (ambos `'use client'`) importavam `analyzeMultimodalWithGemini` direto do `gemini.ts`, tentando chamar Gemini no browser
- **Fix 1:** Criado `/api/intelligence/analyze/image/route.ts` (proxy server-side), hooks agora chamam via fetch
- **Root cause 2:** `ScaleSimulator.tsx` → `PredictionEngine` → `gemini.ts` puxava toda a lib para o bundle client
- **Fix 2:** Criado `scale-math.ts` com função pura de math, ScaleSimulator importa dele
- **Arquivos corrigidos:**
  - `app/src/app/api/intelligence/analyze/image/route.ts` (NOVO - proxy)
  - `app/src/lib/hooks/chat/use-file-upload.ts`
  - `app/src/lib/hooks/chat/use-multimodal-analysis.ts`
  - `app/src/lib/intelligence/predictive/scale-math.ts` (NOVO)
  - `app/src/components/intelligence/predictive/ScaleSimulator.tsx`
- **Status:** CORRIGIDO ✅ — precisa re-testar em produção (cache de bundle pode interferir, verificar se o chunk hash mudou)

### BUG 4 — 504 Gateway Timeout em Social Routes (CORRIGIDO)
- **Commits:** `8f3090df1`, `5ad2c52e8`
- **Problema:** `/api/social/debate` retornava 504 (timeout)
- **Root cause:** Nenhuma route exportava `maxDuration`, Vercel usava default (~10-15s), insuficiente para Gemini
- **Fix:** Adicionado `maxDuration` em 13+ routes:
  - 90s: `social/debate`, `chat`, `design/generate`
  - 60s: `social/hooks`, `social/scorecard`, `social/structure`, `social/generate`, `design/plan`, `ai/analyze-visual`, `intelligence/analyze/image`, `intelligence/keywords/related`, `content/generate`, `content/calendar/generate-week`
- **Status:** CORRIGIDO ✅

### BUG 5 — 500 Internal Server Error no Social Debate (CORRIGIDO)
- **Commit:** `8a3e45cf1`
- **Problema:** Após fix do timeout, debate passou a dar 500 (Gemini PRO falhando)
- **Fix:**
  - Adicionado fallback PRO → Flash (se PRO falha, usa Flash)
  - Optional chaining em campos de brand (`brand.audience?.who`, `brand.offer?.what`, etc.)
  - Try/catch individual para brand loading e brain context
- **Arquivo:** `app/src/app/api/social/debate/route.ts`
- **Status:** CORRIGIDO ✅ — precisa re-testar em produção para confirmar

### BUG 6 — Profile Analysis 400 para Instagram (NÃO CORRIGIDO — bloqueio de design)
- **Problema:** POST `/api/social/profile-analysis` retorna 400 para URLs do Instagram
- **Root cause:** Firecrawl bloqueia redes sociais por política interna. Jina Reader também falha (login wall). Nenhum fallback funciona.
- **Arquivo:** `app/src/app/api/social/profile-analysis/route.ts`
- **Documento de pesquisa:** `_netecmt/docs/tools/social-media-scraping-research.md`
- **Status:** PENDENTE — decisão entre 4 opções:
  - A) Integrar Apify como provedor social (~4h, free tier $0)
  - B) Integrar SociaVault multi-plataforma (~3h, $29/mês)
  - C) Apenas melhorar mensagem de erro (~30min)
  - D) Instagram Graph API via OAuth (depende Sprint L)

### INVESTIGAÇÃO — Social Trends são dados reais?
- **Resultado:** Os percentuais de growth (+150%, +130%) são **estimativas do Gemini AI**, NÃO métricas reais
- **Pipeline:** Exa search (dados web reais) → Firecrawl scrape → Gemini sintetiza com campo `growthPercent`
- **Fallback do TrendAgent:** usa `score × 600` como heurística arbitrária
- **Status:** Documentado, não requer fix — é by design

---

## Mudança uncommitted

- `app/src/app/performance/page.tsx` — 6 linhas alteradas (verificar se é intencional)

## O que testar agora em produção

### Precisa re-testar (fixes desta sessão):
1. **Geração de imagem** — criar um design no Lab, verificar se gera sem erro
2. **Anexar imagem no chat** — enviar foto no chat para análise, verificar se não aparece erro de API key
3. **Social Debate** — gerar hooks → pedir debate com conselho → verificar se não dá 504/500
4. **Profile Analysis com URL normal** — testar com URL de blog/site (não Instagram) para confirmar que funciona
5. **Profile Analysis com Instagram** — testar para ver a mensagem de erro (ainda vai dar 400, mas precisa confirmar)

### Features que ainda não testamos nesta sessão:
- Content generation (`/api/content/generate`)
- Calendar week generation (`/api/content/calendar/generate-week`)
- Keywords Miner (related keywords)
- Design Plan
- Social Scorecard
- Social Structure
- AI Visual Analysis

### Possíveis problemas a investigar:
- Verificar se há mais routes sem `maxDuration` que não foram pegas
- Verificar se há outros componentes client-side importando `gemini.ts` (buscar: `from '@/lib/ai/gemini'` em arquivos com `'use client'`)
- Verificar se o cache de bundle do Vercel já limpou (Bug 3 pode parecer persistir por cache)

## Commits desta sessão (do mais antigo ao mais recente)

```
2745bf81e fix: brand wizard crash + design generate error reporting
455e86011 debug: Test image generation with minimal payload
4811d72c1 debug: List all available Gemini models
05e590b23 debug: Add Gemini API test endpoint
818895c46 debug: Enhanced error logging for Gemini API failures
31db6c86e fix(CRITICAL): Gemini API authentication via header (not query param)
eed12fd4a feat: image generation model fallback chain (503 resilience)
2493d6a6c fix: replace deprecated gemini-2.0-flash-exp with correct image models
80d3a5546 docs: add Gemini image models reference + fix formatters label
f0a75b275 fix: move Gemini multimodal analysis to server-side API route
b27a89651 fix: remove gemini.ts from client bundle via ScaleSimulator
8f3090df1 fix: add maxDuration to social API routes (504 timeout)
5ad2c52e8 fix: add maxDuration to all remaining Gemini API routes
8a3e45cf1 fix: debate PRO→Flash fallback + maxDuration on all Gemini routes
```

## Instrução

Continue a sessão de QA e bug fixing em produção. Priorize re-testar os items marcados como "precisa re-testar". Se o usuário reportar novos erros, aplique a metodologia `/debug` + `/systematic-debug` (root cause primeiro, depois fix). Mantenha fixes cirúrgicos e mínimos.
```

---

> **Uso:** Copie tudo dentro do bloco de código acima e cole como primeira mensagem em um novo chat do Claude Code.
