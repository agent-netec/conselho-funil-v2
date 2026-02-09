# 🧹 PRD: Technical Debt Cleanup — Sprint 26

**Versão:** 1.0  
**Responsável:** Iuran (PM)  
**Status:** ✅ Aprovado pelo Alto Conselho  
**Data:** 06/02/2026  
**Tipo:** Stabilization (não-funcional)  
**Predecessora:** Sprint 25 (Predictive & Creative Engine) — ✅ CONCLUÍDA (10/10 stories, QA 93/100)

---

## 1. Contexto e Motivação

### O que aconteceu
Durante a validação final da Sprint 25, a QA (Dandara) executou `npx tsc --noEmit` e identificou **161 erros TypeScript em 73 arquivos**. Investigação revelou que esses erros são **pré-existentes**, acumulados progressivamente entre as Sprints 14-24. Nenhum deles foi introduzido pela Sprint 25.

### Por que agora
A dívida técnica atingiu um ponto de inflexão:
- **161 erros** mascaram erros novos em futuras sprints
- **73 arquivos** afetados criam risco de cascata em qualquer refatoração
- O TypeScript strict mode perde eficácia quando o baseline já está "vermelho"
- Cada sprint futura herda e potencialmente amplifica essa dívida

### Decisão do Alto Conselho
Em deliberação via **Party Mode** (06/02/2026), o Alto Conselho avaliou 3 planos:

| Plano | Proposta | Veredito |
|:------|:---------|:---------|
| **A** | Ignorar e seguir para Sprint 27 | ❌ Rejeitado — risco acumulativo inaceitável |
| **B** | Resolver parcialmente (apenas Tier 1) | ❌ Rejeitado — paliativo, não resolve raiz |
| **C** | Sprint dedicada para resolver todos os 161 erros | ✅ **APROVADO** por unanimidade |

**Racional:** O custo de uma sprint de cleanup agora é significativamente menor que o custo cumulativo de carregar 161 erros por mais N sprints.

---

## 2. Objetivo da Sprint

> **"Eliminar 100% da dívida técnica TypeScript acumulada, restaurando o build para zero erros e garantindo que o strict checking volte a funcionar como safety net efetiva."**

### North Star Metric
- **TypeScript Errors**: 161 → **0**
- **Comando de Validação**: `npx tsc --noEmit` retorna `Found 0 errors`

### Métricas Secundárias

| Métrica | Antes | Meta |
|:--------|:------|:-----|
| Erros TypeScript (`tsc --noEmit`) | 161 | 0 |
| Arquivos com erros | 73 | 0 |
| Build limpo sem suppressions | ❌ | ✅ |
| Mudanças de comportamento funcional | — | 0 (zero) |

---

## 3. Escopo

### 3.1 In-Scope (O que SERÁ feito)

Todos os 161 erros, organizados em 3 Tiers por criticidade:

#### Tier 1 — Runtime Blockers [P0] (~15 erros, ~1-2h)
Erros que **podem causar crash em produção** se a rota/componente for acessada.
- `useActiveBrand` destructuring incorreto (5 erros em 4 arquivos)
- Módulos inexistentes importados em rotas ativas (9 erros em 12+ arquivos)
- `params` não-Promise em route handler Next.js 15 (1 erro)

#### Tier 2 — Dead Code & Broken Tests [P1] (~100 erros, ~4-6h)
Erros em código morto, testes obsoletos e módulos legados que não impactam produção hoje, mas poluem o baseline.
- Imports de módulos inexistentes em código morto (18 erros)
- Mocks desatualizados em testes (12 erros)
- Extensões `.ts` em imports sem flag habilitada (9 erros)
- Tipos incompatíveis em módulos legados (61 erros em 25+ arquivos)

#### Tier 3 — Cosmetic & Typing [P2] (~46 erros, ~2-3h)
Erros de tipagem e breaking changes de bibliotecas que não afetam funcionalidade.
- Framer-motion breaking changes (7 erros)
- Implicit `any` em callbacks (13 erros)
- Lucide icons / imports faltantes (8 erros)
- Erros miscelâneos isolados (18 erros)

### 3.2 Out-of-Scope (O que NÃO será feito)

| Item | Justificativa |
|:-----|:-------------|
| Novas features | Sprint de estabilização, não de desenvolvimento |
| Refatoração de arquitetura | Escopo controlado — apenas fix de tipos |
| Mudança de lógica de negócio | Zero impacto funcional é requisito obrigatório |
| Atualização de dependências | Versões atuais são estáveis; não mexer |
| Migração de testes | Apenas corrigir tipos; não reescrever testes |
| Alteração do `contract-map.yaml` | Nenhuma mudança arquitetural prevista |
| Modificação de tipos da Sprint 25 | `prediction.ts`, `creative-ads.ts`, `text-analysis.ts` são intocáveis |
| Remoção de módulos | Código morto será marcado com `// TODO`, não deletado |

---

## 4. Abordagem Técnica: 3-Tier Strategy

### Validação da Estratégia

A abordagem de 3 Tiers é **correta e recomendada** pelos seguintes motivos:

1. **Priorização por risco**: Tier 1 elimina riscos de runtime primeiro, garantindo que o sistema fica mais seguro a cada etapa — mesmo se a sprint fosse interrompida.

2. **Isolamento de impacto**: Cada Tier é independente. O dev pode commitar e validar após cada Tier sem regressão.

3. **Estimativa confiável**: A distribuição 15/100/46 permite checkpoints claros de progresso. Se Tier 1 leva 2h, sabemos que o pace está correto.

4. **Rollback seguro**: Se qualquer fix introduzir regressão, o Tier pode ser revertido isoladamente via git.

### Padrões de Correção Permitidos

| Tipo de Fix | Exemplo | Permitido |
|:-----------|:--------|:----------|
| Corrigir destructuring | `const { x } = fn()` → `const x = fn()` | ✅ |
| Remover `.ts` de import | `import './foo.ts'` → `import './foo'` | ✅ |
| Adicionar stub de tipo | `export type Foo = { /* TODO */ }` | ✅ |
| Corrigir mock incompleto | Adicionar campo faltante | ✅ |
| Corrigir prop de biblioteca | `ease: [] as const` | ✅ |
| Tipar `any` explícito | `(v: number)` em callback | ✅ |
| Adicionar import faltante | `import { Icon } from 'lucide-react'` | ✅ |
| Alterar lógica de negócio | — | ❌ PROIBIDO |
| Remover funcionalidade | — | ❌ PROIBIDO |
| Alterar contratos/APIs | — | ❌ PROIBIDO |

---

## 5. Riscos e Mitigações

| # | Risco | Probabilidade | Impacto | Mitigação |
|:--|:------|:-------------|:--------|:----------|
| R1 | Fix de tipo inadvertidamente altera comportamento | Média | Alto | Regra absoluta: zero mudança de lógica. Review pós-Tier obrigatório |
| R2 | Erros em cascata: corrigir 1 tipo gera novos erros | Média | Médio | Rodar `tsc --noEmit` após cada Story, não apenas no final |
| R3 | Módulos marcados como TODO nunca são implementados | Alta | Baixo | Registrar em backlog para Sprint 27+ com link ao TODO |
| R4 | Sprint demora mais que estimado (7-11h) | Baixa | Baixo | Distribuição em Tiers permite parar em qualquer checkpoint |
| R5 | Testes que passavam com erros de tipo param de compilar | Baixa | Médio | Testes ajustados em ST-04/ST-05 — rodar suite completa no QA |

---

## 6. Critérios de Sucesso

### Definition of Done (Sprint Level)

| # | Critério | Validação |
|:--|:---------|:----------|
| CS-01 | `npx tsc --noEmit` retorna `Found 0 errors` | Dandara (QA) executa e confirma |
| CS-02 | Zero mudanças de comportamento funcional | Smoke tests passam (rotas principais acessíveis) |
| CS-03 | Nenhum `@ts-ignore` ou `@ts-expect-error` adicionado como workaround | Grep no codebase — contagem pré/pós deve ser igual ou menor |
| CS-04 | Todos os stubs marcados com `// TODO: Sprint XX` | Grep por `// TODO:` confirma |
| CS-05 | Build Next.js (`next build`) bem-sucedido | CI/build local passa |
| CS-06 | Testes existentes continuam passando | `npm test` sem regressão |

### Acceptance Criteria (por Tier)
- **Tier 1**: 0 erros TS2339, TS2307, TS2305, TS2344 em rotas ativas
- **Tier 2**: 0 erros em arquivos `__tests__/`, 0 erros TS5097, tipos legados alinhados
- **Tier 3**: 0 erros framer-motion, 0 erros TS7006/TS2304, 0 erros miscelâneos

---

## 7. Cronograma e Dependências

### Estimativa

| Fase | Estimativa | Responsável |
|:-----|:----------|:-----------|
| Tier 1 — Runtime Blockers | 1-2h | Darllyson (Dev) |
| Tier 2 — Dead Code & Tests | 4-6h | Darllyson (Dev) |
| Tier 3 — Cosmetic & Typing | 2-3h | Darllyson (Dev) |
| QA Final | 30min | Dandara (QA) |
| **Total** | **7.5-11.5h** | — |

### Dependências
- **Nenhuma dependência externa.** Todos os fixes são internos ao codebase.
- **Nenhum MCP/CLI novo necessário.** Ferramentas existentes são suficientes.
- **Sprint 25 fechada.** ✅ Confirmado em 06/02/2026.

### Sequência de Execução
```
Tier 1 → tsc check → Tier 2 → tsc check → Tier 3 → tsc check (0 erros) → QA
```

---

## 8. Impacto Funcional

### Declaração Formal
> **Esta sprint NÃO introduz, altera ou remove nenhuma funcionalidade do sistema.** Todas as mudanças são restritas à camada de tipagem TypeScript. O comportamento em runtime permanece idêntico antes e depois da execução.

### O que muda
- Tipos mais precisos em interfaces e parâmetros
- Imports corrigidos ou stubados
- Mocks de teste alinhados com interfaces atuais
- Breaking changes de bibliotecas corrigidas

### O que NÃO muda
- Lógica de negócio
- Fluxos de usuário
- APIs e contratos
- Dados persistidos
- Comportamento visual

---

## 9. Registro de Decisão do Alto Conselho

| Campo | Valor |
|:------|:------|
| **Data** | 06/02/2026 |
| **Modalidade** | Party Mode (deliberação multi-persona) |
| **Participantes** | Iuran (PM), Athos (Arch), Leticia (SM), Darllyson (Dev), Dandara (QA) |
| **Questão** | Como tratar 161 erros TypeScript pré-existentes? |
| **Opções avaliadas** | Plano A (ignorar), Plano B (parcial), Plano C (sprint dedicada) |
| **Decisão** | **Plano C — Sprint dedicada de cleanup** |
| **Votação** | Unanimidade (5/5) |
| **Racional** | Custo imediato (~8-11h) << Custo cumulativo de carregar dívida por N sprints futuras |
| **Condição** | Zero impacto funcional; sem remoção de código; stubs com TODO |

---

## 10. Artefatos de Referência

| Artefato | Caminho |
|:---------|:--------|
| Story Pack (Stories) | `_netecmt/packs/stories/sprint-26-tech-debt-cleanup/stories.md` |
| Allowed Context | `_netecmt/packs/stories/sprint-26-tech-debt-cleanup/allowed-context.md` |
| Error Inventory | `_netecmt/packs/stories/sprint-26-tech-debt-cleanup/error-inventory.md` |
| Sprint Ativa | `_netecmt/sprints/ACTIVE_SPRINT.md` |
| PRD Sprint 25 (predecessor) | `_netecmt/solutioning/prd/prd-sprint-25-predictive-creative-engine.md` |

---

*PRD formalizado por Iuran (PM) — NETECMT v2.0*  
*Sprint 26: Technical Debt Cleanup | 06/02/2026*  
*Tipo: Stabilization Sprint | North Star: tsc --noEmit = 0 erros*
