# Sprint R — Pendências (Production Hardening)

> Concluído em: 2026-02-18 (commit db490edbe)
> Estes itens ficaram fora do escopo principal e devem ser tratados em sprints futuros.

---

## R-2.3 — Bundle Size Audit
**Prioridade:** Baixa
**Dependência:** Nenhuma
**O que fazer:**
- Rodar `npx next-bundle-analyzer` ou `npx @next/bundle-analyzer` no build
- Identificar pacotes pesados (crypto-js, recharts, framer-motion, tesseract.js, pdfjs-dist)
- Avaliar lazy loading / dynamic import para módulos grandes
- Target: First Load JS < 200KB nas páginas principais

## R-3.1 — Sentry Error Tracking
**Prioridade:** Média
**Dependência:** Nenhuma (npm install necessário)
**O que fazer:**
```bash
cd app && npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```
- Configurar `sentry.client.config.ts` e `sentry.server.config.ts`
- Adicionar DSN como env var `SENTRY_DSN` na Vercel
- Integrar com o `logger.ts` existente (app/src/lib/utils/logger.ts)
- Wrappar API routes críticas com `Sentry.captureException()`

## R-3.3 — Uptime Monitoring
**Prioridade:** Baixa
**Dependência:** Nenhuma
**O que fazer:**
- Configurar serviço externo (UptimeRobot, Better Stack, ou Vercel Analytics)
- Monitorar endpoints críticos:
  - `/api/chat` (chat AI)
  - `/api/intelligence/keywords` (keywords miner)
  - `/api/social/debate` (social council)
  - `/api/brands/[brandId]/assets` (assets)
- Integrar alertas com Slack (usar `slack-alert.ts` existente)

## R-4.2 — Confirmação Dupla para Delete de Brand
**Prioridade:** Média
**Dependência:** Sprint visual (P ou Q) — precisa de UI component
**O que fazer:**
- Modal de confirmação com input: "Digite o nome da marca para confirmar"
- Comparar `input.trim().toLowerCase() === brand.name.trim().toLowerCase()`
- Só habilitar botão "Excluir" quando match for exato
- Localização: componente que chama `deleteBrand()` (provavelmente em brand settings ou brand list)
- O `deleteBrand()` já faz cascade delete (R-4.1 concluído)

## NEXT_PUBLIC_ENCRYPTION_KEY — Remoção Futura
**Prioridade:** Baixa (não urgente — apenas cleanup)
**Dependência:** Verificar que nenhum código client-side usa encryption
**O que fazer:**
- Confirmar que `ENCRYPTION_KEY` server-only funciona em produção
- Remover `NEXT_PUBLIC_ENCRYPTION_KEY` da Vercel: `vercel env rm NEXT_PUBLIC_ENCRYPTION_KEY production`
- Remover fallback no código (app/src/lib/utils/encryption.ts linha que faz `|| process.env.NEXT_PUBLIC_ENCRYPTION_KEY`)
- Mesmo para app/src/lib/performance/encryption.ts
