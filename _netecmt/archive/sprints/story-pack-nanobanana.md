# Story Pack: E20-3 (Integração NanoBanana para Geração Visual)

## 🎯 Objetivo
Integrar o NanoBanana ao chat para que os briefings gerados pelo Diretor de Design possam ser transformados em imagens reais com um clique.

## 📝 User Stories
- **US-20.3**: Geração de criativos via NanoBanana a partir do chat.

## 🛠️ Contrato Técnico
### 1. Detecção de Prompt
O Diretor de Design agora gera um bloco formatado:
`[NANOBANANA_PROMPT]: { ... JSON ou Texto ... }`
A UI deve detectar este padrão para habilitar o botão de ação.

### 2. API de Integração (Proxy)
Criar `app/src/app/api/design/generate/route.ts`:
- Recebe o prompt e configurações.
- Faz a chamada autenticada para o NanoBanana.
- Retorna a URL da imagem gerada e o ID do processo.

### 3. UI: Action Card
- Criar `components/chat/design-generation-card.tsx`.
- Este componente aparece abaixo da mensagem da IA quando um prompt for detectado.
- Exibe estados: `Idle` (Botão Gerar) -> `Generating` (Loader) -> `Success` (Preview da Imagem).

## 📋 Tasks para Amelia
1. [x] Criar a API Route `/api/design/generate` para proxy com o NanoBanana.
2. [x] Implementar o componente `DesignGenerationCard` com suporte a estados de loading.
3. [x] Atualizar `ChatMessage` para renderizar o `DesignGenerationCard` quando o padrão `[NANOBANANA_PROMPT]` for encontrado.
4. [x] Adicionar salvamento automático da imagem gerada como um `BrandAsset` (tipo: 'image') vinculado à marca e ao projeto atual.

## 🧪 Critérios de Aceite
- O botão "Gerar Criativo" aparece apenas em mensagens do Modo Design.
- Ao clicar, um loader é exibido enquanto o NanoBanana processa.
- A imagem resultante é exibida no chat e salva automaticamente na galeria da marca.

