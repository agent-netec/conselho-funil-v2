# Story Pack: E20-2 (Ativação do Modo Design & Diretor de Design)

## 🎯 Objetivo
Habilitar o Modo Design no Chat, permitindo que o usuário interaja com o Diretor de Design para criar briefings visuais e prompts para o NanoBanana.

## 📝 User Stories
- **US-20.2**: Modo Design no Chat com acesso ao Design Brain.

## 🛠️ Contrato Técnico
### 1. Novo Prompt de Sistema
Criar `DESIGN_CHAT_SYSTEM_PROMPT` em `app/src/lib/ai/prompts/design.ts` baseado no template do Diretor de Design (`templates/designer/design_brain/agents/design_director_prompt.md`).

### 2. Extensão da API de Chat
- Atualizar `app/src/app/api/chat/route.ts`:
    - Adicionar `design` ao enum de `mode`.
    - Se `mode === 'design'`, usar `DESIGN_CHAT_SYSTEM_PROMPT`.
    - Configurar RAG para buscar chunks com `metadata.counselor: 'design_director'`.
    - Injetar contexto do `BrandKit` (cores, logoLock, estilo) no prompt se disponível.

### 3. UI: Seletor de Modo
- Adicionar ícone de Pincel/Paleta no seletor de modo do chat.
- Garantir que a troca de modo limpe/mude o contexto visual conforme necessário.

## 📋 Tasks para Amelia
1. [x] Criar arquivo de prompt `app/src/lib/ai/prompts/design.ts`.
2. [x] Atualizar `app/src/lib/ai/prompts/index.ts` para exportar o novo prompt.
3. [x] Modificar `app/src/app/api/chat/route.ts` para suportar o modo `design`.
4. [x] Atualizar o seletor de modo no frontend (`components/chat/chat-mode-selector.tsx`).
5. [x] Adicionar suporte ao contexto de `BrandKit` na construção do prompt (`buildBrandContext`).

## 🧪 Critérios de Aceite
- Usuário pode selecionar "Modo Design" no chat.
- Ao perguntar "Como fazer uma thumbnail?", a IA deve citar o Diretor de Design e usar as heurísticas ingeridas.
- Se a marca tiver BrandKit, a IA deve sugerir as cores primárias/secundárias e mencionar a Logo oficial.
- Resposta deve incluir o campo formatado para o NanoBanana.

