# 🛠️ Guia de Liberação: Campaign CLI (ST-11.20)

Este documento define os comandos e procedimentos para gestão administrativa de campanhas via linha de comando (CLI), focado no papel da **Monara (Integrator)**.

## 👤 Agente Responsável
- **Monara (Integrator)**

## 🚀 Comandos Administrativos (via cURL)

Como o sistema opera em ambiente multi-tenant, a gestão via CLI utiliza chamadas autenticadas para as rotas administrativas em `/api/admin/*`.

### 1. Verificar Status de Governança
Retorna o estado atual de todas as campanhas de um tenant.
```bash
curl -X GET "https://api.conselhodefunil.com/api/admin/campaign-status?tenantId=SEU_TENANT_ID" \
     -H "Authorization: Bearer $(firebase force-token)"
```

### 2. Forçar Sincronização de Métricas
Utilizado para debugar ou forçar a atualização de uma campanha específica sem aguardar o webhook.
```bash
curl -X POST "https://api.conselhodefunil.com/api/webhooks/ads-metrics" \
     -H "Content-Type: application/json" \
     -H "x-hub-signature-256: sha256=$(printf '{"campaign_id":"ID","clicks":0}' | openssl dgst -sha256 -hmac "$CAMPAIGN_WEBHOOK_SECRET" | sed 's/^.* //')" \
     -d '{
       "campaign_id": "CAMPAIGN_ID_AQUI",
       "clicks": 10,
       "impressions": 100,
       "spend": 5.0,
       "conversions": 1
     }'
```

### 3. Auditoria de Créditos
Verifica o saldo e o histórico de uso de um usuário.
```bash
curl -X GET "https://api.conselhodefunil.com/api/admin/user-credits?userId=USER_ID" \
     -H "Authorization: Bearer $(firebase force-token)"
```

## 🛡️ Segurança e Acesso
- **Admin Only**: Apenas usuários com a role `admin` no Firestore podem executar estes comandos.
- **HMAC Check**: O comando de sincronização de métricas exige o segredo do webhook configurado no ambiente local para gerar a assinatura correta.

## ⚠️ Regras de Uso
1. **Ambiente**: Sempre verifique se o comando está sendo executado contra o `localhost:3001` ou `production`.
2. **Tokens**: Tokens de ID do Firebase expiram em 1 hora. Use `firebase force-token` para renovar.

---
*NETECMT v2.0 | Governança e Automação de Infraestrutura*
