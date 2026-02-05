# ✅ Fechamento de Incidente — Firecrawl em Produção
**Data**: 05/02/2026  
**Responsável**: Monara (Integrator)  
**Contexto**: QA reportou "Connection Refused" ao testar Firecrawl via Vercel.

## 1) Diagnóstico
- Firecrawl funcionando localmente com a mesma chave.
- Em produção, requests falhando por **Deployment Protection** (Vercel Authentication).
- **Painel Firecrawl** não apresenta IP allowlist configurável.
- **Static IPs** na Vercel disponíveis, porém **não necessários** para esse caso.

## 2) Ações Executadas
- Validado env vars de produção na Vercel (`FIRECRAWL_API_KEY`, `FIRECRAWL_WORKER_URL`).
- Criado bypass temporário para teste (`x-vercel-protection-bypass`).
- Teste real em produção no endpoint `/api/ingest/url`:
  - **HTTP 200 OK**
  - `method: "firecrawl"` com conteúdo válido.
- Bypass removido após validação.
- Atualização do incidente em `incidents/INCIDENT-2026-01-27-BUILD-RECOVERY.md`.
- Atualização do guia em `_netecmt/docs/tools/firecrawl.md`.

## 3) Resultado
**Firecrawl em produção está funcional.**  
O problema não era rede/allowlist, e sim **proteção de deploy**.

## 4) Recomendações
- Se o endpoint `/api/ingest/url` é **público**, considerar remover `Vercel Authentication` ou criar **exceptions** para a rota.
- Se o endpoint é **restrito**, manter proteção e usar bypass apenas para QA/automação (com chave controlada).

---
*Relatório de fechamento gerado por Monara (Integrator).*
