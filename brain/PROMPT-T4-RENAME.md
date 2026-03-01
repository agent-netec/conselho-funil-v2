# PROMPT — T4: Renomear "Conselho" → "MKTHONEY" em todo o codebase

> Cole este prompt inteiro no agente que vai executar a tarefa.

---

## CONTEXTO

**Produto:** MKTHONEY — SaaS de marketing autônomo com IA.
**Stack:** Next.js 16.1.1, React 19, TypeScript, Tailwind CSS v4, Firebase Auth.
**Diretório do app:** `app/` (root do Next.js — build: `cd app && npm run build`)

**Situação atual:** O produto se chama MKTHONEY, mas o codebase ainda tem 194 referências a "Conselho" (nome antigo "Conselho de Funil") espalhadas em 84 arquivos. Isso inclui UI visível ao usuário, prompts de IA e textos de copy.

---

## OBJETIVO

Renomear TODAS as referências a "Conselho" / "Conselho de Funil" para "MKTHONEY" ou equivalentes, conforme a tabela de mapeamento abaixo.

---

## TABELA DE MAPEAMENTO

### 1. CHAT_MODES em `app/src/lib/constants.ts` (fonte única de verdade)

| Campo | Valor Atual | Novo Valor |
|-------|------------|------------|
| `general.label` | `'Conselho'` | `'Geral'` |
| `general.title` | `'Conselho'` | `'MKTHONEY'` |
| `general.placeholder` | `'Pergunte ao Conselho...'` | `'Pergunte ao MKTHONEY...'` |
| `funnel.title` | `'Conselho de Funil'` | `'Funil'` |
| `copy.title` | `'Conselho de Copy'` | `'Copywriting'` |
| `social.title` | `'Conselho Social'` | `'Social'` |
| `ads.title` | `'Conselho de Ads'` | `'Ads & Tráfego'` |
| `design.title` | `'Conselho de Design'` | `'Design'` |
| `party.title` | `'Alto Conselho'` | `'Party Mode'` |

### 2. Prompts de IA (system prompts)

| Padrão Atual | Novo Padrão |
|-------------|-------------|
| `Você é o Conselho de Funil, um sistema de inteligência` | `Você é o MKTHONEY — módulo Funil, um sistema de inteligência` |
| `Você é o Conselho de Copywriting, um sistema` | `Você é o MKTHONEY — módulo Copywriting, um sistema` |
| `Você é o Conselho Social, um sistema` | `Você é o MKTHONEY — módulo Social, um sistema` |
| `Você é o Conselho de Ads, um sistema` | `Você é o MKTHONEY — módulo Ads, um sistema` |
| `Resposta do Conselho` | `Análise MKTHONEY` |

### 3. Party Mode (prompts de debate)

| Padrão Atual | Novo Padrão |
|-------------|-------------|
| `Veredito do Conselho` | `Veredito Final` |
| `Deliberação do Conselho` | `Deliberação dos Especialistas` |
| `VEREDITO_DO_CONSELHO` | `VEREDITO_FINAL` |
| `Consenso do Conselho` | `Consenso dos Especialistas` |
| `Início da Deliberação do Conselho` | `Início da Deliberação` |

### 4. UI — Dashboard (`app/src/components/dashboard/`)

| Arquivo | Valor Atual | Novo Valor |
|---------|------------|------------|
| `dashboard-hero.tsx` | `desbloquear o poder do Conselho` | `desbloquear o poder do MKTHONEY` |
| `dashboard-hero.tsx` | `Seu Conselho Estrategico esta sincronizado` | `O MKTHONEY esta sincronizado e monitorando sua marca` |
| `recent-activity.tsx` | `começar a usar o Conselho` | `começar a usar o MKTHONEY` |
| `recent-activity.tsx` | `O Conselho` (heading h3) | `MKTHONEY` |
| `verdict-summary.tsx` | `Consulte o Conselho para receber` | `Consulte o MKTHONEY para receber` |
| `verdict-summary.tsx` | `Consultar o Conselho` (botão) | `Consultar MKTHONEY` |
| `stats-cards.tsx` | `Com o Conselho` (subtitle) | `Com o MKTHONEY` |
| `quick-actions.tsx` | `ajuda do Conselho` | `ajuda do MKTHONEY` |
| `quick-actions.tsx` | `Consultar Conselho` (título) | `Consultar MKTHONEY` |

### 5. UI — Landing (`app/src/components/landing/`)

| Arquivo | Valor Atual | Novo Valor |
|---------|------------|------------|
| `landing-council.tsx` | `O Conselho — 23 Especialistas de Marketing` | `O Arsenal — 23 Especialistas de Marketing` |
| `landing-council.tsx` | `diferencial do MktHoney e o Conselho: 23 conselheiros` | `diferencial do MKTHONEY: 23 especialistas` |
| `landing-navbar.tsx` | `{ href: '#conselho', label: 'O Conselho' }` | `{ href: '#arsenal', label: 'O Arsenal' }` |
| `landing-how-it-works.tsx` | `Ative o Conselho` | `Ative os Especialistas` |
| `landing-pricing.tsx` | `Conselho Geral + 1 modo` | `Modo Geral + 1 especialidade` |

**IMPORTANTE:** Verificar se `landing-council.tsx` tem um `id="conselho"` no section wrapper. Se sim, trocar para `id="arsenal"` para manter consistência com o `href="#arsenal"` da navbar.

### 6. UI — Chat (`app/src/components/chat/`)

| Arquivo | Padrão | Novo |
|---------|--------|------|
| `chat-empty-state.tsx` | `Conselho de Funil` | `Funil` |
| `chat-empty-state.tsx` | `Conselho de Copy` | `Copywriting` |
| `chat-empty-state.tsx` | `Conselho Social` | `Social` |
| `chat-empty-state.tsx` | `Conselho de Ads` | `Ads & Tráfego` |
| `chat-empty-state.tsx` | `Especialistas do Conselho` ou similar | `23 Especialistas MKTHONEY` |
| `chat-message-bubble.tsx` | Qualquer ref a "Conselho" | Trocar para "MKTHONEY" |
| `chat-input-area.tsx` | Qualquer ref a "Conselho" | Trocar para "MKTHONEY" |
| `counselor-selector.tsx` | Qualquer ref a "Conselho" | Trocar para "MKTHONEY" |
| `counselor-multi-selector.tsx` | Qualquer ref a "Conselho" | Trocar para "MKTHONEY" |

### 7. Páginas (`app/src/app/`)

Buscar e substituir em TODOS estes arquivos. A regra geral:
- "Conselho de Funil" (referindo ao produto) → "MKTHONEY"
- "Conselho de Funil" (referindo ao modo de chat) → "Funil"
- "Conselho de Copy" → "Copywriting"
- "Conselho Social" → "Social"
- "Conselho de Ads" → "Ads & Tráfego"
- "Conselho de Design" → "Design"
- "o Conselho" (genérico) → "o MKTHONEY"
- "ao Conselho" → "ao MKTHONEY"
- "do Conselho" → "do MKTHONEY"
- "Alto Conselho" → "Party Mode"

**Arquivos com refs (lista completa):**

```
app/src/app/welcome/page.tsx (1)
app/src/app/intelligence/research/page.tsx (6)
app/src/app/funnels/page.tsx (1)
app/src/app/integrations/page.tsx (4)
app/src/app/social/page.tsx (2)
app/src/app/campaigns/[id]/page.tsx (7)
app/src/app/funnels/[id]/page.tsx (10)
app/src/app/funnels/[id]/design/page.tsx (4)
app/src/app/funnels/[id]/copy/page.tsx (7)
app/src/app/funnels/[id]/proposals/[proposalId]/page.tsx (4)
app/src/app/shared/[token]/page.tsx (1)
app/src/app/shared/reports/[token]/page.tsx (5)
app/src/app/settings/tracking/page.tsx (1)
app/src/app/settings/page.tsx (2)
app/src/app/brands/[id]/page.tsx (1)
```

### 8. Lib — AI Prompts (`app/src/lib/ai/prompts/`)

**Estes são system prompts enviados ao Gemini. Usar os mapeamentos da seção 2 e 3.**

```
app/src/lib/ai/prompts/chat-system.ts (6) — PRINCIPAL
app/src/lib/ai/prompts/party-mode.ts (6) — DEBATE/VEREDITO
app/src/lib/ai/prompts/ads-generation.ts (5)
app/src/lib/ai/prompts/funnel-generation.ts (4)
app/src/lib/ai/prompts/index.ts (2)
app/src/lib/ai/prompts/social-generation.ts (3)
app/src/lib/ai/prompts/copy-generation.ts (1)
app/src/lib/ai/prompts/verdict-prompt.ts (1)
app/src/lib/ai/prompts/vision-heuristics.ts (1)
app/src/lib/ai/prompts/performance-advisor.ts (1)
app/src/lib/ai/prompts/predictive-scoring.ts (1)
app/src/lib/ai/prompts/publisher-adaptation.ts (1)
app/src/lib/ai/prompts/design.ts (1)
```

**ATENÇÃO** nos prompts: onde o Gemini recebe "Conselho" como JSON example (ex: `"insight": "Conselho sobre escala"`), trocar para `"insight": "Recomendação sobre escala"` (a palavra "Conselho" aqui significa "advice", não o produto).

### 9. Lib — Engines & Utils

```
app/src/lib/ai/gemini.ts (2)
app/src/lib/reporting/engine.ts (1)
app/src/lib/reporting/briefing-bot.ts (1)
app/src/lib/content/generation-engine.ts (1)
app/src/lib/automation/evaluate.ts (2)
app/src/lib/intelligence/autopsy/engine.ts (4)
app/src/lib/intelligence/copy-refactor/engine.ts (1)
app/src/lib/intelligence/text-analyzer/ad-copy-analyzer.ts (1)
app/src/lib/utils/party-parser.ts (4)
app/src/lib/stores/onboarding-store.ts (1)
app/src/lib/stores/notification-store.ts (1)
```

### 10. Outros componentes

```
app/src/components/vault/approval-workspace.tsx (3)
app/src/components/onboarding/onboarding-transition.tsx (1)
app/src/components/decisions/decision-timeline.tsx (1)
app/src/components/assets/asset-detail-modal.tsx (2)
app/src/components/social/debate-viewer.tsx (2)
app/src/components/social/social-wizard.tsx (3)
app/src/components/social/scorecard-viewer.tsx (1)
app/src/components/social/hook-generator.tsx (2)
app/src/components/campaigns/stage-card.tsx (1)
app/src/components/modals/paywall-modal.tsx (1)
app/src/components/performance/automation-control-center.tsx (3)
app/src/components/funnels/export-dialog.tsx (2)
app/src/components/intelligence/discovery/keywords-miner.tsx (1)
app/src/components/intelligence/offer-lab/offer-lab-wizard.tsx (4)
app/src/components/intelligence/predictor/prediction-panel.tsx (2)
app/src/components/brands/brand-kit-form.tsx (2)
```

### 11. API Routes

```
app/src/app/api/chat/route.ts (6)
app/src/app/api/chat/verdict/route.ts (1)
app/src/app/api/ai/analyze-visual/route.ts (1)
app/src/app/api/design/plan/route.ts (1)
app/src/app/api/webhooks/ads-metrics/route.ts (1)
app/src/app/api/content/calendar/generate-week/route.ts (1)
app/src/app/api/funnels/export/route.ts (1)
app/src/app/api/copy/generate/route.ts (1)
app/src/app/api/copy/decisions/route.ts (1)
app/src/app/api/social/generate/route.ts (1)
app/src/app/api/social/debate/route.ts (1)
```

### 12. Types & Tests (baixa prioridade)

```
app/src/types/index.ts (1) — provavelmente comentário
app/src/types/database.ts (1) — provavelmente comentário
app/src/__tests__/lib/utils/party-parser.test.ts (2) — atualizar strings de teste
```

---

## ORDEM DE EXECUÇÃO

1. **`app/src/lib/constants.ts`** — Trocar CHAT_MODES (fonte única de verdade)
2. **`app/src/lib/ai/prompts/`** — Todos os system prompts
3. **`app/src/components/`** — UI components
4. **`app/src/app/`** — Pages e API routes
5. **`app/src/lib/`** — Engines, utils, stores
6. **Types e tests** — Por último

---

## O QUE NÃO FAZER

1. **NÃO alterar** nomes de arquivos (ex: `landing-council.tsx` mantém o nome)
2. **NÃO alterar** nomes de variáveis TypeScript (ex: `COUNSELORS_REGISTRY`, `CounselorId`, `counselors` — estes são nomes internos do código, não user-facing)
3. **NÃO alterar** imports (ex: `import { Counselor } from '@/types'` fica como está)
4. **NÃO alterar** IDs internos como `ChatMode`, `domain`, `id` fields
5. **NÃO alterar** nomes de funções ou métodos
6. **NÃO alterar** lógica de negócio, RAG, credits ou persistência
7. **NÃO instalar** dependências
8. **NÃO alterar** o layout.tsx raiz ou middleware.ts
9. **NÃO alterar** a palavra "conselheiros" quando usada como substantivo genérico (ex: "cada conselheiro analisa") — trocar por "especialista" quando fizer sentido

**Resumo:** Só alterar STRINGS VISÍVEIS AO USUÁRIO e STRINGS ENVIADAS AO MODELO DE IA. Nomes de código ficam iguais.

---

## VERIFICAÇÃO

### Busca de resíduos:

```bash
cd app && grep -rn "Conselho" src/ --include="*.tsx" --include="*.ts" | grep -v node_modules | grep -v ".next" | grep -v "import" | grep -v "COUNSELORS" | grep -v "counselor" | grep -v "Counselor"
```

**Deve retornar ZERO resultados** (exceto `conselheiro`/`conselheiros` como substantivo genérico, que pode ficar como "especialista" se já foi trocado, ou permanecer se não foi encontrado).

### Build:

```bash
cd app && npm run build
```

### Checklist de aceitação T4:

- [ ] `CHAT_MODES` em constants.ts — todos os `title`, `label`, `placeholder` atualizados
- [ ] System prompts — "Você é o MKTHONEY — módulo X" em todos
- [ ] Party mode — "Veredito Final", "Deliberação dos Especialistas"
- [ ] Dashboard — zero refs a "Conselho"
- [ ] Landing page — "O Arsenal — 23 Especialistas", navbar atualizada
- [ ] Chat components — zero refs a "Conselho"
- [ ] API routes — zero refs a "Conselho" em responses
- [ ] ZERO resultados no grep de verificação
- [ ] Build passa: `cd app && npm run build`

---

## COMMIT

```
feat: rename "Conselho" to "MKTHONEY" across all user-facing surfaces

- Updated CHAT_MODES labels/titles in constants.ts (source of truth)
- Updated all AI system prompts to "MKTHONEY — módulo X" pattern
- Updated party mode: "Veredito Final", "Deliberação dos Especialistas"
- Updated dashboard, landing, chat components, pages, API routes
- 194 occurrences across 84 files → 0 residual "Conselho" references

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```
