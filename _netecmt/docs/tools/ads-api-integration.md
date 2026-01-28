# 🛠️ Guia de Liberação: Ads API Integration (ST-11.20)

Este guia descreve o processo de integração e sincronização de métricas de Ads para o **Conselho de Funil**, permitindo que a IA receba feedback real das campanhas.

## 👤 Agente Responsável
- **Monara (Integrator)**

## 🔑 Configuração de Ambiente (.env)

Para habilitar a integração, as seguintes chaves devem estar configuradas:

| Variável | Descrição | Exemplo |
| :--- | :--- | :--- |
| `META_ADS_ACCESS_TOKEN` | Token permanente do Business Manager (Meta). | `EAAB...` |
| `GOOGLE_ADS_DEVELOPER_TOKEN` | Token de desenvolvedor para acesso à Google Ads API. | `abc123...` |
| `CAMPAIGN_WEBHOOK_SECRET` | Chave secreta para validação de assinatura HMAC-SHA256. | `shhh_secret_key` |

## 📡 Webhook de Métricas

O endpoint oficial para recebimento de métricas é:
`POST /api/webhooks/ads-metrics`

### Segurança (HMAC Validation)
Todas as requisições devem incluir o cabeçalho `x-hub-signature-256`, contendo o digest HMAC-SHA256 do payload bruto (raw body) usando a `CAMPAIGN_WEBHOOK_SECRET`.

### Formato do Payload (JSON)
```json
{
  "campaign_id": "ID_DA_CAMPANHA_NO_FIRESTORE",
  "clicks": 150,
  "impressions": 5000,
  "spend": 45.50,
  "conversions": 12
}
```

## 🛡️ Governança de Dados
- **Rate Limiting**: Sincronizações recomendadas a cada 1 hora para evitar estouro de cota nas APIs nativas.
- **Sanitização**: Todos os valores numéricos são convertidos e validados no servidor antes de atualizar o `CampaignContext`.

---
*NETECMT v2.0 | Integrações e Conectividade Estratégica*
