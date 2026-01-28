# Contract: Brain Synchronization & Orchestration

## 1. Visão Geral
Este contrato define o fluxo de sincronização entre o conhecimento físico (`brain/`) e o motor de RAG (Firestore/Vector Search), visando automatizar o trabalho manual de ingestão.

## 2. Estrutura do Brain Físico
O conhecimento está organizado em pastas por tipo:
- `brain/council/identity/`: Identidade dos conselheiros (.md)
- `brain/council/heuristics/`: Regras e heurísticas de marketing (.md)
- `brain/council/scorecards/`: Rubricas de avaliação (.md)
- `brain/business/`: Contexto específico por marca (Ingerido via RAG)

## 3. Comandos de Orquestração (CLI)
Para facilitar o trabalho da equipe, os seguintes comandos devem ser utilizados:

| Comando | Ação | Responsável Agent |
| :--- | :--- | :--- |
| `npm run brain:audit` | Verifica arquivos novos ou modificados na pasta `brain/` | Wilder |
| `npm run brain:sync` | Processa e vetoriza os arquivos para o Firestore | Darllyson / Kai |
| `npm run brain:clean` | Remove chunks órfãos do banco que não existem mais no disco | Kai |

## 4. Metadados de Ingestão
Todo arquivo Markdown no Brain DEVE conter um frontmatter YAML com os seguintes campos:
```yaml
---
id: string (UUID opcional)
counselor: string (id do conselheiro)
docType: 'identity' | 'heuristic' | 'scorecard' | 'case'
version: string
---
```

## 5. Fluxo Automático
Sempre que um agente sugerir uma mudança no Brain:
1. O agente escreve o arquivo na pasta correspondente.
2. O agente executa o `brain:sync` (ou solicita ao Kai via workflow).
3. O integrador valida se os novos vetores estão ativos no RAG.

