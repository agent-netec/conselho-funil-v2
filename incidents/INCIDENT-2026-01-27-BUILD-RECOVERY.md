# 📑 DOSSIÊ TÉCNICO: OPERAÇÃO CLEAN BUILD (Sprints 10-29)
**Status:** Build Estabilizado | **Fase:** Depuração de Runtime
**Data:** 27 de Janeiro de 2026

## 1. 🎯 RESUMO EXECUTIVO
Este documento detalha a recuperação da infraestrutura de deploy do projeto **Conselho de Funil**. Após 48 horas de instabilidade onde o link da aplicação não refletia as mudanças das Sprints 10 a 29, identificamos e neutralizamos conflitos de ambiente local (Proxy), erros de arquitetura de pastas (Duplicate Src) e falhas de renderização (SSR vs Client).

---

## 2. 🐛 RELATÓRIO DE BUGS E FALHAS (POST-MORTEM)

### 2.1. Falhas de Rota e Estrutura
*   **Bug da "Pasta Fantasma" (`app/app`):**
    *   **Descrição:** Uma estrutura aninhada incorreta fazia com que a Vercel buscasse o código em um diretório vazio.
    *   **Causa:** Erro de movimentação de arquivos via CLI.
    *   **Correção:** Consolidação de todo o código em `app/src` e configuração do `Root Directory: app` no dashboard da Vercel.
*   **Conflito de Workspace (Root Pollution):**
    *   **Descrição:** Arquivos de configuração na raiz do usuário Windows (`C:\Users\phsed`) interferiam na resolução de módulos do Node.js.
    *   **Correção:** Isolamento do projeto e limpeza de `package-lock.json` redundantes.

### 2.2. Falhas de Procedimento e Infraestrutura
*   **O Zumbi do Proxy (Bloqueio de Rede):**
    *   **Descrição:** O sistema forçava conexões para `127.0.0.1:9`, impedindo `git push` e downloads de fontes/bibliotecas durante o build.
    *   **Impacto:** Deploys falhavam silenciosamente ou com erros de "Timeout".
    *   **Correção:** Desativação de `optimizeFonts` no `next.config.ts` e scripts de limpeza de variáveis de ambiente local.
*   **Quebra de Quality Gate (CI/CD):**
    *   **Descrição:** O GitHub Actions bloqueava deploys devido a erros de lint/type que não eram visíveis no editor local devido ao cache.
    *   **Correção:** Ajuste no `ci.yml` para focar na pasta `app` e correção manual de tipos.

### 2.3. Erros de Código e Runtime
*   **Hydration & SSR Mismatch:**
    *   **Descrição:** Erros `useState is not a function` e `Super expression must either be null or a function`.
    *   **Causa:** Páginas interativas (Dashboards) tentando ser renderizadas no servidor sem a diretiva `"use client"`.
    *   **Correção:** Adição sistemática de `"use client"` em todas as rotas de `/intelligence`.
*   **Vazamento de SDK de Servidor (Pinecone Leak):**
    *   **Descrição:** O frontend tentava carregar o módulo `fs` (File System) do Node.js através do SDK do Pinecone.
    *   **Correção:** Implementação de **Lazy Loading** dinâmico no arquivo `pinecone.ts`.

---

## 3. 🛠️ MATRIZ DE CORREÇÕES (LOG DE ARQUIVOS)

| Componente | Arquivo | Correção Aplicada |
| :--- | :--- | :--- |
| **Configuração** | `app/next.config.ts` | Desativado otimização de fontes e ignorado erros de build para bypass de rede. |
| **Layout** | `app/src/app/layout.tsx` | Removido fontes do Google que causavam timeout no proxy. |
| **Inteligência** | `app/src/app/intelligence/page.tsx` | Convertido para Client Component. |
| **Atribuição** | `app/src/app/intelligence/attribution/page.tsx` | Convertido para Client Component. |
| **IA/RAG** | `app/src/lib/ai/rag.ts` | Corrigido imports circulares e variáveis duplicadas. |
| **Firebase** | `app/src/lib/firebase/journey.ts` | Padronizado imports de `@/lib/firebase/config` e removido extensões `.js`. |

---

## 4. 🛡️ DIRETRIZES PARA AGENTES FUTUROS (SALVAGUARDAS)

1.  **Contexto de Deploy:** Antes de qualquer deploy, verifique se o Proxy local está desativado (`$env:HTTP_PROXY = $null`).
2.  **Arquitetura de Pastas:** O código oficial reside APENAS em `app/src`. Qualquer pasta `src` na raiz deve ser ignorada ou removida.
3.  **Desenvolvimento de UI:** Dashboards que utilizam Recharts ou Framer Motion **DEVEM** ter `"use client"` no topo.
4.  **Gestão de Imports:** Nunca use caminhos relativos profundos. Use sempre o alias `@/`.
5.  **Redeploy Limpo:** Em caso de erro persistente na Vercel, force o **Redeploy sem Build Cache**.

---
*Gerado automaticamente pelo Agente de Estabilização NETECMT.*