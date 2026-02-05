# 🎯 PRD: Intelligence Scale — Firecrawl Integration (Sprint 23)

**Versão:** 1.0  
**Responsável:** Iuran (PM)  
**Status:** Draft / Ready for Architecture Review  
**Data:** 05/02/2026

## 1. Problema & Oportunidade
Atualmente, a **Ala de Inteligência** enfrenta bloqueios frequentes de scraping (Cloudflare/422) e limitações na profundidade da coleta de dados. Para que o **Conselho de Funil** funcione como uma **Agency Engine** de alta performance, precisamos de dados limpos, estruturados e profundos de sites de concorrentes e referências.

**Objetivo:** Implementar o **Firecrawl** como motor primário de extração, permitindo deep-crawling (subpáginas) e extração automatizada de ativos de copy (Headlines/CTAs) com bypass de proteções anti-bot.

## 2. Requisitos Funcionais

### RF-01: Deep-Crawling Inteligente
- O sistema deve ser capaz de navegar recursivamente em um domínio (limite de profundidade configurável).
- Deve filtrar e priorizar páginas relevantes (ex: Home, Landing Pages, Sales Pages, Pricing).
- Deve converter o conteúdo HTML em Markdown estruturado para facilitar a ingestão no RAG.

### RF-02: Extração de Ativos de Copy (Headlines & CTAs)
- O motor deve identificar e extrair automaticamente:
    - **Headlines:** H1, H2 e textos de destaque visual.
    - **CTAs:** Textos de botões e links de conversão.
- Os dados extraídos devem ser tagueados com a URL de origem e o contexto da página.

### RF-03: Sistema de Fallback (Resiliência)
- Implementar uma hierarquia de extração para garantir 100% de disponibilidade:
    1. **Firecrawl** (Primário - Melhor para Cloudflare e Deep-crawl).
    2. **Jina Reader** (Secundário - Rápido para páginas únicas).
    3. **Puppeteer Local** (Terceiro - Fallback para casos específicos).

### RF-04: Integração com Intelligence Wing
- Os dados coletados devem alimentar diretamente o `/api/intelligence/spy` e o `/api/intelligence/autopsy/run`.
- Deve haver suporte para isolamento por `brandId` (Multi-tenant first).

## 3. Requisitos Técnicos & Segurança

### RT-01: Bypass de Cloudflare
- Utilizar as capacidades nativas do Firecrawl para contornar proteções anti-bot e proxies.
- Garantir que o User-Agent e os cabeçalhos de requisição sejam otimizados.

### RT-02: Processamento Assíncrono
- Devido à natureza demorada do deep-crawling, as requisições devem ser assíncronas com suporte a webhooks ou polling de status.

### RT-03: Governança de Chaves (Monara)
- A `FIRECRAWL_API_KEY` deve ser gerenciada centralmente e nunca exposta no frontend.

## 4. Critérios de Aceitação

### Definition of Ready (DoR)
- [ ] Documentação de liberação do Firecrawl (`_netecmt/docs/tools/firecrawl.md`) revisada.
- [ ] Chave de API configurada no ambiente de desenvolvimento.
- [ ] Contratos de API definidos para o novo motor de extração.

### Definition of Done (DoD)
- [ ] Extração de subpáginas funcionando sem bloqueios de Cloudflare em sites de teste.
- [ ] Headlines e CTAs extraídos corretamente e salvos no Firestore/Pinecone.
- [ ] Sistema de fallback (Firecrawl -> Jina -> Local) validado.
- [ ] Testes de integração passando para os endpoints de Inteligência.

## 5. Métricas de Sucesso
- Redução de 90% nos erros de "Scraping Blocked" (422/403).
- Aumento de 3x na profundidade média de coleta de dados por domínio.
- Tempo médio de extração de headlines < 10 segundos para páginas únicas.

---
*PRD gerado por Iuran (PM) - 05/02/2026*
