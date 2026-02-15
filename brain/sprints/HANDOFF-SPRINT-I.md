# HANDOFF — Sprint I: Testes em Producao & Debug ao Vivo

> Documento de handoff para nova sessao do Claude Code.
> Gerado: 2026-02-15
> Sprint anterior: Sprint H (Ad Generation + Copy Lab Brain)

---

## Contexto Rapido

O projeto **Conselho de Funil** e um app Next.js 16 (root: `app/`) com 24 conselheiros virtuais de marketing, deployado no Vercel. Sprints E-H ja foram implementados e deployados.

O usuario vai **navegar pelo app em producao** (site online no Vercel), aba por aba, e reportar bugs/problemas neste chat. O agente deve corrigir cada bug reportado de forma cirurgica e rapida.

---

## Modo de Operacao

**Esta sessao e um debug ao vivo.** O fluxo e:

1. Usuario navega pelo app no browser (URL de producao)
2. Usuario reporta bug/erro/comportamento inesperado neste chat
3. Agente diagnostica usando metodologia `/systematic-debug` (root cause primeiro)
4. Agente aplica fix cirurgico no codigo
5. Apos acumular fixes, fazer commit + deploy para usuario re-testar
6. Repetir ate todas as abas estarem OK

---

## Documentos de Referencia

1. `brain/sprints/sprint-i.md` — Checklist completo de 23 testes em producao (ler este primeiro!)
2. `CLAUDE.md` — Regras do projeto + Skill Router (aplica automaticamente a skill certa)
3. `.claude/commands/` — 14 skills disponiveis (debug, find-bugs, audit, react-ui, etc.)

---

## Skills Disponiveis (em `.claude/commands/`)

| Skill | Quando usar |
|-------|------------|
| `/debug` | Bug reportado pelo usuario |
| `/systematic-debug` | Bug complexo que precisa root cause analysis |
| `/find-bugs` | Caca bugs em 5 fases |
| `/build` | Build falhou |
| `/audit` | Auditoria completa de uma aba |
| `/brain` | Integrar brain context em engine |
| `/react-patterns` | Criar/editar componentes React |
| `/react-ui` | Loading states, error handling, empty states |
| `/gemini` | Trabalhar com API Gemini |
| `/rag` | Pinecone/embeddings/RAG |
| `/prompt-eng` | Prompts Gemini |
| `/firebase-check` | Patterns Firebase |
| `/seo` | SEO e Keywords Miner |
| `/web-perf` | Performance web |

O Skill Router no CLAUDE.md indica automaticamente qual skill aplicar por contexto.

---

## Regras Criticas

1. **NÃO alterar** logica de RAG, credits ou persistencia sem confirmacao
2. **PRESERVAR** formatos de output de todas as APIs
3. Correcoes devem ser **minimas e cirurgicas**
4. Seguir metodologia de root cause analysis (nao chutar fixes)
5. Build obrigatorio apos fixes: `cd app && npm run build`
6. Comunicacao com usuario em **portugues BR**

---

## Arquitetura do Projeto (referencia rapida)

| Pasta | Conteudo |
|-------|---------|
| `app/src/app/` | Paginas e rotas de API (Next.js App Router) |
| `app/src/components/` | Componentes React reutilizaveis |
| `app/src/hooks/` | Hooks customizados |
| `app/src/lib/ai/` | Integracao Gemini (prompts, client) |
| `app/src/lib/intelligence/brains/` | BrainLoader, Prompt Builder |
| `app/src/lib/firebase/` | Config Firebase |
| `app/src/data/identity-cards/` | 24 Identity Cards dos conselheiros |
| `brain/sprints/` | Documentacao de sprints |

---

## Estado Atual

- **Sprints E-H:** Implementados e deployados
- **Sprint I:** Testes em producao — usuario navegando e reportando bugs
- **Branch:** master
- **Ultimo commit:** f9fa9f748 (Sprint H)

---

## Primeiro Passo

Ler `brain/sprints/sprint-i.md` para entender o checklist de 23 testes. Aguardar usuario reportar o primeiro bug/observacao do app em producao.
