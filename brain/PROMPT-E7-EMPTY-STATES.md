# PROMPT — E7: Empty States Padronizados

> Cole este prompt inteiro no agente que vai executar a tarefa.

---

## CONTEXTO

**Produto:** MKTHONEY — SaaS de marketing autônomo com IA.
**Stack:** Next.js 16.1.1, React 19, TypeScript, Firebase, Gemini AI.
**Diretório do app:** `app/` (root do Next.js — build: `cd app && npm run build`)

**Design System:** Honey Gold dark-only.
- Tokens: `app/src/styles/design-tokens.css`
- Primary: #E6B447, BG: #0D0B09, Surface-1: #1A1612, Text: #F5E8CE

**Situação:**
- Componente base `GuidedEmptyState` já existe (`app/src/components/ui/guided-empty-state.tsx`, 76 linhas)
- Algumas páginas usam o GuidedEmptyState, outras têm empty states inline customizados
- Brands page tem gradiente blue residual (inconsistente com design system)
- Objetivo: padronizar empty states em TODAS as features

---

## FERRAMENTAS OBRIGATÓRIAS

### shadcn MCP
- `search_items_in_registries` query: `card`, `button`
- `get_audit_checklist` — rodar após mudanças

### Skills
- `/ui-components` — padrões de componentes
- `/react-patterns` — composição, props
- `/web-design-guidelines` — review de UI

---

## TAREFA 1: Auditar GuidedEmptyState Base

### Arquivo: `app/src/components/ui/guided-empty-state.tsx` (76 linhas)

### Estado atual:
```typescript
interface GuidedEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  tips?: string[];
  secondaryAction?: { label: string; href: string };
}
```

### Verificar que:
- [ ] Ícone: `h-16 w-16 rounded-2xl bg-[#E6B447]/10` com ícone `text-[#E6B447]`
- [ ] Título: `text-xl font-semibold text-white`
- [ ] Descrição: `text-zinc-400 text-sm max-w-md`
- [ ] Tips bullets: `text-[#E6B447]` markers
- [ ] CTA primary: `bg-[#AB8648] hover:bg-[#895F29] text-white`
- [ ] Secondary: outline style
- [ ] Framer Motion: fade-in + y-translate

### Ajustar se necessário:
- CTA primary deveria ser `bg-[#E6B447] text-[#0D0B09] hover:bg-[#F0C35C]` (gold solid, texto escuro) — mais visível e consistente com CTAs do resto do app
- Se atualmente usa `#AB8648` (marrom escuro), trocar para gold primary

---

## TAREFA 2: Buscar TODOS os Empty States

### Executar busca:
```bash
cd app && grep -rn "nenhum\|vazio\|empty\|no results\|ainda não\|Empty" src/ --include="*.tsx" -i | grep -v node_modules | grep -v ".next"
```

### Verificar tambem imports do GuidedEmptyState:
```bash
cd app && grep -rn "GuidedEmptyState\|guided-empty-state" src/ --include="*.tsx"
```

### Páginas conhecidas com empty state:

| Página | Arquivo | Status | Ação |
|--------|---------|--------|------|
| Brands | `app/src/app/brands/page.tsx` (~linhas 74-101) | Inline customizado, gradiente blue | MIGRAR para GuidedEmptyState |
| Library | `app/src/app/library/page.tsx` (~linhas 135-160) | Inline customizado | MIGRAR para GuidedEmptyState |
| Chat | `app/src/components/chat/chat-empty-state.tsx` (248 linhas) | Customizado por mode | MANTER (muito específico) |
| Funnels | Verificar `app/src/app/funnels/page.tsx` | Pode ter empty state | AUDITAR |
| Social | Verificar `app/src/app/social/page.tsx` | Pode ter empty state | AUDITAR |
| Calendar | Verificar `app/src/app/calendar/page.tsx` | Pode ter empty state | AUDITAR |
| Assets | Verificar `app/src/app/assets/page.tsx` | Pode ter empty state | AUDITAR |
| Campaigns | Verificar `app/src/app/campaigns/page.tsx` | Pode ter empty state | AUDITAR |
| Intelligence | Verificar `app/src/app/intelligence/page.tsx` | Pode ter empty state | AUDITAR |
| Vault | Verificar `app/src/app/vault/page.tsx` | Pode ter empty state | AUDITAR |

---

## TAREFA 3: Migrar Brands Empty State

### Arquivo: `app/src/app/brands/page.tsx`

### Estado atual (~linhas 74-101):
- Gradiente `from-[#E6B447] to-blue-600` no ícone (inconsistente — blue residual)
- H2: "Nenhuma marca criada ainda"
- Desc: "Crie sua primeira marca para contextualizar..."
- CTA: "Criar Primeira Marca" com ícone Sparkles

### O que fazer:

**Substituir o empty state inline por GuidedEmptyState:**

```tsx
import { GuidedEmptyState } from '@/components/ui/guided-empty-state';
import { Sparkles } from 'lucide-react';

// No render, onde era o bloco inline:
<GuidedEmptyState
  icon={Sparkles}
  title="Nenhuma marca criada ainda"
  description="Crie sua primeira marca para que o MKTHONEY possa personalizar estratégias, conteúdo e funis para o seu negócio."
  ctaLabel="Criar Primeira Marca"
  ctaHref="/brands/new"
  tips={[
    'O setup leva menos de 3 minutos',
    'Você pode configurar até 5 marcas no plano Starter',
    'Cada marca tem conselheiros personalizados',
  ]}
/>
```

**NOTA:** Se E3 mudou o fluxo de "Criar marca" para abrir modal ao invés de navegar para /brands/new, ajustar o CTA:
- Trocar `ctaHref` por `onClick` callback
- Pode ser necessário adicionar `onCtaClick?: () => void` ao GuidedEmptyState interface

---

## TAREFA 4: Migrar Library Empty State

### Arquivo: `app/src/app/library/page.tsx`

### Estado atual (~linhas 135-160):
- Ícone FolderOpen em bg-zinc-800/50 (sem gold)
- H2: "Biblioteca Vazia"
- CTA: "Criar Primeiro Funil" com btn-accent

### O que fazer:

```tsx
<GuidedEmptyState
  icon={FolderOpen}
  title="Biblioteca vazia"
  description="Você ainda não salvou nenhum template. Crie um funil e salve como template para reutilizar."
  ctaLabel="Criar Primeiro Funil"
  ctaHref="/funnels/new"
  tips={[
    'Templates salvam estrutura, copy e design',
    'Funis aprovados podem virar templates com 1 clique',
  ]}
/>
```

---

## TAREFA 5: Auditar e Migrar Restantes

### Para CADA página listada na Tarefa 2:

**1. Ler o arquivo**
**2. Verificar se tem empty state (quando lista está vazia)**
**3. Se tem empty state inline → MIGRAR para GuidedEmptyState**
**4. Se NÃO tem empty state → ADICIONAR GuidedEmptyState**

### Guia de copy e ícones por feature:

| Feature | Ícone (Lucide) | Título | Descrição | CTA Label | CTA Href |
|---------|----------------|--------|-----------|-----------|----------|
| Funnels | `GitBranch` | "Nenhum funil criado" | "Crie seu primeiro funil de vendas..." | "Criar Primeiro Funil" | `/funnels/new` |
| Social | `Share2` | "Nenhum post agendado" | "Gere conteúdo e agende publicações..." | "Gerar Conteúdo" | `/social/new` (ou modal) |
| Calendar | `CalendarDays` | "Calendário vazio" | "Seu calendário editorial está vazio..." | "Planejar Conteúdo" | `/calendar` (ou modal) |
| Assets | `FileImage` | "Nenhum asset enviado" | "Envie PDFs, imagens e documentos..." | "Enviar Assets" | `/assets` (ou modal) |
| Campaigns | `Megaphone` | "Nenhuma campanha ativa" | "Crie campanhas para organizar..." | "Criar Campanha" | `/campaigns/new` |
| Intelligence | `Brain` | "Sem análises ainda" | "O módulo de inteligência analisa..." | "Iniciar Análise" | `/intelligence` |
| Vault | `Lock` | "Vault vazio" | "O vault armazena documentos estratégicos..." | "Adicionar ao Vault" | `/vault` (ou modal) |

### Regras:
- Verificar se a página usa tier lock (R4.1). Se a feature está locked, NÃO mostrar empty state — a tela de "Coming Soon" / lock já aparece
- Se a página não existir (404), ignorar
- Tips são OPCIONAIS — adicionar 2-3 dicas relevantes por feature se fizer sentido
- Copy SEMPRE em PT-BR, direto, sem floreios

---

## TAREFA 6: GuidedEmptyState — Melhorias (se necessário)

### Se durante a migração precisar de:

**1. onClick callback (ao invés de href):**
Adicionar prop opcional:
```typescript
interface GuidedEmptyStateProps {
  // ... existentes ...
  onCtaClick?: () => void; // NOVO — alternativa ao ctaHref
}
```
E no render:
```tsx
{onCtaClick ? (
  <button onClick={onCtaClick} className="...">
    {ctaLabel}
  </button>
) : (
  <Link href={ctaHref} className="...">
    {ctaLabel}
  </Link>
)}
```

**2. Variante compacta (para sidebars/painéis pequenos):**
Se alguma página precisar de empty state menor (em panel lateral), adicionar prop:
```typescript
compact?: boolean; // ícone menor, sem tips, padding reduzido
```

**SOMENTE adicionar essas melhorias se NECESSÁRIO. Não over-engineer.**

---

## O QUE NÃO FAZER

1. **NÃO alterar** ChatEmptyState — é customizado por mode e está correto
2. **NÃO alterar** lógica de loading/fetching — só o visual do estado vazio
3. **NÃO alterar** tier system / lock screens
4. **NÃO criar** novos componentes além de melhorias ao GuidedEmptyState existente
5. **NÃO adicionar** ilustrações ou imagens — usar Lucide icons (48px com gold bg)
6. **NÃO alterar** lógica de criação (ex: useBrands, useFunnels)

---

## VERIFICAÇÃO

```bash
# 1. Nenhum gradiente blue residual em empty states
cd app && grep -rn "to-blue-600\|from-blue" src/app/brands/ src/app/library/ --include="*.tsx"
# Deve retornar ZERO (ou só em contextos não-empty-state)

# 2. GuidedEmptyState importado em todas as páginas migradas
cd app && grep -rn "GuidedEmptyState" src/ --include="*.tsx"
# Deve ter resultado para cada página migrada

# 3. Consistência visual — todos usam gold icon bg
cd app && grep -rn "bg-\[#E6B447\]/10" src/components/ui/guided-empty-state.tsx
# Deve ter resultado

# 4. Build passa
cd app && npm run build
```

### Critérios de aceitação E7:
- [ ] GuidedEmptyState usa gold CTA consistente
- [ ] Brands page: empty state via GuidedEmptyState (sem gradiente blue)
- [ ] Library page: empty state via GuidedEmptyState
- [ ] Pelo menos 3 features adicionais auditadas/migradas
- [ ] ChatEmptyState NÃO foi alterado
- [ ] Empty states consistentes: gold icon, título branco, desc zinc, CTA gold
- [ ] Build: `cd app && npm run build` passa

---

## COMMIT

```
feat(E7): standardize empty states across all features with GuidedEmptyState

- Fix brands empty state (remove blue gradient, use GuidedEmptyState)
- Migrate library empty state to GuidedEmptyState
- Audit and add empty states for funnels, social, calendar, assets, vault
- Consistent pattern: gold icon, white title, zinc description, gold CTA
- Optional onCtaClick prop for modal-triggered actions

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```
