# PROMPT: Monitoring Nativo — Next.js Instrumentation + Vercel Observability

> **Branch:** `fix/native-monitoring` (criar a partir do master)
> **Contexto:** Sem Sentry, sem libs externas pesadas. Usar o que Next.js 16 e Vercel já oferecem nativamente. PostHog já está instalado para analytics. Health check endpoint já existe.
> **Regra:** NÃO alterar visual/UI, lógica de negócio, RAG, credits, ou persistência. Apenas infraestrutura de observabilidade.

---

## O QUE JÁ EXISTE (NÃO RECRIAR)

| Item | Arquivo | Status |
|------|---------|--------|
| PostHog analytics | `app/src/components/providers/posthog-provider.tsx` | ✅ Funciona (LGPD-compliant) |
| Health check endpoint | `app/src/app/api/health/route.ts` | ✅ Firebase + Gemini + Pinecone |
| Error boundary (client React) | `app/src/components/shared/error-boundary.tsx` | ✅ Funciona |
| Structured logger | `app/src/lib/utils/logger.ts` | ✅ Existe mas NÃO é usado |
| Slack alert helpers | `app/src/lib/utils/slack-alert.ts` | ✅ Existe mas NÃO é wired |
| API response standard | `app/src/lib/utils/api-response.ts` | ✅ Funciona |
| Security headers | `app/next.config.ts` | ✅ CSP, HSTS, X-Frame-Options |
| 117 API routes com `console.error` | `app/src/app/api/` | ⚠️ Inconsistente |

---

## O QUE FALTA IMPLEMENTAR

### 1. `instrumentation.ts` — Captura de Erros Server-Side

**Criar:** `app/src/instrumentation.ts`

Next.js 16 suporta nativamente `onRequestError` para capturar erros em API routes e Server Components sem nenhuma dependência.

```typescript
import type { Instrumentation } from 'next';

export async function register() {
  // Inicialização do server — roda 1x quando o servidor Next.js inicia
  console.log('[MKTHONEY] Server instrumentation registered');
}

export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context
) => {
  // Structured log para Vercel Logs (capturado automaticamente)
  console.error(JSON.stringify({
    level: 'error',
    timestamp: new Date().toISOString(),
    message: error.message,
    digest: error.digest,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    request: {
      method: request.method,
      url: request.url,
      headers: {
        'user-agent': request.headers.get('user-agent'),
      },
    },
    context: {
      routerKind: context.routerKind,    // 'Pages' | 'App'
      routePath: context.routePath,       // ex: '/api/chat'
      routeType: context.routeType,       // 'route' | 'page' | 'middleware'
      renderSource: context.renderSource, // 'react-server-components' | etc
    },
  }));

  // Slack alert para erros críticos (se SLACK_WEBHOOK_URL configurada)
  if (process.env.SLACK_WEBHOOK_URL) {
    try {
      const { alerts } = await import('@/lib/utils/slack-alert');
      await alerts.serverError({
        route: request.url,
        error: error.message,
        context: context.routeType,
      });
    } catch {
      // Falha silenciosa — não queremos erro ao reportar erro
    }
  }
};
```

**NOTA:** `onRequestError` captura erros em:
- API routes (route handlers)
- Server Components
- Middleware

Erros capturados aparecem automaticamente nos **Vercel Logs** (dashboard da Vercel).

---

### 2. `instrumentation-client.ts` — Captura de Erros Client-Side

**Criar:** `app/src/instrumentation-client.ts`

Captura erros JavaScript não tratados no browser.

```typescript
// Erros JS não tratados (TypeError, ReferenceError, etc.)
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    console.error(JSON.stringify({
      level: 'client-error',
      timestamp: new Date().toISOString(),
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    }));
  });

  // Promises rejeitadas sem catch
  window.addEventListener('unhandledrejection', (event) => {
    console.error(JSON.stringify({
      level: 'client-unhandled-rejection',
      timestamp: new Date().toISOString(),
      reason: event.reason?.message || String(event.reason),
    }));
  });
}
```

---

### 3. `error.tsx` — Error Boundaries do App Router

Next.js App Router usa `error.tsx` para capturar erros em segmentos de rota. Criar error boundaries nos níveis críticos.

**Criar:** `app/src/app/error.tsx` (root — captura tudo)

```tsx
'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log estruturado — capturado pelo instrumentation-client
    console.error('[GlobalError]', error.message, error.digest);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0D0B09] px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E6B447]/10">
          <span className="text-3xl">⚠️</span>
        </div>
        <h2 className="mb-2 text-xl font-bold text-[#F5E8CE]">
          Algo deu errado
        </h2>
        <p className="mb-6 text-sm text-[#A89B84]">
          Ocorreu um erro inesperado. Tente novamente ou volte para o início.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-lg bg-[#E6B447] px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-[#F0C35C]"
          >
            Tentar novamente
          </button>
          <a
            href="/"
            className="rounded-lg border border-white/10 px-5 py-2.5 text-sm font-semibold text-[#F5E8CE] transition-colors hover:bg-white/5"
          >
            Ir para o início
          </a>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <pre className="mt-6 max-h-40 overflow-auto rounded-lg bg-white/5 p-3 text-left text-xs text-red-400">
            {error.message}
            {'\n'}
            {error.stack}
          </pre>
        )}
      </div>
    </div>
  );
}
```

**Criar:** `app/src/app/global-error.tsx` (captura erros no root layout)

Mesmo conteúdo de `error.tsx`, mas com `<html>` e `<body>` wrapping — necessário porque `global-error` substitui o layout inteiro.

```tsx
'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[GlobalError]', error.message, error.digest);
  }, [error]);

  return (
    <html lang="pt-BR" className="dark">
      <body className="bg-[#0D0B09]">
        {/* Mesmo conteúdo visual do error.tsx */}
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="max-w-md text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E6B447]/10">
              <span className="text-3xl">⚠️</span>
            </div>
            <h2 className="mb-2 text-xl font-bold text-[#F5E8CE]">Algo deu errado</h2>
            <p className="mb-6 text-sm text-[#A89B84]">Ocorreu um erro inesperado.</p>
            <button
              onClick={reset}
              className="rounded-lg bg-[#E6B447] px-5 py-2.5 text-sm font-semibold text-black hover:bg-[#F0C35C]"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
```

---

### 4. Instalar `@vercel/speed-insights` — Core Web Vitals

PostHog faz analytics de tráfego mas **NÃO mede Core Web Vitals** (LCP, CLS, INP) com precisão. Speed Insights é o padrão da Vercel para isso.

```bash
cd app && npm install @vercel/speed-insights
```

**Arquivo:** `app/src/app/layout.tsx`

Adicionar o componente no root layout:

```tsx
import { SpeedInsights } from '@vercel/speed-insights/next';

// Dentro do JSX do layout, antes do </body>:
<SpeedInsights />
```

**Custo:** Gratuito no Hobby plan (2.500 data points/mês). Pro: 10.000/mês.

---

### 5. Wire o `logger.ts` existente nas API routes críticas

O logger estruturado já existe em `app/src/lib/utils/logger.ts` mas ninguém usa. NÃO precisa refatorar todas as 117 routes — apenas as **5 mais críticas**:

| Route | Arquivo | Por quê |
|-------|---------|---------|
| Chat | `app/src/app/api/chat/route.ts` | Core feature, Gemini calls |
| Funnel create | `app/src/app/api/funnels/route.ts` | Writes Firestore |
| Offer Lab | `app/src/app/api/intelligence/offer-lab/route.ts` | AI scoring |
| Auth/signup | Signup flow | User creation |
| Cron trial | `app/src/app/api/cron/trial-check/route.ts` | Automated billing |

**Padrão de uso:**

```typescript
import { logger } from '@/lib/utils/logger';

// No início do handler:
logger.info('Chat request started', { route: '/api/chat', userId, brandId });

// No catch:
logger.error('Chat request failed', { route: '/api/chat', userId, error: err.message });
```

Isso transforma os logs em JSON estruturado que a Vercel indexa e permite filtrar no dashboard.

---

### 6. Wire o `slack-alert.ts` no `instrumentation.ts`

Já feito no passo 1 — o `onRequestError` chama `alerts.serverError()` quando `SLACK_WEBHOOK_URL` está configurada. Nenhuma ação adicional necessária.

**Para ativar:** Basta setar a env var `SLACK_WEBHOOK_URL` na Vercel.

---

## ARQUIVOS A CRIAR

| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| `app/src/instrumentation.ts` | Instrumentation | `register()` + `onRequestError` |
| `app/src/instrumentation-client.ts` | Instrumentation | `window.error` + `unhandledrejection` |
| `app/src/app/error.tsx` | Error Boundary | Erro em segmentos de rota |
| `app/src/app/global-error.tsx` | Error Boundary | Erro no root layout |

## ARQUIVOS A MODIFICAR

| Arquivo | Mudança |
|---------|---------|
| `app/src/app/layout.tsx` | Adicionar `<SpeedInsights />` |
| `app/src/app/api/chat/route.ts` | Substituir `console.error` por `logger.error` |
| `app/src/app/api/funnels/route.ts` | Idem |
| `app/src/app/api/intelligence/offer-lab/route.ts` | Idem |
| `app/src/app/api/cron/trial-check/route.ts` | Idem |

## DEPENDÊNCIA A INSTALAR

```bash
cd app && npm install @vercel/speed-insights
```

**NOTA:** Essa é a ÚNICA dependência nova. Zero libs pesadas.

---

## RESUMO DA STACK DE MONITORING

```
┌─────────────────────────────────────────────┐
│           MKTHONEY Monitoring Stack          │
├─────────────────────────────────────────────┤
│                                             │
│  CLIENT                                     │
│  ├─ instrumentation-client.ts (erros JS)    │
│  ├─ error.tsx (React error boundary)        │
│  ├─ PostHog (analytics + events)            │
│  └─ @vercel/speed-insights (Core Web Vitals)│
│                                             │
│  SERVER                                     │
│  ├─ instrumentation.ts (onRequestError)     │
│  ├─ logger.ts (structured JSON logs)        │
│  ├─ slack-alert.ts (alertas críticos)       │
│  └─ /api/health (health check)              │
│                                             │
│  VERCEL (automático)                        │
│  ├─ Logs (captura console.*)                │
│  ├─ Analytics (tráfego)                     │
│  └─ Speed Insights (performance)            │
│                                             │
└─────────────────────────────────────────────┘
```

---

## CHECKLIST

- [ ] `instrumentation.ts` criado com `onRequestError`
- [ ] `instrumentation-client.ts` criado com error listeners
- [ ] `error.tsx` criado no root do app (dark theme, Honey Gold)
- [ ] `global-error.tsx` criado no root do app
- [ ] `@vercel/speed-insights` instalado e adicionado ao layout
- [ ] 5 API routes críticas usando `logger.ts` em vez de `console.error`
- [ ] Build passa: `cd app && npm run build`

---

## VERIFICAÇÃO

```bash
# 1. Build
cd app && npm run build

# 2. Verificar instrumentation
ls app/src/instrumentation.ts app/src/instrumentation-client.ts

# 3. Verificar error boundaries
ls app/src/app/error.tsx app/src/app/global-error.tsx

# 4. Verificar speed-insights
grep -n "SpeedInsights" app/src/app/layout.tsx

# 5. Verificar logger usage nas routes críticas
grep -n "logger\." app/src/app/api/chat/route.ts
```

---

## COMMIT

```
feat(monitoring): add native Next.js instrumentation, error boundaries, and Speed Insights

- Create instrumentation.ts with onRequestError for server-side error capture
- Create instrumentation-client.ts for unhandled JS errors and rejections
- Add error.tsx and global-error.tsx with Honey Gold dark theme
- Install @vercel/speed-insights for Core Web Vitals tracking
- Wire structured logger into 5 critical API routes
- Zero external error tracking dependencies (Vercel Logs as sink)

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```
