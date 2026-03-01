# MKT Honey - Projeto Frontend

## Stack
- React 19 + Vite 7
- Tailwind CSS v4
- shadcn/ui (estilo: new-york, sem TypeScript)
- Framer Motion + GSAP para animações
- Lucide React para ícones

## Estrutura de Aliases
- `@/components` - Componentes
- `@/components/ui` - Componentes shadcn/ui
- `@/lib` - Utilitários
- `@/hooks` - Hooks customizados

## shadcn/ui

### Adicionar componentes
```bash
pnpm dlx shadcn@latest add [componente]
```

### Componentes disponíveis
button, card, input, label, dialog, dropdown-menu, select, checkbox, radio-group, switch, tabs, accordion, alert, avatar, badge, calendar, carousel, collapsible, command, context-menu, drawer, form, hover-card, menubar, navigation-menu, pagination, popover, progress, scroll-area, separator, sheet, skeleton, slider, sonner, table, textarea, toast, toggle, tooltip

### Exemplo de uso
```jsx
import { Button } from "@/components/ui/button"

<Button variant="default">Click me</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
```

## Comandos
- `pnpm dev` - Servidor de desenvolvimento
- `pnpm build` - Build de produção
- `pnpm lint` - Executar ESLint

## Convenções
- Usar JavaScript (não TypeScript)
- Componentes em PascalCase
- Arquivos em kebab-case
- CSS via Tailwind (classes utilitárias)
- Variáveis CSS para cores (definidas em src/index.css)
