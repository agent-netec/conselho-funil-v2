# PROMPT — E1: App Shell, Sidebar e Header

> Cole este prompt inteiro no agente que vai executar a tarefa.

---

## CONTEXTO

**Produto:** MKTHONEY — SaaS de marketing autonomo com IA.
**Stack:** Next.js 16.1.1, React 19, TypeScript, Firebase, Gemini AI.
**Diretorio do app:** `app/` (root do Next.js — build: `cd app && npm run build`)

**Design System:** Honey Gold dark-only (D0 aprovado).
- Tokens completos: `app/src/styles/design-tokens.css`
- Globals: `app/src/app/globals.css`
- Primary: #E6B447, BG: #0D0B09, Surface-1: #1A1612, Text: #F5E8CE, Muted: #6B5D4A

**Situacao:** A migracao emerald->gold foi completada (Sprint UI — ZERO refs emerald). Agora precisa:
1. Copiar logos SVG do skeleton para `app/public/`
2. Integrar logo MKTHONEY real no topo da sidebar (substituir icone generico)
3. Refinar sidebar com design tokens CSS (usar variaveis em vez de valores hardcoded)
4. Garantir header com gold focus ring e backdrop-blur consistente
5. Loading screen: garantir que usa o logo SVG real

---

## FERRAMENTAS OBRIGATORIAS

### shadcn MCP
Use o MCP do shadcn para:
- `get_project_registries` — verificar registros configurados
- `search_items_in_registries` com query `sheet` — verificar se Sheet (mobile drawer) esta disponivel
- `get_audit_checklist` — rodar apos finalizar mudancas

### Skills
Aplicar ao trabalhar:
- `/ui-components` — padroes de componentes React/Tailwind
- `/react-patterns` — Server Components, hooks, client boundaries
- `/web-design-guidelines` — review de UI

### Referencias Visuais
- Dashboard com sidebar: `_netecmt/docs/design/screens/core-loop/dashboard-pre-briefing.png`
- Logo full: `_netecmt/docs/landpage/mkthoney-landing-page-skeleton/public/logo-mkthoney.svg`
- Logo icon: `_netecmt/docs/landpage/mkthoney-landing-page-skeleton/public/logo-mkthoney-icon.svg`

---

## TAREFA 1: Copiar Assets para app/public/

Copiar estes arquivos do skeleton para `app/public/`:

```bash
cp "_netecmt/docs/landpage/mkthoney-landing-page-skeleton/public/logo-mkthoney.svg" "app/public/logo-mkthoney.svg"
cp "_netecmt/docs/landpage/mkthoney-landing-page-skeleton/public/logo-mkthoney-icon.svg" "app/public/logo-mkthoney-icon.svg"
```

**Verificar** que os SVGs sao validos apos copia.

---

## TAREFA 2: Sidebar — Integrar Logo MKTHONEY

### Arquivo: `app/src/components/layout/sidebar.tsx`

### Estado atual (linhas ~179-225):
A secao de logo usa um icone generico com gradient gold. Precisa usar o SVG real do MKTHONEY.

### O que fazer:

**1. Importar o logo SVG no topo do arquivo:**
```typescript
import Image from 'next/image';
```

**2. Substituir o bloco de logo (linhas ~179-225) por:**

O logo deve:
- Usar `<Image src="/logo-mkthoney-icon.svg" alt="MKTHONEY" width={32} height={32} />`
- Manter o container com hover glow existente
- No estado collapsed (icon-only): mostrar so o icone 32x32
- No estado expanded (se aplicavel): mostrar icone + texto "MKTHONEY" ao lado
- Glow on hover: `drop-shadow-[0_0_12px_rgba(230,180,71,0.4)]`
- Transicao suave: `transition-all duration-300`

**Exemplo de implementacao:**
```tsx
{/* Logo */}
<div className="flex items-center justify-center py-4">
  <Link href="/" className="group relative flex items-center justify-center">
    <div className="relative h-10 w-10 transition-transform duration-300 group-hover:scale-105">
      <Image
        src="/logo-mkthoney-icon.svg"
        alt="MKTHONEY"
        width={40}
        height={40}
        className="transition-all duration-300 group-hover:drop-shadow-[0_0_12px_rgba(230,180,71,0.4)]"
        priority
      />
    </div>
  </Link>
</div>
```

**NAO alterar:**
- Logica de navegacao (Link href)
- Posicionamento relativo na sidebar (topo)
- Estrutura geral de collapsed/expanded

---

## TAREFA 3: Sidebar — Refinar Design Tokens

### Estado atual:
Cores gold estao corretas mas usam valores hardcoded inline (`#E6B447`, `rgba(230,180,71,...)`).

### O que fazer:
Onde possivel, usar design tokens CSS em vez de valores inline:

| Valor hardcoded | Token CSS |
|----------------|-----------|
| `#E6B447` (accent) | `hsl(var(--accent))` ou manter `#E6B447` (ambos OK) |
| `#0D0B09` (bg) | `hsl(var(--surface-0))` |
| `#1A1612` (surface) | `hsl(var(--surface-1))` |
| `rgba(230,180,71,0.08)` | `hsl(var(--accent-glow))` |

**IMPORTANTE:** NAO trocar TODOS os valores — apenas onde melhora legibilidade. Se o valor inline esta claro e funciona, deixe como esta. O objetivo e consistencia, nao refatoracao total.

### Verificar classes utilitarias:
- `.sidebar-icon-active` — ja definida em design-tokens.css, confirmar uso na linha ~321
- `.glow-accent` — disponivel para hover effects
- `.glass` — disponivel para elementos com backdrop-blur

---

## TAREFA 4: Loading Screen — Logo SVG

### Arquivo: `app/src/components/layout/app-shell.tsx`

### Estado atual (linhas ~27-90):
LoadingScreen component com animacao gold pulsante. Pode estar usando icone generico.

### O que fazer:
- Se o loading screen usa um icone/texto generico, substituir pelo logo SVG:
```tsx
<Image
  src="/logo-mkthoney-icon.svg"
  alt="MKTHONEY"
  width={48}
  height={48}
  priority
  className="animate-pulse"
/>
```
- Se ja usa um logo adequado, apenas verificar que o glow e gold
- Manter a barra de loading animada existente

**NAO alterar:**
- Logica de auth (linhas 113-127)
- PUBLIC_PATHS constant
- Email verification banner (linhas 177-214)
- Background effects

---

## TAREFA 5: Header — Gold Focus Ring

### Arquivo: `app/src/components/layout/header.tsx`

### Estado atual (106 linhas):
Sticky header com backdrop-blur. Botoes usam `border-white/[0.04]`. Nenhum gold accent.

### O que fazer:

**1. Brand selector e inputs devem ter gold focus ring:**
```css
focus-visible:ring-2 focus-visible:ring-[#E6B447]/40 focus-visible:ring-offset-0
```

**2. Back button hover — adicionar gold sutil:**
Onde tem `hover:bg-white/[0.03]`, considerar trocar para:
```css
hover:bg-[#E6B447]/[0.03]
```
(Muito sutil, quase imperceptivel, mas alinhado com o design system)

**3. Brand ID copy button — feedback gold:**
Na linha ~82-86, o botao de copiar Brand ID deve ter feedback visual gold ao copiar:
```css
active:text-[#E6B447]
```

**NAO alterar:**
- Estrutura responsive (mobile vs desktop)
- ContextIndicator, BrandSelector, Actions — so styling
- z-index, posicao sticky

---

## O QUE NAO FAZER

1. **NAO alterar** logica de auth, routing, tier checks
2. **NAO alterar** Firebase calls ou state management
3. **NAO alterar** a estrutura de navegacao (NAV_GROUPS, paths, labels)
4. **NAO instalar** dependencias (next/image ja esta disponivel)
5. **NAO remover** funcionalidades existentes (trial badge, notification dots, etc)
6. **NAO alterar** a sidebar mobile behavior (sheet/drawer)
7. **NAO fazer** refatoracao alem do escopo visual

---

## VERIFICACAO

### Checklist:
```bash
# 1. Logos existem em app/public/
ls app/public/logo-mkthoney*.svg

# 2. Zero refs a icone generico no logo da sidebar
# (verificar manualmente que o SVG esta sendo usado)

# 3. Build passa
cd app && npm run build
```

### Criterios de aceitacao E1:
- [ ] `logo-mkthoney.svg` e `logo-mkthoney-icon.svg` copiados para `app/public/`
- [ ] Sidebar topo usa o SVG real do MKTHONEY (nao icone generico)
- [ ] Loading screen usa logo SVG com glow gold
- [ ] Header inputs/botoes tem gold focus ring
- [ ] Design tokens CSS usados onde aplicavel
- [ ] Zero regressoes visuais
- [ ] Build: `cd app && npm run build` passa

---

## COMMIT

```
feat(E1): integrate MKTHONEY logo SVG, refine shell/sidebar/header design tokens

- Copy logo-mkthoney.svg and logo-mkthoney-icon.svg to app/public/
- Replace generic sidebar logo with actual MKTHONEY SVG
- Add gold focus ring to header inputs and buttons
- Use CSS design tokens where applicable
- Loading screen uses real logo with gold glow

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```
