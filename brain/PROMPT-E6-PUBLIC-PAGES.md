# PROMPT — E6: Páginas Públicas e Legais — Design System

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
As 4 páginas legais (terms, privacy, cookies, refund) já existem no route group `(public)` com layout compartilhado. O layout já usa Honey Gold (logo gold, bg #0D0B09, links gold). As páginas já estão estilizadas com cards zinc-900/50, links gold, e highlight boxes gold/10.

**Esta tarefa foca em:**
1. Verificar e padronizar styling entre as 4 páginas legais
2. Criar página `/pricing` standalone (separada da landing)
3. Garantir consistência visual com o design system

---

## FERRAMENTAS OBRIGATÓRIAS

### shadcn MCP
- `search_items_in_registries` query: `table`, `badge`
- `get_audit_checklist` — rodar após mudanças

### Skills
- `/ui-components` — padrões de componentes
- `/web-design-guidelines` — review de UI

---

## ARQUIVOS A VERIFICAR/MODIFICAR

### Já existem:
1. `app/src/app/(public)/layout.tsx` (72 linhas — layout compartilhado)
2. `app/src/app/(public)/terms/page.tsx` (214 linhas)
3. `app/src/app/(public)/privacy/page.tsx` (297 linhas)
4. `app/src/app/(public)/cookies/page.tsx` (256 linhas)
5. `app/src/app/(public)/refund/page.tsx` (211 linhas)

### Criar:
6. `app/src/app/(public)/pricing/page.tsx` (NOVO — pricing standalone)

---

## TAREFA 1: Auditoria Visual das 4 Páginas Legais

### Ler cada página e verificar:

**Checklist por página:**
- [ ] Background: `bg-[#0D0B09]` (herdado do layout)
- [ ] Header com data de atualização: `text-sm text-zinc-500`
- [ ] Título H1: `text-3xl font-bold text-white`
- [ ] Seções card: `p-4 rounded-xl bg-zinc-900/50 border border-white/[0.06]`
- [ ] Subtítulos H2: `text-xl font-semibold text-white`
- [ ] Texto corpo: `text-zinc-300 text-sm leading-relaxed`
- [ ] Links internos: `text-[#E6B447] hover:text-[#F0C35C] underline`
- [ ] Highlight boxes: `bg-[#E6B447]/10 border border-[#E6B447]/20`
- [ ] Tabelas: `text-sm` com headers `text-zinc-300` e borders `border-white/[0.1]`
- [ ] Email de contato: support@mkthoney.com
- [ ] Empresa: LEVIARK INTERMEDIACOES LTDA

### Se alguma página divergir do padrão, CORRIGIR para alinhar com as outras.

### Padrões específicos por página:

**Cookies (cookies/page.tsx):**
- Essential cookies: azul `bg-blue-500/5 border-blue-500/20`
- Analytics cookies: gold `bg-[#E6B447]/5 border-[#E6B447]/20`
- Marketing cookies: purple `bg-purple-500/5 border-purple-500/20`
→ MANTER estas cores diferenciadas (correto)

**Refund (refund/page.tsx):**
- Steps numerados: `bg-[#E6B447]/10 text-[#E6B447]` circles
- Formula box: `font-mono text-sm`
→ MANTER (correto)

---

## TAREFA 2: Layout Público — Verificar Consistência

### Arquivo: `app/src/app/(public)/layout.tsx`

### Verificar que:
- [ ] Header sticky com logo MKTHONEY (`bg-[#1A1612]/80 backdrop-blur-sm`)
- [ ] Logo: `<Image src="/logo-mkthoney-icon.svg" />` ou fallback "M" icon com gold
- [ ] Link "Voltar" ou "← Início" → `/landing` ou `/`
- [ ] Footer com links para as 4 páginas legais
- [ ] Container: `max-w-4xl mx-auto` para conteúdo centralizado

### Se o logo SVG já foi copiado em E1, usar:
```tsx
<Image src="/logo-mkthoney-icon.svg" alt="MKTHONEY" width={28} height={28} />
```

### Se NÃO foi copiado, manter o "M" icon existente.

---

## TAREFA 3: Pricing Standalone

### Arquivo: `app/src/app/(public)/pricing/page.tsx` (NOVO)

### Por que criar:
- Links diretos para `/pricing` (da sidebar, emails, etc.)
- Separado da landing para carregamento mais rápido
- Acessível sem auth

### Estrutura:

```tsx
import { Metadata } from 'next';
import { Check } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Preços | MKTHONEY',
  description: 'Planos MKTHONEY: Starter R$97, Pro R$297, Agency R$597. 14 dias grátis.',
};

// Mesmo conteúdo de pricing da landing, mas com:
// - Header público (herdado do layout)
// - Seção FAQ reduzida (3-4 perguntas sobre pricing)
// - CTA para signup
// - Link para termos de uso e política de reembolso
```

### Tiers (IDENTICOS à landing):

```typescript
const tiers = [
  {
    name: 'Starter',
    price: 97,
    description: 'Para quem está começando no marketing autônomo.',
    features: [
      '5 marcas',
      '50 gerações/mês',
      '8 conselheiros básicos',
      'Templates padrão',
      'Email support',
    ],
    cta: 'Começar com Starter',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: 297,
    description: 'Para profissionais que querem o arsenal completo.',
    features: [
      '15 marcas',
      '200 gerações/mês',
      'Todos os 23 conselheiros',
      'Templates premium',
      'Spy Agent',
      'Priority support',
    ],
    cta: 'Escalar com Pro',
    highlighted: true,
    badge: 'Popular',
  },
  {
    name: 'Agency',
    price: 597,
    description: 'Para agências e operações de escala.',
    features: [
      'Marcas ilimitadas',
      'Gerações ilimitadas',
      'Todos os 23 conselheiros',
      'White-label reports',
      'API access',
      'Dedicated support',
    ],
    cta: 'Dominar com Agency',
    highlighted: false,
  },
];
```

### Styling:
- Grid 3 colunas (stack mobile)
- Pro destacado: `border-[#E6B447] ring-1 ring-[#E6B447]/20` + badge gold
- Preço: `text-4xl font-bold text-white` + `/mês` pequeno
- Features: check gold `text-[#E6B447]` + texto `text-zinc-300`
- CTA Pro: `bg-[#E6B447] text-[#0D0B09] font-semibold`
- CTA outros: `border border-white/[0.1] text-white hover:bg-white/[0.03]`
- Todos CTAs linkar para `/signup`

### Adicionar ao final:
```tsx
<div className="mt-12 text-center text-sm text-zinc-500">
  <p>14 dias grátis com acesso Pro. Sem cartão de crédito.</p>
  <p className="mt-2">
    Veja nossa{' '}
    <Link href="/refund" className="text-[#E6B447] hover:text-[#F0C35C]">
      política de reembolso
    </Link>{' '}
    e{' '}
    <Link href="/terms" className="text-[#E6B447] hover:text-[#F0C35C]">
      termos de uso
    </Link>
    .
  </p>
</div>
```

---

## O QUE NÃO FAZER

1. **NÃO alterar** conteúdo jurídico das páginas legais (textos aprovados por advogado)
2. **NÃO alterar** CNPJ, razão social, ou endereço
3. **NÃO remover** Cookie Banner functionality
4. **NÃO alterar** middleware routing
5. **NÃO criar** novas páginas além de /pricing

---

## VERIFICAÇÃO

```bash
# 1. Pricing page existe
ls app/src/app/\(public\)/pricing/page.tsx

# 2. Todas as páginas usam o mesmo layout
cd app && grep -rn "layout.tsx" src/app/\(public\)/ --include="*.tsx"

# 3. Zero inconsistências de cor
cd app && grep -rn "emerald\|green-" src/app/\(public\)/ --include="*.tsx"
# Deve retornar ZERO

# 4. Build passa
cd app && npm run build
```

### Critérios de aceitação E6:
- [ ] 4 páginas legais com styling consistente (audit visual)
- [ ] Layout público com logo MKTHONEY
- [ ] `/pricing` standalone criada com 3 tiers
- [ ] Pro tier destacado com gold border e badge "Popular"
- [ ] Links legais no footer do pricing
- [ ] Zero inconsistências visuais entre páginas
- [ ] Build: `cd app && npm run build` passa

---

## COMMIT

```
feat(E6): add standalone pricing page, audit legal page styling consistency

- Create /pricing standalone page with 3 tiers (R$97, R$297, R$597)
- Audit and standardize styling across terms, privacy, cookies, refund pages
- Verify public layout uses MKTHONEY logo and design tokens
- Links to legal pages from pricing footer

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```
