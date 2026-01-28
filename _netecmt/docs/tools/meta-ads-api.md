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

1.  **Criação do App**:
    *   Acesse [developers.facebook.com](https://developers.facebook.com).
    *   Crie um app do tipo "Business" ou "Consumer" (dependendo do nível de acesso).
    *   Adicione o produto "Marketing API".

2.  **Geração do Token de Longa Duração**:
    *   Use o **Graph API Explorer** para gerar um token de curta duração com os scopes acima.
    *   Troque pelo token de longa duração (60 dias) ou utilize um **System User** no Business Manager para tokens permanentes (Recomendado para Produção).

3.  **Configuração de Webhooks (Opcional)**:
    *   Configurar endpoint para receber notificações de mudanças de status em campanhas.

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
*   **Rate Limiting**: A Meta API possui limites rígidos de requisição por app/conta. Implementar cache local para métricas de insights.
*   **Data Privacy**: Não extrair dados sensíveis de audiências (PII) a menos que explicitamente exigido e aprovado pelo DPO.

---
*NETECMT v2.0 | Integrações e Conectividade Estratégica*
