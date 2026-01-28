# 🛠️ Master Tools Registry (Step 0.0)

Este documento é a **Fonte Única da Verdade** para todas as ferramentas (CLIs e MCPs) autorizadas no projeto **Conselho de Funil**. Ele define o que usamos, quem pode usar e como acessar a documentação.

---

## 0. Como este Registry funciona (fonte única + zero erro de comando)

- **O Registry (`tools-registry.md`)**: diz **o que** usamos, **por quê**, **quem** pode usar, e **quais credenciais** são necessárias.
- **Referência de CLI (`_netecmt/core/cli-reference.yaml`)**: diz **como rodar** comandos (com variante Bash/PowerShell).
- **Referência de MCP (`_netecmt/core/mcp-reference.yaml`)**: diz **como instalar/configurar** cada MCP (inclui `env` e exemplos).
- **Pasta `_netecmt/melhorias/`**: é a **biblioteca de pesquisa** (fonte). O que estiver “aprovado” entra no Registry e nos YAMLs acima.

---

## 1. Inventário Definitivo do Projeto (baseado no nosso produto)

### 🐳 Model Context Protocol (MCPs)
| Nome | Categoria | Finalidade no Projeto | Link Doc / Referência | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Stripe MCP** | Finance | Billing/planos/webhooks (SaaS) | `_netecmt/core/mcp-reference.yaml` + `https://stripe.com/docs` | ✅ (quando configurado) |
| **Browser MCP** | Automation | Scraping/QA E2E (anti-CORS, páginas com JS) | `_netecmt/core/mcp-reference.yaml` | ✅ |
| **Exa MCP** | Search | Pesquisa estratégica/benchmark (sem chute) | `_netecmt/core/mcp-reference.yaml` | ✅ (quando configurado) |
| **Firecrawl MCP** | Search & Web | URL → markdown limpo para RAG | `_netecmt/core/mcp-reference.yaml` + `https://docs.firecrawl.dev` | 🟡 Planejado (vamos adotar) |
| **Cloud Run MCP** | DevOps | Heavy-workers (OCR/ingestão pesada) | `_netecmt/core/mcp-reference.yaml` | ✅ Ativo & Autenticado (via ADC) |
| **Context7** | Docs | Docs de libs (Next/Firebase/etc) | (MCP do Docker) | ✅ |
| **Cohere (Reranking)** | AI/RAG | Reordenação semântica de resultados | `_netecmt/contracts/auth-secrets-spec.md` | ✅ Ativo |

### 🖥️ Command Line Interfaces (CLIs)
| Nome | Finalidade no Projeto | Versão Requisitada | Link Doc / Referência | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Firebase CLI** | Rules/índices/emuladores | (ver `_netecmt/melhorias/dependencies_template.yaml`) | `_netecmt/core/cli-reference.yaml` | ✅ |
| **Vercel CLI** | Deploy/preview | (ver dependencies) | `_netecmt/core/cli-reference.yaml` | ✅ |
| **Docker CLI** | Ambiente MCP / QA | (ver dependencies) | `_netecmt/core/cli-reference.yaml` | ✅ |
| **gcloud CLI** | Cloud Run + IAM | (Instalado via SDK) | `_netecmt/core/cli-reference.yaml` | ✅ Ativo (phsedicias@gmail.com) |
| **Pinecone CLI (opcional)** | Operação do Vector DB (se adotarmos) | — | `_netecmt/core/cli-reference.yaml` | 🟡 Planejado |
| **npm** | scripts do app | (ver dependencies) | `_netecmt/core/cli-reference.yaml` | ✅ |

### 📡 Observabilidade (SDK/CLI)
| Nome | Finalidade no Projeto | Link Doc / Referência | Status |
| :--- | :--- | :--- | :--- |
| **Sentry (SDK)** | Error tracking, logs e tracing das rotas de ingestão (com redaction) | `_netecmt/docs/tools/sentry.md` + `https://docs.sentry.io` | 🟡 Planejado (aguarda aprovação do Iuran) |
| **Sentry CLI** | Releases/source maps (somente se aprovado) | `_netecmt/docs/tools/sentry.md` | 🟥 Não autorizado ainda (liberar após atualização do `cli-reference.yaml`) |

---

## 2. Matriz de Permissões (Quem usa o quê?)

| Agente | MCPs Autorizados | CLIs Autorizadas | Responsabilidade |
| :--- | :--- | :--- | :--- |
| **Athos (Arch)** | Cloud Run, Context7 | Firebase, Vercel, gcloud | Desenho de infra e contratos |
| **Darllyson (Dev)** | Browser, Context7 | npm, Firebase, Vercel | Implementação e fix de bugs |
| **Iuran (PM)** | Stripe, Exa | — | Validação de negócio e mercado |
| **Kai (Integrator)**| Todos | Todas | Auditoria, Deploy, Segurança e gates |
| **Monara (Integrator)**| Todos | Todas | Gestão de MCPs, APIs e Chaves |
| **Wilder (Doc)** | n/a | n/a | Documentação e Contexto |

---

## 3. Como você (User) vai usar cada ferramenta (na prática)

- **Firebase CLI**: rodar deploy de rules/índices, e eventualmente emuladores (quando formos validar ingestão/permissions).
- **Vercel CLI**: deploy/preview para validar endpoints (ex: rotas de ingestão).
- **Docker CLI**: subir e manter ambiente de MCPs e testes isolados.
- **Browser MCP**: validar scraping real (SPAs, JS-heavy) e testes de UI (sem depender do seu navegador local).
- **Exa MCP**: pesquisa rápida de benchmark (ex: “padrões de VSL high ticket 2026”) para alimentar decisões do Iuran.
- **Stripe MCP**: simular planos/assinaturas, validar cobrança e preparar webhooks.
- **Cloud Run MCP**: Publicar “workers” para tarefas pesadas (OCR em lote, ingestão de PDFs grandes).
- **Firecrawl MCP**: “URL → markdown limpo” padronizado para ingestão no RAG (reduz retrabalho e erros do scraper).
- **gcloud CLI**: Fazer deploys de serviços no Cloud Run e gerenciar permissões de IAM.

---

## 4. Vetorização: vamos usar? (sim) — onde fica o vetor?

**Sim, já usamos vetorização**: nosso RAG depende de embeddings (vetores) para retrieval.

- **Opção A (agora / default)**: **Firestore + embeddings armazenados** (como está no projeto).
  - **Prós**: menos infraestrutura, mais simples para MVP.
  - **Contras**: pode degradar com escala (custos/latência e ranking no app).

- **Opção B (futuro / escala)**: **Vector DB dedicado (Pinecone / pgvector)**.
  - **Prós**: busca vetorial nativa, escala melhor, filtros melhores.
  - **Contras**: adiciona credenciais, custo e operação.

**Pinecone no nosso ecossistema (importante):**
- Hoje **não temos MCP do Pinecone configurado** aqui.
- Se decidirmos Pinecone, o caminho mais robusto é via **API/SDK** (ex: API Route/Cloud Run) e uma **CLI opcional** para operação (se existir/for necessária).
- Por isso, ele aparece como **🟡 opcional** no Registry: você pode já criar a key agora para evitar retrabalho, mas só ativamos quando a arquitetura decidir.

---

## 3. Roadblocks & Pendências (Para o User)

Para que o sistema opere com fluidez total, faltam os seguintes itens:
1. **Stripe:** Validar se a `STRIPE_SECRET_KEY` está funcional no `.env.local`.
2. **Exa AI:** Validar se a `EXA_API_KEY` está ativa no `.env.local`.
3. **Firecrawl:** `FIRECRAWL_API_KEY` (vamos adotar como “URL → markdown”).
4. **(Opcional) Pinecone:** `PINECONE_API_KEY` se formos escalar o RAG com Vector DB dedicado.
5. **Sentry:** `SENTRY_DSN` + parâmetros de tracing para instrumentar ingestão (aguarda aprovação e rollout).

---

## 📖 Instrução para Agentes (Cursor Rule)
> "Sempre que for utilizar uma ferramenta externa (MCP ou CLI), consulte o `_netecmt/core/tools-registry.md` para validar permissões e sintaxe correta."

### 🔐 Credenciais (One-Time Setup)
- Para gerar/configurar todas as chaves e webhooks em uma única passada, siga: `_netecmt/contracts/auth-secrets-spec.md`.
