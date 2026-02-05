# Story: Sistema de Fallback & Resiliência
**ID**: S23-ST-03
**Status**: COMPLETED
**Sprint**: 23

## 📝 Descrição
Refatorar a lógica de fallback para seguir a nova hierarquia: Firecrawl -> Jina -> Readability -> Cheerio.

## ✅ Critérios de Aceite (DoD)
- [ ] Fluxo de execução em `extractContentFromUrl` segue a ordem do contrato de Athos.
- [ ] Logs claros indicando qual motor foi utilizado em cada tentativa.
- [ ] Teste de falha forçada no Firecrawl ativa o Jina corretamente.

## 🏗️ Tarefas Técnicas
1. Reordenar chamadas em `extractContentFromUrl`.
2. Garantir que o `method` retornado na interface reflita o motor final.
3. Adicionar logs de transição entre motores.

## 🛑 Bloqueios / Dependências
- S23-ST-02 (Integração)
