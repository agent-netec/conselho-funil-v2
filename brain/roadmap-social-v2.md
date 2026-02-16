# Plano: Redesign Completo do Módulo Social (Conselho Social v2)

**Status:** PLANEJADO — aguardando conclusão do QA Sprint I para ser convertido em sprints de execução.
**Decisão:** Implementar fase por fase. Trends usarão Exa + Firecrawl + Gemini (busca profunda).
**Data:** 2026-02-16

## Contexto

O módulo Social atual é um wrapper simples do Gemini: input de tema → output de hooks → score genérico. Não tem pesquisa ativa, não tem debate entre conselheiros, não tem especificação de campanha, não referencia políticas reais das redes, e a avaliação (scorecard 9.3) não é baseada em dados reais. O frontend também tem problemas de sobreposição de CSS nos cards de estrutura.

O usuário considera esta uma das ferramentas mais importantes do sistema e quer um redesign completo em fases.

---

## Fase 1 — Fundação & Quick Wins (Sprint J-1)

### 1.1 Fix CSS do StructureViewer (sobreposição de texto)
- **Arquivo:** `app/src/components/social/structure-viewer.tsx`
- **Problema:** O texto do "purpose" está sobrepondo o "verbal" nos cards de elementos
- **Fix:** Ajustar layout dos cards para stacking correto com gap/padding

### 1.2 Seletor de Tipo de Campanha Social
- **Arquivo:** `app/src/components/social/hook-generator.tsx` (refatorar)
- **Novo:** Adicionar step inicial antes da geração:
  - **Objetivo:** Orgânico | Viralizante | Institucional | Conversão Direta
  - **Formato de conteúdo:** Reels/TikTok | Stories | Carrossel | Thread/Post | Live
  - **Plataformas:** (manter seletor existente, mas múltipla seleção)
- **Passar** `campaignType` e `contentFormats` para a API

### 1.3 Expandir Output de Conteúdo
- **Arquivo:** `app/src/app/api/social/hooks/route.ts`
- **Atualmente:** Gera apenas hooks (frases curtas)
- **Expandir para:** Gerar um **Plano de Conteúdo** com:
  - Hooks (mantém)
  - Tipos de post sugeridos (carrossel, reel, story, thread)
  - Calendário sugerido (frequência por plataforma)
  - Pilares de conteúdo (3-5 temas recorrentes)
- **Prompt:** Atualizar `SOCIAL_HOOKS_PROMPT` para incluir `campaignType` e `contentFormats`

### 1.4 Atualizar Interface CampaignContext.social
- **Arquivo:** `app/src/types/campaign.ts`
- **Expandir** a interface `social` para:
```typescript
social?: {
  campaignType: 'organic' | 'viral' | 'institutional' | 'conversion';
  contentFormats: string[];
  hooks: { platform: string; content: string; style: string; }[];
  contentPlan?: {
    pillars: string[];
    calendar: { platform: string; frequency: string; formats: string[]; }[];
    posts: { type: string; hook: string; outline: string; platform: string; }[];
  };
  platforms: string[];
  debate?: string; // Council debate transcript (Fase 2)
  evaluation?: any; // Calibrated scorecard (Fase 2)
};
```

### Créditos: 1 crédito (mesmo custo atual)

---

## Fase 2 — Debate do Conselho & Avaliação Calibrada (Sprint J-2)

### 2.1 Debate entre 4 Conselheiros Sociais
- **Novo arquivo:** `app/src/app/api/social/debate/route.ts`
- **Reutilizar:** `buildPartyPrompt()` de `app/src/lib/ai/prompts/party-mode.ts`
- **Reutilizar:** `buildPartyBrainContext()` de `app/src/lib/intelligence/brains/prompt-builder.ts`
- **Flow:**
  1. Recebe o plano de conteúdo gerado na Fase 1
  2. Convoca os 4 conselheiros (rachel_karten, lia_haberman, nikita_beer, justin_welsh)
  3. Cada um avalia sob sua perspectiva com cross-references
  4. Moderador sintetiza veredito final
- **Modelo:** PRO_GEMINI_MODEL (gemini-3-pro-preview) — decisão crítica
- **Output:** Debate formatado em markdown + veredito + ajustes sugeridos

### 2.2 Novo Componente: DebateViewer
- **Novo arquivo:** `app/src/components/social/debate-viewer.tsx`
- **Reutilizar padrão de:** `app/src/components/chat/markdown-renderer.tsx`
- **UI:** Cards por conselheiro com avatar, nome, opinião. Seção final com veredito do conselho
- **Interação:** Usuário pode aceitar veredito ou pedir re-debate com ajustes

### 2.3 Scorecard Calibrado com Frameworks Reais
- **Arquivo:** `app/src/app/api/social/scorecard/route.ts` (refatorar)
- **Reutilizar:** `buildDimensionScoringContext()` de `app/src/lib/intelligence/brains/prompt-builder.ts`
- **Mudança:** Em vez de score genérico, usar os evaluation_frameworks reais:
  - rachel_karten → `hook_effectiveness` (scroll_stop 0.35, curiosity_gap 0.25, visual_impact 0.25, authenticity 0.15)
  - rachel_karten → `content_retention` (pacing 0.30, narrative_tension 0.25, structure 0.25, emotional_arc 0.20)
  - nikita_beer → `viral_potential` (share_trigger 0.35, social_currency 0.25, emotional_intensity 0.25, universal_relevance 0.15)
  - justin_welsh → `social_funnel_score` (funnel_role 0.30, cta_alignment 0.30, value_offer_ratio 0.20, lead_capture 0.20)
  - lia_haberman → `algorithm_alignment` (format_fit 0.30, retention_signals 0.30, shareability 0.25, native_feel 0.15)
- **Cada conselheiro** dá score + feedback + red_flags_triggered + gold_standards_hit
- **Score final** = média ponderada dos frameworks

### 2.4 Refatorar UX em Steps
- **Arquivo:** `app/src/components/social/hook-generator.tsx` (major refactor)
- **Flow em 4 steps:**
  1. **Config** → Tipo de campanha, formatos, plataformas
  2. **Geração** → Plano de conteúdo + hooks
  3. **Debate** → Conselho debate a estratégia
  4. **Avaliação** → Scorecard calibrado com frameworks reais
- **Reutilizar padrão:** `campaign-stepper.tsx` para progress visual

### Créditos: 2 créditos (debate=1, scorecard=1)

---

## Fase 3 — Pesquisa Ativa de Trends & Análise de Concorrência (Sprint J-3)

### 3.1 Social Trend Research
- **Novo arquivo:** `app/src/app/api/social/trends/route.ts`
- **Reutilizar:** Exa search de `app/src/lib/intelligence/research/engine.ts`
- **Flow:**
  1. Buscar via Exa: "trending [platform] content [vertical] [month] [year]"
  2. Buscar via Exa: "[topic] viral [platform]"
  3. Opcionalmente enriquecer top 2-3 com Firecrawl
  4. Gemini sintetiza: trends atuais, formatos populares, temas em alta
- **Output:** `{ trends: Trend[], insights: string[], viral_formats: string[] }`
- **Integrar** no step de Config da Fase 2 — mostrar trends antes do usuário definir tema

### 3.2 Competitor Social Profile Analysis
- **Novo arquivo:** `app/src/app/api/social/analyze-profile/route.ts`
- **Reutilizar:** Firecrawl de `app/src/lib/intelligence/research/engine.ts`
- **Input:** URL do perfil ou @handle + plataforma
- **Flow:**
  1. Firecrawl scrape do perfil público
  2. Gemini analisa: frequência, formatos, hooks usados, engajamento patterns
  3. Deconstrução: o que funcionou + por que + como replicar
  4. O que falhou + por que + como evitar
- **Output:** `ProfileAnalysis { strengths, weaknesses, patterns, replicable_hooks, avoid_list }`

### 3.3 Novo Componente: TrendPanel
- **Novo arquivo:** `app/src/components/social/trend-panel.tsx`
- **UI:** Cards de trends com tags de plataforma, growth indicators, links para exemplos
- **Integração:** Aparece no Step 1 (Config) como contexto para o usuário

### 3.4 Novo Componente: ProfileAnalyzer
- **Novo arquivo:** `app/src/components/social/profile-analyzer.tsx`
- **UI:** Input de URL → Loading → Report com seções expandíveis (strengths/weaknesses/patterns)
- **Reusável** fora do flow principal (pode ser acessado independentemente)

### Créditos: Trends=1, Profile Analysis=2

---

## Fase 4 — Base de Conhecimento Social & Políticas (Sprint J-4)

### 4.1 Upload de Documentos de Políticas
- **Reutilizar:** Pipeline de upload existente em `app/src/app/api/admin/upload-knowledge/route.ts`
- **Novo metadata:** `docType: 'social_policy'`, `channel: 'instagram' | 'tiktok' | 'youtube' | 'linkedin' | 'x'`
- **UI:** Seção de admin para upload de PDFs/textos de políticas por plataforma
- **Embedding:** Via gemini-embedding-001 → Pinecone (namespace: knowledge)

### 4.2 Upload de Boas Práticas & Convenções
- **Mesmo pipeline** com `docType: 'social_best_practices'`
- **Formato:** Markdown com seções por plataforma
- **Atualizável:** Versioning via metadata.version

### 4.3 RAG Filter para Social
- **Arquivo:** `app/src/lib/ai/rag.ts` (configuração de filtros)
- **Novos filtros disponíveis:**
  - `docType: 'social_policy'` — Políticas oficiais
  - `docType: 'social_best_practices'` — Boas práticas
  - `docType: 'social_case_study'` — Casos de sucesso/fracasso analisados
  - `channel: 'instagram' | 'tiktok' | ...` — Por plataforma
- **Integrar** automaticamente nos prompts de geração e debate

### 4.4 Workaround Engine
- **Dentro do debate** (Fase 2): Quando o conselho identifica conflito com política, consultar KB para workarounds
- **docType:** `'social_workaround'` — Documentos com estratégias para contornar limitações
- **Prompt injection:** Adicionar instrução no debate para verificar políticas e sugerir alternativas

### Créditos: Upload gratuito (admin). Consulta inclusa nos créditos existentes.

---

## Fase 5 — Aprimoramentos Avançados (Sprint J-5)

### 5.1 Histórico de Cases (Success/Failure Library)
- **Novo:** Quando usuário marca um conteúdo como "sucesso" ou "fracasso", salvar no Firestore com análise
- **Collection:** `brands/{brandId}/social_cases`
- **Campos:** content, platform, metrics (if available), analysis, tags, outcome
- **RAG:** Embed e indexar como `docType: 'social_case_study'` para futuras consultas

### 5.2 A/B Testing Social (Variações)
- **Após debate:** Oferecer 2-3 variações do mesmo conteúdo para A/B test
- **Reutilizar:** Padrão do `ab-test-wizard.tsx` existente
- **Cada variação** com score preditivo do scorecard calibrado

### 5.3 Integração com Campaign Pipeline
- **Arquivo:** `app/src/app/funnels/[id]/social/page.tsx` (refatorar)
- **Substituir** página atual por SocialWizard completo
- **Persistir** via `updateCampaignManifesto()` com a interface expandida

---

## Fase 6 — Social Command Center (Sprint L — Dependência de Integrações)

> **Nota:** Esta fase depende de OAuth real com as plataformas. É um módulo separado do Conselho Social (geração), focado em **engagement e monitoramento**.

### Estado Atual (Protótipo)
- **Página:** `app/src/app/social-inbox/page.tsx`
- **API:** `app/src/app/api/social-inbox/route.ts`
- **Agents:** `app/src/lib/agents/engagement/` (inbox-aggregator, response-engine, brand-voice-translator)
- **Coleta X:** Via ScoutAgent/Nitter RSS — instável, dados limitados
- **Instagram/LinkedIn:** Adapters existem mas são stubs sem OAuth real
- **Sentimento:** Retorna 0/neutral — sem análise real
- **Respostas:** Gemini gera 3 sugestões com brand voice, mas envio é fake (notify.success)
- **Busca:** Hardcoded "marketing digital" como default

### 6.1 Integrações OAuth Reais
- **Instagram Graph API** — Comentários, menções, DMs (requer aprovação Meta)
- **X API v2** — Menções, replies, DMs (requer plano Básico ~$100/mês)
- **LinkedIn API** — Comentários, menções (requer LinkedIn Marketing partnership)
- **Novos arquivos:** `app/src/lib/integrations/social/{platform}-oauth.ts`

### 6.2 Análise de Sentimento Real
- **Opção A:** Gemini batch analysis nas interações coletadas
- **Opção B:** Modelo dedicado (mais barato para volume)
- **Score:** 0.0-1.0 com labels (positive/neutral/negative/critical)
- **Flag automático:** `requires_human_review: true` quando score < 0.3

### 6.3 Envio Real de Respostas
- Via API de cada plataforma (Instagram Comment API, X Reply API, etc.)
- Guardrail: Bloqueio de envio para sentimento < 0.3 (já implementado no frontend)
- Logging: Salvar todas as respostas enviadas em `brands/{brandId}/social_interactions`

### 6.4 Real-Time Sync
- **Webhooks** para Instagram (Webhook API), X (Account Activity API)
- **Polling fallback** para plataformas sem webhook
- **Cron:** `api/cron/social-sync` a cada 15 min

### 6.5 Dashboard de Métricas
- Volume de interações por plataforma/período
- Sentimento médio (trending)
- Tempo médio de resposta
- Reutilizar `social-volume-chart.tsx` existente

### Conexões com o sistema
| Módulo | Integração Planejada |
|--------|---------------------|
| Brand Voice | Conectado — já puxa voiceTone, positioning, audience |
| Conselho Social (hooks) | Feed de trends reais → informa geração de conteúdo |
| Campaign Pipeline | Interações alimentam métricas de campanha |
| RAG/Knowledge Base | Políticas de resposta + boas práticas consultadas |
| Intelligence (Attribution) | Interações → attribution data |

### Créditos: 1 crédito por batch de sugestões de resposta. Coleta/sync gratuitos.

---

## Arquivos Críticos a Modificar

| Arquivo | Fase | Ação |
|---------|------|------|
| `app/src/components/social/structure-viewer.tsx` | 1 | Fix CSS overlap |
| `app/src/components/social/hook-generator.tsx` | 1,2 | Refactor para wizard multi-step |
| `app/src/app/api/social/hooks/route.ts` | 1 | Expandir para content plan |
| `app/src/lib/ai/prompts/social-generation.ts` | 1,2 | Novos prompts de campanha + debate |
| `app/src/types/campaign.ts` | 1 | Expandir interface social |
| `app/src/app/api/social/scorecard/route.ts` | 2 | Calibrar com frameworks reais |
| `app/src/app/funnels/[id]/social/page.tsx` | 5 | Substituir por SocialWizard |

## Arquivos Novos

| Arquivo | Fase |
|---------|------|
| `app/src/app/api/social/debate/route.ts` | 2 |
| `app/src/components/social/debate-viewer.tsx` | 2 |
| `app/src/components/social/social-wizard.tsx` | 2 |
| `app/src/app/api/social/trends/route.ts` | 3 |
| `app/src/app/api/social/analyze-profile/route.ts` | 3 |
| `app/src/components/social/trend-panel.tsx` | 3 |
| `app/src/components/social/profile-analyzer.tsx` | 3 |
| `app/src/lib/integrations/social/{platform}-oauth.ts` | 6 |
| `app/src/app/api/cron/social-sync/route.ts` | 6 |

## Padrões a Reutilizar

- **Party Mode debate:** `buildPartyPrompt()` + `buildPartyBrainContext()` → debate social
- **Brain scoring:** `buildDimensionScoringContext()` → scorecard calibrado
- **Exa research:** engine.ts → trend research
- **Firecrawl:** engine.ts → profile analysis
- **Campaign stepper:** `campaign-stepper.tsx` → wizard visual
- **Markdown renderer:** → debate viewer
- **RAG pipeline:** rag.ts → policy/best practices retrieval

## Verificação

Após cada fase:
1. Build: `cd app && npm run build` (deve passar)
2. Teste manual em produção:
   - Fase 1: Gerar hooks com tipo de campanha → verificar content plan no output
   - Fase 2: Ver debate entre 4 conselheiros → scores com frameworks reais
   - Fase 3: Ver trends antes de gerar → analisar perfil concorrente
   - Fase 4: Upload de política → verificar que RAG retorna no debate
   - Fase 5: Marcar case → verificar que aparece em futuras consultas
