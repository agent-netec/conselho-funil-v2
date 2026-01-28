# 🧠 Lesson Learned: Estabilização de RAG e Embeddings (Google AI)

## 📌 Contexto
Durante a Sprint 11, a ingestão massiva de dados enfrentou falhas críticas de autenticação (`API_KEY_INVALID`) e conectividade com o Google Gemini, mesmo com chaves de API aparentemente válidas.

## 🔍 Causas Raiz Identificadas
1. **Sunset de Modelos:** O modelo `text-embedding-004` e o `embedding-001` legados apresentaram instabilidade severa via SDK oficial.
2. **Conflito de SDK:** O pacote `@google/generative-ai` gerava headers incompatíveis com chaves Tier 1 (Free/Recent), resultando em rejeição sistemática.
3. **Encoding de Ambiente (Windows):** O arquivo `.env.local` criado via PowerShell/Windows estava em `UTF-16 LE`, o que inseria caracteres invisíveis no início das chaves, invalidando-as para o Node.js.
4. **Precedência de Variáveis:** O Node.js `--env-file` mantinha chaves antigas em cache de processo, ignorando atualizações manuais no arquivo.

## 🛠️ Solução Definitiva (Padrão Ouro)
1. **Modelo:** Utilizar exclusivamente `gemini-embedding-001`.
2. **Método de Chamada:** Abandonar o SDK oficial para Embeddings e utilizar **Fetch/HTTP direto**. Isso garante resiliência e controle total dos headers.
3. **Sanitização de Arquivo:** Todo arquivo `.env.local` deve ser salvo em **UTF-8 (sem BOM)**.
4. **Tratamento de Dados:** Implementar fallback automático para strings vazias em campos opcionais (ex: `sourceUrl`) para evitar quebras no Firestore.

## 🛡️ Protocolo de Prevenção
- Sempre validar chaves novas via `curl` antes de integrá-las ao código.
- Reiniciar o servidor local (`npm run dev`) após qualquer alteração no `.env.local`.
- Consultar a `ListModels` da API antes de assumir disponibilidade de modelos regionais.

---
*Documentado por Wilder (Analista) - 15/01/2026*
