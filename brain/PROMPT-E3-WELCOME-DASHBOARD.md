# PROMPT — E3: Welcome Integrado no Dashboard + Onboarding Fix

> Cole este prompt inteiro no agente que vai executar a tarefa.

---

## CONTEXTO

**Produto:** MKTHONEY — SaaS de marketing autonomo com IA.
**Stack:** Next.js 16.1.1, React 19, TypeScript, Firebase, Gemini AI.
**Diretorio do app:** `app/` (root do Next.js — build: `cd app && npm run build`)

**Design System:** Honey Gold dark-only (D0 aprovado).
- Tokens: `app/src/styles/design-tokens.css`
- Primary: #E6B447, BG: #0D0B09, Surface-1: #1A1612, Text: #F5E8CE

**Situacao:**
1. Pagina `/welcome` e separada do dashboard — deve ser INTEGRADA no dashboard como estado inline
2. Botao "Criar sua marca" no welcome navega para `/brands/new` (form antigo 7-step) — deve abrir onboarding modal
3. Dashboard ja tem 3 estados (pre-briefing, post-aha, active) — precisa de um 4o estado "welcome"
4. Onboarding modal (3 steps) funciona mas precisa ser acionado corretamente

**ESTA E A TAREFA MAIS COMPLEXA. Leia todos os arquivos antes de comecar.**

---

## FERRAMENTAS OBRIGATORIAS

### shadcn MCP
- `search_items_in_registries` queries: `card`, `progress`, `tabs`, `dialog`
- `get_item_examples_from_registries` query: `card-demo`
- `get_audit_checklist` — rodar apos mudancas

### Skills
- `/ui-components` — padroes de componentes
- `/react-patterns` — hooks, state management, client boundaries
- `/web-design-guidelines` — review de UI
- `/page-optimization` — dashboard conversion

### Referencias Visuais
- Welcome atual: `_netecmt/docs/design/screens/entry-flow/welcome.png`
- Onboarding modal: `_netecmt/docs/design/screens/entry-flow/onboarding-modal.png`
- Dashboard pre-briefing: `_netecmt/docs/design/screens/core-loop/dashboard-pre-briefing.png`

---

## ARQUIVOS A MODIFICAR

### Principais (ler TODOS antes de comecar):
1. `app/src/app/page.tsx` (~335 linhas — dashboard principal)
2. `app/src/app/welcome/page.tsx` (~154 linhas — transformar em redirect)
3. `app/src/components/onboarding/onboarding-modal.tsx` (~293 linhas)

### Secundarios (ler para contexto):
4. `app/src/components/onboarding/onboarding-step-identity.tsx` (138 linhas)
5. `app/src/components/onboarding/onboarding-step-audience.tsx` (173 linhas)
6. `app/src/components/onboarding/onboarding-step-offer.tsx` (130 linhas)
7. `app/src/components/onboarding/onboarding-transition.tsx` (184 linhas)
8. `app/src/components/dashboard/dashboard-hero.tsx` (132 linhas)
9. `app/src/components/dashboard/verdict-summary.tsx` (149 linhas)
10. `app/src/components/dashboard/stats-cards.tsx` (200 linhas)
11. `app/src/components/dashboard/quick-actions.tsx` (109 linhas)
12. `app/src/components/dashboard/recent-activity.tsx` (168 linhas)

---

## TAREFA 1: Welcome Page -> Redirect

### Arquivo: `app/src/app/welcome/page.tsx`

### Estado atual (154 linhas):
Pagina standalone com 3 action cards e skip button. Renderiza fora do dashboard (sem sidebar).

### O que fazer:
Transformar em um simples redirect para `/`:

```tsx
import { redirect } from 'next/navigation';

export default function WelcomePage() {
  redirect('/');
}
```

**Alternativa (se a pagina tiver metadata):** Manter metadata e fazer redirect no componente client. Mas prefer server redirect.

**Razao:** Backwards compatibility — links antigos para `/welcome` vao continuar funcionando.

---

## TAREFA 2: Dashboard — Adicionar Estado "Welcome"

### Arquivo: `app/src/app/page.tsx`

### Estado atual:
- `resolveDashboardState()` (linhas ~31-57) retorna: `'loading'`, `'pre-briefing'`, `'post-aha'`, `'active'`
- Nao tem estado "welcome" para usuarios sem marca

### O que fazer:

**1. Adicionar estado 'welcome' na funcao `resolveDashboardState()`:**

```typescript
function resolveDashboardState(params: {
  isLoading: boolean;
  brands: Brand[];
  onboardingCompleted: boolean;
  verdict: VerdictOutput | null;
}): DashboardState {
  const { isLoading, brands, onboardingCompleted, verdict } = params;

  if (isLoading) return 'loading';

  // NOVO: usuario sem marca = estado welcome
  if (brands.length === 0) return 'welcome';

  if (!verdict) return 'pre-briefing';
  if (verdict && !onboardingCompleted) return 'post-aha'; // ou outra logica
  return 'active';
}
```

**2. Atualizar o tipo DashboardState:**
Em `dashboard-hero.tsx` (ou onde estiver definido):
```typescript
type DashboardState = 'loading' | 'welcome' | 'pre-briefing' | 'post-aha' | 'active';
```

**3. Adicionar WelcomeBody no dashboard:**

Criar um novo componente inline (ou separado) para o estado welcome:

```tsx
function WelcomeBody({ onCreateBrand, onGoToChat }: {
  onCreateBrand: () => void;
  onGoToChat: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      {/* Icon */}
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#E6B447]/10">
        <Sparkles className="h-10 w-10 text-[#E6B447]" />
      </div>

      {/* Title */}
      <h1 className="mb-2 text-2xl font-bold text-white">
        Bem-vindo ao MKTHONEY
      </h1>
      <p className="mb-8 max-w-md text-sm text-zinc-400">
        Configure sua marca para desbloquear todo o arsenal de marketing autonomo.
      </p>

      {/* Action Cards */}
      <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-3">
        {/* Criar Marca */}
        <button
          onClick={onCreateBrand}
          className="group flex flex-col items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 text-center transition-all hover:border-[#E6B447]/20 hover:bg-[#E6B447]/[0.03]"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#E6B447]/10 transition-transform group-hover:scale-110">
            <Sparkles className="h-6 w-6 text-[#E6B447]" />
          </div>
          <span className="text-sm font-medium text-white">Criar sua marca</span>
          <span className="text-xs text-zinc-500">3 passos rapidos</span>
        </button>

        {/* Consultar MKTHONEY */}
        <button
          onClick={onGoToChat}
          className="group flex flex-col items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 text-center transition-all hover:border-blue-500/20 hover:bg-blue-500/[0.03]"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 transition-transform group-hover:scale-110">
            <MessageSquare className="h-6 w-6 text-blue-400" />
          </div>
          <span className="text-sm font-medium text-white">Consultar MKTHONEY</span>
          <span className="text-xs text-zinc-500">Chat com os conselheiros</span>
        </button>

        {/* Explorar */}
        <button
          onClick={() => {/* scroll down ou dismiss welcome */}}
          className="group flex flex-col items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 text-center transition-all hover:border-purple-500/20 hover:bg-purple-500/[0.03]"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 transition-transform group-hover:scale-110">
            <Compass className="h-6 w-6 text-purple-400" />
          </div>
          <span className="text-sm font-medium text-white">Explorar plataforma</span>
          <span className="text-xs text-zinc-500">Conhecer funcionalidades</span>
        </button>
      </div>
    </motion.div>
  );
}
```

**4. Integrar no render principal do dashboard:**

No switch/conditional do dashboard (onde renderiza cada estado), adicionar:

```tsx
{dashboardState === 'welcome' && (
  <WelcomeBody
    onCreateBrand={() => setManualOnboarding(true)}
    onGoToChat={() => router.push('/chat')}
  />
)}
```

**IMPORTANTE:** `onCreateBrand` deve abrir o onboarding modal (nao navegar para `/brands/new`).

---

## TAREFA 3: Onboarding Modal — Trigger Correto

### Arquivo: `app/src/app/page.tsx`

### Estado atual:
- Linhas ~252-266: Logica de `autoShowOnboarding` e `manualOnboarding`
- O modal ja abre condicionalmente

### O que fazer:

**Verificar que o OnboardingModal abre quando:**
1. `manualOnboarding === true` (usuario clicou "Criar sua marca")
2. OU `autoShowOnboarding === true` (auto-trigger para novos usuarios)

**Garantir que NÃO navega para `/brands/new`:**
- Buscar qualquer `router.push('/brands/new')` no page.tsx e remover
- O onboarding modal CRIA a marca internamente (via `useBrands().create()`)

**Se o modal esta em um Dialog/Sheet:**
- Usar `open={manualOnboarding || autoShowOnboarding}`
- `onOpenChange` deve setar ambos para false

---

## TAREFA 4: Onboarding Modal — Progress Bar Gold

### Arquivo: `app/src/components/onboarding/onboarding-modal.tsx`

### Estado atual (linha ~235):
Progress bar com `OnboardingProgress` component.

### Verificar que:
- Progress bar usa gold gradient (`from-[#E6B447] to-[#AB8648]`)
- Step icons ativos: gold `text-[#E6B447]`
- Step icons inativos: muted `text-zinc-600` ou `text-[#6B5D4A]`
- Botao "Proximo": gold background (`bg-[#E6B447] text-[#0D0B09]` ou `btn-accent`)
- Botao "Voltar": ghost (`bg-transparent text-zinc-400 hover:text-white`)

### Se nao estiver com essas cores, ajustar.

---

## TAREFA 5: Onboarding Steps — Verificar Gold Consistency

### Arquivos:
- `onboarding-step-identity.tsx` (138 linhas)
- `onboarding-step-audience.tsx` (173 linhas)
- `onboarding-step-offer.tsx` (130 linhas)
- `onboarding-transition.tsx` (184 linhas)

### Estado atual:
Todos ja usam `focus:border-[#E6B447]` e `bg-[#E6B447]/20` para selecao. Confirmar visualmente que:

- [ ] Inputs com focus gold: `focus:border-[#E6B447]`
- [ ] Pills/chips selecionados: `border-[#E6B447] bg-[#E6B447]/20 text-[#E6B447]`
- [ ] Pills nao selecionados: `border-zinc-700 text-zinc-400 hover:border-zinc-600`
- [ ] Transition screen: gold particles, gold progress bar, gold glow

**Se tudo ja esta correto, NAO alterar — apenas confirmar.**

---

## TAREFA 6: Dashboard Hero — Estado Welcome

### Arquivo: `app/src/components/dashboard/dashboard-hero.tsx`

### Estado atual (132 linhas):
Suporta: 'pre-briefing', 'post-aha', 'active', 'loading'.

### O que fazer:

**Adicionar suporte ao estado 'welcome':**

Se o DashboardHero for renderizado no estado welcome (decidir se e necessario):
- Option A: NAO renderizar DashboardHero no estado welcome (WelcomeBody substitui)
- Option B: Renderizar versao simplificada

**Recomendado: Option A** — No estado welcome, o WelcomeBody substitui completamente o hero + content. O DashboardHero so aparece nos outros 3 estados.

```tsx
{dashboardState !== 'welcome' && dashboardState !== 'loading' && (
  <DashboardHero
    state={dashboardState}
    brand={activeBrand}
    verdict={verdict}
    onStartBriefing={handleStartBriefing}
  />
)}
```

---

## TAREFA 7: Dashboard — Remover Link para /brands/new

### Arquivo: `app/src/app/page.tsx`

### Buscar e substituir:
Qualquer referencia a `/brands/new` no dashboard deve ser trocada para abrir o onboarding modal:

```typescript
// ANTES
router.push('/brands/new')

// DEPOIS
setManualOnboarding(true)
```

Verificar tambem:
- `quick-actions.tsx` — se tem link para `/brands/new`, trocar para callback
- `recent-activity.tsx` — idem

---

## TAREFA 8: Header Title — Estado Welcome

### Verificar que o Header no estado welcome mostra:
- Titulo: "MKTHONEY" ou "Inicio"
- Subtitulo: vazio ou "Bem-vindo"
- Sem back button

---

## O QUE NAO FAZER

1. **NAO alterar** logica de auth, Firebase calls, tier system
2. **NAO alterar** onboarding store persistence
3. **NAO alterar** brand creation logic (useBrands().create())
4. **NAO alterar** verdict calculation ou RAG
5. **NAO remover** estados existentes (pre-briefing, post-aha, active)
6. **NAO alterar** sidebar navigation ou routing
7. **NAO criar** novos stores — usar state local no page.tsx
8. **NAO alterar** a transicao do onboarding (onboarding-transition.tsx) — ja funciona

---

## FLUXO ESPERADO APOS MUDANCAS

```
1. Novo usuario faz signup
2. Redirect para / (dashboard)
3. Dashboard detecta brands.length === 0 → estado "welcome"
4. WelcomeBody renderiza com 3 cards
5. Usuario clica "Criar sua marca"
6. Onboarding modal abre (3 steps: Identity, Audience, Offer)
7. Usuario completa onboarding
8. Transition screen (3.5s) → redirect para /chat?from=onboarding
9. Usuario volta ao dashboard → estado "pre-briefing" (tem marca, sem veredito)
10. Usuario solicita veredito → estado "active"
```

```
Alternativo:
1. Novo usuario entra em /welcome (link antigo)
2. Server redirect para /
3. Dashboard mostra estado welcome (passo 3 acima)
```

---

## VERIFICACAO

```bash
# 1. Welcome redireciona para /
# (testar manualmente acessando /welcome no browser)

# 2. Zero refs a /brands/new no dashboard e componentes associados
cd app && grep -rn "/brands/new" src/app/page.tsx src/components/dashboard/ src/components/onboarding/
# Deve retornar ZERO ou apenas em comments

# 3. Estado 'welcome' existe no DashboardState type
cd app && grep -rn "welcome" src/components/dashboard/dashboard-hero.tsx src/app/page.tsx

# 4. Build passa
cd app && npm run build
```

### Criterios de aceitacao E3:
- [ ] `/welcome` redireciona para `/`
- [ ] Dashboard detecta usuario sem marca e mostra WelcomeBody
- [ ] "Criar sua marca" abre onboarding modal (NAO navega para /brands/new)
- [ ] Onboarding modal funciona: 3 steps → transition → /chat
- [ ] Dashboard volta ao pre-briefing apos onboarding
- [ ] DashboardState tipo inclui 'welcome'
- [ ] WelcomeBody tem 3 cards (marca, chat, explorar) com cores corretas
- [ ] Onboarding modal progress bar gold
- [ ] Zero refs a `/brands/new` no dashboard area
- [ ] Build: `cd app && npm run build` passa

---

## COMMIT

```
feat(E3): integrate welcome into dashboard, fix onboarding trigger

- Transform /welcome into server redirect to /
- Add 'welcome' state to dashboard for users without brands
- WelcomeBody with 3 action cards (create brand, chat, explore)
- "Criar marca" opens onboarding modal instead of /brands/new
- Remove all /brands/new navigation from dashboard area
- Verify onboarding steps use gold design tokens

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```
