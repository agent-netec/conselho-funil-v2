# 📦 Story Pack: Sprint 14 - Competitor Intelligence Expansion

**Versão:** 1.0  
**Status:** 🟢 Ready for Dev  
**Responsável:** Leticia (SM)  
**Sprint:** 14  
**Data:** 24/01/2026

---

## 📝 Resumo do Pack

Este pack detalha a implementação do **Spy Agent** e da **Biblioteca de Ativos de Inteligência**, focando em espionagem ética e análise competitiva.

| ID | Story | Pontos | Prioridade | Status |
|:---|:------|:-------|:-----------|:-------|
| **ST-14.1** | Arch: Competitor Data Schema | 5 | P0 | ✅ Done |
| **ST-14.2** | Core: Spy Agent - Tech Stack Discovery | 13 | P0 | ✅ Done |
| **ST-14.3** | Core: Funnel & LP Tracker (Puppeteer) | 13 | P0 | ✅ Done |
| **ST-14.4** | UI: Competitor Dashboard & Dossier View | 8 | P1 | 🟢 Ready |
| **ST-14.5** | Core: Dossier Generator (IA Analysis) | 8 | P1 | 🟢 Ready |
| **ST-14.6** | QA: Accuracy & Ethical Guardrails | 5 | P0 | 🟢 Ready |

---

## 🛠️ Detalhamento das Stories

### ST-14.2: Core - Spy Agent (Tech Stack Discovery)
**Descrição:** Implementar a lógica de detecção de tecnologias (CMS, Analytics, CRM, Payments) via análise de headers e scripts na URL do concorrente.

**Critérios de Aceite:**
- [ ] Implementação de detecção para: WordPress, Webflow, GTM, Meta Pixel, Hotjar, ActiveCampaign, Stripe e Hotmart.
- [ ] Dados salvos no objeto `techStack` do `CompetitorProfile`.
- [ ] Histórico de scans registrado em `lastSpyScan`.
- [ ] Integração com o contrato `competitor-intelligence-spec.md`.

---

### ST-14.3: Core - Funnel & LP Tracker
**Descrição:** Usar Puppeteer para navegar no site do concorrente, identificar páginas de funil e capturar screenshots.

**Critérios de Aceite:**
- [ ] Identificação automática de URLs contendo `/checkout`, `/obrigado`, `/vsl`, `/lp`.
- [ ] Captura de screenshots em alta resolução salvos no Firebase Storage.
- [ ] Criação de documentos na collection `assets` com o `storagePath` e `pageType`.
- [ ] Sanitização de URLs (remoção de query strings sensíveis).

---

### ST-14.4: UI - Competitor Dashboard & Dossier View
**Descrição:** Expandir o Intelligence Dashboard com a aba de Competidores e visualização detalhada de ativos.

**Critérios de Aceite:**
- [ ] CRUD de Concorrentes (Nome, URL, Categoria).
- [ ] Visualização em Grid dos ativos capturados (screenshots).
- [ ] Exibição da Tech Stack com ícones representativos.
- [ ] Botão "Gerar Dossiê" para disparar o processamento de IA.

---

### ST-14.5: Core - Dossier Generator (IA Analysis)
**Descrição:** Integrar com Gemini para gerar uma análise SWOT e resumo executivo baseado nos ativos e tech stack coletados.

**Critérios de Aceite:**
- [ ] Prompt estruturado enviando `techStack` e metadados de `assets`.
- [ ] Geração de SWOT (Strengths, Weaknesses, Opportunities, Threats).
- [ ] Resumo de "Offer Type" e "Visual Style" extraídos das LPs.
- [ ] Resultado salvo no campo `analysis` do `IntelligenceAsset` e no vetor do Pinecone.

---

### ST-14.6: QA - Accuracy & Ethical Guardrails
**Descrição:** Validar o respeito ao robots.txt e a precisão da detecção técnica.

**Critérios de Aceite:**
- [ ] Teste automatizado: Spy Agent deve abortar scan se `robots.txt` proibir o User-Agent.
- [ ] Validação de precisão: Mínimo 85% de acerto em tech detection para sites conhecidos.
- [ ] Teste de isolamento: Garantir que `brandId` está presente em todos os ativos de competidores.

---

## 🛡️ Guardrails de Execução
1. **Ethical Scraping:** Nunca ignorar erros de 403/429. Implementar retry com backoff exponencial.
2. **Asset Immutability:** Uma vez capturado, o screenshot não deve ser sobrescrito (usar versionamento no path).
3. **Privacy First:** Garantir que nenhum dado de usuário real (PII) seja capturado nos screenshots de checkout.

---
*Pack gerado por Leticia (SM) - NETECMT v2.0*
