# Sprint K — Tool Integration & Enrichment

> Fase: 3 — Evolucao Pos-QA
> Status: PENDENTE
> Dependencia: Sprint J concluido (UX polish feito)
> Prioridade: **ALTA** — Faz o produto "fazer sentido" como sistema integrado
> Estimativa: ~3-4 sessoes
> Issues relacionados: #9, #10, #14 (nivel 2)

---

## Contexto

Sprint I revelou um padrao recorrente: **ferramentas que funcionam isoladamente mas nao conectam com o resto do sistema**. O usuario minera keywords e nao sabe o que fazer. Escaneia um concorrente e recebe dados brutos. Analisa uma pagina e o resultado desaparece.

Este sprint transforma ferramentas isoladas em **pecas de um sistema integrado** onde cada output alimenta outros modulos.

**Criterio de sucesso:** Resultado de uma ferramenta pode ser usado em pelo menos 1 outro modulo sem copiar/colar manual.

---

## Tarefas

### K-1. Keywords Miner — Integracao com Brand & Engines (Issue #9)

**Problema:** Keywords Miner minera termos (Google Autocomplete + Gemini) mas o resultado e descartavel. Falta: keywords correlacionadas, salvar no brand, alimentar engines, acoes pos-mineracao.

**Arquivos principais:**
- `app/src/app/intelligence/keywords/page.tsx` (ou similar)
- `app/src/lib/intelligence/keywords/` (engine de mineracao)
- `app/src/lib/firebase/brands.ts` (persistencia de brand context)

**Tarefas:**
- [ ] K-1.1 — Adicionar botao "Salvar no Brand" apos mineracao — salva keywords selecionadas em `brands/{id}/keywords` (collection ou campo array no doc principal)
- [ ] K-1.2 — Criar funcao `getBrandKeywords(brandId)` para outros modulos acessarem as keywords salvas
- [ ] K-1.3 — Injetar keywords do brand no prompt de Copy Generate (`/api/funnels/[id]/copy/generate`) como contexto SEO
- [ ] K-1.4 — Injetar keywords do brand no prompt de Ads Generate como termos de mercado/linguagem do publico
- [ ] K-1.5 — Adicionar acoes pos-mineracao na UI: "Adicionar ao Brand", "Criar Campanha com estas Keywords", "Enviar para Conselho de Copy"
- [ ] K-1.6 — Adicionar tab "Keywords Correlacionadas" usando Gemini para expandir termos minerados (LSI, longtail, perguntas)

**Pontos de atencao:**
- NAO alterar a logica de mineracao existente (Google Autocomplete + Gemini estimation funciona)
- Preservar formato de output atual da API de keywords
- Keywords salvas devem ter metadata: `term`, `volume` (estimado), `difficulty`, `intent`, `source` (miner/manual), `savedAt`
- Pensar no limite: maximo 50-100 keywords por brand para nao poluir prompts

---

### K-2. Spy Agent v2 — Analise Estrategica & Integracao (Issue #10)

**Problema:** Spy Agent escaneia URLs de concorrentes mas entrega dados brutos sem analise. Falta: design system detection, analise qualitativa (bom/ruim/emular/evitar), racionalizacao, insights acionaveis, integracao com Brand.

**Arquivos principais:**
- `app/src/lib/agents/spy/` (spy agent engine)
- `app/src/app/strategy/autopsy/page.tsx` (compartilha endpoint com Autopsy)
- Brain: design_director.md, eugene_schwartz.md, gary_halbert.md

**Tarefas:**
- [ ] K-2.1 — Enriquecer output do Spy Agent com analise qualitativa via Gemini: "O que e bom?", "O que e ruim?", "O que emular?", "O que evitar?" para cada secao da pagina
- [ ] K-2.2 — Adicionar deteccao de design system basico: cores predominantes, tipografia (serif/sans-serif), espacamento (denso/arejado), componentes principais
- [ ] K-2.3 — Adicionar "Racionalizacao Estrategica" — para cada decisao detectada no concorrente, explicar o PORQUE provavel (ex: "CTA vermelho provavelmente para urgencia — Carlton Hook #3")
- [ ] K-2.4 — Gerar insights acionaveis ao final: lista de 3-5 acoes concretas ("Inspirar-se em X do concorrente Y", "Evitar Z por motivo W")
- [ ] K-2.5 — Adicionar botao "Salvar como Estudo de Caso" que persiste a analise no Firebase (brands/{id}/case_studies) com TTL permanente (nao 30 dias)
- [ ] K-2.6 — Botao "Aplicar Insights" que extrai acoes e salva como contexto competitivo no brand

**Pontos de atencao:**
- Spy Agent e Page Forensics (ex-Autopsy) compartilham scraping — reutilizar, nao duplicar
- Brain context do design_director pode ser injetado na analise visual
- NAO criar crawler automatico — manter input manual de URLs
- Output do Gemini deve ser JSON estruturado (insights, actions, design_analysis)
- Considerar custo: analise completa pode usar 2-3 chamadas Gemini. Documentar credit cost.

---

### K-3. Page Forensics — Integracao com Pipeline & Estudos de Caso (Issue #14, Nivel 2)

**Problema:** Relatorios de Page Forensics (ex-Autopsy) sao descartaveis (TTL 30 dias), nao conectam com Pipeline de Funis, nao alimentam conselheiros com insights.

**Arquivos principais:**
- `app/src/app/strategy/autopsy/page.tsx` (renomeado em Sprint J)
- `app/src/lib/intelligence/autopsy/engine.ts`
- `app/src/app/funnels/page.tsx` (Pipeline)

**Tarefas:**
- [ ] K-3.1 — Adicionar opcao "Salvar como Estudo de Caso Permanente" (sem TTL) em `brands/{id}/case_studies`
- [ ] K-3.2 — Exibir estudos de caso salvos em uma aba "Biblioteca de Analises" na pagina de Forensics
- [ ] K-3.3 — No Pipeline de Funis, adicionar botao "Comparar com Concorrente" que abre Forensics com URL e depois compara scores/heuristicas
- [ ] K-3.4 — Injetar insights dos estudos de caso no brain context de Copy/Design Generate (quando relevante para o nicho do brand)
- [ ] K-3.5 — Adicionar link direto do resultado da analise para "Criar Funil Inspirado" (pre-preenche contexto do funil com insights)

**Pontos de atencao:**
- Nivel 3 (crawler multi-pagina para autopsia de funil real) fica para sprint futuro — e significativamente mais complexo
- Estudos de caso devem ter: `url`, `analysisDate`, `healthScore`, `topInsights`, `actionItems`, `linkedFunnelId` (opcional)
- Integrar com K-2 (Spy Agent) — ambos salvam em `case_studies`, mesmo formato

---

### K-4. Deep Research v2 — Inteligencia de Audiencia & RAG Integration (Issue #17 evolucao)

**Problema:** Deep Research hoje faz pesquisa generica de mercado (busca artigos via Exa). O resultado e superficial — equivalente a uma busca no Google. Falta: input de URLs custom (Instagram, YouTube, landing pages), analise de comentarios/tom de voz, prompts estruturados, chat para refinamento, e integracao com RAG dos conselheiros.

**Visao do usuario:** Ferramenta de **inteligencia de audiencia** que permite ouvir o mercado real em vez de apenas ler sobre ele.

**Arquivos principais:**
- `app/src/app/intelligence/research/page.tsx` (UI principal)
- `app/src/lib/intelligence/research/engine.ts` (pipeline)
- `app/src/lib/intelligence/research/dossier-generator.ts` (sintese Gemini)
- `app/src/lib/mcp/adapters/firecrawl.ts` (scraping)
- `app/src/components/intelligence/research/` (componentes)

**Tarefas:**

#### Fase A — Prompts Estruturados & UX

- [ ] K-4.1 — Criar biblioteca de **task templates** (prompts pre-prontos) com sugestoes clicaveis:
  - "Analise de Audiencia" — scrape comentarios de URLs e gere perfil de voz ativa (dores, desejos, objecoes, linguagem)
  - "Analise de Concorrente" — scrape paginas de concorrente e gere SWOT + insights acionaveis
  - "Tendencias de Mercado" — busca semantica + sintese de tendencias emergentes
  - "Pesquisa de Produto" — analise de reviews, reclamacoes, pontos fortes/fracos de produtos concorrentes
  - "Mapeamento de Nicho" — players, tamanho de mercado, gaps, oportunidades sub-exploradas
- [ ] K-4.2 — Cada template pre-preenche campos e ajusta profundidade/fontes automaticamente
- [ ] K-4.3 — Adicionar campo **"URLs Customizadas"** (textarea) onde o usuario cola links especificos para scraping (Instagram, YouTube, blogs, landing pages, etc.)

#### Fase B — Analise de Audiencia (Voz Ativa)

- [ ] K-4.4 — Parser de **comentarios sociais** via Firecrawl:
  - Instagram: scrape posts publicos + comentarios
  - YouTube: scrape descricao + comentarios do video
  - Blog/forum: scrape texto + secao de comentarios
- [ ] K-4.5 — Prompt Gemini especializado para **analise de voz ativa**:
  - Tom de voz do publico (formal/informal, girias, emocoes predominantes)
  - Dores recorrentes (o que reclamam, frustracoes, objecoes)
  - Desejos e aspiracoes (o que buscam, linguagem de resultado)
  - Perguntas frequentes (duvidas, insegurancas, barreiras)
  - Gatilhos emocionais (o que gera mais engajamento nos comentarios)
- [ ] K-4.6 — Gerar **Persona de Audiencia** baseada nos dados reais:
  - Como o publico fala (vocabulario, expressoes)
  - O que o publico sente (medos, frustraces, esperancas)
  - O que o publico busca (solucoes, transformacoes)
  - Como abordar o publico (tom, argumentos, linguagem)

#### Fase C — Chat de Refinamento

- [ ] K-4.7 — Adicionar **aba de chat** ao lado do dossie gerado (estilo split-view):
  - Usuario pode fazer perguntas sobre o dossie ("Aprofunde mais na tendencia X")
  - Pode pedir refinamentos ("Foque mais nos comentarios negativos")
  - Pode adicionar contexto extra ("Meu publico e majoritariamente 25-35 anos")
  - Chat usa o dossie como contexto + brain dos conselheiros (Schwartz + Brunson)
- [ ] K-4.8 — Historico de refinamentos salvo junto ao dossie no Firebase

#### Fase D — Integracao RAG & Conselheiros

- [ ] K-4.9 — Adicionar botao **"Adicionar ao Conselho"** no dossie:
  - Permite ao usuario revisar e decidir quais secoes adicionar ao RAG
  - Checkboxes por secao: Visao de Mercado, Tendencias, Concorrentes, Persona de Audiencia, etc.
- [ ] K-4.10 — Salvar secoes selecionadas como **embeddings no Pinecone** (collection: `brands/{id}/research_context`):
  - Chunking inteligente por secao/topico
  - Metadata: `source: 'deep_research'`, `topic`, `date`, `brandId`
- [ ] K-4.11 — Conselheiros (Chat, Copy, Ads, Design, Funnels) passam a **buscar research context no Pinecone** automaticamente quando geram conteudo:
  - Injetar no prompt: "Contexto de mercado disponivel: {research_chunks}"
  - Priorizar dossies recentes e relevantes ao topico sendo trabalhado
- [ ] K-4.12 — Indicador visual nas paginas de geracao: "Usando insights de Deep Research: [nome do dossie]"

**Pontos de atencao:**
- Firecrawl tem limitacoes com conteudo dinamico (Instagram/YouTube carregam via JS) — pode precisar de headless browser para scraping mais robusto (BROWSER_WORKER_URL no env)
- Custo: analise de audiencia pode usar 3-5 chamadas Gemini. Documentar credit cost por task template
- RAG integration deve usar o padrao existente de Pinecone (768 dims, text-embedding-004)
- Chat de refinamento deve usar PRO_GEMINI_MODEL (gemini-3-pro) para qualidade
- Limite de embeddings por brand para nao poluir o contexto: max 20 research chunks ativos
- Usuario DECIDE o que entra no RAG — nunca automatico

---

## Dependencias entre Tarefas

```
K-1.1 (salvar keywords) → K-1.3 (injetar em copy) → K-1.4 (injetar em ads)
K-1.2 (getBrandKeywords) → K-1.3, K-1.4 (dependem da funcao)
K-2.5 (salvar estudo) → K-3.1 (mesmo formato case_studies)
K-3.2 (biblioteca) → K-3.3 (comparar com concorrente)
K-4.1-K-4.3 (UX) → K-4.4-K-4.6 (audiencia) → K-4.7-K-4.8 (chat) → K-4.9-K-4.12 (RAG)
```

**Recomendacao de ordem:** K-1 (mais impacto, mais facil) → K-4 Fase A-B (Deep Research v2) → K-2 → K-3 → K-4 Fase C-D

---

## Criterio de Aprovacao

| # | Criterio | Verificacao |
|---|----------|-------------|
| 1 | Keywords mineradas podem ser salvas no brand | Salvar 5+ keywords e verificar no Firebase |
| 2 | Copy/Ads generate usam keywords do brand | Gerar copy com keywords e verificar no output |
| 3 | Spy Agent gera insights acionaveis | Escanear 1 concorrente real e avaliar qualidade |
| 4 | Estudo de caso persiste permanentemente | Salvar e recuperar apos 24h+ |
| 5 | Pipeline permite comparar com concorrente | Fluxo end-to-end funcional |

---

## Changelog

| Data | Acao | Status |
|------|------|--------|
| 2026-02-15 | Sprint planejado a partir de Issues #9, #10, #14 (nivel 2) | CRIADO |
