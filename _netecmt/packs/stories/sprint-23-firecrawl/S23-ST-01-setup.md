# Story: Setup & Configuração Firecrawl
**ID**: S23-ST-01
**Status**: COMPLETED
**Sprint**: 23

## 📝 Descrição
Configurar as variáveis de ambiente e a infraestrutura básica para suportar o Firecrawl como motor de scraping.

## ✅ Critérios de Aceite (DoD)
- [ ] Variável `FIRECRAWL_API_KEY` adicionada ao `.env.local` (mock ou real).
- [ ] Tipagem `ScrapedContent` atualizada no `url-scraper.ts` para incluir novos campos do Firecrawl.
- [ ] Configuração de budget no `AICostGuard` para o novo modelo `firecrawl`.

## 🏗️ Tarefas Técnicas
1. Adicionar `FIRECRAWL_API_KEY` ao `.env.local`.
2. Atualizar interface `ScrapedContent` em `app/src/lib/ai/url-scraper.ts`.
3. Registrar `firecrawl` no `AICostGuard`.

## 🛑 Bloqueios / Dependências
- N/A (DoR validado por Athos).
