# 🎨 UI Spec: Central de Integrações (ST-9.4)

Este documento detalha a especificação visual e funcional da Central de Integrações, entregue pelos agentes Victor/Beto.

## 📝 Visão Geral
A Central de Integrações é o hub onde o usuário conecta ativos externos (Meta Ads, Google, WhatsApp) para alimentar o motor de RAG do Conselho com dados de performance reais.

## 🏗️ Estrutura da Tela
- **Path**: `/integrations`
- **Layout**: Grid responsivo de cards premium.
- **Componentes Base**: `Header`, `IntegrationCard`, `IntegrationConfigForm`.

## 💎 Design Tokens & Estilo
Seguindo a **Diretiva Victor** (Design Premium/Dark):
- **Cores**:
    - Accent: `emerald-500` (#10b981) para estados ativos e botões principais.
    - Surface: `zinc-900/40` com glassmorphism (`backdrop-blur`).
    - Border: `white/[0.04]` com hover para `emerald-500/30`.
- **Tipografia**: Geist Sans (Inter fallback).
- **Animações**: Framer Motion (`initial={{ opacity: 0, y: 20 }}`, `whileHover={{ y: -4 }}`).

## 🔄 Fluxo do Usuário
1. **Descoberta**: Usuário acessa via Sidebar (ícone `LayoutGrid`).
2. **Seleção**: Escolhe o card "Meta Ads".
3. **Configuração**: Clique em "Conectar" abre o formulário de configuração (Slide-in).
4. **Input**: Usuário insere `Ad Account ID` e `Access Token`.
5. **Validação**: Feedback visual de "Salvando..." (Loader) e "Conectado!" (Check).
6. **Estado Ativo**: Card exibe badge `Ativo` com `glow-dot` animado.

## 📊 Observabilidade & Estados
- **Conectado**: Badge `badge-success` + Pulse Dot verde.
- **Pendente**: Badge `badge-warning`.
- **Feedback de Ação**: Botões com estado de `loading` e transição para `success`.

## 📂 Arquivos Entregues
- **Tela**: `app/src/app/integrations/page.tsx`
- **Navegação**: Atualização em `lib/constants.ts` e `Sidebar.tsx`.

## 📎 Anexos de Chat (Funcionalidade Multimodal)

A partir da v2.1, o componente `ChatInputArea` suporta anexos diretos para enriquecer o contexto do Conselho em tempo real.

### 🏗️ Componente: `ChatInputArea.tsx`
- **Ícone**: Adicionado ícone `Paperclip` (Clipe) para trigger de upload.
- **Drag & Drop**: Área de drop ativa sobre todo o componente de input.
- **Previews**: Thumbnails dinâmicos para imagens e ícones representativos para PDFs.
- **Estados**: 
    - `uploading`: Barra de progresso visível.
    - `analyzing`: Estado de processamento via Gemini Vision.
    - `ready`: Checkmark verde indicando que o insight foi extraído.

### 🔄 Fluxo de Dados
1. **Upload**: O arquivo é enviado para o Firebase Storage em `brand-assets/{userId}/{brandId}/`.
2. **Registro**: Criado documento na coleção `brand_assets` com `source: "chat_attachment"` e `isApprovedForAI: true`.
3. **Análise**: O sistema dispara `analyzeMultimodalWithGemini` para gerar um insight estratégico imediato.
4. **Injeção**: Os insights são injetados como um bloco de contexto oculto no início da mensagem do usuário: `[CONTEXTO DE ANEXOS]: ...`.

### 🛡️ Governança
- **Auto-Aprovação**: Arquivos anexados no chat são considerados "uso imediato" e pulam a etapa de aprovação manual em Marcas > Assets.
- **Multimodalidade**: Utiliza o modelo `gemini-2.0-flash` para garantir latência mínima e alta precisão em OCR.

---
*Documentação gerada por Victor/Beto (UI/UX) - NETECMT v2.0*
