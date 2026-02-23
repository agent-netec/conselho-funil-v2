# 🛠️ Guia de Liberação: Meta Ads API (E8)

Este documento descreve as chaves de API, permissões e configurações necessárias para a integração do **Conselho de Funil** com a Meta Ads API (Marketing API), permitindo a sincronização de campanhas, ativos e métricas de performance.

## 👤 Agente Responsável
- **Monara (Integrator)**

## 🔑 Credenciais Necessárias (Environment Variables)
As seguintes variáveis devem ser configuradas no ambiente de execução (ou `.env.local` para desenvolvimento):

| Variável | Descrição | Exemplo |
| :--- | :--- | :--- |
| `META_APP_ID` | ID do aplicativo criado no Meta for Developers. | `123456789012345` |
| `META_APP_SECRET` | Chave secreta do aplicativo. | `a1b2c3d4e5f6...` |
| `META_ACCESS_TOKEN` | Token de acesso de usuário de longa duração ou System User. | `EAAB...` |
| `META_AD_ACCOUNT_ID` | ID da conta de anúncios (com prefixo `act_`). | `act_987654321` |
| `META_API_VERSION` | Versão da Graph API a ser utilizada. | `v18.0` |

## 🛡️ Permissões e Scopes (Obrigatórios)
O Token de Acesso deve possuir os seguintes escopos aprovados no Meta App:

1.  **`ads_read`**: Para leitura de campanhas, conjuntos de anúncios e anúncios.
2.  **`ads_management`**: Para criação e edição de ativos (se necessário).
3.  **`read_insights`**: Para extração de métricas de performance (CPC, CTR, ROAS).
4.  **`business_management`**: Para acessar ativos vinculados ao Gerenciador de Negócios.

## 🚀 Fluxo de Configuração (Passo a Passo)

> **CRÍTICO:** Sem os passos 1-3 corretos, o OAuth retorna token SEM permissões de ads.
> O Meta silenciosamente descarta scopes não configurados. Ver [troubleshooting completo](../troubleshooting/meta-ads-oauth-permissions.md).

1.  **Criação do App**:
    *   Acesse [developers.facebook.com](https://developers.facebook.com).
    *   Crie um app do tipo **"Business"** (NÃO "Consumer" — tipo errado bloqueia Marketing API).
    *   Adicione o produto **"Marketing API"** (Add Product > Marketing API > Set Up).

2.  **Configuração do Login (Facebook Login for Business)**:
    *   Adicione o produto **"Facebook Login for Business"** (NÃO "Facebook Login" clássico).
    *   Crie uma **Configuration** com as permissões: `ads_management`, `ads_read`, `business_management`.
    *   Salve o **`config_id`** gerado — será usado na URL OAuth em vez do parâmetro `scope`.
    *   Configure os Redirect URIs em Facebook Login for Business > Settings.

3.  **URL OAuth correta**:
    ```
    https://www.facebook.com/dialog/oauth
      ?client_id={APP_ID}
      &redirect_uri={REDIRECT_URI}
      &config_id={CONFIG_ID}
      &response_type=code
    ```
    > `config_id` **substitui** o parâmetro `scope`. NÃO usar ambos.

4.  **Tokens para Produção**:
    *   **Recomendado:** System User Token via Business Manager (nunca expira).
    *   **Alternativa:** User Token de longa duração (60 dias, requer renovação).
    *   **NÃO usar:** Token do Graph API Explorer (expira em 1-2 horas).

5.  **Configuração de Webhooks (Opcional)**:
    *   Configurar endpoint para receber notificações de mudanças de status em campanhas.

### Variáveis de Ambiente Adicionais
| Variável | Descrição |
| :--- | :--- |
| `META_LOGIN_CONFIG_ID` | Config ID do Facebook Login for Business (substitui scope na URL OAuth) |

## 🛠️ Implementação Recomendada
Utilizar o SDK oficial para Node.js: `facebook-nodejs-business-sdk`.

```typescript
import { FacebookAdsApi, AdAccount, Campaign } from 'facebook-nodejs-business-sdk';

const accessToken = process.env.META_ACCESS_TOKEN;
const adAccountId = process.env.META_AD_ACCOUNT_ID;

FacebookAdsApi.init(accessToken);
const account = new AdAccount(adAccountId);

// Exemplo: Buscar campanhas ativas
const campaigns = await account.getCampaigns(
  [Campaign.Fields.name, Campaign.Fields.status],
  { limit: 10 }
);
```

## ⚠️ Regras de Segurança (Governança)
*   **Zero Hardcoding**: NUNCA insira chaves diretamente no código. Use o gerenciador de segredos do Vercel/Firebase.
*   **Rate Limiting**: A Meta API possui limites rígidos de requisição por app/conta. Implementar cache local para métricas de insights. Standard Access tem rate limiting severo — Advanced Access (requer App Review) tem limites normais.
*   **Data Privacy**: Não extrair dados sensíveis de audiências (PII) a menos que explicitamente exigido e aprovado pelo DPO.
*   **Development Mode**: Apenas usuários com roles no app (Admin/Developer/Tester) podem autenticar. Adicionar testers em App Roles > Roles.
*   **Troubleshooting**: Se o token não tem permissões de ads, ver [meta-ads-oauth-permissions.md](../troubleshooting/meta-ads-oauth-permissions.md).

---
*NETECMT v2.0 | Integrações e Conectividade Estratégica*
