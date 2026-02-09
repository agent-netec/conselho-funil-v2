# Allowed Context: Sprint 25 — Predictive & Creative Engine
**Lane:** `intelligence_wing`
**Preparado por:** Leticia (SM)
**Data:** 06/02/2026

---

## 📂 Contexto Global (Todos os Epics)

### Leitura Obrigatória (antes de iniciar qualquer story)
- `_netecmt/packs/stories/sprint-25-predictive-creative/stories.md` — Stories e ACs
- `_netecmt/packs/stories/sprint-25-predictive-creative/contract.md` — Resumo dos contratos
- `_netecmt/packs/stories/sprint-25-predictive-creative/execution-order.md` — Ordem de execução
- `_netecmt/solutioning/architecture/arch-sprint-25-predictive-creative-engine.md` — Architecture Review completa

### Tipos Compartilhados (Leitura)
- `app/src/types/intelligence.ts` — UXIntelligence, UXAsset, IntelligenceDocument
- `app/src/types/prediction.ts` — DimensionScore, BenchmarkComparison, Recommendation
- `app/src/types/creative-ads.ts` — GeneratedAd, AdFormat, CopyFramework, AD_CHAR_LIMITS
- `app/src/types/text-analysis.ts` — TextSuggestion, VSLStructure, StructuralAnalysis

### Infraestrutura Compartilhada (Leitura)
- `app/src/lib/ai/cost-guard.ts` — Token budget e rate limiting
- `app/src/lib/ai/gemini.ts` — Cliente Gemini
- `_netecmt/contracts/intelligence-storage.md` — Contrato da lane
- `_netecmt/core/contract-map.yaml` — Mapeamento de paths por lane

---

## Epic 1: Conversion Predictor (S25-ST-01, ST-02, ST-03)

### Escrita (Novos Arquivos)
- `app/src/lib/intelligence/predictor/scoring-engine.ts` — Motor de scoring CPS
- `app/src/lib/intelligence/predictor/benchmark.ts` — Benchmark comparativo
- `app/src/lib/intelligence/predictor/recommendations.ts` — Recomendações RAG-powered
- `app/src/lib/intelligence/predictor/types.ts` — Tipos locais (re-export opcional)
- `app/src/app/api/intelligence/predict/score/route.ts` — Rota de API

### Leitura (Contexto)
- `app/src/types/prediction.ts` — Interfaces e constantes do módulo
- `app/src/types/intelligence.ts` — UXIntelligence (input principal)
- `app/src/lib/ai/cost-guard.ts` — Para integração de token budget (tag: `predict_score`)
- `app/src/lib/ai/gemini.ts` — Cliente Gemini para chamadas de scoring

### Cross-Lane Autorizada (Readonly)
- `app/src/lib/ai/**` (`ai_retrieval`) — RAG para buscar Elite Assets como referência (ST-03)

### 🛑 Restrições
- NÃO alterar módulos existentes em `app/src/lib/intelligence/` (autopsy, keywords, etc.)
- NÃO alterar `app/src/types/intelligence.ts` (apenas importar)
- NÃO alterar `cost-guard.ts` (apenas usar via interface pública)

---

## Epic 2: Creative Automation (S25-ST-04, ST-05, ST-06)

### Escrita (Novos Arquivos)
- `app/src/lib/intelligence/creative-engine/ad-generator.ts` — Pipeline de geração
- `app/src/lib/intelligence/creative-engine/asset-remixer.ts` — Elite Asset remixing
- `app/src/lib/intelligence/creative-engine/brand-compliance.ts` — Brand Voice gate
- `app/src/lib/intelligence/creative-engine/types.ts` — Tipos locais (re-export opcional)
- `app/src/app/api/intelligence/creative/generate-ads/route.ts` — Rota de API

### Leitura (Contexto)
- `app/src/types/creative-ads.ts` — Interfaces, constantes e limites
- `app/src/types/prediction.ts` — Para chamar scoring engine (CPS estimado)
- `app/src/lib/intelligence/predictor/scoring-engine.ts` — Para `estimatedCPS` (ST-04 depende de ST-01)
- `app/src/lib/ai/cost-guard.ts` — Token budget (tag: `generate_ads`)
- `app/src/lib/ai/gemini.ts` — Cliente Gemini

### Cross-Lane Autorizada (Readonly)
- `app/src/lib/ai/**` (`ai_retrieval`) — RAG para buscar top 20% assets (ST-05)
- `app/src/lib/agents/qa/brand-validation.ts` (`brand_voice`) — Validação de toneMatch (ST-06)
- `app/src/lib/ai/brand-governance.ts` (`brand_voice`) — BrandVoiceTranslator (ST-06)

### 🛑 Restrições
- NÃO alterar `brand-validation.ts` nem `brand-governance.ts` (apenas consumir)
- NÃO alterar módulos de `creative/` existentes (scoring.ts, fatigue.ts, copy-gen.ts)
- NÃO bypassar limite de 5 variações por request (hardcoded em `GENERATION_LIMITS`)
- Elite Assets DEVEM ser filtrados por `brandId` — NUNCA cross-brand

---

## Epic 3: Multi-Input Intelligence (S25-ST-07, ST-08, ST-09)

### Escrita (Novos Arquivos)
- `app/src/lib/intelligence/text-analyzer/text-parser.ts` — Parser genérico
- `app/src/lib/intelligence/text-analyzer/vsl-parser.ts` — Parser de VSL
- `app/src/lib/intelligence/text-analyzer/ad-copy-analyzer.ts` — Análise de ad copy
- `app/src/lib/intelligence/text-analyzer/sanitizer.ts` — Sanitização (RT-03)
- `app/src/lib/intelligence/text-analyzer/types.ts` — Tipos locais (re-export opcional)
- `app/src/app/api/intelligence/analyze/text/route.ts` — Rota de API

### Leitura (Contexto)
- `app/src/types/text-analysis.ts` — Interfaces, constantes e sanitização
- `app/src/types/intelligence.ts` — UXIntelligence (output da extração)
- `app/src/types/prediction.ts` — Para integrar com scoring (se `includeScoring: true`)
- `app/src/lib/intelligence/predictor/scoring-engine.ts` — Para scoring de texto
- `app/src/lib/ai/cost-guard.ts` — Token budget (tag: `analyze_text`)
- `app/src/lib/ai/gemini.ts` — Cliente Gemini

### Cross-Lane Autorizada (Readonly)
- `app/src/lib/ai/url-scraper.ts` (`scraping_engine`) — Fallback se URL fornecida sem funnelData

### 🛑 Restrições
- NÃO alterar `url-scraper.ts` (apenas consumir se necessário)
- Sanitização OBRIGATÓRIA antes de qualquer processamento (RT-03)
- Limite de 50.000 caracteres por input (hardcoded em `TEXT_SANITIZATION_RULES`)
- NÃO processar inputs que falhem em `isSuspiciousInput()`

---

## Transversal: UI (S25-ST-10)

### Escrita (Novos Arquivos)
- `app/src/app/intelligence/predict/page.tsx` — Página do Painel de Predição
- `app/src/app/intelligence/predict/layout.tsx` — Layout (se necessário)
- `app/src/components/intelligence/prediction-panel.tsx` — Componente do CPS Dashboard
- `app/src/components/intelligence/ad-preview.tsx` — Componente de preview de ads
- `app/src/components/intelligence/text-input.tsx` — Componente de input de texto
- `app/src/lib/hooks/use-intelligence-predict.ts` — Hook para chamar APIs

### Leitura (Contexto)
- `app/src/types/prediction.ts` — Interfaces de response do Predictor
- `app/src/types/creative-ads.ts` — Interfaces de response do Creative Engine
- `app/src/types/text-analysis.ts` — Interfaces de response do Text Analyzer
- `app/src/app/intelligence/discovery/page.tsx` — Referência de UI existente (Discovery Hub)
- `app/src/components/intelligence/**` — Componentes existentes (padrões de UI)

### 🛑 Restrições
- NÃO alterar componentes existentes de intelligence sem autorização
- Seguir padrões de UI existentes (Tailwind + shadcn/ui)
- Responsividade obrigatória (desktop + mobile)
- Build limpo obrigatório (zero erros TS/Lint)
- **BLOQUEIO:** Aguardar mockups de Beto/Victor antes de finalizar layout

---

## 🚫 Proibições Globais (Toda a Sprint 25)

1. **NUNCA** importar `firebase-admin` ou `@google-cloud/*`
2. **NUNCA** alterar Firebase Security Rules sem aprovação do Athos
3. **NUNCA** alterar `contract-map.yaml` sem aprovação do Athos
4. **NUNCA** usar Elite Assets de uma brand para gerar ads de outra (multi-tenant)
5. **NUNCA** bypassar `cost-guard.ts` para chamadas Gemini
6. **NUNCA** processar texto sem sanitização prévia (RT-03)
7. **NUNCA** ultrapassar os rate limits definidos por endpoint
8. **NUNCA** modificar arquivos fora dos paths autorizados acima

---
*Allowed Context preparado por Leticia (SM) — NETECMT v2.0*
*Sprint 25: Predictive & Creative Engine | 06/02/2026*
