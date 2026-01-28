# 🔐 Technical Integration Brief: Campaign Engine (ST-11-B)

> **Target Agent:** Monara (Integrator)  
> **Responsibility:** Infrastructure, Security, and API Connectivity

## 1. Mapeamento de Variáveis de Ambiente (.env)
A Monara deve validar e configurar as seguintes chaves para habilitar o Ciclo de Ads (ST-11.16):
- `META_ADS_API_VERSION`: v18.0 ou superior.
- `META_ADS_ACCESS_TOKEN`: Token de acesso permanente do Business Manager.
- `GOOGLE_ADS_DEVELOPER_TOKEN`: Chave de desenvolvedor para o MCC.
- `CAMPAIGN_WEBHOOK_SECRET`: Chave para validação de assinatura de webhooks de entrada.

## 2. Lógica de Consumo de Créditos (FinOps)
Implementar ou revisar a lógica de decremento na `route.ts`:
- **Geração de Texto (Funil/Copy)**: 1 crédito.
- **Geração de Imagem (Design/NanoBanana)**: 5 créditos (Devido ao custo de processamento Gemini 2.0 Flash).
- **Análise de Dados (Feedback Loop)**: 2 créditos por análise multimodal.

## 3. Segurança de Dados (Manifesto de Campanha)
- **Encryption at Rest**: O `CampaignContext` no Firestore deve ser restrito a `auth.uid == request.resource.data.userId`.
- **Input Sanitization**: Toda entrada de prompts externos via API deve passar pelo filtro de segurança da Monara.

## 4. Documentação de Liberação (ST-11.20)
A Monara deve criar os arquivos em `_netecmt/docs/tools/`:
- `campaign-cli.md`: Guia de comandos para gerenciar campanhas via CLI.
- `ads-api-integration.md`: Guia de conexão e autenticação com as redes de tráfego.

## 5. Webhook Receivers
Configurar endpoint `/api/webhooks/ads-metrics` para receber:
- `campaign_id`
- `clicks`, `impressions`, `spend`, `conversions`
- Validação via `Hmac-SHA256`.
