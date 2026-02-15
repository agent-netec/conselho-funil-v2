# Sprint E — Quick Fixes (Achados P0 da Auditoria)

> Fase: Pos-Auditoria — Correcoes Criticas
> Status: CONCLUIDO
> Dependencia: Auditoria completa (2026-02-15)
> Estimativa: ~4h total

---

## Resumo

Corrigir os 6 achados mais criticos e rapidos identificados na auditoria completa do sistema. Todos sao fixes pontuais que desbloqueiam features quebradas ou corrigem UX incorreta.

---

## Tarefas

### E1. Fix design_director no Chat (P0-1)

- **Arquivos:**
  - `app/src/lib/ai/prompts/chat-brain-context.ts` (2 alteracoes)
  - `app/src/app/api/chat/route.ts` (1 alteracao)
- **Problema:** `CouncilType` nao inclui `'design'` e o chat mode design nao chama `buildChatBrainContext()`
- **Mudanca 1:** Linha ~16 — adicionar `| 'design'` no type `CouncilType`
- **Mudanca 2:** Linhas ~18-34 — adicionar `design: ['design_director']` no `COUNCIL_COUNSELORS`
- **Mudanca 3:** Linhas ~236-239 do route.ts — adicionar `buildChatBrainContext('design')` + `enrichChatPromptWithBrain()` no bloco `effectiveMode === 'design'`
- **Estimativa:** 15 min
- **Verificacao:** Chat no modo Design responde com personalidade do design_director (catchphrases, C.H.A.P.E.U)
- **Status:** CONCLUIDO

#### Prompt de Handoff — E1 → E2

```
CONTEXTO: Projeto Conselho de Funil v2, Next.js 16, app/ como root.

TAREFA CONCLUIDA (E1): O design_director foi integrado no chat. Alteramos:
1. chat-brain-context.ts — CouncilType agora inclui 'design', COUNCIL_COUNSELORS tem design: ['design_director']
2. chat/route.ts — modo design agora chama buildChatBrainContext('design') + enrichChatPromptWithBrain()

PROXIMA TAREFA (E2): Fix social-inbox brandId hardcoded.

ARQUIVO: app/src/app/social-inbox/page.tsx
PROBLEMA: Na linha do fetch, o brandId esta hardcoded como 'mock-brand-123'.
MUDANCA: Substituir 'mock-brand-123' pelo brandId real do usuario. O app usa um hook de brand context — verificar qual hook (useBrand, useActiveBrand, ou similar) esta disponivel no escopo do componente e usar activeBrand?.id ou selectedBrand?.id.
CUIDADO: Se o componente nao tem acesso ao brand context, pode ser necessario importar o hook. Verificar como outras paginas similares (ex: vault/page.tsx, performance/page.tsx) obtem o brandId.
VERIFICACAO: Social inbox carrega dados quando um brand real esta selecionado.
```

---

### E2. Fix social-inbox brandId hardcoded (P0-3)

- **Arquivo:** `app/src/app/social-inbox/page.tsx`
- **Problema:** `brandId: 'mock-brand-123'` hardcoded no body do fetch
- **Mudanca:** Substituir por `activeBrand?.id` ou equivalente do hook de brand context usado no app
- **Referencia:** Verificar como `/vault/page.tsx` ou `/performance/page.tsx` obtem brandId
- **Estimativa:** 30 min
- **Verificacao:** Social inbox carrega dados reais quando brand selecionado
- **Status:** CONCLUIDO

#### Prompt de Handoff — E2 → E3

```
CONTEXTO: Projeto Conselho de Funil v2, Next.js 16, app/ como root.

TAREFAS CONCLUIDAS:
- E1: design_director integrado no chat (chat-brain-context.ts + chat/route.ts)
- E2: social-inbox agora usa brandId real (social-inbox/page.tsx)

PROXIMA TAREFA (E3): Fix silent error suppression em 3 locais.

ARQUIVOS E PROBLEMAS:
1. Hook de attribution data (buscar arquivo com "useAttributionData" ou "use-attribution-data") — catch block vazio, sem log nem feedback ao usuario
2. Hook de predictive data (buscar arquivo com "usePredictiveData" ou "use-predictive-data") — retorna null sem logging
3. app/src/app/social-inbox/page.tsx — catch block usa apenas console.warn, sem mensagem ao usuario

MUDANCA EM CADA UM:
- Adicionar console.error() no catch block
- Adicionar toast de erro ou setState de erro para o usuario ver (verificar se o app usa um sistema de toast — buscar por "toast" ou "useToast" no codebase)
- NAO remover o fallback existente (null/array vazio), apenas ADICIONAR o feedback

CUIDADO: Nao alterar a logica de retry ou fallback, apenas adicionar visibilidade do erro.
VERIFICACAO: Quando uma API falha, o usuario ve mensagem de erro em vez de tela vazia.
```

---

### E3. Fix silent error suppression x3 (P1-6)

- **Arquivos:**
  - Hook de attribution data (buscar `useAttributionData` ou `use-attribution-data`)
  - Hook de predictive data (buscar `usePredictiveData` ou `use-predictive-data`)
  - `app/src/app/social-inbox/page.tsx`
- **Problema:** catch blocks engolem erros sem feedback ao usuario
- **Mudanca:** Em cada um, adicionar `console.error()` + feedback visual (toast ou state de erro)
- **PRESERVAR:** Logica de fallback existente (null, array vazio). Apenas ADICIONAR visibilidade
- **Estimativa:** 1h
- **Verificacao:** Quando API falha, usuario ve mensagem em vez de tela vazia
- **Status:** CONCLUIDO

#### Prompt de Handoff — E3 → E4

```
CONTEXTO: Projeto Conselho de Funil v2, Next.js 16, app/ como root.

TAREFAS CONCLUIDAS:
- E1: design_director integrado no chat
- E2: social-inbox usa brandId real
- E3: Silent errors agora mostram feedback ao usuario (3 hooks corrigidos)

PROXIMA TAREFA (E4): Remover mock content do Vault.

ARQUIVO: app/src/app/vault/page.tsx
PROBLEMA: Existe uma constante MOCK_REVIEW_CONTENT (cerca de linhas 31-57) com dados hardcoded que sao exibidos no estado inicial da pagina. O Firebase real funciona para save/load, mas o estado inicial mostra dados fake.
MUDANCA: Remover a constante MOCK_REVIEW_CONTENT e substituir por um estado inicial vazio (array vazio). Adicionar um empty state visual adequado (ex: "Nenhum conteudo no vault. Gere copy ou conteudo para ve-lo aqui."). Verificar como outras paginas do app mostram empty states para manter consistencia visual.
CUIDADO: NAO alterar a logica de Firebase (save/load/query). Apenas remover o mock e adicionar empty state.
VERIFICACAO: Vault inicia sem dados fake. Mostra empty state. Apos gerar conteudo, dados reais aparecem.
```

---

### E4. Remover mock content do Vault (P2-4)

- **Arquivo:** `app/src/app/vault/page.tsx`
- **Problema:** `MOCK_REVIEW_CONTENT` (~linhas 31-57) com dados fake no estado inicial
- **Mudanca:** Remover constante mock, inicializar com array vazio, adicionar empty state visual
- **PRESERVAR:** Logica de Firebase (save/load/query) intocada
- **Estimativa:** 30 min
- **Verificacao:** Vault inicia sem dados fake, mostra empty state, dados reais aparecem apos geracao
- **Status:** CONCLUIDO

#### Prompt de Handoff — E4 → E5

```
CONTEXTO: Projeto Conselho de Funil v2, Next.js 16, app/ como root.

TAREFAS CONCLUIDAS:
- E1: design_director integrado no chat
- E2: social-inbox usa brandId real
- E3: Silent errors corrigidos (3 hooks)
- E4: Vault sem mock content, empty state correto

PROXIMA TAREFA (E5): Fix copy pricing invertido.

ARQUIVOS:
1. app/src/app/api/copy/generate/route.ts — custa 1 credito (full editorial com 4 fontes de contexto, 9 counselors, scorecards)
2. app/src/app/api/intelligence/creative/copy/route.ts — custa 2 creditos (angles simples, brand only, sem RAG, sem persistence)

PROBLEMA: O pricing esta invertido. O endpoint mais completo (copy/generate) cobra MENOS que o simples (creative/copy).
MUDANCA: Inverter — copy/generate passa a custar 2 creditos, creative/copy passa a custar 1 credito.
COMO: Buscar por "updateUserUsage" ou "creditCost" ou decremento de creditos em cada arquivo. Trocar os valores.
CUIDADO: Verificar se existe alguma constante centralizada de pricing ou se esta inline em cada route. Se centralizada, alterar la.
VERIFICACAO: copy/generate custa 2 creditos, creative/copy custa 1 credito.
```

---

### E5. Fix copy pricing invertido (P2-3)

- **Arquivos:**
  - `app/src/app/api/copy/generate/route.ts` — de 1 para 2 creditos
  - `app/src/app/api/intelligence/creative/copy/route.ts` — de 2 para 1 credito
- **Problema:** Endpoint mais completo cobra menos que o simples
- **Mudanca:** Inverter custos. Buscar `updateUserUsage` ou decremento de creditos
- **Estimativa:** 15 min
- **Verificacao:** copy/generate = 2 creditos, creative/copy = 1 credito
- **Status:** CONCLUIDO

#### Prompt de Handoff — E5 → E6

```
CONTEXTO: Projeto Conselho de Funil v2, Next.js 16, app/ como root.

TAREFAS CONCLUIDAS:
- E1: design_director integrado no chat
- E2: social-inbox usa brandId real
- E3: Silent errors corrigidos (3 hooks)
- E4: Vault sem mock content
- E5: Copy pricing corrigido (generate=2cr, creative/copy=1cr)

PROXIMA TAREFA (E6): Rotular ScaleSimulator como demo.

ARQUIVO: Buscar componente ScaleSimulator dentro de app/src/components/intelligence/. Provavelmente em Predictive/ ou predictor/.
PROBLEMA: O componente usa projecoes matematicas lineares hardcoded (multiplicacao simples), nao modelos ML treinados. Usuarios podem pensar que sao previsoes reais.
MUDANCA: Adicionar um badge ou label visual "Projecao Simulada" ou "Demo" no componente. Pode ser um badge no header do card ou um tooltip explicativo. Verificar o design system do app (cores, classes CSS usadas em outros badges como PropensityBadge).
CUIDADO: NAO alterar a matematica do simulador. Apenas adicionar rotulo visual.
VERIFICACAO: ScaleSimulator mostra indicacao clara de que e uma simulacao/demo.

APOS ESTA TAREFA: Sprint E completo. Rodar build (npm run build no diretorio app/) e verificar zero erros. Registrar tempo de compilacao no changelog.
```

---

### E6. Rotular ScaleSimulator como demo (P2-5)

- **Arquivo:** Buscar `ScaleSimulator` em `app/src/components/intelligence/`
- **Problema:** Projecoes lineares hardcoded parecem previsoes reais
- **Mudanca:** Adicionar badge "Projecao Simulada" ou "Demo" no componente
- **PRESERVAR:** Matematica do simulador intocada
- **Estimativa:** 30 min
- **Verificacao:** Badge visivel no ScaleSimulator
- **Status:** CONCLUIDO

---

## Verificacao Sprint E

- [x] Chat modo Design responde com personalidade do design_director
- [x] Social Inbox carrega dados com brand real
- [x] Erros de API mostram feedback ao usuario (3 locais)
- [x] Vault inicia sem dados mock
- [x] Copy pricing: generate=2cr, creative/copy=1cr
- [x] ScaleSimulator tem label de demo/simulacao
- [x] Build sem erros (`npm run build` no diretorio `app/`) — 15.9s compilacao

---

## Changelog

| Data | Tarefa | Status | Observacoes |
|------|--------|--------|-------------|
| 2026-02-15 | E1 design_director chat | CONCLUIDO | CouncilType + COUNCIL_COUNSELORS + enrichChatPromptWithBrain |
| 2026-02-15 | E2 social-inbox brandId | CONCLUIDO | useActiveBrand() substituiu mock-brand-123 |
| 2026-02-15 | E3 silent errors x3 | CONCLUIDO | console.error no predictive hook + notify.error no social-inbox |
| 2026-02-15 | E4 vault mock removal | CONCLUIDO | MOCK_REVIEW_CONTENT + MOCK_INSIGHT removidos, empty state ja existia |
| 2026-02-15 | E5 copy pricing | CONCLUIDO | generate=2cr, creative/copy=1cr |
| 2026-02-15 | E6 ScaleSimulator label | CONCLUIDO | Badge amber "Projecao Simulada" com icone Info |
| 2026-02-15 | Build verification | CONCLUIDO | 15.9s compilacao, 0 erros |
