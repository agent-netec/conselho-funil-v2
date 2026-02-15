# Conselho de Funil — Instruções do Projeto

## Stack
- Next.js 16, React 19, TypeScript, Firebase, Pinecone, Gemini AI
- Deploy: Vercel (root dir: `app/`)
- Build: `cd app && npm run build`

## Regras Gerais
- NÃO alterar lógica de RAG, credits ou persistência sem pedir confirmação
- PRESERVAR formatos de output de todas as APIs
- Correções devem ser mínimas e cirúrgicas
- Idioma padrão do código: inglês. Comunicação com usuário: português BR

## Skill Router — Aplicar automaticamente quando o contexto encaixar

Ao trabalhar em tarefas, aplique a metodologia da skill correspondente:

| Contexto detectado | Skill a aplicar | Foco |
|-------------------|-----------------|------|
| Usuário reporta bug ou erro | `/debug` + `/systematic-debug` | Root cause primeiro, depois fix |
| Review de código ou PR | `/find-bugs` | 5 fases: coleta → ataque → checklist → verificação → relatório |
| Auditoria de aba/feature | `/audit` | Relatório por severidade, NÃO corrigir sem aprovação |
| Integrar brain em engine | `/brain` | Seguir padrão ads-brain-context.ts |
| Build falhou | `/build` | Corrigir erros até build passar |
| Criar/editar componente React | `/react-patterns` + `/react-ui` | Server by default, loading/error/empty states |
| Trabalhar com prompts Gemini | `/prompt-eng` + `/gemini` | Hierarquia de instrução, token budget, temperatura |
| Trabalhar com Pinecone/embeddings | `/rag` | Chunks 500-1000 tokens, metadata filters |
| Verificar Firebase patterns | `/firebase-check` | Security rules, listeners, denormalization |
| SEO ou Keywords Miner | `/seo` | E-E-A-T, intent classification, structured data |
| Performance ou otimização | `/web-perf` | Medir primeiro, depois otimizar |

Quando múltiplos contextos se aplicam, combinar as metodologias relevantes.
