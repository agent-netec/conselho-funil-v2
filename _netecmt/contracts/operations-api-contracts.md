# Meta & Instagram API Contracts (Operations Wing) 🔌

**Lane:** Operations  
**Status:** 🟡 Active (Draft)  
**Versão:** 1.0.0

## 1. Meta Ads API (Dynamic Ads & Audiences)

### Endpoint: `POST /api/operations/meta/sync-audience`
Sincroniza segmentos de leads do Maestro com Custom Audiences da Meta.

**Payload:**
```json
{
  "brandId": "string",
  "audienceName": "string",
  "awarenessLevel": "UNAWARE | PROBLEM_AWARE | ...",
  "leadIds": ["string"]
}
```

### Endpoint: `POST /api/operations/meta/update-ad-creative`
Atualiza dinamicamente a copy ou imagem de um anúncio baseado no estágio do lead.

**Payload:**
```json
{
  "brandId": "string",
  "adId": "string",
  "creative": {
    "headline": "string",
    "body": "string",
    "image_url": "string"
  }
}
```

## 2. Instagram Graph API (Conversational Automation)

### Endpoint: `POST /api/operations/instagram/send-dm`
Envia DM personalizada via Maestro.

**Payload:**
```json
{
  "brandId": "string",
  "recipientId": "string",
  "text": "string",
  "context": {
    "intent": "string",
    "awarenessLevel": "string"
  }
}
```

### Webhook: `Instagram Webhook (messages, comments)`
O sistema deve processar o payload oficial da Meta e encaminhar para o `WebhookDispatcher`.

**Payload Esperado (Simplificado):**
```json
{
  "object": "instagram",
  "entry": [{
    "messaging": [{
      "sender": { "id": "string" },
      "message": { "text": "string" }
    }]
  }]
}
```
