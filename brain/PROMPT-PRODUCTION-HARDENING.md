
# PROMPT: Production Hardening — Sprint Q

> **Branch:** `fix/production-hardening` (criar a partir do master, APÓS merge da feature/dashboard-visual-redesign)
> **Contexto:** UI redesign completo (D0, T1-T6, E1-E7, visual polish). Produto está funcional mas faltam itens de segurança, performance, monitoring e QA para ir ao ar.
> **Regra:** NÃO alterar visual/UI. Apenas infraestrutura, segurança e correções de bugs.

---

## PARTE 1 — SECURITY AUDIT

### 1A. Encryption & Secrets

**Verificar:**
```bash
# 1. Encryption key não está hardcoded
grep -rn "ENCRYPTION_KEY\|encrypt\|decrypt" app/src/ --include="*.ts" --include="*.tsx" | grep -v node_modules

# 2. Nenhum secret exposto no client
grep -rn "NEXT_PUBLIC_.*KEY\|NEXT_PUBLIC_.*SECRET\|NEXT_PUBLIC_.*TOKEN" app/src/ --include="*.ts" --include="*.tsx" | grep -v node_modules
```

**Ações:**
- [ ] Verificar que `NEXT_PUBLIC_ENCRYPTION_KEY` não usa valor default
- [ ] Verificar que nenhum server-only secret tem prefix `NEXT_PUBLIC_`
- [ ] Verificar que `.env.local` e `.env.production` estão no `.gitignore`

### 1B. Firebase Security Rules

**Verificar:**
```bash
# Ler as rules atuais
cat app/firestore.rules 2>/dev/null || echo "Sem arquivo local — verificar no Firebase Console"
```

**Checklist:**
- [ ] Reads são scoped por `userId` (usuário só lê seus próprios dados)
- [ ] Writes validam campos obrigatórios
- [ ] Deletes são protegidos (soft delete ou confirmação)
- [ ] Brands são isoladas por owner (`brandId` match)
- [ ] Nenhuma collection é `allow read, write: if true`

### 1C. API Route Protection

**Verificar em TODAS as API routes:**
```bash
grep -rn "export.*GET\|export.*POST\|export.*PUT\|export.*DELETE" app/src/app/api/ --include="*.ts" | grep -v node_modules
```

**Checklist para cada route:**
- [ ] Verifica autenticação (Firebase token ou session)
- [ ] Verifica autorização (brand ownership)
- [ ] Valida input (tipos, tamanhos, formatos)
- [ ] Tem rate limiting (ou está no middleware)
- [ ] Retorna erro genérico (não expõe stack traces)

### 1D. Input Sanitization

**Verificar:**
- [ ] Forms de chat sanitizam input antes de enviar ao Gemini
- [ ] Brand name/description sanitizam HTML
- [ ] File uploads validam tipo e tamanho
- [ ] URLs de integração (Meta, Google) são validadas

### 1E. Headers de Segurança

**Arquivo:** `app/next.config.ts`

**Adicionar se não existir:**
```typescript
headers: async () => [
  {
    source: '/(.*)',
    headers: [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    ],
  },
],
```

---

## PARTE 2 — PERFORMANCE AUDIT

### 2A. Bundle Size

```bash
cd app && npx next build --profile 2>&1 | grep -A 20 "Route"
# OU
cd app && ANALYZE=true npm run build  # se next-bundle-analyzer estiver configurado
```

**Ações:**
- [ ] Verificar se alguma rota tem bundle > 200KB
- [ ] Verificar se imports pesados usam `dynamic()` ou lazy loading
- [ ] Verificar se `next/image` está sendo usado (não `<img>`)
- [ ] Verificar tree-shaking de lucide-react (import individual, não `import * as`)

### 2B. Core Web Vitals

**Usar Lighthouse MCP ou manualmente:**
- [ ] LCP < 2.5s (todas as páginas públicas)
- [ ] FID/INP < 200ms
- [ ] CLS < 0.1
- [ ] Performance Score > 80 (landing, login, dashboard)

### 2C. API Response Times

**Verificar:**
- [ ] Chat response < 5s (streaming OK, mas primeiro token < 2s)
- [ ] Funnel creation < 3s
- [ ] Brand load < 1s
- [ ] Dashboard load < 2s

### 2D. Gemini API Resilience

**Verificar:**
- [ ] Timeout configurado em todas as chamadas Gemini (max 30s)
- [ ] Fallback para erro amigável se Gemini estiver indisponível
- [ ] Retry com backoff para 429 (rate limit)
- [ ] Não faz chamada Gemini no render path (só em actions/API routes)

---

## PARTE 3 — SEO & META

### 3A. Meta Tags

**Verificar em cada página pública:**

| Página | Rota | Meta tags necessárias |
|--------|------|----------------------|
| Landing | `/` | title, description, OG image, OG title, OG description, Twitter card |
| Login | `/login` | title, description, noindex |
| Signup | `/signup` | title, description, noindex |
| Pricing | `/pricing` | title, description, OG tags |
| Terms | `/terms` | title, noindex |
| Privacy | `/privacy` | title, noindex |
| Cookies | `/cookies` | title, noindex |
| Refund | `/refund` | title, noindex |

**Arquivo:** Cada `page.tsx` deve exportar `metadata` ou usar `generateMetadata()`.

### 3B. Sitemap & Robots

**Verificar:**
- [ ] `app/src/app/sitemap.ts` existe e gera sitemap XML
- [ ] `app/src/app/robots.ts` existe com regras corretas
- [ ] Páginas autenticadas estão com `noindex`
- [ ] Landing e pricing estão indexáveis

### 3C. Structured Data (JSON-LD)

**Adicionar na landing page:**
```typescript
// SoftwareApplication
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "MKTHONEY",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "AggregateOffer",
    "lowPrice": "97",
    "highPrice": "597",
    "priceCurrency": "BRL"
  }
}
```

---

## PARTE 4 — MONITORING & ERROR TRACKING

### 4A. Error Tracking

**Opção recomendada:** Sentry (free tier = 5K events/mês)

```bash
cd app && npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

**Configurar:**
- [ ] `sentry.client.config.ts` com DSN
- [ ] `sentry.server.config.ts` com DSN
- [ ] `instrumentation.ts` para server-side
- [ ] Source maps upload no build
- [ ] Filtrar erros de rede (não são bugs)

### 4B. Logging

**Verificar:**
- [ ] API routes logam request (userId, brandId, action)
- [ ] Erros logam stack trace + contexto
- [ ] Não logam dados sensíveis (tokens, senhas, PII)
- [ ] Gemini calls logam model, tokens usados, latência

### 4C. Health Check

**Criar:** `app/src/app/api/health/route.ts`

```typescript
export async function GET() {
  const checks = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      firebase: await checkFirebase(),
      gemini: await checkGemini(),
      pinecone: await checkPinecone(),
    }
  };
  const allOk = Object.values(checks.services).every(s => s === 'ok');
  return Response.json(checks, { status: allOk ? 200 : 503 });
}
```

---

## PARTE 5 — BUG FIXES CRÍTICOS

Consolidar bugs conhecidos dos roadmaps anteriores que são blockers para launch:

### 5A. Verificar e corrigir

| Bug | Arquivo provável | Severidade |
|-----|-------------------|------------|
| Calendar 500 error | `app/src/app/content/calendar/page.tsx` | ALTA |
| Asset invisível após upload | `app/src/components/assets/` | ALTA |
| Settings fake save (saves UI, não persiste) | `app/src/app/settings/` | ALTA |
| Quick Action "/library" navegação | `app/src/components/dashboard/quick-actions.tsx` | MÉDIA |
| Password recovery link ausente | `app/src/app/(auth)/login/` | MÉDIA |

### 5B. Verificar funcionalidades core

- [ ] Signup → Login → Dashboard funciona end-to-end
- [ ] Criar marca (onboarding wizard) → salva no Firebase
- [ ] Chat com conselheiros → resposta do Gemini chega
- [ ] Criar funil → propostas são geradas
- [ ] Offer Lab → score AI funciona
- [ ] Settings → alterações persistem após reload

---

## PARTE 6 — LEGAL & COMPLIANCE

### 6A. LGPD

**Verificar:**
- [ ] Página `/privacy` tem cláusulas LGPD (Arts. 7, 11, 18)
- [ ] Cookie banner funciona e persiste escolha
- [ ] Endpoint de exclusão de dados existe (`/api/lgpd/delete-data` ou similar)
- [ ] Formulário de contato DPO existe ou email visível

### 6B. Termos de Uso

**Verificar:**
- [ ] `/terms` está atualizado com nome MKTHONEY
- [ ] Menciona uso de IA (Gemini) para geração de conteúdo
- [ ] Menciona que conteúdo gerado é responsabilidade do usuário
- [ ] Cláusula de limitação de responsabilidade

---

## CHECKLIST FINAL

- [ ] Zero vulnerabilidades de segurança óbvias
- [ ] Headers de segurança configurados
- [ ] Firebase Rules auditadas
- [ ] Lighthouse Performance > 80 em páginas públicas
- [ ] Sentry (ou equivalente) configurado
- [ ] Health check endpoint funcional
- [ ] Sitemap + robots.txt gerados
- [ ] Meta tags em todas as páginas públicas
- [ ] 5 bugs críticos verificados/corrigidos
- [ ] LGPD compliance verificada
- [ ] Build passa: `cd app && npm run build`
- [ ] Smoke test: signup → brand → chat → funnel → logout

---

## COMMIT(S)

Dividir em commits lógicos:

```
fix(security): add security headers, audit API route protection

fix(perf): optimize bundle size, add dynamic imports for heavy components

feat(monitoring): add Sentry error tracking and health check endpoint

fix(seo): add meta tags, sitemap, robots.txt, structured data

fix(bugs): resolve calendar 500, asset upload, settings persistence

docs(legal): update terms and privacy for MKTHONEY branding

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

---

## VERIFICAÇÃO FINAL

```bash
# 1. Build limpo
cd app && npm run build

# 2. Lighthouse (se MCP disponível)
# lighthouse http://localhost:3001 --performance --seo --accessibility

# 3. Smoke test manual
# Abrir http://localhost:3001 → signup → criar marca → chat → funil → settings → logout

# 4. Security headers
curl -I http://localhost:3001 | grep -i "x-frame\|x-content-type\|referrer-policy"
```
