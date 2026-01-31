# Distilled Requirements
Sprint 22 - Estabilização do Produto (Online)

## User Story
Como operador do Conselho de Funil, quero estabilizar o ambiente online e os endpoints críticos para que o produto funcione sem erros 500/400/404 e com resiliência de API.

## Context Snippets
- O ambiente online apresenta falhas 500/400/404 em múltiplas rotas.
- Há dependência crítica de variáveis de ambiente (Firebase/AI/Workers).
- Endpoints de inteligência têm falhas de persistência e respostas não JSON.
- O fluxo precisa seguir NETECMT (brownfield): diagnóstico, saneamento, execução, QA.

## Implementation Guardrails
- Não manipular ou expor segredos; envs devem ser preenchidos manualmente.
- Evitar fallback silencioso que oculte erros de negócio; registrar falhas de infraestrutura.
- Priorizar rotas de inteligência (keywords, autopsy, spy) e navegação crítica.
- Usar wrappers de resiliência para respostas não JSON e falhas de integração.
