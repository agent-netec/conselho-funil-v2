# 🧹 Relatório de Sanitização: Projeto CONSELHO DE FUNIL

Este relatório identifica os pontos de atrito, redundâncias e falhas estruturais que estão causando a "bagunça" e quebras na aplicação.

---

## 🛑 1. Conflitos Críticos e Redundâncias de Pastas

### 📂 Pastas de Metodologia Duplicadas
- **`.bmad/` (Raiz)**: Legado da versão anterior. Deve ser removida após garantir que nada essencial ficou para trás.
- **`app/.bmad/`**: Duplicidade interna. Causa confusão para a IA ao ler o contexto.
- **`app/sprints/`**: Provavelmente redundante ao novo fluxo `_netecmt/`.

### 📂 Pastas de "Lixo" / Temporárias
- **`Nova pasta/`**: Pasta sem nome definido na raiz.
- **`teste-regras/`**: Pasta de testes manuais que polui o workspace.
- **`APC_MIGRATION_PACK/` (Raiz e app)**: Pacotes de migração que já deveriam ter sido consolidados.

---

## 🛣️ 2. Auditoria de Rotas (Next.js)

### 🧩 Estrutura de Rotas Ativa
- A aplicação está configurada para usar `app/src/app`.
- **Conflito Detectado**: Existe uma pasta `app/[brandId]` na raiz da pasta `app`, mas a estrutura de marcas oficial parece estar em `app/src/app/brands/[id]`. 
- **Risco**: Ter arquivos de rotas fora da pasta `src` (quando `src` está habilitado) pode levar a comportamentos inesperados no build do Next.js.

### 🔗 Rotas API Suspeitas
As seguintes rotas na `app/src/app/api/` precisam de verificação:
- **`api/.bmad/`**: Rota fantasma de metodologia dentro da API. (CONFIRMADO: Crítico)
- **`api/ingest/`** e **`api/copy/`**: Parecem ser rotas de processos temporários que podem estar orfãs.
- **`api/brands/`**: Possível conflito com a lógica de `[brandId]` mapeada anteriormente.

---

## 📄 3. Fragmentação de Documentação

### 📝 Documentos Fora de Padrão
- **`docs/` (Raiz)**: Contém `prd.md`, `epics.md`, `user-stories.md`. 
- **`_netecmt/docs/`**: Documentação da metodologia.
- **Problema**: A IA se perde entre a documentação de "negócio" na raiz e a "técnica" na pasta `_netecmt`.
- **Solução**: Mover documentos de negócio para `_netecmt/solutioning/`.

---

## 🛠️ Plano de Ação Imediato (Proposto)
1. **Limpeza de Pastas**: Deletar `.bmad`, `Nova pasta`, `teste-regras`.
2. **Consolidação de Doc**: Unificar `docs/` dentro da nova estrutura `_netecmt`.
3. **Sincronização de Rotas**: Mover qualquer lógica útil de `app/[brandId]` para dentro de `app/src/app/brands/` e limpar a raiz da pasta `app`.
4. **Padronização de Env**: Manter apenas um `.env.example` e o `.env.local` ativo.

---
*Assinado: Wilder (Especialista em Sanitização NETECMT).*
