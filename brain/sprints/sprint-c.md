# Sprint C — Tier 2 Engines (Cobertura Ampla)

> Fase 4 do plano
> Status: NAO INICIADO
> Dependencia: Sprint B concluido

---

## Resumo
Integrar brains nos engines de geracao (Content, Ads, Social) e scoring criativo. Migrar gemini-2.5-flash em producao.

---

## Tarefas

### 4.1 Content Generation

#### [  ] 4.1.1 — Injetar brains por tipo de conteudo
- **Arquivo:** `app/src/lib/content/generation-engine.ts`
- **Mapeamento:**
  - Posts sociais → Rachel Karten + Justin Welsh
  - Copy de email → Kennedy + Kern
  - Landing pages → Ogilvy + Sugarman
- **Status:** _aguardando_

### 4.2 Creative Scoring

#### [  ] 4.2.1 — Adicionar avaliacao qualitativa via brains
- **Arquivo:** `app/src/lib/intelligence/creative/scoring.ts`
- **Mudanca:** Score atual (ROI-based) + Score de copy quality (brain-based) = Score final
- **Status:** _aguardando_

### 4.3 Ads Generation

#### [  ] 4.3.1 — Substituir 1-line expertise por identity cards completos
- **Arquivo:** `app/src/lib/ai/prompts/ads-generation.ts`
- **Mudanca:** Identity cards dos 4 ads counselors (Brooke, Kusmich, Loomer, Sanchez)
- **Status:** _aguardando_

### 4.4 Social Generation

#### [  ] 4.4.1 — Conectar templates + identity cards social
- **Arquivo:** `app/src/app/api/social/generate/route.ts`
- **Mudanca:** Templates de social-generation.ts + identity cards dos 4 social counselors
- **Status:** _aguardando_

### 4.5 Migracao LLM

#### [  ] 4.5.1 — Migrar gemini-2.5-flash em producao
- **Acao:** Mudar GEMINI_MODEL no Vercel de gemini-2.0-flash para gemini-2.5-flash
- **Pre-requisito:** Testado com sucesso no Sprint B (staging)
- **Deadline:** Antes de 31 Marco 2026
- **Status:** _aguardando_

---

## Verificacao Sprint C

- [ ] Ads gerados incluem counselorInsights referenciando framework especifico
- [ ] Social posts seguem heuristicas de plataforma dos social counselors
- [ ] Content generation usa brain relevante ao tipo
- [ ] Creative scoring combina score ROI + score qualitativo
- [ ] gemini-2.5-flash migrado em producao sem regressoes

---

## Changelog

| Data | Tarefa | Status | Observacoes |
|------|--------|--------|-------------|
| — | Sprint C inicio | AGUARDANDO | Depende da Sprint B |
