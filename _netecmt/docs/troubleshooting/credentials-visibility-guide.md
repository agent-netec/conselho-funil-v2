# 🗝️ Governança de Credenciais: Pinecone & Google AI (Resolução ST-11.1)

Este documento registra a resolução dos problemas de visibilidade e autenticação enfrentados durante a ingestão massiva da Sprint 11. Destinado ao agente **Monara (Integrator)** e futuras manutenções de infraestrutura.

## 1. Pinecone: O Caso da Chave Invisível
**Problema:** O sistema reportava `PINECONE_API_KEY ausente`, mesmo com o arquivo `.env.local` presente no diretório `app/`.

**Causas Identificadas:**
- **Encoding de Arquivo:** O arquivo estava salvo em `UTF-16 LE` (padrão de alguns comandos PowerShell no Windows), o que inseria um Byte Order Mark (BOM) ou caracteres nulos que impediam o Node.js de parsear as chaves corretamente.
- **Configuração de Host:** A chave anterior foi rejeitada porque o `PINECONE_HOST` no `.env` não correspondia ao Host atual do índice `cf-dev-assets`.

**Solução Aplicada:**
- **Nova Key Gerada:** `pcsk_2Ci27k_2NGxiWpAgypo8xk27U2ENsTP7VZdH1z5c5FCJcXkZRr8nrDuJqbB6iiRZi2euzz`.
- **Sanitização:** O arquivo foi convertido para **UTF-8 (sem BOM)**.
- **Host Corrigido:** O Host oficial para o índice é `cf-dev-assets-spcz5yx.svc.aped-4627-b74a.pinecone.io`.

## 2. Google AI: Bypass do SDK e Modelo Atual
**Problema:** Erro persistente de `API_KEY_INVALID` via SDK `@google/generative-ai`.

**Causas Identificadas:**
- **Depreciação:** Modelos `text-embedding-004` e `embedding-001` apresentaram falhas de autorização via SDK em chaves recentes.
- **Bloqueio de SDK:** O SDK oficial envia metadados de cabeçalho que causavam conflito com os limites de Tier do projeto.

**Solução Aplicada:**
- **Migração de Modelo:** Agora utilizamos exclusivamente o **`gemini-embedding-001`**.
- **Chamada Direta (HTTP Fetch):** Abandonamos o SDK para a função de embeddings. O arquivo `app/src/lib/ai/embeddings.ts` agora faz uma chamada `POST` direta para o endpoint da Google, o que resolveu 100% dos erros de autenticação.
- **Nova Key Validada:** `AIzaSyA8I2HfVxfy_gP_3D7dRDgtTHQB_y085EY`.

## 3. Guia para a Monara (Integrator)
Sempre que precisar atualizar ou validar credenciais:
1. **Validar via Curl:** Antes de assumir que o código está quebrado, rode um curl direto (passando a key no header `x-goog-api-key`).
2. **Forçar UTF-8:** Ao criar ou editar o `.env.local`, use `Set-Content -Encoding UTF8` ou salve via VSCode garantindo o encoding correto.
3. **Reiniciar Servidor:** O Next.js e o `tsx` cacheiam variáveis de ambiente. Sempre rode `npm run dev` após mudar chaves.

---
*Registrado por Wilder (Analista) - 15/01/2026*
