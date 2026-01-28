# 🗺️ Hierarquia de Documentação & Estratégia de Brains

Este documento estabelece a ordem de importância das documentações do projeto **Conselho de Funil** e propõe melhorias para a expansão da base de conhecimento (Brains).

---

## 🏆 1. Hierarquia de Importância (Tier List)

### Tier 1: A Fonte da Verdade (Vital)
Estes arquivos definem **o que** é o projeto e **como** ele deve ser construído. Devem ser lidos por qualquer agente antes de qualquer ação.
1.  **`_netecmt/project-context.md`**: A "Bíblia" do projeto. Contém a visão geral, stack, arquitetura de domínio e status atual.
2.  **`_netecmt/core/config.yaml`**: Define o tipo de projeto (Brownfield/Greenfield) e as regras de automação.
3.  **`_netecmt/core/contract-map.yaml`**: Mapeia quais arquivos pertencem a quais lanes e quais contratos os governam.

### Tier 2: Governança e Desenho Técnico (Estratégico)
Estes arquivos garantem que o código seja consistente e seguro.
4.  **`_netecmt/contracts/`**: (Pasta) Contratos de dados (Retrieval, Ingestion, Auth). É o "aperto de mão" entre backend e frontend.
5.  **`docs/tech-spec.md`**: Detalhamento técnico da implementação, schemas de banco de dados e fluxos de sistema.
6.  **`_netecmt/docs/tools/`**: (Pasta) Guias de liberação de ferramentas (Pinecone, Gemini, Firecrawl). Define como usar cada ferramenta com segurança.

### Tier 3: Execução e Ciclo de Vida (Operacional)
Arquivos que mudam conforme o trabalho avança.
7.  **`_netecmt/sprints/ACTIVE_SPRINT.md`**: O quadro de tarefas atual.
8.  **`_netecmt/packs/stories/`**: Detalhamento de cada Story (Requisitos, DoD, Contexto Permitido).
9.  **`_netecmt/prd-*.md`**: Requisitos funcionais de cada grande funcionalidade ou sprint.

### Tier 4: Histórico e Auditoria
Para referência futura e recuperação de erros.
10. **`_netecmt/archive/sprints/`**: Post-mortems e históricos de sprints passadas.
11. **`_netecmt/audit-results.md`**: Resultados de auditorias automáticas de conformidade.

---

## 🧠 2. Sugestões para Melhoria dos Brains (Base de Conhecimento)

Para transformar o Conselho em uma inteligência de nível sênior, a documentação dos "cérebros" deve evoluir além de simples textos.

### A. Documentação de Heurísticas Cruzadas (Cross-Heuristics)
**O que é:** Documentar como as regras de um mestre (ex: Russell Brunson) se conectam ou conflitam com outro (ex: Eugene Schwartz).
- **Sugestão:** Criar `brain/council/logic/conflicts-resolution.md`.
- **Benefício:** Evita respostas contraditórias da IA quando múltiplos agentes são invocados.

### B. Catálogo de Fontes Verificadas (Source Inventory)
**O que é:** Um inventário detalhado de cada livro, vídeo ou transcrição ingerida no Pinecone.
- **Sugestão:** Criar `_netecmt/docs/brains/ingestion-inventory.md` com:
    - Nome da Obra | Autor | Data de Ingestão | Namespace no Pinecone | Status de Revisão.
- **Benefício:** Facilita a auditoria de citações `[Fonte: ...]` exigida na Sprint 10.

### C. Mapeamento de Intenções (Intent Mapping)
**O que é:** Um dicionário que traduz o que o usuário pede para quais categorias de metadados a IA deve buscar.
- **Sugestão:** Criar `_netecmt/docs/ai/intent-dictionary.md`.
- **Exemplo:** "Preciso de um título" -> Mapear para `docType: 'headlines'`, `counselor: 'gary_halbert'`.

### D. Guia de Heurísticas Visuais (Vision Intelligence)
**O que é:** Instruções específicas para o Gemini Vision analisar imagens estratégicas.
- **Sugestão:** Criar `_netecmt/docs/ai/visual-heuristics.md`.
- **Conteúdo:** O que define um anúncio de alta conversão visualmente? (Contraste, legibilidade, posição do botão, direção do olhar).

---

## 🚀 Próximos Passos Recomendados para Wilder (Analista)
1.  **Auditoria de Zips**: Abrir todos os arquivos `.zip` nas pastas `templates/` e `brain/` e documentar o que falta ingerir no `ingestion-inventory.md`.
2.  **Padronização de Citação**: Criar um pequeno manual de como formatar os arquivos `.md` antes da ingestão para que o Pinecone extraia metadados de fonte perfeitos.

---
*NETECMT v2.0 | Estratégia de Documentação de Alta Fidelidade*
