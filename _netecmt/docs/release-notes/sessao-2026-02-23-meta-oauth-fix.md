# Sessao 2026-02-23 — Meta OAuth Fix + Performance War Room

> **Data:** 23/02/2026
> **Commits:** `fda17bcf1`, `7bb6adb05`, `7ddd17bbe`
> **Contexto:** Integracoes Meta Ads nao retornavam dados. Token OAuth era aceito mas sem permissoes de ads.

---

## 1. O Que Estava Acontecendo

O fluxo de integracao com Meta Ads apresentava um comportamento enganador:

- OAuth completava **com sucesso** (usuario autorizava, token era salvo)
- Token era **valido** (Graph API respondia normalmente)
- Mas ao consultar campanhas/metricas, retornava **erro 403**: `Ad account owner has NOT grant ads_management or ads_read permission`
- O painel diagnostico mostrava: "0 Campanhas (90 dias)"

### Sintomas observados
- Permissoes `ads_read` e `ads_management` **NAO apareciam** no token, mesmo sendo solicitadas via `scope=`
- Token do Graph API Explorer **funcionava** (confundindo o diagnostico)
- `auth_type=rerequest` nao resolvia

---

## 2. Causa Raiz Descoberta

### O Meta tem DOIS produtos de login diferentes:

| Produto | Como funciona | Resultado com ads |
|---------|--------------|-------------------|
| **Facebook Login** (classico) | Usa `scope=` na URL | Silenciosamente **descarta** scopes de ads |
| **Facebook Login for Business** | Usa `config_id=` na URL | Permissoes controladas pelo dashboard |

**O nosso app usava `scope=ads_read,ads_management` na URL OAuth, que era silenciosamente ignorado pelo Meta.**

### 3 fatores combinados:

1. **Marketing API** precisava estar adicionado como produto no app Meta (ja estava, nao era o problema)
2. **Facebook Login for Business** precisava estar configurado (estava, mas faltava o `config_id`)
3. **config_id** precisava ser criado no dashboard e usado na URL OAuth (NAO existia)

### Por que o Graph API Explorer funcionava?
O Explorer usa o **app interno do Meta**, que tem todas as permissoes habilitadas automaticamente. Ele bypassa completamente as restricoes do app do desenvolvedor.

---

## 3. O Que Mudou no Codigo

### 3.1 OAuth URL — `config_id` em vez de `scope`

**Arquivo:** `app/src/app/integrations/page.tsx`

**Antes:**
```
https://www.facebook.com/v21.0/dialog/oauth
  ?client_id={APP_ID}
  &redirect_uri={REDIRECT}
  &scope=ads_read,ads_management,business_management,pages_read_engagement
  &state={BRAND_ID}
```

**Depois:**
```
https://www.facebook.com/v21.0/dialog/oauth
  ?client_id={APP_ID}
  &redirect_uri={REDIRECT}
  &config_id={CONFIG_ID}
  &response_type=code
  &state={BRAND_ID}
```

O codigo mantem fallback com `scope=` caso `config_id` nao esteja configurado.

### 3.2 API de App ID retorna config_id

**Arquivo:** `app/src/app/api/auth/meta/app-id/route.ts`

Agora retorna `{ appId, configId }` — o configId vem da env var `META_LOGIN_CONFIG_ID`.

### 3.3 Lookback de 90 dias para 365 dias

**Arquivo:** `app/src/lib/performance/fetch-and-cache.ts`

```typescript
// Antes
d.setDate(d.getDate() - 90);

// Depois
d.setDate(d.getDate() - 365);
```

Motivo: ao corrigir as permissoes, o diagnostico mostrou "0 campanhas em 90 dias" porque a conta de ads pode ter campanhas mais antigas. Ampliado para 1 ano para cobrir mais cenarios de teste.

### 3.4 Botao "Ver analise completa" conectado

**Arquivo:** `app/src/app/performance/page.tsx`

O botao "Ver analise completa" no card AI Strategic Insight estava sem `onClick`. Agora abre um Dialog com:
- **Resumo** (summary) da API de reporting
- **Insights** (lista) — observacoes estrategicas
- **Recomendacoes** (lista numerada) — acoes sugeridas

A API `/api/reporting/generate` ja retornava `{ summary, insights, recommendations, confidenceScore }` mas o frontend so usava `summary`.

---

## 4. Configuracao no Meta Developer Dashboard

### App: Integracoes Conselho de Funil
- **App ID:** 923566773582703
- **Status:** Published / Live
- **config_id criado:** 852718941151827

### Permissoes incluidas no config_id:
- ads_management
- ads_read
- business_management
- pages_show_list
- pages_read_engagement
- leads_retrieval
- instagram_basic
- instagram_manage_insights
- instagram_manage_comments
- instagram_content_publish
- pages_manage_metadata
- pages_manage_posts
- pages_manage_engagement
- pages_read_user_content
- public_profile
- email
- catalog_management
- commerce_manage

### Env var adicionada no Vercel:
```
META_LOGIN_CONFIG_ID=852718941151827
```

---

## 5. O Que NAO Funcionou (tentativas anteriores)

| Tentativa | Resultado | Por que nao resolveu |
|-----------|-----------|---------------------|
| `auth_type=rerequest` | Mesma tela, mesmas permissoes faltando | Re-mostrar nao adianta se config esta errada |
| Token do Graph API Explorer | Funciona mas expira em 1-2h | Usa app interno do Meta |
| Converter token para long-lived | Funciona por 60 dias | Temporario, nao e solucao |
| Token manual via UI | Funciona enquanto token valido | Workaround, nao solucao |
| Adicionar `read_insights` como scope extra | Pode quebrar o login | `ads_read` ja cobre insights |

---

## 6. Aprendizados para Futuras Integracoes

### 6.1 Meta OAuth: SEMPRE usar config_id
O parametro `scope=` na URL OAuth do Meta e **nao confiavel** para permissoes de ads. Sempre criar um `config_id` no dashboard e usar `config_id=` na URL.

### 6.2 Token do Explorer != Token real
Tokens gerados no Graph API Explorer funcionam porque usam o app interno do Meta. NAO servem como prova de que o OAuth do seu app funciona.

### 6.3 Facebook Login vs Facebook Login for Business
Sao produtos **diferentes**. Para apps que precisam de permissoes de Marketing API, usar **Facebook Login for Business** com config_id.

### 6.4 Erros silenciosos sao o padrao do Meta
O Meta NAO retorna erro quando ignora scopes. O OAuth completa normalmente, o token e valido, mas as permissoes nao estao la. O unico jeito de verificar e chamar `GET /me/permissions` com o token.

### 6.5 Verificar env vars no Vercel com printf
Nunca usar `echo` para adicionar env vars via CLI — trailing `\n` causa falhas silenciosas. Sempre `printf`.

### 6.6 Diagnostico no frontend e essencial
O painel diagnostico no War Room (token status, permissoes, campanhas, erros) foi crucial para identificar o problema. Manter e expandir para outros providers.

### 6.7 Lookback generoso para testes
90 dias pode ser muito curto para contas de ads inativas. Em fase de teste/debug, usar lookback de pelo menos 365 dias.

### 6.8 Dual-path no codigo
Manter fallback com `scope=` quando `config_id` nao esta configurado. Isso permite que o sistema funcione parcialmente mesmo sem a config ideal.

---

## 7. Resultado Final

**Antes da sessao:**
- OAuth completava mas token sem permissoes de ads
- War Room mostrava "0 campanhas"
- Botao "Ver analise completa" nao fazia nada

**Depois da sessao:**
- OAuth com config_id concede TODAS as permissoes (confirmado via diagnostico)
- War Room busca campanhas de 365 dias
- Dialog de analise completa funcional com insights + recomendacoes

### Permissoes confirmadas pos-fix:
- read_insights: **granted**
- pages_show_list: **granted**
- ads_management: **granted**
- ads_read: **granted**
- leads_retrieval: **granted**
- pages_read_engagement: **granted**
- public_profile: **granted**

---

## 8. Arquivos Modificados

| Arquivo | Mudanca |
|---------|---------|
| `app/src/app/integrations/page.tsx` | OAuth URL usa config_id (2 lugares: handleOAuth + handleCopyOAuthLink) |
| `app/src/app/api/auth/meta/app-id/route.ts` | Retorna configId da env var |
| `app/src/lib/performance/fetch-and-cache.ts` | Lookback 90 → 365 dias |
| `app/src/app/performance/page.tsx` | Dialog de analise completa + labels 365 dias |
| `_netecmt/docs/troubleshooting/meta-ads-oauth-permissions.md` | Doc de troubleshooting criado |
| `_netecmt/docs/tools/meta-ads-api.md` | Setup flow atualizado |
| `brain/oauth-setup-checklist.md` | config_id + checklist expandido |

---

## 9. Checklist para Proxima Integracao OAuth (qualquer provider)

- [ ] Verificar qual produto/variacao de login o provider exige (ex: "for Business" vs classico)
- [ ] Criar configuracao no dashboard do provider (nao confiar apenas em scopes na URL)
- [ ] Testar com token real do OAuth (NAO token de ferramentas de debug do provider)
- [ ] Verificar permissoes do token via API (ex: `GET /me/permissions`)
- [ ] Adicionar diagnostico no frontend (token status, permissoes, dados retornados)
- [ ] Usar `printf` ao adicionar env vars no Vercel
- [ ] Lookback generoso em fase de teste (365 dias)
- [ ] Documentar config IDs e permissoes selecionadas

---

---

## 10. BLOQUEIO: Convite de Testador Nao Chega (2026-02-24)

### Problema
Ao adicionar um usuario terceiro (Humberto G Elenes) como **Testador** no app Meta:
- Status ficou como **"Pendente"** no dashboard do admin
- O usuario NAO recebeu nenhuma notificacao (Facebook, email, developers.facebook.com)
- URL `developers.facebook.com/requests/` redireciona para pagina de busca (nao existe mais)
- Acessar a URL do app logado com a conta do usuario nao mostra o convite
- `facebook.com/settings?tab=applications` tambem nao mostra nada

### Tentativas que NAO funcionaram
1. Esperar notificacao no Facebook do usuario
2. `developers.facebook.com/requests/` — URL nao existe mais
3. `facebook.com/settings?tab=applications` — nao mostra convite
4. `facebook.com/notifications` — nada
5. Acessar URL do app diretamente logado como o usuario

### Contexto
- O usuario ja tem conta de desenvolvedor Meta (15+ apps proprios)
- O app esta em modo **Publicado** mas com **Standard Access** nas permissoes de ads
- Standard Access limita o uso a admins/devs/testers do app

### Alternativas a Investigar (TODO)
1. **Remover e re-adicionar** o testador para forcar reenvio
2. **Adicionar como Desenvolvedor** em vez de Testador (pode nao exigir aceite)
3. **Solicitar Advanced Access** via App Review (elimina necessidade de testers)
4. **Usar token manual** — usuario gera token no Graph API Explorer e cola na UI de integracoes
5. **System User Token** — gerar token permanente no Business Manager

### Impacto
Qualquer usuario terceiro que quiser conectar Meta Ads via OAuth precisa ser Testador enquanto o app estiver em Standard Access. Se o convite nao chega, o fluxo OAuth fica bloqueado para usuarios externos.

---

*Conselho de Funil — Release Notes / Sessao de Aprendizados*
*Atualizado: 2026-02-24*
