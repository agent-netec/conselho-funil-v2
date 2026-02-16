# Sprint I — Technical Documentation & Root Cause Analysis

Este documento centraliza as descobertas técnicas, análises de causa raiz (RCA) e correções aplicadas durante a fase de verificação do Sprint I.

## Relatório de Debug ao Vivo (Sessão 2026-02-15)

### Issue #1 — Funnels Generate 500 (Internal Server Error)
**Root Cause:**
1. Modelo fallback hardcoded `gemini-2.0-flash` (sunsetado).
2. Resposta vazia do Gemini não validada antes do `parseAIJSON()`.
3. Ausência de checagem defensiva no array `proposalsData.proposals`.
**Fix:** Centralização em `DEFAULT_GEMINI_MODEL` (`gemini-2.5-flash`) e validações robustas de resposta.

### Issue #1b — Parse AI Response Failure
**Root Cause:** Uso de `responseMimeType: 'text/plain'` permitia markdown wrappers que quebravam o parser.
**Fix:** Forçado `responseMimeType: 'application/json'`.

### Issue #3 — Linha de Ouro: "A Voz" reseta
**Root Cause:** `campaign.id` era `undefined` porque `docSnap.data()` não inclui o ID do documento. Isso causava escritas em `campaigns/undefined`.
**Fix:** Injeção manual de `docSnap.id` no objeto de dados e sanitização de `campaignId` nas URLs.

### Issue #4 — Imagens Genéricas + Texto em Inglês
**Root Cause:**
1. Brain context do `design_director` não era injetado no modo de geração única.
2. Prompt de imagem pedia explicitamente texto em inglês.
**Fix:** Injeção de `buildDesignBrainContext()`, passagem de `copyLanguage` para a API e reestruturação do prompt (Cena em EN, Texto em PT).

### Issue #6 — Generate Ads 504 (Timeout)
**Root Cause:** Pipeline fazia 7-13 chamadas Gemini sequenciais (incluindo modelos PRO), excedendo 90s.
**Fix:** Implementação de `lightMode` que pula scoring PRO e validação pesada de voz de marca em favor de heurísticas rápidas.

### Issue #17 — Deep Research Pipeline
**Root Cause:** Múltiplos bugs: falta de índice composto no Firestore, falta de auth headers no MCP relay, e timeouts por chamadas sequenciais.
**Fix:** Paralelização de buscas (Firecrawl) e síntese em passo único (single-pass).

---

## Lista Completa de Issues Técnicos Corrigidos

| # | Descrição | Severidade | Status |
|---|-----------|------------|--------|
| 1 | Funnels Generate 500 | CRÍTICO | CORRIGIDO |
| 2 | Design Generate 400 (Prompt missing) | ALTO | CORRIGIDO |
| 3 | Campaign ID undefined (Cascata de erros) | CRÍTICO | CORRIGIDO |
| 4 | Qualidade Visual (Brain Context missing) | ALTO | CORRIGIDO |
| 6 | Timeout 504 em Geração de Ads | CRÍTICO | CORRIGIDO |
| 7 | Idioma misto em imagens | MÉDIO | CORRIGIDO |
| 15 | R$ NaN no Ticket Médio | BUG | CORRIGIDO |
| 17 | Deep Research (500, 401, 504) | CRÍTICO | CORRIGIDO |

---

## Notas de Arquitetura (Fase 3)

### Padrão de Modelos
- **Sempre** usar `DEFAULT_GEMINI_MODEL` de `@/lib/ai/gemini`.
- Evitar fallbacks hardcoded em rotas de API.

### Ingestão de Dados (Backlog Crítico)
Os módulos de **Attribution**, **LTV** e **Journey** estão tecnicamente prontos (backend), mas vazios (sem dados).
- **Dependência:** Sprint L (Tracking Pixel, Webhooks, Ads Sync).
