# Plano: Automation Control Center v2

**Status:** PLANEJADO — depende de OAuth Meta/Google (Sprint L) para ter dados reais.
**Data:** 2026-02-16

---

## Estado Atual (Diagnóstico)

### O que está funcionando
- **Regras no Firestore** — CRUD completo (`brands/{brandId}/automation_rules`)
- **Logs de auditoria** — Persistidos com timestamps (`brands/{brandId}/automation_logs`)
- **Guardrails** — Aprovação humana obrigatória, cooldown por regra, dedup de pendências
- **Kill-Switch** — `api/automation/kill-switch` pausa tudo em emergência
- **Dead Letter Queue** — Webhooks falhados com retry (máx 3 tentativas)
- **Evaluation Engine** — `evaluateBrandRules()` compara regras vs métricas, respeita cooldown/dedup
- **Notificações in-app** — Badge no sidebar quando regra dispara

### O que está quebrado/incompleto
- **Overview hardcoded** — "142 ações" e "R$ 12.450" são literais no JSX (`automation-control-center.tsx:113,123`). Enganoso.
- **Sem dados reais de ads** — `fetchMetricsWithCache()` depende de OAuth Meta/Google que não existe
- **Ações não executam** — Aprovar "pausar ads" muda status no Firestore, não pausa nada real
- **Regras unidimensionais** — Apenas "se X > Y → Z". Sem composição, tendências ou correlações
- **Zero interconexão com Conselheiros** — Os 4 conselheiros de Ads (Justin Brooke, Nicholas Kusmich, Jon Loomer, Savannah Sanchez) existem no brain mas são ignorados
- **Copy Refactor hardcoded** — Aba "Refatoração" usa `frictionPoint` e `originalCopy` fixos no código
- **Cron não configurado** — `api/cron/automation-evaluate` existe mas não está no vercel.json

### Quem usa vs quem deveria usar
| Hoje | Ideal |
|------|-------|
| Ninguém (sem dados reais) | Gestor de tráfego que roda ads |
| Manual (clicar "Rodar Avaliação") | Automático (hourly + event-driven) |
| Apenas métricas de ads | Métricas de ads + funil + social + atribuição |
| Ações genéricas | Ações contextuais com parecer do Conselho |

---

## Arquitetura Ideal (v2)

```
Dados Reais (Meta/Google/Pixel)
        ↓
Event Bus (webhook ou cron)
        ↓
Regras Compostas (multi-condição + tendência)
        ↓
Consulta ao Conselho de Ads (4 conselheiros opinam)
        ↓
Sugestão com contexto ("Pausar porque X, Y, Z")
        ↓
Aprovação humana com 1-click
        ↓
Execução real via API (Meta Marketing API / Google Ads API)
        ↓
Feedback loop (a ação melhorou? alimenta aprendizado)
```

---

## Decisão: Cron vs n8n vs Serverless

| Abordagem | Prós | Contras | Veredicto |
|-----------|------|---------|-----------|
| **Vercel Cron** (atual) | Zero infra extra, já no ecossistema | 1 exec/hora (hobby), timeout 10s/60s, sem retry nativo, sem visual flow | **Suficiente para MVP** |
| **n8n (self-hosted)** | Visual, workflows complexos, retry nativo, 400+ integrações | Mais um servidor, custo, complexidade operacional | **Overkill agora, ideal se tiver VPS** |
| **Inngest / Trigger.dev** | Serverless, integra com Vercel, retry nativo, event-driven, jobs longos (15min) | Curva de aprendizado, mais uma dep | **Melhor custo-benefício** |

**Recomendação:** Vercel Cron para MVP. Migrar para Inngest/Trigger.dev quando OAuth estiver ativo e houver volume real de dados. n8n só se tiver VPS dedicado e workflows que não-devs precisem editar.

---

## Fase 1 — Corrigir Overview & Conectar Dados Existentes (Quick Win)

### 1.1 Substituir valores hardcoded por queries reais
- **Arquivo:** `app/src/components/performance/automation-control-center.tsx`
- **"142 Ações Executadas (24h)"** → `logs.filter(l => l.status === 'executed' && last24h(l.timestamp)).length`
- **"R$ 12.450 Budget"** → Somar `adjustmentValue` dos logs executados, ou mostrar "Sem dados" se vazio
- **"+12% vs ontem"** → Comparar count de hoje vs ontem, ou esconder

### 1.2 Conectar Copy Refactor a dados reais
- **Arquivo:** `app/src/app/automation/page.tsx` (linhas 307-308)
- Em vez de strings hardcoded, puxar do último resultado de Autópsia (`/strategy/autopsy`)
- Se não houver autópsia, mostrar empty state

### 1.3 Configurar Vercel Cron
- **Arquivo:** `vercel.json`
- Adicionar: `{ "crons": [{ "path": "/api/cron/automation-evaluate", "schedule": "0 * * * *" }] }`
- Proteger com CRON_SECRET (já existe no env)

### Créditos: 0 (operação interna)

---

## Fase 2 — Regras Compostas & Tendências

### 2.1 Regras multi-condição
- **Arquivo:** `app/src/lib/automation/engine.ts`
- Expandir trigger para suportar `conditions: Condition[]` com operador lógico (AND/OR)
- Exemplo: "CPA > 50 AND CTR < 1% AND running_days > 3"

### 2.2 Detecção de tendências
- Novo tipo de trigger: `trend`
- Compara métricas dos últimos N dias em vez de snapshot único
- Exemplo: "CPA subindo 3 dias consecutivos"

### 2.3 Atualizar UI de criação de regras
- **Arquivo:** `app/src/app/automation/page.tsx` (modal de criação)
- Multi-condição com UI de "adicionar condição"
- Seletor de período para tendências

### Créditos: 0

---

## Fase 3 — Consulta ao Conselho antes de agir (Sprint L+)

### 3.1 Debate de Ads quando regra dispara
- **Reutilizar:** `buildPartyPrompt()` + `buildPartyBrainContext()`
- Quando regra dispara, antes de criar log `pending_approval`:
  1. Montar contexto: regra, métricas atuais, tendência
  2. Consultar 4 conselheiros de Ads (justin_brooke, nicholas_kusmich, jon_loomer, savannah_sanchez)
  3. Cada um opina: concordo/discordo + justificativa
  4. Veredito final: ação recomendada com nível de confiança
- **Modelo:** PRO_GEMINI_MODEL (decisão crítica)
- Persistir parecer no `automation_log.context.councilDebate`

### 3.2 Exibir parecer na UI de aprovação
- Quando usuário vê ação pendente, mostra o parecer do conselho
- "3 de 4 conselheiros recomendam pausar. Justin Brooke discorda porque..."
- Ajuda na decisão humana

### Créditos: 1 por consulta ao conselho

---

## Fase 4 — OAuth & Execução Real (Sprint L)

### 4.1 Meta Marketing API
- OAuth flow para conectar conta de ads
- Read: métricas de campanhas, adsets, ads
- Write: pausar/ativar campanhas, ajustar budget
- **Arquivos novos:** `app/src/lib/integrations/ads/meta-oauth.ts`, `meta-ads-api.ts`

### 4.2 Google Ads API
- OAuth flow para conectar Google Ads
- Read: métricas
- Write: pausar/ativar, ajustar budget
- **Arquivos novos:** `app/src/lib/integrations/ads/google-oauth.ts`, `google-ads-api.ts`

### 4.3 Execução real de ações
- Quando log é aprovado, executar via API da plataforma
- Atualizar status: `executed` + `executionResult` (sucesso/falha + detalhes)
- Se falhar → Dead Letter Queue (já existe)

### 4.4 Webhook receivers
- Receber dados de conversão em real-time (Meta CAPI, Google conversions)
- Atualizar métricas no cache
- Trigger avaliação de regras event-driven (não só cron)

---

## Fase 5 — Feedback Loop & Aprendizado

### 5.1 Medir impacto das ações
- Após execução, monitorar métricas por 24-72h
- Comparar before/after: "Pausar ads reduziu CPA em 23%"
- Salvar como case study para RAG

### 5.2 Sugestões proativas
- Se padrão se repete (mesma regra dispara 3x em 2 semanas), sugerir regra automática
- Score de confiança baseado em histórico

### 5.3 Dashboard real
- Timeline de ações com impacto medido
- ROI das automações (quanto economizou/ganhou)
- Métricas ao vivo dos ads conectados

---

## Arquivos Críticos

| Arquivo | Fase | Ação |
|---------|------|------|
| `app/src/components/performance/automation-control-center.tsx` | 1 | Trocar hardcoded por queries reais |
| `app/src/app/automation/page.tsx` | 1,2 | Conectar refactor a dados reais + multi-condição |
| `vercel.json` | 1 | Configurar cron |
| `app/src/lib/automation/engine.ts` | 2 | Regras compostas + tendências |
| `app/src/lib/automation/evaluate.ts` | 3 | Consulta ao conselho antes de criar log |
| `app/src/types/automation.ts` | 2,3 | Expandir tipos para multi-condição + council debate |

## Arquivos Novos

| Arquivo | Fase |
|---------|------|
| `app/src/lib/integrations/ads/meta-oauth.ts` | 4 |
| `app/src/lib/integrations/ads/meta-ads-api.ts` | 4 |
| `app/src/lib/integrations/ads/google-oauth.ts` | 4 |
| `app/src/lib/integrations/ads/google-ads-api.ts` | 4 |

## Dependências entre módulos

```
Sprint I (QA) → Sprint J (Social v2) → Sprint K (SEO/Keywords)
                                      ↘
                                        Sprint L (OAuth + Tracking Pixel)
                                              ↓
                                        Sprint M (Automation v2 — Fases 3-5)
```

**Fase 1-2 da Automation podem ser feitas em paralelo** com qualquer sprint (não dependem de OAuth).
**Fases 3-5 dependem do Sprint L** (OAuth Meta/Google).
