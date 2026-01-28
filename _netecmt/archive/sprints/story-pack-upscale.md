# Story Pack: E21-1 (Engine de Upscale de Imagens)

## 🎯 Objetivo
Implementar a funcionalidade de aumento de resolução (Upscale) para garantir que os criativos gerados tenham qualidade profissional para publicação.

## 📝 User Stories
- **US-21.1**: Upscale 2x/4x de imagens geradas ou enviadas.

## 🛠️ Contrato Técnico
### 1. API de Upscale
Criar `app/src/app/api/design/upscale/route.ts`:
- Recebe a `imageUrl` e o `factor` (2 ou 4).
- Dispara a chamada para o motor de upscale do NanoBanana.
- Retorna a nova URL da imagem em alta resolução.

### 2. UI: Componente de Ação
- Adicionar botão "✨ Upscale" no componente `DesignGenerationCard` (no chat).
- Adicionar botão "✨ Upscale" na visualização de imagens da galeria de Assets.
- Exibir overlay de processamento sobre a imagem enquanto o upscale acontece.

### 3. Persistência
- Ao concluir o upscale, o sistema deve atualizar o `BrandAsset` correspondente ou criar uma nova versão (ex: `nome_arquivo_upscaled.png`).
- Manter o vínculo com a marca e o projeto.

## 📋 Tasks para Amelia
1. [x] Criar a API Route `/api/design/upscale`.
2. [x] Adicionar lógica de upscale no componente de chat e na lista de assets da marca.
3. [x] Implementar feedback visual (loader de alta precisão) durante o processamento.
4. [x] Garantir que o botão de download aponte para a versão de maior resolução disponível.

## 🧪 Critérios de Aceite
- O usuário consegue disparar o upscale a partir do chat logo após a geração.
- O usuário consegue fazer upscale de qualquer imagem já salva na galeria da marca.
- A imagem final deve ter dimensões e nitidez significativamente superiores.
- O histórico de créditos do usuário deve ser atualizado (opcionalmente, upscale pode custar créditos extras).

