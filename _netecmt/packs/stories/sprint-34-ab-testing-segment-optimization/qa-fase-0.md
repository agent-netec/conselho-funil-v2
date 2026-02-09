# QA Sprint 34 — FASE QA-0: Baseline & Governança
**Escopo validado nesta fase:** GOV-01, GOV-02, GATE-00, Proibições Sigma (P-01 a P-08)  
**Data:** 09/02/2026  
**QA:** Dandara

---

## GOV-01: PASS (Timer Leak — DT-01)
- **afterEach com `cleanup()` + `unmount()`**
  - `app/src/__tests__/hooks/use-brands.test.ts`: possui `afterEach()` com `lastUnmount()` + `cleanup()`.
  - `app/src/__tests__/hooks/use-brand-assets.test.ts`: possui `afterEach()` com `lastUnmount()` + `cleanup()`.
  - `app/src/__tests__/hooks/use-funnels.test.ts`: possui `afterEach()` com `lastUnmount()` + `cleanup()`.
- **Fallback `forceExit` em `jest.config.js`**
  - `app/jest.config.js`: `forceExit: true, // @todo S35: investigar polyfill MessageChannel isolado`
- **Comandos exigidos**
  - `npx tsc --noEmit`: **0 erros** (exit 0).
  - `npm test`: **302/302 passando**, 52 suites, exit 0.
    - Observação: o output ainda contém `A worker process has failed to exit gracefully...` e `Force exiting Jest...` (ou seja, o fallback `forceExit` está sendo exercido).

---

## GOV-02: PASS (engagementScore — DT-02)
- **Arquivo existe**
  - `app/src/lib/content/engagement-scorer.ts`: presente.
- **Função e query corretas (social_interactions)**
  - `getTopEngagementExamples()` usa:
    - `collection(db, 'brands', brandId, 'social_interactions')`
    - `orderBy('engagementScore', 'desc')`
    - `limit(topN)` (default 5)
- **Inject no engine (contexto de engagement)**
  - `app/src/lib/content/generation-engine.ts` importa `getTopEngagementExamples` + `formatEngagementContext` e concatena `enrichedPrompt = filledPrompt + engagementContext` antes de chamar `generateWithGemini()`.
- **Tipagem**
  - Não há `any` no módulo; retorno tipado como `Promise<SocialInteractionRecord[]>` (há cast para `SocialInteractionRecord[]` na leitura de `d.data()`).

---

## GATE-00: PASS (Gate Check 0 — Governança)
- **G0-01/G0-02 (cleanup nos hooks tests)**: presente em `use-brands.test.ts` e `use-brand-assets.test.ts` (e também em `use-funnels.test.ts`).
- **G0-03 (engagement scorer existe)**: `app/src/lib/content/engagement-scorer.ts` presente.
- **G0-04 (engagement injetado no engine)**: `generation-engine.ts` referencia `getTopEngagementExamples`.
- **G0-05 (TypeScript limpo)**: `npx tsc --noEmit` exit 0.
- **G0-06 (testes passando)**: `npm test` exit 0 (302/302).
- **G0-07 (timer warning)**: warning ainda presente no output, mitigado via `forceExit` no Jest.

---

## P-01: VIOLADA (ZERO `any`)
Encontrados `any` em arquivos tocados no baseline:
- `app/src/__tests__/hooks/use-funnels.test.ts`:
  - `context: { objective: 'sales' } as any`
- `app/src/__tests__/hooks/use-brand-assets.test.ts`:
  - `mockImplementation((_q: any, callback: any) => { ... })`

---

## P-02: RESPEITADA (ZERO `firebase-admin` / `google-cloud/*`)
- Não foram encontrados imports/uso de `firebase-admin` ou `google-cloud/*` nos diretórios checados do escopo S34.
- Observação: existe ocorrência textual em comentário em `app/src/lib/firebase/automation.ts` (“NUNCA firebase-admin”), sem impacto de runtime.

---

## P-03: VIOLADA (ZERO dependência npm nova)
- `app/package.json`: diff aponta adição de dependência:
  - `+ "zod": "^4.3.6"`

---

## P-04: VIOLADA (somente arquivos do allowed-context foram tocados)
- `git status --porcelain` lista **muitos** arquivos modificados e não rastreados fora do `allowed-context.md` da Sprint 34 (ex.: múltiplas rotas/admin/chat/etc, além de pastas inteiras de stories e solutioning).
- O working tree atual **não está isolado** ao conjunto permitido pela S34.

---

## P-05: RESPEITADA (ZERO `@ts-ignore` / `@ts-expect-error`)
- Nenhuma ocorrência encontrada nos diretórios/arquivos checados do escopo S34 (hooks tests, módulos `ab-testing`, rotas `/api/intelligence/ab-tests`, componentes `ab-test-*`, `segment-*`, e arquivos cross-lane principais).

---

## P-06: VIOLADA (ZERO `Date` — usar `Timestamp`)
- Encontrado `new Date(` em arquivo de teste no baseline:
  - `app/src/__tests__/hooks/use-brand-assets.test.ts`:
    - `createdAt: new Date()`

---

## P-07: RESPEITADA (rotas novas com `force-dynamic`)
Verificado em todas as rotas novas do escopo S34 em `app/src/app/api/intelligence/ab-tests/**`:
- `route.ts`
- `[testId]/route.ts`
- `[testId]/assign/route.ts`
- `[testId]/event/route.ts`
- `[testId]/optimize/route.ts`

Todas contêm `export const dynamic = 'force-dynamic'`.

---

## P-08: RESPEITADA (brandId em todas as queries Firestore novas)
Evidências (amostra direta de módulos do escopo S34):
- `app/src/lib/content/engagement-scorer.ts`: `collection(db, 'brands', brandId, 'social_interactions')`
- `app/src/lib/firebase/ab-tests.ts`: `collection(db, 'brands', brandId, 'ab_tests')`
- `app/src/lib/intelligence/ab-testing/auto-optimizer.ts`: `collection(db, 'brands', brandId, 'ab_tests', testId, 'optimization_log')`
- `app/src/lib/intelligence/ab-testing/segment-query.ts` (leads top-level): `where('brandId', '==', brandId)`

---

## Score parcial desta fase: 6/10
- PASS/RESPEITADA: GOV-01, GOV-02, P-02, P-05, P-07, P-08 (6)
- FAIL/VIOLADA: P-01, P-03, P-04, P-06 (4)

---

## Findings
- Warning de teardown ainda presente no `npm test` (“worker process has failed to exit gracefully”), mitigado via `forceExit` (DT-01 Camada 2), mas ainda é um risco de mascarar leaks reais se não investigado (S35 @todo).
- Violações Sigma claras em baseline: uso de `any` e `new Date()` em testes de hooks.
- Violação de governança de isolamento: working tree contém um volume grande de alterações fora do `allowed-context` da S34.
- Nova dependência npm adicionada (`zod`), contrariando P-03.

