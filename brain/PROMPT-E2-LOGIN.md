# PROMPT — E2: Login e Signup — Marketing Icons + Gold Orbit

> Cole este prompt inteiro no agente que vai executar a tarefa.

---

## CONTEXTO

**Produto:** MKTHONEY — SaaS de marketing autonomo com IA.
**Stack:** Next.js 16.1.1, React 19, TypeScript, Firebase, Gemini AI.
**Diretorio do app:** `app/` (root do Next.js — build: `cd app && npm run build`)

**Design System:** Honey Gold dark-only. Primary #E6B447, BG #0D0B09.
**Tokens:** `app/src/styles/design-tokens.css`

**Situacao:** Tela de login/signup usa TechOrbitDisplay com 9 icones de DEV (HTML5, CSS3, TypeScript, JavaScript, TailwindCSS, Next.js, React, Figma, Git) carregados do CDN devicons. Esses icones nao representam o produto (marketing) e devem ser trocados por icones de marketing usando Lucide React (ja instalado).

---

## FERRAMENTAS OBRIGATORIAS

### shadcn MCP
- `search_items_in_registries` com queries: `input`, `button`, `form` — verificar componentes de form disponiveis
- `get_item_examples_from_registries` com query `form demo` — ver exemplos de auth forms
- `get_audit_checklist` — rodar apos mudancas

### Skills
- `/ui-components` — padroes de componentes React/Tailwind
- `/web-design-guidelines` — review de UI para compliance
- `/page-optimization` — otimizacao de formularios de conversao

### Referencias
- Design tokens: `app/src/styles/design-tokens.css`

---

## ARQUIVOS A MODIFICAR

1. `app/src/app/(auth)/login/page.tsx` (284 linhas)
2. `app/src/app/(auth)/signup/page.tsx` (299 linhas)
3. `app/src/components/ui/modern-animated-sign-in.tsx` (662 linhas)

---

## TAREFA 1: Trocar iconsArray — Dev Icons por Marketing Icons

### Arquivos: `login/page.tsx` (linhas 27-170) e `signup/page.tsx` (linhas 29-172)

### Estado atual:
9 icones carregados via `<img>` do CDN devicons:
- HTML5, CSS3, TypeScript, JavaScript, TailwindCSS, Next.js, React, Figma, Git
- Cada um tem: `icon` (JSX img tag), `radius`, `duration`, `delay`, `reverse`

### O que fazer:

**Substituir os 9 icones por icones de MARKETING usando Lucide React.**

Mapa de substituicao:

| # | Icon ATUAL | Icon NOVO (Lucide) | Radius | Reverse | Significado |
|---|-----------|-------------------|--------|---------|-------------|
| 1 | HTML5 | `Target` | 100 | false | Targeting/Ads |
| 2 | CSS3 | `BarChart3` | 100 | false | Analytics |
| 3 | TypeScript | `Megaphone` | 210 | false | Campaigns |
| 4 | JavaScript | `Users` | 210 | false | Audience |
| 5 | TailwindCSS | `TrendingUp` | 150 | true | Growth |
| 6 | Next.js | `Zap` | 150 | true | Automation |
| 7 | React | `PieChart` | 270 | true | Insights |
| 8 | Figma | `Mail` | 270 | true | Email Marketing |
| 9 | Git | `Rocket` | 320 | false | Launch |

### Implementacao:

**1. Adicionar imports no topo de login/page.tsx e signup/page.tsx:**
```typescript
import {
  Target, BarChart3, Megaphone, Users, TrendingUp,
  Zap, PieChart, Mail, Rocket
} from 'lucide-react';
```

**2. Substituir iconsArray por (IDENTICO em ambos os arquivos):**

```typescript
const iconsArray = [
  {
    icon: <Target className="size-[30px] text-[#E6B447]" />,
    radius: 100, duration: 20, delay: 20, reverse: false, path: false,
  },
  {
    icon: <BarChart3 className="size-[30px] text-[#AB8648]" />,
    radius: 100, duration: 20, delay: 10, reverse: false, path: false,
  },
  {
    icon: <Megaphone className="size-[50px] text-[#E6B447]" />,
    radius: 210, duration: 20, delay: 0, reverse: false, path: false,
  },
  {
    icon: <Users className="size-[50px] text-[#F0C35C]" />,
    radius: 210, duration: 20, delay: 20, reverse: false, path: false,
  },
  {
    icon: <TrendingUp className="size-[30px] text-[#E6B447]" />,
    radius: 150, duration: 20, delay: 20, reverse: true, path: false,
  },
  {
    icon: <Zap className="size-[30px] text-[#AB8648]" />,
    radius: 150, duration: 20, delay: 10, reverse: true, path: false,
  },
  {
    icon: <PieChart className="size-[50px] text-[#F0C35C]" />,
    radius: 270, duration: 20, delay: 0, reverse: true, path: false,
  },
  {
    icon: <Mail className="size-[50px] text-[#E6B447]" />,
    radius: 270, duration: 20, delay: 60, reverse: true, path: false,
  },
  {
    icon: <Rocket className="size-[30px] text-[#E6B447]" />,
    radius: 320, duration: 20, delay: 20, reverse: false, path: false,
  },
];
```

**Cores dos icones (3 tons gold):**
- `#E6B447` — Gold primario (maioria)
- `#AB8648` — Gold escuro (contraste)
- `#F0C35C` — Gold claro (highlight)

**3. Manter os mesmos `radius`, `duration`, `delay` e `reverse` para preservar as orbitas.**

---

## TAREFA 2: Orbit Display — Background Gold Glow

### Arquivo: `login/page.tsx` e `signup/page.tsx`

### Estado atual:
Lado esquerdo (linhas ~267-272 login, ~282-287 signup) tem `bg-zinc-950` e `Ripple` component.

### O que fazer:

**Adicionar gold radial glow no background do lado esquerdo:**

```tsx
<div className="relative hidden w-1/2 items-center justify-center overflow-hidden border-r border-white/[0.05] bg-zinc-950 md:flex">
  {/* Gold radial glow */}
  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(230,180,71,0.06)_0%,transparent_70%)]" />
  <Ripple mainCircleSize={100} />
  <TechOrbitDisplay iconsArray={iconsArray} text="MKTHONEY" />
</div>
```

### Tambem atualizar o background geral da pagina:

De `bg-zinc-950` para `bg-[#0D0B09]` (design token surface-0) em ambos os lados:
```tsx
{/* Left */}
<div className="... bg-[#0D0B09] ...">
{/* Right */}
<div className="... bg-[#0D0B09] ...">
```

---

## TAREFA 3: Orbit Path Stroke — Gold Sutil

### Arquivo: `app/src/components/ui/modern-animated-sign-in.tsx`

### Estado atual (OrbitingCircles, linha ~246):
```typescript
stroke-black/10 dark:stroke-white/10
```

### O que fazer:
Trocar o stroke dos orbit paths para gold sutil:
```typescript
stroke-[#E6B447]/[0.06]
```

Isso faz as orbitas terem um tom dourado muito sutil em vez de branco/preto.

---

## TAREFA 4: Orbit Icon Container — Gold Border

### Arquivo: `modern-animated-sign-in.tsx`

### Estado atual (OrbitingCircles, linha ~263):
```typescript
bg-black/10 dark:bg-white/10
```

### O que fazer:
Trocar o background dos containers de icone para gold sutil:
```typescript
bg-[#E6B447]/[0.06] border border-[#E6B447]/[0.08]
```

---

## TAREFA 5: Submit Button — Gold Gradient

### Arquivo: `modern-animated-sign-in.tsx`

### Estado atual (AnimatedForm, linhas ~549-552):
```typescript
from-zinc-900 dark:from-zinc-900 to-zinc-200 dark:to-zinc-200
```
O botao de submit usa gradiente zinc (cinza).

### O que fazer:
Trocar para gold gradient:
```typescript
from-[#E6B447] to-[#AB8648] text-[#0D0B09] font-semibold
```

**Tambem adicionar hover effect:**
```typescript
hover:from-[#F0C35C] hover:to-[#E6B447] transition-all duration-200
```

---

## TAREFA 6: Google Button — Gold Border

### Arquivo: `modern-animated-sign-in.tsx`

### Estado atual (linha ~428):
```typescript
border-white/[0.06] bg-white/[0.02]
```

### O que fazer:
Adicionar gold border sutil on hover:
```typescript
border-white/[0.06] bg-white/[0.02] hover:border-[#E6B447]/20 transition-colors
```

---

## TAREFA 7: "or" Divider — Traducao

### Arquivo: `modern-animated-sign-in.tsx`

### Estado atual (linha ~453):
```typescript
'or'
```

### O que fazer:
Trocar para:
```typescript
'ou'
```

### Tambem verificar na AuthTabs (linha ~624):
Se `Login with Google` aparece como default, trocar para `Entrar com Google`.

---

## TAREFA 8: Signup Placeholder Fix

### Arquivo: `signup/page.tsx`

### Estado atual (linha ~271):
```typescript
placeholder: 'Min 8 chars, 1 maiuscula, 1 numero'
```

### O que fazer:
```typescript
placeholder: 'Min. 8 caracteres, 1 maiuscula, 1 numero'
```

---

## O QUE NAO FAZER

1. **NAO alterar** logica de Firebase Auth (login, signup, password reset)
2. **NAO alterar** Firestore user creation no signup
3. **NAO alterar** validacao de password strength
4. **NAO alterar** routing logic (handleGoToSignup, handleGoToLogin)
5. **NAO remover** Framer Motion animations (orbits, inputs, box reveal)
6. **NAO instalar** dependencias (Lucide React ja esta instalado)
7. **NAO alterar** Input component radial gradient (ja usa gold rgba(230,180,71,0.4))
8. **NAO alterar** o componente Ripple

---

## VERIFICACAO

```bash
# 1. Zero refs a devicons CDN
cd app && grep -rn "devicons" src/ --include="*.tsx" --include="*.ts"
# Deve retornar ZERO resultados

# 2. Zero refs a icones antigos no iconsArray
cd app && grep -rn "html5\|css3\|typescript.*icon\|javascript.*icon\|tailwindcss.*icon\|nextjs.*icon\|react.*icon\|figma.*icon\|git.*icon" src/app/\(auth\)/ --include="*.tsx" -i
# Deve retornar ZERO resultados

# 3. Build passa
cd app && npm run build
```

### Criterios de aceitacao E2:
- [ ] 9 icones de marketing Lucide no orbit display (Target, BarChart3, etc.)
- [ ] Icones usam 3 tons de gold (#E6B447, #AB8648, #F0C35C)
- [ ] Gold radial glow no background do lado esquerdo
- [ ] Orbit paths e containers com gold sutil
- [ ] Submit button com gold gradient
- [ ] "or" traduzido para "ou"
- [ ] "Login with Google" traduzido para "Entrar com Google" (se aplicavel)
- [ ] Signup placeholder corrigido para "caracteres"
- [ ] Background geral usa #0D0B09 (nao zinc-950)
- [ ] Build: `cd app && npm run build` passa

---

## COMMIT

```
feat(E2): replace dev icons with marketing icons in login/signup orbit display

- Swap 9 devicon CDN images for Lucide marketing icons (Target, BarChart3, etc.)
- Apply 3-tone gold palette to orbit icons (#E6B447, #AB8648, #F0C35C)
- Add gold radial glow to left panel background
- Gold gradient on submit button, gold-tinted orbit paths
- Translate "or" → "ou", fix signup placeholder
- Background aligned to design token #0D0B09

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```
