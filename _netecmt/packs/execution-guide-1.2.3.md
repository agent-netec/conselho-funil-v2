# 🎨 UI/UX Guide: US-1.2.3 - Contexto Ativo & Fontes Interativas

**Story:** US-1.2.3  
**Designers:** Beto / Victor  
**Context:** `app/src/components/chat/counselor-badges.tsx`

---

## 🎯 Objetivo
Melhorar a transparência do RAG transformando a lista estática de fontes em componentes interativos que permitem ao usuário ver EXATAMENTE o que a IA extraiu de cada documento.

## 📝 Tarefas de Design & Código

### 1. Refatoração do `SourcesList`
Atualmente, as fontes são apenas badges cinzas. Precisamos:
- Adicionar estados de `hover` e `click`.
- Usar um Popover (Radix UI) ou Tooltip avançado para exibir detalhes.

### 2. Componente `SourcePopover`
Ao clicar em uma fonte, deve abrir um popover contendo:
- **Nome do Arquivo**: Link para o asset original (se disponível).
- **Snippet de Conteúdo**: O texto real do chunk recuperado (limitar a ~300 caracteres).
- **Score de Relevância**: Exibir o `rerankScore` ou `similarity` de forma visual (ex: barra de progresso pequena).
- **Badges de Metadados**: Tipo do arquivo, conselheiro associado.

### 3. Ajustes na API `/api/chat` (Já feito ou em andamento)
A rota deve garantir que o objeto `sources` contenha:
```json
{
  "file": "...",
  "section": "...",
  "content": "...", // Snippet para a UI
  "similarity": 0.85,
  "rerankScore": 0.92
}
```

## 🚨 Critérios de Aceite
- [ ] O usuário consegue ver o conteúdo extraído sem sair da tela de chat.
- [ ] O design segue os tokens de design do sistema (zinc-900, emerald-500).
- [ ] Fontes da marca (`brand_assets`) têm um destaque visual sutil (ex: borda esmeralda).

---
**Leticia (SM):** Victor/Beto, o foco aqui é a **CONFIABILIDADE**. O usuário precisa sentir que o conselho não é "alucinação", mas sim baseado nos documentos que ele mesmo subiu.
