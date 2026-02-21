# Backlog de Pendências — Conselho de Funil v2

> Gerado em: 2026-02-20
> Base: Auditoria completa de todos os roadmaps vs código atual

---

## Legenda

- **IND** = Independente (pode ser feito a qualquer momento)
- **DEP** = Depende de outra tarefa
- **OAuth** = Depende do Sprint L (OAuth real com Meta/Google/X)
- Prioridade: P0 (crítico) > P1 (alto impacto) > P2 (nice-to-have)

---

## FRENTES 100% COMPLETAS (nada pendente)

| Frente | Status | Último commit |
|--------|--------|---------------|
| Offer Lab v2 (F0→F4) | ✅ 100% | Sessão atual |
| Brand Hub v2 (F1+F2) | ✅ 100% | `48ae023f5` + `d130e4724` |
| Assets v2 F1 (4 bugs) | ✅ 100% | `5ea20cb8f` |
| Settings v2 F1 (saves reais) | ✅ 100% | `efd898764` |

---

## PENDÊNCIAS ATIVAS (ordenadas por dependência)

### Camada 1 — Independentes (podem ser feitas em paralelo)

#### 1. Vault v2 F1 — Completar (~35% restante)
**Prioridade:** P1
**Dependência:** IND
**Esforço estimado:** Médio

| # | Tarefa | Arquivo(s) | Status |
|---|--------|-----------|--------|
| V1 | Criar CRON route `/api/cron/content-autopilot` | `app/src/app/api/cron/content-autopilot/route.ts` (novo) | ❌ Não existe |
| V2 | Conectar botão "+ Novo Ativo" (hoje é toast stub) | `app/src/app/vault/page.tsx` | ❌ Toast only |
| V3 | Conectar botão "Histórico" (hoje é toast stub) | `app/src/app/vault/page.tsx` | ❌ Toast only |
| V4 | Implementar "Ver Detalhes" no Explorer | `app/src/components/vault/vault-explorer.tsx` | ❌ Sem handler |
| V5 | Conectar Settings tab toggles a Firestore | `app/src/app/vault/page.tsx` (seção settings) | ❌ UI-only |

**Ordem interna:** V1 → V2 → V3 (independentes entre si), V4 e V5 também independentes.

**Detalhes V1 (CRON):**
- Criar rota que chama `ContentCurationEngine.runCurationCycle()` + `AdaptationPipeline.adaptInsight()`
- Proteger com `CRON_SECRET` (padrão já usado em outros crons)
- Adicionar ao `vercel.json` crons array (schedule: `0 */6 * * *` — a cada 6h)

**Detalhes V2 (+ Novo Ativo):**
- Substituir `toast("Em breve")` por modal com 3 opções: DNA Template, Media Asset, Manual Post
- DNA Template já tem wizard (`dna-wizard.tsx`) — só precisa abrir
- Media Asset → redirecionar para `/assets` com upload
- Manual Post → abrir form inline para criar post draft direto na Review Queue

**Detalhes V3 (Histórico):**
- Drawer/modal listando items do Review Queue com status `approved`/`rejected`
- Query: `brands/{brandId}/review_queue` filtrado por status, ordenado por `updatedAt desc`

**Detalhes V4 (Ver Detalhes):**
- Abrir modal com dados completos do DNA/asset selecionado no Explorer
- Mostrar: tags, structure, tone, CTA style, usage count

**Detalhes V5 (Settings toggles):**
- Auto-approve threshold → salvar em `brands/{brandId}` campo `vaultSettings.autoApproveThreshold`
- Direct publish toggle → mostrar "Requer OAuth (Sprint L)" como disabled
- Notification prefs → salvar em user preferences (mesmo padrão de Settings v2)

---

#### 2. Calendar v2 F1 — Completar (~15% restante)
**Prioridade:** P2
**Dependência:** IND
**Esforço estimado:** Pequeno

| # | Tarefa | Arquivo(s) | Status |
|---|--------|-----------|--------|
| C1 | Preview de post no modal de criação | `app/src/app/content/calendar/page.tsx` | ❌ Não existe |
| C2 | Estilização visual por status no calendário | `app/src/app/content/calendar/page.tsx` | ❌ Sem cores |

**Detalhes C1:**
- Ao preencher título + conteúdo + plataforma, mostrar preview card simulando como ficaria
- Componente simples: card com avatar da brand, texto formatado, timestamp

**Detalhes C2:**
- draft → borda cinza (`border-zinc-700`)
- pending_review → borda amarela (`border-amber-500`)
- approved → borda verde (`border-green-500`)
- published → borda azul (`border-blue-500`)
- rejected → borda vermelha (`border-red-500`)

---

#### 3. Social v2 J4 — Completar KB Upload (~20% restante)
**Prioridade:** P2
**Dependência:** IND
**Esforço estimado:** Pequeno

| # | Tarefa | Arquivo(s) | Status |
|---|--------|-----------|--------|
| S1 | UI para upload de docs de Knowledge Base social | Componente novo ou integrar no painel social | ❌ Pipeline existe mas sem UI |
| S2 | Categorização automática de best practices | `/api/social/knowledge` | ⚠️ Parcial |

**Detalhes S1:**
- Botão "Adicionar Conhecimento" no painel social
- Aceitar: URLs de artigos, PDFs, texto colado
- Processar via pipeline existente (RAG + Pinecone com namespace social)

---

### Camada 2 — Dependem de Social v2 completo

#### 4. Calendar v2 F2 — Integração com Social
**Prioridade:** P1
**Dependência:** DEP (Social v2 J1-J5 completo + QA)
**Esforço estimado:** Médio

| # | Tarefa | Detalhes |
|---|--------|---------|
| C3 | Gerar semana a partir de hooks do Social | Conectar `/api/content/calendar/generate-week` com output do Social wizard |
| C4 | Arrastar post social para o calendário | Drag-and-drop de hooks aprovados para slots do calendário |

---

### Camada 3 — Dependem de OAuth (Sprint L)

> **Nenhuma destas deve ser iniciada até Sprint L estar concluído.**
> Sprint L = OAuth real com Meta Business, Google Ads, X/Twitter API.

| Frente | Fase | O que falta | Dependência |
|--------|------|-------------|-------------|
| Social v2 | J6 (Command Center) | OAuth real, sentiment real, envio real, sync, dashboard | OAuth |
| Assets v2 | F3 | Sync automático de assets com plataformas | OAuth |
| Vault v2 | F4 | Publicação direta (sem copiar/colar) | OAuth |
| Settings v2 | F3 | Configuração de tokens OAuth por plataforma | OAuth |
| Calendar v2 | F4-F5 | Agendamento real + métricas de publicação | OAuth |

---

### Camada 4 — Product Launch (Sprints N-R)

> Sequencial. Deve ser a última camada antes do lançamento.

| Sprint | Foco | Dependência |
|--------|------|-------------|
| N | UX/UI Redesign (nova identidade visual) | Todas as F1 completas |
| O | Landing Page do produto | Sprint N |
| P | Renomeação do produto + branding final | Sprint O |
| Q | Onboarding público + trial flow | Sprint P |
| R | Production hardening + launch integrations | Sprint Q |

---

## ORDEM RECOMENDADA DE EXECUÇÃO

```
AGORA (paralelo):
├── Vault v2 F1 (V1-V5)     ← maior gap funcional
├── Calendar v2 F1 (C1-C2)  ← quick wins
└── Social v2 J4 (S1-S2)    ← quick wins

DEPOIS:
├── Calendar v2 F2 (C3-C4)  ← depende Social QA

SPRINT L (OAuth):
├── Todas as dependências de OAuth

SPRINTS N-R:
└── Product Launch sequencial
```

---

## Métricas de Completude

| Métrica | Valor |
|---------|-------|
| Frentes 100% completas | 4/7 |
| Frentes >80% completas | 6/7 |
| Tarefas independentes pendentes | ~10 |
| Tarefas bloqueadas por OAuth | ~5 frentes |
| Estimativa para fechar todas F1 | ~10 tarefas pontuais |
