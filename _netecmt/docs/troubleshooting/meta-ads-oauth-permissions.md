# Troubleshooting: Meta Ads OAuth — Permissões Não Concedidas

> **Criado:** 2026-02-23
> **Problema:** OAuth completa com sucesso mas token NÃO tem `ads_read`/`ads_management`
> **Erro:** `(#200) Ad account owner has NOT grant ads_management or ads_read permission`

---

## TL;DR

O Meta **silenciosamente descarta** scopes de ads no OAuth quando o app não tem a configuração correta. O token volta sem erro, mas sem as permissões. Não é um bug — é configuração incompleta no Meta Developer Dashboard.

---

## 1. Causa Raiz (3 Fatores Combinados)

### Fator 1: Produto "Marketing API" não adicionado ao app

Sem o produto "Marketing API" explicitamente adicionado no dashboard, as permissões `ads_read` e `ads_management` **não ficam disponíveis** via OAuth. O Meta simplesmente ignora esses scopes na request.

### Fator 2: "Facebook Login" clássico vs "Facebook Login for Business"

Existem **dois produtos de login diferentes** no Meta:

| Produto | Método | Comportamento com ads |
|---------|--------|----------------------|
| **Facebook Login** (clássico) | Usa `scope=` na URL | Pode silenciosamente descartar scopes de ads |
| **Facebook Login for Business** | Usa `config_id=` na URL | Permissões definidas no dashboard, mais confiável |

O "Facebook Login for Business" usa um `config_id` (gerado no dashboard) em vez do parâmetro `scope` na URL. As permissões são gerenciadas centralmente na configuração.

### Fator 3: Tipo do app

O app deve ser tipo **"Business"** (não "Consumer" ou "None"). Se o tipo estiver errado, funcionalidades de Marketing API ficam bloqueadas.

### Por que o Graph API Explorer funciona?

O Explorer gera tokens usando o **app interno do Meta**, que já tem todas as permissões e produtos habilitados. Ele bypassa completamente as restrições de product setup do *seu* app.

---

## 2. O Que Tentamos e NÃO Funcionou

| Tentativa | Resultado | Por que não resolveu |
|-----------|-----------|---------------------|
| `auth_type=rerequest` na URL OAuth | Mesma tela, mesmas permissões faltando | Re-mostrar a tela não ajuda se o app não tem a config correta |
| Gerar token no Graph API Explorer | Funciona, mas expira em 1-2h | Token do Explorer é short-lived e usa app interno do Meta |
| Converter para long-lived token (`fb_exchange_token`) | Funciona por 60 dias | Temporário — expira e precisa de renovação manual |
| Token manual via UI (endpoint `/api/integrations/meta/save-token`) | Funciona enquanto token válido | Workaround, não solução definitiva |

---

## 3. Solução Definitiva — Passo a Passo

### Passo 1: Verificar App Type

**URL:** `https://developers.facebook.com/apps/{APP_ID}/settings/basic/`

- Confirmar que "App Type" é **Business**
- Se não for, pode ser necessário criar novo app com tipo correto

### Passo 2: Adicionar produto "Marketing API"

**URL:** `https://developers.facebook.com/apps/{APP_ID}/add-product/`

- Procurar **"Marketing API"** na lista de produtos
- Clicar **"Set Up"**
- Uma nova seção aparece no sidebar

### Passo 3: Adicionar "Facebook Login for Business"

**URL:** `https://developers.facebook.com/apps/{APP_ID}/add-product/`

- Procurar **"Facebook Login for Business"** (NÃO "Facebook Login" clássico)
- Clicar **"Set Up"**

### Passo 4: Criar Configuration (gera o config_id)

**URL:** `https://developers.facebook.com/apps/{APP_ID}/fb-login-for-business/configurations/`

- Criar nova configuração
- Selecionar permissões:
  - `ads_management`
  - `ads_read`
  - `business_management`
  - `pages_show_list`
  - `instagram_basic` (se necessário)
  - `instagram_manage_insights` (se necessário)
- **Salvar o `config_id` gerado** — será usado no código

### Passo 5: Configurar OAuth Redirect URIs

**URL:** `https://developers.facebook.com/apps/{APP_ID}/fb-login-for-business/settings/`

- Adicionar: `https://SEU-DOMINIO/api/auth/meta/callback`
- Adicionar localhost para dev: `https://localhost:3001/api/auth/meta/callback`

### Passo 6: Atualizar o código OAuth

**Antes (não funciona para ads):**
```
https://www.facebook.com/dialog/oauth
  ?client_id={APP_ID}
  &redirect_uri={REDIRECT}
  &scope=ads_read,ads_management,read_insights
  &auth_type=rerequest
```

**Depois (correto):**
```
https://www.facebook.com/dialog/oauth
  ?client_id={APP_ID}
  &redirect_uri={REDIRECT}
  &config_id={CONFIG_ID}
  &response_type=code
```

> **IMPORTANTE:** `config_id` **substitui** o parâmetro `scope`. As permissões são gerenciadas na configuração do dashboard, não na URL.

### Passo 7: Adicionar env var do config_id

```bash
# No Vercel (usar printf, não echo — evita \n trailing)
printf 'SEU_CONFIG_ID' | vercel env add META_LOGIN_CONFIG_ID production
```

---

## 4. Tokens — Duração e Tipos

| Tipo | Duração | Renovável? | Uso recomendado |
|------|---------|------------|-----------------|
| Graph API Explorer (default) | **1-2 horas** | Não | Apenas testes rápidos |
| Short-lived (OAuth) | **1-2 horas** | Sim, via exchange | Nunca usar diretamente |
| Long-lived User Token | **60 dias** | Com interação do usuário | Dev/staging |
| **System User Token** | **Nunca expira** | N/A | **Produção** |

### Como gerar System User Token (permanente)

**URL:** `https://business.facebook.com/settings/system-users/`

1. Criar **System User** (tipo Admin ou Employee)
2. Clicar em **"Atribuir ativos"** → selecionar o app + ad accounts
3. Clicar em **"Gerar token"**
4. Selecionar permissões: `ads_management`, `ads_read`, `business_management`
5. Copiar o token — **este token não expira**

---

## 5. Níveis de Acesso (Standard vs Advanced)

| Nível | Quem pode usar | Rate Limits | Requer App Review? |
|-------|----------------|-------------|---------------------|
| **Standard Access** | Apenas suas próprias ad accounts + testers do app | Severo | Não |
| **Advanced Access** | Qualquer usuário | Normal | **Sim** |

### Em Development Mode

- Apenas usuários adicionados como Tester/Developer/Admin podem autenticar
- **URL para adicionar testers:** `https://developers.facebook.com/apps/{APP_ID}/roles/roles/`
- Standard Access funciona para suas próprias ad accounts

### Para ir para Live Mode (produção com clientes)

Requer:
1. Business Verification completa (documentos da empresa)
2. Privacy Policy URL configurada
3. App Review aprovado (vídeo walkthrough + descrição de uso)
4. Prazo típico: 3-5 dias úteis

---

## 6. Armadilhas Comuns

### 6.1 `read_insights` como scope separado pode quebrar o login
Não incluir `read_insights` separadamente — `ads_read` já cobre insights. Incluir ambos pode causar erro no login dialog.

### 6.2 Token do Explorer parece resolver mas expira rápido
O token gerado no Graph API Explorer dura 1-2 horas. Converter para long-lived (60 dias) ajuda, mas ainda é temporário.

### 6.3 `auth_type=rerequest` não resolve o problema
Este parâmetro apenas re-mostra a tela de permissões. Se as permissões não estão configuradas corretamente no app/config, re-mostrar não ajuda.

### 6.4 Business Verification ≠ App Review
São dois processos independentes. Business Verification é sobre a empresa. App Review é sobre o app. Ambos são necessários para Advanced Access.

### 6.5 Whitespace em env vars do Vercel
Usar `printf` (não `echo`) ao adicionar env vars via CLI. Trailing `\n` causa falha silenciosa. Ver [MEMORY.md](../../../brain/MEMORY.md) sobre o bug do CRON_SECRET.

---

## 7. Arquivos Relevantes no Código

| Arquivo | Função |
|---------|--------|
| `app/src/app/integrations/page.tsx` | UI de integrações + token manual |
| `app/src/app/api/auth/meta/callback/route.ts` | OAuth callback (troca code → token) |
| `app/src/app/api/integrations/meta/save-token/route.ts` | Salvar token manual |
| `app/src/lib/performance/fetch-and-cache.ts` | Fetch de dados Meta + cache 15min |
| `app/src/app/api/performance/metrics/route.ts` | API de métricas + diagnóstico |
| `app/src/app/performance/page.tsx` | War Room UI + painel diagnóstico |
| `app/src/lib/integrations/token-refresh.ts` | Auto-refresh de tokens |
| `app/src/lib/integrations/monara-token-vault.ts` | Vault AES-256 para tokens |

---

## 8. Cronologia do Debug (Fevereiro 2026)

| Data | Commit | Fix |
|------|--------|-----|
| ~18/02 | `6694f0c05` | Auth headers faltando + integration detection |
| ~19/02 | `6187aa4b0` | Force refresh no SYNC DATA |
| ~20/02 | `23a66c444` | Painel diagnóstico no War Room |
| ~21/02 | `9fbfb2ff5` | `auth_type=rerequest` no OAuth URL |
| ~22/02 | `e14188bfb` | Token manual + verificação de permissões |
| ~23/02 | (este doc) | Diagnóstico: problema é config do app Meta, não código |

---

## 9. Checklist de Verificação

Antes de reportar "Meta Ads não funciona", verificar:

- [ ] App Type é "Business" no Meta Dashboard?
- [ ] Produto "Marketing API" está adicionado?
- [ ] Usando "Facebook Login for Business" (não "Facebook Login")?
- [ ] `config_id` criado com as permissões corretas?
- [ ] OAuth URL usa `config_id` em vez de `scope`?
- [ ] Env var `META_LOGIN_CONFIG_ID` está no Vercel?
- [ ] Usuário está adicionado como Tester (se Development Mode)?
- [ ] Usuário é Admin da Ad Account?
- [ ] Token verificado no Access Token Debugger? (`https://developers.facebook.com/tools/debug/accesstoken/`)

---

## 10. Links de Referência

| Recurso | URL |
|---------|-----|
| Meta Developer Dashboard | `https://developers.facebook.com/apps/{APP_ID}/` |
| Adicionar Produtos | `https://developers.facebook.com/apps/{APP_ID}/add-product/` |
| App Settings (tipo) | `https://developers.facebook.com/apps/{APP_ID}/settings/basic/` |
| Login for Business Config | `https://developers.facebook.com/apps/{APP_ID}/fb-login-for-business/configurations/` |
| Redirect URIs | `https://developers.facebook.com/apps/{APP_ID}/fb-login-for-business/settings/` |
| Roles (testers) | `https://developers.facebook.com/apps/{APP_ID}/roles/roles/` |
| System Users (Business Manager) | `https://business.facebook.com/settings/system-users/` |
| Access Token Debugger | `https://developers.facebook.com/tools/debug/accesstoken/` |
| Graph API Explorer | `https://developers.facebook.com/tools/explorer/` |
| Marketing API Docs | `https://developers.facebook.com/docs/marketing-apis/get-started` |
| Login for Business Docs | `https://developers.facebook.com/docs/facebook-login/facebook-login-for-business` |
| System Users Docs | `https://developers.facebook.com/docs/marketing-api/system-users` |

---

*Conselho de Funil — Documentação de Troubleshooting*
*Atualizado: 2026-02-23*
