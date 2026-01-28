# 🏗️ Story: Ingestão Massiva de Legado (ST-11.1)

**Status:** 📦 Ready  
**Prioridade:** P0  
**Responsável:** Darllyson (Dev)

## 📝 Descrição
Executar a carga em lote de todos os ativos brutos identificados (Zips). Garantir a extração limpa e a inclusão de metadados de autor para citação.

## 🎯 Critérios de Aceite
- [ ] Extração e conversão de .doc/.pdf dos zips para Markdown.
- [ ] Script de Ingestão em Lote (bulk-load) via Worker v2.
- [ ] 100% dos documentos no Pinecone (Namespace: `knowledge-universal`).

## 🛡️ Contexto Permitido
- `app/src/lib/ai/worker.ts`
- `_netecmt/docs/brains/ingestion-inventory.md`
