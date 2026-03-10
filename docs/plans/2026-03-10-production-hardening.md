# Production Hardening — MKTHONEY

> **Data:** 2026-03-10
> **Status:** P0 CONCLUÍDO — P1 CONCLUÍDO — P2 parcial (6/8 done, faltam PERF-5 + SEO-4)
> **Estimativa total:** ~40 tarefas granulares

---

## Legenda

- [ ] Pendente
- [x] Concluído
- **P0** = Bloqueante para launch (DEVE ser feito)
- **P1** = Alto impacto, fazer antes de 30 dias pós-launch
- **P2** = Nice-to-have, melhoria contínua

---

## P0 — BLOQUEANTES PARA LAUNCH

### SEC-1: Storage Rules — Validação de ownership
- [x] **SEC-1.1** Editar `app/storage.rules` — ownership validation via Firestore get() em brand-assets e brands paths
- [x] **SEC-1.2** Verificado: user-uploads já usa path-based isolation
- [x] **SEC-1.3** Deploy das rules: `firebase deploy --only storage`

### SEC-2: Firestore Rules — Knowledge base pública
- [x] **SEC-2.1** `allow read: if true` → `allow read: if isAuthenticated()` em `/knowledge/{chunkId}`
- [x] **SEC-2.2** Deploy das rules: `firebase deploy --only firestore:rules`

### SEC-3: Meta OAuth — Secret salvo em Firestore
- [x] **SEC-3.1** Removido `appSecret` de meta callback, google callback, e save-token (3 arquivos)
- [x] **SEC-3.2** Verificado: nenhum outro endpoint salva secrets

### SEC-4: Cron Secret — Validação de string vazia
- [x] **SEC-4.1** Mensagem genérica "Internal error" + rejeição de secrets < 8 chars
- [x] **SEC-4.2** Aplicado em todos os 6 cron routes (trial-check, social-sync, content-metrics, content-autopilot, automation-evaluate, ads-sync)

### ERR-1: Error Boundaries globais
- [x] **ERR-1.1** Criado `app/src/app/(app)/error.tsx` — Bloomberg style, reset + link home
- [x] **ERR-1.2** Criado `app/src/app/(app)/loading.tsx` — shimmer bar + LOADING label
- [x] **ERR-1.3** Estilizado com Honey Gold, monospace, design system

### ERR-2: Timeout em chamadas OAuth externas
- [x] **ERR-2.1** AbortController 10s em meta callback (3 fetch calls)
- [x] **ERR-2.2** AbortController 10s em google callback (1 fetch call)
- [x] **ERR-2.3** AbortController 10s em save-token (2 fetch calls)

### SEO-1: Favicon
- [x] **SEO-1.1** Criado `app/src/app/icon.svg` — SVG favicon gold "M" em fundo dark (Next.js auto-detect)
- [ ] **SEO-1.2** _(Opcional)_ Gerar `apple-icon.png` a partir do SVG para iOS

### SEO-2: Open Graph metadata
- [x] **SEO-2.1** Adicionado openGraph completo no root layout.tsx
- [x] **SEO-2.2** Criado layout.tsx com metadata para login e signup
- [x] **SEO-2.3** Adicionado openGraph em pricing/page.tsx
- [ ] **SEO-2.4** _(Pendente)_ Criar imagem OG real (1200x630) em `app/public/og-image.png`

---

## P1 — ALTO IMPACTO (antes de 30 dias)

### ERR-3: Persistência fire-and-forget
- [x] **ERR-3.1** Editar `app/src/app/api/intelligence/autopsy/run/route.ts` — await no `setDoc()` ao invés de fire-and-forget
- [x] **ERR-3.2** Tratar erro de persistência e retornar warning ao frontend

### ERR-4: Race condition no chat
- [x] **ERR-4.1** Editar `app/src/lib/hooks/use-conversations.ts` — separar try/catch da mensagem de erro do try/catch da API call
- [x] **ERR-4.2** Garantir que `isSending` é resetado mesmo se `addMessage` falhar (já estava no `finally`)

### ERR-5: Credit deduction silenciosa
- [x] **ERR-5.1** Editar `app/src/app/api/content/autopilot/route.ts` — retornar `creditStatus` + `creditWarning` na response
- [x] **ERR-5.2** Frontend mostra `creditWarning` via toast no `vault/page.tsx`

### ERR-6: Webhook idempotency
- [x] **ERR-6.1** Editar `app/src/app/api/payments/webhook/route.ts` — checar `event.id` contra Firestore (`stripe_events` collection) antes de processar
- [x] **ERR-6.2** Salvar `event.id` após processamento bem-sucedido

### ERR-7: Import parcial sem feedback
- [x] **ERR-7.1** Editar `app/src/app/api/assets/import/route.ts` — retornar `{ imported, failed, total }` no response
- [x] **ERR-7.2** N/A — rota órfã sem consumidor frontend (endpoint planejado para Meta Ads import, não integrado)

### ERR-8: Diferenciação de erros Gemini
- [x] **ERR-8.1** 27 API routes com detecção de `RESOURCE_EXHAUSTED` / `QUOTA_EXCEEDED` / HTTP 429 → retorna mensagem específica
- [x] **ERR-8.2** Frontend propaga mensagem da API nos toasts (copy-lab-modal, hook-generator, social-wizard, design-generation-card)

### SEC-5: CSP — Remover unsafe-eval
- [x] **SEC-5.1** Editar `app/next.config.ts` — removido `'unsafe-eval'` do script-src
- [x] **SEC-5.2** Build passando sem unsafe-eval
- [x] **SEC-5.3** Não necessário — app funciona sem nonce

### SEC-6: Brand sanitization
- [x] **SEC-6.1** Editar `app/src/lib/auth/brand-guard.ts` — `sanitizeBrandId()` aplicado dentro de `requireBrandAccess()`

### PERF-1: Imagens não otimizadas
- [x] **PERF-1.1** Substituído 8 `<img>` tags por `next/image` (Image component):
  - `home/page.tsx` ✓
  - `settings/page.tsx` ✓
  - `brand-kit-form.tsx` ✓
  - `asset-gallery.tsx` ✓
  - `creative-card.tsx` ✓
  - `vault-explorer.tsx` ✓
  - `design-generation-card.tsx` ✓
  - `sidebar.tsx` ✓

### PERF-2: Recharts lazy loading
- [x] **PERF-2.1** `ForecastChart`, `LTVBreakdown`, `SocialVolumeChart` envolvidos com `next/dynamic({ ssr: false })`

### PERF-3: AnimatePresence duplicada
- [x] **PERF-3.1** Analisado — NÃO é duplicata real (caminhos mutuamente exclusivos: auth vs app). Nenhuma mudança necessária.

### A11Y-1: Aria labels em botões de ícone
- [x] **A11Y-1.1** 36 `aria-label` adicionados em botões icon-only (close, delete, menu, sidebar, filter, etc.)
- [x] **A11Y-1.2** Cobertos: delete, menu dropdown, close modal, sidebar toggle, navigation, filter, settings

### SEO-3: Schema.org em páginas públicas
- [x] **SEO-3.1** `BreadcrumbList` schema adicionado em pricing, terms, privacy
- [x] **SEO-3.2** `Product` schema com 3 pricing tiers (Starter R$97, Pro R$297, Agency R$597) em pricing/page.tsx

---

## P2 — MELHORIA CONTÍNUA

### PERF-4: BrandingProvider otimização
- [x] Mover BrandingProvider para dentro do `(app)/layout.tsx` (só rotas autenticadas)

### PERF-5: Layout RSC split
- [ ] Investigar mover auth gate de `(app)/layout.tsx` para middleware (RSC)

### ERR-9: Cron error aggregation
- [x] Editar cron routes para contar falhas e retornar 500 se failure rate > 50%
- [x] Aplicado em: ads-sync, automation-evaluate, content-autopilot, content-metrics, social-sync, trial-check

### ERR-10: Health check granularidade
- [x] Melhorar `/api/health` para retornar `{ status, available, detail }` ao invés de string

### SEO-4: Metadata nas auth pages
- [ ] Adicionar metadata exports individuais em login e signup (title, description)

### A11Y-2: Skip navigation
- [x] Adicionar "skip to content" link no root layout + `id="main-content"` no `<main>`

### PERF-6: Bundle analysis
- [x] Configurar `@next/bundle-analyzer` — rodar com `ANALYZE=true npm run build`
- [ ] Identificar dependências >50KB que podem ser lazy-loaded

### PERF-7: next.config minor
- [x] Adicionar `poweredByHeader: false` no next.config.ts

---

## Resumo por área

| Área | P0 | P1 | P2 | Total |
|------|----|----|----|----|
| Segurança | 4 grupos (9 tasks) | 2 grupos (3 tasks) | — | 12 |
| Error Handling | 2 grupos (5 tasks) | 6 grupos (12 tasks) | 2 tasks | 19 |
| SEO/Meta | 2 grupos (7 tasks) | 1 grupo (2 tasks) | 1 task | 10 |
| Performance | — | 3 grupos (4 tasks) | 4 tasks | 8 |
| Acessibilidade | — | 1 grupo (2 tasks) | 1 task | 3 |
| **TOTAL** | **21 tasks** | **23 tasks** | **8 tasks** | **52** |

---

## Ordem de execução sugerida

### Semana 1 (P0 — Ship blockers)
1. SEC-1 + SEC-2 (Firebase/Storage rules) — 1h
2. SEC-3 + SEC-4 (Secrets + Cron) — 30min
3. ERR-1 (Error boundaries + loading) — 1h
4. ERR-2 (Timeouts OAuth) — 30min
5. SEO-1 + SEO-2 (Favicon + OG image) — 1h

### Semana 2 (P1 — Alto impacto)
6. ERR-3 a ERR-8 (Error handling robusto) — 3h
7. SEC-5 + SEC-6 (CSP + Sanitization) — 1h
8. PERF-1 a PERF-3 (Imagens + lazy load + AnimatePresence) — 2h
9. A11Y-1 + SEO-3 (Aria labels + Schema.org) — 1h

### Semana 3+ (P2 — Melhoria contínua)
10. Restante conforme capacidade
