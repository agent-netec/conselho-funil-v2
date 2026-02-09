# Webhook & Security Strategy (Ala de Operações) 🛡️

**Lane:** Infrastructure / Operations  
**Status:** 🟡 Active (Draft)  
**Versão:** 1.0.0

## 1. Webhook Strategy (Real-time Retargeting)

### Webhook Dispatcher
Centraliza o recebimento de eventos externos e os normaliza para o formato `SocialInteraction`.

**Fluxo:**
1. **Receiver**: Endpoint `/api/webhooks/[provider]` recebe o POST bruto.
2. **Validator**: Verifica assinatura (X-Hub-Signature) usando o `ClientSecret` do `MonaraTokenVault`.
3. **Normalizer**: Converte para `SocialInteraction`.
4. **Router**: Envia para o `Personalization Engine` (Maestro).

### Retry Policy
- **Backoff**: Exponencial (1m, 5m, 15m, 1h).
- **DLQ**: Eventos que falham são movidos para `brands/{brandId}/dead_letter_queue`. Retry manual via `POST /api/webhooks/retry` (S31). Max 3 retries, após isso status `abandoned`.

## 2. Security & Token Management (Agente Monara)

### Monara Token Vault (Firestore-backed)
Tokens são armazenados criptografados em `brands/{brandId}/secrets/tokens`.

**Estrutura de Segurança:**
- **Multi-tenant**: Acesso restrito via `brandId` no Firestore Rules.
- **Refresh Flow**: O Agente Monara monitora a expiração (`expires_at`) e executa o refresh proativamente 24h antes do vencimento.
- **Encryption**: Tokens sensíveis são criptografados em repouso (AES-256) antes de salvar no Firestore.

### Fluxo de Autorização (OAuth2)
1. Usuário inicia conexão na UI.
2. Redirect para Meta/Google.
3. Callback recebe o `code`.
4. **Monara** troca `code` por `long-lived access token`.
5. **Monara** salva no Vault com metadados de escopo.
