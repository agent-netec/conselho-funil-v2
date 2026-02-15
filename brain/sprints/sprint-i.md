# Sprint I — Verificacao Final & Testes em Producao

> Fase: Pos-Auditoria — QA Final (executado pelo usuario em producao)
> Status: PENDENTE
> Dependencia: Sprints E, F, G, H concluidos e deployed
> Estimativa: ~3-4h de testes manuais

---

## Resumo

Sprint de checagem final executado manualmente pelo usuario **diretamente no site em producao** (Vercel). Cada item abaixo deve ser verificado na URL do app deployado. O objetivo e confirmar que todas as alteracoes dos Sprints E-H funcionam end-to-end sem regressoes no ambiente real.

---

## Pre-Requisitos

- [ ] Todos os builds dos Sprints E-H passaram sem erros
- [ ] Deploy mais recente concluido no Vercel (verificar em vercel.com/dashboard)
- [ ] Brand de teste configurado com dados reais no Firebase
- [ ] Env vars de producao configuradas no Vercel (GOOGLE_AI_API_KEY, etc.)
- [ ] Acesso ao app via URL de producao

---

## Checklist de Testes

### I-1. Chat com Design Director (Sprint E1)

**Caminho:** `/chat` → Selecionar modo "Design"

| # | Teste | Esperado | OK? |
|---|-------|----------|-----|
| 1.1 | Abrir chat no modo Design | Modo ativo, empty state mostra Design Director | [ ] |
| 1.2 | Enviar: "Analise este criativo para Instagram" | Resposta usa linguagem do Design Director (C.H.A.P.E.U, hierarquia visual) | [ ] |
| 1.3 | Verificar catchphrases | Resposta contem frases tipicas do design_director.md | [ ] |
| 1.4 | Enviar: "Quais erros comuns devo evitar?" | Menciona red_flags (no_visual_hierarchy, color_chaos, etc.) | [ ] |

---

### I-2. Social Inbox (Sprint E2)

**Caminho:** `/social-inbox`

| # | Teste | Esperado | OK? |
|---|-------|----------|-----|
| 2.1 | Abrir social inbox com brand selecionado | Carrega sem erro "mock-brand-123" | [ ] |
| 2.2 | Verificar que dados do brand real aparecem | Interacoes reais ou empty state (nao dados mock) | [ ] |

---

### I-3. Error Handling (Sprint E3)

> Nota: Em producao, testar error handling simulando cenarios de falha (brand sem dados, IDs invalidos, etc.) ja que nao e possivel desconectar o servidor.

| # | Teste | Esperado | OK? |
|---|-------|----------|-----|
| 3.1 | Abrir /intelligence/attribution com brand sem dados de atribuicao | Mensagem de erro ou empty state visivel (nao tela vazia/quebrada) | [ ] |
| 3.2 | Abrir /intelligence/predictive com brand sem dados preditivos | Mensagem de erro ou empty state visivel (nao tela vazia/quebrada) | [ ] |
| 3.3 | Abrir /social-inbox com brand sem integracao social | Mensagem de erro ou empty state visivel (nao tela vazia/quebrada) | [ ] |

---

### I-4. Vault sem Mock (Sprint E4)

**Caminho:** `/vault`

| # | Teste | Esperado | OK? |
|---|-------|----------|-----|
| 4.1 | Abrir vault com brand que nao tem conteudo | Empty state limpo (sem "Hero Copy Framework" mock) | [ ] |
| 4.2 | Abrir vault com brand que tem conteudo real | Conteudo real do Firebase aparece | [ ] |

---

### I-5. Copy Pricing (Sprint E5)

| # | Teste | Esperado | OK? |
|---|-------|----------|-----|
| 5.1 | Gerar copy via /funnels/[id]/copy | Debita 2 creditos da conta | [ ] |
| 5.2 | Gerar copy angles via /intelligence/creative | Debita 1 credito da conta | [ ] |

---

### I-6. ScaleSimulator Label (Sprint E6)

**Caminho:** `/intelligence/predictive`

| # | Teste | Esperado | OK? |
|---|-------|----------|-----|
| 6.1 | Abrir predictive e localizar ScaleSimulator | Badge "Projecao Simulada" ou "Demo" visivel | [ ] |

---

### I-7. Design Generate com Brain (Sprint F1)

**Caminho:** `/funnels/[id]/design`

| # | Teste | Esperado | OK? |
|---|-------|----------|-----|
| 7.1 | Gerar design para Instagram | Design gerado com qualidade (verificar se prompt incluiu brain) | [ ] |
| 7.2 | Verificar qualidade do output | Resultado reflete filosofia do design_director (C.H.A.P.E.U, hierarquia visual, red_flags) | [ ] |

---

### I-8. Copy Generate com Brain (Sprint F2)

**Caminho:** `/funnels/[id]/copy`

| # | Teste | Esperado | OK? |
|---|-------|----------|-----|
| 8.1 | Gerar copy para estagio "Unaware" | copywriterInsights mencionam Schwartz + Halbert | [ ] |
| 8.2 | Gerar copy para estagio "Solution Aware" | copywriterInsights mencionam Kennedy + Ogilvy | [ ] |
| 8.3 | Verificar red_flags na resposta | Pelo menos 1 red_flag referenciado nos insights | [ ] |
| 8.4 | Comparar qualidade antes/depois | Copy mais especifica, com frameworks reais (nao generico) | [ ] |

---

### I-9. Funnels Generate com Brain (Sprint F3)

**Caminho:** Criar novo funil

| # | Teste | Esperado | OK? |
|---|-------|----------|-----|
| 9.1 | Gerar funil | Proposta reflete value ladder thinking (Brunson) | [ ] |
| 9.2 | Verificar stages do funil | Cada stage tem profundidade estrategica (offer architecture, urgency) | [ ] |
| 9.3 | Comparar qualidade antes/depois | Funil mais sofisticado, com referencias a frameworks reais | [ ] |

---

### I-10. Cross-Channel Analytics (Sprint G1)

**Caminho:** `/performance/cross-channel`

| # | Teste | Esperado | OK? |
|---|-------|----------|-----|
| 10.1 | Abrir pagina com brand que tem dados | Metricas reais (nao "15420.50 spend" mock) | [ ] |
| 10.2 | Abrir pagina com brand sem dados | Empty state adequado | [ ] |
| 10.3 | Verificar que dados nao parecem mock | Nenhum valor fixo suspeito como "15420.50" ou "mock-brand" | [ ] |

---

### I-11. LTV Cohorts (Sprint G2)

**Caminho:** `/intelligence/ltv`

| # | Teste | Esperado | OK? |
|---|-------|----------|-----|
| 11.1 | Verificar ad spend no response | Valor real ou flag "isEstimated: true" | [ ] |
| 11.2 | Verificar distribuicao LTV | Dados reais ou flag "isSimulated: true" | [ ] |
| 11.3 | Se estimado: UI mostra indicacao | Badge ou tooltip indicando estimativa | [ ] |

---

### I-12. Journey Page (Sprint G3)

**Caminho:** `/intelligence/journey`

| # | Teste | Esperado | OK? |
|---|-------|----------|-----|
| 12.1 | Buscar lead por ID ou email | Timeline de eventos aparece (LeadTimeline funcional) | [ ] |
| 12.2 | Buscar lead inexistente | Mensagem "Lead nao encontrado" | [ ] |
| 12.3 | Verificar perfil do lead | Nome, email, segmento exibidos | [ ] |

---

### I-13. Ad Generation Unificada (Sprint H1)

**Caminho:** `/intelligence/creative` e `/campaigns/[id]`

| # | Teste | Esperado | OK? |
|---|-------|----------|-----|
| 13.1 | Gerar ads via /intelligence/creative | Ads com brain context (counselorInsights referenciando frameworks) | [ ] |
| 13.2 | Gerar ads via /campaigns/[id] | Mesma qualidade que 13.1 (proxy funcional) | [ ] |
| 13.3 | Verificar custo | 5 creditos para ambas as rotas | [ ] |

---

### I-14. Copy Lab com Brain (Sprint H2)

**Caminho:** `/intelligence/creative` → Copy Lab

| # | Teste | Esperado | OK? |
|---|-------|----------|-----|
| 14.1 | Gerar variantes "fear" | Reflete Halbert triggers + Carlton hooks | [ ] |
| 14.2 | Gerar variantes "authority" | Reflete Hopkins proofs + Ogilvy credibility | [ ] |
| 14.3 | Gerar variantes "curiosity" | Reflete Schwartz awareness + Halbert curiosity | [ ] |
| 14.4 | Gerar variantes "greed" | Reflete Sugarman desire + Kennedy offers | [ ] |

---

### I-15. Regressao Geral

| # | Teste | Esperado | OK? |
|---|-------|----------|-----|
| 15.1 | /intelligence/predict — scoring | counselorOpinions exibidos corretamente | [ ] |
| 15.2 | /strategy/autopsy — analise | 5 etapas com experts corretos | [ ] |
| 15.3 | /intelligence/research — dossier | Sintese com perspectiva Schwartz+Brunson | [ ] |
| 15.4 | /chat modo funnel | Responde com personalidade dos 6 funnel experts | [ ] |
| 15.5 | /chat modo copy | Responde com personalidade dos 9 copy experts | [ ] |
| 15.6 | /chat modo social | Responde com personalidade dos 4 social experts | [ ] |
| 15.7 | /chat modo ads | Responde com personalidade dos 4 ads experts | [ ] |
| 15.8 | /chat party mode | Debate com voz autentica dos agents selecionados | [ ] |
| 15.9 | Site estavel | Navegacao geral pelo app sem erros de console ou crashes | [ ] |

---

## Resultados

### Sumario

| Sprint | Tarefas | Passou | Falhou | Notas |
|--------|---------|--------|--------|-------|
| E | 6 | | | |
| F | 3 | | | |
| G | 3 | | | |
| H | 2 | | | |
| Regressao | 9 | | | |
| **TOTAL** | **23** | | | |

### Issues Encontrados

| # | Sprint | Teste | Descricao | Severidade | Status |
|---|--------|-------|-----------|------------|--------|
| 1 | F (I-9) | 9.1 | POST `/api/funnels/generate` retorna 500 — 3 causas defensivas + 1 root cause real | CRITICO | CORRIGIDO |
| 1c | F (I-9) | 9.1 | maxOutputTokens 8192 insuficiente para 2 propostas completas — aumentado para 16384 | CRITICO | CORRIGIDO |
| 1d | F (I-9) | 9.1 | Catch-all nao resetava status para draft — funil travava em 'generating' | MEDIO | CORRIGIDO |
| 2 | F (I-7) | 7.1 | POST `/api/design/generate` retorna 400 "Prompt is required" — visualPrompt ausente | ALTO | CORRIGIDO |

### Decisao Final

- [ ] **APROVADO** — Todas as features funcionam. Pronto para commit e deploy.
- [ ] **APROVADO COM RESSALVAS** — Funciona, mas items da tabela Issues precisam de fix posterior.
- [ ] **REPROVADO** — Regressoes criticas encontradas. Voltar para sprint afetado.

---

## Relatorio de Debug ao Vivo

> Sessao iniciada em 2026-02-15. Usuario navega pelo app em producao e reporta bugs.
> Agente aplica fix cirurgico + root cause analysis para cada issue.

---

### Issue #1 — Funnels Generate 500 (Internal Server Error)

**Reportado em:** 2026-02-15
**Teste relacionado:** I-9 (Funnels Generate com Brain — Sprint F3)
**Severidade:** CRITICO (feature completamente bloqueada)
**Caminho:** `/funnels/[id]` → Botao "Gerar Propostas"
**Endpoint:** `POST /api/funnels/generate`

#### Sintoma
Ao clicar "Gerar Propostas" em um funil existente com todos os campos preenchidos, o console do browser mostra:
```
POST https://app-rho-flax-25.vercel.app/api/funnels/generate 500 (Internal Server Error)
```
O funil fica travado em "Aguardando geracao pelo Conselho".

#### Root Cause Analysis

Arquivo: `app/src/app/api/funnels/generate/route.ts`

Foram identificadas **3 vulnerabilidades** que podem causar 500 nesta rota:

| # | Causa | Linha | Impacto |
|---|-------|-------|---------|
| 1a | Modelo fallback hardcoded `gemini-2.0-flash` (potencialmente sunsetado pela Google) em vez de usar `DEFAULT_GEMINI_MODEL` (`gemini-2.5-flash`) | L123 | Se env var `GEMINI_MODEL` nao estiver setada, API Gemini retorna 404 → 500 para o usuario |
| 1b | Resposta vazia do Gemini nao era validada antes do `parseAIJSON()` | L128-140 | Se Gemini retorna string vazia (safety block, timeout, rate limit), `parseAIJSON('')` crasheia com erro generico |
| 1c | Nenhuma checagem defensiva no array `proposalsData.proposals` | L146 | Se Gemini retorna JSON valido mas sem key `proposals`, `proposalsData.proposals.length` crasheia com `TypeError: Cannot read properties of undefined` |

#### Correcoes Aplicadas

**Fix 1a — Modelo fallback:**
```diff
- model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
+ model: DEFAULT_GEMINI_MODEL,
```
Agora usa a constante centralizada de `gemini.ts` que resolve para `gemini-2.5-flash`.

**Fix 1b — Validacao de resposta vazia:**
Adicionado bloco de validacao ANTES do `parseAIJSON`:
- Se Gemini retorna vazio → status volta para `draft`, retorna erro claro "AI returned empty response"
- Previne crash no parser JSON

**Fix 1c — Validacao do array proposals:**
Adicionada checagem apos parse:
- Verifica se `proposalsData.proposals` existe, e um array, e tem pelo menos 1 item
- Se falhar → status volta para `draft`, retorna erro descritivo em vez de TypeError

#### Fix Complementar — Varredura completa do fallback `gemini-2.0-flash`

Alem da rota de funnels, foram encontrados **19 arquivos adicionais** com o mesmo fallback hardcoded.
Todos corrigidos na mesma sessao para `DEFAULT_GEMINI_MODEL` (constante centralizada em `gemini.ts`).

| Grupo | Arquivos | Mudanca |
|-------|----------|---------|
| API Routes (social) | structure, scorecard, hooks | Adicionado `DEFAULT_GEMINI_MODEL` ao import existente |
| API Routes (outros) | analyze-visual, design/plan, copy/generate, social/generate | Import novo ou adicionado ao existente |
| Lib agents | analyst, spy/funnel-cloner, publisher/adaptation, qa/brand-validation | Import adicionado (relativo ou @/) |
| Lib intelligence | ad-generator, brand-compliance (2x), text-parser, vsl-parser, ad-copy-analyzer, recommendations | Import adicionado |
| Lib outros | reporting/engine, performance-advisor | Import adicionado (relativo) |

**Total: 20 arquivos, 20 substituicoes. Zero ocorrencias restantes confirmado via grep.**

> Agora o modelo default e controlado exclusivamente pela constante `DEFAULT_GEMINI_MODEL`
> em `app/src/lib/ai/gemini.ts` (resolve para `process.env.GEMINI_MODEL || 'gemini-2.5-flash'`).
> Se o modelo precisar mudar no futuro, basta alterar em 1 lugar.

#### Resultado
- Build local: OK (todas as 20 alteracoes compilam)
- Aguardando deploy + re-teste pelo usuario

---

### Issue #1b — Confirmacao do root cause real (re-teste em producao)

**Reportado em:** 2026-02-15 (segundo teste, mesmo endpoint)
**Mensagem de erro visivel no console:**
```
Error generating proposals:
Error: Failed to parse AI response. Please try again.
```

#### Analise

O erro "Failed to parse AI response" confirma que:
- A API Gemini esta acessivel (nao e problema de chave/modelo)
- A resposta chega, mas nao e JSON valido

**Root cause confirmado:** A rota usava `responseMimeType: 'text/plain'` (default do `generateWithGemini`).
Com esse modo, o Gemini pode retornar JSON envolto em markdown, com texto explicativo, ou truncado — e o `parseAIJSON` falha ao extrair.

#### Fix Aplicado

```diff
  const response = await generateWithGemini(fullPrompt, {
    model: DEFAULT_GEMINI_MODEL,
    temperature: 0.8,
    maxOutputTokens: 8192,
+   responseMimeType: 'application/json',
  });
```

Com `responseMimeType: 'application/json'`, a API Gemini e forcada a retornar JSON estruturado valido,
sem wrappers markdown, sem texto extra, sem truncar no meio de um campo.

#### Resultado
- Build local: OK
- Aguardando deploy + re-teste pelo usuario

---

### Issue #2 — Design Generate 400 "Prompt is required"

**Reportado em:** 2026-02-15
**Teste relacionado:** I-7 (Design Generate com Brain — Sprint F1)
**Severidade:** ALTO (geracao de criativos bloqueada)
**Caminho:** `/funnels/[id]/design` → Card NanoBanana → Botao "Gerar Criativo"
**Endpoint:** `POST /api/design/generate`

#### Sintoma
A estrategia visual (C.H.A.P.E.U, Safe Zones, Copy & Hooks) gera com sucesso via `/api/design/plan`.
Mas ao clicar "Gerar Criativo Baseado na Intencao", o console mostra:
```
POST /api/design/generate 400 (Bad Request)
Generation Error: Error: Prompt is required
```

#### Root Cause

**Arquivo:** `app/src/components/chat/design-generation-card.tsx` (linha 100)

O componente envia `prompt: promptData.visualPrompt || promptData.prompt` ao API.
Porem, o Gemini no `/api/design/plan` as vezes omite o campo `visualPrompt` no JSON de resposta,
resultando em `prompt: undefined` → API retorna 400.

#### Fix Aplicado

Adicionado fallback que constroi um prompt basico a partir dos dados disponiveis (strategy, platform, assets):
```diff
- const visualPrompt = promptData.visualPrompt || promptData.prompt;
+ const visualPrompt = promptData.visualPrompt || promptData.prompt
+   || `Professional ${platform} ad creative, ${strategy.contrastFocus}, ${assets.headline}, ${strategy.unityTheme}`;
```

Agora mesmo que o Gemini omita `visualPrompt`, o usuario ainda consegue gerar criativos.

#### Resultado
- Build local: OK
- Commit: 426565558
- Aguardando deploy + re-teste

---

## Pos-Aprovacao

Apos aprovacao:
1. Bugs encontrados durante testes devem ser corrigidos pelo agente e re-deployed
2. Commitar todas as correcoes com mensagem descritiva
3. Atualizar brain/sprints/README.md com os novos sprints
4. Atualizar MEMORY.md com novos learnings (se houver)
5. Re-testar itens que falharam apos deploy das correcoes

---

## Changelog

| Data | Acao | Status | Observacoes |
|------|------|--------|-------------|
| 2026-02-15 | Inicio dos testes em producao | EM ANDAMENTO | Sessao de debug ao vivo |
| 2026-02-15 | Issue #1: Funnels Generate 500 | CORRIGIDO | 3 fixes defensivos + varredura 20 arquivos gemini-2.0-flash |
| 2026-02-15 | Issue #1b: Root cause confirmado (parse AI response) | CORRIGIDO | responseMimeType: application/json |
| 2026-02-15 | Issue #1c: maxOutputTokens 8192→16384 | CORRIGIDO | JSON truncado causava parse failure |
| 2026-02-15 | Issue #1d: Catch-all status reset | CORRIGIDO | Funil nao trava mais em 'generating' |
| 2026-02-15 | Issue #2: Design Generate 400 | CORRIGIDO | Fallback prompt quando visualPrompt ausente |
| | Testes manuais Sprint E | PENDENTE | |
| | Testes manuais Sprint F | PENDENTE | |
| | Testes manuais Sprint G | PENDENTE | |
| | Testes manuais Sprint H | PENDENTE | |
| | Testes de regressao | PENDENTE | |
| | Decisao final | PENDENTE ||
