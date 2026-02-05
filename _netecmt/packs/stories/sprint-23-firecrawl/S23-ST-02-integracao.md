# Story: Integração Core Firecrawl
**ID**: S23-ST-02
**Status**: COMPLETED
**Sprint**: 23

## 📝 Descrição
Implementar a chamada principal à API do Firecrawl (scrape e crawl) dentro do serviço de scraping.

## ✅ Critérios de Aceite (DoD)
- [ ] Implementação da função `fetchFromFirecrawl` no `url-scraper.ts`.
- [ ] Suporte a extração de Headlines e CTAs via seletores ou LLM do Firecrawl.
- [ ] Tratamento de erros específicos da API (402, 429, 500).

## 🏗️ Tarefas Técnicas
1. Criar método privado `fetchFromFirecrawl` em `url-scraper.ts`.
2. Implementar lógica de extração de metadados (headlines, ctas).
3. Integrar com o fluxo principal de extração.

## 🛑 Bloqueios / Dependências
- S23-ST-01 (Setup)
