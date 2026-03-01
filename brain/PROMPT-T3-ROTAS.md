# PROMPT — T3: Reestruturar Rotas (Landing na `/`, Dashboard autenticado)

> Cole este prompt inteiro no agente que vai executar a tarefa.

---

## CONTEXTO

**Produto:** MKTHONEY — SaaS de marketing autônomo com IA.
**Stack:** Next.js 16.1.1, React 19, TypeScript, Tailwind CSS v4, Firebase Auth.
**Diretório do app:** `app/` (root do Next.js — build: `cd app && npm run build`)
**Auth:** Firebase Auth, cookie `mkthoney_auth` para middleware, client-side check no AppShell.

---

## PROBLEMA ATUAL

```
Visitante não-autenticado em "/" → redireciona para "/landing" (URL feia, SEO ruim)
Visitante autenticado em "/"    → vê o dashboard direto
Landing page está em:            app/src/app/landing/page.tsx (rota /landing)
Dashboard está em:               app/src/app/page.tsx (rota /)
```

A landing page declara `canonical: 'https://mkthoney.com'` mas mora em `/landing`. Isso é ruim para SEO e experiência do usuário.

---

## OBJETIVO

```
Visitante não-autenticado em "/" → vê a landing page DIRETAMENTE (sem redirect)
Visitante autenticado em "/"    → vê o dashboard DIRETAMENTE (sem redirect)
"/landing"                      → redireciona para "/" (backwards compat)
```

---

## ABORDAGEM: MIDDLEWARE + REWRITE (não redirect)

A abordagem mais segura é usar `NextResponse.rewrite()` em vez de mover 40+ pastas para dentro de `(app)/`. Isso evita quebrar imports, links internos e referências.

### O que muda:

1. **Mover** `app/src/app/landing/page.tsx` → `app/src/app/(public)/landing/page.tsx`
2. **Criar** `app/src/app/(public)/landing/layout.tsx` (layout limpo sem sidebar)
3. **Atualizar** middleware para rewrite `/` → `/landing` para não-autenticados (sem redirect visível)
4. **Atualizar** AppShell para tratar `/` como landing quando não-autenticado
5. **Redirect** `/landing` → `/` para backwards compatibility

---

## ARQUIVOS A MODIFICAR

### 1. Middleware: `app/src/middleware.ts`

**Conteúdo atual:**
```ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_ROUTES = [
  '/login',
  '/signup',
  '/terms',
  '/privacy',
  '/cookies',
  '/refund',
  '/pricing',
  '/landing',
  '/shared',
];

const SKIP_ROUTES = [
  '/api/',
  '/_next/',
  '/favicon.ico',
  '/images/',
  '/fonts/',
  '/og-image.png',
  '/robots.txt',
  '/sitemap.xml',
];

const AUTH_COOKIE = 'mkthoney_auth';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (SKIP_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  const isPublicRoute = PUBLIC_ROUTES.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  const hasAuthCookie = request.cookies.has(AUTH_COOKIE);

  if (pathname === '/') {
    if (!hasAuthCookie) {
      const landingUrl = new URL('/landing', request.url);
      return NextResponse.redirect(landingUrl);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

**Substituir por:**
```ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_ROUTES = [
  '/login',
  '/signup',
  '/terms',
  '/privacy',
  '/cookies',
  '/refund',
  '/pricing',
  '/shared',
];

const SKIP_ROUTES = [
  '/api/',
  '/_next/',
  '/favicon.ico',
  '/images/',
  '/fonts/',
  '/og-image.png',
  '/robots.txt',
  '/sitemap.xml',
];

const AUTH_COOKIE = 'mkthoney_auth';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static/API routes
  if (SKIP_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  const hasAuthCookie = request.cookies.has(AUTH_COOKIE);

  // "/" → rewrite to landing (non-auth) or pass through to dashboard (auth)
  if (pathname === '/') {
    if (!hasAuthCookie) {
      // REWRITE (not redirect) — user sees "/" in URL bar, content is from /landing
      return NextResponse.rewrite(new URL('/landing', request.url));
    }
    return NextResponse.next();
  }

  // "/landing" → redirect to "/" for backwards compat and SEO canonical
  if (pathname === '/landing') {
    return NextResponse.redirect(new URL('/', request.url), 301);
  }

  // Public routes pass through
  const isPublicRoute = PUBLIC_ROUTES.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // All other routes: let AppShell handle client-side auth
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

**Mudanças chave:**
- Removeu `/landing` de `PUBLIC_ROUTES` (não é mais uma rota pública direta)
- `/` sem auth → `NextResponse.rewrite()` para `/landing` (URL fica `/`, conteúdo é da landing)
- `/landing` direto → redirect 301 para `/` (SEO canonical)
- `/` com auth → passa para `page.tsx` (dashboard) normalmente

### 2. AppShell: `app/src/components/layout/app-shell.tsx`

O AppShell tem uma lista `PUBLIC_PATHS` que precisa ser atualizada:

**Encontrar:**
```ts
const PUBLIC_PATHS = ['/login', '/signup', '/landing', '/terms', '/privacy', '/cookies', '/refund', '/pricing', '/shared'];
```
(ou similar — pode ser array inline ou constante)

**Substituir por:**
```ts
const PUBLIC_PATHS = ['/login', '/signup', '/terms', '/privacy', '/cookies', '/refund', '/pricing', '/shared'];
```

**Remover `/landing` da lista** — o middleware já cuida do rewrite. O AppShell não precisa saber sobre `/landing` como rota pública porque:
- Quando o user não-autenticado acessa `/`, o middleware faz rewrite para `/landing`
- O AppShell vê a rota como `/` (não `/landing`) porque o rewrite é server-side
- O AppShell NÃO deve redirecionar para `/login` quando a rota é `/` e não há auth — o middleware já tratou isso

**IMPORTANTE — Adicionar exceção para `/` no AppShell:**

Encontrar a lógica que redireciona para `/login` quando não há user autenticado. Deve haver algo como:
```ts
if (!user && !isPublicRoute) {
  router.push('/login');
}
```

**Adicionar `/` como exceção:**
```ts
// "/" is handled by middleware (rewrite to landing for non-auth)
const isRootPath = pathname === '/';
if (!user && !isPublicRoute && !isRootPath) {
  router.push('/login');
}
```

**Motivo:** O middleware já faz o rewrite de `/` para a landing page. Se o AppShell tentasse redirecionar para `/login`, haveria um conflito — o user veria um flash de redirect. Ao excepcionar `/`, o AppShell permite que o middleware controle essa rota.

### 3. Landing page: `app/src/app/landing/page.tsx`

**NÃO mover o arquivo.** Ele fica em `app/src/app/landing/page.tsx` (rota interna `/landing`).

O middleware faz o rewrite de `/` → `/landing`, então o conteúdo é servido corretamente.

**Atualizar o metadata/canonical** na landing page:

Encontrar:
```ts
canonical: 'https://mkthoney.com/landing'
```
ou qualquer referência a `/landing` no metadata.

**Substituir por:**
```ts
canonical: 'https://mkthoney.com'
```
(se já está assim, não precisa mudar)

**Verificar também:** Se há algum `<Link href="/landing">` dentro da landing page (links internos de navbar etc.), trocar para `<Link href="/">`.

### 4. Links internos em toda a app

Buscar TODAS as referências a `/landing` no codebase e trocar para `/`:

```bash
cd app && grep -rn '"/landing"' src/ --include="*.tsx" --include="*.ts" | grep -v node_modules | grep -v ".next"
cd app && grep -rn "'/landing'" src/ --include="*.tsx" --include="*.ts" | grep -v node_modules | grep -v ".next"
cd app && grep -rn '/landing' src/ --include="*.tsx" --include="*.ts" | grep -v node_modules | grep -v ".next" | grep -v "import"
```

Substituir:
- `href="/landing"` → `href="/"`
- `push('/landing')` → `push('/')`
- `redirect('/landing')` → `redirect('/')`
- Qualquer outra referência de navegação para `/landing`

**EXCEÇÃO:** NÃO trocar imports de componentes (ex: `import LandingHero from '@/components/landing/...'`). Só trocar URLS de navegação.

### 5. Landing components — verificar links de CTA

Nos componentes da landing (`app/src/components/landing/`), verificar se os CTAs de "Criar Conta" / "Começar" / "Iniciar" apontam para `/signup` ou `/login` (correto) e não para `/landing` (incorreto).

---

## O QUE NÃO FAZER

1. **NÃO mover** as 40+ pastas de rotas autenticadas para dentro de `(app)/` — é muito arriscado e desnecessário
2. **NÃO alterar** a estrutura de `(auth)/`, `(public)/`, ou `(agency)/` — elas estão corretas
3. **NÃO mexer** na lógica de Firebase Auth — só na lógica de roteamento
4. **NÃO alterar** o layout.tsx raiz
5. **NÃO alterar** lógica de negócio, RAG, credits ou persistência
6. **NÃO instalar** dependências

---

## VERIFICAÇÃO

### Testes manuais (após build):

1. **Sem auth cookie:**
   - Acessar `/` → deve ver a landing page (URL permanece `/`)
   - Acessar `/landing` → deve redirecionar 301 para `/`
   - Acessar `/login` → deve ver tela de login normalmente
   - Acessar `/chat` → deve ser redirecionado para `/login` pelo AppShell

2. **Com auth cookie:**
   - Acessar `/` → deve ver o dashboard
   - Acessar `/landing` → deve redirecionar 301 para `/`
   - Acessar `/chat` → deve ver o chat normalmente

### Verificação automática:

```bash
cd app && npm run build
# Verificar que zero referências a href="/landing" restam:
grep -rn '"/landing"' src/ --include="*.tsx" --include="*.ts" | grep -v node_modules | grep -v ".next" | grep -v "import" | grep -v "rewrite" | grep -v "redirect"
# Deve retornar ZERO (exceto no middleware que faz rewrite/redirect)
```

### Checklist de aceitação T3:
- [ ] `/` sem auth → landing page (sem redirect visível, URL permanece `/`)
- [ ] `/` com auth → dashboard
- [ ] `/landing` → redirect 301 para `/`
- [ ] Todos os links internos atualizados de `/landing` → `/`
- [ ] AppShell não faz redirect para `/login` quando rota é `/` sem auth
- [ ] Todas as rotas autenticadas continuam funcionando
- [ ] CTAs da landing ("Criar Conta", "Entrar") apontam para `/signup` e `/login`
- [ ] Build passa: `cd app && npm run build`

---

## COMMIT

```
feat: serve landing page at root "/" via middleware rewrite

- Middleware rewrites "/" to "/landing" for unauthenticated users (no visible redirect)
- "/landing" now 301 redirects to "/" for SEO canonical
- Updated AppShell to exempt "/" from auth redirect
- Updated all internal links from "/landing" to "/"

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```
