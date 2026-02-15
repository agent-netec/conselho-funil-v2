# Sprint I — Verificacao Final & Testes Manuais

> Fase: Pos-Auditoria — QA Final (executado pelo usuario)
> Status: PENDENTE
> Dependencia: Sprints E, F, G, H concluidos
> Estimativa: ~3-4h de testes manuais

---

## Resumo

Sprint de checagem final executado manualmente pelo usuario. Cada item abaixo deve ser verificado no app rodando localmente (`npm run dev` no diretorio `app/`). O objetivo e confirmar que todas as alteracoes dos Sprints E-H funcionam end-to-end sem regressoes.

---

## Pre-Requisitos

- [ ] Todos os builds dos Sprints E-H passaram sem erros
- [ ] App rodando localmente em `localhost:3001`
- [ ] Brand de teste configurado com dados reais no Firebase
- [ ] `.env.local` com todas as chaves configuradas (GOOGLE_AI_API_KEY, etc.)

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

| # | Teste | Esperado | OK? |
|---|-------|----------|-----|
| 3.1 | Desconectar internet e abrir /intelligence/attribution | Mensagem de erro visivel (nao tela vazia) | [ ] |
| 3.2 | Desconectar internet e abrir /intelligence/predictive | Mensagem de erro visivel (nao tela vazia) | [ ] |
| 3.3 | Desconectar internet e abrir /social-inbox | Mensagem de erro visivel (nao tela vazia) | [ ] |

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
| 7.2 | Verificar no log/debug | Prompt contem filosofia do design_director + red_flags | [ ] |

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
| 10.3 | Verificar que MOCK_METRICS nao existe no codigo | Buscar no source (nao deve existir) | [ ] |

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
| 15.9 | Build limpo | `npm run build` no app/ sem erros | [ ] |

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

| # | Sprint | Teste | Descricao | Severidade |
|---|--------|-------|-----------|------------|
| | | | | |

### Decisao Final

- [ ] **APROVADO** — Todas as features funcionam. Pronto para commit e deploy.
- [ ] **APROVADO COM RESSALVAS** — Funciona, mas items da tabela Issues precisam de fix posterior.
- [ ] **REPROVADO** — Regressoes criticas encontradas. Voltar para sprint afetado.

---

## Pos-Aprovacao

Apos aprovacao, o agente deve:
1. Commitar todas as alteracoes dos Sprints E-H com mensagem descritiva
2. Atualizar brain/sprints/README.md com os novos sprints
3. Atualizar MEMORY.md com novos learnings (se houver)

---

## Changelog

| Data | Acao | Status | Observacoes |
|------|------|--------|-------------|
| | Testes manuais Sprint E | PENDENTE | |
| | Testes manuais Sprint F | PENDENTE | |
| | Testes manuais Sprint G | PENDENTE | |
| | Testes manuais Sprint H | PENDENTE | |
| | Testes de regressao | PENDENTE | |
| | Decisao final | PENDENTE | |
