# 📦 Release Notes — Sprint 23 (Intelligence Scale - Firecrawl)
**Data**: 05/02/2026  
**Status**: Pronto para Handoff  

## 1. Objetivo da Release
Estabilizar o scraping de URLs com **Firecrawl** como motor primário, garantindo resiliência via fallback em camadas e governança de custos no `AICostGuard`.

## 2. Principais Entregas
- **Integração Firecrawl** como primeiro provedor de extração de conteúdo.
- **Fallback em camadas**: Firecrawl → Jina Reader → Readability → Cheerio.
- **CostGuard atualizado** para registrar custos de `firecrawl`.
- **Contrato de Scraping** atualizado e mapeamento de lanes no `contract-map`.

## 3. Mudanças Técnicas Relevantes
- `app/src/lib/ai/url-scraper.ts`:
  - Implementação de `fetchFromFirecrawl`.
  - Metadados de scraping (headlines, ctas, url) enriquecidos.
  - Logs de transição entre motores e timeout dedicado para Firecrawl.
- `app/src/lib/ai/cost-guard.ts`:
  - Custos e provider `firecrawl` adicionados.
- `app/src/app/api/ingest/url/route.ts`:
  - Método de processamento armazenado em metadata do asset.
- Contratos e docs:
  - `_netecmt/contracts/funnel-autopsy-spec.md`
  - `_netecmt/contracts/integrations.md`
  - `_netecmt/core/contract-map.yaml`

## 4. Ambiente e Configuração (Produção)
**Obrigatórios:**
- `FIRECRAWL_API_KEY` (Vercel/Firebase Functions)

**Opcionais:**
- `FIRECRAWL_WORKER_URL` (caso use endpoint proxy/self-hosted)
- `JINA_API_KEY` (para maior estabilidade no fallback Jina)

## 5. Testes e Validações
- Smoke test Sprint 23: **3/3 domínios aprovados** (Cloudflare / bloqueios).
- Fluxo de fallback validado em cenários de erro 422.

## 6. Checklist de Handoff
- [ ] Variáveis de ambiente atualizadas em produção.
- [ ] Monitorar `usage_logs` no Firestore para custos Firecrawl.
- [ ] Confirmar que `AICostGuard` está contabilizando corretamente.

---
*Release consolidada por Luke (Release).*
