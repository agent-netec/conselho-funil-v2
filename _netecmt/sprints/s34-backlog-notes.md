# Notas de Backlog para Sprint 34

**Criado por:** Sprint Controller (Conselho)
**Data:** 09/02/2026
**Origem:** Resultados do PATCH final S33 + Divida tecnica identificada

---

## N1 — Timer Leak: MessagePort em Hooks Tests (Heranca S32 → S33)

**Prioridade:** Media
**Tipo:** Tech Debt
**Identificado por:** Darllyson (Dev) via `npx jest --detectOpenHandles`
**Sprint de origem:** S32 (Nota N4), tentativa de fix em S33 (GOV-02)

### Problema

O warning `A worker process has failed to exit gracefully` persiste nos testes Jest apos adicao de `afterAll` com `jest.clearAllTimers()` + `jest.useRealTimers()` + `jest.restoreAllMocks()` no `jest.setup.js`.

### Causa Raiz Identificada

**`MESSAGEPORT`** — leak detectado pelo `--detectOpenHandles`, ligado a testes de hooks com React Testing Library:
- `use-funnels` (hook test)
- `use-brands` (hook test)
- `use-brand-assets` (hook test)

O `MessagePort` e importado como polyfill global no `jest.setup.js` (de `node:worker_threads`). Os testes de hooks que usam React Testing Library (`renderHook`, `act`) nao fazem teardown/unmount adequado, deixando o `MessagePort` aberto.

### Acao Recomendada

1. Revisar os 3 arquivos de teste de hooks:
   - `app/src/__tests__/hooks/use-funnels.test.ts` (ou similar)
   - `app/src/__tests__/hooks/use-brands.test.ts`
   - `app/src/__tests__/hooks/use-brand-assets.test.ts`
2. Adicionar `cleanup()` ou `unmount()` explicito nos `afterEach` de cada suite
3. Avaliar se o polyfill de `MessageChannel` no `jest.setup.js` pode ser removido ou isolado
4. Se nao resolvivel: configurar `--forceExit` como fallback (ultima opcao)

### Impacto

- **Funcional:** Nenhum (warning apenas, testes passam 286/286)
- **DX:** Warning poluindo output do Jest
- **CI/CD:** Pode causar timeout em pipelines se o processo nao sair

### Historico

| Sprint | Acao | Resultado |
|:-------|:-----|:---------|
| S32 | Identificado como Nota N4 | Warning reportado |
| S33 (GOV-02) | `afterAll` global + `jest.clearAllTimers()` + `jest.useRealTimers()` | Warning persiste |
| S33 (PATCH) | `--detectOpenHandles` — causa raiz identificada: MessagePort em hooks | Documentado para S34 |

---

## N2 — BrandVoice 2.0: engagementScore (STRETCH S33 → S34)

**Prioridade:** Baixa
**Tipo:** Enhancement
**Sprint de origem:** S32 (STRETCH) → S33 (STRETCH S33-BV-01 nao executado)

### Descricao

Implementar `engagementScore` como peso no Content Generation Engine — buscar top interacoes com maior score e injetar como contexto no prompt.

O campo `engagementScore` ja existe como opcional no type `SocialInteractionRecord` (criado em S33-GOV-04). A funcao `getTopEngagementExamples()` esta descrita na story S33-BV-01.

---

*Backlog notes mantidas pelo Sprint Controller — NETECMT v2.0*
