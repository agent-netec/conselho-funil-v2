# 🛠️ Guia de Liberação: Ingestão de Ads (Ads Brain)

Este documento descreve como realizar a ingestão de novos dados, heurísticas e benchmarks para o **Conselho de Ads**.

## 👤 Agente Responsável
- **Monara (Integrator)** ou **Leticia (SM)**

## 📂 Localização dos Dados
Todos os arquivos de conhecimento do Conselho de Ads residem em:
- `templates/ads_brain/council/`

### Subdiretórios:
- `identity/`: Identidades dos especialistas (Justin Brooke, Nicholas Kusmich, etc).
- `heuristics/`: Regras de "If-Then" para estratégias de tráfego.
- `benchmarks/`: Dados de custos (CPC/CPM) e taxas de conversão (Ex: `cpc_cpm_2026.md`).

## 🚀 Comandos de Execução

### 1. Preparar os Chunks (Ingestão Local)
Este comando lê os arquivos Markdown, quebra em parágrafos/seções e gera um arquivo JSON intermediário.
```bash
npx ts-node app/scripts/ingest-ads-brain.ts
```
**Saída esperada:** `app/scripts/ads-brain-chunks.json`

### 2. Upload para a Base de Conhecimento (RAG)
Este comando envia os chunks processados para o servidor de produção/local.
```bash
npx ts-node app/scripts/upload-ads-brain.ts
```
*Nota: Certifique-se de que a variável de ambiente `API_URL` está configurada corretamente.*

## ⚠️ Regras de Segurança (Governança)
- **Zero Duplicate:** O script de upload não limpa a base por padrão. Se precisar de um "Fresh Start", use a flag `clear: true` no código do script antes de rodar.
- **Validation Before Upload:** Sempre verifique o arquivo `ads-brain-chunks.json` gerado para garantir que os metadados (counselor, scope, docType) estão corretos.

---
*NETECMT v2.0 | Governança de Inteligência de Tráfego*
